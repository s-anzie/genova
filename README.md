# Genova - Plateforme Mobile de Tutorat

Plateforme mobile complète de mise en relation entre tuteurs et étudiants, construite avec React Native/Expo et Node.js.

## Structure du Projet

Ce monorepo Turborepo contient:

```
genova/
├── apps/
│   ├── api/              # Backend API (Node.js + Express + PostgreSQL)
│   ├── mobile/           # Application mobile (React Native + Expo)
│   ├── web/              # Application web (Next.js) - template
│   └── docs/             # Documentation (Next.js) - template
├── packages/
│   ├── utils/            # Utilitaires partagés (erreurs, logger, config)
│   ├── ui/               # Composants UI partagés - template
│   ├── eslint-config/    # Configuration ESLint partagée
│   └── typescript-config/# Configuration TypeScript partagée
└── specs/                # Spécifications du projet
```

## Prérequis

- Node.js >= 18
- npm >= 11
- PostgreSQL >= 14
- Redis (optionnel, pour le cache)
- Elasticsearch (optionnel, pour la recherche)

## Installation

```bash
# Installer toutes les dépendances
npm install
```

## Configuration

### Backend API

1. Copier le fichier d'environnement:
```bash
cp apps/api/.env.example apps/api/.env
```

2. Configurer les variables d'environnement dans `apps/api/.env`

3. Créer la base de données:
```bash
createdb genova_dev
```

4. Exécuter les migrations:
```bash
npm run migrate -w @repo/api
```

## Développement

### Lancer tous les projets

```bash
npm run dev
```

### Lancer un projet spécifique

```bash
# API backend
npm run dev -w @repo/api

# Application mobile
npm run dev -w @repo/mobile

# Package utils
npm run dev -w @repo/utils
```

## Tests

### Exécuter tous les tests

```bash
npm run test
```

### Tests basés sur les propriétés (Property-Based Testing)

```bash
npm run test:property
```

### Tests pour un workspace spécifique

```bash
npm run test -w @repo/api
npm run test -w @repo/utils
```

## Build

```bash
# Build tous les projets
npm run build

# Build un projet spécifique
npm run build -w @repo/api
```

## Linting et Formatage

```bash
# Linter tous les projets
npm run lint

# Vérifier les types TypeScript
npm run check-types

# Formater le code
npm run format
```

## Stack Technologique

### Backend
- Node.js avec Express
- PostgreSQL pour les données relationnelles
- Redis pour le cache
- Elasticsearch pour la recherche
- Stripe pour les paiements
- Firebase Cloud Messaging pour les notifications
- AWS S3 pour le stockage de fichiers

### Mobile
- React Native avec Expo
- Expo Router pour la navigation
- React Native Gesture Handler & Reanimated

### Partagé
- TypeScript
- Jest pour les tests unitaires
- fast-check pour les tests basés sur les propriétés
- ESLint + Prettier pour la qualité du code
- Turborepo pour la gestion du monorepo

## Schéma de Base de Données

Le schéma est défini dans `apps/api/src/database/schema.sql` et inclut:

- Utilisateurs et profils (étudiants, tuteurs)
- Classes et membres de classe
- Consortiums et membres de consortium
- Sessions de tutorat et présence
- Paiements et transactions
- Avis et évaluations
- Badges et réalisations
- Résultats académiques
- Produits marketplace
- Notifications

## Endpoints API

L'API suit les conventions RESTful:

- `/api/auth` - Authentification
- `/api/users` - Gestion des utilisateurs
- `/api/students` - Profils étudiants
- `/api/tutors` - Profils tuteurs et recherche
- `/api/classes` - Gestion des classes
- `/api/sessions` - Réservation et gestion des sessions
- `/api/payments` - Traitement des paiements
- `/api/consortiums` - Gestion des consortiums
- `/api/marketplace` - Ressources éducatives
- `/api/badges` - Gamification
- `/api/notifications` - Notifications

## Gestion des Erreurs

Toutes les erreurs suivent un format cohérent:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Message lisible",
    "details": {},
    "field": "nomDuChamp",
    "timestamp": "2025-12-20T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

Types d'erreurs:
- ValidationError (400)
- AuthenticationError (401)
- AuthorizationError (403)
- NotFoundError (404)
- ConflictError (409)
- PaymentError (402)
- ExternalServiceError (503)

## Stratégie de Test

### Tests Unitaires
- Testent les fonctions et composants individuels
- Mockent les dépendances externes
- Se concentrent sur la logique métier

### Tests Basés sur les Propriétés (PBT)
- Vérifient les propriétés universelles sur tous les inputs
- Utilisent fast-check pour la génération aléatoire
- Minimum 100 itérations par propriété
- Chaque propriété de correction du document de design a un test correspondant

### Tests d'Intégration
- Testent les endpoints API de bout en bout
- Testent les opérations de base de données
- Testent les interactions entre services

## Variables d'Environnement

Voir `apps/api/.env.example` pour les variables requises.

## Contribution

1. Créer une branche feature
2. Faire vos modifications
3. Exécuter les tests et le linting
4. Soumettre une pull request

## License

Privé - Tous droits réservés
