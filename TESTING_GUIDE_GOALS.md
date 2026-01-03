# Guide de Test : Objectifs et Suivi des Progrès

## 🎯 Objectif

Ce guide vous permet de tester manuellement toutes les fonctionnalités d'objectifs et de suivi des progrès implémentées dans l'application Genova.

## 📋 Prérequis

### Backend
```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Mobile
```bash
cd apps/mobile
npm install
npm start
```

### Compte de Test
- Créer un compte étudiant ou utiliser un compte existant
- Se connecter à l'application mobile

## 🧪 Scénarios de Test

### 1. Création d'un Objectif

#### Étapes
1. Ouvrir l'application mobile
2. Naviguer vers "Progrès" depuis l'écran d'accueil
3. Cliquer sur "Mes objectifs"
4. Cliquer sur "Définir un objectif"
5. Remplir le formulaire :
   - **Matière** : "Mathématiques"
   - **Titre** : "Atteindre 15/20 au prochain contrôle"
   - **Description** : "Améliorer ma compréhension des équations du second degré"
   - **Score cible** : "75"
   - **Date limite** : Sélectionner une date dans 30 jours
6. Vérifier l'aperçu en temps réel
7. Cliquer sur "Créer l'objectif"

#### Résultats Attendus
- ✅ Message de succès affiché
- ✅ Retour à la liste des objectifs
- ✅ Nouvel objectif visible dans la liste
- ✅ Statistiques mises à jour (Total +1, Actifs +1)
- ✅ Barre de progression à 0%

#### Tests de Validation
- ❌ Essayer de créer sans matière → Message d'erreur
- ❌ Essayer de créer sans titre → Message d'erreur
- ❌ Score cible > 100 → Message d'erreur
- ❌ Score cible < 0 → Message d'erreur
- ❌ Date limite dans le passé → Message d'erreur

---

### 2. Ajout d'un Résultat Académique

#### Étapes
1. Depuis l'écran "Ma Progression"
2. Cliquer sur "Ajouter un résultat"
3. Remplir le formulaire :
   - **Matière** : "Mathématiques" (même que l'objectif)
   - **Nom de l'examen** : "Contrôle Chapitre 5"
   - **Note obtenue** : "14"
   - **Note maximale** : "20"
   - **Date de l'examen** : Aujourd'hui
4. Vérifier l'aperçu (70%)
5. Cliquer sur "Enregistrer"

#### Résultats Attendus
- ✅ Message de succès affiché
- ✅ Retour à l'écran de progression
- ✅ Résultat visible dans "Résultats récents"
- ✅ Objectif "Mathématiques" mis à jour automatiquement
- ✅ Barre de progression de l'objectif mise à jour
- ✅ Score actuel = 70% (ou moyenne si plusieurs résultats)

---

### 3. Consultation des Détails d'un Objectif

#### Étapes
1. Depuis "Mes objectifs"
2. Cliquer sur l'objectif "Mathématiques"
3. Observer les informations affichées

#### Résultats Attendus
- ✅ Titre et description affichés
- ✅ Cercle de progression avec pourcentage
- ✅ Barre de progression colorée
- ✅ Score actuel : 70%
- ✅ Score cible : 75%
- ✅ Reste à faire : 5%
- ✅ Date limite affichée
- ✅ Jours restants calculés
- ✅ Résultats récents listés (Contrôle Chapitre 5)
- ✅ Boutons "Modifier" et "Supprimer" visibles

---

### 4. Progression vers la Complétion

#### Étapes
1. Ajouter un deuxième résultat :
   - **Matière** : "Mathématiques"
   - **Nom** : "Contrôle Chapitre 6"
   - **Note** : "16/20" (80%)
2. Retourner aux détails de l'objectif

#### Résultats Attendus
- ✅ Score actuel mis à jour : 75% (moyenne de 70% et 80%)
- ✅ Barre de progression à 100% (75/75)
- ✅ Couleur de la barre = vert (objectif atteint)
- ✅ Deux résultats visibles dans la liste

---

### 5. Marquer un Objectif comme Complété

#### Étapes
1. Depuis la liste des objectifs
2. Trouver l'objectif "Mathématiques"
3. Cliquer sur "Marquer complété"
4. Confirmer dans la boîte de dialogue

#### Résultats Attendus
- ✅ Message de félicitations affiché
- ✅ Objectif marqué avec icône check verte
- ✅ Fond de la carte en vert clair
- ✅ Statistiques mises à jour :
  - Actifs -1
  - Complétés +1
  - Taux de réussite recalculé
- ✅ Boutons d'action masqués (plus de "Marquer complété")

---

### 6. Filtrage des Objectifs

#### Étapes
1. Créer plusieurs objectifs :
   - 2 objectifs actifs (Physique, Anglais)
   - 1 objectif complété (Mathématiques)
2. Tester les filtres :
   - Cliquer sur "Tous"
   - Cliquer sur "Actifs"
   - Cliquer sur "Complétés"

#### Résultats Attendus
- ✅ **Tous** : 3 objectifs affichés
- ✅ **Actifs** : 2 objectifs (Physique, Anglais)
- ✅ **Complétés** : 1 objectif (Mathématiques)
- ✅ Compteurs corrects dans les onglets

---

### 7. Objectif en Retard

#### Étapes
1. Créer un objectif avec date limite dans 2 jours
2. Attendre 3 jours (ou modifier manuellement en base)
3. Observer l'objectif

#### Résultats Attendus
- ✅ Icône alerte rouge
- ✅ Fond de la carte en rouge clair
- ✅ Texte "En retard de X jours"
- ✅ Barre de progression rouge
- ✅ Compteur "En retard" incrémenté dans les statistiques

---

### 8. Suppression d'un Objectif

#### Étapes
1. Depuis la liste des objectifs
2. Cliquer sur l'icône poubelle d'un objectif
3. Confirmer la suppression

#### Résultats Attendus
- ✅ Boîte de dialogue de confirmation
- ✅ Message de succès après confirmation
- ✅ Objectif retiré de la liste
- ✅ Statistiques mises à jour

---

### 9. Statistiques Globales

#### Étapes
1. Créer plusieurs objectifs avec différents états
2. Observer les statistiques en haut de l'écran

#### Résultats Attendus
- ✅ **Total** : Nombre total d'objectifs
- ✅ **En cours** : Objectifs actifs non en retard
- ✅ **Complétés** : Objectifs marqués comme complétés
- ✅ **En retard** : Objectifs dépassant la date limite
- ✅ **Taux de réussite** : (Complétés / Total) * 100%
- ✅ Barre de progression du taux de réussite

---

### 10. Rafraîchissement des Données

#### Étapes
1. Depuis n'importe quel écran avec liste
2. Tirer vers le bas (pull-to-refresh)

#### Résultats Attendus
- ✅ Indicateur de chargement affiché
- ✅ Données rechargées depuis l'API
- ✅ Liste mise à jour
- ✅ Indicateur de chargement masqué

---

## 🔍 Tests API (Postman/Insomnia)

### Configuration
- **Base URL** : `http://localhost:3000/api`
- **Headers** : `Authorization: Bearer <token>`

