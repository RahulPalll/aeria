-- Enhanced Sample Data for Student Course Enrollment System
-- Comprehensive test data for all edge cases

-- ================================
-- SAMPLE COLLEGES
-- ================================
INSERT INTO colleges (name, code, address) VALUES 
('Massachusetts Institute of Technology', 'MIT', '77 Massachusetts Avenue, Cambridge, MA 02139'),
('Stanford University', 'STF', '450 Serra Mall, Stanford, CA 94305'),
('University of California Berkeley', 'UCB', 'Berkeley, CA 94720'),
('Harvard University', 'HRV', 'Cambridge, MA 02138'),
('California Institute of Technology', 'CIT', '1200 E California Blvd, Pasadena, CA 91125');

-- ================================
-- ENROLLMENT CONFIGURATIONS (College-Specific Policies)
-- ================================
INSERT INTO enrollment_configs (college_id, max_credit_hours_per_semester, max_study_hours_per_day, min_break_time_between_classes, max_courses_per_semester, allow_overnight_classes, allow_weekend_classes) VALUES 
(1, 18, 8, 15, 6, TRUE, TRUE),   -- MIT: Allows overnight classes
(2, 16, 7, 15, 6, FALSE, TRUE),  -- Stanford: No overnight classes, stricter limits
(3, 20, 9, 10, 7, FALSE, TRUE),  -- UC Berkeley: Higher credit hours, no overnight
(4, 16, 8, 20, 5, TRUE, FALSE),  -- Harvard: Overnight allowed, no weekends
(5, 18, 8, 15, 6, TRUE, TRUE);   -- Caltech: Research-friendly policies

-- ================================
-- SAMPLE STUDENTS
-- ================================
INSERT INTO students (student_id, name, email, college_id) VALUES 
-- MIT Students
('MIT001', 'John Smith', 'john.smith@mit.edu', 1),
('MIT002', 'Jane Doe', 'jane.doe@mit.edu', 1),
('MIT003', 'Alex Chen', 'alex.chen@mit.edu', 1),

-- Stanford Students  
('STF001', 'Bob Johnson', 'bob.johnson@stanford.edu', 2),
('STF002', 'Alice Brown', 'alice.brown@stanford.edu', 2),
('STF003', 'Sarah Davis', 'sarah.davis@stanford.edu', 2),

-- UC Berkeley Students
('UCB001', 'Charlie Wilson', 'charlie.wilson@berkeley.edu', 3),
('UCB002', 'Emma Garcia', 'emma.garcia@berkeley.edu', 3),

-- Harvard Students
('HRV001', 'David Lee', 'david.lee@harvard.edu', 4),
('HRV002', 'Lisa Wang', 'lisa.wang@harvard.edu', 4),

-- Caltech Students
('CIT001', 'Mike Torres', 'mike.torres@caltech.edu', 5),
('CIT002', 'Nina Patel', 'nina.patel@caltech.edu', 5);

-- ================================
-- SAMPLE COURSES (Enhanced with Prerequisites and Descriptions)
-- ================================
INSERT INTO courses (code, name, credits, college_id, max_capacity, prerequisites, description) VALUES 
-- MIT Courses
('CS101', 'Introduction to Computer Science', 3, 1, 30, NULL, 'Fundamental concepts of computer science and programming'),
('CS102', 'Data Structures and Algorithms', 4, 1, 25, '1', 'Advanced programming with focus on data structures'),
('CS201', 'Software Engineering', 4, 1, 20, '1,2', 'Software development methodologies and project management'),
('MA201', 'Linear Algebra', 3, 1, 35, NULL, 'Vector spaces, matrices, and linear transformations'),
('PH101', 'Physics I', 4, 1, 30, NULL, 'Classical mechanics and thermodynamics'),
('CS301', 'Artificial Intelligence', 4, 1, 15, '1,2', 'Machine learning and AI algorithms'),

-- Stanford Courses
('CS106', 'Programming Methodology', 3, 2, 25, NULL, 'Object-oriented programming principles'),
('CS107', 'Computer Organization', 4, 2, 20, '6', 'Computer systems and assembly language'),
('MA103', 'Calculus', 4, 2, 40, NULL, 'Differential and integral calculus'),
('EN101', 'English Composition', 3, 2, 20, NULL, 'Academic writing and communication skills'),
('CS205', 'Database Systems', 3, 2, 18, '6,7', 'Database design and management'),

