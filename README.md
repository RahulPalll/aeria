# Student Course Enrollment System
**Backend Development Assignment Implementation**

A comprehensive backend system for managing student course enrollment with advanced timetable conflict detection and database constraints enforcement.

## 📋 Assignment Requirements Fulfilled

### ✅ 1. Database Design
- **Colleges**: ID, name, code, address with unique constraints
- **Students**: ID, name, email, student ID, college association
- **Courses**: ID, code, name, description, credits, college association  
- **Timetables**: Course schedules with day, start time, end time, room
- **Student Course Selections**: Enrollment records linking students to courses

### ✅ 2. Save Operation for Student Course Selection
- **Endpoint**: `POST /enrollment`
- **Input**: Student ID + array of Course IDs
- **Validation**: 
  - Student and courses exist and belong to same college
  - No timetable conflicts between selected courses
  - No duplicate enrollments
- **Output**: Success message with enrolled courses or validation errors

### ✅ 3. Bonus: Database Constraints & Admin Functionality
- **Database-level constraints**: Triggers prevent invalid enrollments
- **Admin endpoints**: Full CRUD for colleges, students, courses, timetables
- **Conflict prevention**: Real-time validation for timetable updates

## 🚀 Quick Setup

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)

### One-Command Setup
```bash
./setup.sh
```

### Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup database with schema and sample data
npm run db:setup

# 3. Configure environment (optional - defaults work for local)
cp env.example .env

# 4. Start the application
npm run start:dev
```

### Access Points
- **API Base URL**: `http://localhost:3000`
- **Swagger Documentation**: `http://localhost:3000/api`
- **Health Check**: `http://localhost:3000`

## 📡 API Endpoints

### Core Assignment Functionality

#### Student Course Enrollment
```http
POST /enrollment
Content-Type: application/json

{
  "studentId": 1,
  "courseIds": [1, 2, 3]
}
```

#### Get Student Enrollments
```http
GET /enrollment/student/1
```

#### Validate Enrollment (Dry Run)
```http
POST /validation/enrollment-check
Content-Type: application/json

{
  "studentId": 1,
  "courseIds": [1, 2]
}
```

### Admin Functionality (Bonus)

#### Timetable Management
```http
# Create timetable
POST /admin/timetable
{
  "courseId": 1,
  "dayOfWeek": "MONDAY",
  "startTime": "09:00",
  "endTime": "10:30",
  "room": "Room 101"
}

# Update timetable (with enrolled student conflict checking)
PUT /admin/timetable/1
{
  "startTime": "10:00",
  "endTime": "11:30"
}

# Delete timetable (prevents deletion if students enrolled)
DELETE /admin/timetable/1

# Get course timetables
GET /admin/course/1/timetables
```

#### Complete CRUD Operations
- **Colleges**: `POST|GET|PUT|DELETE /admin/colleges`
- **Students**: `POST|GET|PUT|DELETE /admin/students`
- **Courses**: `POST|GET|PUT|DELETE /admin/courses`

### Additional Features
```http
# Browse courses by college
GET /courses/college/1

# Get course timetable
GET /courses/1/timetable

# Validate timetable creation
POST /validation/timetable-check
```

## 🗄️ Database Schema

### Entity Relationships
```
Colleges (1) ──→ (N) Students
Colleges (1) ──→ (N) Courses
Courses (1) ──→ (N) Timetables
Students (N) ←──→ (N) Courses (via StudentCourseSelections)
```

### Key Constraints
- **Same College Rule**: Students can only enroll in courses from their college
- **Timetable Conflicts**: Students cannot enroll in courses with overlapping schedules
- **Unique Enrollments**: Students cannot enroll in the same course twice
- **Data Integrity**: Foreign keys with CASCADE DELETE maintain consistency

### Database-Level Enforcement (Bonus)
```sql
-- Trigger: Enforce same-college enrollment
CREATE TRIGGER enforce_same_college_enrollment...

-- Trigger: Prevent timetable conflicts
CREATE TRIGGER prevent_timetable_conflicts...
```

## 🧪 Testing the System

### Sample Test Scenarios

#### 1. Successful Enrollment
```bash
curl -X POST http://localhost:3000/enrollment \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [1, 3]}'
```

#### 2. Timetable Conflict Detection
```bash
# This should fail due to time conflict
curl -X POST http://localhost:3000/enrollment \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [1, 2]}'
```

#### 3. Cross-College Enrollment Prevention
```bash
# This should fail - student from MIT trying to enroll in Stanford course
curl -X POST http://localhost:3000/enrollment \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [6]}'
```

#### 4. Admin Timetable Management
```bash
# Add new timetable
curl -X POST http://localhost:3000/admin/timetable \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": 1,
    "dayOfWeek": "FRIDAY",
    "startTime": "13:00",
    "endTime": "14:30",
    "room": "Room 105"
  }'
```

### Sample Data Included
- **3 Colleges**: MIT, Stanford, UC Berkeley
- **6 Students**: 2 per college
- **12 Courses**: 4-5 per college
- **Multiple Timetables**: Realistic class schedules
- **Sample Enrollments**: Pre-enrolled students for testing

## 💻 Technology Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Features**: Database triggers, comprehensive error handling

## 📁 Project Structure

```
src/
├── controllers/         # API endpoints
│   ├── enrollment.controller.ts    # Core assignment functionality
│   ├── admin.controller.ts         # Bonus admin features
│   ├── courses.controller.ts       # Course browsing
│   └── validation.controller.ts    # Dry-run validations
├── services/           # Business logic
├── entities/           # Database models (TypeORM)
├── dto/               # Data transfer objects
├── modules/           # NestJS modules
└── database/          # Database configuration

schema.sql             # Complete database schema
seed.sql              # Sample data for testing
setup.sh              # One-command setup script
```

## 🎯 Assignment Deliverables

1. **✅ Database Schema**: `schema.sql` with complete DDL and constraints
2. **✅ Source Code**: Complete NestJS implementation with enrollment logic
3. **✅ Course Selection Function**: POST /enrollment with full validation
4. **✅ Database Constraints**: Triggers and constraints enforce business rules
5. **✅ Admin Functionality**: Complete timetable and entity management

## 🚨 Business Rules Enforced

1. **College Consistency**: Students can only enroll in courses from their college
2. **Timetable Conflict Prevention**: No overlapping class times on same day
3. **Enrollment Uniqueness**: No duplicate course enrollments
4. **Admin Safety**: Cannot delete timetables with enrolled students
5. **Data Integrity**: Cascading deletes maintain referential integrity

## 📊 Database Management

```bash
# Reset database with fresh schema and data
npm run db:reset

# Setup database only
npm run db:setup

# View database status
psql -d student_enrollment -c "\dt"
```

---

**Assignment completed with full functionality and bonus features implemented!** 🎉 