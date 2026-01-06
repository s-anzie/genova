# Fix: Onboarding ne progresse pas

## Problème identifié

L'onboarding des étudiants et tuteurs ne fonctionne pas car il y a une **incompatibilité entre les données envoyées par le mobile et celles attendues par l'API**.

### Student Onboarding

**Ce que le mobile envoie:**
```typescript
{
  educationLevel: "6ème",  // ❌ String simple
  educationDetails: { system: "FRENCH", level: "6ème" },  // ❌ Objet JSON
  preferredSubjects: ["Mathématiques", "Physique"],  // ❌ Array de strings
  schoolName: "...",
  parentEmail: "...",
  budgetPerHour: 5000,
  onboardingCompleted: true
}
```

**Ce que l'API attend:**
```typescript
{
  educationSystemId: "uuid",  // ✅ ID du système éducatif
  educationLevelId: "uuid",   // ✅ ID du niveau
  educationStreamId: "uuid",  // ✅ ID de la filière (optionnel)
  preferredLevelSubjectIds: ["uuid1", "uuid2"],  // ✅ Array d'IDs de LevelSubject
  schoolName: "...",
  parentEmail: "...",
  budgetPerHour: 5000
}
```

### Tutor Onboarding

**Ce que le mobile envoie:**
```typescript
{
  bio: "...",
  experienceYears: 5,
  hourlyRate: 5000,
  subjects: ["Mathématiques", "Physique"],  // ❌ Array de strings
  educationLevels: ["Collège", "Lycée"],    // ❌ Array de strings
  languages: ["Français", "Anglais"],        // ❌ Array de strings
  teachingMode: "BOTH",
  serviceRadius: 10,
  diplomas: [],
  availability: {},
  onboardingCompleted: true
}
```

**Ce que l'API attend:**
```typescript
{
  bio: "...",
  experienceYears: 5,
  hourlyRate: 5000,
  teachingLevelSubjectIds: ["uuid1", "uuid2"],  // ✅ Array d'IDs de LevelSubject
  teachingLanguageIds: ["uuid1", "uuid2"],      // ✅ Array d'IDs de TeachingLanguage
  teachingMode: "BOTH",
  serviceRadius: 10,
  diplomas: []
}
```

---

## Solutions possibles

### Option 1: Adapter l'API pour accepter les anciens formats (TEMPORAIRE)

Créer une couche de compatibilité dans l'API qui convertit les anciens formats vers les nouveaux.

**Avantages:**
- ✅ Rapide à implémenter
- ✅ Pas besoin de modifier le mobile immédiatement
- ✅ Permet de tester le reste de l'application

**Inconvénients:**
- ❌ Code de compatibilité à maintenir
- ❌ Ne résout pas le problème à long terme
- ❌ Nécessite une migration ultérieure

### Option 2: Mettre à jour le mobile pour utiliser la nouvelle architecture (RECOMMANDÉ)

Modifier les écrans d'onboarding pour utiliser les nouveaux endpoints et la nouvelle structure.

**Avantages:**
- ✅ Solution propre et pérenne
- ✅ Utilise la nouvelle architecture dès le départ
- ✅ Pas de dette technique

**Inconvénients:**
- ❌ Plus long à implémenter
- ❌ Nécessite de créer les endpoints pour récupérer les données éducatives

---

## Solution recommandée: Option 1 + Option 2 progressive

### Phase 1: Fix immédiat (Adapter l'API)

Ajouter une couche de compatibilité dans l'API pour convertir les anciens formats.

### Phase 2: Migration progressive (Mettre à jour le mobile)

Créer les nouveaux écrans d'onboarding avec la nouvelle architecture.

---

## Implémentation Phase 1: Fix immédiat

### 1. Créer un service de conversion dans l'API

Fichier: `apps/api/src/services/legacy-conversion.service.ts`