### Endpoints à Tester

#### 1. Créer un Objectif
```http
POST /goals
Content-Type: application/json

{
  "subject": "Mathématiques",
  "title": "Atteindre 15/20",
  "description": "Améliorer ma compréhension",
  "targetScore": 75,
  "deadline": "2026-02-01T00:00:00.000Z"
}
```

**Réponse attendue** : 201 Created
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "subject": "Mathématiques",
    "title": "Atteindre 15/20",
    "targetScore": 75,
    "currentScore": 0,
    "progressPercentage": 0,
    "daysRemaining": 30,
    "isOverdue": false,
    ...
  }
}
```

#### 2. Liste des Objectifs
```http
GET /goals
```

**Réponse attendue** : 200 OK
```json
{
  "success": true,
  "data": [...]
}
```

#### 3. Statistiques
```http
GET /goals/statistics
```

**Réponse attendue** : 200 OK
```json
{
  "success": true,
  "data": {
    "totalGoals": 3,
    "completedGoals": 1,
    "activeGoals": 2,
    "overdueGoals": 0,
    "completionRate": 33.33
  }
}
```

#### 4. Progression d'un Objectif
```http
GET /goals/:id/progress
```

**Réponse attendue** : 200 OK
```json
{
  "success": true,
  "data": {
    "goalId": "uuid",
    "goal": {...},
    "progressPercentage": 70,
    "daysRemaining": 25,
    "isOverdue": false,
    "recentResults": [...]
  }
}
```

#### 5. Modifier un Objectif
```http
PUT /goals/:id
Content-Type: application/json

