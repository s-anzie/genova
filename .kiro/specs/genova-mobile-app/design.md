# Design Document - Genova Mobile Application

## Overview

Genova is a comprehensive mobile tutoring platform built with React Native/Expo that connects students with qualified tutors. The system supports individual and group learning through a class-based approach, enables tutor collaboration via consortiums, provides secure payment processing, tracks academic progress, and includes gamification elements to drive engagement. The architecture follows a client-server model with a mobile frontend communicating with a RESTful backend API, integrated with third-party services for payments (Stripe), notifications (Firebase), and file storage (AWS S3).

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                       │
│                    (React Native/Expo)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │  Search  │  │ Booking  │  │ Progress │   │
│  │  Screens │  │  Screens │  │ Screens  │  │ Screens  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│                   (Load Balancer)                            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Auth       │    │   Tutor      │    │   Session    │
│   Service    │    │   Service    │    │   Service    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│              (Users, Sessions, Transactions)                 │
└─────────────────────────────────────────────────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    Redis     │    │ Elasticsearch│    │   AWS S3     │
│   (Cache)    │    │   (Search)   │    │   (Files)    │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Technology Stack

**Frontend:**
- React Native 0.81.5 with Expo SDK 54
- React Navigation for routing
- NativeWind for styling (Tailwind CSS)
- Expo Secure Store for token storage
- React Context API for state management

**Backend:**
- Node.js with Express or NestJS
- PostgreSQL for relational data
- Redis for caching and session management
- Elasticsearch for tutor search and matching

**Third-Party Services:**
- Stripe for payment processing
- Firebase Cloud Messaging for push notifications
- AWS S3 for file storage (documents, avatars)
- Google Maps API for location services

## Components and Interfaces

### Core Components

#### 1. Authentication Module
- **Registration Screen**: Collects user information and creates accounts
- **Login Screen**: Authenticates users with email/password
- **Profile Setup**: Guides users through role-specific profile completion
- **JWT Token Manager**: Handles token storage, refresh, and validation

#### 2. User Profile Module
- **Student Profile Component**: Displays and edits student information
- **Tutor Profile Component**: Manages tutor qualifications, availability, and rates
- **Document Upload Component**: Handles diploma and verification document uploads
- **Avatar Manager**: Manages profile picture upload and display

#### 3. Class Management Module
- **Class Creation Form**: Creates new classes with level and subject
- **Class Dashboard**: Displays class members, schedule, and statistics
- **Member Invitation Component**: Sends invitations via email or class code
- **Class Schedule Editor**: Defines and modifies class timetables

#### 4. Tutor Search Module
- **Search Filter Component**: Collects search criteria (price, location, subject)
- **Matching Algorithm Engine**: Calculates compatibility scores
- **Tutor List Component**: Displays search results with scores
- **Tutor Detail View**: Shows complete tutor profile with reviews

#### 5. Booking Module
- **Session Creation Form**: Schedules new tutoring sessions
- **Calendar Component**: Displays availability and booked sessions
- **Confirmation Dialog**: Confirms booking details before payment
- **Session Detail View**: Shows session information and actions

#### 6. Payment Module
- **Payment Intent Creator**: Initiates Stripe payment flow
- **Payment Form**: Collects payment method information
- **Transaction Processor**: Handles payment confirmation and fee distribution
- **Wallet Component**: Displays balance and transaction history

#### 7. Session Tracking Module
- **Check-in Component**: QR code or PIN-based attendance recording
- **Attendance Dashboard**: Shows presence/absence statistics
- **Session Report Form**: Tutor submits post-session reports
- **Report Viewer**: Students view session reports and feedback

#### 8. Progress Tracking Module
- **Academic Results Form**: Records exam scores and grades
- **Progress Chart Component**: Visualizes score evolution over time
- **Statistics Dashboard**: Displays hours, improvement, and achievements
- **Goal Tracker**: Manages learning objectives and milestones

#### 9. Gamification Module
- **Badge System**: Awards and displays achievement badges
- **Loyalty Points Manager**: Tracks and manages point accumulation
- **Leaderboard Component**: Shows top performers (optional)
- **Reward Notification**: Displays badge earning animations

#### 10. Marketplace Module
- **Product Catalog**: Lists educational resources for sale
- **Product Detail View**: Shows product information and preview
- **Purchase Flow**: Handles product purchase and download access
- **Seller Dashboard**: Manages product listings and sales

#### 11. Consortium Module
- **Consortium Creation Form**: Creates tutor collaboration groups
- **Revenue Policy Editor**: Defines payment distribution rules
- **Member Management**: Invites and manages consortium members
- **Consortium Dashboard**: Shows shared earnings and statistics

#### 12. Notification Module
- **Push Notification Handler**: Receives and displays notifications
- **Notification Center**: Lists all notifications with read status
- **Notification Preferences**: Manages notification settings
- **Email Notification Service**: Sends email notifications for critical events

### API Interfaces

#### Authentication Endpoints
```
POST   /api/auth/register          - Create new user account
POST   /api/auth/login             - Authenticate user
POST   /api/auth/refresh           - Refresh access token
POST   /api/auth/logout            - Invalidate tokens
POST   /api/auth/forgot-password   - Initiate password reset
POST   /api/auth/verify-email      - Verify email address
```

