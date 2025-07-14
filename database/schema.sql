-- Student Course Enrollment System Database Schema
-- Core Requirements Implementation

-- ================================
-- CORE ENTITIES
-- ================================

-- TABLE: colleges
CREATE TABLE colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(10) UNIQUE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Entity-level constraints
    CONSTRAINT chk_college_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_college_name_length CHECK (LENGTH(name) >= 3 AND LENGTH(name) <= 100),
    CONSTRAINT chk_college_code_format CHECK (code IS NULL OR code ~ '^[A-Z]{2,5}$'),
    CONSTRAINT chk_address_length CHECK (address IS NULL OR LENGTH(TRIM(address)) >= 10)
);

-- TABLE: students
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    college_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_students_college 
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    
    -- Entity-level constraints
    CONSTRAINT chk_student_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_student_name_length CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 100),
    CONSTRAINT chk_student_id_format CHECK (student_id ~ '^[A-Z0-9]{3,15}$'),
    CONSTRAINT chk_email_format CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- TABLE: courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    credits INTEGER DEFAULT 3,
    college_id INTEGER NOT NULL,
    max_capacity INTEGER DEFAULT 30,
    prerequisites TEXT, -- Comma-separated prerequisite course IDs
    description TEXT,
    
    -- Foreign key constraint
    CONSTRAINT fk_courses_college 
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    
    -- Entity-level constraints
    CONSTRAINT chk_course_code_format CHECK (code ~ '^[A-Z]{2}[0-9]{3}$'),
    CONSTRAINT chk_course_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_valid_credits CHECK (credits > 0 AND credits <= 6),
    CONSTRAINT chk_valid_capacity CHECK (max_capacity > 0 AND max_capacity <= 200)
);

-- TABLE: timetables
CREATE TABLE timetables (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_overnight_class BOOLEAN DEFAULT FALSE, -- Support for overnight classes
    room VARCHAR(50), -- Room location
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_timetables_course 
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Entity-level constraints
    CONSTRAINT chk_valid_day CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
    
    -- Enhanced time validation for regular and overnight classes
    CONSTRAINT chk_valid_time_range CHECK (
        CASE 
            WHEN is_overnight_class = FALSE THEN 
                end_time > start_time  -- Regular classes: end must be after start
            WHEN is_overnight_class = TRUE THEN 
                start_time > end_time  -- Overnight classes: start must be after end (cross midnight)
            ELSE FALSE
        END
    ),
    
    -- Prevent start_time = end_time for all classes (zero duration not allowed)
    CONSTRAINT chk_no_same_start_end_time CHECK (start_time != end_time),
    
    -- Additional validation: prevent invalid overnight class times
    CONSTRAINT chk_overnight_class_validity CHECK (
        CASE 
            WHEN is_overnight_class = TRUE THEN 
                start_time >= '18:00'::TIME AND end_time <= '08:00'::TIME  -- Overnight classes: start 6PM-11:59PM, end 12:00AM-8AM
            ELSE TRUE
        END
    ),
    
    -- Enhanced duration validation for both regular and overnight classes
    CONSTRAINT chk_minimum_class_duration CHECK (
        (is_overnight_class = FALSE AND EXTRACT(EPOCH FROM (end_time - start_time)) >= 1800) OR -- Regular: minimum 30 minutes
        (is_overnight_class = TRUE AND EXTRACT(EPOCH FROM (end_time - start_time + INTERVAL '1 day')) >= 1800) -- Overnight: minimum 30 minutes
    ),
    CONSTRAINT chk_maximum_class_duration CHECK (
        (is_overnight_class = FALSE AND EXTRACT(EPOCH FROM (end_time - start_time)) <= 14400) OR -- Regular: maximum 4 hours
        (is_overnight_class = TRUE AND EXTRACT(EPOCH FROM (end_time - start_time + INTERVAL '1 day')) <= 14400) -- Overnight: maximum 4 hours
    ),
    CONSTRAINT chk_valid_start_time CHECK (start_time >= '00:00' AND start_time <= '23:59'), -- Allow full day range
    CONSTRAINT chk_valid_end_time CHECK (end_time >= '00:00' AND end_time <= '23:59'), -- Allow full day range
    
    -- Prevent duplicate timetable entries
    CONSTRAINT uk_timetable_unique UNIQUE (course_id, day_of_week, start_time, end_time)
);

