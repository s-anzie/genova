/**
 * Regional Configuration
 * Manages country-specific settings for the application
 */

export interface PhoneOperator {
  name: string;
  prefixes: string[];
  regex: RegExp;
}

export interface RegionConfig {
  code: string;
  name: string;
  currency: {
    code: string;
    symbol: string;
    name: string;
  };
  phoneCode: string;
  phoneRegex: RegExp;
  phoneFormat: string;
  phoneExample: string;
  operators: PhoneOperator[];
  cities: string[];
  educationSystems: string[];
  languages: string[];
  timezone: string;
}

export const REGIONS: Record<string, RegionConfig> = {
  SN: {
    code: 'SN',
    name: 'Sénégal',
    currency: {
      code: 'XOF',
      symbol: 'FCFA',
      name: 'Franc CFA',
    },
    phoneCode: '+221',
    phoneRegex: /^(\+221|221)?[0-9]{9}$/,
    phoneFormat: '+221 XX XXX XX XX',
    phoneExample: '+221 77 123 45 67',
    operators: [
      {
        name: 'Orange',
        prefixes: ['77', '78'],
        regex: /^(\+221|221)?(77|78)[0-9]{7}$/,
      },
      {
        name: 'Free',
        prefixes: ['76'],
        regex: /^(\+221|221)?76[0-9]{7}$/,
      },
      {
        name: 'Expresso',
        prefixes: ['70'],
        regex: /^(\+221|221)?70[0-9]{7}$/,
      },
    ],
    cities: [
      'Dakar',
      'Thiès',
      'Saint-Louis',
      'Kaolack',
      'Ziguinchor',
      'Diourbel',
      'Louga',
      'Tambacounda',
      'Kolda',
      'Matam',
      'Kaffrine',
      'Kédougou',
      'Sédhiou',
      'Fatick',
      'Rufisque',
      'Mbour',
    ],
    educationSystems: ['FRENCH', 'SENEGALESE'],
    languages: ['Français', 'Wolof', 'Pulaar', 'Serer'],
    timezone: 'Africa/Dakar',
  },
  CM: {
    code: 'CM',
    name: 'Cameroun',
    currency: {
      code: 'XAF',
      symbol: 'FCFA',
      name: 'Franc CFA',
    },
    phoneCode: '+237',
    phoneRegex: /^(\+237|237)?[0-9]{9}$/,
    phoneFormat: '+237 X XX XX XX XX',
    phoneExample: '+237 6 77 12 34 56',
    operators: [
      {
        name: 'MTN',
        prefixes: ['67', '650', '651', '652', '653', '654'],
        regex: /^(\+237|237)?(67|65[0-4])[0-9]{6,7}$/,
      },
      {
        name: 'Orange',
        prefixes: ['69', '655', '656', '657', '658', '659'],
        regex: /^(\+237|237)?(69|65[5-9])[0-9]{6,7}$/,
      },
      {
        name: 'Nexttel',
        prefixes: ['66'],
        regex: /^(\+237|237)?66[0-9]{7}$/,
      },
      {
        name: 'Camtel',
        prefixes: ['62', '242', '243'],
        regex: /^(\+237|237)?(62|24[23])[0-9]{6,7}$/,
      },
    ],
    cities: [
      'Yaoundé',
      'Douala',
      'Garoua',
      'Bamenda',
      'Bafoussam',
      'Maroua',
      'Ngaoundéré',
      'Bertoua',
      'Loum',
      'Kumba',
      'Nkongsamba',
      'Buea',
      'Limbé',
      'Edéa',
      'Kribi',
      'Ebolowa',
    ],
    educationSystems: ['FRENCH', 'ANGLOPHONE', 'BILINGUAL'],
    languages: ['Français', 'Anglais', 'Fulfulde', 'Ewondo', 'Duala'],
    timezone: 'Africa/Douala',
  },
  CI: {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    currency: {
      code: 'XOF',
      symbol: 'FCFA',
      name: 'Franc CFA',
    },
    phoneCode: '+225',
    phoneRegex: /^(\+225|225)?[0-9]{10}$/,
    phoneFormat: '+225 XX XX XX XX XX',
    phoneExample: '+225 07 12 34 56 78',
    operators: [
      {
        name: 'Orange',
        prefixes: ['07', '08', '09'],
        regex: /^(\+225|225)?0[789][0-9]{8}$/,
      },
      {
        name: 'MTN',
        prefixes: ['05', '06'],
        regex: /^(\+225|225)?0[56][0-9]{8}$/,
      },
      {
        name: 'Moov',
        prefixes: ['01', '02', '03'],
        regex: /^(\+225|225)?0[123][0-9]{8}$/,
      },
    ],
    cities: [
      'Abidjan',
      'Bouaké',
      'Daloa',
      'San-Pédro',
      'Yamoussoukro',
      'Korhogo',
      'Man',
      'Gagnoa',
      'Divo',
      'Abengourou',
      'Grand-Bassam',
      'Bondoukou',
      'Séguéla',
      'Odienné',
      'Soubré',
    ],
    educationSystems: ['FRENCH'],
    languages: ['Français', 'Dioula', 'Baoulé', 'Bété', 'Sénoufo'],
    timezone: 'Africa/Abidjan',
  },
};

