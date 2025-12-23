# Requirements Document: Class Schedule Management

## Introduction

This specification defines a comprehensive class schedule management system that allows class creators to define weekly timetables with multiple subjects, assign tutors to subjects with flexible recurrence patterns, and manage schedule modifications including cancellations for specific weeks.

## Glossary

- **Class**: A study group created by a student with specific education level and meeting type
- **Class_Creator**: The student who created the class and has administrative privileges
- **Subject**: An academic discipline (e.g., Mathématiques, Physique) taught in the class
- **Time_Slot**: A specific day and time period when a subject is taught (e.g., Monday 14:00-16:00)
- **Weekly_Schedule**: The recurring pattern of time slots for all subjects in a class
- **Tutor_Assignment**: The allocation of a tutor to teach specific time slots for a subject
- **Recurrence_Pattern**: The rule determining how tutors rotate or are assigned to time slots (round-robin, weekly, consecutive days, manual)
- **Schedule_Override**: A modification to the weekly schedule for a specific week (e.g., cancellation)
- **Session**: An actual class meeting that occurs based on the schedule

## Requirements

### Requirement 1: Multiple Subjects per Class

**User Story:** As a class creator, I want to assign multiple subjects to my class, so that I can organize comprehensive study sessions covering different academic disciplines.

#### Acceptance Criteria

1. WHEN creating a class, THE Class_Creator SHALL be able to select multiple subjects from the available subject list
2. WHEN viewing a class, THE System SHALL display all subjects associated with that class
3. WHEN a class has no subjects assigned, THE System SHALL prompt the class creator to add subjects
4. THE System SHALL allow adding or removing subjects from an existing class
5. WHEN removing a subject, THE System SHALL warn about deletion of associated time slots and tutor assignments

### Requirement 2: Weekly Schedule Creation

**User Story:** As a class creator, I want to create a weekly timetable for my class, so that members know when each subject is taught.

#### Acceptance Criteria

1. WHEN creating a weekly schedule, THE Class_Creator SHALL specify day of week, start time, end time, and subject for each time slot
2. THE System SHALL validate that time slots do not overlap for the same class
3. WHEN a time slot is created, THE System SHALL store it as a recurring weekly pattern
4. THE System SHALL display the weekly schedule in a calendar view showing all time slots
5. WHEN viewing the schedule, THE System SHALL group time slots by day and display them in chronological order
6. THE System SHALL allow editing existing time slots (day, time, subject)
7. THE System SHALL allow deleting time slots from the weekly schedule

### Requirement 3: Schedule Modification and Cancellations

**User Story:** As a class creator, I want to modify or cancel specific time slots for a given week, so that I can handle exceptions without changing the recurring schedule.

#### Acceptance Criteria

1. WHEN viewing a specific week, THE Class_Creator SHALL be able to cancel individual time slots for that week only
2. WHEN a time slot is cancelled, THE System SHALL mark it as cancelled without deleting the recurring pattern
3. THE System SHALL display cancelled time slots with visual indication (strikethrough, different color)
4. THE System SHALL allow reinstating a cancelled time slot for a specific week
5. WHEN a time slot is cancelled, THE System SHALL notify all class members and assigned tutors
6. THE System SHALL maintain a history of schedule modifications for each week

### Requirement 4: Tutor Assignment to Subjects

**User Story:** As a class creator, I want to assign tutors to teach specific subjects in my class, so that qualified instructors lead each session.

#### Acceptance Criteria

1. WHEN assigning a tutor to a subject, THE Class_Creator SHALL select from available tutors
2. THE System SHALL validate that the tutor has expertise in the selected subject
3. WHEN a subject has multiple time slots, THE Class_Creator SHALL specify which time slots the tutor will teach
4. THE System SHALL allow assigning multiple tutors to the same subject
5. WHEN a tutor is assigned, THE System SHALL send a notification to the tutor for acceptance
6. THE System SHALL display tutor assignments in the weekly schedule view

### Requirement 5: Tutor Assignment Recurrence Patterns

**User Story:** As a class creator, I want to define how tutors rotate or are assigned to recurring time slots, so that I can automate tutor scheduling based on different patterns.

#### Acceptance Criteria

1. WHEN assigning a tutor to a subject with multiple time slots, THE Class_Creator SHALL choose a recurrence pattern from: round-robin, weekly, consecutive days, or manual
2. WHEN round-robin pattern is selected, THE System SHALL rotate tutors evenly across all time slots for that subject
3. WHEN weekly pattern is selected, THE Class_Creator SHALL specify which week(s) the tutor teaches (e.g., every week, alternating weeks)
4. WHEN consecutive days pattern is selected, THE Class_Creator SHALL specify the number of consecutive days the tutor teaches before rotation
5. WHEN manual pattern is selected, THE Class_Creator SHALL assign tutors individually to each session occurrence
6. THE System SHALL generate actual session assignments based on the recurrence pattern
7. THE System SHALL allow changing the recurrence pattern, which updates future session assignments

