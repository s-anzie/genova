# Guide de dépannage - Sessions et propositions de tuteurs

## Problème identifié

Les étudiants ne voient pas :
- Les propositions de tuteurs
- Les notifications
- Les sessions à venir

Même si un emploi du temps est configuré avec des créneaux qui approchent.

## Cause racine

Le système fonctionne en 3 étapes :

### 1. Configuration des créneaux (Time Slots)
- Les créneaux sont créés dans une classe
- Ils définissent : jour de la semaine, heure de début, heure de fin, matière
- **État actuel** : ✅ Configuré

### 2. Génération automatique des sessions
- Un cron job s'exécute **tous les jours à 2h du matin** (UTC)
- Il génère automatiquement les sessions pour les 4 prochaines semaines
- Les sessions sont créées à partir des créneaux configurés
- **État actuel** : ⚠️ Le cron job n'a peut-être pas encore tourné

### 3. Assignation des tuteurs aux créneaux
- Les tuteurs doivent être assignés aux créneaux via la page de détails du créneau
- Une fois assignés, le système applique automatiquement les patterns de récurrence
- Les sessions générées reçoivent automatiquement un tuteur selon le pattern
- **État actuel** : ❌ Aucun tuteur assigné aux créneaux

## Solution

### Option 1 : Attendre le cron job automatique (Production)
Le cron job s'exécutera automatiquement à 2h du matin et générera les sessions.

### Option 2 : Déclencher manuellement la génération (Développement/Test)

#### Via l'API (Administrateur uniquement)
```bash
POST /api/maintenance/generate-sessions
Authorization: Bearer <admin_token>
```

Réponse :
```json
{
  "success": true,
  "message": "Session generation completed",
  "data": {
    "classesProcessed": 5,
    "sessionsGenerated": 20,
    "errors": [],
    "duration": 1234
  }
}
```

#### Vérifier les statistiques
```bash
GET /api/maintenance/stats
Authorization: Bearer <admin_token>
```

Réponse :
```json
{
  "success": true,
  "data": {
    "activeClasses": 5,
    "classesWithTimeSlots": 3,
    "upcomingSessions": 20
  }
}
```

### Option 3 : Assigner des tuteurs aux créneaux

1. **Accéder à la page de détails du créneau**
   - Navigation : Classes → [Classe] → Créneaux → [Créneau]

2. **Cliquer sur "Ajouter" dans la section "Tuteurs affectés"**
   - Cela ouvre la page de recherche en mode assignation
   - ✅ Le bug de navigation a été corrigé

3. **Rechercher et sélectionner un tuteur**
   - Utiliser les filtres pour trouver un tuteur approprié
   - Cliquer sur "Assigner"

4. **Configurer le pattern de récurrence** (optionnel)
   - ROUND_ROBIN : Rotation entre les tuteurs
   - WEEKLY : Semaines spécifiques
   - CONSECUTIVE_DAYS : Jours consécutifs
   - MANUAL : Assignation manuelle

## Flux complet du système

```
1. Créneaux configurés (Time Slots)
   ↓
2. Cron job génère les sessions (2h du matin)
   ↓
3. Sessions créées avec statut PENDING
   ↓
4. Si tuteurs assignés aux créneaux :
   - Sessions reçoivent automatiquement un tuteur
   - Statut passe à CONFIRMED
   - Prix calculé automatiquement
   ↓
5. Étudiants voient :
   - Sessions à venir dans la page d'accueil
   - Sessions dans la page des sessions
   - Notifications de nouvelles sessions
```

## Vérifications à effectuer

### 1. Vérifier que les créneaux sont actifs
```sql
SELECT * FROM ClassTimeSlot WHERE isActive = true;
```

### 2. Vérifier que les sessions ont été générées
```sql
SELECT * FROM TutoringSession 
WHERE scheduledStart >= NOW() 
ORDER BY scheduledStart;
```

### 3. Vérifier les assignations de tuteurs
```sql
SELECT * FROM ClassTutorAssignment 
WHERE isActive = true AND status = 'ACCEPTED';
```

### 4. Vérifier les notifications
```sql
SELECT * FROM Notification 
WHERE type = 'SESSION_GENERATED' 
ORDER BY createdAt DESC;
```

## Comportement attendu après correction

### Page d'accueil (Student)
- **Section "Prochaines sessions"** : Affiche les 3 prochaines sessions confirmées
- **Section "Tuteurs suggérés"** : Affiche les tuteurs pour les sessions non assignées
- **Statistiques** : Nombre de sessions à venir, heures cette semaine, total

### Page des sessions
- **Onglet "À venir"** : Sessions futures avec statut CONFIRMED ou PENDING
- **Badge "URGENT"** : Sessions < 24h sans tuteur assigné
- **Badge "Tuteur non assigné"** : Sessions PENDING sans tuteur

### Notifications
- Notification lors de la génération de nouvelles sessions
- Notification lors de l'assignation d'un tuteur
- Notification 24h avant une session

## Notes importantes

1. **Le cron job ne génère que pour les 4 prochaines semaines**
   - Fenêtre glissante de 4 semaines
   - Exécution quotidienne pour maintenir la fenêtre

2. **Les sessions sans tuteur restent en statut PENDING**
   - Elles apparaissent dans la liste mais avec un badge spécial
   - Les étudiants peuvent voir des suggestions de tuteurs

3. **Le prix est calculé automatiquement**
   - Prix = Taux horaire × Durée × Nombre d'étudiants
   - Recalculé si le taux horaire du tuteur change

4. **Les patterns de récurrence sont appliqués automatiquement**
   - Lors de la génération des sessions
   - Selon la configuration de l'assignation du tuteur

## Correction appliquée

✅ **Bug de navigation corrigé** : Le bouton "Ajouter" dans la page de détails du créneau pointait vers un chemin inexistant `/(student)/(tabs)/search`. Il pointe maintenant correctement vers `/(student)/search`.

## Prochaines étapes recommandées

1. **Déclencher manuellement la génération de sessions** (pour tester)
2. **Assigner des tuteurs aux créneaux** (pour que les sessions soient confirmées)
3. **Vérifier que les étudiants voient les sessions** (dans l'app mobile)
4. **Vérifier les notifications** (doivent être créées automatiquement)
