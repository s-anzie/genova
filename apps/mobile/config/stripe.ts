/**
 * Stripe Configuration
 * 
 * IMPORTANT: In production, use environment variables to store sensitive keys.
 * Never commit real API keys to version control.
 */

// Stripe publishable key (test mode)
// Replace with your actual Stripe publishable key from https://dashboard.stripe.com/apikeys
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here';

// Stripe configuration
export const STRIPE_CONFIG = {
  merchantIdentifier: 'merchant.com.genova',
  merchantDisplayName: 'Genova',
  returnURL: 'genova://payment-complete',
};
