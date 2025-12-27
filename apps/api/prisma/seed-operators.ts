import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Cameroon operators...');

  const operators = [
    {
      code: 'ORANGE_MONEY_CM',
      name: 'Orange Money',
      displayName: 'Orange Money Cameroun',
      provider: 'ORANGE_MONEY',
      country: 'CM',
      countryName: 'Cameroun',
      currency: 'XAF',
      phonePrefix: '+237',
      phoneFormat: 'XX XX XX XX XX',
      phoneLength: 9,
      color: '#FF6600',
      supportedFeatures: {
        withdrawal: true,
        deposit: true,
        transfer: true,
      },
      fees: {
        withdrawal: { min: 0, max: 2.5, type: 'percentage' },
        deposit: { min: 0, max: 1.5, type: 'percentage' },
      },
      limits: {
        daily: 500000,
        monthly: 2000000,
        perTransaction: 100000,
      },
    },
    {
      code: 'MTN_MOMO_CM',
      name: 'MTN Mobile Money',
      displayName: 'MTN Mobile Money Cameroun',
      provider: 'MTN_MOBILE_MONEY',
      country: 'CM',
      countryName: 'Cameroun',
      currency: 'XAF',
      phonePrefix: '+237',
      phoneFormat: 'XX XX XX XX XX',
      phoneLength: 9,
      color: '#FFCC00',
      supportedFeatures: {
        withdrawal: true,
        deposit: true,
        transfer: true,
      },
      fees: {
        withdrawal: { min: 0, max: 2.5, type: 'percentage' },
        deposit: { min: 0, max: 1.5, type: 'percentage' },
      },
      limits: {
        daily: 500000,
        monthly: 2000000,
        perTransaction: 100000,
      },
    },
    {
      code: 'MOOV_MONEY_CM',
      name: 'Moov Money',
      displayName: 'Moov Money Cameroun',
      provider: 'MOOV_MONEY',
      country: 'CM',
      countryName: 'Cameroun',
      currency: 'XAF',
      phonePrefix: '+237',
      phoneFormat: 'XX XX XX XX XX',
      phoneLength: 9,
      color: '#009FE3',
      supportedFeatures: {
        withdrawal: true,
        deposit: true,
        transfer: true,
      },
      fees: {
        withdrawal: { min: 0, max: 2.5, type: 'percentage' },
        deposit: { min: 0, max: 1.5, type: 'percentage' },
      },
      limits: {
        daily: 500000,
        monthly: 2000000,
        perTransaction: 100000,
      },
    },
  ];

  let created = 0;
  for (const op of operators) {
    const existing = await prisma.mobileMoneyOperator.findUnique({
      where: { code: op.code },
    });

    if (!existing) {
      await prisma.mobileMoneyOperator.create({
        data: op as any,
      });
      created++;
      console.log(`✅ Created operator: ${op.name}`);
    } else {
      console.log(`⏭️  Operator already exists: ${op.name}`);
    }
  }

  console.log(`\n🎉 Seeded ${created} operators`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding operators:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