// Default region (can be changed based on user location or preference)
export const DEFAULT_REGION = 'SN';

// Get region by code
export const getRegion = (code: string): RegionConfig | undefined => {
  return REGIONS[code];
};

// Get all available regions
export const getAllRegions = (): RegionConfig[] => {
  return Object.values(REGIONS);
};

// Validate phone number for a specific region
export const validatePhoneNumber = (phone: string, regionCode: string): boolean => {
  const region = getRegion(regionCode);
  if (!region) return false;
  return region.phoneRegex.test(phone);
};

// Format phone number for a specific region
export const formatPhoneNumber = (phone: string, regionCode: string): string => {
  const region = getRegion(regionCode);
  if (!region) return phone;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Remove country code if present
  const phoneCode = region.phoneCode.replace('+', '');
  const localNumber = digits.startsWith(phoneCode) 
    ? digits.slice(phoneCode.length) 
    : digits;

  // Format based on region
  switch (regionCode) {
    case 'SN':
      // Format: +221 XX XXX XX XX
      if (localNumber.length === 9) {
        return `${region.phoneCode} ${localNumber.slice(0, 2)} ${localNumber.slice(2, 5)} ${localNumber.slice(5, 7)} ${localNumber.slice(7)}`;
      }
      break;
    case 'CM':
      // Format: +237 X XX XX XX XX
      if (localNumber.length === 9) {
        return `${region.phoneCode} ${localNumber.slice(0, 1)} ${localNumber.slice(1, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5, 7)} ${localNumber.slice(7)}`;
      }
      break;
    case 'CI':
      // Format: +225 XX XX XX XX XX
      if (localNumber.length === 10) {
        return `${region.phoneCode} ${localNumber.slice(0, 2)} ${localNumber.slice(2, 4)} ${localNumber.slice(4, 6)} ${localNumber.slice(6, 8)} ${localNumber.slice(8)}`;
      }
      break;
  }

  return phone;
};

// Detect operator from phone number
export const detectOperator = (phone: string, regionCode: string): string | null => {
  const region = getRegion(regionCode);
  if (!region) return null;

  const digits = phone.replace(/\D/g, '');
  const phoneCode = region.phoneCode.replace('+', '');
  const localNumber = digits.startsWith(phoneCode) 
    ? digits.slice(phoneCode.length) 
    : digits;

  for (const operator of region.operators) {
    if (operator.regex.test(phone) || operator.regex.test(localNumber)) {
      return operator.name;
    }
  }

  return null;
};

// Format currency
export const formatCurrency = (amount: number, regionCode: string): string => {
  const region = getRegion(regionCode);
  if (!region) return amount.toString();

  return `${amount.toLocaleString()} ${region.currency.symbol}`;
};

// Convert currency between regions (simplified - in production use real exchange rates)
export const convertCurrency = (
  amount: number,
  fromRegion: string,
  toRegion: string
): number => {
  const from = getRegion(fromRegion);
  const to = getRegion(toRegion);
  
  if (!from || !to) return amount;
  
  // XOF and XAF have same value (1:1)
  if (from.currency.code === to.currency.code) return amount;
  if ((from.currency.code === 'XOF' && to.currency.code === 'XAF') ||
      (from.currency.code === 'XAF' && to.currency.code === 'XOF')) {
    return amount;
  }
  
  return amount;
};
