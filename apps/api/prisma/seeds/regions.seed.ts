import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRegions() {
  console.log('🌍 Seeding regional data...');

  try {
    // Clean up existing data in correct order (children first)
    console.log('🧹 Cleaning up existing regional data...');
    await prisma.countryEducationSystem.deleteMany({});
    await prisma.countryLanguage.deleteMany({});
    await prisma.phoneOperator.deleteMany({});
    await prisma.city.deleteMany({});
    await prisma.country.deleteMany({});

    // ============================================================================
    // SENEGAL
    // ============================================================================
    console.log('🇸🇳 Creating Senegal...');
    
    const senegal = await prisma.country.create({
      data: {
        code: 'SN',
        name: 'Sénégal',
        phoneCode: '+221',
        phoneRegex: '^(\\+221|221)?[0-9]{9}$',
        phoneFormat: '+221 XX XXX XX XX',
        phoneExample: '+221 77 123 45 67',
        currencyCode: 'XOF',
        currencyName: 'Franc CFA',
        currencySymbol: 'FCFA',
        timezone: 'Africa/Dakar',
        isActive: true,
        sortOrder: 1,
      },
    });

    // Senegal Cities
    const senegalCitiesData = [
      'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor',
      'Diourbel', 'Louga', 'Tambacounda', 'Kolda', 'Matam',
      'Kaffrine', 'Kédougou', 'Sédhiou', 'Fatick', 'Rufisque', 'Mbour',
    ];

    await prisma.city.createMany({
      data: senegalCitiesData.map((name, index) => ({
        countryId: senegal.id,
        name,
        sortOrder: index,
        isActive: true,
      })),
    });

    // Senegal Operators
    await prisma.phoneOperator.createMany({
      data: [
        {
          countryId: senegal.id,
          name: 'Orange',
          prefixes: ['77', '78'],
          regex: '^(\\+221|221)?(77|78)[0-9]{7}$',
          isActive: true,
        },
        {
          countryId: senegal.id,
          name: 'Free',
          prefixes: ['76'],
          regex: '^(\\+221|221)?76[0-9]{7}$',
          isActive: true,
        },
        {
          countryId: senegal.id,
          name: 'Expresso',
          prefixes: ['70'],
          regex: '^(\\+221|221)?70[0-9]{7}$',
          isActive: true,
        },
      ],
    });

    // Senegal Languages
    await prisma.countryLanguage.createMany({
      data: [
        { countryId: senegal.id, name: 'Français', code: 'fr', isOfficial: true, sortOrder: 0 },
        { countryId: senegal.id, name: 'Wolof', code: 'wo', isOfficial: false, sortOrder: 1 },
        { countryId: senegal.id, name: 'Pulaar', code: 'ff', isOfficial: false, sortOrder: 2 },
        { countryId: senegal.id, name: 'Serer', code: 'sr', isOfficial: false, sortOrder: 3 },
      ],
    });

    // Senegal Education Systems
    await prisma.countryEducationSystem.createMany({
      data: [
        { countryId: senegal.id, name: 'FRENCH', label: 'Système Français', isActive: true, sortOrder: 0 },
        { countryId: senegal.id, name: 'SENEGALESE', label: 'Système Sénégalais', isActive: true, sortOrder: 1 },
      ],
    });

    console.log('✅ Senegal created with cities, operators, languages, and education systems');

    // ============================================================================
    // CAMEROON
    // ============================================================================
    console.log('🇨🇲 Creating Cameroon...');
    
    const cameroon = await prisma.country.create({
      data: {
        code: 'CM',
        name: 'Cameroun',
        phoneCode: '+237',
        phoneRegex: '^(\\+237|237)?[0-9]{9}$',
        phoneFormat: '+237 X XX XX XX XX',
        phoneExample: '+237 6 77 12 34 56',
        currencyCode: 'XAF',
        currencyName: 'Franc CFA',
        currencySymbol: 'FCFA',
        timezone: 'Africa/Douala',
        isActive: true,
        sortOrder: 2,
      },
    });

    // Cameroon Cities
    const cameroonCitiesData = [
      'Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Bafoussam',
      'Maroua', 'Ngaoundéré', 'Bertoua', 'Loum', 'Kumba',
      'Nkongsamba', 'Buea', 'Limbé', 'Edéa', 'Kribi', 'Ebolowa',
    ];

    await prisma.city.createMany({
      data: cameroonCitiesData.map((name, index) => ({
        countryId: cameroon.id,
        name,
        sortOrder: index,
        isActive: true,
      })),
    });

    // Cameroon Operators
    await prisma.phoneOperator.createMany({
      data: [
        {
          countryId: cameroon.id,
          name: 'MTN',
          prefixes: ['67', '650', '651', '652', '653', '654'],
          regex: '^(\\+237|237)?(67|65[0-4])[0-9]{6,7}$',
          isActive: true,
        },
        {
          countryId: cameroon.id,
          name: 'Orange',
          prefixes: ['69', '655', '656', '657', '658', '659'],
          regex: '^(\\+237|237)?(69|65[5-9])[0-9]{6,7}$',
          isActive: true,
        },
        {
          countryId: cameroon.id,
          name: 'Nexttel',
          prefixes: ['66'],
          regex: '^(\\+237|237)?66[0-9]{7}$',
          isActive: true,
        },
        {
          countryId: cameroon.id,
          name: 'Camtel',
          prefixes: ['62', '242', '243'],
          regex: '^(\\+237|237)?(62|24[23])[0-9]{6,7}$',
          isActive: true,
        },
      ],
    });

    // Cameroon Languages
    await prisma.countryLanguage.createMany({
      data: [
        { countryId: cameroon.id, name: 'Français', code: 'fr', isOfficial: true, sortOrder: 0 },
        { countryId: cameroon.id, name: 'Anglais', code: 'en', isOfficial: true, sortOrder: 1 },
        { countryId: cameroon.id, name: 'Fulfulde', code: 'ff', isOfficial: false, sortOrder: 2 },
        { countryId: cameroon.id, name: 'Ewondo', code: null, isOfficial: false, sortOrder: 3 },
        { countryId: cameroon.id, name: 'Duala', code: null, isOfficial: false, sortOrder: 4 },
      ],
    });

    // Cameroon Education Systems
    await prisma.countryEducationSystem.createMany({
      data: [
        { countryId: cameroon.id, name: 'FRENCH', label: 'Système Français', isActive: true, sortOrder: 0 },
        { countryId: cameroon.id, name: 'ANGLOPHONE', label: 'Système Anglophone', isActive: true, sortOrder: 1 },
        { countryId: cameroon.id, name: 'BILINGUAL', label: 'Bilingue', isActive: true, sortOrder: 2 },
      ],
    });

    console.log('✅ Cameroon created with cities, operators, languages, and education systems');

    // ============================================================================
    // CÔTE D'IVOIRE
    // ============================================================================
    console.log('🇨🇮 Creating Côte d\'Ivoire...');
    
    const coteDivoire = await prisma.country.create({
      data: {
        code: 'CI',
        name: "Côte d'Ivoire",
        phoneCode: '+225',
        phoneRegex: '^(\\+225|225)?[0-9]{10}$',
        phoneFormat: '+225 XX XX XX XX XX',
        phoneExample: '+225 07 12 34 56 78',
        currencyCode: 'XOF',
        currencyName: 'Franc CFA',
        currencySymbol: 'FCFA',
        timezone: 'Africa/Abidjan',
        isActive: true,
        sortOrder: 3,
      },
    });

    // Côte d'Ivoire Cities
    const coteDivoireCitiesData = [
      'Abidjan', 'Bouaké', 'Daloa', 'San-Pédro', 'Yamoussoukro',
      'Korhogo', 'Man', 'Gagnoa', 'Divo', 'Abengourou',
      'Grand-Bassam', 'Bondoukou', 'Séguéla', 'Odienné', 'Soubré',
    ];

    await prisma.city.createMany({
      data: coteDivoireCitiesData.map((name, index) => ({
        countryId: coteDivoire.id,
        name,
        sortOrder: index,
        isActive: true,
      })),
    });

    // Côte d'Ivoire Operators
    await prisma.phoneOperator.createMany({
      data: [
        {
          countryId: coteDivoire.id,
          name: 'Orange',
          prefixes: ['07', '08', '09'],
          regex: '^(\\+225|225)?0[789][0-9]{8}$',
          isActive: true,
        },
        {
          countryId: coteDivoire.id,
          name: 'MTN',
          prefixes: ['05', '06'],
          regex: '^(\\+225|225)?0[56][0-9]{8}$',
          isActive: true,
        },
        {
          countryId: coteDivoire.id,
          name: 'Moov',
          prefixes: ['01', '02', '03'],
          regex: '^(\\+225|225)?0[123][0-9]{8}$',
          isActive: true,
        },
      ],
    });

    // Côte d'Ivoire Languages
    await prisma.countryLanguage.createMany({
      data: [
        { countryId: coteDivoire.id, name: 'Français', code: 'fr', isOfficial: true, sortOrder: 0 },
        { countryId: coteDivoire.id, name: 'Dioula', code: null, isOfficial: false, sortOrder: 1 },
        { countryId: coteDivoire.id, name: 'Baoulé', code: null, isOfficial: false, sortOrder: 2 },
        { countryId: coteDivoire.id, name: 'Bété', code: null, isOfficial: false, sortOrder: 3 },
        { countryId: coteDivoire.id, name: 'Sénoufo', code: null, isOfficial: false, sortOrder: 4 },
      ],
    });

    // Côte d'Ivoire Education Systems
    await prisma.countryEducationSystem.createMany({
      data: [
        { countryId: coteDivoire.id, name: 'FRENCH', label: 'Système Français', isActive: true, sortOrder: 0 },
      ],
    });

    console.log('✅ Côte d\'Ivoire created with cities, operators, languages, and education systems');
    
    // Summary
    const countriesCount = await prisma.country.count();
    const citiesCount = await prisma.city.count();
    const operatorsCount = await prisma.phoneOperator.count();
    const languagesCount = await prisma.countryLanguage.count();
    const systemsCount = await prisma.countryEducationSystem.count();

    console.log('\n📊 Summary:');
    console.log(`   Countries: ${countriesCount}`);
    console.log(`   Cities: ${citiesCount}`);
    console.log(`   Operators: ${operatorsCount}`);
    console.log(`   Languages: ${languagesCount}`);
    console.log(`   Education Systems: ${systemsCount}`);
    console.log('\n✅ Regional data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding regions:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedRegions()
    .catch((e) => {
      console.error('❌ Fatal error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
