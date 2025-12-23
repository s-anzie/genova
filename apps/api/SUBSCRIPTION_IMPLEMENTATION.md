# Subscription Management Implementation

## Overview

The subscription management system provides tiered access control for the Genova platform. It supports four subscription tiers (FREE, BASIC, PREMIUM, PRO) with different features and pricing.

## Subscription Tiers

### FREE (€0/month)
- **Features:**
  - No active classes allowed
  - No exam bank access
  - No priority support
  - 15% platform commission

### BASIC (€5/month)
- **Features:**
  - 1 active class
  - No exam bank access
  - No priority support
  - 15% platform commission

### PREMIUM (€15/month)
- **Features:**
  - Unlimited active classes
  - Exam bank access
  - Priority support
  - 15% platform commission

### PRO (€30/month) - For Tutors
- **Features:**
  - Unlimited active classes
  - Exam bank access
  - Priority support
  - **10% platform commission** (reduced from 15%)
  - Verified badge

## API Endpoints

### Get All Subscription Tiers
```
GET /api/subscriptions/tiers
```
Returns all available subscription tiers with pricing and features.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "FREE",
      "price": 0,
      "description": "Free tier with basic access",
      "features": {
        "maxActiveClasses": 0,
        "examBankAccess": false,
        "prioritySupport": false,
        "platformCommission": 0.15
      }
    },
    ...
  ]
}
```

### Get Subscription Status
```
GET /api/subscriptions/status
Authorization: Bearer <token>
```
Returns the current user's subscription status.

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "PREMIUM",
    "price": 15,
    "features": {
      "maxActiveClasses": -1,
      "examBankAccess": true,
      "prioritySupport": true,
      "platformCommission": 0.15
    },
    "expiresAt": "2026-01-21T15:30:00.000Z",
    "isExpired": false,
    "isActive": true
  }
}
```

### Create/Upgrade Subscription
```
POST /api/subscriptions/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "subscriptionType": "PREMIUM",
  "paymentMethodId": "pm_xxx" // Optional for FREE tier
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "subscription": {
      "type": "PREMIUM",
      "price": 15,
      "expiresAt": "2026-01-21T15:30:00.000Z",
      "stripeSubscriptionId": "sub_xxx"
    }
  }
}
```

### Confirm Subscription Payment
```
POST /api/subscriptions/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "stripeSubscriptionId": "sub_xxx"
}
```

### Cancel Subscription
```
POST /api/subscriptions/cancel
Authorization: Bearer <token>
```
Downgrades the user to FREE tier immediately.

### Check Feature Access
```
GET /api/subscriptions/features/:feature
Authorization: Bearer <token>
```
Check if the user has access to a specific feature (e.g., `examBankAccess`, `prioritySupport`).

**Response:**
```json
{
  "success": true,
  "data": {
    "feature": "examBankAccess",
    "hasAccess": true
  }
}
```

### Check Class Creation Access
```
GET /api/subscriptions/can-create-class
Authorization: Bearer <token>
```
Check if the user can create more classes based on their subscription tier.

**Response:**
```json
{
  "success": true,
  "data": {
    "canCreate": true
  }
}
```

## Middleware

### requireFeature
Protects routes that require specific subscription features.

```typescript
import { requireFeature } from '../middleware/subscription.middleware';

router.get('/exam-bank', authenticate, requireFeature('examBankAccess'), async (req, res) => {
  // Only accessible to users with exam bank access
});
```

### requireClassCreationAccess
Protects class creation routes to enforce subscription limits.

```typescript
import { requireClassCreationAccess } from '../middleware/subscription.middleware';

router.post('/classes', authenticate, requireClassCreationAccess, async (req, res) => {
  // Only accessible if user hasn't reached class limit
});
```

### requireActiveSubscription
Ensures the user's subscription hasn't expired.

```typescript
import { requireActiveSubscription } from '../middleware/subscription.middleware';

router.get('/premium-feature', authenticate, requireActiveSubscription, async (req, res) => {
  // Only accessible if subscription is active
});
```

## Payment Failure Handling

When a subscription payment fails:

1. Transaction status is updated to FAILED
2. User receives a notification with grace period information
3. User has 7 days to update payment method
4. After grace period, account is automatically downgraded to FREE tier

### Handle Payment Failure
```
POST /api/subscriptions/payment-failure
Content-Type: application/json

{
  "userId": "user_id",
  "reason": "Card declined"
}
```

## Subscription Expiration

Expired subscriptions are processed automatically:

1. Users with expired subscriptions are identified
2. Accounts are downgraded to FREE tier
3. Users receive expiration notifications
4. Premium features are restricted

### Process Expired Subscriptions
```
POST /api/subscriptions/process-expired
```

This endpoint should be called by a cron job or scheduled task daily.

**Recommended Cron Schedule:**
```bash
# Run daily at 2 AM
0 2 * * * curl -X POST http://localhost:5001/api/subscriptions/process-expired
```