-- UC Berkeley Courses
('CS161', 'Computer Security', 3, 3, 25, NULL, 'Cybersecurity principles and practices'),
('CS162', 'Operating Systems', 4, 3, 20, '11', 'System programming and OS concepts'),
('MA110', 'Discrete Mathematics', 3, 3, 30, NULL, 'Logic, sets, and combinatorics'),
('CS270', 'Machine Learning', 4, 3, 15, '11,13', 'Statistical learning and pattern recognition'),

-- Harvard Courses  
('CS150', 'Introduction to Programming', 3, 4, 25, NULL, 'Programming fundamentals'),
('PH150', 'Quantum Physics', 4, 4, 15, NULL, 'Quantum mechanics principles'),
('MA150', 'Advanced Calculus', 4, 4, 20, NULL, 'Multivariable calculus and analysis'),

-- Caltech Courses
('CS180', 'Computational Biology', 4, 5, 12, NULL, 'Bioinformatics and computational methods'),
('PH180', 'Astrophysics', 4, 5, 15, NULL, 'Stellar evolution and cosmology'),
('MA180', 'Mathematical Methods', 3, 5, 18, NULL, 'Advanced mathematical techniques for physics');

-- ================================
-- COURSE PREREQUISITES (Enhanced Relationships)
-- ================================
INSERT INTO course_prerequisites (course_id, prerequisite_course_id, is_mandatory, minimum_grade) VALUES 
-- MIT Prerequisites
(2, 1, TRUE, 'C'),   -- CS102 requires CS101 with grade C+
(3, 1, TRUE, 'B'),   -- CS201 requires CS101 with grade B+
(3, 2, TRUE, 'C'),   -- CS201 requires CS102 with grade C+  
(6, 1, TRUE, 'B'),   -- CS301 requires CS101 with grade B+
(6, 2, TRUE, 'B'),   -- CS301 requires CS102 with grade B+

-- Stanford Prerequisites
(7, 6, TRUE, 'C'),   -- CS107 requires CS106 with grade C+
(11, 6, TRUE, 'C'),  -- CS205 requires CS106 with grade C+
(11, 7, FALSE, 'B'), -- CS205 recommends CS107 with grade B+

-- UC Berkeley Prerequisites  
(12, 11, TRUE, 'C'), -- CS162 requires CS161 with grade C+
(14, 11, TRUE, 'B'), -- CS270 requires CS161 with grade B+
(14, 13, TRUE, 'B'); -- CS270 requires MA110 with grade B+

-- ================================
-- SAMPLE TIMETABLES (Comprehensive Edge Cases)
-- ================================
INSERT INTO timetables (course_id, day_of_week, start_time, end_time, is_overnight_class, room) VALUES 
-- MIT Course Timetables (Regular Classes)
(1, 'MONDAY', '09:00', '10:30', FALSE, 'MIT-101'),    -- CS101
(1, 'WEDNESDAY', '09:00', '10:30', FALSE, 'MIT-101'),
(2, 'TUESDAY', '11:00', '12:30', FALSE, 'MIT-201'),   -- CS102
(2, 'THURSDAY', '11:00', '12:30', FALSE, 'MIT-201'),
(3, 'MONDAY', '14:00', '16:00', FALSE, 'MIT-301'),    -- CS201 (2-hour class)
(3, 'WEDNESDAY', '14:00', '16:00', FALSE, 'MIT-301'),
(4, 'MONDAY', '10:00', '11:30', FALSE, 'MIT-401'),    -- MA201
(4, 'FRIDAY', '14:00', '15:30', FALSE, 'MIT-401'),
(5, 'TUESDAY', '09:00', '10:30', FALSE, 'MIT-501'),   -- PH101
(5, 'THURSDAY', '09:00', '10:30', FALSE, 'MIT-501'),

