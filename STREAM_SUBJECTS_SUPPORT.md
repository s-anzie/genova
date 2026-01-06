# Support des matières de filière (Stream Subjects)

## Problème résolu

Les étudiants peuvent maintenant sélectionner des matières soit:
- **De leur niveau** (LevelSubjects) - pour les niveaux sans filières
- **De leur filière** (StreamSubjects) - pour les niveaux avec filières

## Modifications effectuées

### 1. Schéma Prisma (`apps/api/prisma/schema.prisma`)

#### Nouveau modèle: `StudentPreferredStreamSubject`

```prisma
model StudentPreferredStreamSubject {
  id               String   @id @default(uuid())
  studentProfileId String
  streamSubjectId  String
  createdAt        DateTime @default(now())

  studentProfile StudentProfile @relation(fields: [studentProfileId], references: [id], onDelete: Cascade)
  streamSubject  StreamSubject  @relation(fields: [streamSubjectId], references: [id], onDelete: Cascade)

  @@unique([studentProfileId, streamSubjectId])
  @@index([studentProfileId])
  @@index([streamSubjectId])
  @@map("student_preferred_stream_subjects")
}
```

#### Mise à jour du modèle `StudentProfile`

```prisma
model StudentProfile {
  // ...
  preferredLevelSubjects    StudentPreferredSubject[]      // Pour niveaux sans filières
  preferredStreamSubjects   StudentPreferredStreamSubject[] // Pour niveaux avec filières
  // ...
}
```

#### Mise à jour du modèle `StreamSubject`

```prisma
model StreamSubject {
  // ...
  studentPreferredStreamSubjects StudentPreferredStreamSubject[]
  // ...
}
```

### 2. Migration créée

**Fichier**: `20260106135509_add_student_preferred_stream_subjects`

Crée la table `student_preferred_stream_subjects` avec:
- Clé primaire `id`
- Clé étrangère vers `student_profiles`
- Clé étrangère vers `stream_subjects`
- Contrainte unique sur `(studentProfileId, streamSubjectId)`
- Index sur `studentProfileId` et `streamSubjectId`

### 3. Backend - Service Profile (`apps/api/src/services/profile.service.ts`)

#### Fonction `getStudentProfile` mise à jour

```typescript
export async function getStudentProfile(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      user: { /* ... */ },
      educationSystem: {
        include: { country: true },
      },
      educationLevel: true,
      educationStream: true,
      preferredLevelSubjects: {
        include: {
          levelSubject: {
            include: { subject: true },
          },
        },
      },
      preferredStreamSubjects: {
        include: {
          streamSubject: {
            include: { subject: true },
          },
        },
      },
    },
  });
  // ...
}
```

### 4. Mobile App - Layout (`apps/mobile/app/_layout.tsx`)

#### Vérification du profil mise à jour

```typescript
// Utilise la route existante avec l'ID utilisateur
const response = await apiClient.get(`/profiles/student/${user.id}`);
```

Avec logs de débogage pour tracer:
- Si le profil existe
- La valeur de `onboardingCompleted`
- Les erreurs éventuelles

### 5. Mobile App - Page de profil (`apps/mobile/app/(student)/(tabs)/profile/index.tsx`)

#### Affichage des deux types de matières

```typescript
{((profileData.preferredLevelSubjects && profileData.preferredLevelSubjects.length > 0) ||
  (profileData.preferredStreamSubjects && profileData.preferredStreamSubjects.length > 0)) && (
  <View style={styles.infoCard}>
    <View style={styles.infoHeader}>
      <BookOpen size={20} color={Colors.primary} strokeWidth={2} />
      <Text style={styles.infoTitle}>Matières préférées</Text>
    </View>
    <View style={styles.subjectsContainer}>
      {/* Level Subjects */}
      {profileData.preferredLevelSubjects?.map((ps: any) => (
        <View key={`level-${ps.id}`} style={styles.subjectTag}>
          <Text style={styles.subjectTagText}>
            {ps.levelSubject?.subject?.icon && `${ps.levelSubject.subject.icon} `}
            {ps.levelSubject?.subject?.name || 'Matière'}
          </Text>
        </View>
      ))}
      {/* Stream Subjects */}
      {profileData.preferredStreamSubjects?.map((ps: any) => (
        <View key={`stream-${ps.id}`} style={styles.subjectTag}>
          <Text style={styles.subjectTagText}>
            {ps.streamSubject?.subject?.icon && `${ps.streamSubject.subject.icon} `}
            {ps.streamSubject?.subject?.name || 'Matière'}
          </Text>
        </View>
      ))}
    </View>
  </View>
)}
```

