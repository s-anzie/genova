# Implementation Plan: Automated Recurring Sessions System

## Overview

This implementation plan breaks down the automated recurring sessions system into discrete, manageable tasks. The plan follows a phased approach to ensure incremental progress with validation at each step.

## Tasks

- [x] 1. Database Schema Updates
  - Add new tables and modify existing schema for tutor availability and assignment requests
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 14.1_

- [x] 1.1 Create TutorAvailability model in Prisma schema
  - Add model with fields: id, tutorId, dayOfWeek, specificDate, startTime, endTime, isRecurring, isActive, createdAt
  - Add indexes on tutorId, dayOfWeek, specificDate
  - Add relation to User model
  - _Requirements: 2.2, 3.2_

- [x] 1.2 Create TutorAssignmentRequest model in Prisma schema
  - Add model with fields: id, sessionId, studentId, tutorId, status, message, createdAt, respondedAt
  - Add RequestStatus enum (PENDING, ACCEPTED, DECLINED)
  - Add indexes on sessionId, studentId, tutorId, status
  - Add relations to TutoringSession and User models
  - _Requirements: 14.1_

- [x] 1.3 Run Prisma migration
  - Generate migration files
  - Review migration SQL
  - Apply migration to development database
  - _Requirements: 2.1, 3.1, 14.1_

- [ ]* 1.4 Write property test for schema integrity
  - **Property 4: Recurring Availability Storage**
  - **Validates: Requirements 2.2**

- [ ]* 1.5 Write property test for one-time availability storage
  - **Property 6: One-Time Availability Storage**
  - **Validates: Requirements 3.2**

- [x] 2. Implement Session Generator Service (read session service carefully and related services)
  - Core service for generating TutoringSession records from ClassTimeSlots
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2.1 Create session-generator.service.ts file (or reuse session.service.ts)
  - Implement generateSessionsForClass function
  - Implement generateSessionsForTimeSlot function
  - Implement checkSessionsExist function
  - Implement fillSessionGaps function
  - _Requirements: 1.1, 1.2_

- [x] 2.2 Implement session generation algorithm
  - Query active ClassTimeSlots for class
  - Calculate next N occurrences based on dayOfWeek
  - Check for ClassSlotCancellations
  - Check if session already exists (avoid duplicates)
  - Create TutoringSession records
  - _Requirements: 1.1, 1.2_

- [x] 2.3 Implement time slot deletion cascade
  - When ClassTimeSlot is deleted/deactivated, cancel all future sessions
  - Set cancellationReason appropriately
  - _Requirements: 1.3_

- [ ]* 2.4 Write property test for session generation completeness
  - **Property 1: Session Generation Completeness**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 2.5 Write property test for time slot deletion cascade
  - **Property 2: Time Slot Deletion Cascade**
  - **Validates: Requirements 1.3**

- [ ]* 2.6 Write property test for session visibility without tutor
  - **Property 3: Session Visibility Without Tutor**
  - **Validates: Requirements 1.4**

- [ ] 3. Checkpoint - Ensure session generation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Tutor Availability Service
  - Service for managing recurring and one-time tutor availability
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [x] 4.1 Create tutor-availability.service.ts file
  - Implement createRecurringAvailability function
  - Implement createOneTimeAvailability function
  - Implement checkAvailability function
  - Implement getTutorAvailability function
  - Implement deleteAvailability function
  - _Requirements: 2.1, 3.1_

- [x] 4.2 Implement availability checking logic
  - Check both recurring and one-time availability
  - Prioritize one-time over recurring for same time period
  - Handle time range overlaps
  - _Requirements: 2.3, 3.3_

- [ ]* 4.3 Write property test for availability check considers both types
  - **Property 5: Availability Check Considers Both Types**
  - **Validates: Requirements 2.3**

- [ ]* 4.4 Write property test for one-time availability priority
  - **Property 7: One-Time Availability Priority**
  - **Validates: Requirements 3.3**

- [x] 5. Implement Recurrence Pattern Engine
  - Engine for applying tutor rotation patterns to sessions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 5.1 Create recurrence-pattern.service.ts file
  - Implement applyPattern function
  - Implement getNextTutor function
  - Implement pattern-specific logic for each RecurrencePattern
  - _Requirements: 5.1_

- [x] 5.2 Implement ROUND_ROBIN pattern logic
  - Sort assignments by createdAt
  - Distribute sessions evenly using modulo
  - _Requirements: 5.2_

