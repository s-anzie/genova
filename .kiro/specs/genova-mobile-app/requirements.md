# Requirements Document - Genova Mobile Application

## Introduction

Genova est une plateforme mobile de mise en relation entre tuteurs et étudiants qui facilite l'organisation de sessions de tutorat individuelles et collectives. Le système permet aux étudiants de créer des classes homogènes, de rechercher des tuteurs qualifiés selon des critères précis, de gérer des emplois du temps, d'effectuer des paiements sécurisés, et de suivre leur progression académique. Les tuteurs peuvent proposer leurs services, se regrouper en consortiums, gérer leurs disponibilités et leurs revenus. La plateforme intègre également un système de gamification, une marketplace de ressources éducatives et une banque d'épreuves.

## Glossary

- **Genova System**: L'application mobile complète incluant les interfaces utilisateur, le backend et les services tiers
- **Student**: Un utilisateur inscrit qui recherche et réserve des sessions de tutorat
- **Tutor**: Un utilisateur vérifié qui propose des services de tutorat
- **Class**: Un groupe d'étudiants partageant le même niveau, la même matière et les mêmes besoins
- **Consortium**: Un groupe de tuteurs collaborant ensemble avec des politiques de rémunération partagées
- **Session**: Une période planifiée de tutorat entre un tuteur et une classe
- **Matching Score**: Un score calculé déterminant la compatibilité entre un tuteur et une classe
- **Platform Fee**: La commission prélevée par la plateforme sur chaque transaction
- **Attendance**: L'enregistrement de la présence ou absence d'un étudiant à une session
- **Badge**: Une récompense virtuelle attribuée pour des accomplissements spécifiques
- **Marketplace**: La boutique intégrée vendant des ressources éducatives
- **Exam Bank**: La banque d'épreuves contenant des examens blancs et corrections

## Requirements

### Requirement 1

**User Story:** As a student, I want to create an account with my educational information, so that I can access tutoring services tailored to my level and needs.

#### Acceptance Criteria

1. WHEN a user submits registration information with valid email, password, name, education level, and preferred subjects, THEN the Genova System SHALL create a new student account
2. WHEN a student account is created, THEN the Genova System SHALL send a verification email to the provided email address
3. WHEN a student provides an age below 18 years, THEN the Genova System SHALL require parental consent information before account activation
4. WHEN a student submits registration with an email already in the system, THEN the Genova System SHALL reject the registration and display an error message
5. WHEN a student completes registration, THEN the Genova System SHALL initialize a wallet balance at zero

### Requirement 2

**User Story:** As a tutor, I want to create a professional profile with my qualifications and availability, so that students can find and book my services.

#### Acceptance Criteria

1. WHEN a tutor submits profile information including bio, subjects, education levels, hourly rate, and availability, THEN the Genova System SHALL create a tutor profile
2. WHEN a tutor uploads diploma documents, THEN the Genova System SHALL store the documents and mark the profile as pending verification
3. WHEN a tutor sets hourly rates, THEN the Genova System SHALL validate that rates are between 5 and 500 currency units
4. WHEN a tutor defines weekly availability, THEN the Genova System SHALL store the availability as a structured schedule with time slots
5. WHEN a tutor profile is created, THEN the Genova System SHALL set the verification status to false until documents are reviewed

### Requirement 3

**User Story:** As a student, I want to create a class and invite other students, so that we can learn together with the same tutor.

#### Acceptance Criteria

1. WHEN a student creates a class with name, description, education level, and subject, THEN the Genova System SHALL create a new class with the student as administrator
2. WHEN a class administrator invites students via email or class code, THEN the Genova System SHALL send invitation notifications to the specified students
3. WHEN a student joins a class, THEN the Genova System SHALL verify that the student's education level matches the class education level
4. WHEN a class contains members, THEN the Genova System SHALL allow only members of the same education level and subject need
5. WHEN a student is already a member of a class, THEN the Genova System SHALL allow the student to join additional classes without restriction

### Requirement 4

**User Story:** As a student, I want to search for tutors using specific criteria, so that I can find the best match for my learning needs.

