# Student Course Enrollment System
**Optimized Backend System with Raw SQL Implementation**

A streamlined backend system for managing student course enrollment with timetable conflict detection and database constraints enforcement. Built with NestJS and PostgreSQL using raw SQL queries without ORM.

## 📋 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Database Design](#database-design)
- [API Endpoints](#api-endpoints)
- [Development](#development)

## 🎯 Overview

This is a **production-ready, optimized implementation** of a student course enrollment system featuring:
- Raw SQL implementation without ORM for maximum performance
- Database-level constraints and triggers for data integrity
- Comprehensive timetable conflict detection
- College-specific enrollment policies
- Clean, maintainable architecture

### System Status
✅ **Production Ready** - Optimized and cleaned architecture  
✅ **Server**: http://localhost:3001  
✅ **API Docs**: http://localhost:3001/api  
✅ **Health Check**: http://localhost:3001/health  
✅ **Database**: PostgreSQL with optimized schema  

## 🚀 Key Features

### Core Enrollment System
- **Multi-course Enrollment**: Students can enroll in multiple courses simultaneously
- **Real-time Validation**: Timetable conflicts, college constraints
- **Course Management**: Full CRUD operations for courses, students, colleges
- **Timetable Management**: Flexible scheduling with conflict detection

### Performance & Reliability
- **Raw SQL Implementation**: Direct PostgreSQL queries for optimal performance
- **Database-level Constraints**: Foreign keys, check constraints, and triggers
- **Transaction Safety**: All-or-nothing enrollment operations
- **Connection Pooling**: Optimized database connections

### Business Logic
- **Same College Constraint**: Students can only enroll in courses from their college
- **Timetable Conflict Detection**: Prevents overlapping class schedules
- **Admin Safety**: Prevents data corruption during administrative changes
- **Comprehensive Validation**: Multi-layer validation system

## ⚡ Quick Start

### One-Command Setup
```bash
# Using the development helper script
./dev.sh setup
./dev.sh dev
```

### Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup database
./setup.sh

# 3. Start development server
npm run start:dev
```

### Access Points
- **API Base**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🏗️ Architecture

### Technology Stack
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL 14+ with raw SQL queries
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator with business rules

### Optimized File Structure
```
enrollment/
├── 📁 database/                     # Database schema and seed data
│   ├── schema.sql                   # Core database schema with triggers
│   └── seed.sql                     # Test data for development
│
├── 📁 src/                          # Source code
│   ├── 📁 controllers/              # REST API controllers (4 files)
│   ├── 📁 database/                 # Database layer
│   ├── 📁 dto/                      # Consolidated DTOs (5 files)
│   ├── 📁 services/                 # Business logic services (4 files)
│   ├── 📁 modules/                  # NestJS modules (2 files)
│   └── 📁 types/                    # TypeScript interfaces
│
├── 📄 dev.sh                        # Development helper script
├── 📄 setup.sh                      # Database setup script
└── 📄 reset.sh                      # Database reset script
```

## 🗄️ Database Design

### Core Tables
```sql
-- Colleges: Educational institutions
CREATE TABLE colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students: Enrolled students
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    college_id INTEGER NOT NULL REFERENCES colleges(id)
);

-- Courses: Available courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    credits INTEGER NOT NULL DEFAULT 3,
    college_id INTEGER NOT NULL REFERENCES colleges(id),
    max_capacity INTEGER DEFAULT 30
);

-- Timetables: Course schedules
CREATE TABLE timetables (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- Student Enrollments
CREATE TABLE student_course_selections (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, course_id)
);
```

### Database Constraints & Triggers
- **Same College Enforcement**: Automatic validation via triggers
- **Timetable Conflict Prevention**: Database-level conflict detection
- **Referential Integrity**: Foreign key constraints with proper cascading
- **Data Validation**: Check constraints for business rules

## 📡 API Endpoints

### Student Enrollment
```http
# Enroll in multiple courses
POST /enrollment
{
  "studentId": 1,
  "courseIds": [1, 2, 3]
}

# Get student enrollments
GET /enrollment/student/:studentId

