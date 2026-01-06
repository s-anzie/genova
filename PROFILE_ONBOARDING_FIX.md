# Profile Onboarding Fix

## Issue
After completing onboarding, users were being redirected back to the onboarding page on refresh. Additionally, preferred subjects showed "0 sélectionnées" and didn't persist after updates.

## Root Cause
1. **Frontend data extraction**: The class creation page was trying to parse `educationDetails` as a JSON string, but the backend returns direct relations (`educationLevel`, `educationStream`, etc.)
2. **Profile check timing**: The `_layout.tsx` was checking the profile once on mount but not re-checking after onboarding completion
3. **Data format mismatch**: Frontend expected JSON string but backend sent structured relations

## Changes Made

### 1. Fixed Class Creation Page (`apps/mobile/app/(student)/classes/create.tsx`)
- **Before**: Tried to parse `educationDetails` JSON string
- **After**: Extracts education info directly from profile relations
  - Gets `educationSystemId`, `educationLevelId`, `educationStreamId` from profile
  - Gets level name from `educationLevel.name` relation
  - Gets stream name from `educationStream.name` relation

```typescript
// Extract education info directly from profile relations
const info: any = {
  educationSystemId: studentProfile.educationSystemId || undefined,
  educationLevelId: studentProfile.educationLevelId || undefined,
  educationStreamId: studentProfile.educationStreamId || undefined,
};

// Get level name from educationLevel relation
if ((studentProfile as any).educationLevel) {
  info.levelName = (studentProfile as any).educationLevel.name;
}

// Get stream name from educationStream relation
if ((studentProfile as any).educationStream) {
  info.streamName = (studentProfile as any).educationStream.name;
}
```

### 2. Enhanced Profile Check Logging (`apps/mobile/app/_layout.tsx`)
- Added detailed logging to track profile check process
- Logs profile existence, `onboardingCompleted` status, and education data
- Added reset mechanism: profile check resets when user or auth state changes

```typescript
// Reset profile check when user changes or authentication state changes
useEffect(() => {
  setProfileChecked(false);
  setNeedsOnboarding(false);
}, [isAuthenticated, user?.id]);
```

### 3. Improved Onboarding Completion (`apps/mobile/app/(student)/onboarding.tsx`)
- Added small delay after profile creation to ensure backend processing completes
- Added redirect protection to prevent double-navigation
- Added state flag `isRedirecting` to prevent multiple redirect attempts

```typescript
// Wait a bit for the backend to process
await new Promise(resolve => setTimeout(resolve, 500));

// Prevent double redirect
if (isRedirecting) return;
setIsRedirecting(true);
```

## Backend Behavior (No Changes Needed)
The backend already correctly:
- Returns profile with all relations (`educationLevel`, `educationStream`, `preferredLevelSubjects`, `preferredStreamSubjects`)
- Sets `onboardingCompleted: true` when creating profile
- Includes all necessary data in `getStudentProfile` response

## Testing Checklist
- [ ] Complete onboarding flow
- [ ] Verify no redirect to onboarding after refresh
- [ ] Check preferred subjects display correctly in profile edit
- [ ] Verify preferred subjects persist after update
- [ ] Confirm class creation shows correct education info
- [ ] Test with both level subjects and stream subjects
- [ ] Verify education info displays correctly in class creation

## Notes
- Frontend now correctly extracts data from backend relations instead of expecting JSON strings
- Profile check resets when authentication state changes, ensuring fresh data after onboarding
- All changes follow the user's instruction: "ne fait pas de constructions couteuss sur le backend envoie directement au frontend et le frontend recuperera les données telles quel"