#### Acceptance Criteria

1. WHEN a student submits search criteria including subject, education level, price range, availability, and location, THEN the Genova System SHALL return a list of matching tutors
2. WHEN the Genova System calculates matching scores, THEN the Genova System SHALL weight availability at 30%, price at 20%, location at 15%, language at 15%, education level at 10%, and ratings at 10%
3. WHEN search results are returned, THEN the Genova System SHALL sort tutors by matching score in descending order
4. WHEN a student filters by maximum distance, THEN the Genova System SHALL return only tutors within the specified radius or offering online sessions
5. WHEN a student filters by minimum rating, THEN the Genova System SHALL return only tutors with average ratings equal to or above the specified threshold

### Requirement 5

**User Story:** As a tutor, I want to create or join a consortium with other tutors, so that we can collaborate and share revenue according to agreed policies.

#### Acceptance Criteria

1. WHEN a tutor creates a consortium with name, description, and revenue distribution policy, THEN the Genova System SHALL create a new consortium with the tutor as coordinator
2. WHEN a consortium coordinator invites tutors, THEN the Genova System SHALL send invitation notifications to the specified tutors
3. WHEN a tutor joins a consortium, THEN the Genova System SHALL assign a revenue share percentage according to the consortium policy
4. WHEN a consortium has multiple members, THEN the Genova System SHALL ensure the sum of all revenue shares equals 100%
5. WHEN a consortium coordinator updates the revenue distribution policy, THEN the Genova System SHALL notify all consortium members of the change

### Requirement 6

**User Story:** As a student, I want to book a tutoring session with a selected tutor or consortium, so that I can schedule my learning activities.

#### Acceptance Criteria

1. WHEN a student selects a tutor, date, time, duration, and location for a session, THEN the Genova System SHALL create a pending session reservation
2. WHEN a session is created, THEN the Genova System SHALL verify that the tutor is available during the requested time slot
3. WHEN a session conflicts with an existing confirmed session for the tutor, THEN the Genova System SHALL reject the booking and display an error message
4. WHEN a session is created, THEN the Genova System SHALL send notification to the tutor and all class members
5. WHEN a tutor confirms a pending session, THEN the Genova System SHALL update the session status to confirmed and block the time slot

### Requirement 7

**User Story:** As a student, I want to pay for tutoring sessions through the app, so that all transactions are secure and traceable.

#### Acceptance Criteria

1. WHEN a student confirms a session booking, THEN the Genova System SHALL create a payment intent with the session price
2. WHEN a payment is processed successfully, THEN the Genova System SHALL deduct the platform fee of 15% from the total amount
3. WHEN a payment is completed, THEN the Genova System SHALL transfer the net amount to the tutor's wallet balance
4. WHEN a consortium provides the session, THEN the Genova System SHALL distribute the net amount according to the consortium revenue policy
5. WHEN a payment fails, THEN the Genova System SHALL cancel the session and notify the student with the failure reason

### Requirement 8

**User Story:** As a student or tutor, I want to check in and out of sessions, so that attendance is accurately recorded.

#### Acceptance Criteria

1. WHEN a session start time arrives, THEN the Genova System SHALL enable check-in functionality for the tutor and students
2. WHEN a student checks in using QR code or PIN, THEN the Genova System SHALL record the check-in time and mark attendance as present
3. WHEN a session end time passes without a student checking in, THEN the Genova System SHALL mark the student attendance as absent
4. WHEN a tutor checks out at session end, THEN the Genova System SHALL record the actual session duration
5. WHEN actual session duration differs from scheduled duration by more than 15 minutes, THEN the Genova System SHALL flag the session for review

### Requirement 9

**User Story:** As a tutor, I want to submit a session report after each session, so that students can track what was covered and their progress.

#### Acceptance Criteria

