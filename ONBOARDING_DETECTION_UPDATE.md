# Mise à jour de la détection de l'onboarding

## Modifications effectuées

### 1. Layout principal (`apps/mobile/app/_layout.tsx`)

**Ajout de la vérification du profil étudiant:**

```typescript
const [profileChecked, setProfileChecked] = useState(false);
const [needsOnboarding, setNeedsOnboarding] = useState(false);

// Check if student needs onboarding
useEffect(() => {
  const checkStudentProfile = async () => {
    if (!isAuthenticated || !user || user.role?.toUpperCase() !== 'STUDENT') {
      setProfileChecked(true);
      return;
    }

    try {
      const response = await apiClient.get('/profiles/student/me');
      const profile = response.data;
      
      // Check if profile exists and onboarding is completed
      if (!profile || !profile.onboardingCompleted) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }
    } catch (error) {
      // Profile doesn't exist or error occurred
      setNeedsOnboarding(true);
    } finally {
      setProfileChecked(true);
    }
  };

  if (isAuthenticated && user && !profileChecked) {
    checkStudentProfile();
  }
}, [isAuthenticated, user, profileChecked]);
```

**Logique de redirection mise à jour:**

- ✅ Vérifie si le profil existe via `/api/profiles/student/me`
- ✅ Vérifie si `onboardingCompleted` est `true`
- ✅ Redirige vers l'onboarding si:
  - Le profil n'existe pas
  - `onboardingCompleted` est `false` ou `null`
- ✅ Redirige vers la page d'accueil si:
  - Le profil existe ET `onboardingCompleted` est `true`

### 2. Page d'onboarding (`apps/mobile/app/(student)/onboarding.tsx`)

**Suppression de la vérification redondante:**

- ❌ Supprimé: `checkingProfile` state
- ❌ Supprimé: `useEffect` qui vérifiait le profil au chargement
- ❌ Supprimé: Écran de chargement "Vérification du profil..."
- ✅ Nettoyé: Duplications de code (hooks appelés deux fois)
- ✅ Nettoyé: Logs console inutiles

**Raison:** La vérification est maintenant faite dans le layout principal, donc pas besoin de la refaire dans l'onboarding.

### 3. Backend (`apps/api/src/services/profile.service.ts`)

**Marquage automatique de l'onboarding:**

- ✅ `onboardingCompleted: true` lors de la création du profil
- ✅ `onboardingCompleted: true` lors de la mise à jour du profil

## Flux de l'application

### Connexion d'un nouvel étudiant

1. **Login** → Authentification réussie
2. **Layout check** → Vérifie le profil via API
3. **Profil inexistant** → `needsOnboarding = true`
4. **Redirection** → `/(student)/onboarding`
5. **Onboarding** → L'étudiant remplit le formulaire
6. **Soumission** → Création du profil avec `onboardingCompleted: true`
7. **Success modal** → "Bienvenue! 🎉"
8. **Redirection** → `/(student)/(tabs)/home`

### Connexion d'un étudiant existant (onboarding incomplet)

1. **Login** → Authentification réussie
2. **Layout check** → Vérifie le profil via API
3. **Profil existe mais** → `onboardingCompleted = false`
4. **Redirection** → `/(student)/onboarding`
5. **Onboarding** → L'étudiant complète/met à jour son profil
6. **Soumission** → Mise à jour avec `onboardingCompleted: true`
7. **Success modal** → "Bienvenue! 🎉"
8. **Redirection** → `/(student)/(tabs)/home`

### Connexion d'un étudiant avec profil complet

1. **Login** → Authentification réussie
2. **Layout check** → Vérifie le profil via API
3. **Profil existe et** → `onboardingCompleted = true`
4. **Redirection directe** → `/(student)/(tabs)/home`

### Modification du profil

1. **Page profil** → `/(student)/(tabs)/profile/index.tsx`
2. **Clic "Modifier le profil"** → `/(student)/(tabs)/profile/edit.tsx`
3. **Modification** → Formulaire avec toutes les données
4. **Sauvegarde** → Mise à jour via `/api/profiles/student`
5. **Backend** → Marque automatiquement `onboardingCompleted: true`
6. **Success modal** → "Profil mis à jour avec succès"
7. **Retour** → Page profil

