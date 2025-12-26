# Requirements Document: Automated Recurring Sessions System

## Introduction

This specification addresses the fundamental issue of session management in the tutoring platform. Currently, ClassTimeSlots are recurring (weekly) but TutoringSession records are not automatically generated, leading to students not seeing their upcoming sessions and requiring manual session creation for each occurrence. Additionally, tutors must manually set availability each week instead of having a recurring schedule.

## Glossary

- **System**: The tutoring platform backend and mobile application
- **ClassTimeSlot**: A recurring weekly time slot in a class schedule (e.g., Math every Monday 14:00-16:00)
- **TutoringSession**: An actual session instance for a specific date and time
- **RecurringSchedule**: A tutor's weekly availability pattern that repeats every week
- **OneTimeAvailability**: A tutor's availability for a specific date (non-recurring)
- **SessionGenerator**: The automated system that creates TutoringSession records from ClassTimeSlots
- **Student**: A user enrolled in one or more classes
- **Tutor**: A user who teaches sessions
- **ClassCreator**: The user who created and manages a class

## Requirements

### Requirement 1: Automatic Session Generation from Class Schedules

**User Story:** As a student, I want to automatically see all my upcoming sessions based on my class schedules, so that I don't have to wait for manual session creation.

#### Acceptance Criteria

1. WHEN a student is enrolled in a class with active ClassTimeSlots, THE System SHALL automatically generate TutoringSession records for the next 4 weeks
2. WHEN a new ClassTimeSlot is created, THE System SHALL generate TutoringSession records for that slot for the next 4 weeks
3. WHEN a ClassTimeSlot is deleted or deactivated, THE System SHALL cancel all future generated sessions for that slot
4. WHEN a student views their sessions, THE System SHALL display sessions generated from their class schedules regardless of tutor assignment status
5. WHEN the current week ends, THE System SHALL automatically generate sessions for the new 4th week ahead to maintain a rolling 4-week window

### Requirement 2: Tutor Recurring Availability Schedule

**User Story:** As a tutor, I want to define my recurring weekly availability, so that I don't have to manually set the same time slots every week.

#### Acceptance Criteria

1. THE System SHALL allow tutors to define recurring weekly availability patterns (e.g., every Monday 9:00-17:00, every Wednesday 14:00-18:00)
2. WHEN a tutor creates a recurring availability slot, THE System SHALL store it with dayOfWeek, startTime, endTime, and isRecurring=true
3. WHEN checking tutor availability for session assignment, THE System SHALL consider both recurring and one-time availability slots
4. THE System SHALL allow tutors to view and edit their recurring availability schedule
5. THE System SHALL allow tutors to delete recurring availability slots

### Requirement 3: One-Time Availability Override

**User Story:** As a tutor, I want to add specific availability for particular dates, so that I can handle exceptions to my regular schedule.

#### Acceptance Criteria

1. THE System SHALL allow tutors to add one-time availability for specific dates
2. WHEN a tutor adds one-time availability, THE System SHALL store it with a specific date, startTime, endTime, and isRecurring=false
3. WHEN checking tutor availability, THE System SHALL prioritize one-time availability over recurring patterns for the same time period
4. THE System SHALL allow tutors to view their one-time availability entries
5. THE System SHALL allow tutors to delete one-time availability entries

### Requirement 4: Session Status and Tutor Assignment

**User Story:** As a student, I want to see all my scheduled sessions with clear status indicators, so that I know which sessions have assigned tutors and which are pending.

#### Acceptance Criteria

1. WHEN a TutoringSession is generated without a tutor assignment, THE System SHALL set status to PENDING
2. WHEN a tutor is assigned to a session, THE System SHALL update status to CONFIRMED if the tutor accepts
3. WHEN displaying sessions to students, THE System SHALL show status badges (PENDING, CONFIRMED, COMPLETED, CANCELLED)
4. WHEN a session has no tutor assigned, THE System SHALL display "Tuteur non assigné" or similar indicator
5. WHEN a session is within 24 hours and has no tutor, THE System SHALL highlight it as urgent