## Structure des données

### Réponse API complète

```typescript
{
  id: string;
  userId: string;
  user: { /* ... */ };
  educationSystem: {
    id: string;
    name: string;
    country: {
      code: string;
      name: string;
    };
  };
  educationLevel: {
    id: string;
    name: string;
    hasStreams: boolean;
  };
  educationStream: {
    id: string;
    name: string;
  } | null;
  schoolName: string;
  
  // Matières de niveau (pour niveaux sans filières)
  preferredLevelSubjects: Array<{
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
  
  // Matières de filière (pour niveaux avec filières)
  preferredStreamSubjects: Array<{
    id: string;
    streamSubjectId: string;
    streamSubject: {
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

## Logique d'affichage

### Condition d'affichage de la section

```typescript
// Affiche la section si au moins un type de matière existe
(preferredLevelSubjects.length > 0 || preferredStreamSubjects.length > 0)
```

### Affichage des matières

1. **Matières de niveau** (`preferredLevelSubjects`)
   - Affichées pour les étudiants dont le niveau n'a pas de filières
   - Source: `levelSubject.subject`

2. **Matières de filière** (`preferredStreamSubjects`)
   - Affichées pour les étudiants dont le niveau a des filières
   - Source: `streamSubject.subject`

3. **Les deux peuvent coexister** (cas rare mais possible)
   - Un étudiant pourrait avoir les deux types
   - Les deux sont affichés dans la même section

## Cas d'usage

### Cas 1: Niveau sans filières (ex: Primaire)

```
Niveau: CE2
Filière: Aucune
Matières: preferredLevelSubjects
  - Mathématiques (LevelSubject)
  - Français (LevelSubject)
  - Sciences (LevelSubject)
```

### Cas 2: Niveau avec filières (ex: Terminale)

```
Niveau: Terminale
Filière: Scientifique (S)
Matières: preferredStreamSubjects
  - Mathématiques (StreamSubject de Terminale S)
  - Physique-Chimie (StreamSubject de Terminale S)
  - SVT (StreamSubject de Terminale S)
```

## Débogage

### Logs dans le layout

```
🔍 Checking student profile for user: <userId>
📋 Profile data: {
  exists: true,
  onboardingCompleted: true,
  userId: "<userId>"
}
✅ Onboarding completed, profile OK
```

### En cas d'erreur

```
⚠️ Error checking profile: <error message>
❌ Needs onboarding: <raison>
```

## Tests recommandés

1. **Étudiant avec niveau sans filières**
   - Créer un profil avec niveau primaire
   - Sélectionner des matières de niveau
   - Vérifier l'affichage dans le profil

2. **Étudiant avec niveau avec filières**
   - Créer un profil avec Terminale S
   - Sélectionner des matières de filière
   - Vérifier l'affichage dans le profil

3. **Vérification de l'onboarding**
   - Compléter l'onboarding
   - Se déconnecter et se reconnecter
   - Vérifier qu'on arrive sur la page d'accueil (pas l'onboarding)
   - Vérifier les logs dans la console

4. **Modification du profil**
   - Modifier les matières préférées
   - Sauvegarder
   - Vérifier que les changements sont persistés

## Notes importantes

- Les deux types de matières utilisent le même modèle `Subject` en base
- La différence est dans la relation: `LevelSubject` vs `StreamSubject`
- Un étudiant ne devrait normalement avoir qu'un seul type de matières préférées
- Le système supporte les deux pour plus de flexibilité

## Prochaines étapes

1. **Mettre à jour le service de création/mise à jour de profil**
   - Gérer la création de `StudentPreferredStreamSubject`
   - Supprimer les anciennes préférences lors de la mise à jour

2. **Mettre à jour l'onboarding**
   - Sauvegarder dans la bonne table selon le type de niveau

3. **Mettre à jour la page d'édition du profil**
   - Permettre la modification des matières préférées
   - Gérer le changement de niveau/filière
