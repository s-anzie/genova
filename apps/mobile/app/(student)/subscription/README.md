# Subscription Screens

This folder contains all subscription-related screens for the Genova mobile application.

## Screens

### 1. `index.tsx` - Subscription Overview
- Displays current subscription status
- Shows subscription features and benefits
- Provides quick actions to upgrade or manage subscription
- Displays expiry warnings and expired notices
- Shows benefits of upgrading to premium

**Features:**
- Current plan display with icon and pricing
- Expiry countdown for active subscriptions
- Feature list with checkmarks
- Upgrade/manage buttons based on subscription status
- Benefits section highlighting premium features

### 2. `plans.tsx` - Subscription Plans Comparison
- Lists all available subscription tiers (FREE, BASIC, PREMIUM, PRO)
- Compares features across different plans
- Highlights recommended plan (PREMIUM)
- Shows current plan with badge
- Includes FAQ section

**Features:**
- Visual plan cards with icons and colors
- Feature comparison with checkmarks
- Price display in FCFA
- Current plan indicator
- Recommended plan badge
- FAQ section for common questions

### 3. `purchase.tsx` - Subscription Purchase Flow
- Finalizes subscription purchase
- Shows plan summary and features
- Payment method selection
- Terms and conditions
- Handles both upgrades and downgrades

**Features:**
- Plan summary with pricing
- Payment method selection (for paid plans)
- Add payment method option
- Terms acceptance
- Confirmation flow with alerts
- Free plan downgrade handling

### 4. `manage.tsx` - Subscription Management
- Manage active subscription
- View subscription details and renewal date
- Change plan or payment method
- Cancel subscription
- View billing information

**Features:**
- Subscription status display
- Expiry warnings (7 days or less)
- Expired subscription notices
- Action cards for plan changes
- Payment method management
- Cancellation flow
- Billing information display
- Help section

### 5. `payment-method.tsx` - Payment Method Management
- View all saved payment methods
- Set default payment method
- Add new payment methods
- Delete payment methods
- Security information

**Features:**
- Payment methods list with operator icons
- Default payment method indicator
- Set default action
- Delete payment method with confirmation
- Add payment method button
- Information section about payment security

## API Integration

All screens integrate with the following API endpoints:

- `GET /api/subscriptions/status` - Get current subscription status
- `GET /api/subscriptions/tiers` - Get available subscription tiers
- `POST /api/subscriptions/create` - Create or upgrade subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `GET /api/payment-methods` - Get user's payment methods
- `PATCH /api/payment-methods/:id/default` - Set default payment method
- `DELETE /api/payment-methods/:id` - Delete payment method

## Subscription Tiers

### FREE
- Price: 0 FCFA
- Features:
  - 1 active class
  - No exam bank access
  - No priority support
  - 15% platform commission

### BASIC
- Price: 2,500 FCFA/month (5 EUR)
- Features:
  - 1 active class
  - No exam bank access
  - No priority support
  - 15% platform commission

### PREMIUM (Recommended)
- Price: 7,500 FCFA/month (15 EUR)
- Features:
  - Unlimited classes
  - Exam bank access
  - Priority support
  - 15% platform commission

### PRO (For Tutors)
- Price: 15,000 FCFA/month (30 EUR)
- Features:
  - Unlimited classes
  - Exam bank access
  - Priority support
  - 10% platform commission (reduced)

## Renewal Reminders

The subscription system includes automatic renewal reminders:

1. **7-Day Warning**: Users receive a notification when their subscription expires in 7 days or less
2. **Expiry Notice**: Users see an alert when their subscription has expired
3. **Grace Period**: 7-day grace period after payment failure before downgrade
4. **Auto-Renewal**: Subscriptions automatically renew using the default payment method

## Hook Usage

Use the `useSubscription` hook to access subscription data and functionality:

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function MyComponent() {
  const {
    status,
    loading,
    refreshing,
    daysUntilExpiry,
    needsRenewal,
    refresh,
    checkRenewalReminder,
  } = useSubscription();

  // Check for renewal reminders on mount
  useEffect(() => {
    checkRenewalReminder();
  }, [checkRenewalReminder]);

  // Use subscription data
  if (status?.type === 'PREMIUM') {
    // Show premium features
  }
}
```

## Navigation

Access subscription screens from:
- Profile screen → "Mon abonnement" menu item
- Direct navigation: `router.push('/(student)/subscription')`
- Deep linking: `genova://subscription`

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 14.1**: Basic subscription features (1 class, 5 FCFA/month)
- **Requirement 14.2**: Premium subscription features (unlimited classes, exam bank, 15 FCFA/month)
- **Requirement 14.3**: Pro subscription benefits (reduced commission, 30 FCFA/month)
- **Requirement 14.4**: Payment failure handling with 7-day grace period
- **Requirement 14.5**: Subscription expiration restrictions

## Testing

To test the subscription screens:

1. Navigate to Profile → Mon abonnement
2. View current subscription status
3. Click "Améliorer mon abonnement" to see plans
4. Select a plan and proceed to purchase
5. Add a payment method if needed
6. Confirm subscription
7. Manage subscription from the manage screen
8. Test cancellation flow

## Notes

- All prices are displayed in FCFA (West African CFA franc)
- Conversion rate: 1 EUR = 500 FCFA (approximate)
- Payment processing uses Stripe for card payments
- Mobile Money integration for local payment methods
- Subscription data is cached and refreshed on pull-to-refresh
