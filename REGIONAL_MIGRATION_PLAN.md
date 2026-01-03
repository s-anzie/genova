# Plan de Migration Régionale

## Vue d'ensemble
Migration des données régionales hardcodées vers le système de base de données centralisé.

## ✅ Déjà fait

### Backend (API)
- ✅ Tables créées: `countries`, `cities`, `phone_operators`, `country_languages`, `country_education_systems`
- ✅ Service: `regions.service.ts` avec toutes les fonctions CRUD
- ✅ Routes: `/api/regions/*` pour accéder aux données
- ✅ Seed: 3 pays (Sénégal, Cameroun, Côte d'Ivoire) avec toutes leurs données
- ✅ Champ `onboardingCompleted` ajouté aux profils

### Frontend (Mobile)
- ✅ Hooks: `useRegions.ts` avec `useCountries`, `useCities`, `useLanguages`, etc.
- ✅ Onboarding étudiant: utilise les hooks pour charger les données dynamiquement
- ✅ Onboarding tuteur: utilise les hooks pour charger pays, villes, langues
- ✅ Layouts: vérifient `onboardingCompleted` et redirigent si nécessaire

## 🔄 À faire

### 1. Supprimer le fichier hardcodé
**Fichier**: `apps/mobile/constants/regions.ts`
- ❌ Contient encore REGIONS hardcodé avec Sénégal, Cameroun, Côte d'Ivoire
- ✅ Garder uniquement les fonctions utilitaires si nécessaire
- ✅ Ou supprimer complètement et utiliser uniquement les hooks

**Action**: 
```typescript
// Supprimer REGIONS constant
// Garder seulement les types si utilisés ailleurs
```

### 2. Mettre à jour les composants de paiement

#### `apps/mobile/app/(student)/wallet/add-payment-method.tsx`
**Problème**: Hardcode `country=CM` dans la requête
```typescript
const response = await ApiClient.get<{ success: boolean; data: MobileMoneyOperator[] }>(
  '/operators?country=CM'  // ❌ Hardcodé
);
```

**Solution**: Utiliser le pays de l'utilisateur
```typescript
import { useAuth } from '@/contexts/auth-context';
import { useCountryDetails } from '@/hooks/useRegions';

const { user } = useAuth();
// Récupérer le pays depuis le profil utilisateur
const userCountry = user?.country || 'SN'; // Default Senegal
const { country } = useCountryDetails(userCountry);

// Charger les opérateurs du pays de l'utilisateur
const response = await ApiClient.get(
  `/regions/countries/${userCountry}/operators`
);
```

#### `apps/mobile/components/wallet/AddPaymentMethodModal.tsx`
**Problème**: Formatage de téléphone hardcodé
```typescript
const formatPhoneNumber = (text: string) => {
  // Format hardcodé
};
```

**Solution**: Utiliser la validation/formatage de l'API
```typescript
import { validatePhoneNumber } from '@/hooks/useRegions';

const handlePhoneChange = async (text: string) => {
  const result = await validatePhoneNumber(text, userCountry);
  if (result.formatted) {
    setPhoneNumber(result.formatted);
  }
};
```

#### `apps/mobile/components/wallet/PaymentMethodCard.tsx`
**Problème**: Formatage de téléphone hardcodé
```typescript
const formatPhoneNumber = (phone: string) => {
  const number = phone.replace(operator.phonePrefix, '');
  // ...
};
```

**Solution**: Utiliser le formatage de l'API ou stocker le numéro déjà formaté

### 3. Mettre à jour le profil utilisateur

#### Ajouter le code pays au User
**Fichier**: `apps/api/prisma/schema.prisma`

**Actuel**:
```prisma
model User {
  country  String?  // Nom du pays (ex: "Sénégal")
  city     String?  // Nom de la ville
}
```

**Proposé**:
```prisma
model User {
  countryCode  String?  // Code ISO (ex: "SN")
  city         String?  // Nom de la ville
  country      String?  // Garder pour compatibilité
}
```

**Migration**: Ajouter `countryCode` et le peupler depuis `country`

### 4. Mettre à jour les services API

#### `apps/api/src/services/tutor-search.service.ts`
**Problème**: Utilise `city` et `country` comme strings simples
```typescript
city: tutor.user.city,
country: tutor.user.country,
```

**Solution**: Enrichir avec les données régionales
```typescript
import { getCountryByCode } from './regions.service';

// Dans la réponse
const countryData = user.countryCode 
  ? await getCountryByCode(user.countryCode)
  : null;

return {
  ...tutor,
  city: user.city,
  country: countryData?.name || user.country,
  countryCode: user.countryCode,
  timezone: countryData?.timezone,
  currency: countryData?.currencySymbol,
};
```

#### `apps/api/src/services/payment.service.ts`
**Problème**: Hardcode `currency: 'eur'`
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),
  currency: 'eur',  // ❌ Hardcodé
});
```

**Solution**: Utiliser la devise du pays de l'utilisateur
```typescript
import { getCountryByCode } from './regions.service';