#### User Endpoints
```
GET    /api/users/me               - Get current user profile
PUT    /api/users/me               - Update user profile
POST   /api/users/me/avatar        - Upload profile picture
GET    /api/users/:id              - Get user by ID (public info)
```

#### Student Endpoints
```
POST   /api/students/profile       - Create student profile
PUT    /api/students/profile       - Update student profile
GET    /api/students/progress      - Get academic progress
POST   /api/students/results       - Add academic result
```

#### Tutor Endpoints
```
POST   /api/tutors/profile         - Create tutor profile
PUT    /api/tutors/profile         - Update tutor profile
PUT    /api/tutors/availability    - Update availability schedule
POST   /api/tutors/documents       - Upload verification documents
GET    /api/tutors/search          - Search tutors with filters
GET    /api/tutors/:id             - Get tutor details
GET    /api/tutors/:id/reviews     - Get tutor reviews
```

#### Class Endpoints
```
POST   /api/classes                - Create new class
GET    /api/classes/:id            - Get class details
PUT    /api/classes/:id            - Update class information
DELETE /api/classes/:id            - Delete class
POST   /api/classes/:id/members    - Add member to class
DELETE /api/classes/:id/members/:studentId - Remove member
GET    /api/classes/:id/schedule   - Get class schedule
PUT    /api/classes/:id/schedule   - Update class schedule
```

#### Session Endpoints
```
POST   /api/sessions               - Create new session
GET    /api/sessions/:id           - Get session details
PUT    /api/sessions/:id/status    - Update session status
DELETE /api/sessions/:id           - Cancel session
POST   /api/sessions/:id/checkin   - Record attendance check-in
POST   /api/sessions/:id/checkout  - Record attendance check-out
POST   /api/sessions/:id/report    - Submit session report
GET    /api/sessions/:id/report    - Get session report
```

#### Payment Endpoints
```
POST   /api/payments/intent        - Create payment intent
POST   /api/payments/confirm       - Confirm payment
GET    /api/payments/history       - Get transaction history
POST   /api/payments/withdraw      - Request withdrawal
GET    /api/payments/wallet        - Get wallet balance
```

#### Consortium Endpoints
```
POST   /api/consortiums            - Create consortium
GET    /api/consortiums/:id        - Get consortium details
PUT    /api/consortiums/:id        - Update consortium
POST   /api/consortiums/:id/members - Add member
DELETE /api/consortiums/:id/members/:tutorId - Remove member
PUT    /api/consortiums/:id/policy - Update revenue policy
```

#### Marketplace Endpoints
```
GET    /api/marketplace/products   - List products
GET    /api/marketplace/products/:id - Get product details
POST   /api/marketplace/products   - Create product listing
PUT    /api/marketplace/products/:id - Update product
POST   /api/marketplace/purchase   - Purchase product
GET    /api/marketplace/purchases  - Get user's purchases
```

#### Badge Endpoints
```
GET    /api/badges                 - List all badges
GET    /api/badges/earned          - Get user's earned badges
POST   /api/badges/check           - Check and award eligible badges
```

#### Notification Endpoints
```
GET    /api/notifications          - Get user notifications
PUT    /api/notifications/:id/read - Mark notification as read
PUT    /api/notifications/read-all - Mark all as read
PUT    /api/notifications/settings - Update notification preferences
```

## Data Models

### User Model
```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Unique
  phone: string | null;
  passwordHash: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  birthDate: Date | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  preferredLanguage: string;     // ISO 639-1 code
  role: 'student' | 'tutor' | 'admin';
  subscriptionType: 'free' | 'basic' | 'premium';
  subscriptionExpiresAt: Date | null;
  walletBalance: number;         // Decimal(10,2)
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  isActive: boolean;
}
```

### StudentProfile Model
```typescript
interface StudentProfile {
  id: string;
  userId: string;                // Foreign key to User
  educationLevel: string;        // e.g., "high_school", "university"
  schoolName: string | null;
  parentEmail: string | null;    // Required if age < 18
  parentPhone: string | null;
  learningGoals: string | null;
  preferredSubjects: string[];
  budgetPerHour: number | null;  // Decimal(10,2)
}
```

### TutorProfile Model
```typescript
interface TutorProfile {
  id: string;
  userId: string;
  bio: string | null;
  experienceYears: number;
  hourlyRate: number;            // Decimal(10,2)
  subjects: string[];
  educationLevels: string[];
  languages: string[];
  teachingMode: 'in-person' | 'online' | 'both';
  serviceRadius: number | null;  // km for in-person
  diplomas: Diploma[];
  availability: WeeklySchedule;
  totalHoursTaught: number;      // Decimal(10,2)
  averageRating: number;         // Decimal(3,2)
  totalReviews: number;
  isVerified: boolean;
  verificationDocuments: string[];
}

interface Diploma {
  name: string;
  institution: string;
  year: number;
  verified: boolean;
}

interface WeeklySchedule {
  [day: string]: TimeSlot[];     // e.g., "monday": [{start: "09:00", end: "12:00"}]
}

interface TimeSlot {
  start: string;                 // HH:mm format
  end: string;
}
```