-- TABLE: student_course_selections
CREATE TABLE student_course_selections (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    grade VARCHAR(5), -- Store student grades
    completion_date DATE, -- Date when course was completed
    is_completed BOOLEAN DEFAULT FALSE, -- Completion status
    
    -- Foreign key constraints
    CONSTRAINT fk_selections_student 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_selections_course 
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Entity-level constraints
    CONSTRAINT uk_student_course UNIQUE (student_id, course_id)
);

-- ================================
-- PERFORMANCE INDEXES
-- ================================

-- Indexes for faster lookups and joins
CREATE INDEX idx_students_college_id ON students(college_id);
CREATE INDEX idx_courses_college_id ON courses(college_id);
CREATE INDEX idx_timetables_course_id ON timetables(course_id);
CREATE INDEX idx_timetables_schedule ON timetables(day_of_week, start_time, end_time);
CREATE INDEX idx_selections_student_id ON student_course_selections(student_id);
CREATE INDEX idx_selections_course_id ON student_course_selections(course_id);

-- ================================
-- DATABASE-LEVEL CONSTRAINTS (Core Requirements)
-- ================================

-- Function to enforce same college constraint
CREATE OR REPLACE FUNCTION check_same_college_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if student and course belong to the same college
    IF (SELECT s.college_id FROM students s WHERE s.id = NEW.student_id) != 
       (SELECT c.college_id FROM courses c WHERE c.id = NEW.course_id) THEN
        RAISE EXCEPTION 'Student and course must belong to the same college';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent timetable conflicts
CREATE OR REPLACE FUNCTION check_timetable_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for timetable conflicts with existing active enrollments only
    IF EXISTS (
        SELECT 1 
        FROM student_course_selections scs
        JOIN timetables t1 ON scs.course_id = t1.course_id
        JOIN timetables t2 ON NEW.course_id = t2.course_id
        WHERE scs.student_id = NEW.student_id
          AND scs.is_completed = FALSE  -- Only check active enrollments
          AND t1.day_of_week = t2.day_of_week
          AND t1.start_time < t2.end_time
          AND t1.end_time > t2.start_time
    ) THEN
        RAISE EXCEPTION 'Timetable conflict detected: overlapping class times';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent timetable changes that affect enrolled students
CREATE OR REPLACE FUNCTION check_timetable_update_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent timetable updates if students are enrolled and it would cause conflicts
    IF EXISTS (
        SELECT 1 FROM student_course_selections scs 
        WHERE scs.course_id = NEW.course_id
    ) THEN
        -- Check if the new timetable would conflict with other enrolled courses
        IF EXISTS (
            SELECT 1 
            FROM student_course_selections scs1
            JOIN timetables t1 ON scs1.course_id = t1.course_id
            JOIN student_course_selections scs2 ON scs1.student_id = scs2.student_id
            WHERE scs2.course_id = NEW.course_id
              AND t1.course_id != NEW.course_id
              AND t1.day_of_week = NEW.day_of_week
              AND t1.start_time < NEW.end_time
              AND t1.end_time > NEW.start_time
        ) THEN
            RAISE EXCEPTION 'Cannot update timetable: would cause conflicts for enrolled students';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- TRIGGERS (Database-Level Enforcement)
-- ================================

-- Trigger to enforce same college constraint on enrollment
CREATE TRIGGER enforce_same_college_enrollment
    BEFORE INSERT ON student_course_selections
    FOR EACH ROW
    EXECUTE FUNCTION check_same_college_enrollment();

-- Trigger to prevent timetable conflicts during enrollment
CREATE TRIGGER prevent_timetable_conflicts
    BEFORE INSERT ON student_course_selections
    FOR EACH ROW
    EXECUTE FUNCTION check_timetable_conflicts();

-- Trigger to prevent timetable updates that would cause conflicts
CREATE TRIGGER prevent_timetable_update_conflicts
    BEFORE UPDATE ON timetables
    FOR EACH ROW
    EXECUTE FUNCTION check_timetable_update_conflicts();

-- ================================
-- ENHANCED EDGE CASE TABLES
-- ================================