# Unenroll from courses
DELETE /enrollment/unenroll
{
  "studentId": 1,
  "courseIds": [1, 2]
}
```

### Course Management
```http
# Browse courses by college
GET /courses/college/:collegeId

# Get course timetable
GET /courses/:courseId/timetable
```

### Validation (Dry-run)
```http
# Validate enrollment before committing
POST /validation/enrollment-check
{
  "studentId": 1,
  "courseIds": [1, 2]
}

# Check timetable conflicts
POST /validation/timetable-check
{
  "studentId": 1,
  "courseId": 3
}
```

### Administrative Operations
```http
# Complete CRUD for all entities
POST|GET|PUT|DELETE /admin/colleges
POST|GET|PUT|DELETE /admin/students
POST|GET|PUT|DELETE /admin/courses
POST|PUT|DELETE /admin/timetable
```

### System Monitoring
```http
# Health check with database status
GET /health

# Welcome message
GET /
```

## 💻 Development

### Development Helper Script
```bash
./dev.sh setup    # Install dependencies and setup database
./dev.sh dev      # Start development server
./dev.sh reset    # Reset database to clean state
./dev.sh build    # Build for production
./dev.sh test     # Run tests
./dev.sh lint     # Lint code
./dev.sh docs     # Show API documentation URL
./dev.sh clean    # Clean build artifacts
```

### Available NPM Scripts
```bash
npm run start:dev     # Development server with hot reload
npm run start:prod    # Production server
npm run build         # Build for production
npm run test          # Run tests
npm run lint          # Lint code
npm run format        # Format code
```

### Environment Configuration
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_enrollment
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Application
PORT=3001
```

## 🎯 Optimization Features

### Code Optimizations
✅ **Consolidated DTOs**: Merged similar DTOs into base classes  
✅ **Removed Unused Services**: Eliminated unused EntityValidationService  
✅ **Clean Dependencies**: Optimized package.json with only necessary dependencies  
✅ **Streamlined Scripts**: Simplified npm scripts for common tasks  

### Architecture Improvements
✅ **Health Monitoring**: Built-in health check endpoint  
✅ **Development Tools**: Comprehensive development helper script  
✅ **Error Handling**: Consistent error responses across all endpoints  
✅ **API Documentation**: Complete Swagger documentation  

### File Structure Cleanup
✅ **Duplicate Removal**: Eliminated duplicate SQL and environment files  
✅ **Consolidated Structure**: Organized related functionality together  
✅ **Clean Modules**: Optimized module imports and exports  

## 🔧 Business Rules

### Core Constraints
1. **Same College Rule**: Students ↔ Courses college matching (database-enforced)
2. **Timetable Conflicts**: No overlapping schedules
3. **Capacity Limits**: Course enrollment capacity enforcement
4. **Data Integrity**: Comprehensive validation at multiple levels

### Administrative Safety
1. **Enrolled Student Protection**: Cannot delete/modify timetables affecting enrolled students
2. **Referential Integrity**: Cascading deletes maintain data consistency
3. **Transaction Safety**: All-or-nothing operations
4. **Validation Layers**: DTO validation → Business logic → Database constraints

## 📊 Performance Features

- **Connection Pooling**: Optimized PostgreSQL connections
- **Raw SQL Queries**: No ORM overhead for maximum performance
- **Indexed Queries**: Optimized database indexes for fast lookups
- **Transaction Management**: Proper rollback and commit handling
- **Error Recovery**: Comprehensive error handling and recovery

## 📚 API Documentation

Interactive API documentation is available at http://localhost:3001/api when the server is running.

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure all validations work at database level
5. Test with the provided development tools

---

**🎉 Optimized Student Course Enrollment System - Production Ready!**