## Feature Access Control

### Programmatic Access Check

```typescript
import { hasFeatureAccess, canCreateClass } from '../services/subscription.service';

// Check specific feature
const hasExamAccess = await hasFeatureAccess(userId, 'examBankAccess');

// Check class creation
const canCreate = await canCreateClass(userId);
```

### Get Subscription Features

```typescript
import { getSubscriptionFeatures } from '../services/subscription.service';

const features = getSubscriptionFeatures(SubscriptionType.PREMIUM);
console.log(features.maxActiveClasses); // -1 (unlimited)
console.log(features.examBankAccess); // true
```

## Integration with Stripe

The subscription system integrates with Stripe for payment processing:

1. **Product Creation**: Creates Stripe Products for each subscription tier
2. **Price Creation**: Creates Stripe Prices with recurring billing intervals
3. **Subscription Creation**: Creates Stripe subscriptions using price IDs
4. **Payment Intent**: Stripe handles payment collection via the client secret
5. **Webhooks**: Listen for Stripe events (payment success, failure, etc.)
6. **Customer Management**: Each user should have a Stripe customer ID

### Implementation Details

The subscription service automatically:
- Creates or retrieves Stripe Products for each subscription tier
- Creates Stripe Prices with monthly recurring intervals
- Converts prices to cents for Stripe (e.g., €15 → 1500 cents)
- Returns a client secret for frontend payment confirmation
- Stores subscription ID in the transaction record

### Code Example

```typescript
// Create subscription
const result = await createSubscription({
  userId: 'user_123',
  subscriptionType: SubscriptionType.PREMIUM,
  paymentMethodId: 'pm_xxx', // Optional for FREE tier
});

// The result includes:
// - user: Updated user object with new subscription
// - subscription.stripeSubscriptionId: Stripe subscription ID
// - subscription.clientSecret: For frontend payment confirmation
```

### Stripe Webhook Events to Handle

- `invoice.payment_succeeded`: Confirm subscription payment
- `invoice.payment_failed`: Handle payment failure with grace period
- `customer.subscription.deleted`: Cancel subscription
- `customer.subscription.updated`: Update subscription details
- `customer.subscription.created`: Track new subscriptions

## Database Schema

The subscription information is stored in the `User` model:

```prisma
model User {
  subscriptionType      SubscriptionType @default(FREE)
  subscriptionExpiresAt DateTime?
  // ... other fields
}

enum SubscriptionType {
  FREE
  BASIC
  PREMIUM
  PRO
}
```

Subscription transactions are recorded in the `Transaction` model:

```prisma
model Transaction {
  transactionType TransactionType
  // ... other fields
}

enum TransactionType {
  SESSION_PAYMENT
  SUBSCRIPTION
  SHOP_PURCHASE
}
```

## Testing

Unit tests are provided in `src/services/__tests__/subscription.service.test.ts`.

Run tests:
```bash
npm test -- subscription.service.test.ts
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 14.1**: Basic subscription (€5/month) with 1 active class ✓
- **Requirement 14.2**: Premium subscription (€15/month) with unlimited classes and exam bank ✓
- **Requirement 14.3**: Pro subscription (€30/month) with reduced commission ✓
- **Requirement 14.4**: Payment failure handling with 7-day grace period ✓
- **Requirement 14.5**: Subscription expiration with feature restrictions ✓

## Correctness Properties

The following properties are validated:

- **Property 54**: Basic subscription features (1 class, no exam bank)
- **Property 55**: Premium subscription features (unlimited classes, exam bank)
- **Property 56**: Pro subscription benefits (10% commission, verified badge)
- **Property 57**: Payment failure handling (notification + grace period)
- **Property 58**: Expiration restrictions (premium features blocked)

## Future Enhancements

1. **Proration**: Handle mid-cycle upgrades/downgrades with prorated billing
2. **Trial Periods**: Offer free trial periods for premium tiers
3. **Annual Billing**: Add annual subscription options with discounts
4. **Usage Tracking**: Track feature usage for analytics
5. **Subscription Analytics**: Dashboard for subscription metrics
6. **Automated Reminders**: Send renewal reminders before expiration
7. **Referral Program**: Offer subscription credits for referrals
8. **Enterprise Plans**: Custom plans for schools and organizations

## Troubleshooting

### User Can't Create Class
- Check subscription tier: `GET /api/subscriptions/status`
- Verify class limit: `GET /api/subscriptions/can-create-class`
- Check active classes count in database

### Payment Failed
- Verify Stripe configuration
- Check transaction logs
- Ensure webhook endpoints are configured
- Verify grace period hasn't expired

### Subscription Not Expiring
- Ensure cron job is running: `POST /api/subscriptions/process-expired`
- Check `subscriptionExpiresAt` field in database
- Verify system time is correct

## Support

For issues or questions about the subscription system:
1. Check the API documentation
2. Review test cases for examples
3. Check application logs for errors
4. Verify Stripe dashboard for payment issues