{
  "currentScore": 75,
  "isCompleted": true
}
```

**Réponse attendue** : 200 OK

#### 6. Supprimer un Objectif
```http
DELETE /goals/:id
```

**Réponse attendue** : 200 OK

---

## 🐛 Tests de Cas Limites

### 1. Objectif avec Score Cible Atteint Immédiatement
- Créer un objectif avec targetScore = 50
- Ajouter un résultat avec 60%
- Vérifier que progressPercentage = 100%

### 2. Objectif avec Plusieurs Résultats
- Créer un objectif
- Ajouter 5 résultats différents
- Vérifier que currentScore = moyenne des 5 résultats

### 3. Objectif sans Résultats
- Créer un objectif
- Ne pas ajouter de résultats
- Vérifier que currentScore = 0 et progressPercentage = 0

### 4. Suppression d'un Résultat
- Créer un objectif
- Ajouter un résultat
- Supprimer le résultat
- Vérifier que l'objectif revient à 0%

### 5. Modification de la Date Limite
- Créer un objectif
- Modifier la date limite pour la rapprocher
- Vérifier que daysRemaining est recalculé

---

## ✅ Checklist de Validation

### Fonctionnalités
- [ ] Création d'objectif
- [ ] Modification d'objectif
- [ ] Suppression d'objectif
- [ ] Marquage comme complété
- [ ] Ajout de résultat académique
- [ ] Mise à jour automatique de la progression
- [ ] Calcul des statistiques
- [ ] Filtrage des objectifs
- [ ] Affichage des détails
- [ ] Rafraîchissement des données

### Validation
- [ ] Validation des champs requis
- [ ] Validation des plages de valeurs
- [ ] Validation des dates
- [ ] Messages d'erreur clairs
- [ ] Gestion des erreurs réseau

### UX
- [ ] Indicateurs de chargement
- [ ] Messages de succès
- [ ] Animations fluides
- [ ] Navigation intuitive
- [ ] Responsive design

### Performance
- [ ] Temps de chargement < 2s
- [ ] Pas de lag lors du scroll
- [ ] Rafraîchissement rapide
- [ ] Gestion de la mémoire

---

## 📊 Métriques de Succès

### Fonctionnelles
- ✅ 100% des fonctionnalités implémentées fonctionnent
- ✅ Tous les calculs sont corrects
- ✅ Toutes les validations sont en place

### Techniques
- ✅ Aucune erreur console
- ✅ Aucune fuite mémoire
- ✅ Code coverage > 80% (si tests unitaires)

### UX
- ✅ Temps de réponse < 2s
- ✅ Interface intuitive
- ✅ Messages clairs

---

## 🆘 Dépannage

### Problème : Objectif non mis à jour après ajout de résultat
**Solution** : Vérifier que la matière du résultat correspond exactement à celle de l'objectif

### Problème : Statistiques incorrectes
**Solution** : Rafraîchir les données ou vérifier les calculs backend

### Problème : Erreur 401 sur les requêtes API
**Solution** : Vérifier que le token d'authentification est valide

### Problème : Date limite non validée
**Solution** : Vérifier le fuseau horaire et la comparaison des dates

---

## 📝 Rapport de Test

Après avoir effectué tous les tests, remplir ce rapport :

### Résumé
- Date du test : ___________
- Testeur : ___________
- Version : ___________

### Résultats
- Tests réussis : ___ / ___
- Tests échoués : ___ / ___
- Bugs trouvés : ___

### Bugs Identifiés
1. ___________
2. ___________
3. ___________

### Recommandations
1. ___________
2. ___________
3. ___________

---

## 🎉 Conclusion

Ce guide couvre tous les aspects du système d'objectifs et de suivi des progrès. Assurez-vous de tester chaque scénario et de documenter tout comportement inattendu.

Pour toute question, consulter :
- `IMPLEMENTATION_GOALS_PROGRESS.md` : Documentation technique
- `apps/mobile/app/(student)/(tabs)/progress/README.md` : Documentation utilisateur