### Class Model
```typescript
interface Class {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;             // User ID
  educationLevel: string;
  subject: string;
  maxStudents: number | null;
  meetingType: 'in-person' | 'online';
  meetingLocation: string | null;
  createdAt: Date;
  isActive: boolean;
}
```

### ClassMember Model
```typescript
interface ClassMember {
  id: string;
  classId: string;
  studentId: string;
  joinedAt: Date;
  isActive: boolean;
}
```

### Consortium Model
```typescript
interface Consortium {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;             // User ID
  revenueDistributionPolicy: RevenuePolicy;
  createdAt: Date;
  isActive: boolean;
}

interface RevenuePolicy {
  type: 'equal' | 'proportional' | 'custom';
  customShares?: { [tutorId: string]: number }; // Percentage
}
```

### ConsortiumMember Model
```typescript
interface ConsortiumMember {
  id: string;
  consortiumId: string;
  tutorId: string;
  role: 'coordinator' | 'member';
  revenueShare: number;          // Decimal(5,2) percentage
  joinedAt: Date;
}
```

### TutoringSession Model
```typescript
interface TutoringSession {
  id: string;
  classId: string;
  tutorId: string | null;
  consortiumId: string | null;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  location: string | null;
  onlineMeetingLink: string | null;
  subject: string;
  description: string | null;
  price: number;                 // Decimal(10,2)
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  cancellationReason: string | null;
  createdAt: Date;
}
```

### Attendance Model
```typescript
interface Attendance {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
  checkInTime: Date | null;
  checkOutTime: Date | null;
  notes: string | null;
}
```

### SessionReport Model
```typescript
interface SessionReport {
  id: string;
  sessionId: string;
  tutorId: string;
  topicsCovered: string | null;
  homeworkAssigned: string | null;
  studentPerformance: { [studentId: string]: Performance };
  notes: string | null;
  createdAt: Date;
}

interface Performance {
  participation: number;         // 1-5
  understanding: number;         // 1-5
}
```

### Review Model
```typescript
interface Review {
  id: string;
  sessionId: string;
  reviewerId: string;            // Student or tutor
  revieweeId: string;            // Tutor or student
  rating: number;                // 1-5
  comment: string | null;
  createdAt: Date;
}
```

### Transaction Model
```typescript
interface Transaction {
  id: string;
  sessionId: string | null;
  payerId: string;
  payeeId: string | null;
  amount: number;                // Decimal(10,2)
  platformFee: number;           // Decimal(10,2)
  netAmount: number;             // Decimal(10,2)
  paymentMethod: string;
  paymentProviderId: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionType: 'session_payment' | 'subscription' | 'shop_purchase';
  createdAt: Date;
}
```

### Badge Model
```typescript
interface Badge {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  category: 'student' | 'tutor' | 'both';
  criteria: BadgeCriteria;
}

interface BadgeCriteria {
  type: string;                  // e.g., "attendance_rate", "hours_taught"
  threshold: number;
  period: string | null;         // e.g., "1_month", "all_time"
}
```

### UserBadge Model
```typescript
interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Date;
}
```

### AcademicResult Model
```typescript
interface AcademicResult {
  id: string;
  studentId: string;
  subject: string;
  examName: string;
  score: number;                 // Decimal(5,2)
  maxScore: number;              // Decimal(5,2)
  examDate: Date;
  createdAt: Date;
}
```

### ShopProduct Model
```typescript
interface ShopProduct {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  productType: 'book' | 'exam' | 'flashcards' | 'video' | 'other';
  subject: string;
  educationLevel: string;
  price: number;                 // Decimal(10,2)
  fileUrl: string | null;
  previewUrl: string | null;
  downloadsCount: number;
  rating: number;                // Decimal(3,2)
  isActive: boolean;
  createdAt: Date;
}
```

### ShopPurchase Model
```typescript
interface ShopPurchase {
  id: string;
  productId: string;
  buyerId: string;
  amountPaid: number;            // Decimal(10,2)
  transactionId: string;
  purchasedAt: Date;
}
```

