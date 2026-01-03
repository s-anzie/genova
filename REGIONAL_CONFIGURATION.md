# Regional Configuration System

## Overview
The regional configuration system manages country-specific settings dynamically through the database, allowing easy expansion to new countries without code changes.

## Database Structure

### Tables

#### `countries`
Stores country-level configuration:
- Basic info: code, name
- Phone: phoneCode, phoneRegex, phoneFormat, phoneExample
- Currency: currencyCode, currencyName, currencySymbol
- Timezone: IANA timezone identifier
- Status: isActive, sortOrder

#### `cities`
Cities within each country:
- Linked to country via `countryId`
- Optional region/state field
- Sortable and can be activated/deactivated

#### `phone_operators`
Mobile network operators per country:
- Name (e.g., Orange, MTN)
- Prefixes (array of number prefixes)
- Regex for validation
- Linked to country

#### `country_languages`
Languages spoken in each country:
- Name and ISO code
- Official language flag
- Sortable

#### `country_education_systems`
Education systems available per country:
- Name (e.g., FRENCH, ANGLOPHONE)
- Display label
- Can be activated/deactivated

## Initial Setup

### 1. Run Migration
```bash
cd apps/api
npx prisma migrate dev --name add_regional_config
```

### 2. Seed Data
```bash
cd apps/api
npx ts-node prisma/seeds/regions.seed.ts
```

This will populate:
- **Sénégal** (SN): 16 cities, 3 operators, 4 languages, 2 education systems
- **Cameroun** (CM): 16 cities, 4 operators, 5 languages, 3 education systems
- **Côte d'Ivoire** (CI): 15 cities, 3 operators, 5 languages, 1 education system

## API Endpoints

### Get All Countries
```
GET /api/regions/countries
```
Returns list of active countries with basic info.

### Get Country Details
```
GET /api/regions/countries/:code
```
Returns full country details including cities, operators, languages, and education systems.

### Get Cities
```
GET /api/regions/countries/:code/cities
```
Returns cities for a specific country.

### Get Operators
```
GET /api/regions/countries/:code/operators
```
Returns phone operators for a specific country.

### Get Languages
```
GET /api/regions/countries/:code/languages
```
Returns languages for a specific country.

### Get Education Systems
```
GET /api/regions/countries/:code/education-systems
```
Returns education systems for a specific country.

### Validate Phone Number
```
POST /api/regions/validate-phone
Body: { phone: string, countryCode: string }
```
Validates phone number and detects operator.

## Mobile Usage

### React Hooks

```typescript
import { useCountries, useCountryDetails, useCities } from '@/hooks/useRegions';

// Get all countries
const { countries, loading } = useCountries();

// Get country details
const { country } = useCountryDetails('SN');

// Get cities for a country
const { cities } = useCities('SN');
```

### Example: Onboarding Form

```typescript
const { countries } = useCountries();
const { cities } = useCities(selectedCountryCode);
const { languages } = useLanguages(selectedCountryCode);

// Display countries
{countries.map(country => (
  <option key={country.code} value={country.code}>
    {country.name}
  </option>
))}

// Display cities
{cities.map(city => (
  <option key={city.id} value={city.name}>
    {city.name}
  </option>
))}
```

## Adding a New Country

### Option 1: Via Database (Recommended)
Use a database client or admin panel to insert:

1. **Country record**:
```sql
INSERT INTO countries (code, name, phone_code, phone_regex, phone_format, phone_example, currency_code, currency_name, currency_symbol, timezone, is_active, sort_order)
VALUES ('GH', 'Ghana', '+233', '^(\+233|233)?[0-9]{9}$', '+233 XX XXX XXXX', '+233 24 123 4567', 'GHS', 'Cedi', 'GH₵', 'Africa/Accra', true, 4);
```