### Requirement 5: Automatic Tutor Assignment Based on Recurrence Patterns

**User Story:** As a class creator, I want sessions to automatically use assigned tutors based on their recurrence patterns, so that tutor rotation and scheduling is handled automatically.

#### Acceptance Criteria

1. WHEN generating a TutoringSession from a ClassTimeSlot, THE System SHALL check for active ClassTutorAssignments with status ACCEPTED for that subject and time slot
2. WHEN a ROUND_ROBIN pattern exists, THE System SHALL rotate tutors evenly across all generated sessions for that time slot
3. WHEN a WEEKLY pattern exists, THE System SHALL assign the tutor to sessions based on their recurrenceConfig (e.g., week 1, week 3, alternating weeks)
4. WHEN a CONSECUTIVE_DAYS pattern exists, THE System SHALL assign the tutor for N consecutive sessions before rotating to the next tutor
5. WHEN a MANUAL pattern exists, THE System SHALL create sessions with tutorId=null and status=PENDING for manual assignment
6. WHEN no tutor assignment exists for a time slot, THE System SHALL create sessions with tutorId=null and status=PENDING
7. WHEN multiple tutors are assigned to the same time slot, THE System SHALL apply their respective recurrence patterns in the order they were created

### Requirement 6: Session Price Calculation

**User Story:** As a student, I want session prices to be automatically calculated based on the assigned tutor's hourly rate and session duration, so that pricing is transparent and consistent.

#### Acceptance Criteria

1. WHEN a tutor is assigned to a session, THE System SHALL calculate price as (tutor hourly rate × session duration in hours × number of students)
2. WHEN a session has no tutor assigned, THE System SHALL set price to 0 or a default class rate
3. WHEN a tutor's hourly rate changes, THE System SHALL update prices for all future unconfirmed sessions
4. WHEN displaying session price to students, THE System SHALL show the per-student price
5. WHEN displaying session revenue to tutors, THE System SHALL show total revenue (price × number of students)

### Requirement 7: Session Cancellation and Slot Cancellation Integration

**User Story:** As a class creator, I want to cancel a specific week's time slot and have all related sessions automatically cancelled, so that students and tutors are properly notified.

#### Acceptance Criteria

1. WHEN a ClassSlotCancellation is created for a specific week, THE System SHALL cancel all TutoringSessions generated from that slot for that week
2. WHEN cancelling sessions due to slot cancellation, THE System SHALL set cancellationReason to reference the slot cancellation
3. WHEN a cancelled slot is reinstated, THE System SHALL regenerate the sessions for that week
4. THE System SHALL send notifications to all affected students and tutors when sessions are cancelled due to slot cancellation
5. THE System SHALL apply refund policies based on cancellation timing

### Requirement 8: Background Job for Session Generation

**User Story:** As a system administrator, I want sessions to be automatically generated in the background, so that the system maintains a rolling window of upcoming sessions without manual intervention.

#### Acceptance Criteria

1. THE System SHALL run a daily background job to generate sessions for the rolling 4-week window
2. WHEN the background job runs, THE System SHALL check all active classes with ClassTimeSlots
3. WHEN sessions are missing for any week within the 4-week window, THE System SHALL generate them
4. THE System SHALL log all session generation activities for monitoring
5. WHEN session generation fails, THE System SHALL retry and alert administrators if failures persist

### Requirement 9: Student Session View with Filtering

**User Story:** As a student, I want to view my sessions filtered by time period (upcoming, past, cancelled), so that I can easily find relevant sessions.

#### Acceptance Criteria

1. WHEN a student views "upcoming sessions", THE System SHALL display sessions with scheduledEnd > now AND status != CANCELLED, ordered by scheduledStart ascending
2. WHEN a student views "past sessions", THE System SHALL display sessions with scheduledEnd <= now AND status != CANCELLED, ordered by scheduledEnd descending
3. WHEN a student views "cancelled sessions", THE System SHALL display sessions with status = CANCELLED, ordered by scheduledStart descending
4. THE System SHALL support lazy loading for past and cancelled sessions (load more as user scrolls)
5. THE System SHALL display session count badges for each filter tab

