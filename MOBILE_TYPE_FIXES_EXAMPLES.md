# Exemples de Corrections - Types Mobile

## Date
5 janvier 2026

## Vue d'ensemble
Ce document fournit des exemples concrets de code à corriger dans l'application mobile pour aligner les types avec la nouvelle architecture de la base de données.

---

## 1. Fichier: `apps/mobile/types/api.ts`

### Problème 1: StudentProfileResponse - Structure éducative obsolète

**Code actuel:**
```typescript
export interface StudentProfileResponse {
  id: string;
  userId: string;
  educationLevel: string;
  educationDetails?: string; // JSON string containing detailed education info
  schoolName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  learningGoals: string | null;
  preferredSubjects: string[];
  budgetPerHour: number | null;
  user?: UserResponse;
}
```

**Code corrigé:**
```typescript
export interface StudentProfileResponse {
  id: string;
  userId: string;
  
  // New structured education fields
  educationSystemId: string | null;
  educationLevelId: string | null;
  educationStreamId: string | null;
  
  schoolName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  budgetPerHour: number | null;
  onboardingCompleted: boolean;
  
  // Relations (populated when requested)
  user?: UserResponse;
  educationSystem?: EducationSystemResponse;
  educationLevel?: EducationLevelResponse;
  educationStream?: EducationStreamResponse;
  preferredLevelSubjects?: StudentPreferredSubjectResponse[];
}
```

---

### Problème 2: TutorProfileResponse - Matières et langues obsolètes

**Code actuel:**
```typescript
export interface TutorProfileResponse {
  id: string;
  userId: string;
  bio: string | null;
  experienceYears: number;
  hourlyRate: number;
  subjects: string[];
  educationLevels: string[];
  languages: string[];
  teachingMode: 'IN_PERSON' | 'ONLINE' | 'BOTH';
  serviceRadius: number | null;
  diplomas: Diploma[];
  availability: WeeklySchedule;
  teachingSkillsDetails?: string; // JSON string
  totalHoursTaught: number;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  verificationDocuments: string[];
  user?: UserResponse;
}
```

**Code corrigé:**
```typescript
export interface TutorProfileResponse {
  id: string;
  userId: string;
  bio: string | null;
  experienceYears: number;
  hourlyRate: number;
  teachingMode: 'IN_PERSON' | 'ONLINE' | 'BOTH';
  serviceRadius: number | null;
  diplomas: Diploma[];
  teachingSkillsDetails?: any; // JSON object (not string)
  totalHoursTaught: number;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  verificationDocuments: string[];
  onboardingCompleted: boolean;
  
  // Relations (populated when requested)
  user?: UserResponse;
  teachingSubjects?: TutorTeachingSubjectResponse[];
  teachingLanguages?: TutorTeachingLanguageResponse[];
  availabilities?: TutorAvailabilityResponse[];
  
  // Computed fields for backward compatibility (deprecated)
  subjects?: string[]; // Computed from teachingSubjects
  educationLevels?: string[]; // Computed from teachingSubjects
  languages?: string[]; // Computed from teachingLanguages
  availability?: WeeklySchedule; // Computed from availabilities
}
```

---

### Problème 3: ClassResponse - Structure éducative obsolète

**Code actuel:**
```typescript
export interface ClassResponse {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  educationLevel: EducationLevel;
  subjects: string[]; // Changed from single subject to array
  maxStudents: number | null;
  meetingType: 'IN_PERSON' | 'ONLINE';
  meetingLocation: string | null;
  createdAt: Date;
  isActive: boolean;
  creator: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
  };
  members?: ClassMemberResponse[];
  _count?: {
    members: number;
  };
}
```

**Code corrigé:**
```typescript
export interface ClassResponse {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  
  // New structured education fields
  educationSystemId: string | null;
  educationLevelId: string | null;
  educationStreamId: string | null;
  
  maxStudents: number | null;
  meetingType: 'IN_PERSON' | 'ONLINE';
  meetingLocation: string | null;
  createdAt: Date;
  isActive: boolean;
  
  // Relations (populated when requested)
  creator: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
  };
  members?: ClassMemberResponse[];
  educationSystemRel?: EducationSystemResponse;
  educationLevelRel?: EducationLevelResponse;
  educationStreamRel?: EducationStreamResponse;
  classSubjects?: ClassSubjectResponse[];
  timeSlots?: ClassTimeSlotResponse[];
  tutorAssignments?: ClassTutorAssignmentResponse[];
  
  _count?: {
    members: number;
  };
  
  // Computed fields for backward compatibility (deprecated)
  educationLevel?: EducationLevel; // Computed from relations
  subjects?: string[]; // Computed from classSubjects
}
```

