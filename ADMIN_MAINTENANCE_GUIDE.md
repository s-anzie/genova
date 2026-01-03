# Guide d'administration - Génération de sessions

## Résumé de l'exécution

### ✅ Étapes réalisées

1. **Création d'un utilisateur administrateur**
   - Email: `admin@genova.com`
   - Mot de passe: `Admin123!`
   - Rôle: ADMIN
   - ID: `1c42093a-65f9-435d-91c9-cbc9bd71645f`

2. **Authentification réussie**
   - Token JWT généré avec succès
   - Durée de validité: 15 minutes

3. **Génération de sessions déclenchée manuellement**
   - Endpoint: `POST /api/maintenance/generate-sessions`
   - Résultat:
     - Classes traitées: 1
     - Sessions générées: 24
     - Erreurs: 0
     - Durée: 55.4 secondes

4. **Vérification des statistiques**
   - Classes actives: 1
   - Classes avec créneaux: 1
   - Sessions à venir: 19

### 📊 État actuel des sessions

Les sessions ont été générées avec succès pour la classe "Science PC" :

```
Matière: Physique
Date: 03/01/2026 10:00:00
Statut: PENDING
Tuteur: Non assigné
Prix: 0 FCFA

Matière: Mathématiques
Date: 05/01/2026 16:00:00
Statut: PENDING
Tuteur: Non assigné
Prix: 0 FCFA

Matière: Chimie
Date: 06/01/2026 16:00:00
Statut: PENDING
Tuteur: Non assigné
Prix: 0 FCFA

... (21 autres sessions)
```

### ⚠️ Prochaine étape requise

**Les sessions sont en statut PENDING sans tuteur assigné.**

Pour que les étudiants voient des sessions confirmées avec des tuteurs :

1. **Assigner des tuteurs aux créneaux** via l'interface mobile :
   - Navigation: Classes → Science PC → Créneaux → [Sélectionner un créneau]
   - Cliquer sur "Ajouter" dans la section "Tuteurs affectés"
   - Rechercher et sélectionner un tuteur
   - Confirmer l'assignation

2. **Ou créer des assignations via l'API** :
   ```bash
   POST /api/classes/{classId}/time-slots/{timeSlotId}/assignments
   {
     "tutorId": "uuid-du-tuteur",
     "recurrencePattern": "ROUND_ROBIN",
     "recurrenceConfig": null
   }
   ```

3. **Relancer la génération de sessions** :
   - Les nouvelles sessions seront automatiquement assignées aux tuteurs
   - Le statut passera à CONFIRMED
   - Le prix sera calculé automatiquement

## Commandes utiles

### Créer un admin (si nécessaire)
```bash
cd apps/api
npx ts-node scripts/create-admin.ts
```

### Se connecter en tant qu'admin
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@genova.com",
    "password": "Admin123!"
  }'
```

### Déclencher la génération de sessions
```bash
curl -X POST http://localhost:5001/api/maintenance/generate-sessions \
  -H "Authorization: Bearer {TOKEN}" \
  | jq
```

### Vérifier les statistiques
```bash
curl -X GET http://localhost:5001/api/maintenance/stats \
  -H "Authorization: Bearer {TOKEN}" \
  | jq
```

### Vérifier les sessions dans la base de données
```bash
cd apps/api
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.tutoringSession.count({
    where: { scheduledStart: { gte: new Date() } }
  });
  console.log('Sessions à venir:', count);
  
  const pending = await prisma.tutoringSession.count({
    where: { 
      scheduledStart: { gte: new Date() },
      status: 'PENDING'
    }
  });
  console.log('Sessions PENDING:', pending);
  
  const confirmed = await prisma.tutoringSession.count({
    where: { 
      scheduledStart: { gte: new Date() },
      status: 'CONFIRMED'
    }
  });
  console.log('Sessions CONFIRMED:', confirmed);
  
  await prisma.\$disconnect();
}

check();
"
```

## Automatisation

Le système génère automatiquement les sessions tous les jours à **2h00 UTC** via un cron job.

Pour vérifier si le cron job est actif :
- Vérifier les logs du serveur au démarrage
- Chercher le message: "Daily session generation job scheduled (runs at 2 AM UTC)"

## Dépannage

### Les sessions ne sont pas visibles pour les étudiants

**Causes possibles :**
1. ✅ Sessions pas encore générées → **RÉSOLU** (24 sessions générées)
2. ❌ Aucun tuteur assigné aux créneaux → **À FAIRE**
3. L'étudiant n'est pas membre de la classe
4. Les créneaux sont désactivés

**Solution :**
- Assigner des tuteurs aux créneaux (voir section "Prochaine étape requise")

### Les tuteurs ne reçoivent pas de notifications

**Causes possibles :**
1. Le tuteur n'a pas accepté l'assignation au créneau
2. Les notifications sont désactivées
3. Le service de notifications n'est pas démarré

**Solution :**
- Vérifier le statut de l'assignation (doit être ACCEPTED)
- Vérifier les logs du service de notifications

## Notes importantes

1. **Fenêtre glissante de 4 semaines** : Le système maintient toujours 4 semaines de sessions à l'avance
2. **Prix calculé automatiquement** : Prix = Taux horaire × Durée × Nombre d'étudiants
3. **Patterns de récurrence** : Les tuteurs sont assignés selon le pattern configuré (ROUND_ROBIN, WEEKLY, etc.)
4. **Sessions sans tuteur** : Restent en PENDING et apparaissent avec un badge "Tuteur non assigné"