### Requirement 6: Tutor Availability Validation

**User Story:** As a class creator, I want the system to check tutor availability before assignment, so that I don't assign tutors to time slots when they're unavailable.

#### Acceptance Criteria

1. WHEN assigning a tutor to a time slot, THE System SHALL check the tutor's availability schedule
2. IF a tutor is unavailable for a time slot, THEN THE System SHALL display a warning to the class creator
3. THE System SHALL allow the class creator to proceed with assignment despite availability conflicts
4. WHEN a tutor's availability changes, THE System SHALL notify class creators of affected assignments
5. THE System SHALL display tutor availability status when selecting tutors for assignment

### Requirement 7: Schedule Page Navigation and Views

**User Story:** As a class creator, I want to navigate through different weeks and view the schedule in multiple formats, so that I can easily manage and understand the class timetable.

#### Acceptance Criteria

1. THE System SHALL provide a weekly calendar view showing all time slots
2. THE System SHALL allow navigation between weeks (previous/next week buttons)
3. THE System SHALL highlight the current week
4. WHEN viewing a time slot, THE System SHALL display subject, time, assigned tutor(s), and status
5. THE System SHALL provide a list view showing all time slots grouped by subject
6. THE System SHALL allow filtering the schedule by subject or tutor
7. THE System SHALL display different visual indicators for: regular slots, cancelled slots, slots without tutors

### Requirement 8: Schedule Editing Interface

**User Story:** As a class creator, I want an intuitive interface to create and edit the weekly schedule, so that I can efficiently manage the class timetable.

#### Acceptance Criteria

1. WHEN adding a time slot, THE System SHALL provide a form with day, start time, end time, and subject selection
2. THE System SHALL validate that start time is before end time
3. THE System SHALL validate that the time slot doesn't overlap with existing slots
4. WHEN editing a time slot, THE System SHALL pre-fill the form with current values
5. THE System SHALL provide quick actions for common operations (duplicate slot, delete slot)
6. THE System SHALL show a preview of the weekly schedule while editing
7. THE System SHALL require confirmation before deleting time slots with tutor assignments

### Requirement 9: Tutor Assignment Interface

**User Story:** As a class creator, I want a clear interface to assign tutors to subjects and time slots, so that I can manage instructor allocation efficiently.

#### Acceptance Criteria

1. WHEN assigning tutors, THE System SHALL display all time slots for the selected subject
2. THE System SHALL show tutor profiles with subject expertise and availability
3. THE System SHALL allow selecting multiple tutors for a subject
4. WHEN multiple tutors are selected, THE System SHALL prompt for recurrence pattern selection
5. THE System SHALL display a preview of how tutors will be assigned based on the pattern
6. THE System SHALL allow adjusting individual session assignments after pattern application
7. THE System SHALL show assignment conflicts or warnings before saving

### Requirement 10: Notifications and Communication

**User Story:** As a class member or tutor, I want to receive notifications about schedule changes, so that I stay informed about class timing and cancellations.

#### Acceptance Criteria

1. WHEN a time slot is added to the schedule, THE System SHALL notify all class members
2. WHEN a time slot is cancelled for a specific week, THE System SHALL notify all class members and assigned tutors
3. WHEN a tutor is assigned to a subject, THE System SHALL send a notification to the tutor
4. WHEN a tutor accepts or declines an assignment, THE System SHALL notify the class creator
5. WHEN the weekly schedule is modified, THE System SHALL send a summary notification to all class members
6. THE System SHALL allow users to configure notification preferences for schedule changes

### Requirement 11: Session Generation from Schedule

**User Story:** As a system, I want to automatically generate session records from the weekly schedule, so that actual class meetings are tracked and managed.

#### Acceptance Criteria

1. THE System SHALL generate session records for each time slot occurrence based on the weekly schedule
2. THE System SHALL generate sessions for a configurable time period (e.g., 4 weeks in advance)
3. WHEN a time slot is cancelled for a specific week, THE System SHALL mark the corresponding session as cancelled
4. WHEN tutor assignments change, THE System SHALL update future session records
5. THE System SHALL not modify past session records when schedule changes occur
6. THE System SHALL allow manual creation of ad-hoc sessions outside the regular schedule

### Requirement 12: Access Control and Permissions

**User Story:** As a class creator, I want to control who can modify the schedule, so that unauthorized changes don't disrupt the class organization.

#### Acceptance Criteria

1. ONLY the class creator SHALL be able to create, edit, or delete time slots in the weekly schedule
2. ONLY the class creator SHALL be able to assign or remove tutors
3. ONLY the class creator SHALL be able to cancel time slots for specific weeks
4. Class members SHALL be able to view the schedule but not modify it
5. Assigned tutors SHALL be able to view their assigned time slots
6. THE System SHALL log all schedule modifications with user and timestamp
