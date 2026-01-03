/**
 * Currency conversion and mapping utilities for regional support
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  stripeCurrency: string;
  conversionRate: number; // Rate to EUR (base currency)
}

// Currency mapping for supported countries
const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  XOF: {
    code: 'XOF',
    symbol: 'FCFA',
    name: 'Franc CFA (BCEAO)',
    stripeCurrency: 'eur', // Stripe doesn't support XOF directly
    conversionRate: 655.957, // 1 EUR = 655.957 XOF (fixed rate)
  },
  XAF: {
    code: 'XAF',
    symbol: 'FCFA',
    name: 'Franc CFA (BEAC)',
    stripeCurrency: 'eur', // Stripe doesn't support XAF directly
    conversionRate: 655.957, // 1 EUR = 655.957 XAF (fixed rate)
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    stripeCurrency: 'eur',
    conversionRate: 1,
  },
  GHS: {
    code: 'GHS',
    symbol: '₵',
    name: 'Ghana Cedi',
    stripeCurrency: 'ghs',
    conversionRate: 0.085, // Approximate rate
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    stripeCurrency: 'ngn',
    conversionRate: 0.0013, // Approximate rate
  },
};

/**
 * Get currency info by currency code
 */
export function getCurrencyInfo(currencyCode: string): CurrencyInfo {
  const info = CURRENCY_MAP[currencyCode.toUpperCase()];
  if (!info) {
    // Default to EUR if currency not found
    return CURRENCY_MAP.EUR;
  }
  return info;
}

/**
 * Map local currency to Stripe-supported currency
 * Stripe doesn't support all African currencies, so we map them
 */
export function mapToStripeCurrency(currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  return info.stripeCurrency;
}

/**
 * Convert amount from one currency to another
 * @param amount Amount in source currency
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromInfo = getCurrencyInfo(fromCurrency);
  const toInfo = getCurrencyInfo(toCurrency);

  // Convert to EUR first (base currency), then to target currency
  const amountInEur = amount / fromInfo.conversionRate;
  const convertedAmount = amountInEur * toInfo.conversionRate;

  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimals
}

/**
 * Convert local currency amount to Stripe amount (in cents/smallest unit)
 * @param amount Amount in local currency
 * @param currencyCode Local currency code
 * @returns Amount in Stripe currency's smallest unit
 */
export function toStripeAmount(amount: number, currencyCode: string): number {
  const stripeCurrency = mapToStripeCurrency(currencyCode);
  const convertedAmount = convertCurrency(amount, currencyCode, stripeCurrency.toUpperCase());
  
  // Stripe amounts are in smallest currency unit (cents for EUR, kobo for NGN, etc.)
  return Math.round(convertedAmount * 100);
}

/**
 * Convert Stripe amount back to local currency
 * @param stripeAmount Amount in Stripe's smallest unit
 * @param stripeCurrency Stripe currency code
 * @param localCurrency Local currency code
 * @returns Amount in local currency
 */
export function fromStripeAmount(
  stripeAmount: number,
  stripeCurrency: string,
  localCurrency: string
): number {
  // Convert from smallest unit to main unit
  const amountInStripeCurrency = stripeAmount / 100;
  
  // Convert to local currency
  return convertCurrency(amountInStripeCurrency, stripeCurrency.toUpperCase(), localCurrency);
}

/**
 * Format amount with currency symbol
 * @param amount Amount to format
 * @param currencyCode Currency code
 * @returns Formatted string (e.g., "5,000 FCFA", "€50.00")
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  
  // Format number with thousands separator
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: currencyCode === 'XOF' || currencyCode === 'XAF' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'XOF' || currencyCode === 'XAF' ? 0 : 2,
  }).format(amount);

  // Position symbol based on currency
  if (currencyCode === 'EUR') {
    return `${formatted}${info.symbol}`;
  }
  return `${formatted} ${info.symbol}`;
}