---

## 2. Nouveaux types à ajouter

### Types pour l'architecture éducative

```typescript
// Education System
export interface EducationSystemResponse {
  id: string;
  countryId: string;
  code: string; // FRENCH, SENEGALESE, ANGLOPHONE, INTERNATIONAL
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  
  country?: CountryResponse;
  levels?: EducationLevelResponse[];
}

// Education Level
export interface EducationLevelResponse {
  id: string;
  systemId: string;
  code: string; // CP, CE1, 6EME, SECONDE, TERMINALE, LICENCE
  name: string;
  category: 'PRIMARY' | 'MIDDLE_SCHOOL' | 'HIGH_SCHOOL' | 'UNIVERSITY' | 'PROFESSIONAL';
  order: number;
  hasStreams: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  system?: EducationSystemResponse;
  streams?: EducationStreamResponse[];
  subjects?: LevelSubjectResponse[];
}

// Education Stream
export interface EducationStreamResponse {
  id: string;
  levelId: string;
  code: string; // L, ES, S, C, D, TI, F4
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  
  level?: EducationLevelResponse;
}

// Subject
export interface SubjectResponse {
  id: string;
  code: string; // MATH, PHYSICS, FRENCH, ENGLISH
  name: string;
  nameEn: string | null;
  category: 'SCIENCE' | 'LANGUAGE' | 'HUMANITIES' | 'ARTS' | 'SPORTS' | 'TECHNOLOGY' | 'ECONOMICS';
  icon: string | null;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Level Subject (junction)
export interface LevelSubjectResponse {
  id: string;
  levelId: string;
  subjectId: string;
  isCore: boolean;
  coefficient: number | null;
  hoursPerWeek: number | null;
  createdAt: Date;
  
  level?: EducationLevelResponse;
  subject?: SubjectResponse;
}

// Teaching Language
export interface TeachingLanguageResponse {
  id: string;
  code: string; // fr, en, es, de, ar
  name: string;
  nativeName: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Tutor Teaching Subject
export interface TutorTeachingSubjectResponse {
  id: string;
  tutorProfileId: string;
  levelSubjectId: string;
  yearsExperience: number | null;
  createdAt: Date;
  updatedAt: Date;
  
  levelSubject?: LevelSubjectResponse;
}

// Tutor Teaching Language
export interface TutorTeachingLanguageResponse {
  id: string;
  tutorProfileId: string;
  teachingLanguageId: string;
  createdAt: Date;
  
  teachingLanguage?: TeachingLanguageResponse;
}

// Student Preferred Subject
export interface StudentPreferredSubjectResponse {
  id: string;
  studentProfileId: string;
  levelSubjectId: string;
  createdAt: Date;
  
  levelSubject?: LevelSubjectResponse;
}

// Class Subject
export interface ClassSubjectResponse {
  id: string;
  classId: string;
  levelSubjectId: string;
  createdAt: Date;
  
  levelSubject?: LevelSubjectResponse;
}

// Class Time Slot
export interface ClassTimeSlotResponse {
  id: string;
  classId: string;
  levelSubjectId: string | null;
  dayOfWeek: number; // 0-6
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  createdAt: Date;
  isActive: boolean;
  
  levelSubject?: LevelSubjectResponse;
  cancellations?: ClassSlotCancellationResponse[];
}

// Class Slot Cancellation
export interface ClassSlotCancellationResponse {
  id: string;
  timeSlotId: string;
  weekStart: Date;
  reason: string | null;
  createdAt: Date;
  createdBy: string;
}

// Class Tutor Assignment
export interface ClassTutorAssignmentResponse {
  id: string;
  classId: string;
  timeSlotId: string | null;
  subject: string;
  tutorId: string;
  recurrencePattern: 'ROUND_ROBIN' | 'WEEKLY' | 'CONSECUTIVE_DAYS' | 'MANUAL';
  recurrenceConfig: any | null;
  startDate: Date | null;
  endDate: Date | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: Date;
  isActive: boolean;
  
  tutor?: UserResponse;
  timeSlot?: ClassTimeSlotResponse;
}

// Tutor Availability
export interface TutorAvailabilityResponse {
  id: string;
  tutorId: string;
  dayOfWeek: number | null; // 0-6 for recurring, null for one-time
  specificDate: Date | null; // null for recurring, specific date for one-time
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  isRecurring: boolean;
  isActive: boolean;
  createdAt: Date;
}

// Country
export interface CountryResponse {
  id: string;
  code: string; // ISO 3166-1 alpha-2
  name: string;
  phoneCode: string;
  phoneRegex: string;
  phoneFormat: string;
  phoneExample: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  timezone: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  
  cities?: CityResponse[];
  operators?: PhoneOperatorResponse[];
  educationSystems?: EducationSystemResponse[];
  localLanguages?: LocalLanguageResponse[];
}

// City
export interface CityResponse {
  id: string;
  countryId: string;
  name: string;
  region: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Phone Operator
export interface PhoneOperatorResponse {
  id: string;
  countryId: string;
  name: string;
  prefixes: string[];
  regex: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Local Language
export interface LocalLanguageResponse {
  id: string;
  countryId: string;
  name: string;
  code: string | null;
  isOfficial: boolean;
  speakers: number | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Fichier: `apps/mobile/contexts/profile-context.tsx`

### Problème: Utilisation des anciens types

**Code actuel:**
```typescript
const updateStudentProfile = useCallback(async (data: Partial<StudentProfileResponse>) => {
  try {
    setError(null);
    const response = await apiClient.put<{ data: StudentProfileResponse }>(
      '/profiles/student',
      data
    );
    setStudentProfile(response.data);
  } catch (err: any) {
    setError(err.message);
    throw err;
  }
}, []);
```

**Code corrigé:**
```typescript
const updateStudentProfile = useCallback(async (data: Partial<StudentProfileResponse>) => {
  try {
    setError(null);
    // The API should now return the full profile with relations
    const response = await apiClient.put<{ data: StudentProfileResponse }>(
      '/profiles/student',
      data
    );
    setStudentProfile(response.data);
  } catch (err: any) {
    setError(err.message);
    throw err;
  }
}, []);

