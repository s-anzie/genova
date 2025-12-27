/**
 * Currency conversion utilities for EUR to FCFA
 * 
 * The API returns amounts in EUR, but the mobile app displays amounts in FCFA.
 * Fixed exchange rate: 1 EUR = 655.957 FCFA
 */

// Fixed exchange rate
const EUR_TO_FCFA_RATE = 655.957;

/**
 * Convert EUR to FCFA
 * @param eurAmount Amount in EUR
 * @returns Amount in FCFA (rounded to nearest integer)
 */
export function eurToFcfa(eurAmount: number): number {
  return Math.round(eurAmount * EUR_TO_FCFA_RATE);
}

/**
 * Convert FCFA to EUR
 * @param fcfaAmount Amount in FCFA
 * @returns Amount in EUR (rounded to 2 decimals)
 */
export function fcfaToEur(fcfaAmount: number): number {
  return Math.round((fcfaAmount / EUR_TO_FCFA_RATE) * 100) / 100;
}

/**
 * Format an amount in EUR as FCFA for display
 * @param eurAmount Amount in EUR from API
 * @returns Formatted string with FCFA symbol (e.g., "10000 FCFA")
 */
export function formatEurAsFcfa(eurAmount: number): string {
  const fcfaAmount = eurToFcfa(eurAmount);
  return `${fcfaAmount.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Format an hourly rate in EUR as FCFA for display
 * @param eurAmount Hourly rate in EUR from API
 * @returns Formatted string with FCFA/h (e.g., "10000 FCFA/h")
 */
export function formatHourlyRateAsFcfa(eurAmount: number): string {
  const fcfaAmount = eurToFcfa(eurAmount);
  return `${fcfaAmount.toLocaleString('fr-FR')} FCFA/h`;
}

/**
 * Get minimum amount in FCFA for a given EUR minimum
 * Useful for validation messages
 * @param eurMinimum Minimum amount in EUR
 * @returns Minimum amount in FCFA
 */
export function getMinimumFcfa(eurMinimum: number): number {
  return eurToFcfa(eurMinimum);
}
