# Structure de l'Application Web

Cette application web est organisée en trois sections distinctes et isolées :

## 📁 Structure des Routes

```
app/
├── (admin)/          # Route group pour l'administration
│   ├── layout.tsx    # Layout spécifique admin avec navigation
│   ├── admin.css     # Styles spécifiques admin
│   └── admin/
│       ├── page.tsx              # Dashboard admin
│       ├── users/page.tsx        # Gestion des utilisateurs
│       ├── tutors/page.tsx       # Gestion des tuteurs
│       ├── students/page.tsx     # Gestion des étudiants
│       ├── sessions/page.tsx     # Gestion des sessions
│       ├── reports/page.tsx      # Rapports et statistiques
│       └── settings/page.tsx     # Paramètres de la plateforme
│
├── (tutor)/          # Route group pour les tuteurs
│   ├── layout.tsx    # Layout spécifique tuteur avec navigation
│   ├── tutor.css     # Styles spécifiques tuteur
│   └── tutor/
│       ├── page.tsx              # Dashboard tuteur
│       ├── sessions/page.tsx     # Sessions du tuteur
│       ├── students/page.tsx     # Étudiants du tuteur
│       ├── schedule/page.tsx     # Planning du tuteur
│       ├── earnings/page.tsx     # Revenus du tuteur
│       └── profile/page.tsx      # Profil du tuteur
│
└── (student)/        # Route group pour les étudiants
    ├── layout.tsx    # Layout spécifique étudiant avec navigation
    ├── student.css   # Styles spécifiques étudiant
    └── student/
        ├── page.tsx              # Dashboard étudiant
        ├── sessions/page.tsx     # Sessions de l'étudiant
        ├── tutors/page.tsx       # Tuteurs de l'étudiant
        ├── schedule/page.tsx     # Planning de l'étudiant
        ├── progress/page.tsx     # Progression de l'étudiant
        └── profile/page.tsx      # Profil de l'étudiant
```

## 🎨 Isolation des Sections

### Route Groups
Les parenthèses `(admin)`, `(tutor)`, `(student)` créent des **route groups** dans Next.js :
- Ils n'affectent pas l'URL (pas de `/admin/admin/users`, juste `/admin/users`)
- Permettent d'avoir des layouts différents pour chaque section
- Isolent complètement les styles et la logique de chaque section

### Layouts Dédiés
Chaque section a son propre layout avec :
- **Navigation latérale** spécifique
- **Styles CSS** isolés
- **Métadonnées** personnalisées
- **Couleurs thématiques** :
  - Admin : Noir (#1a1a1a)
  - Tuteur : Bleu (#2563eb)
  - Étudiant : Vert (#10b981)

## 🚀 URLs d'Accès

### Administration
- `/admin` - Dashboard
- `/admin/users` - Gestion des utilisateurs
- `/admin/tutors` - Gestion des tuteurs
- `/admin/students` - Gestion des étudiants
- `/admin/sessions` - Gestion des sessions
- `/admin/reports` - Rapports et statistiques
- `/admin/settings` - Paramètres

### Tuteur
- `/tutor` - Dashboard
- `/tutor/sessions` - Mes sessions
- `/tutor/students` - Mes étudiants
- `/tutor/schedule` - Mon planning
- `/tutor/earnings` - Mes revenus
- `/tutor/profile` - Mon profil

### Étudiant
- `/student` - Dashboard
- `/student/sessions` - Mes sessions
- `/student/tutors` - Mes tuteurs
- `/student/schedule` - Mon planning
- `/student/progress` - Ma progression
- `/student/profile` - Mon profil

## 🔐 Prochaines Étapes

1. **Authentification** : Ajouter un système d'auth pour protéger les routes
2. **Middleware** : Créer un middleware pour vérifier les rôles et rediriger
3. **API Integration** : Connecter avec l'API backend
4. **Composants partagés** : Créer des composants réutilisables dans `@repo/ui`
5. **State Management** : Ajouter un système de gestion d'état (Context API, Zustand, etc.)

## 📝 Notes Techniques

- **Next.js 16** avec App Router
- **TypeScript** pour la sécurité des types
- **CSS Modules** pour l'isolation des styles
- **Responsive Design** prêt à être implémenté
- **SSR/SSG** compatible pour de meilleures performances
