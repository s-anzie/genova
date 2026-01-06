# Analyse des Divergences de Types - Application Mobile vs Base de Données

## Date d'analyse
5 janvier 2026

## Vue d'ensemble
Ce document identifie les divergences entre les types définis dans `apps/mobile/types/api.ts` et les modèles Prisma dans `apps/api/prisma/schema.prisma`.

---

## 1. UserResponse

### Divergences identifiées:
- ✅ **countryCode** manquant dans le type mobile
  - Prisma: `countryCode String?`
  - Mobile: Non défini
  - Impact: L'application mobile ne peut pas accéder au code pays de l'utilisateur

---

## 2. StudentProfileResponse

### Divergences majeures:
- ❌ **educationLevel** - Type incompatible
  - Prisma: Utilise les nouveaux champs structurés (`educationSystemId`, `educationLevelId`, `educationStreamId`)
  - Mobile: `educationLevel: string` (ancien format)
  - Impact: **CRITIQUE** - Incompatibilité totale avec la nouvelle architecture

- ❌ **educationDetails** - Champ obsolète
  - Mobile: `educationDetails?: string` (JSON string)
  - Prisma: N'existe plus, remplacé par les relations structurées
  - Impact: **CRITIQUE** - Données non accessibles

- ❌ **preferredSubjects** - Type incompatible
  - Prisma: Relation `StudentPreferredSubject[]` (table de jonction avec `LevelSubject`)
  - Mobile: `preferredSubjects: string[]` (simple tableau de strings)
  - Impact: **CRITIQUE** - Impossible d'accéder aux matières préférées correctement

- ✅ **learningGoals** - Champ obsolète
  - Mobile: `learningGoals: string | null`
  - Prisma: N'existe plus (relation séparée dans `LearningGoal`)
  - Impact: Mineur - Déjà géré par une relation séparée

- ✅ **budgetPerHour** - Type correct
  - Prisma: `Decimal`
  - Mobile: `number`
  - Impact: Conversion nécessaire mais gérable

### Champs manquants:
- `educationSystemId`, `educationLevelId`, `educationStreamId`
- `onboardingCompleted`
- Relations: `educationSystem`, `educationLevel`, `educationStream`, `preferredLevelSubjects`

---

## 3. TutorProfileResponse

### Divergences majeures:
- ❌ **subjects** - Type incompatible
  - Prisma: Relation `TutorTeachingSubject[]` (table de jonction avec `LevelSubject`)
  - Mobile: `subjects: string[]` (simple tableau de strings)
  - Impact: **CRITIQUE** - Perte d'information sur les niveaux enseignés

- ❌ **educationLevels** - Type incompatible
  - Prisma: Intégré dans `TutorTeachingSubject` (relation avec `LevelSubject`)
  - Mobile: `educationLevels: string[]` (simple tableau de strings)
  - Impact: **CRITIQUE** - Impossible de savoir quels sujets sont enseignés à quels niveaux

- ❌ **languages** - Type incompatible
  - Prisma: Relation `TutorTeachingLanguage[]` (table de jonction avec `TeachingLanguage`)
  - Mobile: `languages: string[]` (simple tableau de strings)
  - Impact: **CRITIQUE** - Perte de structure des langues d'enseignement

- ❌ **availability** - Type incompatible
  - Prisma: Relation `TutorAvailability[]` (table séparée avec `dayOfWeek`, `startTime`, `endTime`, etc.)
  - Mobile: `availability: WeeklySchedule` (objet JSON simple)
  - Impact: **CRITIQUE** - Structure complètement différente

- ✅ **teachingSkillsDetails** - Champ JSON
  - Prisma: `Json?`
  - Mobile: `string?` (JSON string)
  - Impact: Conversion nécessaire

### Champs manquants:
- `onboardingCompleted`
- Relations: `teachingSubjects`, `teachingLanguages`, `availabilities`

---

## 4. ClassResponse

### Divergences majeures:
- ❌ **educationLevel** - Type incompatible
  - Prisma: Utilise les nouveaux champs structurés (`educationSystemId`, `educationLevelId`, `educationStreamId`)
  - Mobile: `educationLevel: EducationLevel` (objet avec `level`, `system`, `specificLevel`, `stream`)
  - Impact: **CRITIQUE** - Structure complètement différente

- ❌ **subjects** - Type incompatible
  - Prisma: Relation `ClassSubject[]` (table de jonction avec `LevelSubject`)
  - Mobile: `subjects: string[]` (simple tableau de strings)
  - Impact: **CRITIQUE** - Perte d'information sur les matières enseignées

### Champs manquants:
- `educationSystemId`, `educationLevelId`, `educationStreamId`
- Relations: `timeSlots`, `tutorAssignments`, `educationSystemRel`, `educationLevelRel`, `educationStreamRel`, `classSubjects`

---

## 5. SessionResponse

### Divergences:
- ⚠️ **tutor.hourlyRate** - Structure imbriquée
  - Prisma: `tutor.tutorProfile.hourlyRate`
  - Mobile: `tutor.hourlyRate` (pour compatibilité) + `tutor.tutorProfile.hourlyRate`
  - Impact: Mineur - Redondance pour compatibilité

---

## 6. TransactionResponse

### Champs manquants:
- `paymentProviderId` (Prisma)
- `transactionType` vs `type` (nommage différent)

---

## 7. LearningGoal