```typescript
import { prisma } from '../lib/prisma';

/**
 * Convert legacy education format to new architecture
 */
export async function convertLegacyEducationLevel(
  educationLevel: string,
  educationSystem?: string
): Promise<{
  educationSystemId: string;
  educationLevelId: string;
  educationStreamId?: string;
}> {
  // Map legacy values to new architecture
  const systemCode = educationSystem || 'FRENCH';
  
  // Find or create education system
  const system = await prisma.educationSystem.findFirst({
    where: {
      code: systemCode,
    },
  });

  if (!system) {
    throw new Error(`Education system not found: ${systemCode}`);
  }

  // Find education level by name
  const level = await prisma.educationLevel.findFirst({
    where: {
      systemId: system.id,
      name: educationLevel,
    },
  });

  if (!level) {
    throw new Error(`Education level not found: ${educationLevel}`);
  }

  return {
    educationSystemId: system.id,
    educationLevelId: level.id,
  };
}

/**
 * Convert legacy subject names to LevelSubject IDs
 */
export async function convertLegacySubjects(
  subjectNames: string[],
  educationLevelId: string
): Promise<string[]> {
  const levelSubjects = await prisma.levelSubject.findMany({
    where: {
      levelId: educationLevelId,
      subject: {
        name: {
          in: subjectNames,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return levelSubjects.map(ls => ls.id);
}

/**
 * Convert legacy language names to TeachingLanguage IDs
 */
export async function convertLegacyLanguages(
  languageNames: string[]
): Promise<string[]> {
  const languages = await prisma.teachingLanguage.findMany({
    where: {
      name: {
        in: languageNames,
      },
    },
    select: {
      id: true,
    },
  });

  return languages.map(l => l.id);
}

/**
 * Convert legacy education levels (Primaire, Collège, etc.) to level IDs
 */
export async function convertLegacyEducationLevels(
  levelNames: string[],
  systemId: string
): Promise<string[]> {
  // Map French names to categories
  const categoryMap: Record<string, string> = {
    'Primaire': 'PRIMARY',
    'Collège': 'MIDDLE_SCHOOL',
    'Lycée': 'HIGH_SCHOOL',
    'Supérieur': 'UNIVERSITY',
    'Professionnel': 'PROFESSIONAL',
  };

  const categories = levelNames.map(name => categoryMap[name]).filter(Boolean);

  const levels = await prisma.educationLevel.findMany({
    where: {
      systemId,
      category: {
        in: categories as any[],
      },
    },
    select: {
      id: true,
    },
  });

  return levels.map(l => l.id);
}
```

### 2. Modifier les routes de profil pour accepter les deux formats

Fichier: `apps/api/src/routes/profile.routes.ts`