-- TABLE: enrollment_configs (College-specific enrollment policies)
CREATE TABLE enrollment_configs (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL UNIQUE,
    max_credit_hours_per_semester INTEGER DEFAULT 18,
    max_study_hours_per_day INTEGER DEFAULT 8,
    min_break_time_between_classes INTEGER DEFAULT 15,
    max_courses_per_semester INTEGER DEFAULT 6,
    allow_overnight_classes BOOLEAN DEFAULT FALSE,
    allow_weekend_classes BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_enrollment_configs_college 
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    
    -- Entity-level constraints
    CONSTRAINT chk_max_credit_hours_valid CHECK (max_credit_hours_per_semester > 0 AND max_credit_hours_per_semester <= 30),
    CONSTRAINT chk_max_study_hours_valid CHECK (max_study_hours_per_day > 0 AND max_study_hours_per_day <= 16),
    CONSTRAINT chk_min_break_time_valid CHECK (min_break_time_between_classes >= 0 AND min_break_time_between_classes <= 60),
    CONSTRAINT chk_max_courses_valid CHECK (max_courses_per_semester > 0 AND max_courses_per_semester <= 10)
);

-- TABLE: course_prerequisites (Enhanced prerequisite relationships)
CREATE TABLE course_prerequisites (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    prerequisite_course_id INTEGER NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    minimum_grade VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_course_prerequisites_course 
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_prerequisites_prerequisite 
        FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Prevent self-referencing prerequisites
    CONSTRAINT chk_no_self_prerequisite CHECK (course_id != prerequisite_course_id),
    
    -- Unique constraint to prevent duplicate prerequisites
    CONSTRAINT uk_course_prerequisite UNIQUE (course_id, prerequisite_course_id)
);

-- ================================
-- ENHANCED FUNCTIONS
-- ================================

-- Function to update enrollment config timestamp
CREATE OR REPLACE FUNCTION update_enrollment_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate overnight class college policy
CREATE OR REPLACE FUNCTION validate_overnight_class_policy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_overnight_class = TRUE THEN
        -- Check if college allows overnight classes
        DECLARE
            college_allows_overnight BOOLEAN;
        BEGIN
            SELECT ec.allow_overnight_classes INTO college_allows_overnight
            FROM enrollment_configs ec
            JOIN courses c ON c.college_id = ec.college_id
            WHERE c.id = NEW.course_id;
            
            IF college_allows_overnight IS NOT NULL AND college_allows_overnight = FALSE THEN
                RAISE EXCEPTION 'Overnight classes are not allowed for this college';
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate course capacity
CREATE OR REPLACE FUNCTION check_course_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_enrollments INTEGER;
    course_capacity INTEGER;
BEGIN
    -- Get current enrollment count and max capacity
    SELECT COUNT(*), c.max_capacity INTO current_enrollments, course_capacity
    FROM student_course_selections scs
    JOIN courses c ON c.id = NEW.course_id
    WHERE scs.course_id = NEW.course_id
    GROUP BY c.max_capacity;
    
    -- If no enrollments exist yet, current_enrollments will be NULL
    IF current_enrollments IS NULL THEN
        current_enrollments := 0;
    END IF;
    
    -- Check capacity
    IF current_enrollments >= course_capacity THEN
        RAISE EXCEPTION 'Course is at full capacity (% students)', course_capacity;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- ENHANCED TRIGGERS
-- ================================

-- Trigger for enrollment config timestamp updates
CREATE TRIGGER trigger_update_enrollment_config_timestamp
    BEFORE UPDATE ON enrollment_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_config_timestamp();

-- Trigger for overnight class policy validation
CREATE TRIGGER trigger_validate_overnight_class_policy
    BEFORE INSERT OR UPDATE ON timetables
    FOR EACH ROW
    EXECUTE FUNCTION validate_overnight_class_policy();

-- Trigger for course capacity enforcement
CREATE TRIGGER trigger_check_course_capacity
    BEFORE INSERT ON student_course_selections
    FOR EACH ROW
    EXECUTE FUNCTION check_course_capacity();

-- ================================
-- ENHANCED INDEXES FOR PERFORMANCE
-- ================================

-- Indexes for new tables
CREATE INDEX idx_enrollment_configs_college_id ON enrollment_configs(college_id);
CREATE INDEX idx_course_prerequisites_course_id ON course_prerequisites(course_id);
CREATE INDEX idx_course_prerequisites_prerequisite_id ON course_prerequisites(prerequisite_course_id);

-- Indexes for enhanced features
CREATE INDEX idx_student_course_selections_completed ON student_course_selections(student_id, is_completed);
CREATE INDEX idx_timetables_overnight ON timetables(is_overnight_class, day_of_week);
CREATE INDEX idx_courses_prerequisites ON courses(prerequisites);