- [x] 5.3 Implement WEEKLY pattern logic
  - Parse recurrenceConfig for week numbers
  - Calculate week number from startDate
  - Assign tutor if current week matches configuration
  - _Requirements: 5.3_

- [x] 5.4 Implement CONSECUTIVE_DAYS pattern logic
  - Parse recurrenceConfig for consecutiveDays count
  - Assign tutor for N consecutive sessions
  - Rotate to next tutor after N sessions
  - _Requirements: 5.4_

- [x] 5.5 Implement MANUAL pattern logic
  - Leave tutorId as null
  - Set status to PENDING
  - _Requirements: 5.5_

- [x] 5.6 Integrate pattern engine with session generator
  - Call pattern engine during session generation
  - Apply tutor assignments based on patterns
  - Handle cases with no assignments
  - _Requirements: 5.1, 5.6, 5.7_

- [ ]* 5.7 Write property test for assignment lookup during generation
  - **Property 10: Assignment Lookup During Generation**
  - **Validates: Requirements 5.1**

- [ ]* 5.8 Write property test for round-robin distribution
  - **Property 11: Round-Robin Distribution**
  - **Validates: Requirements 5.2**

- [ ]* 5.9 Write property test for weekly pattern application
  - **Property 12: Weekly Pattern Application**
  - **Validates: Requirements 5.3**

- [ ]* 5.10 Write property test for consecutive days pattern
  - **Property 13: Consecutive Days Pattern**
  - **Validates: Requirements 5.4**

- [ ]* 5.11 Write property test for manual pattern no auto-assignment
  - **Property 14: Manual Pattern No Auto-Assignment**
  - **Validates: Requirements 5.5**

- [ ]* 5.12 Write property test for no assignment default behavior
  - **Property 15: No Assignment Default Behavior**
  - **Validates: Requirements 5.6**

- [ ]* 5.13 Write property test for pattern application order
  - **Property 16: Pattern Application Order**
  - **Validates: Requirements 5.7**

- [ ] 6. Checkpoint - Ensure pattern engine tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Price Calculation Logic
  - Automatic price calculation based on tutor rate and session details
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 7.1 Update session generator to calculate prices
  - Calculate price when tutor is assigned: hourlyRate × duration × studentCount
  - Set price to 0 or default when no tutor assigned
  - _Requirements: 6.1, 6.2_

- [x] 7.2 Implement price update propagation
  - When tutor hourly rate changes, update all future PENDING sessions
  - Create function to recalculate prices for tutor's sessions
  - _Requirements: 6.3_

- [ ]* 7.3 Write property test for price calculation formula
  - **Property 17: Price Calculation Formula**
  - **Validates: Requirements 6.1**

- [ ]* 7.4 Write property test for default price without tutor
  - **Property 18: Default Price Without Tutor**
  - **Validates: Requirements 6.2**

- [ ]* 7.5 Write property test for price update propagation
  - **Property 19: Price Update Propagation**
  - **Validates: Requirements 6.3**

- [x] 8. Implement Slot Cancellation Integration
  - Integrate ClassSlotCancellation with session cancellation
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8.1 Update class-schedule.service.ts
  - When ClassSlotCancellation is created, cancel related sessions
  - Set cancellationReason to reference slot cancellation
  - _Requirements: 7.1, 7.2_

- [x] 8.2 Implement slot reinstatement logic
  - When ClassSlotCancellation is deleted, regenerate sessions
  - Call session generator for that specific week
  - _Requirements: 7.3_

- [x] 8.3 Add notification creation for slot cancellations
  - Create notifications for all class members
  - Create notification for assigned tutor if any
  - _Requirements: 7.4_

- [ ]* 8.4 Write property test for slot cancellation cascade
  - **Property 20: Slot Cancellation Cascade**
  - **Validates: Requirements 7.1**

- [ ]* 8.5 Write property test for cancellation reason reference
  - **Property 21: Cancellation Reason Reference**
  - **Validates: Requirements 7.2**

- [ ]* 8.6 Write property test for slot reinstatement regeneration
  - **Property 22: Slot Reinstatement Regeneration**
  - **Validates: Requirements 7.3**

- [ ]* 8.7 Write property test for cancellation notifications
  - **Property 23: Cancellation Notifications**
  - **Validates: Requirements 7.4**

- [x] 9. Implement Background Job Scheduler
  - Daily job to maintain rolling 4-week session window
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 9.1 Install and configure node-cron
  - Add node-cron dependency
  - Create scheduler configuration
  - _Requirements: 8.1_