### Notification Model
```typescript
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;                  // e.g., "session_booked", "badge_earned"
  data: any;                     // JSON payload
  isRead: boolean;
  createdAt: Date;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Account creation with valid data
*For any* valid registration data (email, password, name, education level, subjects), creating a student account should result in a new account with all provided information correctly stored and a wallet balance of zero.
**Validates: Requirements 1.1, 1.5**

### Property 2: Email verification on registration
*For any* newly created student account, a verification email should be sent to the provided email address.
**Validates: Requirements 1.2**

### Property 3: Duplicate email rejection
*For any* email address already registered in the system, attempting to register a new account with that email should be rejected with an error message.
**Validates: Requirements 1.4**

### Property 4: Tutor profile creation
*For any* valid tutor profile data (bio, subjects, levels, rate, availability), creating a tutor profile should result in a new profile with verification status set to false.
**Validates: Requirements 2.1, 2.5**

### Property 5: Document upload and verification status
*For any* tutor uploading diploma documents, the documents should be stored and the profile should be marked as pending verification.
**Validates: Requirements 2.2**

### Property 6: Availability storage structure
*For any* weekly availability schedule defined by a tutor, the schedule should be stored as a structured format with time slots that can be queried for availability checks.
**Validates: Requirements 2.4**

### Property 7: Class creation with administrator
*For any* student creating a class with valid data (name, level, subject), a new class should be created with the student assigned as administrator.
**Validates: Requirements 3.1**

### Property 8: Class invitation notifications
*For any* class administrator inviting students via email or code, invitation notifications should be sent to all specified students.
**Validates: Requirements 3.2**

### Property 9: Education level matching on join
*For any* student attempting to join a class, the join should succeed only if the student's education level matches the class education level.
**Validates: Requirements 3.3**

### Property 10: Class homogeneity invariant
*For any* class with members, all members should have the same education level as the class.
**Validates: Requirements 3.4**

### Property 11: Multiple class membership
*For any* student who is a member of one class, the student should be able to join additional classes without restriction.
**Validates: Requirements 3.5**

### Property 12: Search results match criteria
*For any* search criteria (subject, level, price, availability, location), all returned tutors should match the specified criteria.
**Validates: Requirements 4.1**

### Property 13: Matching score calculation
*For any* tutor-class pair, the matching score should be calculated with weights: availability 30%, price 20%, location 15%, language 15%, education level 10%, ratings 10%.
**Validates: Requirements 4.2**

### Property 14: Search results sorting
*For any* search results, tutors should be sorted by matching score in descending order.
**Validates: Requirements 4.3**

### Property 15: Distance filtering
*For any* search with maximum distance filter, all returned tutors should either be within the specified radius or offer online sessions.
**Validates: Requirements 4.4**

### Property 16: Rating filtering
*For any* search with minimum rating filter, all returned tutors should have average ratings equal to or above the specified threshold.
**Validates: Requirements 4.5**

### Property 17: Consortium creation with coordinator
*For any* tutor creating a consortium with valid data, a new consortium should be created with the tutor assigned as coordinator.
**Validates: Requirements 5.1**

### Property 18: Consortium invitation notifications
*For any* consortium coordinator inviting tutors, invitation notifications should be sent to all specified tutors.
**Validates: Requirements 5.2**

### Property 19: Revenue share assignment
*For any* tutor joining a consortium, a revenue share percentage should be assigned according to the consortium's distribution policy.
**Validates: Requirements 5.3**

### Property 20: Revenue shares sum to 100%
*For any* consortium with multiple members, the sum of all member revenue shares should equal 100%.
**Validates: Requirements 5.4**

### Property 21: Policy change notifications
*For any* consortium coordinator updating the revenue distribution policy, all consortium members should receive notifications of the change.
**Validates: Requirements 5.5**

### Property 22: Session creation with pending status
*For any* valid session booking data (tutor, date, time, duration, location), creating a session should result in a new session with status "pending".
**Validates: Requirements 6.1**

### Property 23: Availability verification on booking
*For any* session booking attempt, the booking should succeed only if the tutor is available during the requested time slot.
**Validates: Requirements 6.2**

### Property 24: Conflict detection
*For any* session booking that overlaps with an existing confirmed session for the tutor, the booking should be rejected with an error message.
**Validates: Requirements 6.3**

### Property 25: Session booking notifications
*For any* newly created session, notifications should be sent to the tutor and all class members.
**Validates: Requirements 6.4**

### Property 26: Session confirmation and blocking
*For any* tutor confirming a pending session, the session status should update to "confirmed" and the time slot should be blocked from future bookings.
**Validates: Requirements 6.5**

### Property 27: Payment intent creation
*For any* student confirming a session booking, a payment intent should be created with an amount equal to the session price.
**Validates: Requirements 7.1**

### Property 28: Platform fee deduction
*For any* successfully processed payment, the platform fee of 15% should be deducted from the total amount.
**Validates: Requirements 7.2**

### Property 29: Tutor wallet credit
*For any* completed payment, the net amount (total minus platform fee) should be added to the tutor's wallet balance.
**Validates: Requirements 7.3**

### Property 30: Consortium revenue distribution
*For any* completed payment for a consortium session, the net amount should be distributed to consortium members according to their revenue share percentages.
**Validates: Requirements 7.4**

### Property 31: Payment failure handling
*For any* failed payment, the associated session should be cancelled and the student should receive a notification with the failure reason.
**Validates: Requirements 7.5**

### Property 32: Check-in recording
*For any* student checking in to a session using QR code or PIN, the check-in time should be recorded and attendance status should be marked as "present".
**Validates: Requirements 8.2**

### Property 33: Automatic absence marking
*For any* session where a student does not check in before the session end time, the student's attendance should be marked as "absent".
**Validates: Requirements 8.3**

### Property 34: Duration recording
*For any* tutor checking out at session end, the actual session duration should be calculated and recorded.
**Validates: Requirements 8.4**

### Property 35: Duration discrepancy flagging
*For any* session where actual duration differs from scheduled duration by more than 15 minutes, the session should be flagged for review.
**Validates: Requirements 8.5**

### Property 36: Session report storage
*For any* tutor submitting a session report with topics, homework, and performance ratings, the report should be stored and linked to the session.
**Validates: Requirements 9.2**

### Property 37: Report submission notifications
*For any* submitted session report, all class members should receive notifications that the report is available.
**Validates: Requirements 9.3**

### Property 38: Academic result storage
*For any* student adding an academic result with subject, exam name, score, and date, the result should be stored in the student's academic history.
**Validates: Requirements 10.1**

### Property 39: Improvement calculation
*For any* student with academic results before and after tutoring sessions, the percentage improvement should be calculated correctly.
**Validates: Requirements 10.3**

### Property 40: Progressiste badge awarding
*For any* student whose average score increases by 10% or more, the Progressiste badge should be awarded.
**Validates: Requirements 10.4**

### Property 41: Assidu badge awarding
*For any* student achieving 95% or higher attendance rate over one month, the Assidu badge should be awarded.
**Validates: Requirements 11.1**

### Property 42: Mentor badge awarding
*For any* tutor completing 100 hours of tutoring, the Mentor badge should be awarded.
**Validates: Requirements 11.2**

### Property 43: Pédagogue badge awarding
*For any* tutor receiving an average rating of 4.5 or higher over 20 sessions, the Pédagogue badge should be awarded.
**Validates: Requirements 11.3**

### Property 44: Badge earning rewards
*For any* user earning a badge, a notification should be sent and 100 loyalty points should be added to the user's account.
**Validates: Requirements 11.4**

### Property 45: Marketplace commission deduction
*For any* completed product purchase, 30% platform commission should be deducted from the product price.
**Validates: Requirements 12.2**

### Property 46: Seller wallet credit
*For any* completed product purchase, 70% of the product price should be transferred to the seller's wallet.
**Validates: Requirements 12.3**

### Property 47: Download access granting
*For any* completed product purchase, the student should be granted access to download the product file.
**Validates: Requirements 12.4**

### Property 48: Duplicate purchase prevention
*For any* student who has already purchased a product, attempting to purchase the same product again should be prevented, while allowing re-download.
**Validates: Requirements 12.5**

### Property 49: Premium exam bank access
*For any* student with premium subscription accessing the exam bank, available exams should be displayed filtered by the student's subject and education level.
**Validates: Requirements 13.1**

### Property 50: Exam answer recording
*For any* student starting an exam, questions should be presented and answers should be recorded as the student progresses.
**Validates: Requirements 13.2**

### Property 51: Automatic exam grading
*For any* student completing a multiple-choice exam, the exam should be automatically graded and the score should be displayed.
**Validates: Requirements 13.3**

### Property 52: Manual grading assignment
*For any* exam requiring manual correction, the exam should be assigned to a qualified tutor for grading.
**Validates: Requirements 13.4**

### Property 53: Non-premium exam bank access
*For any* student without premium subscription attempting to access the exam bank, a subscription upgrade prompt should be displayed.
**Validates: Requirements 13.5**

### Property 54: Basic subscription features
*For any* student subscribing to the basic plan at 5 currency units per month, access should be granted to platform features and one active class.
**Validates: Requirements 14.1**

### Property 55: Premium subscription features
*For any* student subscribing to the premium plan at 15 currency units per month, access should be granted to unlimited classes, exam bank, and priority support.
**Validates: Requirements 14.2**

### Property 56: Pro subscription benefits
*For any* tutor subscribing to the pro plan at 30 currency units per month, platform commission should be reduced to 10% and the verified badge should be granted.
**Validates: Requirements 14.3**

### Property 57: Subscription payment failure handling
*For any* subscription payment failure, a notification should be sent and the account should be downgraded after 7 days grace period.
**Validates: Requirements 14.4**

### Property 58: Subscription expiration restrictions
*For any* expired subscription, access to premium features should be restricted while maintaining access to basic functionality.
**Validates: Requirements 14.5**

### Property 59: Full refund on early cancellation
*For any* session cancelled more than 24 hours before the scheduled start, a full refund should be processed.
**Validates: Requirements 15.1**

### Property 60: Partial refund on late cancellation
*For any* session cancelled less than 24 hours but more than 2 hours before the scheduled start, a 50% refund should be processed.
**Validates: Requirements 15.2**

### Property 61: No refund on very late cancellation
*For any* session cancelled less than 2 hours before the scheduled start, no refund should be processed.
**Validates: Requirements 15.3**

### Property 62: Cancellation notifications
*For any* cancelled session, notifications should be sent to the tutor and all class members.
**Validates: Requirements 15.4**

### Property 63: Reschedule availability check
*For any* session reschedule request, tutor availability should be verified for the new time slot before confirming the reschedule.
**Validates: Requirements 15.5**

### Property 64: Withdrawal minimum balance
*For any* tutor requesting a withdrawal, the request should succeed only if the available balance is at least 20 currency units.
**Validates: Requirements 16.3**

### Property 65: Review storage and linking
*For any* student submitting a rating with optional comment, the review should be stored and linked to the session.
**Validates: Requirements 17.2**

### Property 66: Average rating recalculation
*For any* new review submission, the tutor's average rating should be recalculated to include the new review.
**Validates: Requirements 17.3**

### Property 67: Rating calculation time window
*For any* tutor's average rating calculation, only reviews from the last 12 months should be included.
**Validates: Requirements 17.4**

### Property 68: Review flagging
*For any* review containing inappropriate content, the system should allow flagging for moderation review.
**Validates: Requirements 17.5**

### Property 69: Verification document submission notification
*For any* tutor submitting verification documents, administrators should receive notifications of pending verification.
**Validates: Requirements 18.1**

### Property 70: Verification approval
*For any* administrator approving verification documents, the tutor's verification status should be set to true and the Expert Vérifié badge should be awarded.
**Validates: Requirements 18.2**

### Property 71: Verification rejection notification
*For any* administrator rejecting verification, the tutor should receive a notification with rejection reasons.
**Validates: Requirements 18.3**

### Property 72: Verification expiration
*For any* tutor whose verification has been active for 2 years, a document renewal request should be sent.
**Validates: Requirements 18.5**

### Property 73: Session event notifications
*For any* session being booked, confirmed, cancelled, or approaching, push notifications should be sent to all involved parties.
**Validates: Requirements 19.1**

### Property 74: Badge earning notification
*For any* user earning a badge, a notification should be sent with badge details.
**Validates: Requirements 19.2**

### Property 75: Payment notifications
*For any* payment being processed or failing, a notification should be sent with transaction details.
**Validates: Requirements 19.3**

### Property 76: Review notification
*For any* user receiving a review, a notification should be sent with the rating and comment.
**Validates: Requirements 19.4**

### Property 77: Notification preferences
*For any* user who has disabled notifications in settings, only critical notifications should be sent.
**Validates: Requirements 19.5**

### Property 78: Parent email linking
*For any* student account created for a minor, the parent email should be linked to the student account.
**Validates: Requirements 20.1**

### Property 79: Parent session summary
*For any* completed session for a minor student, a summary email should be sent to the linked parent email.
**Validates: Requirements 20.2**

### Property 80: Parent attendance alert
*For any* student whose attendance drops below 80%, an alert should be sent to the parent email.
**Validates: Requirements 20.4**

## Error Handling

### Error Categories

#### 1. Validation Errors
- **Invalid Input**: User provides data that doesn't meet format or constraint requirements
- **Missing Required Fields**: Required information is not provided
- **Constraint Violations**: Data violates business rules (e.g., hourly rate out of range)

**Handling Strategy:**
- Return HTTP 400 Bad Request with detailed error messages
- Provide field-level validation feedback in API responses
- Display user-friendly error messages in the UI

#### 2. Authentication/Authorization Errors
- **Invalid Credentials**: Login attempt with wrong email/password
- **Expired Token**: JWT token has expired
- **Insufficient Permissions**: User attempts action they're not authorized for

**Handling Strategy:**
- Return HTTP 401 Unauthorized for authentication failures
- Return HTTP 403 Forbidden for authorization failures
- Redirect to login screen on token expiration
- Clear stored tokens and require re-authentication

#### 3. Resource Not Found Errors
- **Entity Not Found**: Requested user, session, class, etc. doesn't exist
- **Deleted Resource**: Resource was deleted but still referenced

**Handling Strategy:**
- Return HTTP 404 Not Found with resource type and ID
- Display "Resource not found" message to user
- Provide navigation back to valid state

#### 4. Conflict Errors
- **Duplicate Resource**: Attempting to create resource that already exists (e.g., email)
- **Scheduling Conflict**: Session overlaps with existing booking
- **Concurrent Modification**: Resource was modified by another user

**Handling Strategy:**
- Return HTTP 409 Conflict with conflict details
- Suggest alternative actions (e.g., different time slot)
- Implement optimistic locking for concurrent modifications

#### 5. Payment Errors
- **Payment Failed**: Stripe payment processing failed
- **Insufficient Funds**: Wallet balance too low for withdrawal
- **Invalid Payment Method**: Payment method declined or invalid

**Handling Strategy:**
- Return HTTP 402 Payment Required or 400 Bad Request
- Display specific payment error from Stripe
- Offer alternative payment methods
- Log payment failures for investigation

#### 6. External Service Errors
- **Third-Party API Failure**: Stripe, Firebase, S3, etc. unavailable
- **Network Timeout**: Request to external service times out
- **Rate Limiting**: Too many requests to external service

**Handling Strategy:**
- Implement retry logic with exponential backoff
- Return HTTP 503 Service Unavailable for temporary failures
- Queue operations for later processing when possible
- Display maintenance message to users

#### 7. Server Errors
- **Unhandled Exception**: Unexpected error in application code
- **Database Error**: Database connection or query failure
- **Out of Memory**: Server resource exhaustion

**Handling Strategy:**
- Return HTTP 500 Internal Server Error
- Log full error details with stack trace
- Send alerts to monitoring system (Sentry)
- Display generic error message to user (don't expose internals)
- Implement circuit breakers for cascading failures

### Error Response Format

All API errors follow a consistent JSON format:

```typescript
interface ErrorResponse {
  error: {
    code: string;              // Machine-readable error code
    message: string;           // Human-readable error message
    details?: any;             // Additional error details
    field?: string;            // Field name for validation errors
    timestamp: string;         // ISO 8601 timestamp
    requestId: string;         // Unique request ID for tracking
  }
}
```

Example:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Hourly rate must be between 5 and 500",
    "field": "hourlyRate",
    "details": {
      "min": 5,
      "max": 500,
      "provided": 600
    },
    "timestamp": "2025-12-20T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Retry and Recovery Strategies

#### Idempotent Operations
- Use idempotency keys for payment operations
- Allow safe retry of GET, PUT, DELETE requests
- Implement idempotency for critical POST operations

#### Graceful Degradation
- Cache tutor search results when Elasticsearch is unavailable
- Allow offline mode for viewing previously loaded data
- Queue notifications for delivery when service recovers

#### User Feedback
- Show loading states during operations
- Display progress for long-running operations
- Provide clear error messages with suggested actions
- Allow users to retry failed operations

## Testing Strategy

### Unit Testing

Unit tests verify individual functions, components, and modules in isolation. They should be fast, focused, and cover specific behaviors.

**Framework:** Jest for JavaScript/TypeScript

**Coverage Goals:**
- Business logic functions: 90%+ coverage
- Utility functions: 95%+ coverage
- API route handlers: 85%+ coverage

**Unit Test Examples:**
- Matching score calculation with various input combinations
- Revenue distribution calculation for consortiums
- Refund amount calculation based on cancellation timing
- Badge eligibility checking logic
- Input validation functions

**Best Practices:**
- Mock external dependencies (database, APIs)
- Test edge cases and boundary conditions
- Use descriptive test names that explain the scenario
- Keep tests independent and isolated
- Test both success and failure paths

### Property-Based Testing

Property-based tests verify universal properties that should hold across all inputs by generating random test data and checking invariants.

**Framework:** fast-check for JavaScript/TypeScript

**Configuration:**
- Minimum 100 iterations per property test
- Use appropriate generators for domain types
- Shrink failing examples to minimal cases

**Property Test Requirements:**
- Each correctness property from the design document MUST be implemented as a property-based test
- Each test MUST be tagged with a comment referencing the design document property
- Tag format: `// Feature: genova-mobile-app, Property N: [property text]`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Property Test Examples:**

