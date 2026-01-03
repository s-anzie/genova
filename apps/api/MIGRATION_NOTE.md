# Note de Migration - countryCode

## Erreurs TypeScript Temporaires

Après l'ajout du champ `countryCode` au modèle User dans le schema Prisma, vous verrez des erreurs TypeScript dans `tutor-search.service.ts` indiquant que `countryCode` n'existe pas dans `UserSelect`.

## Solution

Ces erreurs sont normales et seront résolues automatiquement après la régénération du client Prisma:

```bash
cd apps/api
npx prisma generate
```

## Pourquoi ces erreurs?

Le client Prisma génère des types TypeScript basés sur le schema. Quand vous ajoutez un nouveau champ:
1. Le schema est mis à jour ✅
2. La migration est créée et appliquée ✅
3. Le client Prisma doit être régénéré pour mettre à jour les types TypeScript

## Vérification

Après `npx prisma generate`, vérifiez que les erreurs ont disparu:

```bash
npm run type-check
# ou
npx tsc --noEmit
```

## Fichiers Affectés

- `apps/api/src/services/tutor-search.service.ts` - Utilise `countryCode` dans les selects
- Tous les fichiers qui utilisent les types Prisma générés

## Status

- ✅ Schema mis à jour
- ✅ Migration appliquée (`add_country_code_to_user`)
- ⏳ Client Prisma à régénérer (fait automatiquement lors du prochain build)