1. WHEN a session is completed, THEN the Genova System SHALL prompt the tutor to submit a session report
2. WHEN a tutor submits a report with topics covered, homework assigned, and student performance ratings, THEN the Genova System SHALL store the report and link it to the session
3. WHEN a session report is submitted, THEN the Genova System SHALL notify all class members that the report is available
4. WHEN a student views a session report, THEN the Genova System SHALL display topics covered, homework, and the student's individual performance rating
5. WHEN a tutor rates student performance on a scale of 1 to 5, THEN the Genova System SHALL validate that ratings are within the valid range

### Requirement 10

**User Story:** As a student, I want to track my academic progress over time, so that I can measure the effectiveness of tutoring.

#### Acceptance Criteria

1. WHEN a student adds an academic result with subject, exam name, score, and date, THEN the Genova System SHALL store the result in the student's academic history
2. WHEN a student views progress for a subject, THEN the Genova System SHALL display a graph showing score evolution over time
3. WHEN a student has results before and after tutoring sessions, THEN the Genova System SHALL calculate and display the percentage improvement
4. WHEN a student's average score increases by 10% or more, THEN the Genova System SHALL award the Progressiste badge
5. WHEN a student views the dashboard, THEN the Genova System SHALL display total hours of tutoring, current progress, and upcoming sessions

### Requirement 11

**User Story:** As a student or tutor, I want to earn badges for achievements, so that I am motivated to engage with the platform.

#### Acceptance Criteria

1. WHEN a student achieves 95% or higher attendance rate over one month, THEN the Genova System SHALL award the Assidu badge
2. WHEN a tutor completes 100 hours of tutoring, THEN the Genova System SHALL award the Mentor badge
3. WHEN a tutor receives an average rating of 4.5 or higher over 20 sessions, THEN the Genova System SHALL award the Pédagogue badge
4. WHEN a user earns a badge, THEN the Genova System SHALL send a notification and add 100 loyalty points to the user's account
5. WHEN a user views their profile, THEN the Genova System SHALL display all earned badges with earn dates

### Requirement 12

**User Story:** As a student, I want to purchase educational resources from the marketplace, so that I can access study materials.

#### Acceptance Criteria

1. WHEN a student browses the marketplace, THEN the Genova System SHALL display products with title, description, price, subject, and education level
2. WHEN a student purchases a product, THEN the Genova System SHALL process payment and deduct 30% platform commission
3. WHEN a purchase is completed, THEN the Genova System SHALL transfer 70% of the product price to the seller's wallet
4. WHEN a purchase is completed, THEN the Genova System SHALL grant the student access to download the product file
5. WHEN a student has already purchased a product, THEN the Genova System SHALL prevent duplicate purchases and allow re-download

### Requirement 13

**User Story:** As a student, I want to access the exam bank to practice with past exams, so that I can prepare for my tests.

#### Acceptance Criteria

1. WHEN a student with premium subscription accesses the exam bank, THEN the Genova System SHALL display available exams filtered by subject and education level
2. WHEN a student starts an exam, THEN the Genova System SHALL present questions and record answers
3. WHEN a student completes a multiple-choice exam, THEN the Genova System SHALL automatically grade the exam and display the score
4. WHEN an exam requires manual correction, THEN the Genova System SHALL assign the exam to a qualified tutor for grading
5. WHEN a student without premium subscription attempts to access the exam bank, THEN the Genova System SHALL display a subscription upgrade prompt

### Requirement 14

**User Story:** As a user, I want to subscribe to different service tiers, so that I can access features appropriate to my needs.

#### Acceptance Criteria

1. WHEN a student subscribes to the basic plan at 5 currency units per month, THEN the Genova System SHALL grant access to platform features and one active class
2. WHEN a student subscribes to the premium plan at 15 currency units per month, THEN the Genova System SHALL grant access to unlimited classes, exam bank, and priority support
3. WHEN a tutor subscribes to the pro plan at 30 currency units per month, THEN the Genova System SHALL reduce platform commission to 10% and grant verified badge
4. WHEN a subscription payment fails, THEN the Genova System SHALL send a notification and downgrade the account after 7 days grace period
5. WHEN a subscription expires, THEN the Genova System SHALL restrict access to premium features while maintaining access to basic functionality

### Requirement 15

**User Story:** As a student, I want to cancel or reschedule a session, so that I can manage unexpected schedule changes.