```typescript
// Feature: genova-mobile-app, Property 1: Account creation with valid data
test('account creation stores all provided data correctly', () => {
  fc.assert(
    fc.property(
      fc.record({
        email: fc.emailAddress(),
        password: fc.string({ minLength: 8 }),
        firstName: fc.string({ minLength: 1 }),
        lastName: fc.string({ minLength: 1 }),
        educationLevel: fc.constantFrom('primary', 'middle_school', 'high_school', 'university'),
        subjects: fc.array(fc.string(), { minLength: 1 })
      }),
      async (registrationData) => {
        const account = await createStudentAccount(registrationData);
        expect(account.email).toBe(registrationData.email);
        expect(account.firstName).toBe(registrationData.firstName);
        expect(account.walletBalance).toBe(0);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: genova-mobile-app, Property 20: Revenue shares sum to 100%
test('consortium revenue shares always sum to 100%', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        tutorId: fc.uuid(),
        share: fc.float({ min: 0.01, max: 1 })
      }), { minLength: 2, maxLength: 10 }),
      (members) => {
        const consortium = createConsortium(members);
        const totalShare = consortium.members.reduce((sum, m) => sum + m.revenueShare, 0);
        expect(totalShare).toBeCloseTo(100, 2);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: genova-mobile-app, Property 28: Platform fee deduction
test('platform fee is always 15% of payment amount', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 10, max: 1000 }),
      async (amount) => {
        const payment = await processPayment({ amount });
        const expectedFee = amount * 0.15;
        expect(payment.platformFee).toBeCloseTo(expectedFee, 2);
        expect(payment.netAmount).toBeCloseTo(amount - expectedFee, 2);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Generator Guidelines:**
- Create custom generators for domain types (User, Session, Class, etc.)
- Ensure generated data satisfies domain constraints
- Use realistic value ranges (e.g., hourly rates 5-500)
- Generate edge cases (empty arrays, boundary values)

### Integration Testing

Integration tests verify that multiple components work together correctly, including database interactions and API endpoints.

**Framework:** Jest with Supertest for API testing

**Scope:**
- API endpoint flows (register → login → create profile)
- Database operations (create, read, update, delete)
- Service interactions (payment processing, notifications)

**Integration Test Examples:**
- Complete booking flow: search → select → book → pay
- Class creation and member invitation flow
- Session completion and report submission flow
- Badge awarding based on accumulated data

### End-to-End Testing

E2E tests verify complete user workflows through the mobile application.

**Framework:** Detox for React Native

**Scope:**
- Critical user journeys
- Cross-screen navigation
- Real device/simulator testing

**E2E Test Examples:**
- Student registration and first session booking
- Tutor profile setup and session confirmation
- Payment processing and wallet management
- Progress tracking and badge earning

### Test Organization

```
tests/
├── unit/
│   ├── services/
│   │   ├── matching.test.ts
│   │   ├── payment.test.ts
│   │   └── badge.test.ts
│   ├── utils/
│   │   ├── validation.test.ts
│   │   └── calculation.test.ts
│   └── models/
│       └── user.test.ts
├── property/
│   ├── account.property.test.ts
│   ├── payment.property.test.ts
│   ├── session.property.test.ts
│   └── consortium.property.test.ts
├── integration/
│   ├── api/
│   │   ├── auth.integration.test.ts
│   │   ├── booking.integration.test.ts
│   │   └── payment.integration.test.ts
│   └── database/
│       └── transactions.integration.test.ts
└── e2e/
    ├── student-journey.e2e.ts
    ├── tutor-journey.e2e.ts
    └── payment-flow.e2e.ts
