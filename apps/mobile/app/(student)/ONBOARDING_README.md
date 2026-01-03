# Student Onboarding Flow

## Overview
The student onboarding process collects essential information to personalize the learning experience and match students with appropriate tutors.

## Flow Steps

### Step 1: Education Level (Required)
- **Education System**: French, Senegalese, International, or Other
- **Education Level**: Grade/class based on selected system
- **Series** (Optional): For high school students (L, ES, S, etc.)

**Data Collected:**
- `educationSystem`: string
- `educationLevel`: string
- `series`: string (optional)

### Step 2: School Information (Required)
- **School Name**: Name of the educational institution

**Data Collected:**
- `schoolName`: string

### Step 3: Subjects & Goals (Required)
- **Preferred Subjects**: Multiple selection from predefined list
- **Learning Goals** (Optional): Free text describing objectives

**Data Collected:**
- `preferredSubjects`: string[]
- `learningGoals`: string (optional)

### Step 4: Parent Contact (Optional)
- **Parent Email**: For notifications and updates
- **Parent Phone**: For emergency contact

**Data Collected:**
- `parentEmail`: string (optional)
- `parentPhone`: string (optional)

### Step 5: Budget (Optional)
- **Budget Per Hour**: Expected hourly rate in FCFA

**Data Collected:**
- `budgetPerHour`: number (optional)

## API Integration

### Endpoint
```
POST /api/profiles/student
```

### Request Body
```json
{
  "educationLevel": "Terminale",
  "educationDetails": {
    "system": "FRENCH",
    "level": "Terminale",
    "series": "S"
  },
  "schoolName": "Lycée Blaise Diagne",
  "learningGoals": "Améliorer mes notes en maths",
  "preferredSubjects": ["Mathématiques", "Physique-Chimie"],
  "parentEmail": "parent@example.com",
  "parentPhone": "+221 XX XXX XX XX",
  "budgetPerHour": 5000
}
```

## Navigation Flow

1. User completes registration → `/(auth)/register`
2. After successful registration → `/(student)/onboarding`
3. After onboarding completion → `/(student)/(tabs)/home`

## Features

### Progress Tracking
- Visual progress bar showing current step
- Step counter (e.g., "Étape 2 sur 5")

### Validation
- Required fields are enforced before proceeding
- Optional fields can be skipped
- Real-time validation feedback

### User Experience
- Icon-based step identification
- Clear descriptions for each step
- Helper text for guidance
- Smooth transitions between steps
- Back navigation available

### Data Persistence
- All data is submitted at the end
- No intermediate saves
- Single API call on completion

## Customization

### Adding New Subjects
Edit the `SUBJECTS` array in `onboarding.tsx`:
```typescript
const SUBJECTS = [
  'Mathématiques',
  'Physique-Chimie',
  // Add more subjects here
];
```

### Adding New Education Systems
Edit the `EDUCATION_SYSTEMS` and `EDUCATION_LEVELS` objects:
```typescript
const EDUCATION_SYSTEMS = [
  { value: 'NEW_SYSTEM', label: 'New System' },
];

const EDUCATION_LEVELS = {
  NEW_SYSTEM: ['Level 1', 'Level 2'],
};
```

### Modifying Steps
To add/remove steps:
1. Update `totalSteps` constant
2. Add new render function (e.g., `renderNewStep()`)
3. Add case in `renderStep()` switch
4. Update `canProceed()` validation
5. Update form data interface

## Best Practices

1. **Keep it Short**: 5 steps maximum to avoid user fatigue
2. **Make Optional Clear**: Use "(optionnel)" label for optional fields
3. **Provide Context**: Use icons and descriptions to explain each step
4. **Show Progress**: Always display progress indicator
5. **Allow Back Navigation**: Users should be able to review/edit previous steps
6. **Validate Early**: Check required fields before allowing next step
7. **Celebrate Completion**: Show success message with clear next action

## Future Enhancements

- [ ] Save draft progress (allow users to complete later)
- [ ] Add profile picture upload
- [ ] Add interests/hobbies section
- [ ] Add learning style preferences
- [ ] Add availability preferences
- [ ] Skip onboarding option (complete later from profile)
- [ ] Pre-fill data from social login
