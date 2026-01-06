# Fix: Erreur "EDUCATION_SYSTEMS doesn't exist"

## Problème
L'erreur `Property 'EDUCATION_SYSTEMS' doesn't exist` apparaît alors que le code a été mis à jour et ne contient plus cette constante.

## Cause
Le bundler Metro (React Native) a mis en cache l'ancienne version du fichier.

## Solution

### Option 1: Nettoyer le cache Metro (RECOMMANDÉ)
```bash
cd apps/mobile

# Arrêter le serveur Metro s'il tourne
# Puis nettoyer le cache
npx expo start --clear

# Ou avec npm
npm start -- --clear

# Ou avec yarn
yarn start --clear
```

### Option 2: Nettoyer complètement
```bash
cd apps/mobile

# Supprimer tous les caches
rm -rf node_modules/.cache
rm -rf .expo
rm -rf dist

# Redémarrer
npx expo start --clear
```

### Option 3: Reset complet (si les options précédentes ne fonctionnent pas)
```bash
cd apps/mobile

# Supprimer node_modules
rm -rf node_modules

# Réinstaller
npm install

# Démarrer avec cache nettoyé
npx expo start --clear
```

## Vérification

Après avoir nettoyé le cache, l'application devrait se recharger et utiliser le nouveau code qui:
- ✅ Utilise `useCountries()` pour récupérer les pays
- ✅ Utilise `useEducationSystems()` pour récupérer les systèmes
- ✅ Utilise `useEducationLevels()` pour récupérer les niveaux
- ✅ Utilise `useLevelSubjects()` pour récupérer les matières
- ✅ N'utilise plus les constantes hardcodées

## Note importante

Ce type d'erreur est courant lors du développement React Native quand on fait des changements importants dans le code. Le cache Metro peut parfois garder d'anciennes versions des fichiers.

**Toujours utiliser `--clear` après des modifications importantes!**