2. **Cities**:
```sql
INSERT INTO cities (country_id, name, sort_order)
VALUES 
  ((SELECT id FROM countries WHERE code = 'GH'), 'Accra', 0),
  ((SELECT id FROM countries WHERE code = 'GH'), 'Kumasi', 1);
```

3. **Operators, Languages, Education Systems** (similar pattern)

### Option 2: Via Seed Script
Add to `apps/api/prisma/seeds/regions.seed.ts`:

```typescript
const ghana = await prisma.country.upsert({
  where: { code: 'GH' },
  update: {},
  create: {
    code: 'GH',
    name: 'Ghana',
    phoneCode: '+233',
    phoneRegex: '^(\\+233|233)?[0-9]{9}$',
    phoneFormat: '+233 XX XXX XXXX',
    phoneExample: '+233 24 123 4567',
    currencyCode: 'GHS',
    currencyName: 'Cedi',
    currencySymbol: 'GH₵',
    timezone: 'Africa/Accra',
    isActive: true,
    sortOrder: 4,
  },
});

// Add cities, operators, etc.
```

Then run: `npx ts-node prisma/seeds/regions.seed.ts`

## Phone Number Validation

### How It Works
1. Country regex validates format
2. Operator regex detects specific operator
3. Formatting applies country-specific rules

### Example
```typescript
import { validatePhoneNumber } from '@/hooks/useRegions';

const result = await validatePhoneNumber('771234567', 'SN');
// {
//   isValid: true,
//   operator: 'Orange',
//   formatted: '+221 77 123 45 67'
// }
```

## Currency Handling

Each country has currency information:
- **Code**: ISO 4217 (XOF, XAF, GHS)
- **Name**: Full name (Franc CFA, Cedi)
- **Symbol**: Display symbol (FCFA, GH₵)

### Display Currency
```typescript
const { country } = useCountryDetails('SN');
const formatted = `${amount.toLocaleString()} ${country.currencySymbol}`;
// "5000 FCFA"
```

## Education Systems

Different countries have different education systems:
- **Sénégal**: French, Senegalese
- **Cameroun**: French, Anglophone, Bilingual
- **Côte d'Ivoire**: French

These are used in onboarding to show relevant options.

## Admin Management

### Future: Admin Panel
Create an admin interface to:
- Add/edit/delete countries
- Manage cities, operators, languages
- Activate/deactivate regions
- Update phone regex patterns
- Reorder items (sortOrder)

### Deactivating a Country
```sql
UPDATE countries SET is_active = false WHERE code = 'XX';
```

This hides the country from all API responses without deleting data.

## Best Practices

1. **Always use country code** (ISO 3166-1 alpha-2) as identifier
2. **Test phone regex** thoroughly before deploying
3. **Keep sortOrder** logical (alphabetical or by importance)
4. **Mark official languages** for better UX
5. **Use IANA timezones** for accurate time handling
6. **Validate currency codes** against ISO 4217

## Migration Path

### From Hardcoded to Database
1. Deploy database changes
2. Run seed script
3. Update mobile app to use hooks
4. Remove hardcoded constants
5. Test thoroughly in each region

### Rollback Plan
Keep `apps/mobile/constants/regions.ts` as fallback:
```typescript
// Fallback if API fails
const FALLBACK_REGIONS = { ... };
```

## Performance Considerations

- Countries list is small (~3-10 items), cache on client
- Cities list can be larger (~15-50 per country), load on demand
- Use React Query or similar for caching
- Consider CDN for static regional data

## Security

- No authentication required for read endpoints (public data)
- Admin endpoints (create/update/delete) require authentication
- Validate all inputs server-side
- Sanitize regex patterns to prevent ReDoS attacks

## Future Enhancements

- [ ] Admin panel for managing regions
- [ ] Multi-language support (translate city/country names)
- [ ] Exchange rate API integration
- [ ] Postal code validation per country
- [ ] Address format templates
- [ ] Holiday calendars per country
- [ ] Tax rate configuration
- [ ] Payment method availability per country
