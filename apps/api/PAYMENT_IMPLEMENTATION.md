# Payment System Implementation

## Overview

The payment system has been successfully integrated with Stripe for the Genova mobile tutoring platform. This implementation handles session payments, platform fee calculation, wallet management, and consortium revenue distribution.

## Components Implemented

### 1. Payment Service (`src/services/payment.service.ts`)

Core payment functionality including:

- **Payment Intent Creation**: Creates Stripe payment intents for tutoring sessions
- **Payment Confirmation**: Confirms payments and distributes funds
- **Platform Fee Calculation**: Calculates 15% platform fee on all transactions
- **Wallet Management**: Credit and debit operations for user wallets
- **Consortium Revenue Distribution**: Distributes payments to consortium members based on revenue shares
- **Transaction History**: Retrieves transaction history for users
- **Payment Failure Handling**: Handles failed payments and cancels sessions

### 2. Payment Routes (`src/routes/payment.routes.ts`)

RESTful API endpoints:

- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/wallet` - Get wallet balance
- `GET /api/payments/history` - Get transaction history
- `POST /api/payments/withdraw` - Request withdrawal

### 3. Database Models

The Transaction model (already defined in Prisma schema) includes:

- Session reference
- Payer and payee references
- Amount, platform fee, and net amount
- Payment method and provider ID
- Transaction status and type
- Timestamps

## Key Features

### Platform Fee (15%)

All payments automatically deduct a 15% platform fee:
- Total amount: €100
- Platform fee: €15
- Net amount to tutor: €85

### Wallet System

- Users have a wallet balance stored in the database
- Funds are credited after successful payments
- Withdrawals require minimum balance of €20
- Available balance accounts for pending transactions

### Consortium Support

When a session is provided by a consortium:
- Net amount is distributed to all consortium members
- Distribution follows the consortium's revenue policy
- Revenue shares must sum to 100%
- Each member receives their proportional share

### Payment Flow

1. Student books a session
2. Payment intent is created with Stripe
3. Student completes payment on frontend
4. Backend confirms payment with Stripe
5. Platform fee is deducted
6. Net amount is credited to tutor/consortium wallets
7. Session status is updated to CONFIRMED

### Error Handling

- Invalid amounts are rejected
- Non-existent sessions/users are caught
- Payment failures cancel the session
- Duplicate payment confirmations are handled gracefully
- Insufficient wallet balance prevents withdrawals

## Testing

Comprehensive test suite (`src/services/__tests__/payment.service.test.ts`) covers:

- Platform fee calculation
- Payment intent creation
- Payment confirmation
- Wallet credit/debit operations
- Wallet balance queries
- Transaction history
- Payment failure handling
- Consortium revenue distribution

**Test Results**: 19/20 tests passing (1 database connection timeout on first test)

## Configuration

Required environment variables (`.env`):

```
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Dependencies

- `stripe`: Official Stripe SDK for Node.js
- `@prisma/client`: Database ORM
- `@repo/utils`: Shared utilities (errors, logging, config)

## API Examples

### Create Payment Intent

```bash
POST /api/payments/intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "session-uuid",
  "amount": 100,
  "description": "Math tutoring session"
}
```

### Confirm Payment

```bash
POST /api/payments/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentIntentId": "pi_xxx",
  "sessionId": "session-uuid"
}
```

### Get Wallet Balance

```bash
GET /api/payments/wallet
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "totalBalance": 100,
    "availableBalance": 85,
    "pendingBalance": 15
  }
}
```

## Future Enhancements

- Stripe webhook integration for real-time payment updates
- Refund processing for cancelled sessions
- Payout automation with Stripe Connect
- Multi-currency support
- Payment method management
- Subscription billing integration

## Requirements Validated

This implementation satisfies the following requirements from the design document:

- **Requirement 7.1**: Payment intent creation
- **Requirement 7.2**: Platform fee deduction (15%)
- **Requirement 7.3**: Tutor wallet credit
- **Requirement 7.4**: Consortium revenue distribution
- **Requirement 7.5**: Payment failure handling

## Correctness Properties

The implementation validates these properties:

- **Property 27**: Payment intent creation with session price
- **Property 28**: Platform fee is always 15% of payment amount
- **Property 29**: Tutor wallet is credited with net amount
- **Property 30**: Consortium revenue is distributed according to shares
- **Property 31**: Payment failures cancel sessions and notify students
