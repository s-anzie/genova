# Implémentation du Vrai Onboarding

## Date
5 janvier 2026

## Vue d'ensemble
Implémentation complète d'un onboarding qui utilise la vraie architecture éducative avec des données réelles de la base de données.

---

## ✅ Ce qui a été fait

### 1. Routes API pour les données éducatives
**Fichier:** `apps/api/src/routes/education.routes.ts`

Endpoints créés:
- `GET /api/education/countries` - Liste des pays
- `GET /api/education/systems` - Systèmes éducatifs (filtrable par pays)
- `GET /api/education/systems/:systemId/levels` - Niveaux d'un système
- `GET /api/education/levels/:levelId/streams` - Filières d'un niveau
- `GET /api/education/levels/:levelId/subjects` - Matières disponibles pour un niveau
- `GET /api/education/subjects` - Toutes les matières globales
- `GET /api/education/languages` - Langues d'enseignement
- `GET /api/education/countries/:countryCode/cities` - Villes d'un pays
- `GET /api/education/subject-categories` - Catégories de matières

**Caractéristiques:**
- ✅ Pas d'authentification requise (données publiques)
- ✅ Filtrage par catégorie pour les matières
- ✅ Données triées par ordre logique
- ✅ Inclut les relations nécessaires

### 2. Service de conversion legacy
**Fichier:** `apps/api/src/services/legacy-conversion.service.ts`

Fonctions créées:
- `convertLegacyEducationLevel()` - Convertit ancien format vers nouveau
- `convertLegacySubjects()` - Convertit noms de matières vers IDs
- `convertLegacyLanguages()` - Convertit noms de langues vers IDs
- `convertLegacyEducationLevels()` - Convertit catégories vers IDs
- `getTeachingLevelSubjectsFromLegacy()` - Combine matières et niveaux
- `parseExperienceYears()` - Parse les années d'expérience

**Utilité:**
- ✅ Permet la compatibilité avec l'ancien format
- ✅ Conversion automatique et transparente
- ✅ Logs détaillés pour le debugging

### 3. Routes de profil mises à jour
**Fichier:** `apps/api/src/routes/profile.routes.ts`

Modifications:
- ✅ POST `/api/profiles/student` - Accepte nouveau ET ancien format
- ✅ POST `/api/profiles/tutor` - Accepte nouveau ET ancien format
- ✅ Conversion automatique si ancien format détecté
- ✅ Logs pour tracer les conversions

### 4. Hooks personnalisés pour le mobile
**Fichier:** `apps/mobile/hooks/useEducation.ts`

Hooks créés:
- `useCountries()` - Récupère les pays
- `useEducationSystems(countryCode)` - Récupère les systèmes éducatifs
- `useEducationLevels(systemId)` - Récupère les niveaux
- `useEducationStreams(levelId)` - Récupère les filières
- `useLevelSubjects(levelId, category?)` - Récupère les matières d'un niveau
- `useSubjects(category?)` - Récupère toutes les matières
- `useTeachingLanguages()` - Récupère les langues d'enseignement
- `useCities(countryCode)` - Récupère les villes

**Caractéristiques:**
- ✅ Gestion automatique du loading
- ✅ Gestion des erreurs
- ✅ Rechargement automatique quand les dépendances changent
- ✅ Types TypeScript complets

### 5. Onboarding étudiant refait
**Fichier:** `apps/mobile/app/(student)/onboarding.tsx`

Modifications:
- ✅ Utilise les hooks pour récupérer les vraies données
- ✅ Sélection du pays
- ✅ Sélection du système éducatif
- ✅ Sélection du niveau
- ✅ Sélection de la filière (si applicable)
- ✅ Sélection des matières réelles du niveau
- ✅ Indicateurs de chargement
- ✅ Envoie les IDs corrects à l'API

---

## 🔄 Flux de données

### Student Onboarding

```
1. Utilisateur sélectionne PAYS
   ↓
2. Chargement des SYSTÈMES ÉDUCATIFS du pays
   ↓
3. Utilisateur sélectionne SYSTÈME
   ↓
4. Chargement des NIVEAUX du système
   ↓
5. Utilisateur sélectionne NIVEAU
   ↓
6. Chargement des FILIÈRES (si applicable) et MATIÈRES du niveau
   ↓
7. Utilisateur sélectionne FILIÈRE (optionnel) et MATIÈRES
   ↓
8. Utilisateur remplit les autres infos (école, parents, budget)
   ↓
9. Soumission avec les IDs corrects:
   {
     educationSystemId: "uuid",
     educationLevelId: "uuid",
     educationStreamId: "uuid" | null,
     preferredLevelSubjectIds: ["uuid1", "uuid2"],
     schoolName: "...",
     parentEmail: "...",
     budgetPerHour: 5000
   }
   ↓
10. API crée le profil avec les relations correctes
```

---

## 📋 Ce qu'il reste à faire

### Court terme (Aujourd'hui)