### Requirement 10: Tutor Session View with Assignment Status

**User Story:** As a tutor, I want to view sessions filtered by my involvement (assigned, suggested, past), so that I can manage my teaching schedule effectively.

#### Acceptance Criteria

1. WHEN a tutor views "assigned sessions", THE System SHALL display sessions where tutorId = tutor.id AND status IN (PENDING, CONFIRMED), ordered by scheduledStart ascending
2. WHEN a tutor views "suggested sessions", THE System SHALL display unassigned sessions matching the tutor's subjects and availability
3. WHEN a tutor views "past sessions", THE System SHALL display sessions where tutorId = tutor.id AND scheduledEnd <= now, ordered by scheduledEnd descending
4. WHEN a tutor views "cancelled sessions", THE System SHALL display sessions where tutorId = tutor.id AND status = CANCELLED
5. THE System SHALL allow tutors to accept suggested sessions directly from the list

### Requirement 11: Notification System for Session Changes

**User Story:** As a user, I want to receive notifications when sessions are created, assigned, confirmed, or cancelled, so that I stay informed about my schedule.

#### Acceptance Criteria

1. WHEN a new session is generated for a student's class, THE System SHALL create a notification for that student
2. WHEN a tutor is assigned to a session, THE System SHALL notify the tutor and all students in the class
3. WHEN a tutor confirms a session, THE System SHALL notify all students in the class
4. WHEN a session is cancelled, THE System SHALL notify the tutor (if assigned) and all students
5. WHEN a session is within 24 hours, THE System SHALL send reminder notifications to tutor and students

### Requirement 12: Migration of Existing Data

**User Story:** As a system administrator, I want existing ClassTimeSlots to generate sessions retroactively, so that the new system works with existing data.

#### Acceptance Criteria

1. THE System SHALL provide a migration script to generate sessions for all existing active ClassTimeSlots
2. WHEN the migration runs, THE System SHALL generate sessions for the next 4 weeks for each active ClassTimeSlot
3. WHEN existing TutoringSessions conflict with generated sessions, THE System SHALL preserve existing sessions
4. THE System SHALL log all migration activities
5. THE System SHALL allow dry-run mode to preview changes before applying them

### Requirement 13: Time Slot Management Interface

**User Story:** As a class creator, I want a dedicated interface to manage a specific time slot, so that I can view assigned tutors and configure their recurrence patterns.

#### Acceptance Criteria

1. WHEN viewing a time slot detail page, THE System SHALL display all active ClassTutorAssignments for that time slot
2. WHEN viewing tutor assignments, THE System SHALL show each tutor's name, status (PENDING/ACCEPTED/DECLINED), and recurrence pattern
3. THE System SHALL allow the class creator to add new tutor assignments to the time slot
4. THE System SHALL allow the class creator to modify the recurrence pattern of existing assignments
5. THE System SHALL allow the class creator to remove tutor assignments from the time slot
6. WHEN modifying a tutor's recurrence pattern, THE System SHALL show a preview of how sessions will be distributed
7. THE System SHALL display a calendar view showing which tutor is assigned to each week's session based on the recurrence patterns
8. WHEN multiple tutors are assigned with ROUND_ROBIN, THE System SHALL show the rotation order and next tutor in sequence

### Requirement 14: Student-Initiated Tutor Assignment

**User Story:** As a student, I want to request a specific tutor for an unassigned session, so that I can choose who teaches me.

#### Acceptance Criteria

1. WHEN viewing a session with tutorId=null, THE System SHALL display a "Request Tutor" button
2. WHEN a student clicks "Request Tutor", THE System SHALL show a list of available tutors for that subject and time
3. THE System SHALL allow the student to select a tutor and send an assignment request
4. WHEN a tutor assignment request is sent, THE System SHALL create a notification for the tutor
5. WHEN a tutor accepts the request, THE System SHALL assign them to the session and update status to CONFIRMED
6. WHEN a tutor declines the request, THE System SHALL notify the student and allow them to request another tutor
7. THE System SHALL respect existing ClassTutorAssignments and not allow students to override pre-assigned tutors
