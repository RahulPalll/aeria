# Student Course Enrollment System - Edge Cases Implementation

## Overview
This document demonstrates the implementation of comprehensive edge case validations for the Student Course Enrollment System. The system now handles complex scenarios that go beyond basic timetable conflict detection.

## Implemented Edge Cases

### 1. **Overnight Classes (Cross-Midnight)**
- **Problem**: Classes that start on one day and end the next day (e.g., 23:00-01:00)
- **Solution**: Added `isOvernightClass` boolean flag to timetables
- **Implementation**: Enhanced conflict detection logic to handle midnight crossing
- **Example**: Night computing labs, research sessions

```sql
-- Example overnight class
INSERT INTO timetables ("courseId", "dayOfWeek", "startTime", "endTime", "isOvernightClass", room) VALUES
(13, 'FRIDAY', '23:00:00', '01:00:00', TRUE, 'CS Lab 999');
```

### 2. **Buffer Time Between Classes**
- **Problem**: Students need time to travel between classes/buildings
- **Solution**: Configurable minimum break time (default: 15 minutes)
- **Implementation**: Validates consecutive classes on the same day
- **Example**: Class ending at 10:30, next class starting at 10:35 = only 5 minutes buffer

### 3. **Daily Study Hours Limit**
- **Problem**: Students shouldn't be overloaded with too many hours per day
- **Solution**: Configurable maximum study hours per day (default: 8 hours)
- **Implementation**: Calculates total duration including overnight classes
- **Example**: Prevents 12-hour study days

### 4. **Credit Hours Limit**
- **Problem**: Academic regulations limit total course load per semester
- **Solution**: Configurable maximum credit hours (default: 18 per semester)
- **Implementation**: Sums credits across all enrolled courses
- **Example**: Prevents enrolling in 25 credit hours

### 5. **Course Capacity Limits**
- **Problem**: Physical limitations of classrooms/labs
- **Solution**: Added `maxCapacity` field to courses
- **Implementation**: Counts current enrollments vs. capacity
- **Example**: Lab with 30 computer stations

### 6. **Prerequisites Validation**
- **Problem**: Students must complete prerequisite courses first
- **Solution**: Added `prerequisites` field storing comma-separated course IDs
- **Implementation**: Checks student's completed courses
- **Example**: CS102 requires completion of CS101

### 7. **Maximum Courses Per Semester**
- **Problem**: Academic policies limit simultaneous course enrollments
- **Solution**: Configurable maximum courses (default: 6 per semester)
- **Implementation**: Counts active enrollments
- **Example**: Prevents enrolling in 10 courses simultaneously

### 8. **College-Specific Configuration**
- **Problem**: Different colleges have different academic policies
- **Solution**: `enrollment_configs` table with college-specific settings
- **Implementation**: Per-college limits and rules
- **Example**: MIT allows overnight classes, Stanford doesn't

### 9. **Adjacent Day Overnight Conflicts**
- **Problem**: Overnight class on Friday might conflict with Saturday morning class
- **Solution**: Cross-day conflict detection
- **Implementation**: Checks if overnight class extends into next day's schedule
- **Example**: Friday 23:00-01:00 conflicts with Saturday 00:30-02:00

### 10. **Enhanced Time Overlap Logic**
- **Problem**: Complex scenarios with multiple overnight classes
- **Solution**: Sophisticated overlap detection for all combinations
- **Implementation**: Handles regular-regular, regular-overnight, overnight-overnight
- **Example**: Two overnight classes on same night

## Database Schema Enhancements

### New Fields Added:

**Courses Table:**
```sql
"maxCapacity" INTEGER,           -- Maximum students allowed
prerequisites TEXT               -- Comma-separated prerequisite course IDs
```

**Timetables Table:**
```sql
"isOvernightClass" BOOLEAN DEFAULT FALSE  -- Indicates midnight crossing
```

**New Table - enrollment_configs:**
```sql
CREATE TABLE enrollment_configs (
    id SERIAL PRIMARY KEY,
    "collegeId" INTEGER NOT NULL,
    "maxCreditHoursPerSemester" INTEGER DEFAULT 18,
    "maxStudyHoursPerDay" INTEGER DEFAULT 8,
    "minBreakTimeBetweenClasses" INTEGER DEFAULT 15,
    "maxCoursesPerSemester" INTEGER DEFAULT 6,
    "allowOvernightClasses" BOOLEAN DEFAULT FALSE
);
```

## Enhanced Validation Service

### Core Features:
1. **Comprehensive Validation**: Single method validates all edge cases
2. **Configurable Limits**: College-specific academic policies
3. **Detailed Error Messages**: Specific violation descriptions
4. **Performance Optimized**: Efficient database queries

### Key Methods:
- `validateEnrollmentEdgeCases()` - Main validation orchestrator
- `findTimetableConflicts()` - Enhanced conflict detection
- `validateBufferTime()` - Travel time validation
- `validateDailyStudyHours()` - Daily hour limits
- `validatePrerequisites()` - Prerequisite checking
- `validateCourseCapacity()` - Enrollment capacity limits

## Test Scenarios

### Sample Edge Cases in Seed Data:

1. **Overnight Lab Session**:
   - Friday 23:00-01:00 (crosses midnight)
   - Tests overnight conflict detection

2. **Buffer Time Violation**:
   - Monday 10:30-10:35 followed by 10:35-12:00
   - Tests insufficient break time (0 minutes)