// Add new helper to fetch full profile with relations
const fetchStudentProfileWithRelations = useCallback(async () => {
  try {
    const response = await apiClient.get<{ data: StudentProfileResponse }>(
      `/profiles/student/${authUser?.id}?include=educationSystem,educationLevel,educationStream,preferredLevelSubjects`
    );
    setStudentProfile(response.data);
  } catch (err: any) {
    setError(err.message);
  }
}, [authUser]);
```

---

## 4. Fichier: `apps/mobile/app/(tutor)/onboarding.tsx`

### Problème: Utilisation de tableaux de strings pour subjects et educationLevels

**Code actuel:**
```typescript
interface FormData {
  bio: string;
  hourlyRate: string;
  experienceYears: string;
  subjects: string[];
  educationLevels: string[];
  languages: string[];
  teachingMode: string;
  // ...
}

const toggleItem = (field: 'subjects' | 'educationLevels' | 'languages', item: string) => {
  const items = formData[field];
  const updated = items.includes(item)
    ? items.filter(i => i !== item)
    : [...items, item];
  setFormData({ ...formData, [field]: updated });
};
```

**Code corrigé:**
```typescript
interface FormData {
  bio: string;
  hourlyRate: string;
  experienceYears: string;
  teachingSubjects: Array<{
    levelSubjectId: string;
    yearsExperience?: number;
  }>;
  teachingLanguages: string[]; // IDs of TeachingLanguage
  teachingMode: string;
  // ...
}

// New helper to toggle teaching subjects
const toggleTeachingSubject = (levelSubjectId: string) => {
  const exists = formData.teachingSubjects.find(ts => ts.levelSubjectId === levelSubjectId);
  const updated = exists
    ? formData.teachingSubjects.filter(ts => ts.levelSubjectId !== levelSubjectId)
    : [...formData.teachingSubjects, { levelSubjectId }];
  setFormData({ ...formData, teachingSubjects: updated });
};

// New helper to toggle teaching languages
const toggleTeachingLanguage = (languageId: string) => {
  const updated = formData.teachingLanguages.includes(languageId)
    ? formData.teachingLanguages.filter(id => id !== languageId)
    : [...formData.teachingLanguages, languageId];
  setFormData({ ...formData, teachingLanguages: updated });
};
```

---

## 5. Fichier: `apps/mobile/app/(student)/classes/create.tsx`

### Problème: Utilisation de l'ancien format educationLevel

**Code actuel:**
```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  educationLevel: '',
  educationSystem: '',
  specificLevel: '',
  subjects: [] as string[],
  // ...
});
```

**Code corrigé:**
```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  educationSystemId: '',
  educationLevelId: '',
  educationStreamId: '',
  classSubjects: [] as string[], // Array of levelSubjectIds
  // ...
});

