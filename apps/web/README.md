# Application Web Genova

Application web Next.js professionnelle avec Tailwind CSS et design system Genova.

## 🚀 Démarrage rapide

```bash
# Installer les dépendances (depuis la racine du monorepo)
npm install

# Lancer le serveur de développement
npm run dev --workspace=web
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 🎨 Design System

### Couleurs Genova
- **Primary**: `#0d7377` (Genova Teal)
- **Secondary**: `#14FFEC` (Genova Cyan)
- **Accent Coral**: `#ff6b6b`
- **Accent Gold**: `#ffd93d`
- **Cream**: `#fef9f3`
- **Success**: `#4ade80`
- **Warning**: `#f59e0b`
- **Error**: `#ef4444`

### Composants UI
- **Button**: Variantes primary, secondary, outline, ghost, danger, success
- **Card**: Conteneur avec header, content, footer
- **Badge**: Indicateurs de statut
- **Input**: Champs de formulaire stylisés
- **Sidebar**: Navigation latérale avec variantes par rôle

## 📁 Structure

```
app/
├── (admin)/              # Section administration
│   ├── layout.tsx        # Layout avec sidebar noir
│   └── admin/
│       ├── page.tsx      # Dashboard
│       ├── users/        # Gestion utilisateurs
│       ├── tutors/       # Gestion tuteurs
│       ├── students/     # Gestion étudiants
│       ├── sessions/     # Gestion sessions
│       ├── reports/      # Rapports
│       └── settings/     # Paramètres
│
├── (tutor)/              # Section tuteur
│   ├── layout.tsx        # Layout avec sidebar bleu (primary)
│   └── tutor/
│       ├── page.tsx      # Dashboard
│       ├── sessions/     # Mes sessions
│       ├── students/     # Mes étudiants
│       ├── schedule/     # Mon planning
│       ├── earnings/     # Mes revenus
│       └── profile/      # Mon profil
│
├── (student)/            # Section étudiant
│   ├── layout.tsx        # Layout avec sidebar vert (success)
│   └── student/
│       ├── page.tsx      # Dashboard
│       ├── sessions/     # Mes sessions
│       ├── tutors/       # Mes tuteurs
│       ├── schedule/     # Mon planning
│       ├── progress/     # Ma progression
│       └── profile/      # Mon profil
│
├── layout.tsx            # Layout racine
├── page.tsx              # Page d'accueil
└── globals.css           # Styles Tailwind

components/
├── ui/                   # Composants UI de base
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   └── input.tsx
│
└── layout/               # Composants de layout
    ├── sidebar.tsx       # Navigation latérale
    ├── page-header.tsx   # En-tête de page
    ├── stats-card.tsx    # Carte de statistiques
    └── search-bar.tsx    # Barre de recherche

lib/
├── utils.ts              # Utilitaires (cn, formatters)
├── api.ts                # Client API
└── constants.ts          # Constantes

types/
└── index.ts              # Types TypeScript
```

## 🛠️ Technologies

- **Next.js 16** - App Router, Server Components
- **React 19** - Dernière version
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling utility-first
- **Lucide React** - Icônes
- **CVA** - Class Variance Authority pour les variantes
- **clsx + tailwind-merge** - Gestion des classes

## 🎯 Fonctionnalités

### ✅ Implémenté
- Architecture avec route groups isolés
- Design system Genova complet
- Composants UI réutilisables
- Layouts avec sidebar par rôle
- Pages dashboard pour chaque rôle
- Gestion utilisateurs (admin)
- Gestion sessions (admin)
- Rapports et statistiques (admin)
- Responsive design
- Type-safe avec TypeScript

### 🚧 À implémenter
- Authentification (NextAuth.js)
- Connexion API backend
- State management (Context API / Zustand)
- Formulaires avec validation (React Hook Form + Zod)
- Graphiques (Recharts / Chart.js)
- Tables de données avancées
- Upload de fichiers
- Notifications en temps réel
- Tests (Jest + React Testing Library)
- E2E tests (Playwright)

## 📝 Conventions

### Composants
- Utiliser `'use client'` uniquement si nécessaire
- Préférer les Server Components par défaut
- Exporter les types d'interface
- Utiliser `cn()` pour merger les classes Tailwind

### Styling
- Utiliser Tailwind CSS en priorité
- Classes utilitaires pour le responsive
- Variantes avec CVA pour les composants
- Couleurs du design system Genova

### Routes
- Route groups `(role)` pour isoler les sections
- Layouts dédiés par section
- Metadata SEO par page

## 🔐 Sécurité

Le middleware (`middleware.ts`) est prêt pour :
- Vérification d'authentification
- Contrôle des rôles utilisateur
- Redirections automatiques

## 🚀 Déploiement

```bash
# Build de production
npm run build --workspace=web

# Démarrer en production
npm run start --workspace=web
```

## 📚 Documentation

- [Next.js](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)
- [CVA](https://cva.style)