-- MIT Overnight Classes (Edge Case Testing) - Fixed duration to comply with constraints
(6, 'FRIDAY', '22:00', '01:00', TRUE, 'MIT-Lab1'),    -- CS301 AI Lab (overnight, 3 hours)
(6, 'SATURDAY', '22:00', '01:00', TRUE, 'MIT-Lab1'),  

-- Stanford Course Timetables (No Overnight - College Policy)
(7, 'MONDAY', '10:00', '11:30', FALSE, 'STF-A101'),   -- CS106
(7, 'WEDNESDAY', '10:00', '11:30', FALSE, 'STF-A101'),
(8, 'TUESDAY', '13:00', '14:30', FALSE, 'STF-B201'),  -- CS107  
(8, 'THURSDAY', '13:00', '14:30', FALSE, 'STF-B201'),
(9, 'MONDAY', '08:00', '09:30', FALSE, 'STF-C301'),   -- MA103
(9, 'WEDNESDAY', '08:00', '09:30', FALSE, 'STF-C301'),
(10, 'TUESDAY', '10:00', '11:30', FALSE, 'STF-D401'), -- EN101
(10, 'THURSDAY', '10:00', '11:30', FALSE, 'STF-D401'),
(11, 'FRIDAY', '13:00', '15:00', FALSE, 'STF-E501'),  -- CS205 (2-hour session)

-- Buffer Time Violation Test Cases (removed - use for testing violations via API)

-- UC Berkeley Course Timetables
(12, 'MONDAY', '09:00', '10:30', FALSE, 'UCB-G201'),  -- CS161 (correct schedule)
(12, 'WEDNESDAY', '09:00', '10:30', FALSE, 'UCB-G201'),
(13, 'TUESDAY', '14:00', '15:30', FALSE, 'UCB-H301'), -- CS162
(13, 'THURSDAY', '14:00', '15:30', FALSE, 'UCB-H301'),
(14, 'FRIDAY', '09:00', '10:30', FALSE, 'UCB-I401'),  -- MA110
(15, 'MONDAY', '16:00', '18:00', FALSE, 'UCB-J501'),  -- CS270 (2-hour advanced class)
(15, 'WEDNESDAY', '16:00', '18:00', FALSE, 'UCB-J501'),

-- Harvard Course Timetables (Overnight Allowed, No Weekends) - Fixed duration
(16, 'MONDAY', '11:00', '12:30', FALSE, 'HRV-K101'),  -- CS150
(16, 'WEDNESDAY', '11:00', '12:30', FALSE, 'HRV-K101'),
(17, 'TUESDAY', '14:00', '17:00', FALSE, 'HRV-L201'), -- PH150 (3-hour lab)
(17, 'THURSDAY', '23:00', '02:00', TRUE, 'HRV-L201'), -- PH150 Overnight observation (3 hours)
(18, 'MONDAY', '09:00', '10:30', FALSE, 'HRV-M301'),  -- MA150
(18, 'FRIDAY', '09:00', '10:30', FALSE, 'HRV-M301'),

-- Caltech Course Timetables (Research-Focused with Long Sessions) - Fixed durations
(19, 'TUESDAY', '10:00', '13:00', FALSE, 'CIT-N101'), -- CS180 (3-hour research session)
(19, 'THURSDAY', '19:00', '23:00', FALSE, 'CIT-N101'), -- CS180 Evening session (4 hours)
(20, 'MONDAY', '20:00', '23:30', FALSE, 'CIT-O201'),  -- PH180 Late evening observation (3.5 hours)
(20, 'WEDNESDAY', '22:30', '02:30', TRUE, 'CIT-O201'), -- PH180 Overnight observation (4 hours)
(21, 'FRIDAY', '13:00', '16:00', FALSE, 'CIT-P301');  -- MA180 (3-hour intensive)

-- ================================
-- SAMPLE ENROLLMENTS WITH EDGE CASES
-- ================================
INSERT INTO student_course_selections (student_id, course_id, grade, completion_date, is_completed) VALUES 
-- MIT Students with Completed Courses (for prerequisite testing)
(1, 1, 'A', '2024-12-15', TRUE),  -- John completed CS101 with A
(1, 4, 'B+', '2024-12-15', TRUE), -- John completed MA201 with B+
(2, 1, 'B', '2024-12-15', TRUE),  -- Jane completed CS101 with B

