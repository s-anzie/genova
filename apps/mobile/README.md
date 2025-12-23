# Genova Mobile App

Application mobile de tutorat pour connecter étudiants et tuteurs.

## 🚀 Démarrage Rapide

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer l'application
npm start
```

Scannez le QR code avec Expo Go (iOS/Android) ou lancez sur un émulateur.

### Commandes

```bash
npm start          # Démarrer Expo DevTools
npm run android    # Lancer sur Android
npm run ios        # Lancer sur iOS (Mac uniquement)
npm run check-types # Vérifier TypeScript
npm run lint       # Linter le code
npm test           # Lancer les tests
```

## 📱 Fonctionnalités Implémentées

### Authentification ✅
- Inscription (étudiant/tuteur)
- Connexion avec JWT
- Réinitialisation du mot de passe
- Configuration du profil en 2 étapes
- Authentification biométrique (optionnelle)

### Gestion du Profil ✅
- Affichage et modification du profil
- Upload d'avatar avec image picker
- Profils spécifiques étudiant/tuteur
- **Tuteurs**: Gestion des disponibilités hebdomadaires
- **Tuteurs**: Upload de documents de vérification

### Page d'Accueil ✅
- Tableau de bord personnalisé selon le rôle
- Statistiques (sessions, heures, classes)
- Actions rapides contextuelles
- Pull-to-refresh

## 📂 Structure

```
app/
├── (auth)/              # Authentification
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   └── profile-setup.tsx
├── (tabs)/              # Navigation principale
│   ├── index.tsx       # Page d'accueil
│   ├── explore.tsx     # Explorer
│   └── profile.tsx     # Profil
└── profile/            # Gestion du profil
    ├── edit.tsx
    ├── availability.tsx
    └── documents.tsx
```

## 🔧 Configuration

### API Backend

Par défaut, l'app se connecte à `http://localhost:5001/api`.

Pour tester sur un appareil physique, modifiez `utils/api.ts`:
```typescript
const API_BASE_URL = 'http://[VOTRE_IP]:5001/api';
```

### Variables d'Environnement

Créez un fichier `.env` si nécessaire:
```
API_URL=http://localhost:3000/api
```

## 🧪 Tests

```bash
npm test                    # Tous les tests
npm test -- profile.test    # Tests spécifiques
```

## 📖 Documentation Complète

Consultez [QUICK_START.md](./QUICK_START.md) pour:
- Guide détaillé de démarrage
- Flux d'authentification
- Résolution de problèmes
- Commandes avancées

Consultez [PROFILE_IMPLEMENTATION.md](./PROFILE_IMPLEMENTATION.md) pour:
- Détails de l'implémentation du profil
- Architecture technique
- API endpoints utilisés

## 🚧 Prochaines Fonctionnalités

- [ ] Recherche de tuteurs avec filtres
- [ ] Gestion des classes
- [ ] Réservation de sessions
- [ ] Intégration Stripe pour paiements
- [ ] Suivi de progression académique
- [ ] Système de gamification
- [ ] Marketplace de ressources
- [ ] Notifications push

## 🛠️ Technologies

- **React Native** 0.81.5
- **Expo** SDK 54
- **Expo Router** pour la navigation
- **TypeScript** pour le typage
- **Expo Secure Store** pour les tokens
- **Expo Image Picker** pour les uploads
- **Jest** pour les tests

## 📝 Notes de Développement

### Hot Reload
Le code se recharge automatiquement. Utilisez:
- `r` dans le terminal pour recharger
- `m` pour ouvrir le menu développeur
- Secouez l'appareil pour le menu

### Debugging
- Logs visibles dans le terminal Expo
- React DevTools disponible
- Expo DevTools dans le navigateur

### Problèmes Courants

**Cache issues:**
```bash
npx expo start -c
```

**Module resolution:**
```bash
rm -rf node_modules && npm install
```

## 📄 License

Propriétaire - Genova Platform

## 👥 Équipe

Développé pour la plateforme Genova de tutorat.