## 📋 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Database Design](#database-design)
- [API Endpoints](#api-endpoints)
- [Setup Instructions](#setup-instructions)
- [Usage Examples](#usage-examples)
- [Time Handling Strategy](#time-handling-strategy)
- [System Status](#system-status)
- [Development Guidelines](#development-guidelines)

## 🎯 Overview

This is a **basic, core implementation** of a student course enrollment system that demonstrates:
- Raw SQL implementation without ORM
- Database-level constraints and triggers
- Entity-level validation and business logic
- Comprehensive timetable conflict detection
- College-specific enrollment policies

### Current System Status
✅ **Basic Mode Active** - Enhanced constraints have been removed  
✅ **Server**: Running on http://localhost:3001  
✅ **API Docs**: Available at http://localhost:3001/api  
✅ **Database**: PostgreSQL with basic schema only  

## 🚀 Key Features

### ✅ Core Enrollment System
- **Multi-course Enrollment**: Students can enroll in multiple courses simultaneously
- **Real-time Validation**: Timetable conflicts, college constraints
- **Course Management**: Full CRUD operations for courses, students, colleges
- **Timetable Management**: Flexible scheduling with conflict detection

### ✅ Database Design Excellence
- **Raw SQL Implementation**: No ORM - direct PostgreSQL queries for optimal performance
- **Database-level Constraints**: Foreign keys, check constraints, and triggers
- **Data Integrity**: Comprehensive validation at multiple levels
- **Performance Optimized**: Indexed queries and efficient relationships

### ✅ Business Logic Enforcement
- **Same College Constraint**: Students can only enroll in courses from their college
- **Timetable Conflict Detection**: Prevents overlapping class schedules
- **Capacity Management**: Course enrollment limits (basic implementation)
- **Admin Safety**: Prevents data corruption during administrative changes

### ✅ API & Documentation
- **RESTful APIs**: Clean, well-documented endpoints
- **Swagger Integration**: Interactive API documentation
- **Comprehensive Error Handling**: Detailed error messages
- **Input Validation**: Request/response validation with proper DTOs

## 🏗️ Architecture

### Technology Stack
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL 14+ with raw SQL queries
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator with business rules
- **Testing**: Jest with comprehensive test cases

### File Structure
```
enrollment/
├── 📁 database/                     # Database schema and seed data
│   ├── schema.sql                   # Core database schema with triggers
│   └── seed.sql                     # Test data for development
│
├── 📁 src/                          # Source code
│   ├── 📁 controllers/              # REST API controllers
│   │   ├── admin.controller.ts      # Administrative operations
│   │   ├── courses.controller.ts    # Course browsing APIs
│   │   ├── enrollment.controller.ts # Student enrollment APIs
│   │   └── validation.controller.ts # Validation endpoints
│   │
│   ├── 📁 database/                 # Database layer
│   │   ├── database.module.ts       # Database module configuration
│   │   └── database.service.ts      # Raw SQL query service
│   │
│   ├── 📁 dto/                      # Data Transfer Objects
│   │   ├── create-*.dto.ts          # Creation DTOs with validation
│   │   ├── enroll-student.dto.ts    # Enrollment request DTO
│   │   └── validate-*.dto.ts        # Validation request DTOs
│   │
│   ├── 📁 services/                 # Business logic services
│   │   ├── admin.service.ts         # Administrative operations
│   │   ├── enrollment.service.ts    # Core enrollment logic
│   │   ├── entity-validation.service.ts # Business rule validation
│   │   └── validation.service.ts    # Dry-run validation
│   │
│   └── 📁 types/                    # TypeScript interfaces
│       └── interfaces.ts            # System type definitions
```

## 🗄️ Database Design

### Core Tables
```sql
-- Colleges
CREATE TABLE colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students  
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    college_id INTEGER NOT NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id)
);

-- Courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    credits INTEGER NOT NULL DEFAULT 3,
    college_id INTEGER NOT NULL,
    max_capacity INTEGER DEFAULT 30,
    FOREIGN KEY (college_id) REFERENCES colleges(id)
);

-- Timetables
CREATE TABLE timetables (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Student Course Selections (Enrollments)
CREATE TABLE student_course_selections (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE (student_id, course_id)
);
```

### Database Constraints & Triggers
```sql
-- Same college constraint enforcement
CREATE OR REPLACE FUNCTION check_same_college_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT s.college_id FROM students s WHERE s.id = NEW.student_id) != 
       (SELECT c.college_id FROM courses c WHERE c.id = NEW.course_id) THEN
        RAISE EXCEPTION 'Student and course must belong to the same college';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Timetable conflict prevention
CREATE OR REPLACE FUNCTION check_timetable_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for timetable conflicts with existing enrollments
    IF EXISTS (
        SELECT 1 FROM student_course_selections scs
        JOIN timetables t1 ON scs.course_id = t1.course_id
        JOIN timetables t2 ON NEW.course_id = t2.course_id
        WHERE scs.student_id = NEW.student_id
          AND t1.day_of_week = t2.day_of_week
          AND t1.start_time < t2.end_time
          AND t1.end_time > t2.start_time
    ) THEN
        RAISE EXCEPTION 'Timetable conflict detected: overlapping class times';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 📡 API Endpoints

### Student Enrollment APIs
```typescript
// Enroll student in courses
POST /enrollment
{
  "studentId": 1,
  "courseIds": [1, 2, 3]
}

// Get student's enrolled courses
GET /enrollment/student/:studentId

// Unenroll from course
DELETE /enrollment/unenroll
{
  "studentId": 1,
  "courseId": 2
}
```

### Course Management APIs
```typescript
// Browse courses by college
GET /courses/college/:collegeId

// Get course timetable
GET /courses/:courseId/timetable
```

### Validation APIs
```typescript
// Validate enrollment before actual enrollment
POST /validation/enrollment-check
{
  "studentId": 1,
  "courseIds": [1, 2]
}

// Check for timetable conflicts
POST /validation/timetable-check
{
  "studentId": 1,
  "courseId": 3
}
```

### Administrative APIs
```typescript
// Manage colleges
POST /admin/colleges
GET /admin/colleges
PUT /admin/colleges/:id
DELETE /admin/colleges/:id

// Manage students
POST /admin/students
GET /admin/students/:id
PUT /admin/students/:id
DELETE /admin/students/:id

// Manage courses
POST /admin/courses
GET /admin/courses/:id
PUT /admin/courses/:id
DELETE /admin/courses/:id

// Manage timetables
POST /admin/timetable
PUT /admin/timetable/:id
DELETE /admin/timetable/:id
GET /admin/course/:courseId/timetables
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd student-enrollment-system

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Setup database
./setup.sh

# Start development server
npm run start:dev
```

### Environment Configuration
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_enrollment
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Application
PORT=3001
```

### Database Setup
```bash
# Run the setup script (creates database, applies schema, loads seed data)
./setup.sh

# Or manually:
createdb student_enrollment
psql -d student_enrollment -f database/schema.sql
psql -d student_enrollment -f database/seed.sql
```

## 💡 Usage Examples

### Basic Enrollment Workflow
```typescript
// 1. Browse available courses for a college
GET /courses/college/1

// 2. Validate enrollment before committing
POST /validation/enrollment-check
{
  "studentId": 1,
  "courseIds": [1, 3]
}

// 3. Enroll if validation passes
POST /enrollment
{
  "studentId": 1,
  "courseIds": [1, 3]
}

// 4. Check enrolled courses
GET /enrollment/student/1
```

### Administrative Operations
```typescript
// Create a new course
POST /admin/courses
{
  "code": "CS101",
  "name": "Introduction to Computer Science",
  "credits": 4,
  "collegeId": 1,
  "maxCapacity": 30
}

// Add timetable for the course
POST /admin/timetable
{
  "courseId": 1,
  "dayOfWeek": "MONDAY",
  "startTime": "09:00",
  "endTime": "10:30"
}
```

## ⏰ Time Handling Strategy

### Why We Use Local Time (Not UTC)
The system uses PostgreSQL `TIME` type for course schedules because:

✅ **Course schedules are inherently local**
- Students think "My class is at 9 AM on Monday"
- Classes don't shift when daylight saving changes
- Simple conflict detection without timezone complexity

❌ **UTC would create problems**
- Same class would have different UTC times in summer vs winter
- Complex timezone conversions for every query
- Student confusion with timezone shifts
- Much more complex database queries

### Time Implementation
```sql
-- Correct approach (current):
CREATE TABLE timetables (
    start_time TIME NOT NULL,  -- 09:00:00 (always means 9 AM local)
    end_time TIME NOT NULL     -- 10:30:00 (always means 10:30 AM local)
);

-- Simple conflict detection:
WHERE t1.start_time < t2.end_time AND t1.end_time > t2.start_time
```

## 📊 System Status

### Current Implementation Status
- ✅ **Basic Mode**: Core features without enhanced constraints
- ✅ **Database**: PostgreSQL with basic schema only
- ✅ **Server**: Running on port 3001
- ✅ **APIs**: All endpoints functional
- ✅ **Time Handling**: Correct local time implementation

### Basic Features Only
- ✅ Student enrollment in courses
- ✅ Same college constraint enforcement  
- ✅ Basic timetable conflict detection
- ✅ Admin management (colleges, students, courses, timetables)
- ✅ Database triggers for core constraints

### No Enhanced Features
- ❌ No overnight class support
- ❌ No buffer time validation
- ❌ No academic semester management
- ❌ No prerequisite system
- ❌ No enhanced audit trails
- ❌ No capacity limits enforcement
- ❌ No credit hour restrictions

## 👨‍💻 Development Guidelines

### Code Style
- Use dependency injection for database connections
- Implement comprehensive error handling
- Create detailed API documentation with Swagger
- Use validation decorators for DTOs
- Handle database transactions properly
- Implement proper logging for debugging

### Business Logic Focus
- Same college enrollment constraint enforcement
- Timetable conflict detection with proper time overlap logic
- Admin safety (prevent data corruption during administrative changes)
- Real-time validation before enrollment
- Comprehensive edge case handling

### Testing Requirements
- Test all business logic scenarios
- Validate database constraints work correctly
- Test transaction rollback scenarios
- Verify admin safety features
- Test cross-college enrollment prevention

### Database Best Practices
- Use raw SQL queries for optimal performance
- Implement database-level constraints for data integrity
- Use database triggers for automatic validations
- Store time as TIME type for proper comparisons
- Use enums for day of week consistency

## 🔧 Available Scripts

```bash
# Development
npm run start:dev          # Start development server with hot reload
npm run start              # Start production server
npm run build              # Build for production

# Database
./setup.sh                 # Setup database (create, schema, seed)
./reset.sh                 # Reset database (drop and recreate)

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run end-to-end tests
npm run test:cov           # Run tests with coverage

# Utilities
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
```

## � API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3001/api
- **API JSON**: http://localhost:3001/api-json

The Swagger documentation provides:
- Interactive API testing
- Request/response schemas
- Authentication requirements
- Example requests and responses

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure all validations work at database level
5. Test edge cases thoroughly

## 📝 License

This project is for educational purposes demonstrating advanced backend development with raw SQL implementation.

---

**Built with ❤️ using NestJS and PostgreSQL**
│   │   ├── enrollment.controller.ts # Core enrollment endpoints
│   │   ├── courses.controller.ts    # Course management
│   │   └── validation.controller.ts # Validation and conflict detection
│   │
│   ├── 📁 database/                 # Database layer
│   │   ├── database.module.ts       # Database module configuration
│   │   └── database.service.ts      # Raw SQL operations service
│   │
│   ├── 📁 dto/                      # Data Transfer Objects
│   │   ├── create-*.dto.ts          # Creation/update DTOs
│   │   └── validate-*.dto.ts        # Validation request DTOs
│   │
│   ├── 📁 services/                 # Business logic services
│   │   ├── admin.service.ts         # Administrative business logic
│   │   ├── enrollment.service.ts    # Core enrollment business logic
│   │   └── validation.service.ts    # Edge case validation service
│   │
│   └── 📁 types/                    # TypeScript interfaces
│       └── interfaces.ts            # System-wide type definitions
```

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
- **API Base URL**: `http://localhost:3001`
- **Swagger Documentation**: `http://localhost:3001/api`
- **Health Check**: `http://localhost:3001`

## 📡 API Endpoints

### 🎯 Core Enrollment System

#### Multi-Course Enrollment
```http
POST /enrollment/enroll
Content-Type: application/json

{
  "studentId": 1,
  "courseIds": [1, 2, 3]
}
```
**Features**: Validates same-college constraint, timetable conflicts, capacity limits

#### Get Student Enrollments
```http
GET /enrollment/student/1
```
**Returns**: Student's current enrollments with timetable details

#### Unenroll from Courses
```http
DELETE /enrollment/unenroll
Content-Type: application/json

{
  "studentId": 1,
  "courseIds": [1, 2]
}
```

### 🔍 Advanced Validation System

#### Comprehensive Enrollment Validation (Dry Run)
```http
POST /validation/enrollment-check
Content-Type: application/json

{
  "studentId": 1,
  "courseIds": [1, 2, 3]
}
```
**Validates**: College constraints, timetable conflicts, overnight classes, daily limits

#### Buffer Time Validation
```http
POST /validation/buffer-time-check
Content-Type: application/json

{
  "studentId": 1,
  "courseIds": [1, 2]
}
```
**Checks**: Minimum 15-minute buffer between consecutive classes

#### Timetable Conflict Check
```http
POST /validation/timetable-check
Content-Type: application/json

{
  "courseId": 1,
  "dayOfWeek": "MONDAY",
  "startTime": "09:00",
  "endTime": "10:30"
}
```

### 📚 Course Management

#### Browse All Courses
```http
GET /courses
```
**Optional Query**: `?collegeId=1` to filter by college

#### Get Course Details with Timetable
```http
GET /courses/1
```
**Returns**: Course info, timetables, capacity, current enrollments

### 🔧 Administrative Functions

#### Timetable Management
```http
# Create timetable
POST /admin/timetable
{
  "courseId": 1,
  "dayOfWeek": "MONDAY",
  "startTime": "09:00",
  "endTime": "10:30"
}

# Update timetable (with enrolled student safety checks)
PUT /admin/timetable/1
{
  "dayOfWeek": "TUESDAY",
  "startTime": "14:00",
  "endTime": "15:30"
}

# Delete timetable (only if no enrolled students)
DELETE /admin/timetable/1

# Get course timetables
GET /admin/course/1/timetables
```

#### College Management
```http
# Create college
POST /admin/colleges
{
  "name": "College of Engineering"
}

# Get all colleges
GET /admin/colleges

# Update college
PUT /admin/colleges/1
{
  "name": "Updated College Name"
}

# Delete college (only if no associated students/courses)
DELETE /admin/colleges/1
```

#### Student Management
```http
# Create student
POST /admin/students
{
  "studentId": "CS2024001",
  "name": "John Doe",
  "email": "john.doe@university.edu",
  "collegeId": 1
}

# Get student details
GET /admin/students/1

# Update student
PUT /admin/students/1
{
  "name": "John Updated",
  "email": "john.updated@university.edu"
}

# Delete student
DELETE /admin/students/1
```

#### Course Management
```http
# Create course
POST /admin/courses
{
  "code": "CS101",
  "name": "Introduction to Computer Science",
  "credits": 3,
  "collegeId": 1,
  "maxCapacity": 30
}

# Get course details
GET /admin/courses/1

# Update course
PUT /admin/courses/1
{
  "name": "Updated Course Name",
  "maxCapacity": 35
}

# Delete course (only if no enrollments)
DELETE /admin/courses/1
```

### 🎓 Course Completion System

#### Mark Course as Completed
```http
PUT /admin/course-completion
{
  "studentId": 1,
  "courseId": 1,
  "grade": "A"
}
```

#### Bulk Complete Courses (Semester End)
```http
POST /admin/bulk-course-completion
{
  "completions": [
    {"studentId": 1, "courseId": 1, "grade": "A"},
    {"studentId": 1, "courseId": 2, "grade": "B+"},
    {"studentId": 2, "courseId": 1, "grade": "A-"}
  ]
}
```

#### Get Student Completed Courses
```http
GET /admin/student-completed-courses/1
```
**Returns**: Completed courses with grades and credit totals

## 🌟 Advanced Features

### Edge Case Handling

#### 🌙 Overnight Classes
- **Supported**: Classes crossing midnight (e.g., 23:00 Tuesday - 01:00 Wednesday)
- **Validation**: Cross-day conflict detection
- **Example**: Night lab sessions, extended workshops

#### ⏰ Buffer Time Management
- **Requirement**: Minimum 15 minutes between consecutive classes
- **Smart Detection**: Accounts for travel time between locations
- **Overnight Support**: Validates buffer across midnight boundary

#### 📅 Daily Study Limits
- **Limit**: Maximum 8 hours of classes per day
- **Calculation**: Aggregates across all enrolled courses
- **Overnight Handling**: Properly counts time across days

#### 🏫 College-Specific Policies
- **Constraint**: Students can only enroll in courses from their college
- **Enforcement**: Database-level foreign key constraints
- **Admin Safety**: Prevents cross-college data corruption

### Database Features

#### 🛡️ Advanced Constraints
```sql
-- Sample constraints from schema.sql
ALTER TABLE student_course_selections 
ADD CONSTRAINT same_college_check 
CHECK (student_college_id = course_college_id);

-- Timetable conflict prevention trigger
CREATE TRIGGER prevent_timetable_conflicts 
BEFORE INSERT OR UPDATE ON timetables...
```

#### 🔄 Automatic Triggers
- **Enrollment Validation**: Prevents conflicting enrollments
- **Capacity Enforcement**: Auto-rejects over-capacity enrollments
- **Referential Integrity**: Maintains data consistency
- **Audit Logging**: Tracks all changes with timestamps
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

### Automated Testing Scripts

#### API Testing
```bash
# Run comprehensive API tests
node test-api.js

# Test specific edge cases
./test-edge-cases.sh

# Run full system validation
./comprehensive-test.sh
```

#### Sample Test Scenarios

#### 1. Successful Multi-Course Enrollment
```bash
curl -X POST http://localhost:3001/enrollment/enroll \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [1, 3]}'
```

#### 2. Overnight Class Conflict Detection
```bash
# Test overnight class validation
curl -X POST http://localhost:3001/validation/enrollment-check \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [7, 8]}'
```

#### 3. Buffer Time Validation
```bash
# Test 15-minute buffer requirement
curl -X POST http://localhost:3001/validation/buffer-time-check \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [1, 2]}'
```

#### 4. Cross-College Enrollment Prevention
```bash
# This should fail - student from MIT trying to enroll in Stanford course
curl -X POST http://localhost:3001/enrollment/enroll \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [6]}'
```

#### 5. Admin Safety Features
```bash
# Try to delete timetable with enrolled students (should fail)
curl -X DELETE http://localhost:3001/admin/timetable/1
```

### Edge Case Test Data Included
- **Overnight Classes**: 23:00-01:00 sessions
- **Buffer Time Violations**: Classes with <15 min gaps
- **Daily Hour Limits**: >8 hours of classes
- **Cross-College Scenarios**: Multi-college enrollment attempts
- **Capacity Limits**: Over-enrollment scenarios

## 💻 Technology Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with Raw SQL Queries
- **Connection Pool**: node-postgres (pg) for optimal performance
- **Validation**: class-validator, class-transformer with custom business rules
- **Documentation**: Swagger/OpenAPI with comprehensive examples
- **Architecture**: Dependency injection, modular services, transaction management

## 📁 Project Structure

```
enrollment/
├── 📁 database/                     # Database schema and seed data
│   ├── schema.sql                   # Complete schema with triggers
│   └── seed.sql                     # Edge case test data
│
├── 📁 src/                          # Source code
│   ├── 📁 controllers/              # REST API endpoints
│   │   ├── admin.controller.ts      # Administrative operations
│   │   ├── enrollment.controller.ts # Core enrollment logic
│   │   ├── courses.controller.ts    # Course management
│   │   └── validation.controller.ts # Validation services
│   │
│   ├── 📁 database/                 # Database layer
│   │   ├── database.module.ts       # PostgreSQL connection pool
│   │   └── database.service.ts      # Raw SQL operations
│   │
│   ├── 📁 services/                 # Business logic
│   │   ├── admin.service.ts         # Admin operations
│   │   ├── enrollment.service.ts    # Core enrollment logic
│   │   └── validation.service.ts    # Edge case validation
│   │
│   ├── 📁 dto/                      # Data transfer objects
│   ├── 📁 types/                    # TypeScript interfaces
│   └── 📁 filters/                  # Exception handling
│
├── 📁 .github/                      # GitHub configuration
│   └── copilot-instructions.md     # AI assistant guidelines
│
├── 📄 API_DOCUMENTATION.md          # Comprehensive API docs
├── 📄 IMPLEMENTATION_SUMMARY.md     # Technical implementation details
├── 📄 TYPEORM_REMOVAL.md            # Migration documentation
└── 📄 test-api.js                   # API testing utilities
```

## 🎯 Implementation Highlights

### Raw SQL Implementation
- **No ORM Dependencies**: Direct PostgreSQL queries for maximum control
- **Optimized Performance**: Custom queries tailored for specific operations
- **Database-Level Validation**: Triggers and constraints for data integrity
- **Transaction Management**: Proper rollback and commit handling

### Advanced Business Logic
- **Overnight Class Support**: Complex time overlap calculations
- **Multi-Day Validation**: Cross-day conflict detection
- **Buffer Time Management**: Travel time between classes
- **Capacity Management**: Real-time enrollment tracking

### Safety & Reliability
- **Admin Safety Checks**: Prevent breaking enrolled student schedules
- **Data Consistency**: Foreign key constraints with proper cascading
- **Error Recovery**: Comprehensive rollback mechanisms
- **Audit Trail**: Timestamp tracking for all operations

## 🚨 Business Rules Enforced

### Core Constraints
1. **Same College Rule**: Students ↔ Courses college matching (database-enforced)
2. **Timetable Conflicts**: No overlapping schedules including overnight classes
3. **Buffer Time**: Minimum 15 minutes between consecutive classes
4. **Daily Limits**: Maximum 8 hours of classes per day
5. **Capacity Limits**: Course enrollment capacity enforcement

### Administrative Safety
1. **Enrolled Student Protection**: Cannot delete/modify timetables affecting enrolled students
2. **Referential Integrity**: Cascading deletes maintain data consistency
3. **Validation Layers**: DTO validation → Business logic → Database constraints
4. **Transaction Safety**: All-or-nothing enrollment operations

## 📊 Database Management

```bash
# Complete system reset
./reset.sh

# Setup database with schema and sample data
./setup.sh

# Start development server
npm run start:dev

# Build for production
npm run build
```

### Database Health Check
```bash
# Check database connection
curl http://localhost:3001/health

# View database statistics
curl http://localhost:3001/admin/stats
```

## 📚 Documentation

- **API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **TypeORM Migration**: [TYPEORM_REMOVAL.md](./TYPEORM_REMOVAL.md)
- **Interactive API Docs**: http://localhost:3001/api (Swagger)

## 🎉 Key Achievements

### ✅ Advanced Features Implemented
- **Overnight Class Support**: Proper handling of classes crossing midnight
- **Buffer Time Validation**: Smart conflict detection with travel time
- **Raw SQL Implementation**: No ORM dependencies, optimized queries
- **Comprehensive Validation**: Multi-layer validation system
- **Admin Safety Features**: Prevents data corruption during admin operations

### ✅ Edge Cases Handled
- **Cross-Midnight Classes**: 23:00 Tuesday → 01:00 Wednesday
- **Adjacent Day Conflicts**: Overnight classes affecting next day schedules
- **Daily Hour Calculations**: Proper time aggregation across overnight periods
- **Concurrent Enrollments**: Race condition prevention with transactions
- **Capacity Management**: Real-time enrollment tracking

### ✅ Production-Ready Features
- **Comprehensive Error Handling**: Detailed error messages with proper HTTP codes
- **API Documentation**: Complete Swagger documentation with examples
- **Testing Suite**: Automated testing for all edge cases
- **Performance Optimized**: Connection pooling and optimized queries
- **Type Safety**: Full TypeScript implementation with interfaces

---

**🎉 Advanced Student Course Enrollment System - Complete Implementation with Raw SQL & Edge Case Handling!** 