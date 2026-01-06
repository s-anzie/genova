# Alert.alert Replacement Guide

This document tracks the replacement of React Native's `Alert.alert()` with the custom `StyledModal` component throughout the mobile app.

## ✅ Completed Replacements

### Authentication Pages
- ✅ `apps/mobile/app/(auth)/login.tsx` - Login errors
- ✅ `apps/mobile/app/(auth)/register.tsx` - Registration validation and success
- ✅ `apps/mobile/app/(auth)/forgot-password.tsx` - Password reset errors
- ✅ `apps/mobile/app/(student)/onboarding.tsx` - Onboarding success and errors

## 📋 Remaining Files to Update

### Wallet & Payment (Student)
- `apps/mobile/app/(student)/wallet/add-payment-method.tsx` - 3 Alert.alert calls
  - Validation errors (operator, phone, account name)
  - Success message
  - Error handling

### Wallet & Payment (General)
- `apps/mobile/app/wallet/index.tsx` - 1 Alert.alert call
  - Error loading wallet data
  
- `apps/mobile/app/wallet/payment-methods.tsx` - 5 Alert.alert calls
  - Error loading payment methods
  - Add payment method flow (commented out)
  - Success message for default payment method
  - Confirmation dialog for removing payment method
  
- `apps/mobile/app/wallet/transactions.tsx` - 1 Alert.alert call
  - Error loading transactions
  
- `apps/mobile/app/wallet/withdraw.tsx` - 4 Alert.alert calls
  - Error loading wallet balance
  - Invalid amount validation
  - Minimum withdrawal validation
  - Insufficient balance validation
  - Success message for withdrawal request

### Subscription (Tutor)
- `apps/mobile/app/(tutor)/subscription/manage.tsx` - 3 Alert.alert calls
  - Error loading subscription status
  - Confirmation dialog for canceling subscription
  - Success message for cancellation
  
- `apps/mobile/app/(tutor)/subscription/purchase.tsx` - 4 Alert.alert calls
  - Confirmation for downgrading to free plan
  - Error selecting payment method
  - Confirmation for subscribing to paid plan
  - Success message for downgrade

### Progress (Student)
- `apps/mobile/app/(student)/progress/edit-goal.tsx` - 4 Alert.alert calls
  - Error loading goal
  - Validation errors (title, target score, deadline)
  - Success message for updating goal

### Profile Setup
- `apps/mobile/app/(auth)/profile-setup.tsx` - 3 Alert.alert calls
  - Validation error for education level
  - Validation error for hourly rate
  - Error completing profile setup

## 🛠️ How to Replace Alert.alert

### Step 1: Import the necessary components
```typescript
import { StyledModal } from '@/components/ui/StyledModal';
import { useModal } from '@/hooks/useModal';
```

### Step 2: Add the hook in your component
```typescript
const { modalState, hideModal, showSuccess, showError, showWarning, showConfirm } = useModal();
```

### Step 3: Replace Alert.alert calls

**For simple error messages:**
```typescript
// Before
Alert.alert('Erreur', 'Message d\'erreur');

// After
showError('Erreur', 'Message d\'erreur');
```

**For success messages:**
```typescript
// Before
Alert.alert('Succès', 'Opération réussie');

// After
showSuccess('Succès', 'Opération réussie');
```

**For confirmation dialogs:**
```typescript
// Before
Alert.alert(
  'Confirmer',
  'Êtes-vous sûr?',
  [
    { text: 'Annuler', style: 'cancel' },
    { text: 'OK', onPress: () => handleAction() }
  ]
);

// After
showConfirm(
  'Confirmer',
  'Êtes-vous sûr?',
  () => handleAction()
);
```

**For success with navigation:**
```typescript
// Before
Alert.alert('Succès', 'Opération réussie', [
  { text: 'OK', onPress: () => router.push('/path') }
]);

// After
showSuccess('Succès', 'Opération réussie', () => router.push('/path'));
```

### Step 4: Add the modal component to your JSX
```typescript
<StyledModal
  visible={modalState.visible}
  type={modalState.type}
  title={modalState.title}
  message={modalState.message}
  primaryButton={modalState.primaryButton}
  secondaryButton={modalState.secondaryButton}
  onClose={hideModal}
/>
```

### Step 5: Remove Alert import
```typescript
// Remove this line
import { Alert } from 'react-native';
```

## 📝 Notes

- The `useModal` hook provides convenient methods: `showSuccess`, `showError`, `showWarning`, `showConfirm`
- For custom modal configurations, use the `showModal` method directly
- Always handle error messages properly: `error?.message || (typeof error === 'string' ? error : 'Default message')`
- The modal automatically handles closing and callbacks
- Use `showCloseButton={false}` for modals that require user action (like success messages with navigation)

## 🎨 Modal Types

- `success` - Green checkmark icon
- `error` - Red X icon
- `warning` - Yellow alert icon
- `loading` - Spinner (for loading states)

## Priority Order for Replacement

1. ✅ Authentication flows (completed)
2. ✅ Onboarding (completed)
3. 🔄 Wallet & Payment (high priority - user-facing)
4. 🔄 Subscription management (high priority - payment flow)
5. 🔄 Progress tracking (medium priority)
6. 🔄 Profile setup (medium priority)
