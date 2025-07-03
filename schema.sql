-- Student Course Enrollment System Database Schema
-- Assignment Implementation - Backend Development

-- Create ENUM type for day of week
CREATE TYPE day_of_week AS ENUM (
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
);

-- Create ENUM type for enrollment status
CREATE TYPE enrollment_status AS ENUM (
    'ENROLLED', 'WITHDRAWN', 'COMPLETED'
);

-- ================================
-- TABLE: colleges
-- ================================
CREATE TABLE colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    address TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- TABLE: students
-- ================================
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    "studentId" VARCHAR(20) NOT NULL UNIQUE,
    "collegeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint: students belong to a college
    CONSTRAINT fk_students_college 
        FOREIGN KEY ("collegeId") REFERENCES colleges(id) 
        ON DELETE CASCADE
);

-- ================================
-- TABLE: courses
-- ================================
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 3,
    "collegeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint: courses belong to a college
    CONSTRAINT fk_courses_college 
        FOREIGN KEY ("collegeId") REFERENCES colleges(id) 
        ON DELETE CASCADE,
    
    -- Check constraint: credits must be positive
    CONSTRAINT chk_credits_positive 
        CHECK (credits > 0)
);

-- ================================
-- TABLE: timetables
-- ================================
CREATE TABLE timetables (
    id SERIAL PRIMARY KEY,
    "courseId" INTEGER NOT NULL,
    "dayOfWeek" day_of_week NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    room VARCHAR(100),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint: timetables belong to a course
    CONSTRAINT fk_timetables_course 
        FOREIGN KEY ("courseId") REFERENCES courses(id) 
        ON DELETE CASCADE,
    
    -- Check constraint: end time must be after start time
    CONSTRAINT chk_valid_time_range 
        CHECK ("endTime" > "startTime"),
    
    -- Unique constraint: prevent duplicate timetable entries for same course
    CONSTRAINT uk_timetable_unique 
        UNIQUE ("courseId", "dayOfWeek", "startTime", "endTime")
);

-- ================================
-- TABLE: student_course_selections
-- ================================
CREATE TABLE student_course_selections (
    id SERIAL PRIMARY KEY,
    "studentId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "enrolledAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status enrollment_status DEFAULT 'ENROLLED',
    
    -- Foreign key constraints
    CONSTRAINT fk_selections_student 
        FOREIGN KEY ("studentId") REFERENCES students(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_selections_course 
        FOREIGN KEY ("courseId") REFERENCES courses(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint: prevent duplicate enrollments
    CONSTRAINT uk_student_course 
        UNIQUE ("studentId", "courseId")
);

-- ================================
-- INDEXES for Performance
-- ================================

-- Index on student collegeId for faster joins
CREATE INDEX idx_students_college_id ON students("collegeId");

-- Index on course collegeId for faster joins
CREATE INDEX idx_courses_college_id ON courses("collegeId");

-- Index on timetable courseId for faster lookups
CREATE INDEX idx_timetables_course_id ON timetables("courseId");

-- Index on timetable day and time for conflict checking
CREATE INDEX idx_timetables_schedule ON timetables("dayOfWeek", "startTime", "endTime");

-- Index on student course selections for faster enrollment queries
CREATE INDEX idx_selections_student_id ON student_course_selections("studentId");
CREATE INDEX idx_selections_course_id ON student_course_selections("courseId");

-- ================================
-- DATABASE CONSTRAINTS (Bonus Requirement)
-- ================================

-- Function to check if student and course belong to same college
CREATE OR REPLACE FUNCTION check_same_college_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT s."collegeId" FROM students s WHERE s.id = NEW."studentId") != 
       (SELECT c."collegeId" FROM courses c WHERE c.id = NEW."courseId") THEN
        RAISE EXCEPTION 'Student and course must belong to the same college';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce same-college constraint
CREATE TRIGGER enforce_same_college_enrollment
    BEFORE INSERT ON student_course_selections
    FOR EACH ROW
    EXECUTE FUNCTION check_same_college_enrollment();

-- Function to check timetable conflicts during enrollment
CREATE OR REPLACE FUNCTION check_timetable_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM student_course_selections scs1
        JOIN timetables t1 ON scs1."courseId" = t1."courseId"
        JOIN timetables t2 ON NEW."courseId" = t2."courseId"
        WHERE scs1."studentId" = NEW."studentId"
        AND t1."dayOfWeek" = t2."dayOfWeek"
        AND t1."startTime" < t2."endTime"
        AND t1."endTime" > t2."startTime"
        AND scs1.status = 'ENROLLED'
    ) THEN
        RAISE EXCEPTION 'Timetable conflict detected for this enrollment';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent timetable conflicts during enrollment
CREATE TRIGGER prevent_timetable_conflicts
    BEFORE INSERT ON student_course_selections
    FOR EACH ROW
    EXECUTE FUNCTION check_timetable_conflicts(); 