```typescript
// Ajouter au début du fichier
import {
  convertLegacyEducationLevel,
  convertLegacySubjects,
  convertLegacyLanguages,
  convertLegacyEducationLevels,
} from '../services/legacy-conversion.service';

/**
 * POST /api/profiles/student
 * Create a student profile (with backward compatibility)
 */
router.post('/student', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    let data: CreateStudentProfileData;

    // Check if using new format or legacy format
    if (req.body.educationLevelId) {
      // New format
      data = {
        userId,
        educationSystemId: req.body.educationSystemId,
        educationLevelId: req.body.educationLevelId,
        educationStreamId: req.body.educationStreamId,
        schoolName: req.body.schoolName,
        parentEmail: req.body.parentEmail,
        parentPhone: req.body.parentPhone,
        budgetPerHour: req.body.budgetPerHour,
        preferredLevelSubjectIds: req.body.preferredLevelSubjectIds,
      };
    } else {
      // Legacy format - convert to new format
      const educationDetails = req.body.educationDetails || {};
      const { educationSystemId, educationLevelId, educationStreamId } = 
        await convertLegacyEducationLevel(
          req.body.educationLevel,
          educationDetails.system
        );

      const preferredLevelSubjectIds = req.body.preferredSubjects?.length > 0
        ? await convertLegacySubjects(req.body.preferredSubjects, educationLevelId)
        : [];

      data = {
        userId,
        educationSystemId,
        educationLevelId,
        educationStreamId,
        schoolName: req.body.schoolName,
        parentEmail: req.body.parentEmail,
        parentPhone: req.body.parentPhone,
        budgetPerHour: req.body.budgetPerHour,
        preferredLevelSubjectIds,
      };
    }

    if (!data.educationLevelId) {
      throw new ValidationError('Education level is required', 'educationLevelId');
    }

    const profile = await createStudentProfile(data);

    res.status(201).json({
      success: true,
      data: profile,
      message: 'Student profile created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/profiles/tutor
 * Create a tutor profile (with backward compatibility)
 */
router.post('/tutor', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    let data: CreateTutorProfileData;

    // Check if using new format or legacy format
    if (req.body.teachingLevelSubjectIds) {
      // New format
      data = {
        userId,
        bio: req.body.bio,
        experienceYears: req.body.experienceYears,
        hourlyRate: req.body.hourlyRate,
        teachingLevelSubjectIds: req.body.teachingLevelSubjectIds,
        teachingLanguageIds: req.body.teachingLanguageIds,
        teachingMode: req.body.teachingMode,
        serviceRadius: req.body.serviceRadius,
        diplomas: req.body.diplomas,
      };
    } else {
      // Legacy format - convert to new format
      // For now, we'll use a default system (French) to find levels
      const defaultSystem = await prisma.educationSystem.findFirst({
        where: { code: 'FRENCH' },
      });

      if (!defaultSystem) {
        throw new Error('Default education system not found');
      }

      // Convert education levels to level IDs
      const levelIds = req.body.educationLevels?.length > 0
        ? await convertLegacyEducationLevels(req.body.educationLevels, defaultSystem.id)
        : [];

      // For each level, find subjects that match
      const teachingLevelSubjectIds: string[] = [];
      for (const levelId of levelIds) {
        const subjectIds = await convertLegacySubjects(req.body.subjects || [], levelId);
        teachingLevelSubjectIds.push(...subjectIds);
      }

      // Convert languages
      const teachingLanguageIds = req.body.languages?.length > 0
        ? await convertLegacyLanguages(req.body.languages)
        : [];

      data = {
        userId,
        bio: req.body.bio,
        experienceYears: req.body.experienceYears,
        hourlyRate: req.body.hourlyRate,
        teachingLevelSubjectIds,
        teachingLanguageIds,
        teachingMode: req.body.teachingMode,
        serviceRadius: req.body.serviceRadius,
        diplomas: req.body.diplomas || [],
      };
    }

    if (!data.hourlyRate) {
      throw new ValidationError('Hourly rate is required', 'hourlyRate');
    }

    const profile = await createTutorProfile(data);

    res.status(201).json({
      success: true,
      data: profile,
      message: 'Tutor profile created successfully',
    });
  } catch (error) {
    next(error);
  }
});
```

---

## Test du fix

### 1. Vérifier que les données éducatives existent

Avant de tester, assurez-vous que la base de données contient:
- Des `EducationSystem` (FRENCH, SENEGALESE, etc.)
- Des `EducationLevel` pour chaque système
- Des `Subject` globaux
- Des `LevelSubject` (jonction entre niveaux et matières)
- Des `TeachingLanguage`

### 2. Tester l'onboarding student

1. Créer un compte étudiant
2. Compléter l'onboarding
3. Vérifier que le profil est créé avec les bonnes relations

### 3. Tester l'onboarding tutor

1. Créer un compte tuteur
2. Compléter l'onboarding
3. Vérifier que le profil est créé avec les bonnes relations

---

## Prochaines étapes

### Court terme (1-2 jours)
1. ✅ Implémenter le service de conversion legacy
2. ✅ Modifier les routes pour accepter les deux formats
3. ✅ Tester l'onboarding
4. ✅ Vérifier que les données sont correctement converties

### Moyen terme (1-2 semaines)
1. ⏳ Créer les endpoints pour récupérer les données éducatives
2. ⏳ Créer les hooks personnalisés dans le mobile
3. ⏳ Mettre à jour les écrans d'onboarding pour utiliser la nouvelle architecture
4. ⏳ Tester la nouvelle version

### Long terme (1 mois)
1. ⏳ Supprimer la couche de compatibilité legacy
2. ⏳ Migrer tous les écrans vers la nouvelle architecture
3. ⏳ Nettoyer le code obsolète
