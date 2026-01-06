# Debug de la détection d'onboarding

---

## 📋 PROBLÈME

L'utilisateur est renvoyé en boucle vers l'onboarding même si son profil existe en base de données avec `onboardingCompleted: true`.

### Erreur observée
```
LOG  🔍 Checking student profile for user: 632663fa-7df1-4768-9a0c-eff184636d4e
LOG  ⚠️ Error checking profile: Request failed: 400
LOG  No student profile found
```

**Comportement attendu:** L'utilisateur devrait être redirigé vers la page d'accueil étudiant.

**Comportement actuel:** L'utilisateur est renvoyé vers la page d'onboarding en boucle.

---

## 🔧 MODIFICATIONS APPORTÉES

### 1️⃣ Logs détaillés dans le backend

**Fichiers modifiés:**
- `apps/api/src/services/profile.service.ts`
- `apps/api/src/routes/profile.routes.ts`
- `apps/api/src/middleware/error-handler.ts`

**Ce qui sera tracé:**
- ✅ Réception de la requête avec userId
- ✅ Recherche du profil dans la base de données
- ✅ Résultat de la recherche (trouvé/non trouvé)
- ✅ Type d'erreur levée (NotFoundError = 404, ValidationError = 400, etc.)
- ✅ Transformation de l'erreur par le middleware

---

### 2️⃣ Logs détaillés dans le mobile

**Fichier modifié:**
- `apps/mobile/app/_layout.tsx`

**Ce qui sera tracé:**
- ✅ Vérification de la disponibilité du token
- ✅ Envoi de la requête au backend
- ✅ Réponse complète du backend
- ✅ Détails de l'erreur si elle se produit

---

### 3️⃣ Script de vérification de profil

**Nouveau fichier:**
- `apps/api/scripts/check-user-profile.ts`

**Ajout dans package.json:**
- `npm run check-user-profile <userId>`

**Ce que le script vérifie:**
- ✅ Existence de l'utilisateur
- ✅ Existence du profil étudiant
- ✅ Valeur de `onboardingCompleted`
- ✅ Toutes les données du profil (système éducatif, niveau, matières, etc.)

---

## 🚀 ÉTAPES À SUIVRE

### Étape 1: Redémarrer le backend

Le backend a été compilé avec succès. **Redémarre maintenant le serveur backend** pour activer les nouveaux logs.

```bash
cd apps/api
npm run dev
```

**Attends que le serveur affiche:** `Server running on port 5001`

---

### Étape 2: Vérifier le profil en base de données

Exécute le script pour voir l'état réel du profil:

```bash
cd apps/api
npm run check-user-profile 632663fa-7df1-4768-9a0c-eff184636d4e
```

**Ce que tu devrais voir:**
- Informations de l'utilisateur (email, nom, rôle)
- Informations du profil (onboardingCompleted, système éducatif, niveau, etc.)
- Matières préférées (LevelSubjects et StreamSubjects)
- Statut final: "Onboarding is COMPLETED" ou "Onboarding is NOT completed"

---

### Étape 3: Tester l'application mobile

Une fois le backend redémarré, lance l'application mobile et observe les logs.

**Logs backend à surveiller:**
```
📥 [GET /profiles/student/:userId] Request for userId: ...
🔍 [getStudentProfile] Looking for profile with userId: ...
📋 [getStudentProfile] Profile found: { exists: true/false, ... }
✅ [getStudentProfile] Returning profile for userId: ...
```

**OU en cas d'erreur:**
```
❌ [getStudentProfile] No profile found for userId: ...
🔴 [errorHandler] Error caught: { name: ..., statusCode: ... }
📤 [errorHandler] Sending AppError response with status ...
```

**Logs mobile à surveiller:**
```
🔍 Checking student profile for user: ...
🔑 Token available: true/false
📡 Response received: { success: true/false, hasData: true/false }
📋 Profile data: { exists: true/false, onboardingCompleted: true/false }
✅ Onboarding completed, profile OK
```

**OU en cas d'erreur:**
```
⚠️ Error checking profile: { message: ..., status: ... }
❌ Needs onboarding: ...
```

---

## 🔍 HYPOTHÈSES SUR LA CAUSE

### Hypothèse 1: Token manquant ou invalide
**Symptôme:** Le backend retourne 401 (Unauthorized)

**Vérification:** Regarde le log mobile `🔑 Token available: ...`

**Solution:** Si le token est manquant, il faut vérifier pourquoi l'authentification n'a pas sauvegardé le token.

---

### Hypothèse 2: Backend pas redémarré
**Symptôme:** Le backend retourne 500 ou une erreur Prisma

**Vérification:** Regarde les logs backend pour des erreurs de compilation ou de schéma

**Solution:** Redémarre le backend après avoir exécuté `npm run build`

---

### Hypothèse 3: Erreur de validation
**Symptôme:** Le backend retourne 400 (Bad Request)

**Vérification:** Regarde le log backend `🔴 [errorHandler] Error caught: ...`

**Solution:** Vérifie que le userId est valide et que la requête est bien formée

---

### Hypothèse 4: Problème de schéma Prisma
**Symptôme:** Erreur lors de l'inclusion des relations (preferredStreamSubjects)

**Vérification:** Regarde les logs backend pour des erreurs Prisma

**Solution:** Exécute `cd apps/api && npx prisma generate` puis redémarre le backend

---

### Hypothèse 5: Profil n'existe pas réellement
**Symptôme:** Le script de vérification montre "No student profile found"

**Vérification:** Exécute le script `npm run check-user-profile`

**Solution:** L'utilisateur doit compléter l'onboarding pour créer son profil

---

## ✅ RÉSULTAT ATTENDU

Une fois les logs actifs, on devrait voir exactement:

1. **Si la requête arrive au backend** avec le bon userId et le bon token
2. **Si le profil est trouvé** dans la base de données
3. **Pourquoi une erreur est retournée** (400, 401, 404, 500)
4. **Quelle est la valeur réelle** de `onboardingCompleted` en base de données

Ensuite, on pourra corriger le problème spécifique identifié.

---

## 📝 NOTES

- Le backend a été **compilé avec succès** ✅
- Les logs sont **prêts à être activés** après redémarrage ✅
- Le script de vérification est **disponible** ✅
- L'application mobile a été **mise à jour** avec plus de logs ✅