- [x] 9.2 Create background-jobs.service.ts file
  - Implement scheduleDailySessionGeneration function
  - Implement maintainSessionWindow function
  - Schedule job to run daily at 2 AM
  - _Requirements: 8.1, 8.2_

- [x] 9.3 Implement rolling window maintenance logic
  - Calculate current date and 4 weeks ahead
  - For each active class, check for missing sessions
  - Generate sessions for missing weeks
  - Log generation statistics
  - _Requirements: 8.2, 8.3_

- [ ]* 9.4 Write property test for background job processes all classes
  - **Property 24: Background Job Processes All Classes**
  - **Validates: Requirements 8.2**

- [ ]* 9.5 Write property test for gap filling
  - **Property 25: Gap Filling**
  - **Validates: Requirements 8.3**

- [ ] 10. Checkpoint - Ensure background job tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Session Filtering and Views
  - Update session queries to support new filtering requirements
  - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 10.4_

- [x] 11.1 Update session.service.ts with new filter functions
  - Implement getUpcomingSessions for students
  - Implement getPastSessions for students
  - Implement getCancelledSessions for students
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 11.2 Implement tutor session filters
  - Implement getAssignedSessions for tutors
  - Implement getSuggestedSessions for tutors
  - Implement getTutorPastSessions
  - Implement getTutorCancelledSessions
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ]* 11.3 Write property test for upcoming sessions filter
  - **Property 26: Upcoming Sessions Filter**
  - **Validates: Requirements 9.1**

- [ ]* 11.4 Write property test for past sessions filter
  - **Property 27: Past Sessions Filter**
  - **Validates: Requirements 9.2**

- [ ]* 11.5 Write property test for cancelled sessions filter
  - **Property 28: Cancelled Sessions Filter**
  - **Validates: Requirements 9.3**

- [ ]* 11.6 Write property test for tutor assigned sessions filter
  - **Property 29: Tutor Assigned Sessions Filter**
  - **Validates: Requirements 10.1**

- [ ]* 11.7 Write property test for tutor suggested sessions matching
  - **Property 30: Tutor Suggested Sessions Matching**
  - **Validates: Requirements 10.2**

- [ ]* 11.8 Write property test for tutor past sessions filter
  - **Property 31: Tutor Past Sessions Filter**
  - **Validates: Requirements 10.3**

- [ ]* 11.9 Write property test for tutor cancelled sessions filter
  - **Property 32: Tutor Cancelled Sessions Filter**
  - **Validates: Requirements 10.4**

- [x] 12. Implement Notification System Integration
  - Create notifications for session lifecycle events
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 12.1 Update session generator to create notifications
  - Create notification for each class member when session is generated
  - _Requirements: 11.1_

- [x] 12.2 Update session service for tutor assignment notifications
  - Create notifications for tutor and all class members when tutor is assigned
  - _Requirements: 11.2_

- [x] 12.3 Add confirmation notifications
  - Create notifications for all class members when tutor confirms
  - _Requirements: 11.3_

- [x] 12.4 Add cancellation notifications
  - Create notifications for tutor and all class members when session is cancelled
  - _Requirements: 11.4_

- [ ]* 12.5 Write property test for session generation notification
  - **Property 33: Session Generation Notification**
  - **Validates: Requirements 11.1**

- [ ]* 12.6 Write property test for tutor assignment notification
  - **Property 34: Tutor Assignment Notification**
  - **Validates: Requirements 11.2**

- [ ]* 12.7 Write property test for tutor confirmation notification
  - **Property 35: Tutor Confirmation Notification**
  - **Validates: Requirements 11.3**

- [ ]* 12.8 Write property test for session cancellation notification
  - **Property 36: Session Cancellation Notification**
  - **Validates: Requirements 11.4**

- [ ] 13. Checkpoint - Ensure notification tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement Student Assignment Request System
  - Allow students to request specific tutors for unassigned sessions
  - _Requirements: 14.2, 14.4, 14.5, 14.6, 14.7_

- [x] 14.1 Create student-assignment-request.service.ts file
  - Implement getAvailableTutors function
  - Implement createRequest function
  - Implement acceptRequest function
  - Implement declineRequest function
  - Implement getTutorRequests function
  - _Requirements: 14.2, 14.4, 14.5, 14.6_

- [x] 14.2 Implement available tutors query
  - Filter tutors by subject match
  - Filter tutors by availability at session time
  - Exclude tutors with conflicting sessions
  - _Requirements: 14.2_

- [x] 14.3 Implement request acceptance workflow
  - Assign tutor to session
  - Update session status to CONFIRMED
  - Create notifications
  - _Requirements: 14.5_

