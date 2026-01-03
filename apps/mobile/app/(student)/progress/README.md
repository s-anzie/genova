# Module de Suivi des Progrès et Objectifs

Ce module permet aux étudiants de suivre leurs progrès académiques et de définir des objectifs d'apprentissage.

## Fonctionnalités

### 1. Suivi des Progrès (`index.tsx`)
- **Statistiques globales** : Heures de tutorat, sessions à venir, amélioration globale
- **Progression par matière** : Moyenne, amélioration, tendance (amélioration/déclin/stable)
- **Filtrage par matière** : Affichage des progrès pour une matière spécifique
- **Résultats récents** : Liste des derniers résultats académiques
- **Graphiques de progression** : Visualisation de l'évolution des notes

### 2. Gestion des Objectifs (`goals.tsx`)
- **Liste des objectifs** : Affichage de tous les objectifs avec leur statut
- **Statistiques des objectifs** :
  - Total d'objectifs
  - Objectifs en cours
  - Objectifs complétés
  - Objectifs en retard
  - Taux de réussite
- **Filtrage** : Tous / Actifs / Complétés
- **Actions sur les objectifs** :
  - Marquer comme complété
  - Supprimer un objectif
  - Voir les détails

### 3. Création d'Objectif (`add-goal.tsx`)
- **Formulaire de création** :
  - Matière (requis)
  - Titre de l'objectif (requis)
  - Description (optionnel)
  - Score cible en % (requis, 0-100)
  - Date limite (requis, dans le futur)
- **Aperçu en temps réel** : Visualisation de l'objectif avant création
- **Validation** : Vérification des données avant soumission

### 4. Détails d'un Objectif (`goal-details.tsx`)
- **Informations complètes** :
  - Titre, matière, description
  - Statut (en cours / complété / en retard)
  - Progression en pourcentage
  - Score actuel vs score cible
  - Temps restant / dépassé
- **Résultats récents** : Liste des résultats liés à la matière de l'objectif
- **Actions** :
  - Modifier l'objectif
  - Supprimer l'objectif
  - Ajouter un résultat pour mettre à jour la progression

### 5. Ajout de Résultat Académique (`add-result.tsx`)
- **Formulaire d'ajout** :
  - Matière (requis)
  - Nom de l'examen (requis)
  - Note obtenue (requis)
  - Note maximale (requis)
  - Date de l'examen (requis, dans le passé)
- **Aperçu** : Visualisation du résultat avec pourcentage
- **Mise à jour automatique** : Les objectifs liés sont mis à jour automatiquement

## Architecture

### Hooks
- **`useGoals`** (`hooks/useGoals.ts`) : Gestion de l'état et des opérations sur les objectifs
  - Chargement des objectifs et statistiques
  - Création, modification, suppression d'objectifs
  - Marquage d'objectifs comme complétés
  - Récupération des détails de progression

- **`useProgress`** (existant) : Gestion du suivi des progrès académiques
  - Chargement du tableau de bord de progression
  - Ajout de résultats académiques
  - Calcul des statistiques et tendances

### Types API
Les types suivants sont définis dans `types/api.ts` :
- `LearningGoal` : Structure d'un objectif d'apprentissage
- `CreateLearningGoalData` : Données pour créer un objectif
- `UpdateLearningGoalData` : Données pour modifier un objectif
- `GoalProgress` : Progression détaillée d'un objectif
- `GoalStatistics` : Statistiques globales des objectifs
- `AcademicResult` : Résultat académique
- `ProgressDashboard` : Tableau de bord de progression

### Backend
Les endpoints API utilisés :
- `GET /goals` : Liste des objectifs
- `POST /goals` : Créer un objectif
- `GET /goals/:id` : Détails d'un objectif
- `PUT /goals/:id` : Modifier un objectif
- `DELETE /goals/:id` : Supprimer un objectif
- `GET /goals/:id/progress` : Progression d'un objectif
- `GET /goals/statistics` : Statistiques des objectifs
- `POST /progress/results` : Ajouter un résultat académique
- `GET /progress/dashboard` : Tableau de bord de progression

## Flux Utilisateur

### Créer un Objectif
1. Accéder à "Mes Objectifs" depuis l'écran de progression
2. Cliquer sur "Définir un objectif"
3. Remplir le formulaire (matière, titre, score cible, date limite)
4. Prévisualiser l'objectif
5. Créer l'objectif

### Suivre la Progression
1. Ajouter des résultats académiques via "Ajouter un résultat"
2. Les objectifs liés à la matière sont automatiquement mis à jour
3. Consulter les détails d'un objectif pour voir la progression
4. Marquer l'objectif comme complété quand le score cible est atteint

### Visualiser les Progrès
1. Accéder à l'écran "Ma Progression"
2. Voir les statistiques globales
3. Filtrer par matière
4. Consulter les graphiques de progression
5. Voir les résultats récents

## Améliorations Futures

### Fonctionnalités
- [ ] Notifications push pour les objectifs proches de l'échéance
- [ ] Suggestions d'objectifs basées sur les résultats
- [ ] Partage d'objectifs avec le tuteur
- [ ] Objectifs collaboratifs (groupe d'étude)
- [ ] Récompenses et badges pour objectifs atteints
- [ ] Historique des objectifs complétés
- [ ] Export des progrès en PDF

### Améliorations UX
- [ ] Animations de progression
- [ ] Graphiques interactifs
- [ ] Mode sombre
- [ ] Personnalisation des couleurs par matière
- [ ] Rappels configurables
- [ ] Widget de progression sur l'écran d'accueil

### Optimisations
- [ ] Cache local des objectifs
- [ ] Synchronisation hors ligne
- [ ] Chargement progressif des résultats
- [ ] Compression des images de graphiques

## Notes Techniques

### Calcul de la Progression
La progression d'un objectif est calculée automatiquement :
- `progressPercentage = (currentScore / targetScore) * 100`
- `currentScore` est mis à jour à chaque ajout de résultat pour la matière
- Le backend calcule la moyenne des résultats récents

### Gestion des Dates
- Les dates limites doivent être dans le futur lors de la création
- Un objectif est considéré "en retard" si la date limite est dépassée et qu'il n'est pas complété
- Le nombre de jours restants est calculé en temps réel

### Validation
- Score cible : 0-100%
- Date limite : dans le futur
- Matière et titre : obligatoires
- Les résultats académiques mettent à jour automatiquement les objectifs liés