## Conditions de détection

### Étudiant a besoin de l'onboarding si:

```typescript
// Profil n'existe pas
!profile

// OU profil existe mais onboarding non complété
profile && !profile.onboardingCompleted
```

### Étudiant peut accéder à l'app si:

```typescript
// Profil existe ET onboarding complété
profile && profile.onboardingCompleted === true
```

## Points importants

1. **Une seule source de vérité**: Le layout principal gère la détection
2. **Pas de vérifications redondantes**: L'onboarding ne vérifie plus le profil
3. **Marquage automatique**: Le backend marque toujours `onboardingCompleted: true`
4. **Expérience fluide**: Pas de flash ou de redirections multiples
5. **Gestion des erreurs**: Si l'API échoue, on considère que l'onboarding est nécessaire

## Pages concernées

### Pages accessibles sans onboarding:
- `/(auth)/login` - Connexion
- `/(auth)/register` - Inscription
- `/(auth)/forgot-password` - Mot de passe oublié
- `/(student)/onboarding` - Onboarding

### Pages nécessitant l'onboarding complété:
- `/(student)/(tabs)/home` - Accueil
- `/(student)/(tabs)/tutors` - Recherche de tuteurs
- `/(student)/(tabs)/sessions` - Sessions
- `/(student)/(tabs)/progress` - Progression
- `/(student)/(tabs)/profile` - Profil
- `/(student)/(tabs)/profile/edit` - Modification du profil
- Toutes les autres pages de l'application

## Tests recommandés

1. **Nouvel utilisateur**:
   - Créer un compte
   - Vérifier la redirection vers l'onboarding
   - Compléter l'onboarding
   - Vérifier la redirection vers la page d'accueil
   - Se déconnecter et se reconnecter
   - Vérifier qu'on arrive directement sur la page d'accueil

2. **Utilisateur avec profil incomplet**:
   - Créer un profil avec `onboardingCompleted: false` en base
   - Se connecter
   - Vérifier la redirection vers l'onboarding
   - Compléter l'onboarding
   - Vérifier que `onboardingCompleted` est maintenant `true`

3. **Utilisateur avec profil complet**:
   - Se connecter avec un compte existant
   - Vérifier qu'on arrive directement sur la page d'accueil
   - Aller sur la page de profil
   - Modifier le profil
   - Vérifier que tout fonctionne correctement

4. **Modification du profil**:
   - Aller sur la page de modification du profil
   - Modifier des informations
   - Sauvegarder
   - Vérifier que les modifications sont bien enregistrées
   - Vérifier que `onboardingCompleted` reste `true`

## Dépendances

- `apps/mobile/utils/api-client.ts` - Client API
- `apps/mobile/contexts/auth-context.tsx` - Contexte d'authentification
- `apps/mobile/hooks/useEducation.ts` - Hooks pour les données d'éducation
- `apps/mobile/hooks/useModal.ts` - Hook pour les modales
- `apps/mobile/components/ui/StyledModal.tsx` - Composant modal

## Notes de déploiement

1. **Backend**: Redémarrer le serveur après compilation
2. **Mobile**: Recharger l'application (pas besoin de rebuild)
3. **Base de données**: Aucune migration nécessaire (le champ existe déjà)
4. **Tests**: Tester avec différents scénarios d'utilisateurs

## Problèmes potentiels et solutions

### Problème: Boucle de redirection
**Solution**: Le `profileChecked` state empêche les vérifications multiples

### Problème: Flash de l'écran d'onboarding
**Solution**: La vérification se fait avant le rendu, donc pas de flash

### Problème: Profil non trouvé (404)
**Solution**: L'erreur 404 est gérée et considérée comme "besoin d'onboarding"

### Problème: Token expiré pendant la vérification
**Solution**: Le système de refresh token gère automatiquement le renouvellement