- [x] 14.4 Implement request decline workflow
  - Update request status to DECLINED
  - Create notification for student
  - _Requirements: 14.6_

- [x] 14.5 Add pre-assignment protection
  - Check if session has ClassTutorAssignment-based tutor
  - Reject student requests for pre-assigned sessions
  - _Requirements: 14.7_

- [ ]* 14.6 Write property test for available tutors query
  - **Property 38: Available Tutors Query**
  - **Validates: Requirements 14.2**

- [ ]* 14.7 Write property test for assignment request notification
  - **Property 39: Assignment Request Notification**
  - **Validates: Requirements 14.4**

- [ ]* 14.8 Write property test for request acceptance workflow
  - **Property 40: Request Acceptance Workflow**
  - **Validates: Requirements 14.5**

- [ ]* 14.9 Write property test for request decline notification
  - **Property 41: Request Decline Notification**
  - **Validates: Requirements 14.6**

- [ ]* 14.10 Write property test for pre-assignment protection
  - **Property 42: Pre-Assignment Protection**
  - **Validates: Requirements 14.7**

- [x] 15. Implement API Routes
  - Create REST endpoints for all new functionality
  - _Requirements: 2.1, 3.1, 13.1, 14.1_

- [x] 15.1 Create tutor-availability.routes.ts
  - POST /api/tutors/availability/recurring - Create recurring availability
  - POST /api/tutors/availability/one-time - Create one-time availability
  - GET /api/tutors/:tutorId/availability - Get tutor availability
  - DELETE /api/tutors/availability/:id - Delete availability
  - _Requirements: 2.1, 3.1_

- [x] 15.2 Create time-slot-management.routes.ts
  - GET /api/classes/:classId/time-slots/:timeSlotId - Get time slot details with assignments
  - POST /api/classes/:classId/time-slots/:timeSlotId/assignments - Add tutor assignment
  - PUT /api/classes/:classId/time-slots/:timeSlotId/assignments/:assignmentId - Update assignment
  - DELETE /api/classes/:classId/time-slots/:timeSlotId/assignments/:assignmentId - Remove assignment
  - POST /api/classes/:classId/time-slots/:timeSlotId/preview - Preview session distribution
  - _Requirements: 13.1_

- [x] 15.3 Create student-assignment-request.routes.ts
  - GET /api/sessions/:sessionId/available-tutors - Get available tutors
  - POST /api/sessions/:sessionId/request-tutor - Create assignment request
  - POST /api/assignment-requests/:requestId/accept - Accept request (tutor)
  - POST /api/assignment-requests/:requestId/decline - Decline request (tutor)
  - GET /api/tutors/assignment-requests - Get tutor's requests
  - _Requirements: 14.1_

- [x] 15.4 Update session.routes.ts
  - Add query parameters for new filters (upcoming, past, cancelled, suggested)
  - Update response format to include new fields
  - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2_

- [x] 15.5 Register all new routes in main app
  - Import and register tutor-availability routes
  - Import and register time-slot-management routes
  - Import and register student-assignment-request routes
  - _Requirements: 2.1, 3.1, 13.1, 14.1_

- [ ] 16. Checkpoint - Test API endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Implement Mobile UI - Tutor Availability Management
  - Screens for tutors to manage their recurring and one-time availability
  - _Requirements: 2.1, 2.4, 2.5, 3.1, 3.4, 3.5_

- [x] 17.1 Create tutor availability management screen
  - Create apps/mobile/app/(tutor)/availability/index.tsx
  - Display list of recurring availability slots
  - Display list of one-time availability slots
  - Add buttons to create new availability
  - _Requirements: 2.4, 3.4_

- [x] 17.2 Create recurring availability form screen
  - Create apps/mobile/app/(tutor)/availability/add-recurring.tsx
  - Form with dayOfWeek picker, startTime, endTime
  - Submit to create recurring availability
  - _Requirements: 2.1_

- [x] 17.3 Create one-time availability form screen
  - Create apps/mobile/app/(tutor)/availability/add-one-time.tsx
  - Form with date picker, startTime, endTime
  - Submit to create one-time availability
  - _Requirements: 3.1_

- [x] 17.4 Add delete functionality
  - Add delete button for each availability entry
  - Confirm before deletion
  - _Requirements: 2.5, 3.5_

- [x] 18. Implement Mobile UI - Time Slot Management
  - Screen for class creators to manage tutor assignments per time slot
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

