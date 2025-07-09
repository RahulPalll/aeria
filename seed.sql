-- Sample Data for Student Course Enrollment System
-- This file contains test data to demonstrate the system functionality

-- ================================
-- SAMPLE COLLEGES
-- ================================
INSERT INTO colleges (name, code, address) VALUES
('Massachusetts Institute of Technology', 'MIT', '77 Massachusetts Ave, Cambridge, MA 02139'),
('Stanford University', 'STAN', '450 Jane Stanford Way, Stanford, CA 94305'),
('University of California Berkeley', 'UCB', 'Berkeley, CA 94720');

-- ================================
-- SAMPLE STUDENTS
-- ================================
INSERT INTO students (name, email, "studentId", "collegeId") VALUES
('John Doe', 'john.doe@mit.edu', 'MIT001', 1),
('Jane Smith', 'jane.smith@mit.edu', 'MIT002', 1),
('Alice Johnson', 'alice.johnson@mit.edu', 'MIT003', 1),
('Bob Wilson', 'bob.wilson@stanford.edu', 'STAN001', 2),
('Carol Brown', 'carol.brown@stanford.edu', 'STAN002', 2),
('David Lee', 'david.lee@berkeley.edu', 'UCB001', 3);

-- ================================
-- SAMPLE COURSES
-- ================================
INSERT INTO courses (code, name, description, credits, "maxCapacity", prerequisites, "collegeId") VALUES
-- MIT Courses
('CS101', 'Introduction to Computer Science', 'Basic programming concepts and algorithms', 4, NULL, NULL, 1),
('CS102', 'Data Structures and Algorithms', 'Study of fundamental data structures and their applications', 4, NULL, NULL, 1),
('MATH101', 'Calculus I', 'Differential and integral calculus', 3, NULL, NULL, 1),
('PHYS101', 'Physics I', 'Classical mechanics and thermodynamics', 4, NULL, NULL, 1),
('ENG101', 'Technical Writing', 'Communication skills for engineers', 2, NULL, NULL, 1),

-- Stanford Courses
('CS201', 'Advanced Programming', 'Object-oriented programming and software design', 4, NULL, NULL, 2),
('CS202', 'Database Systems', 'Relational databases and SQL', 3, NULL, NULL, 2),
('MATH201', 'Linear Algebra', 'Vector spaces and matrix operations', 3, NULL, NULL, 2),
('STAT201', 'Statistics', 'Probability and statistical inference', 3, NULL, NULL, 2),

-- UC Berkeley Courses
('CS301', 'Machine Learning', 'Introduction to artificial intelligence and ML', 4, 30, NULL, 3),
('CS302', 'Computer Networks', 'Network protocols and distributed systems', 3, 25, NULL, 3),
('MATH301', 'Discrete Mathematics', 'Logic, sets, and combinatorics', 3, 35, NULL, 3),

-- Edge Case Courses for Testing
('CS999', 'Overnight Computing Lab', 'Special lab sessions crossing midnight', 2, 10, NULL, 1),
('STUDY101', 'Extended Study Session', 'Long study periods for intensive learning', 1, 20, NULL, 2),
('QUICK201', 'Micro Learning', 'Very short intensive sessions', 1, 15, NULL, 1),
('PREREQ301', 'Advanced Programming', 'Requires CS101 and CS102', 4, 25, '1,2', 1),
('MARATHON401', 'Intensive Bootcamp', 'Full-day intensive programming bootcamp', 6, 5, NULL, 1),
('NIGHT501', 'Night Research Lab', 'Overnight research sessions', 3, 8, NULL, 2),
('MICRO601', 'Quick Skills', 'Micro-learning sessions for specific skills', 1, 50, NULL, 3);

-- ================================
-- SAMPLE TIMETABLES
-- ================================
INSERT INTO timetables ("courseId", "dayOfWeek", "startTime", "endTime", "isOvernightClass", room) VALUES
-- MIT Course Schedules
(1, 'MONDAY', '09:00:00', '10:30:00', FALSE, 'Room 101'),      -- CS101
(1, 'WEDNESDAY', '09:00:00', '10:30:00', FALSE, 'Room 101'),   -- CS101
(2, 'TUESDAY', '11:00:00', '12:30:00', FALSE, 'Room 102'),     -- CS102
(2, 'THURSDAY', '11:00:00', '12:30:00', FALSE, 'Room 102'),    -- CS102
(3, 'MONDAY', '14:00:00', '15:30:00', FALSE, 'Room 201'),      -- MATH101
(3, 'FRIDAY', '14:00:00', '15:30:00', FALSE, 'Room 201'),      -- MATH101
(4, 'TUESDAY', '14:00:00', '16:00:00', FALSE, 'Lab A'),        -- PHYS101
(4, 'THURSDAY', '14:00:00', '16:00:00', FALSE, 'Lab A'),       -- PHYS101
(5, 'FRIDAY', '10:00:00', '11:30:00', FALSE, 'Room 301'),      -- ENG101

