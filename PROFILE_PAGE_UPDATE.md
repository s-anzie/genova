# Mise à jour de la page de profil étudiant

## Modifications effectuées

### Page de profil (`apps/mobile/app/(student)/(tabs)/profile/index.tsx`)

**Avant:**
- Affichait des données codées en dur (EDUCATION_LEVELS statique)
- Utilisait `Alert.alert` pour les notifications
- Chargeait les données depuis deux endpoints séparés
- N'affichait pas les informations complètes du profil

**Après:**
- ✅ Charge les données depuis `/api/profiles/student/me` (un seul endpoint)
- ✅ Utilise `StyledModal` au lieu de `Alert.alert`
- ✅ Affiche toutes les informations du profil étudiant

## Nouvelles sections ajoutées

### 1. Section "Informations du profil"

#### Éducation
- **Pays**: Nom du pays (depuis `educationSystem.country.name`)
- **Système éducatif**: Nom du système (depuis `educationSystem.name`)
- **Niveau**: Nom du niveau (depuis `educationLevel.name`)
- **Filière**: Nom de la filière si applicable (depuis `educationStream.name`)
- **École**: Nom de l'école (depuis `schoolName`)

#### Matières préférées
- Affiche toutes les matières sélectionnées
- Format: Tags avec icône et nom de la matière
- Source: `preferredSubjects` → `levelSubject.subject`
- Affiche uniquement si des matières sont sélectionnées

#### Contact des parents
- **Email**: Email du parent/tuteur (depuis `parentEmail`)
- **Téléphone**: Téléphone du parent/tuteur (depuis `parentPhone`)
- Affiche uniquement si au moins une information est renseignée

#### Budget
- **Par heure**: Budget horaire en FCFA (depuis `budgetPerHour`)
- Formaté avec `formatEurAsFcfa()`
- Affiche uniquement si un budget est défini

## Structure des données

### Réponse de l'API `/api/profiles/student/me`

```typescript
{
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    isVerified: boolean;
    subscriptionType: string;
    walletBalance: number;
  };
  educationSystemId: string;
  educationSystem: {
    id: string;
    name: string;
    country: {
      code: string;
      name: string;
    };
  };
  educationLevelId: string;
  educationLevel: {
    id: string;
    name: string;
    hasStreams: boolean;
  };
  educationStreamId: string | null;
  educationStream: {
    id: string;
    name: string;
  } | null;
  schoolName: string;
  preferredSubjects: Array<{
    id: string;
    levelSubjectId: string;
    levelSubject: {
      id: string;
      subject: {
        id: string;
        name: string;
        icon: string | null;
      };
    };
  }>;
  parentEmail: string | null;
  parentPhone: string | null;
  budgetPerHour: number | null;
  onboardingCompleted: boolean;
}
```

## Composants utilisés

### Icônes (lucide-react-native)
- `GraduationCap` - Éducation, niveau
- `Globe` - Pays
- `BookOpen` - Système éducatif, matières
- `Award` - Filière
- `School` - École
- `Users` - Parents
- `Mail` - Email
- `Phone` - Téléphone
- `DollarSign` - Budget
- `Wallet` - Portefeuille
- `Crown` - Abonnement
- `Edit2` - Modifier
- `Settings` - Paramètres
- `LogOut` - Déconnexion

### Modales
- `StyledModal` - Pour les confirmations et erreurs
- `useModal` - Hook pour gérer les modales

## Styles ajoutés

### Info Cards
```typescript
infoCard: {
  backgroundColor: Colors.white,
  borderRadius: BorderRadius.large,
  padding: Spacing.lg,
  marginHorizontal: 20,
  marginBottom: 12,
  ...Shadows.small,
}
```

### Info Header
```typescript
infoHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
  paddingBottom: 12,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
}
```

### Info Rows
```typescript
infoRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
}
```

### Subject Tags
```typescript
subjectTag: {
  backgroundColor: Colors.primary + '15',
  borderWidth: 1,
  borderColor: Colors.primary + '30',
  borderRadius: 16,
  paddingVertical: 6,
  paddingHorizontal: 12,
}
```

## Affichage conditionnel

### Section Éducation
Toujours affichée si le profil existe

### Section Matières préférées
```typescript
{profileData.preferredSubjects && profileData.preferredSubjects.length > 0 && (
  // Afficher les matières
)}
```

### Section Parents
```typescript
{(profileData.parentEmail || profileData.parentPhone) && (
  // Afficher les informations des parents
)}
```

### Section Budget
```typescript
{profileData.budgetPerHour && (
  // Afficher le budget
)}
```

### Filière
```typescript
{profileData.educationStream && (
  // Afficher la filière
)}
```

## Gestion des erreurs

- Utilise `useModal` pour afficher les erreurs
- Messages d'erreur formatés: `error?.message || (typeof error === 'string' ? error : 'Message par défaut')`
- Pas de console.log en production

## Déconnexion

- Utilise `showConfirm` pour demander confirmation
- Modal avec deux boutons: "Annuler" et "Confirmer"
- Appelle `logout()` puis redirige vers `/login`

## Compatibilité

- ✅ Compatible avec les profils avec filières
- ✅ Compatible avec les profils sans filières
- ✅ Gère les champs optionnels (école, parents, budget)
- ✅ Affiche les icônes des matières si disponibles
- ✅ Formate correctement les montants en FCFA

## Tests recommandés

1. **Profil complet**:
   - Vérifier que toutes les sections s'affichent
   - Vérifier que les données sont correctes
   - Vérifier le formatage des montants

2. **Profil minimal**:
   - Vérifier que seules les sections avec données s'affichent
   - Vérifier qu'il n'y a pas d'erreurs pour les champs vides

3. **Profil avec filière**:
   - Vérifier que la filière s'affiche
   - Vérifier que les matières de la filière s'affichent

4. **Profil sans filière**:
   - Vérifier que la section filière ne s'affiche pas
   - Vérifier que les matières du niveau s'affichent

5. **Déconnexion**:
   - Vérifier que le modal de confirmation s'affiche
   - Vérifier la redirection après déconnexion

## Prochaines étapes

1. **Statistiques réelles**:
   - Remplacer les "0" par les vraies données
   - Charger le nombre de classes, sessions, badges

2. **Avatar upload**:
   - Implémenter l'upload réel de la photo de profil
   - Intégrer avec S3 ou un service de stockage

3. **Paramètres**:
   - Créer la page de paramètres
   - Notifications, langue, thème, etc.

4. **Badges et achievements**:
   - Système de badges basé sur les accomplissements
   - Afficher les badges réels au lieu de "New"