// Add helpers to fetch education data
const [educationSystems, setEducationSystems] = useState<EducationSystemResponse[]>([]);
const [educationLevels, setEducationLevels] = useState<EducationLevelResponse[]>([]);
const [educationStreams, setEducationStreams] = useState<EducationStreamResponse[]>([]);
const [availableSubjects, setAvailableSubjects] = useState<LevelSubjectResponse[]>([]);

// Fetch education systems on mount
useEffect(() => {
  const fetchEducationSystems = async () => {
    const response = await apiClient.get<{ data: EducationSystemResponse[] }>(
      '/education/systems'
    );
    setEducationSystems(response.data);
  };
  fetchEducationSystems();
}, []);

// Fetch levels when system changes
useEffect(() => {
  if (formData.educationSystemId) {
    const fetchLevels = async () => {
      const response = await apiClient.get<{ data: EducationLevelResponse[] }>(
        `/education/systems/${formData.educationSystemId}/levels`
      );
      setEducationLevels(response.data);
    };
    fetchLevels();
  }
}, [formData.educationSystemId]);

// Fetch streams when level changes
useEffect(() => {
  if (formData.educationLevelId) {
    const fetchStreams = async () => {
      const response = await apiClient.get<{ data: EducationStreamResponse[] }>(
        `/education/levels/${formData.educationLevelId}/streams`
      );
      setEducationStreams(response.data);
    };
    fetchStreams();
  }
}, [formData.educationLevelId]);

// Fetch available subjects when level changes
useEffect(() => {
  if (formData.educationLevelId) {
    const fetchSubjects = async () => {
      const response = await apiClient.get<{ data: LevelSubjectResponse[] }>(
        `/education/levels/${formData.educationLevelId}/subjects`
      );
      setAvailableSubjects(response.data);
    };
    fetchSubjects();
  }
}, [formData.educationLevelId]);
```

---

## 6. Utilitaires de conversion

### Créer un fichier: `apps/mobile/utils/education-formatter.ts`

```typescript
import type {
  EducationSystemResponse,
  EducationLevelResponse,
  EducationStreamResponse,
  LevelSubjectResponse,
} from '@/types/api';

/**
 * Format education level for display
 */
export function formatEducationLevel(
  system?: EducationSystemResponse,
  level?: EducationLevelResponse,
  stream?: EducationStreamResponse
): string {
  if (!level) return 'Non spécifié';
  
  const parts: string[] = [];
  
  if (system) {
    parts.push(system.name);
  }
  
  parts.push(level.name);
  
  if (stream) {
    parts.push(stream.name);
  }
  
  return parts.join(' - ');
}

/**
 * Format subject with level for display
 */
export function formatLevelSubject(levelSubject: LevelSubjectResponse): string {
  if (!levelSubject.subject || !levelSubject.level) {
    return 'Matière inconnue';
  }
  
  return `${levelSubject.subject.name} (${levelSubject.level.name})`;
}

/**
 * Group level subjects by category
 */
export function groupLevelSubjectsByCategory(
  levelSubjects: LevelSubjectResponse[]
): Record<string, LevelSubjectResponse[]> {
  return levelSubjects.reduce((acc, ls) => {
    if (!ls.subject) return acc;
    
    const category = ls.subject.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ls);
    return acc;
  }, {} as Record<string, LevelSubjectResponse[]>);
}

/**
 * Convert old education level format to new format (for migration)
 */