const user = await prisma.user.findUnique({ where: { id: userId } });
const country = user.countryCode 
  ? await getCountryByCode(user.countryCode)
  : null;

// Mapper XOF/XAF vers EUR pour Stripe (ou utiliser un service de conversion)
const stripeCurrency = mapToStripeCurrency(country?.currencyCode || 'XOF');

const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),
  currency: stripeCurrency,
});
```

### 5. Créer des utilitaires de conversion

**Fichier**: `apps/api/src/utils/currency.ts`
```typescript
export function mapToStripeCurrency(currencyCode: string): string {
  // Stripe ne supporte pas XOF/XAF directement
  // Utiliser EUR comme proxy ou un service de conversion
  const mapping: Record<string, string> = {
    'XOF': 'eur',
    'XAF': 'eur',
    'GHS': 'ghs',
    'NGN': 'ngn',
  };
  return mapping[currencyCode] || 'eur';
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string
): number {
  // Taux de change simplifiés (en production, utiliser une API)
  const rates: Record<string, number> = {
    'XOF_EUR': 0.0015,
    'XAF_EUR': 0.0015,
    'EUR_XOF': 655.957,
    'EUR_XAF': 655.957,
  };
  
  const key = `${from}_${to}`;
  return rates[key] ? amount * rates[key] : amount;
}
```

### 6. Mettre à jour les tests

#### Tests à modifier:
- `apps/api/src/services/__tests__/payment.service.test.ts`
- `apps/api/src/services/__tests__/profile.service.test.ts`
- `apps/api/src/services/__tests__/tutor-search.service.test.ts`

**Action**: Utiliser des données de test cohérentes avec le nouveau système

## 📋 Checklist de migration

### Phase 1: Backend
- [x] Ajouter `countryCode` au modèle User
- [x] Créer migration pour peupler `countryCode` depuis `country`
- [x] Créer utilitaires de conversion de devise
- [x] Mettre à jour `payment.service.ts` pour utiliser la devise du pays
- [x] Mettre à jour `tutor-search.service.ts` pour enrichir les données
- [ ] Mettre à jour les tests

### Phase 2: Frontend
- [ ] Supprimer/nettoyer `apps/mobile/constants/regions.ts`
- [x] Mettre à jour `add-payment-method.tsx` pour utiliser le pays de l'utilisateur
- [ ] Mettre à jour `AddPaymentMethodModal.tsx` pour utiliser la validation API
- [ ] Mettre à jour `PaymentMethodCard.tsx` pour le formatage
- [x] Tester le flux complet d'onboarding
- [ ] Tester le flux de paiement

### Phase 3: Validation
- [ ] Tester avec un utilisateur Sénégalais
- [ ] Tester avec un utilisateur Camerounais
- [ ] Tester avec un utilisateur Ivoirien
- [ ] Vérifier que les numéros de téléphone sont correctement validés
- [ ] Vérifier que les devises sont correctement affichées
- [ ] Vérifier que les paiements fonctionnent

## 🎯 Priorités

### Haute priorité
1. ✅ Onboarding (déjà fait)
2. Ajouter `countryCode` au User
3. Mettre à jour les composants de paiement

### Moyenne priorité
4. Enrichir les données de recherche de tuteur
5. Conversion de devise pour Stripe
6. Nettoyer le fichier hardcodé

### Basse priorité
7. Mettre à jour tous les tests
8. Ajouter plus de pays

## 📝 Notes

- **Compatibilité**: Garder `country` (string) pour compatibilité ascendante
- **Performance**: Mettre en cache les données régionales côté client
- **Fallback**: Toujours avoir un pays par défaut (Sénégal)
- **Validation**: Valider les numéros de téléphone côté serveur ET client
- **Tests**: Ajouter des tests pour chaque pays supporté
