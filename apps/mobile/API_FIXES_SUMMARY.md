# API Endpoint Fixes - Mobile App

## Problem Summary
The mobile app was experiencing systematic 404 errors for:
1. Session API calls (GET `/api/sessions?status=...`)
2. Profile loading (GET `/profiles/user/{id}` and `/profiles/student/{id}`)

## Root Causes

### 1. Double `/api` Prefix Issue
**Problem:** Sessions endpoints were being called with `/api/sessions` which, when combined with `API_BASE_URL = http://192.168.1.149:5001/api`, resulted in:
```
http://192.168.1.149:5001/api/api/sessions  ❌ (404 error)
```

**Solution:** Remove the `/api` prefix from endpoint calls since `API_BASE_URL` already includes it:
```typescript
// Before
ApiClient.get(`/api/sessions?status=${status}`)

// After
ApiClient.get(`/sessions?status=${status}`)
```

### 2. Response Structure Mismatch
**Problem:** Backend returns data wrapped in `{ success: boolean, data: T }` but mobile app was expecting data directly.

**Solution:** Access the `.data` property from API responses:
```typescript
// Before
const data = await ApiClient.get<SessionResponse[]>(`/sessions?status=${status}`);
setSessions(data);

// After
const response = await ApiClient.get<{ success: boolean; data: SessionResponse[] }>(`/sessions?status=${status}`);
setSessions(response.data);
```

### 3. Missing Profile Creation on Registration ✅ FIXED
**Problem:** When users registered, only the User record was created. StudentProfile/TutorProfile records were NOT created automatically, causing 404 errors when trying to load profiles.

**Solution:** 
1. Modified `auth.service.ts` register function to create profiles automatically in a transaction
2. Added `teachingMode: 'BOTH'` as default for tutor profiles (required field)
3. Created and ran migration script to add profiles for existing users

**Migration Results:**
- 1 student profile created
- 2 tutor profiles created
- All existing users now have profiles

## Files Fixed

### Session Endpoints
1. **apps/mobile/app/(student)/(tabs)/sessions/index.tsx**
   - Fixed: `/api/sessions` → `/sessions`
   - Fixed: Response structure to access `.data`

2. **apps/mobile/app/(tutor)/(tabs)/sessions/index.tsx**
   - Fixed: `/api/sessions` → `/sessions`
   - Fixed: Response structure to access `.data`

3. **apps/mobile/app/(student)/(tabs)/sessions/[id].tsx**
   - Fixed: `/api/sessions/${id}` → `/sessions/${id}`
   - Fixed: `/api/sessions/${id}/report` → `/sessions/${id}/report`
   - Fixed: `/api/sessions/${id}/attendance` → `/sessions/${id}/attendance`
   - Fixed: Response structure for all endpoints

4. **apps/mobile/app/(tutor)/(tabs)/sessions/[id].tsx**
   - Fixed: `/api/sessions/${id}` → `/sessions/${id}`
   - Fixed: `/api/sessions/${id}/report` → `/sessions/${id}/report`
   - Fixed: `/api/sessions/${id}/attendance` → `/sessions/${id}/attendance`
   - Fixed: Response structure for all endpoints

5. **apps/mobile/app/(student)/(tabs)/sessions/check-in.tsx**
   - Fixed: `/api/sessions/checkin` → `/sessions/checkin` (2 occurrences)

6. **apps/mobile/app/(tutor)/(tabs)/sessions/report.tsx**
   - Fixed: `/api/sessions/${sessionId}` → `/sessions/${sessionId}`
   - Fixed: `/api/sessions/${sessionId}/report` → `/sessions/${sessionId}/report`
   - Fixed: Response structure

### Profile Endpoints
7. **apps/mobile/app/(student)/(tabs)/profile/index.tsx**
   - Fixed: `${API_BASE_URL}/profiles/user/${user?.id}` → `/profiles/user/${user?.id}`
   - Fixed: `${API_BASE_URL}/profiles/student/${user?.id}` → `/profiles/student/${user?.id}`
   - Response structure was already correct (accessing `.data`)

8. **apps/mobile/app/(tutor)/(tabs)/profile/index.tsx**
   - Fixed: `${API_BASE_URL}/profiles/user/${user?.id}` → `/profiles/user/${user?.id}`
   - Fixed: `${API_BASE_URL}/profiles/tutor/${user?.id}` → `/profiles/tutor/${user?.id}`
   - Response structure was already correct (accessing `.data`)

## Backend API Routes (Verified)
All backend routes are correctly configured at:
- `GET /api/sessions` ✅
- `GET /api/sessions/:id` ✅
- `GET /api/sessions/:id/report` ✅
- `GET /api/sessions/:id/attendance` ✅
- `POST /api/sessions/checkin` ✅
- `POST /api/sessions/:id/report` ✅
- `GET /api/profiles/user/:userId` ✅
- `GET /api/profiles/student/:userId` ✅
- `GET /api/profiles/tutor/:userId` ✅

## API Configuration
**File:** `apps/mobile/config/api.ts`
```typescript
const API_BASE_URL = `http://192.168.1.149:5001/api`;
```

## API Client Usage Pattern
**Correct pattern for all API calls:**
```typescript
// For endpoints, use relative paths without /api prefix
const response = await ApiClient.get<{ success: boolean; data: T }>(`/endpoint`);
const data = response.data;

// API_BASE_URL is automatically prepended by the client
// Result: http://192.168.1.149:5001/api/endpoint ✅
```

## Testing Status
✅ All TypeScript compilation passes with no errors
✅ All session-related files validated
✅ All profile-related files validated
✅ Backend auth service updated to create profiles on registration
✅ Migration script created and executed successfully
✅ All 3 existing users now have profiles (1 student, 2 tutors)
✅ API server restarted with updated code

## Next Steps
1. ✅ Test the mobile app with the backend API running
2. ✅ Verify sessions load correctly for both students and tutors
3. ✅ Verify profile data loads correctly for both user types (should now work!)
4. Test check-in functionality
5. Test session report submission
6. Test new user registration to confirm profiles are created automatically