-- Active Enrollments (Non-conflicting)
(1, 2, NULL, NULL, FALSE),        -- John enrolled in CS102 (has prerequisite)
(2, 2, NULL, NULL, FALSE),        -- Jane enrolled in CS102 (has prerequisite)
(3, 1, NULL, NULL, FALSE),        -- Alex enrolled in CS101

-- Stanford Students  
(4, 7, NULL, NULL, FALSE),        -- Bob enrolled in CS106
(5, 10, NULL, NULL, FALSE),       -- Alice enrolled in EN101

-- UC Berkeley Students - Fixed to use correct course IDs
(7, 12, NULL, NULL, FALSE),       -- Charlie enrolled in CS161 (course_id 12)
(8, 14, NULL, NULL, FALSE),       -- Emma enrolled in MA110 (course_id 14)

-- Harvard Students - Fixed to use correct course IDs  
(9, 16, NULL, NULL, FALSE),       -- David enrolled in CS150 (course_id 16)

-- Caltech Students - Fixed to use correct course IDs
(11, 19, NULL, NULL, FALSE);      -- Mike enrolled in CS180 (course_id 19)
-- ================================
-- EDGE CASE TEST SCENARIOS DOCUMENTATION
-- ================================

-- This seed data includes the following edge case test scenarios:

-- 1. OVERNIGHT CLASSES (Fixed durations to comply with constraints):
--    - MIT CS301 AI Lab: Friday/Saturday 22:00-01:00 (3 hours, allowed by policy)
--    - Harvard PH150: Thursday 23:00-02:00 overnight observation (3 hours)
--    - Caltech PH180: Wednesday 22:30-02:30 overnight research (4 hours)

-- 2. PREREQUISITES VALIDATION:
--    - CS102 requires CS101 with grade C+ (John ✅, Jane ✅, Alex ❌)
--    - CS201 requires CS101 AND CS102 with grades B+ and C+
--    - CS301 requires CS101 AND CS102 with grade B+

-- 3. COLLEGE POLICY DIFFERENCES:
--    - MIT: Allows overnight, 18 credit hrs, 8 study hrs/day
--    - Stanford: No overnight, 16 credit hrs, 7 study hrs/day  
--    - UC Berkeley: No overnight, 20 credit hrs, 9 study hrs/day
--    - Harvard: Overnight allowed, no weekends, 16 credit hrs
--    - Caltech: Research-friendly, overnight allowed

-- 4. CAPACITY LIMITS:
--    - CS301 (MIT): Only 15 seats available
--    - CS180 (Caltech): Only 12 seats available
--    - CS270 (UC Berkeley): Only 15 seats available

-- 5. BUFFER TIME VIOLATIONS:
--    - Test case: Try enrolling in back-to-back classes with <15 min gap

-- 6. DAILY STUDY HOUR LIMITS:
--    - Test case: CS180 + PH180 at Caltech = 7 hours/day
--    - CS301 overnight + regular classes could exceed 8 hrs/day

-- 7. CREDIT HOUR LIMITS:
--    - Stanford students limited to 16 credit hours per semester
--    - Test by enrolling in multiple 4-credit courses

-- 8. CROSS-DAY CONFLICTS:
--    - Friday overnight classes ending Saturday vs Saturday morning classes
--    - Test CS301 (Fri 22:00-Sat 02:00) vs any Saturday morning class

-- Valid enrollment example:
-- Student MIT001 can enroll in CS101 and MA201 (different time slots)

-- Invalid enrollment examples (these will be caught by triggers):

-- 1. Cross-college enrollment (should fail):
-- INSERT INTO student_course_selections (student_id, course_id) VALUES (1, 5); -- MIT student trying to enroll in Stanford course

-- 2. Timetable conflict (should fail):
-- First enroll in CS101 (Monday 9:00-10:30)
-- INSERT INTO student_course_selections (student_id, course_id) VALUES (1, 1);
-- Then try to enroll in a conflicting course:
-- INSERT INTO student_course_selections (student_id, course_id) VALUES (1, 4); -- PH101 also on Monday 9:00-10:30