- [x] 18.1 Create time slot detail screen
  - Create apps/mobile/app/(student)/classes/[classId]/time-slots/[timeSlotId].tsx
  - Display time slot information
  - Display list of tutor assignments with status and pattern
  - _Requirements: 13.1, 13.2_

- [x] 18.2 Add tutor assignment functionality
  - Add "Assign Tutor" button
  - Show tutor selection modal
  - Show recurrence pattern selection
  - Submit to create assignment
  - _Requirements: 13.3_

- [x] 18.3 Add assignment editing functionality
  - Add edit button for each assignment
  - Allow modifying recurrence pattern
  - Show preview of session distribution
  - _Requirements: 13.4, 13.6_

- [x] 18.4 Add assignment removal functionality
  - Add remove button for each assignment
  - Confirm before removal
  - _Requirements: 13.5_

- [x] 18.5 Add calendar preview view
  - Display calendar showing which tutor is assigned each week
  - Show rotation order for ROUND_ROBIN
  - _Requirements: 13.7, 13.8_

- [x] 19. Implement Mobile UI - Updated Session Views
  - Update session list screens with new filters and features
  - _Requirements: 4.3, 4.4, 4.5, 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 10.4_

- [x] 19.1 Update student session list screen
  - Update apps/mobile/app/(student)/(tabs)/sessions/index.tsx
  - Add tabs for Upcoming, Past, Cancelled
  - Show status badges (PENDING, CONFIRMED, COMPLETED, CANCELLED)
  - Show "Tuteur non assigné" for sessions without tutor
  - Highlight urgent sessions (< 24h, no tutor)
  - _Requirements: 4.3, 4.4, 4.5, 9.1, 9.2, 9.3_

- [x] 19.2 Update tutor session list screen
  - Update apps/mobile/app/(tutor)/(tabs)/sessions/index.tsx
  - Add tabs for Assigned, Suggested, Past, Cancelled
  - Implement suggested sessions view
  - Add "Accept" button for suggested sessions
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 20. Implement Mobile UI - Student Tutor Request
  - Interface for students to request specific tutors
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 20.1 Add "Request Tutor" button to session detail
  - Show button only for sessions with tutorId=null
  - Open tutor selection modal on click
  - _Requirements: 14.1_

- [x] 20.2 Create tutor selection modal
  - Display list of available tutors
  - Show tutor profile info (name, rating, hourly rate)
  - Show availability status
  - Add "Request" button for each tutor
  - _Requirements: 14.2, 14.3_

- [x] 20.3 Create tutor request management screen for tutors
  - Create apps/mobile/app/(tutor)/requests/index.tsx
  - Display list of pending requests
  - Show session details and requesting student
  - Add "Accept" and "Decline" buttons
  - _Requirements: 14.3_

- [ ] 21. Checkpoint - Test mobile UI
  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Create Migration Script
  - Script to generate sessions for existing ClassTimeSlots
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 22.1 Create migration script file
  - Create apps/api/scripts/migrate-generate-sessions.ts
  - Implement dry-run mode
  - Implement actual migration mode
  - _Requirements: 12.1_

- [x] 22.2 Implement migration logic
  - Query all active classes with ClassTimeSlots
  - Generate sessions for next 4 weeks
  - Check for conflicts with existing sessions
  - Preserve existing sessions
  - Log all activities
  - _Requirements: 12.2, 12.3_

- [ ]* 22.3 Write property test for migration conflict preservation
  - **Property 37: Migration Conflict Preservation**
  - **Validates: Requirements 12.3**

- [x] 22.4 Test migration in dry-run mode
  - Run script with --dry-run flag
  - Review generated sessions
  - Verify no data is modified
  - _Requirements: 12.1_

- [ ] 23. Documentation and Deployment
  - Create documentation and prepare for deployment

- [ ] 23.1 Write API documentation
  - Document all new endpoints
  - Include request/response examples
  - Document error codes

- [ ] 23.2 Write user guide for tutors
  - How to set recurring availability
  - How to add one-time availability
  - How to respond to student requests

- [ ] 23.3 Write user guide for class creators
  - How to manage time slot assignments
  - How to configure recurrence patterns
  - How to preview session distribution

- [ ] 23.4 Write user guide for students
  - How to view upcoming sessions
  - How to request specific tutors
  - Understanding session statuses

- [ ] 23.5 Update deployment scripts
  - Add migration step to deployment process
  - Configure background job scheduler
  - Set up monitoring and alerts

- [ ] 24. Final Checkpoint - Integration testing
  - Run full integration test suite
  - Test end-to-end workflows
  - Verify all property tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a phased approach: Backend → API → Mobile UI → Migration