```

### Continuous Integration

- Run unit and property tests on every commit
- Run integration tests on pull requests
- Run E2E tests nightly or before releases
- Maintain test coverage above 80%
- Block merges if tests fail or coverage drops

### Test Data Management

- Use factories for creating test data
- Seed database with realistic test data
- Clean up test data after each test
- Use separate test database
- Mock external services (Stripe, Firebase) in tests

## Performance Considerations

### Mobile App Performance
- Lazy load screens and components
- Implement pagination for lists (tutors, sessions, transactions)
- Cache frequently accessed data (user profile, preferences)
- Optimize images (compress, use appropriate formats)
- Minimize bundle size (code splitting, tree shaking)

### API Performance
- Implement database indexing on frequently queried fields
- Use Redis caching for expensive queries (tutor search)
- Implement rate limiting to prevent abuse
- Use connection pooling for database connections
- Optimize N+1 queries with eager loading

### Search Performance
- Use Elasticsearch for tutor search and matching
- Index tutors by location, subjects, availability
- Implement search result caching
- Limit search results to top 50 matches

### Real-time Features
- Use WebSockets for chat and notifications
- Implement connection pooling for WebSocket connections
- Batch notifications to reduce overhead
- Use Firebase Cloud Messaging for push notifications

## Security Considerations

### Authentication Security
- Hash passwords with bcrypt (cost factor 12)
- Implement JWT with short expiration (15 minutes access, 7 days refresh)
- Store tokens securely (Expo Secure Store)
- Implement token rotation on refresh
- Add rate limiting on login attempts

### Authorization Security
- Implement role-based access control (RBAC)
- Verify user permissions on every API request
- Prevent horizontal privilege escalation (users accessing other users' data)
- Validate resource ownership before modifications

### Data Security
- Encrypt sensitive data at rest (payment methods, documents)
- Use HTTPS for all API communication
- Implement SQL injection prevention (parameterized queries)
- Sanitize user input to prevent XSS attacks
- Implement CSRF protection for state-changing operations

### Payment Security
- Use Stripe for PCI-DSS compliant payment processing
- Never store credit card numbers
- Use Stripe tokens for payment methods
- Implement 3D Secure for high-value transactions
- Log all payment operations for audit trail

### Minor Protection
- Verify age on registration
- Require parental consent for users under 18
- Verify tutor credentials and background checks
- Implement content moderation for reviews and messages
- Provide reporting mechanism for inappropriate behavior

### API Security
- Implement rate limiting (100 requests per minute per user)
- Use API keys for third-party integrations
- Validate all input data
- Implement request signing for sensitive operations
- Log security events for monitoring

## Deployment Strategy

### Environment Setup
- Development: Local development with mock services
- Staging: Cloud environment mirroring production
- Production: Scalable cloud infrastructure

### Database Migrations
- Use migration tools (e.g., Knex, TypeORM migrations)
- Version control all migrations
- Test migrations on staging before production
- Implement rollback procedures

### Mobile App Deployment
- Use Expo EAS Build for app builds
- Submit to App Store and Google Play
- Implement over-the-air (OTA) updates for minor changes
- Use staged rollouts (10% → 50% → 100%)

### Backend Deployment
- Use containerization (Docker)
- Implement blue-green deployment
- Use health checks for zero-downtime deployment
- Implement automatic rollback on failure

### Monitoring and Alerting
- Use Sentry for error tracking
- Implement application performance monitoring (APM)
- Set up alerts for critical errors
- Monitor key metrics (response time, error rate, user activity)

## Scalability Plan

### Horizontal Scaling
- Design stateless API servers
- Use load balancer for traffic distribution
- Implement auto-scaling based on CPU/memory usage
- Use CDN for static assets

### Database Scaling
- Implement read replicas for read-heavy operations
- Use connection pooling
- Implement database sharding if needed
- Use caching to reduce database load

### Caching Strategy
- Cache tutor search results (5 minutes TTL)
- Cache user profiles (15 minutes TTL)
- Cache static content (images, documents) on CDN
- Implement cache invalidation on data updates

### Queue System
- Use message queue for async operations (email sending, notifications)
- Implement job retry logic
- Monitor queue length and processing time
- Scale workers based on queue depth

## Future Enhancements

### Phase 2 Features
- In-app chat between students and tutors
- Video conferencing integration
- AI-powered tutor recommendations
- Advanced analytics dashboard
- Mobile app for tablets

### Phase 3 Features
- Web application (PWA)
- API for third-party integrations
- White-label solution for schools
- Multi-language support
- Cryptocurrency payment option

### Long-term Vision
- AI tutoring assistant
- VR/AR learning experiences
- Blockchain-based certifications
- Expansion to corporate training market
- Global marketplace with multi-currency support