#### Acceptance Criteria

1. WHEN a student cancels a session more than 24 hours before the scheduled start, THEN the Genova System SHALL process a full refund
2. WHEN a student cancels a session less than 24 hours before the scheduled start, THEN the Genova System SHALL process a 50% refund
3. WHEN a student cancels a session less than 2 hours before the scheduled start, THEN the Genova System SHALL process no refund
4. WHEN a session is cancelled, THEN the Genova System SHALL notify the tutor and all class members
5. WHEN a student reschedules a session, THEN the Genova System SHALL verify tutor availability for the new time slot before confirming

### Requirement 16

**User Story:** As a tutor, I want to view my earnings and transaction history, so that I can track my income.

#### Acceptance Criteria

1. WHEN a tutor views the earnings dashboard, THEN the Genova System SHALL display total earnings, pending balance, and available balance
2. WHEN a tutor views transaction history, THEN the Genova System SHALL display all transactions with date, session, amount, and platform fee
3. WHEN a tutor requests a withdrawal, THEN the Genova System SHALL verify that available balance is at least 20 currency units
4. WHEN a withdrawal is processed, THEN the Genova System SHALL transfer funds to the tutor's registered payment method within 5 business days
5. WHEN a tutor is part of a consortium, THEN the Genova System SHALL display individual earnings and consortium shared earnings separately

### Requirement 17

**User Story:** As a student, I want to rate and review tutors after sessions, so that I can help other students make informed decisions.

#### Acceptance Criteria

1. WHEN a session is completed, THEN the Genova System SHALL prompt the student to rate the tutor on a scale of 1 to 5 stars
2. WHEN a student submits a rating with optional comment, THEN the Genova System SHALL store the review and link it to the session
3. WHEN a new review is submitted, THEN the Genova System SHALL recalculate the tutor's average rating
4. WHEN a tutor's average rating is calculated, THEN the Genova System SHALL include all reviews from the last 12 months
5. WHEN a review contains inappropriate content, THEN the Genova System SHALL allow flagging for moderation review

### Requirement 18

**User Story:** As a system administrator, I want to verify tutor credentials, so that only qualified tutors can offer services.

#### Acceptance Criteria

1. WHEN a tutor submits verification documents, THEN the Genova System SHALL notify administrators of pending verification
2. WHEN an administrator reviews documents and approves, THEN the Genova System SHALL set the tutor verification status to true and award the Expert Vérifié badge
3. WHEN an administrator rejects verification, THEN the Genova System SHALL notify the tutor with rejection reasons
4. WHEN a tutor is verified, THEN the Genova System SHALL display a verification badge on the tutor's profile
5. WHEN a tutor's verification expires after 2 years, THEN the Genova System SHALL request document renewal

### Requirement 19

**User Story:** As a user, I want to receive notifications about important events, so that I stay informed about my activities.

#### Acceptance Criteria

1. WHEN a session is booked, confirmed, cancelled, or approaching, THEN the Genova System SHALL send push notifications to all involved parties
2. WHEN a user earns a badge, THEN the Genova System SHALL send a notification with badge details
3. WHEN a payment is processed or fails, THEN the Genova System SHALL send a notification with transaction details
4. WHEN a user receives a review, THEN the Genova System SHALL send a notification with the rating and comment
5. WHEN a user disables notifications in settings, THEN the Genova System SHALL respect the preference and send only critical notifications

### Requirement 20

**User Story:** As a parent, I want to monitor my child's tutoring activities and progress, so that I can support their education.

#### Acceptance Criteria

1. WHEN a student account is created for a minor, THEN the Genova System SHALL link the parent email to the student account
2. WHEN a session is completed, THEN the Genova System SHALL send a summary email to the linked parent email
3. WHEN a parent accesses the student's progress dashboard, THEN the Genova System SHALL display attendance, session reports, and academic results
4. WHEN a student's attendance drops below 80%, THEN the Genova System SHALL send an alert to the parent email
5. WHEN a parent views transaction history, THEN the Genova System SHALL display all payments made for the student's sessions