### Divergences majeures:
- ❌ **subject** - Champ obsolète
  - Prisma: `subject String?` (DEPRECATED) + `levelSubjectId String?` (nouveau)
  - Mobile: `subject: string` (obligatoire)
  - Impact: **CRITIQUE** - Utilise l'ancien format

- ❌ **educationLevel** - Champ obsolète
  - Prisma: `educationLevel Json?` (DEPRECATED) + `levelSubjectId String?` (nouveau)
  - Mobile: `educationLevel?: any`
  - Impact: **CRITIQUE** - Utilise l'ancien format

### Champs manquants:
- `levelSubjectId`
- Relation: `levelSubject`

---

## 8. ShopProductResponse

### Divergences majeures:
- ❌ **subject** - Type incompatible
  - Prisma: `levelSubjectId String?` (relation avec `LevelSubject`)
  - Mobile: `subject: string` (simple string)
  - Impact: **CRITIQUE** - Perte d'information sur le niveau

- ❌ **educationLevel** - Type incompatible
  - Prisma: Intégré dans `levelSubjectId`
  - Mobile: `educationLevel: string` (simple string)
  - Impact: **CRITIQUE** - Structure différente

### Champs manquants:
- `levelSubjectId`
- Relation: `levelSubject`

---

## 9. AcademicResultResponse

### Divergences majeures:
- ❌ **subject** - Type incompatible
  - Prisma: `levelSubjectId String?` (relation avec `LevelSubject`)
  - Mobile: `subject: string` (simple string)
  - Impact: **CRITIQUE** - Perte d'information sur le niveau

### Champs manquants:
- `levelSubjectId`
- Relation: `levelSubject`

---

## 10. Nouveaux modèles Prisma non représentés dans le mobile

### Modèles manquants complètement:
1. **EducationSystem** - Systèmes éducatifs par pays
2. **EducationLevel** - Niveaux d'éducation par système
3. **EducationStream** - Filières/séries par niveau
4. **Subject** - Matières globales
5. **LevelSubject** - Matières disponibles par niveau (table de jonction)
6. **TeachingLanguage** - Langues d'enseignement
7. **LocalLanguage** - Langues locales par pays
8. **Country** - Configuration régionale des pays
9. **City** - Villes par pays
10. **PhoneOperator** - Opérateurs téléphoniques par pays
11. **TutorTeachingSubject** - Matières enseignées par les tuteurs
12. **TutorTeachingLanguage** - Langues d'enseignement des tuteurs
13. **StudentPreferredSubject** - Matières préférées des étudiants
14. **ClassSubject** - Matières enseignées dans une classe
15. **ClassTimeSlot** - Créneaux horaires des classes
16. **ClassSlotCancellation** - Annulations de créneaux
17. **ClassTutorAssignment** - Affectations de tuteurs aux classes
18. **TutorAvailability** - Disponibilités des tuteurs

---

## Résumé des problèmes critiques

### 🔴 Problèmes bloquants (nécessitent une refonte):
1. **Architecture éducative** - Passage de strings simples à une architecture relationnelle complète
2. **Matières et niveaux** - Tous les champs `subject` et `educationLevel` doivent être migrés vers `levelSubjectId`
3. **Disponibilités des tuteurs** - Structure complètement différente
4. **Langues d'enseignement** - Passage de tableaux de strings à des relations
5. **Matières préférées des étudiants** - Passage de tableaux de strings à des relations

### 🟡 Problèmes moyens (nécessitent des adaptations):
1. **Types Decimal** - Conversion number ↔ Decimal
2. **Champs JSON** - Conversion string ↔ JSON
3. **Champs manquants** - Ajout de nouveaux champs dans les types mobile

### 🟢 Problèmes mineurs (faciles à corriger):
1. **Nommage de champs** - Quelques différences de noms
2. **Champs optionnels** - Ajustements de nullabilité

---

## Recommandations

### Phase 1: Créer les nouveaux types
1. Créer les interfaces pour tous les nouveaux modèles Prisma
2. Créer des types de réponse enrichis incluant les relations

### Phase 2: Adapter les types existants
1. Mettre à jour `StudentProfileResponse` avec la nouvelle architecture
2. Mettre à jour `TutorProfileResponse` avec les nouvelles relations
3. Mettre à jour `ClassResponse` avec la nouvelle structure
4. Mettre à jour tous les types utilisant `subject` et `educationLevel`

### Phase 3: Créer des utilitaires de conversion
1. Fonctions pour convertir l'ancienne structure vers la nouvelle
2. Fonctions pour maintenir la compatibilité descendante si nécessaire
3. Fonctions pour formater les données pour l'affichage

### Phase 4: Migration progressive
1. Commencer par les nouveaux écrans (utiliser directement la nouvelle structure)
2. Adapter progressivement les écrans existants
3. Maintenir une couche de compatibilité pendant la transition

---

## Prochaines étapes

1. ✅ Identifier toutes les divergences (FAIT)
2. ⏳ Créer les nouveaux types TypeScript pour l'application mobile
3. ⏳ Mettre à jour les services API pour retourner les nouvelles structures
4. ⏳ Créer des utilitaires de conversion et de formatage
5. ⏳ Mettre à jour les composants UI pour utiliser les nouvelles structures
6. ⏳ Tester la migration sur un écran pilote
7. ⏳ Déployer progressivement sur tous les écrans
