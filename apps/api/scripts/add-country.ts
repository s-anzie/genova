/**
 * Interactive script to add a new country to the database
 * Usage: npx ts-node scripts/add-country.ts
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🌍 Add New Country to Genova\n');

  // Basic Info
  const code = (await question('Country Code (ISO 3166-1 alpha-2, e.g., GH): ')).toUpperCase();
  const name = await question('Country Name (e.g., Ghana): ');

  // Phone
  const phoneCode = await question('Phone Code (e.g., +233): ');
  const phoneRegex = await question('Phone Regex (e.g., ^(\\+233|233)?[0-9]{9}$): ');
  const phoneFormat = await question('Phone Format (e.g., +233 XX XXX XXXX): ');
  const phoneExample = await question('Phone Example (e.g., +233 24 123 4567): ');

  // Currency
  const currencyCode = await question('Currency Code (ISO 4217, e.g., GHS): ');
  const currencyName = await question('Currency Name (e.g., Cedi): ');
  const currencySymbol = await question('Currency Symbol (e.g., GH₵): ');

  // Timezone
  const timezone = await question('Timezone (IANA, e.g., Africa/Accra): ');

  // Sort Order
  const sortOrderStr = await question('Sort Order (number, e.g., 4): ');
  const sortOrder = parseInt(sortOrderStr) || 0;

  console.log('\n📝 Creating country...');

  const country = await prisma.country.create({
    data: {
      code,
      name,
      phoneCode,
      phoneRegex,
      phoneFormat,
      phoneExample,
      currencyCode,
      currencyName,
      currencySymbol,
      timezone,
      isActive: true,
      sortOrder,
    },
  });

  console.log(`✅ Country created: ${country.name} (${country.code})\n`);

  // Add Cities
  const addCities = await question('Add cities? (y/n): ');
  if (addCities.toLowerCase() === 'y') {
    console.log('Enter city names (one per line, empty line to finish):');
    const cities: string[] = [];
    while (true) {
      const city = await question('City: ');
      if (!city.trim()) break;
      cities.push(city.trim());
    }

    for (const [index, cityName] of cities.entries()) {
      await prisma.city.create({
        data: {
          countryId: country.id,
          name: cityName,
          sortOrder: index,
        },
      });
    }
    console.log(`✅ Added ${cities.length} cities\n`);
  }

  // Add Operators
  const addOperators = await question('Add phone operators? (y/n): ');
  if (addOperators.toLowerCase() === 'y') {
    console.log('Enter operators (empty name to finish):');
    while (true) {
      const operatorName = await question('Operator name: ');
      if (!operatorName.trim()) break;

      const prefixesStr = await question('Prefixes (comma-separated, e.g., 24,25,26): ');
      const prefixes = prefixesStr.split(',').map((p) => p.trim());

      const regex = await question('Regex pattern: ');

      await prisma.phoneOperator.create({
        data: {
          countryId: country.id,
          name: operatorName,
          prefixes,
          regex,
        },
      });
      console.log(`✅ Added operator: ${operatorName}`);
    }
    console.log();
  }

  // Add Languages
  const addLanguages = await question('Add languages? (y/n): ');
  if (addLanguages.toLowerCase() === 'y') {
    console.log('Enter languages (empty name to finish):');
    let sortOrder = 0;
    while (true) {
      const languageName = await question('Language name: ');
      if (!languageName.trim()) break;

      const code = await question('Language code (ISO 639-1, optional): ');
      const isOfficialStr = await question('Is official? (y/n): ');
      const isOfficial = isOfficialStr.toLowerCase() === 'y';

      await prisma.countryLanguage.create({
        data: {
          countryId: country.id,
          name: languageName,
          code: code || null,
          isOfficial,
          sortOrder: sortOrder++,
        },
      });
      console.log(`✅ Added language: ${languageName}`);
    }
    console.log();
  }

  // Add Education Systems
  const addEducation = await question('Add education systems? (y/n): ');
  if (addEducation.toLowerCase() === 'y') {
    console.log('Enter education systems (empty name to finish):');
    let sortOrder = 0;
    while (true) {
      const systemName = await question('System name (e.g., FRENCH): ');
      if (!systemName.trim()) break;

      const label = await question('Display label (e.g., Système Français): ');

      await prisma.countryEducationSystem.create({
        data: {
          countryId: country.id,
          name: systemName.toUpperCase(),
          label,
          sortOrder: sortOrder++,
        },
      });
      console.log(`✅ Added education system: ${systemName}`);
    }
    console.log();
  }

  console.log('🎉 Country setup complete!\n');
  console.log('Summary:');
  console.log(`- Country: ${country.name} (${country.code})`);
  console.log(`- Phone: ${country.phoneCode}`);
  console.log(`- Currency: ${country.currencySymbol}`);
  console.log(`- Timezone: ${country.timezone}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