3. **Daily Hours Exceeded**:
   - Monday 08:00-17:00 + Tuesday 08:00-17:00
   - Tests 18-hour daily limit violation

4. **Prerequisite Missing**:
   - PREREQ301 requires CS101 and CS102 completion
   - Tests prerequisite validation

5. **Capacity Full**:
   - Course with maxCapacity=5 and 5 enrolled students
   - Tests enrollment capacity limits

## API Integration

### Enhanced Enrollment Endpoint:
```typescript
POST /api/enrollment/enroll
{
  "studentId": 1,
  "courseIds": [13, 14, 15]  // Mix of regular and overnight courses
}
```

### Enhanced Validation Response:
```json
{
  "valid": false,
  "violations": [
    "Overnight conflict: FRIDAY 23:00:00-01:00:00 conflicts with SATURDAY 00:30:00-02:00:00",
    "Insufficient buffer time on MONDAY: only 0 minutes between 10:35 and 10:35 (minimum: 15 minutes)",
    "Daily study hours exceeded on MONDAY: 18.0 hours (maximum: 8 hours)",
    "Course PREREQ301 requires completion of prerequisite courses: 1, 2",
    "Course CS999 is at full capacity (10 students)"
  ]
}
```

## Live Testing Results ✅

### Successfully Implemented and Tested Edge Cases:

1. **✅ Overnight Classes Detection**
   ```bash
   # MIT student can enroll in overnight class (allowed)
   curl -X POST http://localhost:3000/enrollment \
     -d '{"studentId": 1, "courseIds": [14]}' 
   # Result: ✅ SUCCESS
   
   # Stanford student cannot enroll in overnight class (not allowed)
   curl -X POST http://localhost:3000/enrollment \
     -d '{"studentId": 5, "courseIds": [15]}'
   # Result: ❌ "Overnight classes are not allowed for this college"
   ```

2. **✅ Buffer Time Validation**
   ```bash
   # Back-to-back classes with 0-minute buffer (minimum: 15 minutes)
   curl -X POST http://localhost:3000/enrollment \
     -d '{"studentId": 1, "courseIds": [16, 17]}'
   # Result: ❌ "Insufficient buffer time on MONDAY: only 0 minutes between 10:35:00 and 10:35:00"
   ```

3. **✅ Daily Study Hours Limit**
   ```bash
   # 9-hour intensive course (maximum: 8 hours)
   curl -X POST http://localhost:3000/enrollment \
     -d '{"studentId": 2, "courseIds": [18]}'
   # Result: ❌ "Daily study hours exceeded on MONDAY: 9.0 hours (maximum: 8 hours)"
   ```

4. **✅ Prerequisites Validation**
   ```bash
   # Live Test: Advanced course requiring CS101 and CS102 completion
   curl -X POST http://localhost:3000/enrollment \
     -H "Content-Type: application/json" \
     -d '{"studentId": 2, "courseIds": [16]}'
   # Result: ❌ "Course PREREQ301 requires completion of prerequisite courses: 1, 2"
   
   # Validation endpoint provides detailed response
   curl -X POST http://localhost:3000/validation/enrollment-check \
     -H "Content-Type: application/json" \
     -d '{"studentId": 2, "courseIds": [16]}'
   # Result: {"valid": false, "message": "Validation failed", 
   #         "issues": ["Course PREREQ301 requires completion of prerequisite courses: 1, 2"]}
   ```

5. **✅ College-Specific Configurations**
   - MIT: Allows overnight classes, 18 credit hours, 8 study hours/day
   - Stanford: No overnight classes, 16 credit hours, 7 study hours/day  
   - UC Berkeley: No overnight classes, 20 credit hours, 9 study hours/day

### Database Schema Successfully Enhanced:

```sql
-- Added to courses table
ALTER TABLE courses ADD COLUMN "maxCapacity" INTEGER;
ALTER TABLE courses ADD COLUMN prerequisites TEXT;

-- Added to timetables table  
ALTER TABLE timetables ADD COLUMN "isOvernightClass" BOOLEAN DEFAULT FALSE;

-- New enrollment_configs table created
CREATE TABLE enrollment_configs (
    "collegeId" INTEGER PRIMARY KEY,
    "maxCreditHoursPerSemester" INTEGER DEFAULT 18,
    "maxStudyHoursPerDay" INTEGER DEFAULT 8,
    "minBreakTimeBetweenClasses" INTEGER DEFAULT 15,
    "maxCoursesPerSemester" INTEGER DEFAULT 6,
    "allowOvernightClasses" BOOLEAN DEFAULT FALSE
);
```

## Usage Examples

### Testing Overnight Classes:
```bash
# Try enrolling in overnight lab
curl -X POST http://localhost:3000/api/enrollment/enroll \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [13]}'
```

### Testing Buffer Time:
```bash
# Try enrolling in back-to-back classes
curl -X POST http://localhost:3000/api/enrollment/enroll \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [15, 16]}'
```

### Testing Prerequisites:
```bash
# Try enrolling without prerequisites
curl -X POST http://localhost:3000/api/enrollment/enroll \
  -H "Content-Type: application/json" \
  -d '{"studentId": 2, "courseIds": [16]}'
```

This implementation provides a robust foundation for handling complex enrollment scenarios while maintaining data integrity and enforcing academic policies.
