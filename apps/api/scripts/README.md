# Migration Scripts

This directory contains migration and utility scripts for the Genova API.

## Session Generation Migration

### Overview

The `migrate-generate-sessions.ts` script generates TutoringSession records for all existing active ClassTimeSlots. This is a one-time migration script to populate the database with sessions for the automated recurring sessions system.

### Requirements

- Database must be accessible
- All ClassTimeSlots should be properly configured
- ClassTutorAssignments should be set up if you want automatic tutor assignment

### Usage

#### Dry Run Mode (Recommended First)

Run the migration in dry-run mode to see what would happen without making any changes:

```bash
npm run migrate:sessions:dry
```

Or with custom weeks:

```bash
npm run migrate:sessions -- --dry-run --weeks 6
```

#### Live Migration

Once you've reviewed the dry-run output and are satisfied, run the actual migration:

```bash
npm run migrate:sessions
```

Or with custom weeks:

```bash
npm run migrate:sessions -- --weeks 8
```

### Options

- `--dry-run, -d`: Run in dry-run mode (no changes will be made to the database)
- `--weeks N, -w N`: Number of weeks ahead to generate sessions (default: 4)
- `--help, -h`: Show help message

### Examples

```bash
# Preview what would happen with default 4 weeks
npm run migrate:sessions:dry

# Preview with 8 weeks ahead
npm run migrate:sessions -- --dry-run --weeks 8

# Run actual migration with 6 weeks
npm run migrate:sessions -- --weeks 6

# Show help
npm run migrate:sessions -- --help
```

### What It Does

1. **Queries Active Classes**: Finds all active classes that have active ClassTimeSlots
2. **Checks Existing Sessions**: Identifies existing sessions to avoid conflicts
3. **Generates Sessions**: Creates TutoringSession records for each time slot occurrence
4. **Applies Tutor Assignments**: Automatically assigns tutors based on ClassTutorAssignment patterns
5. **Preserves Existing Data**: Never overwrites or modifies existing sessions
6. **Logs Everything**: Provides detailed logging of all operations

### Output

The script provides a detailed summary including:

- Number of classes processed
- Number of classes skipped (no time slots)
- Number of sessions generated
- Number of existing sessions preserved
- Any errors encountered

### Safety Features

- **Dry-run mode**: Test the migration without making changes
- **Duplicate prevention**: Won't create sessions that already exist
- **Conflict preservation**: Existing sessions are never modified
- **Error handling**: Continues processing even if individual classes fail
- **Comprehensive logging**: All operations are logged for audit trail

### Validation

The migration validates:

- Requirements 12.1: Provides migration script with dry-run mode
- Requirements 12.2: Generates sessions for next N weeks for all active ClassTimeSlots
- Requirements 12.3: Preserves existing sessions when conflicts are detected

### Troubleshooting

**Database Connection Error**
- Ensure your `.env` file has the correct `DATABASE_URL`
- Verify the database is accessible from your environment

**No Sessions Generated**
- Check that classes have active ClassTimeSlots
- Verify time slots have valid dayOfWeek, startTime, and endTime values

**Errors for Specific Classes**
- Review the error log in the output
- Check class configuration and time slot data
- Verify tutor profiles exist for assigned tutors

### Post-Migration

After running the migration:

1. Verify session counts in the database
2. Check that tutor assignments are correct
3. Review session prices are calculated properly
4. Test the mobile app to ensure sessions display correctly
5. Monitor the background job to ensure it maintains the rolling window

### Related Services

- `session-generator.service.ts`: Core session generation logic
- `recurrence-pattern.service.ts`: Tutor assignment pattern application
- `background-jobs.service.ts`: Daily maintenance of session window
