import { prisma } from '../lib/prisma';
import { AppError } from '@repo/utils';

export async function getAllCountries() {
  return prisma.country.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      phoneCode: true,
      phoneFormat: true,
      phoneExample: true,
      currencyCode: true,
      currencyName: true,
      currencySymbol: true,
      timezone: true,
    },
  });
}

export async function getCountryByCode(code: string) {
  const country = await prisma.country.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      cities: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      operators: {
        where: { isActive: true },
      },
      languages: {
        orderBy: { sortOrder: 'asc' },
      },
      educationSystems: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!country) {
    throw new AppError('Country not found', 'NOT_FOUND', 404);
  }

  return country;
}

export async function getCitiesByCountry(countryCode: string) {
  const country = await prisma.country.findUnique({
    where: { code: countryCode.toUpperCase() },
  });

  if (!country) {
    throw new AppError('Country not found', 'NOT_FOUND', 404);
  }

  return prisma.city.findMany({
    where: {
      countryId: country.id,
      isActive: true,
    },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      region: true,
    },
  });
}

export async function getOperatorsByCountry(countryCode: string) {
  const country = await prisma.country.findUnique({
    where: { code: countryCode.toUpperCase() },
  });

  if (!country) {
    throw new AppError('Country not found', 'NOT_FOUND', 404);
  }

  return prisma.phoneOperator.findMany({
    where: {
      countryId: country.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      prefixes: true,
      regex: true,
    },
  });
}

export async function getLanguagesByCountry(countryCode: string) {
  const country = await prisma.country.findUnique({
    where: { code: countryCode.toUpperCase() },
  });

  if (!country) {
    throw new AppError('Country not found', 'NOT_FOUND', 404);
  }

  return prisma.countryLanguage.findMany({
    where: {
      countryId: country.id,
    },
    orderBy: [
      { isOfficial: 'desc' },
      { sortOrder: 'asc' },
    ],
    select: {
      id: true,
      name: true,
      code: true,
      isOfficial: true,
    },
  });
}

export async function getEducationSystemsByCountry(countryCode: string) {
  const country = await prisma.country.findUnique({
    where: { code: countryCode.toUpperCase() },
  });

  if (!country) {
    throw new AppError('Country not found', 'NOT_FOUND', 404);
  }

  return prisma.countryEducationSystem.findMany({
    where: {
      countryId: country.id,
      isActive: true,
    },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      label: true,
    },
  });
}

export async function validatePhoneNumber(phone: string, countryCode: string) {
  const country = await prisma.country.findUnique({
    where: { code: countryCode.toUpperCase() },
    include: {
      operators: {
        where: { isActive: true },
      },
    },
  });

  if (!country) {
    throw new AppError('Country not found', 'NOT_FOUND', 404);
  }

  // Validate against country regex
  const countryRegex = new RegExp(country.phoneRegex);
  const isValid = countryRegex.test(phone);

  if (!isValid) {
    return {
      isValid: false,
      operator: null,
      formatted: null,
    };
  }

  // Detect operator
  let detectedOperator = null;
  for (const operator of country.operators) {
    const operatorRegex = new RegExp(operator.regex);
    if (operatorRegex.test(phone)) {
      detectedOperator = operator.name;
      break;
    }
  }

  // Format phone number
  const digits = phone.replace(/\D/g, '');
  const phoneCode = country.phoneCode.replace('+', '');
  const localNumber = digits.startsWith(phoneCode)
    ? digits.slice(phoneCode.length)
    : digits;

  let formatted = phone;
  // Apply country-specific formatting
  switch (countryCode.toUpperCase()) {
    case 'SN':
      if (localNumber.length === 9) {
        formatted = `${country.phoneCode} ${localNumber.slice(0, 2)} ${localNumber.slice(2, 5)} ${localNumber.slice(5, 7)} ${localNumber.slice(7)}`;
      }
      break;
    case 'CM':
      if (localNumber.length === 9) {
        formatted = `${country.phoneCode} ${localNumber.slice(0, 1)} ${localNumber.slice(1, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5, 7)} ${localNumber.slice(7)}`;
      }
      break;
    case 'CI':
      if (localNumber.length === 10) {
        formatted = `${country.phoneCode} ${localNumber.slice(0, 2)} ${localNumber.slice(2, 4)} ${localNumber.slice(4, 6)} ${localNumber.slice(6, 8)} ${localNumber.slice(8)}`;
      }
      break;
  }

  return {
    isValid: true,
    operator: detectedOperator,
    formatted,
  };
}