1. **Tester l'onboarding étudiant**
   - Vérifier que les données se chargent
   - Vérifier que la soumission fonctionne
   - Vérifier que le profil est créé correctement

2. **Refaire l'onboarding tuteur**
   - Même approche que l'étudiant
   - Utiliser les hooks
   - Sélection des matières par niveau
   - Sélection des langues d'enseignement

3. **Vérifier les données de seed**
   - S'assurer que la DB contient:
     - Countries
     - EducationSystems
     - EducationLevels
     - Subjects
     - LevelSubjects
     - TeachingLanguages

### Moyen terme (Cette semaine)

1. **Mettre à jour les autres écrans**
   - Profil étudiant (édition)
   - Profil tuteur (édition)
   - Création de classe
   - Recherche de tuteurs
   - Marketplace

2. **Ajouter des validations**
   - Vérifier que les IDs existent
   - Vérifier les relations
   - Messages d'erreur clairs

3. **Améliorer l'UX**
   - Recherche de matières
   - Filtrage par catégorie
   - Suggestions intelligentes

### Long terme (Ce mois)

1. **Supprimer la couche legacy**
   - Une fois tous les écrans migrés
   - Supprimer les fonctions de conversion
   - Nettoyer le code

2. **Optimisations**
   - Cache des données éducatives
   - Préchargement intelligent
   - Réduction des appels API

3. **Analytics**
   - Tracker les choix des utilisateurs
   - Identifier les systèmes/niveaux populaires
   - Améliorer les suggestions

---

## 🧪 Tests à effectuer

### Test 1: Onboarding étudiant complet
```
1. Créer un nouveau compte étudiant
2. Sélectionner: Sénégal → Système Français → 6ème
3. Sélectionner 3 matières
4. Remplir les infos de l'école
5. Soumettre
6. Vérifier dans la DB:
   - StudentProfile créé
   - educationSystemId, educationLevelId corrects
   - StudentPreferredSubject créés (3 entrées)
```

### Test 2: Onboarding avec filière
```
1. Créer un nouveau compte étudiant
2. Sélectionner: Sénégal → Système Français → Terminale
3. Sélectionner une filière (ex: Scientifique)
4. Sélectionner des matières
5. Soumettre
6. Vérifier que educationStreamId est correct
```

### Test 3: Compatibilité legacy
```
1. Utiliser l'ancien format dans une requête API directe
2. Vérifier que la conversion fonctionne
3. Vérifier que le profil est créé correctement
```

---

## 🐛 Problèmes potentiels et solutions

### Problème 1: Données manquantes dans la DB
**Symptôme:** Listes vides dans l'onboarding

**Solution:**
```bash
# Vérifier les données
cd apps/api
npx prisma studio

# Ou exécuter le seed
npx prisma db seed
```

### Problème 2: Erreur "Education system not found"
**Symptôme:** Erreur lors de la conversion legacy

**Solution:**
- Vérifier que les systèmes éducatifs existent
- Vérifier les codes (FRENCH, SENEGALESE, etc.)
- Ajouter des systèmes manquants

### Problème 3: Matières ne se chargent pas
**Symptôme:** Liste vide après sélection du niveau

**Solution:**
- Vérifier que LevelSubject existe pour ce niveau
- Vérifier que les Subjects sont actifs
- Vérifier les relations dans Prisma Studio

### Problème 4: Erreur CORS
**Symptôme:** Requêtes bloquées depuis le mobile

**Solution:**
- Vérifier que l'API accepte les requêtes du mobile
- Vérifier la configuration CORS dans index.ts
- Vérifier l'URL de l'API dans le mobile

---

## 📝 Notes importantes

### Authentification
- Les endpoints `/api/education/*` ne nécessitent PAS d'authentification
- Cela permet de charger les données avant même la connexion
- Les endpoints `/api/profiles/*` nécessitent l'authentification

### Performance
- Les données éducatives changent rarement
- Possibilité d'ajouter un cache côté mobile
- Possibilité d'ajouter un cache côté API (Redis)

### Internationalisation
- Les noms sont en français par défaut
- `nameEn` disponible pour l'anglais
- Possibilité d'ajouter d'autres langues

### Extensibilité
- Facile d'ajouter de nouveaux pays
- Facile d'ajouter de nouveaux systèmes
- Facile d'ajouter de nouvelles matières

---

## 🎯 Objectifs atteints

✅ Onboarding utilise les vraies données de la DB
✅ Architecture éducative complète implémentée
✅ Compatibilité backward maintenue
✅ Hooks réutilisables créés
✅ Types TypeScript complets
✅ Gestion des erreurs et du loading
✅ Code propre et maintenable

## 🚀 Prochaine étape

**PRIORITÉ 1:** Tester l'onboarding étudiant et corriger les bugs éventuels
**PRIORITÉ 2:** Refaire l'onboarding tuteur avec la même approche
**PRIORITÉ 3:** Vérifier/créer les données de seed nécessaires