export function convertLegacyEducationLevel(
  legacyLevel: string,
  legacySystem?: string
): {
  systemCode: string;
  levelCode: string;
  streamCode?: string;
} {
  // This is a simplified example - you'll need to implement the full mapping
  const mapping: Record<string, any> = {
    'primary': {
      'french': { systemCode: 'FRENCH', levelCode: 'CP' },
      'senegalese': { systemCode: 'SENEGALESE', levelCode: 'CI' },
    },
    'middle_school': {
      'french': { systemCode: 'FRENCH', levelCode: '6EME' },
      'senegalese': { systemCode: 'SENEGALESE', levelCode: '6EME' },
    },
    // Add more mappings...
  };
  
  return mapping[legacyLevel]?.[legacySystem || 'french'] || {
    systemCode: 'FRENCH',
    levelCode: 'CP',
  };
}
```

---

## 7. Hooks personnalisés

### Créer un fichier: `apps/mobile/hooks/useEducation.ts`

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '@/utils/api-client';
import type {
  EducationSystemResponse,
  EducationLevelResponse,
  EducationStreamResponse,
  LevelSubjectResponse,
  SubjectResponse,
  TeachingLanguageResponse,
} from '@/types/api';

export function useEducationSystems(countryCode?: string) {
  const [systems, setSystems] = useState<EducationSystemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        setLoading(true);
        const params = countryCode ? `?countryCode=${countryCode}` : '';
        const response = await apiClient.get<{ data: EducationSystemResponse[] }>(
          `/education/systems${params}`
        );
        setSystems(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSystems();
  }, [countryCode]);

  return { systems, loading, error };
}

export function useEducationLevels(systemId?: string) {
  const [levels, setLevels] = useState<EducationLevelResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!systemId) {
      setLevels([]);
      return;
    }

    const fetchLevels = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{ data: EducationLevelResponse[] }>(
          `/education/systems/${systemId}/levels`
        );
        setLevels(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLevels();
  }, [systemId]);

  return { levels, loading, error };
}

export function useEducationStreams(levelId?: string) {
  const [streams, setStreams] = useState<EducationStreamResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!levelId) {
      setStreams([]);
      return;
    }

    const fetchStreams = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{ data: EducationStreamResponse[] }>(
          `/education/levels/${levelId}/streams`
        );
        setStreams(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStreams();
  }, [levelId]);

  return { streams, loading, error };
}

export function useLevelSubjects(levelId?: string) {
  const [subjects, setSubjects] = useState<LevelSubjectResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!levelId) {
      setSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{ data: LevelSubjectResponse[] }>(
          `/education/levels/${levelId}/subjects`
        );
        setSubjects(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [levelId]);

  return { subjects, loading, error };
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{ data: SubjectResponse[] }>(
          '/education/subjects'
        );
        setSubjects(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  return { subjects, loading, error };
}

export function useTeachingLanguages() {
  const [languages, setLanguages] = useState<TeachingLanguageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{ data: TeachingLanguageResponse[] }>(
          '/education/languages'
        );
        setLanguages(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, []);

  return { languages, loading, error };
}
```

---

## Résumé des fichiers à créer/modifier

### Fichiers à créer:
1. ✅ `MOBILE_TYPE_DIVERGENCES.md` (analyse)
2. ✅ `MOBILE_TYPE_FIXES_EXAMPLES.md` (ce fichier)
3. ⏳ `apps/mobile/utils/education-formatter.ts` (utilitaires)
4. ⏳ `apps/mobile/hooks/useEducation.ts` (hooks personnalisés)

### Fichiers à modifier:
1. ⏳ `apps/mobile/types/api.ts` (tous les types)
2. ⏳ `apps/mobile/contexts/profile-context.tsx`
3. ⏳ `apps/mobile/app/(tutor)/onboarding.tsx`
4. ⏳ `apps/mobile/app/(tutor)/profile/edit.tsx`
5. ⏳ `apps/mobile/app/(student)/classes/create.tsx`
6. ⏳ `apps/mobile/app/(student)/classes/index.tsx`
7. ⏳ `apps/mobile/app/(student)/marketplace/*.tsx`
8. ⏳ `apps/mobile/utils/education-level-parser.ts` (adapter ou remplacer)

---

## Prochaines étapes recommandées

1. **Phase 1: Créer les nouveaux types**
   - Ajouter tous les nouveaux types dans `apps/mobile/types/api.ts`
   - Créer les utilitaires de formatage
   - Créer les hooks personnalisés

2. **Phase 2: Mettre à jour l'API backend**
   - S'assurer que l'API retourne les nouvelles structures
   - Ajouter des endpoints pour les nouvelles entités
   - Maintenir la compatibilité descendante si nécessaire

3. **Phase 3: Migration progressive**
   - Commencer par un écran pilote (ex: création de classe)
   - Tester la nouvelle structure
   - Migrer progressivement les autres écrans

4. **Phase 4: Nettoyage**
   - Supprimer les anciens champs obsolètes
   - Supprimer les utilitaires de compatibilité
   - Mettre à jour la documentation
