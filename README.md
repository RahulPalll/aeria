# Student Course Enrollment System
**Production-Ready Backend with Raw SQL & Advanced Validation**

A comprehensive student course enrollment system with sophisticated timetable conflict detection, edge case handling, and database-level constraints. Built with NestJS and PostgreSQL using optimized raw SQL queries.

## 📋 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Database Design](#database-design)
- [Advanced Features](#advanced-features)
- [Development](#development)
- [Testing](#testing)

## 🎯 Overview

A **production-ready, enterprise-grade** student course enrollment system featuring:

### 🚀 Core Capabilities
- **Raw SQL Implementation**: Direct PostgreSQL queries for optimal performance
- **Advanced Edge Case Handling**: Overnight classes, buffer time, daily limits
- **Database-Level Integrity**: Triggers, constraints, and transaction safety
- **College-Specific Policies**: Cross-college enrollment prevention
- **Real-Time Validation**: Comprehensive conflict detection and capacity management

### 🌐 System Status
✅ **Production Ready** - Consolidated architecture with all features  
✅ **Server**: http://localhost:3001  
✅ **API Documentation**: http://localhost:3001/api  
✅ **Health Monitoring**: http://localhost:3001/health  
✅ **Database**: PostgreSQL with enhanced schema and triggers  

## 🚀 Key Features

### 🎓 Core Enrollment System
- **Multi-Course Enrollment**: Students can enroll in multiple courses with validation
- **Real-Time Conflict Detection**: Timetable conflicts, capacity limits, prerequisites
- **College-Specific Policies**: Same-college constraint enforcement
- **Transaction Safety**: All-or-nothing enrollment operations

### 🌟 Advanced Edge Cases
- **🌙 Overnight Classes**: Support for classes crossing midnight (23:00 Tue → 01:00 Wed)
- **⏰ Buffer Time Management**: 15-minute minimum buffer between consecutive classes
- **📅 Daily Study Limits**: Maximum 8 hours of classes per day with cross-day calculation
- **🔄 Cross-Day Conflicts**: Smart detection of overnight class conflicts
- **🏫 Cross-College Prevention**: Database-enforced college matching

### 🛡️ Performance & Reliability
- **Raw SQL Queries**: No ORM overhead - direct PostgreSQL optimization
- **Database-Level Constraints**: Foreign keys, triggers, and check constraints
- **Connection Pooling**: Optimized database connections with transaction management
- **Comprehensive Validation**: Multi-layer validation (DTO → Business → Database)
- **Admin Safety**: Prevents data corruption during administrative operations

## ⚡ Quick Start

### 🚀 One-Command Setup
```bash
# Install dependencies and setup database
./setup.sh

# Start development server
npm run start:dev
```

### 📋 Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup database with schema and seed data
./setup.sh

# 3. Start development server
npm run start:dev
```

### 🌐 Access Points
- **🏠 API Base URL**: http://localhost:3001
- **📚 Interactive API Docs**: http://localhost:3001/api
- **❤️ Health Check**: http://localhost:3001/health

## 🏗️ Architecture

### 💻 Technology Stack
- **Backend Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL 14+ with raw SQL queries
- **Documentation**: Swagger/OpenAPI with interactive testing
- **Validation**: class-validator with custom business rules
- **Connection Pool**: node-postgres for optimal performance

### 📁 Optimized Project Structure
```
student-enrollment-system/
├── 📁 database/                     # Database layer
│   ├── schema.sql                   # Enhanced schema with triggers
│   └── seed.sql                     # Comprehensive test data
│
├── 📁 src/                          # Source code
│   ├── 📁 controllers/              # REST API endpoints (4 files)
│   │   ├── admin.controller.ts      # Administrative operations
│   │   ├── courses.controller.ts    # Course browsing
│   │   ├── enrollment.controller.ts # Core enrollment logic
│   │   └── validation.controller.ts # Validation services
│   │
│   ├── 📁 database/                 # Database connection layer
│   │   ├── database.module.ts       # PostgreSQL module config
│   │   └── database.service.ts      # Raw SQL operations
│   │
│   ├── 📁 services/                 # Business logic (4 files)
│   │   ├── admin.service.ts         # Admin operations
│   │   ├── enrollment.service.ts    # Enrollment business logic
│   │   ├── health.service.ts        # System health monitoring
│   │   └── validation.service.ts    # Consolidated validation logic
│   │
│   ├── 📁 dto/                      # Data Transfer Objects (5 files)
│   ├── 📁 types/                    # TypeScript interfaces
│   └── � modules/                  # NestJS modules (2 files)
│
├── 📄 setup.sh                      # Database setup script
├── 📄 reset.sh                      # Database reset utility
└── 📄 dev.sh                        # Development helper
```

## 🗄️ Database Design

### 📊 Core Schema
```sql
-- Educational institutions
CREATE TABLE colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students with college association
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    college_id INTEGER NOT NULL REFERENCES colleges(id)
);

-- Courses with capacity and college constraints
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    credits INTEGER NOT NULL DEFAULT 3,
    college_id INTEGER NOT NULL REFERENCES colleges(id),
    max_capacity INTEGER DEFAULT 30
);

-- Advanced timetable with overnight support
CREATE TABLE timetables (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    -- Enhanced constraints for overnight classes
    CONSTRAINT valid_time_duration 
        CHECK (end_time != start_time)
);

-- Enrollment tracking with timestamps
CREATE TABLE student_course_selections (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(5), -- For completed courses
    UNIQUE (student_id, course_id)
);
```

### 🛡️ Advanced Database Features
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

-- Timetable conflict prevention (including overnight classes)
CREATE OR REPLACE FUNCTION check_timetable_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Advanced conflict detection with cross-day support
    IF EXISTS (
        SELECT 1 FROM student_course_selections scs
        JOIN timetables t1 ON scs.course_id = t1.course_id
        JOIN timetables t2 ON NEW.course_id = t2.course_id
        WHERE scs.student_id = NEW.student_id
          AND t1.day_of_week = t2.day_of_week
          AND overlaps_time_ranges(t1.start_time, t1.end_time, t2.start_time, t2.end_time)
    ) THEN
        RAISE EXCEPTION 'Timetable conflict detected';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 🔗 Entity Relationships
```
Colleges (1) ──→ (N) Students
Colleges (1) ──→ (N) Courses  
Courses (1) ──→ (N) Timetables
Students (N) ←──→ (N) Courses (via student_course_selections)
```

## 📡 API Endpoints

### 🎓 Student Enrollment
```http
# Multi-course enrollment with validation
POST /enrollment
{
  "studentId": 1,
  "courseIds": [1, 2, 3]
}

# Get student's enrolled courses
GET /enrollment/student/:studentId

# Unenroll from courses
DELETE /enrollment/unenroll
{
  "studentId": 1,
  "courseIds": [1, 2]
}
```

### 🔍 Advanced Validation (Dry-Run)
```http
# Comprehensive enrollment validation
POST /validation/enrollment-check
{
  "studentId": 1,
  "courseIds": [1, 2, 3]
}

# Buffer time validation
POST /validation/buffer-time-check
{
  "studentId": 1,
  "courseIds": [1, 2]
}

# Timetable conflict detection
POST /validation/timetable-check
{
  "courseId": 1,
  "dayOfWeek": "MONDAY",
  "startTime": "09:00",
  "endTime": "10:30"
}
```

### 📚 Course Management
```http
# Browse courses (optional college filter)
GET /courses?collegeId=1

# Get course details with timetable
GET /courses/:courseId
```

### 🔧 Administrative Operations
```http
# Complete CRUD for all entities
POST|GET|PUT|DELETE /admin/colleges
POST|GET|PUT|DELETE /admin/students  
POST|GET|PUT|DELETE /admin/courses
POST|PUT|DELETE /admin/timetable

# Administrative safety - prevents deletion if students enrolled
DELETE /admin/timetable/:id  # Only if no enrolled students
```

### 🏥 System Monitoring
```http
# Health check with database status
GET /health
```

## 🌟 Advanced Features

### 🌙 Overnight Class Support
```typescript
// Example: Night lab session crossing midnight
// Tuesday 23:00 → Wednesday 01:00
{
  "courseId": 7,
  "dayOfWeek": "TUESDAY", 
  "startTime": "23:00",
  "endTime": "01:00"  // Automatically handles next day
}
```
- **Cross-Day Conflict Detection**: Validates conflicts spanning midnight
- **Duration Calculations**: Proper time arithmetic across day boundaries
- **Buffer Time Support**: 15-minute buffer validation across midnight

### ⏰ Buffer Time Management
```typescript
// Automatically enforced 15-minute minimum buffer
Class 1: Monday 10:00-11:30
Class 2: Monday 11:45-13:15  ✅ Valid (15 min buffer)
Class 2: Monday 11:40-13:15  ❌ Invalid (10 min buffer)
```

### 📅 Daily Study Limits
- **Maximum 8 hours per day**: Aggregates all enrolled course durations
- **Overnight Calculation**: Properly counts time across midnight boundary
- **Real-time Validation**: Checks during enrollment and timetable changes

### 🔄 Comprehensive Edge Cases
- **Cross-College Prevention**: Database-enforced college matching
- **Capacity Management**: Real-time enrollment tracking with limits
- **Admin Safety**: Prevents breaking enrolled student schedules
- **Transaction Safety**: All-or-nothing enrollment operations

### 🛡️ Validation Layers
1. **DTO Validation**: Request format and basic constraints
2. **Business Logic**: Advanced rules and edge cases  
3. **Database Constraints**: Final enforcement with triggers
4. **Transaction Rollback**: Automatic cleanup on any failure

## 💻 Development

### 🛠️ Development Scripts
```bash
# Development server with hot reload
npm run start:dev

# Production server
npm run start:prod

# Build for production
npm run build

# Run tests with coverage
npm run test

# Code formatting and linting
npm run lint
npm run format
```

### 📊 Database Management
```bash
# Complete setup (database + schema + seed data)
./setup.sh

# Reset database to clean state
./reset.sh

# Development helper script
./dev.sh setup    # Install dependencies and setup database
./dev.sh dev      # Start development server
./dev.sh reset    # Reset database to clean state
```

### 🌐 Environment Configuration
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

## 🧪 Testing

### 🎯 Test Scenarios
```bash
# 1. Multi-course enrollment success
curl -X POST http://localhost:3001/enrollment \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [1, 3]}'

# 2. Overnight class conflict detection
curl -X POST http://localhost:3001/validation/enrollment-check \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [7, 8]}'

# 3. Buffer time validation (15-minute minimum)
curl -X POST http://localhost:3001/validation/buffer-time-check \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [1, 2]}'

# 4. Cross-college enrollment prevention
curl -X POST http://localhost:3001/enrollment \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [6]}'  # Should fail

# 5. Admin safety (delete with enrolled students)
curl -X DELETE http://localhost:3001/admin/timetable/1  # Should fail
```

### 📋 Edge Case Test Data
- **🌙 Overnight Classes**: 23:00-01:00 sessions across midnight
- **⏰ Buffer Time Violations**: Classes with <15 minute gaps
- **📅 Daily Hour Limits**: Scenarios exceeding 8 hours per day
- **🏫 Cross-College Scenarios**: Multi-college enrollment attempts
- **📊 Capacity Limits**: Over-enrollment test scenarios

## 🚨 Business Rules

### 🔒 Core Constraints
1. **Same College Rule**: Students ↔ Courses college matching (database-enforced)
2. **Timetable Conflicts**: No overlapping schedules (including overnight classes)
3. **Buffer Time**: Minimum 15 minutes between consecutive classes
4. **Daily Limits**: Maximum 8 hours of classes per day
5. **Capacity Limits**: Course enrollment capacity enforcement

### 🛡️ Administrative Safety
1. **Enrolled Student Protection**: Cannot delete/modify timetables affecting enrolled students
2. **Referential Integrity**: Cascading deletes maintain data consistency  
3. **Transaction Safety**: All-or-nothing enrollment operations
4. **Validation Layers**: DTO validation → Business logic → Database constraints

## 📚 Documentation & Resources

### 🌐 Interactive Documentation
- **🏠 Live API Documentation**: http://localhost:3001/api (Swagger UI)
- **❤️ System Health Check**: http://localhost:3001/health
- **📋 API JSON Schema**: http://localhost:3001/api-json

### 📖 Additional Documentation
- **📄 Implementation Details**: Complete technical architecture
- **🔄 Raw SQL Migration**: TypeORM removal documentation  
- **🧪 API Testing Guide**: Comprehensive testing utilities

## 🎯 Key Achievements

### ✅ **Advanced Features Implemented**
- **🌙 Overnight Class Support**: Proper handling of classes crossing midnight
- **⏰ Buffer Time Validation**: Smart conflict detection with travel time
- **🚀 Raw SQL Implementation**: No ORM dependencies, optimized queries  
- **🔍 Comprehensive Validation**: Multi-layer validation system
- **🛡️ Admin Safety Features**: Prevents data corruption during operations

### ✅ **Production-Ready Architecture**
- **📊 Performance Optimized**: Connection pooling and efficient queries
- **🔒 Type Safety**: Full TypeScript implementation with interfaces
- **🚨 Error Handling**: Detailed error messages with proper HTTP codes
- **📚 Complete Documentation**: Interactive API docs with examples
- **🧪 Testing Suite**: Automated testing for all edge cases

## 🤝 Contributing

1. **Code Style**: Follow existing patterns with dependency injection
2. **Testing**: Add comprehensive tests for new features
3. **Documentation**: Update API docs and README as needed
4. **Database**: Ensure validations work at database level
5. **Edge Cases**: Test thoroughly with provided utilities

## 📝 License

This project demonstrates advanced backend development with raw SQL implementation for educational purposes.

---

**🎉 Student Course Enrollment System - Production-Ready with Advanced Edge Case Handling!**

*Built with ❤️ using NestJS, PostgreSQL, and Raw SQL Optimization*