-- Stanford Course Schedules
(6, 'MONDAY', '10:00:00', '11:30:00', FALSE, 'Room S101'),     -- CS201
(6, 'WEDNESDAY', '10:00:00', '11:30:00', FALSE, 'Room S101'),  -- CS201
(7, 'TUESDAY', '09:00:00', '10:30:00', FALSE, 'Room S102'),    -- CS202
(7, 'THURSDAY', '09:00:00', '10:30:00', FALSE, 'Room S102'),   -- CS202
(8, 'MONDAY', '13:00:00', '14:30:00', FALSE, 'Room S201'),     -- MATH201
(9, 'WEDNESDAY', '13:00:00', '14:30:00', FALSE, 'Room S202'),  -- STAT201

-- UC Berkeley Course Schedules
(10, 'TUESDAY', '15:00:00', '17:00:00', FALSE, 'Room B101'),   -- CS301
(10, 'THURSDAY', '15:00:00', '17:00:00', FALSE, 'Room B101'),  -- CS301
(11, 'MONDAY', '11:00:00', '12:30:00', FALSE, 'Room B102'),    -- CS302
(11, 'FRIDAY', '11:00:00', '12:30:00', FALSE, 'Room B102'),    -- CS302
(12, 'WEDNESDAY', '09:00:00', '10:30:00', FALSE, 'Room B201'); -- MATH301

-- ================================
-- SAMPLE ENROLLMENTS
-- ================================
INSERT INTO student_course_selections ("studentId", "courseId", status) VALUES
-- MIT Students
(1, 1, 'ENROLLED'),  -- John Doe -> CS101
(1, 3, 'ENROLLED'),  -- John Doe -> MATH101
(1, 5, 'ENROLLED'),  -- John Doe -> ENG101
(2, 1, 'ENROLLED'),  -- Jane Smith -> CS101
(2, 2, 'ENROLLED'),  -- Jane Smith -> CS102
(3, 4, 'ENROLLED'),  -- Alice Johnson -> PHYS101
(3, 5, 'ENROLLED'),  -- Alice Johnson -> ENG101

-- Stanford Students
(4, 6, 'ENROLLED'),  -- Bob Wilson -> CS201
(4, 8, 'ENROLLED'),  -- Bob Wilson -> MATH201
(5, 7, 'ENROLLED'),  -- Carol Brown -> CS202
(5, 9, 'ENROLLED'),  -- Carol Brown -> STAT201

-- UC Berkeley Students
(6, 10, 'ENROLLED'), -- David Lee -> CS301
(6, 12, 'ENROLLED'); -- David Lee -> MATH301

-- ================================
-- ENROLLMENT CONFIGURATIONS
-- ================================
INSERT INTO enrollment_configs ("collegeId", "maxCreditHoursPerSemester", "maxStudyHoursPerDay", "minBreakTimeBetweenClasses", "maxCoursesPerSemester", "allowOvernightClasses") VALUES
(1, 18, 8, 15, 6, TRUE),   -- MIT allows overnight classes
(2, 16, 7, 20, 5, FALSE),  -- Stanford stricter limits, no overnight
(3, 20, 9, 10, 7, FALSE);  -- UC Berkeley more flexible but no overnight

-- ================================
-- ADDITIONAL TIMETABLES FOR EDGE CASE TESTING
-- ================================
INSERT INTO timetables ("courseId", "dayOfWeek", "startTime", "endTime", "isOvernightClass", room) VALUES
-- Timetables for new edge case courses
(13, 'FRIDAY', '23:00:00', '01:00:00', TRUE, 'CS Lab 999'),    -- CS999 Overnight Lab
(14, 'SATURDAY', '22:30:00', '02:30:00', TRUE, 'Study Hall'),  -- STUDY101 Extended Session
(15, 'MONDAY', '10:30:00', '10:35:00', FALSE, 'Quick Room'),   -- QUICK201 Micro class
(16, 'MONDAY', '10:35:00', '12:00:00', FALSE, 'Next Room'),    -- PREREQ301 Right after (buffer test)
(16, 'WEDNESDAY', '14:00:00', '16:00:00', FALSE, 'Advanced Lab'), -- PREREQ301 Second session

-- Additional edge cases for comprehensive testing
(17, 'MONDAY', '08:00:00', '17:00:00', FALSE, 'Marathon Room'), -- MARATHON401 9-hour intensive class
(17, 'TUESDAY', '08:00:00', '17:00:00', FALSE, 'Marathon Room'), -- MARATHON401 Another 9-hour day
(18, 'SUNDAY', '23:30:00', '03:30:00', TRUE, 'Night Lab'),     -- NIGHT501 Sunday overnight extending to Monday
(19, 'FRIDAY', '18:00:00', '18:05:00', FALSE, 'Mini Room');    -- MICRO601 Very short 5-minute class