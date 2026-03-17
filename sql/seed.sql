BEGIN;

INSERT INTO department (department_id, department_name) VALUES
    (1, 'Computer Science and Engineering'),
    (2, 'Electrical Engineering')
ON CONFLICT (department_id) DO NOTHING;

INSERT INTO program (program_id, department_id, degree, branch, duration_years) VALUES
    (1, 1, 'B.Tech', 'Computer Science and Engineering', 4),
    (2, 2, 'B.Tech', 'Electrical Engineering', 4)
ON CONFLICT (program_id) DO NOTHING;

INSERT INTO grade_scale (grade_letter, grade_point) VALUES
    ('A+', 10.00),
    ('A', 9.00),
    ('B+', 8.00),
    ('B', 7.00),
    ('C', 6.00),
    ('D', 5.00),
    ('F', 0.00)
ON CONFLICT (grade_letter) DO NOTHING;

INSERT INTO app_user (user_id, name, email, phone, dob, gender, password, user_type) VALUES
    (1, 'Aarav Admin', 'admin@sums.edu', '9990000001', '1985-05-14', 'Male', crypt('Admin@123', gen_salt('bf')), 'ADMIN'),
    (2, 'Farah Faculty', 'faculty@sums.edu', '9990000002', '1988-08-09', 'Female', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
    (3, 'Sia Student', 'student@sums.edu', '9990000003', '2004-02-18', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO admin_user (user_id, admin_code, role_title) VALUES
    (1, 'ADM-001', 'Registrar')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO faculty (user_id, department_id, employee_code, designation) VALUES
    (2, 1, 'FAC-001', 'Associate Professor')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student (user_id, program_id, roll_number, admission_year, current_semester) VALUES
    (3, 1, 'CSE2023001', 2023, 2)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO course (course_id, course_name, credits, category, min_attendance_req, program_id, semester_no) VALUES
    ('CS101', 'Programming Fundamentals', 4.0, 'Core', 75.00, 1, 1),
    ('CS201', 'Data Structures', 4.0, 'Core', 75.00, 1, 2),
    ('CS202', 'Database Systems', 4.0, 'Core', 75.00, 1, 2)
ON CONFLICT (course_id) DO NOTHING;

INSERT INTO prerequisite (course_id, prereq_id, min_grade_req) VALUES
    ('CS201', 'CS101', 'C'),
    ('CS202', 'CS101', 'C')
ON CONFLICT (course_id, prereq_id) DO NOTHING;

INSERT INTO course_offering (offering_id, course_id, academic_year, section) VALUES
    (1, 'CS101', '2024-2025', 'A'),
    (2, 'CS201', '2025-2026', 'A'),
    (3, 'CS202', '2025-2026', 'A')
ON CONFLICT (offering_id) DO NOTHING;

INSERT INTO teaches (faculty_id, offering_id) VALUES
    (2, 2),
    (2, 3)
ON CONFLICT (faculty_id, offering_id) DO NOTHING;

INSERT INTO enrollment (enrollment_id, student_id, offering_id, enrollment_type, attempt_no, academic_year, semester_no) VALUES
    (1, 3, 1, 'Credit', 1, '2024-2025', 1),
    (2, 3, 2, 'Credit', 1, '2025-2026', 2)
ON CONFLICT (enrollment_id) DO NOTHING;

INSERT INTO assessment_component (component_id, offering_id, type, weightage, max_marks) VALUES
    (1, 2, 'Midsem', 30.00, 30.00),
    (2, 2, 'Endsem', 50.00, 50.00),
    (3, 2, 'Quiz', 20.00, 20.00),
    (4, 3, 'Lab', 40.00, 40.00),
    (5, 3, 'Endsem', 60.00, 60.00)
ON CONFLICT (component_id) DO NOTHING;

INSERT INTO student_marks (enrollment_id, component_id, marks_obtained, weighted_marks) VALUES
    (2, 1, 24.00, 24.00),
    (2, 2, 40.00, 40.00),
    (2, 3, 16.00, 16.00)
ON CONFLICT (enrollment_id, component_id) DO NOTHING;

INSERT INTO grade (enrollment_id, grade_letter, is_counted_for_cpi) VALUES
    (1, 'A', TRUE)
ON CONFLICT (enrollment_id) DO NOTHING;

INSERT INTO semester_result (student_id, academic_year, semester_no, spi, credits_earned_sem) VALUES
    (3, '2024-2025', 1, 9.00, 4.00)
ON CONFLICT (student_id, academic_year, semester_no) DO NOTHING;

INSERT INTO company (company_id, company_name, contact, email, industry_type) VALUES
    (1, 'DataPulse Systems', 'Ritika Sharma', 'campus@datapulse.com', 'Software'),
    (2, 'VoltEdge Labs', 'Karan Patel', 'talent@voltedge.ai', 'Analytics')
ON CONFLICT (company_id) DO NOTHING;

INSERT INTO placement_offer (offer_id, company_id, role_name, package_ctc, offer_type, location, eligible_min_cpi, application_deadline) VALUES
    (1, 1, 'Software Engineer Intern', 8.50, 'Internship', 'Bengaluru', 7.50, CURRENT_DATE + INTERVAL '30 days'),
    (2, 2, 'Data Analyst', 14.00, 'Full Time', 'Pune', 8.00, CURRENT_DATE + INTERVAL '20 days')
ON CONFLICT (offer_id) DO NOTHING;

INSERT INTO application (application_id, student_id, offer_id, status) VALUES
    (1, 3, 1, 'Applied')
ON CONFLICT (application_id) DO NOTHING;

SELECT setval('app_user_user_id_seq', COALESCE((SELECT MAX(user_id) FROM app_user), 1), true);
SELECT setval('course_offering_offering_id_seq', COALESCE((SELECT MAX(offering_id) FROM course_offering), 1), true);
SELECT setval('enrollment_enrollment_id_seq', COALESCE((SELECT MAX(enrollment_id) FROM enrollment), 1), true);
SELECT setval('assessment_component_component_id_seq', COALESCE((SELECT MAX(component_id) FROM assessment_component), 1), true);
SELECT setval('company_company_id_seq', COALESCE((SELECT MAX(company_id) FROM company), 1), true);
SELECT setval('placement_offer_offer_id_seq', COALESCE((SELECT MAX(offer_id) FROM placement_offer), 1), true);
SELECT setval('application_application_id_seq', COALESCE((SELECT MAX(application_id) FROM application), 1), true);

INSERT INTO app_user (name, email, phone, dob, gender, password, user_type) VALUES
        ('Rahul Mehta', 'rahul.mehta@sums.edu', '9990000010', '1982-03-10', 'Male', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
        ('Neha Kapoor', 'neha.kapoor@sums.edu', '9990000011', '1986-07-11', 'Female', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
        ('Arjun Sharma', '23bcs002@sums.edu', '9990000012', '2005-04-15', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
        ('Riya Patel', '23bcs003@sums.edu', '9990000013', '2005-09-02', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
        ('Karan Singh', '23bcs004@sums.edu', '9990000014', '2005-11-19', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
        ('Aditi Nair', '24bcs001@sums.edu', '9990000015', '2006-02-28', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
        ('Rohan Gupta', '24bcs002@sums.edu', '9990000016', '2006-05-12', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT')
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty (user_id, department_id, employee_code, designation)
SELECT user_id, 1, 'FAC-002', 'Assistant Professor'
FROM app_user
WHERE email = 'rahul.mehta@sums.edu'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO faculty (user_id, department_id, employee_code, designation)
SELECT user_id, 1, 'FAC-003', 'Assistant Professor'
FROM app_user
WHERE email = 'neha.kapoor@sums.edu'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student (user_id, program_id, roll_number, admission_year, current_semester)
SELECT user_id, 1, 'CSE2023002', 2023, 2
FROM app_user
WHERE email = '23bcs002@sums.edu'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student (user_id, program_id, roll_number, admission_year, current_semester)
SELECT user_id, 1, 'CSE2023003', 2023, 2
FROM app_user
WHERE email = '23bcs003@sums.edu'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student (user_id, program_id, roll_number, admission_year, current_semester)
SELECT user_id, 1, 'CSE2023004', 2023, 2
FROM app_user
WHERE email = '23bcs004@sums.edu'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student (user_id, program_id, roll_number, admission_year, current_semester)
SELECT user_id, 1, 'CSE2024001', 2024, 1
FROM app_user
WHERE email = '24bcs001@sums.edu'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student (user_id, program_id, roll_number, admission_year, current_semester)
SELECT user_id, 1, 'CSE2024002', 2024, 1
FROM app_user
WHERE email = '24bcs002@sums.edu'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO course (course_id, course_name, credits, category, min_attendance_req, program_id, semester_no) VALUES
        ('CS301', 'Operating Systems', 4.0, 'Core', 75.00, 1, 3),
        ('CS302', 'Computer Networks', 4.0, 'Core', 75.00, 1, 3),
        ('CS303', 'Artificial Intelligence', 4.0, 'Elective', 75.00, 1, 5)
ON CONFLICT (course_id) DO NOTHING;

INSERT INTO course_offering (course_id, academic_year, section) VALUES
        ('CS301', '2025-2026', 'A'),
        ('CS302', '2025-2026', 'A'),
        ('CS303', '2025-2026', 'A')
ON CONFLICT (course_id, academic_year, section) DO NOTHING;

INSERT INTO teaches (faculty_id, offering_id)
SELECT f.user_id, co.offering_id
FROM faculty f
JOIN course_offering co ON co.course_id = 'CS301' AND co.academic_year = '2025-2026' AND co.section = 'A'
WHERE f.employee_code = 'FAC-002'
ON CONFLICT (faculty_id, offering_id) DO NOTHING;

INSERT INTO teaches (faculty_id, offering_id)
SELECT f.user_id, co.offering_id
FROM faculty f
JOIN course_offering co ON co.course_id = 'CS302' AND co.academic_year = '2025-2026' AND co.section = 'A'
WHERE f.employee_code = 'FAC-003'
ON CONFLICT (faculty_id, offering_id) DO NOTHING;

INSERT INTO teaches (faculty_id, offering_id)
SELECT f.user_id, co.offering_id
FROM faculty f
JOIN course_offering co ON co.course_id = 'CS303' AND co.academic_year = '2025-2026' AND co.section = 'A'
WHERE f.employee_code = 'FAC-002'
ON CONFLICT (faculty_id, offering_id) DO NOTHING;

INSERT INTO enrollment (student_id, offering_id, enrollment_type, attempt_no, academic_year, semester_no)
SELECT s.user_id, co.offering_id, 'Credit', 1, co.academic_year, c.semester_no
FROM student s
JOIN course_offering co ON co.course_id = 'CS301' AND co.academic_year = '2025-2026' AND co.section = 'A'
JOIN course c ON c.course_id = co.course_id
WHERE s.admission_year = 2023
ON CONFLICT (student_id, offering_id) DO NOTHING;

INSERT INTO assessment_component (offering_id, type, weightage, max_marks)
SELECT offering_id, 'Midsem', 30, 30
FROM course_offering
WHERE course_id = 'CS301' AND academic_year = '2025-2026' AND section = 'A'
ON CONFLICT (offering_id, type) DO NOTHING;

INSERT INTO assessment_component (offering_id, type, weightage, max_marks)
SELECT offering_id, 'Endsem', 50, 50
FROM course_offering
WHERE course_id = 'CS301' AND academic_year = '2025-2026' AND section = 'A'
ON CONFLICT (offering_id, type) DO NOTHING;

INSERT INTO assessment_component (offering_id, type, weightage, max_marks)
SELECT offering_id, 'Assignment', 20, 20
FROM course_offering
WHERE course_id = 'CS301' AND academic_year = '2025-2026' AND section = 'A'
ON CONFLICT (offering_id, type) DO NOTHING;

INSERT INTO student_marks (enrollment_id, component_id, marks_obtained, weighted_marks)
SELECT e.enrollment_id, ac.component_id, 26.00, 26.00
FROM enrollment e
JOIN course_offering co ON co.offering_id = e.offering_id
JOIN student s ON s.user_id = e.student_id
JOIN app_user u ON u.user_id = s.user_id
JOIN assessment_component ac ON ac.offering_id = co.offering_id AND ac.type = 'Midsem'
WHERE u.email = '23bcs002@sums.edu'
    AND co.course_id = 'CS301'
    AND co.academic_year = '2025-2026'
ON CONFLICT (enrollment_id, component_id) DO NOTHING;

INSERT INTO student_marks (enrollment_id, component_id, marks_obtained, weighted_marks)
SELECT e.enrollment_id, ac.component_id, 42.00, 42.00
FROM enrollment e
JOIN course_offering co ON co.offering_id = e.offering_id
JOIN student s ON s.user_id = e.student_id
JOIN app_user u ON u.user_id = s.user_id
JOIN assessment_component ac ON ac.offering_id = co.offering_id AND ac.type = 'Endsem'
WHERE u.email = '23bcs002@sums.edu'
    AND co.course_id = 'CS301'
    AND co.academic_year = '2025-2026'
ON CONFLICT (enrollment_id, component_id) DO NOTHING;

INSERT INTO student_marks (enrollment_id, component_id, marks_obtained, weighted_marks)
SELECT e.enrollment_id, ac.component_id, 18.00, 18.00
FROM enrollment e
JOIN course_offering co ON co.offering_id = e.offering_id
JOIN student s ON s.user_id = e.student_id
JOIN app_user u ON u.user_id = s.user_id
JOIN assessment_component ac ON ac.offering_id = co.offering_id AND ac.type = 'Assignment'
WHERE u.email = '23bcs002@sums.edu'
    AND co.course_id = 'CS301'
    AND co.academic_year = '2025-2026'
ON CONFLICT (enrollment_id, component_id) DO NOTHING;

INSERT INTO company (company_name, contact, email, industry_type) VALUES
        ('Infosys', 'Aman Verma', 'campus@infosys.com', 'IT Services'),
        ('TCS', 'Pooja Shah', 'careers@tcs.com', 'IT Services'),
        ('Flipkart', 'Rahul Arora', 'jobs@flipkart.com', 'E-Commerce'),
        ('Zoho', 'Nandini Rao', 'hiring@zoho.com', 'SaaS')
ON CONFLICT (company_name) DO NOTHING;

INSERT INTO placement_offer (company_id, role_name, package_ctc, offer_type, location, eligible_min_cpi, application_deadline)
SELECT c.company_id, x.role_name, x.package_ctc, x.offer_type, x.location, x.eligible_min_cpi, x.application_deadline
FROM (
        VALUES
            ('Flipkart', 'Backend Developer', 12.00::numeric, 'Full Time', 'Bangalore', 7.00::numeric, CURRENT_DATE + INTERVAL '25 days'),
            ('TCS', 'Software Engineer', 9.00::numeric, 'Full Time', 'Hyderabad', 6.50::numeric, CURRENT_DATE + INTERVAL '30 days'),
            ('Infosys', 'Data Scientist Intern', 10.00::numeric, 'Internship', 'Delhi', 8.00::numeric, CURRENT_DATE + INTERVAL '15 days'),
            ('Zoho', 'Platform Engineer', 11.00::numeric, 'Full Time', 'Chennai', 7.20::numeric, CURRENT_DATE + INTERVAL '28 days')
) AS x(company_name, role_name, package_ctc, offer_type, location, eligible_min_cpi, application_deadline)
JOIN company c ON c.company_name = x.company_name
ON CONFLICT (company_id, role_name, offer_type, application_deadline) DO NOTHING;

INSERT INTO application (student_id, offer_id, status)
SELECT s.user_id, po.offer_id, 'Applied'
FROM student s
JOIN app_user u ON u.user_id = s.user_id
JOIN placement_offer po ON po.role_name = 'Software Engineer'
JOIN company c ON c.company_id = po.company_id AND c.company_name = 'TCS'
WHERE s.admission_year = 2023
    AND u.email IN ('23bcs002@sums.edu', '23bcs003@sums.edu', '23bcs004@sums.edu')
ON CONFLICT (student_id, offer_id) DO NOTHING;

SELECT setval('program_program_id_seq', COALESCE((SELECT MAX(program_id) FROM program), 1), true);

INSERT INTO program (department_id, degree, branch, duration_years) VALUES
    (1, 'B.Tech', 'Artificial Intelligence', 4),
    (1, 'M.Tech', 'Computer Science', 2),
    (1, 'Ph.D', 'Computer Science', 5)
ON CONFLICT (department_id, degree, branch) DO NOTHING;

INSERT INTO app_user (name, email, phone, dob, gender, password, user_type) VALUES
    ('Dr. Ananya Sharma', 'ananya.sharma@sums.edu', '9900000001', '1980-03-10', 'Female', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
    ('Dr. Rahul Verma', 'rahul.verma@sums.edu', '9900000002', '1979-05-12', 'Male', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
    ('Dr. Meera Iyer', 'meera.iyer@sums.edu', '9900000003', '1985-08-22', 'Female', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
    ('Dr. Vikram Patel', 'vikram.patel@sums.edu', '9900000004', '1981-01-17', 'Male', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
    ('Dr. Sanjay Kulkarni', 'sanjay.kulkarni@sums.edu', '9900000005', '1975-09-14', 'Male', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
    ('Dr. Neha Gupta', 'neha.gupta@sums.edu', '9900000006', '1986-02-19', 'Female', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
    ('Dr. Amit Nair', 'amit.nair@sums.edu', '9900000007', '1983-11-11', 'Male', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
    ('Dr. Kavita Singh', 'kavita.singh@sums.edu', '9900000008', '1984-07-30', 'Female', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
    ('Dr. Priyanka Rao', 'priyanka.rao@sums.edu', '9900000009', '1982-12-18', 'Female', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
    ('Dr. Ritesh Menon', 'ritesh.menon@sums.edu', '9900000010', '1978-06-25', 'Male', crypt('Faculty@123', gen_salt('bf')), 'FACULTY'),
    ('Dr. Pawan Joshi', 'pawan.joshi@sums.edu', '9900000011', '1980-04-09', 'Male', crypt('Faculty@123', gen_salt('bf')), 'FACULTY')
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty (user_id, department_id, employee_code, designation)
SELECT u.user_id, 1, f.employee_code, f.designation
FROM (
    VALUES
      ('ananya.sharma@sums.edu', 'FAC101', 'Professor'),
      ('rahul.verma@sums.edu', 'FAC102', 'Associate Professor'),
      ('meera.iyer@sums.edu', 'FAC103', 'Assistant Professor'),
      ('vikram.patel@sums.edu', 'FAC104', 'Assistant Professor'),
      ('sanjay.kulkarni@sums.edu', 'FAC105', 'Professor'),
      ('neha.gupta@sums.edu', 'FAC106', 'Associate Professor'),
      ('amit.nair@sums.edu', 'FAC107', 'Assistant Professor'),
      ('kavita.singh@sums.edu', 'FAC108', 'Assistant Professor')
) AS f(email, employee_code, designation)
JOIN app_user u ON u.email = f.email
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO faculty (user_id, department_id, employee_code, designation)
SELECT u.user_id, 2, f.employee_code, f.designation
FROM (
    VALUES
    ('priyanka.rao@sums.edu', 'FAC201', 'Professor'),
    ('ritesh.menon@sums.edu', 'FAC202', 'Professor'),
    ('pawan.joshi@sums.edu', 'FAC203', 'Associate Professor')
) AS f(email, employee_code, designation)
JOIN app_user u ON u.email = f.email
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO app_user (name, email, phone, dob, gender, password, user_type) VALUES
    ('Aarav Sharma', '21bcs001@sums.edu', '9100000001', '2003-01-10', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Vivaan Gupta', '21bcs002@sums.edu', '9100000002', '2003-02-11', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Aditya Patel', '21bcs003@sums.edu', '9100000003', '2003-03-12', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Ishaan Singh', '21bcs004@sums.edu', '9100000004', '2003-04-13', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Arjun Nair', '21bcs005@sums.edu', '9100000005', '2003-05-14', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Kabir Reddy', '21bcs006@sums.edu', '9100000006', '2003-06-15', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Krishna Iyer', '21bcs007@sums.edu', '9100000007', '2003-07-16', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Rohan Mehta', '21bcs008@sums.edu', '9100000008', '2003-08-17', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Ayaan Khan', '21bcs009@sums.edu', '9100000009', '2003-09-18', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Aryan Kapoor', '21bcs010@sums.edu', '9100000010', '2003-10-19', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Ananya Sharma', '22bcs011@sums.edu', '9100000011', '2004-01-10', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Diya Patel', '22bcs012@sums.edu', '9100000012', '2004-02-11', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Isha Gupta', '22bcs013@sums.edu', '9100000013', '2004-03-12', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Sneha Reddy', '22bcs014@sums.edu', '9100000014', '2004-04-13', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Riya Iyer', '22bcs015@sums.edu', '9100000015', '2004-05-14', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Pooja Singh', '22bcs016@sums.edu', '9100000016', '2004-06-15', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Aditi Nair', '22bcs017@sums.edu', '9100000017', '2004-07-16', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Neha Kapoor', '22bcs018@sums.edu', '9100000018', '2004-08-17', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Kavya Menon', '22bcs019@sums.edu', '9100000019', '2004-09-18', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Tanvi Sharma', '22bcs020@sums.edu', '9100000020', '2004-10-19', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Rahul Verma', '23bcs021@sums.edu', '9100000021', '2005-01-10', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Sahil Jain', '23bcs022@sums.edu', '9100000022', '2005-02-11', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Kunal Desai', '23bcs023@sums.edu', '9100000023', '2005-03-12', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Ritvik Arora', '23bcs024@sums.edu', '9100000024', '2005-04-13', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Yash Malhotra', '23bcs025@sums.edu', '9100000025', '2005-05-14', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Dev Agarwal', '23bcs026@sums.edu', '9100000026', '2005-06-15', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Varun Bansal', '23bcs027@sums.edu', '9100000027', '2005-07-16', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Harsh Vyas', '23bcs028@sums.edu', '9100000028', '2005-08-17', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Aman Thakur', '23bcs029@sums.edu', '9100000029', '2005-09-18', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Nikhil Bhatt', '23bcs030@sums.edu', '9100000030', '2005-10-19', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Aisha Khan', '24bcs031@sums.edu', '9100000031', '2006-01-10', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Sara Shaikh', '24bcs032@sums.edu', '9100000032', '2006-02-11', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Zoya Ansari', '24bcs033@sums.edu', '9100000033', '2006-03-12', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Fatima Siddiqui', '24bcs034@sums.edu', '9100000034', '2006-04-13', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Noor Qureshi', '24bcs035@sums.edu', '9100000035', '2006-05-14', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Alina Mirza', '24bcs036@sums.edu', '9100000036', '2006-06-15', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Hina Khan', '24bcs037@sums.edu', '9100000037', '2006-07-16', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Sana Pathan', '24bcs038@sums.edu', '9100000038', '2006-08-17', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Rehana Shaikh', '24bcs039@sums.edu', '9100000039', '2006-09-18', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Mehak Khan', '24bcs040@sums.edu', '9100000040', '2006-10-19', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Rakesh Kumar', '24bcs041@sums.edu', '9100000041', '2006-01-10', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Saurabh Mishra', '24bcs042@sums.edu', '9100000042', '2006-02-11', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Akash Yadav', '24bcs043@sums.edu', '9100000043', '2006-03-12', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Rohit Sharma', '24bcs044@sums.edu', '9100000044', '2006-04-13', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Vikas Singh', '24bcs045@sums.edu', '9100000045', '2006-05-14', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Manish Gupta', '24bcs046@sums.edu', '9100000046', '2006-06-15', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Deepak Verma', '24bcs047@sums.edu', '9100000047', '2006-07-16', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Pranav Joshi', '24bcs048@sums.edu', '9100000048', '2006-08-17', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Harsh Agarwal', '24bcs049@sums.edu', '9100000049', '2006-09-18', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Siddharth Choudhary', '24bcs050@sums.edu', '9100000050', '2006-10-19', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Nisha Verma', '23mcs051@sums.edu', '9100000051', '2003-01-12', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Shreya Sharma', '23mcs052@sums.edu', '9100000052', '2003-02-13', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Pallavi Singh', '23mcs053@sums.edu', '9100000053', '2003-03-14', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Ritika Mehta', '23mcs054@sums.edu', '9100000054', '2003-04-15', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Simran Kaur', '23mcs055@sums.edu', '9100000055', '2003-05-16', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Garima Jain', '23mcs056@sums.edu', '9100000056', '2003-06-17', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Komal Gupta', '23mcs057@sums.edu', '9100000057', '2003-07-18', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Aparna Nair', '23mcs058@sums.edu', '9100000058', '2003-08-19', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Snehal Patil', '23mcs059@sums.edu', '9100000059', '2003-09-20', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Anjali Desai', '23mcs060@sums.edu', '9100000060', '2003-10-21', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Rahul Pandey', '22mcs061@sums.edu', '9100000061', '2002-01-12', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Ankit Tiwari', '22mcs062@sums.edu', '9100000062', '2002-02-13', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Prashant Yadav', '22mcs063@sums.edu', '9100000063', '2002-03-14', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Gaurav Mishra', '22mcs064@sums.edu', '9100000064', '2002-04-15', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Nitin Dubey', '22mcs065@sums.edu', '9100000065', '2002-05-16', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Sandeep Chauhan', '22mcs066@sums.edu', '9100000066', '2002-06-17', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Arvind Kumar', '22mcs067@sums.edu', '9100000067', '2002-07-18', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Pankaj Verma', '22mcs068@sums.edu', '9100000068', '2002-08-19', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Ravi Singh', '22mcs069@sums.edu', '9100000069', '2002-09-20', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Kunal Saxena', '22mcs070@sums.edu', '9100000070', '2002-10-21', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('PhD Scholar Arjun', 'phd071@sums.edu', '9100000071', '1999-01-12', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('PhD Scholar Neeraj', 'phd072@sums.edu', '9100000072', '1998-02-13', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('PhD Scholar Kavita', 'phd073@sums.edu', '9100000073', '1997-03-14', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('PhD Scholar Pooja', 'phd074@sums.edu', '9100000074', '1998-04-15', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('PhD Scholar Raj', 'phd075@sums.edu', '9100000075', '1999-05-16', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Harshit Jain', '23bai076@sums.edu', '9100000076', '2005-01-12', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Devansh Kapoor', '23bai077@sums.edu', '9100000077', '2005-02-13', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Prateek Arora', '23bai078@sums.edu', '9100000078', '2005-03-14', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Ritwik Ghosh', '23bai079@sums.edu', '9100000079', '2005-04-15', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Adarsh Bhat', '23bai080@sums.edu', '9100000080', '2005-05-16', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Shruti Joshi', '24bai081@sums.edu', '9100000081', '2006-01-12', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Nikita Bansal', '24bai082@sums.edu', '9100000082', '2006-02-13', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Ankita Das', '24bai083@sums.edu', '9100000083', '2006-03-14', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Swati Agarwal', '24bai084@sums.edu', '9100000084', '2006-04-15', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Priyanka Nair', '24bai085@sums.edu', '9100000085', '2006-05-16', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Aditya Deshmukh', '22bai086@sums.edu', '9100000086', '2004-01-12', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Nilesh Patil', '22bai087@sums.edu', '9100000087', '2004-02-13', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Mahesh Pawar', '22bai088@sums.edu', '9100000088', '2004-03-14', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Sagar Kulkarni', '22bai089@sums.edu', '9100000089', '2004-04-15', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Vivek Jadhav', '22bai090@sums.edu', '9100000090', '2004-05-16', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Mehul Shah', '21bai091@sums.edu', '9100000091', '2003-01-12', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Ketan Shah', '21bai092@sums.edu', '9100000092', '2003-02-13', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Chirag Modi', '21bai093@sums.edu', '9100000093', '2003-03-14', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Parth Shah', '21bai094@sums.edu', '9100000094', '2003-04-15', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Dhruv Patel', '21bai095@sums.edu', '9100000095', '2003-05-16', 'Male', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Riddhi Shah', '24bcs096@sums.edu', '9100000096', '2006-01-12', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Mitali Jain', '24bcs097@sums.edu', '9100000097', '2006-02-13', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Ira Shah', '24bcs098@sums.edu', '9100000098', '2006-03-14', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Pooja Shah', '24bcs099@sums.edu', '9100000099', '2006-04-15', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT'),
    ('Krupa Shah', '24bcs100@sums.edu', '9100000100', '2006-05-16', 'Female', crypt('Student@123', gen_salt('bf')), 'STUDENT')
ON CONFLICT (email) DO NOTHING;

INSERT INTO student (user_id, program_id, roll_number, admission_year, current_semester)
SELECT u.user_id, p.program_id, x.roll_number, x.admission_year, x.current_semester
FROM (
    VALUES
      ('21bcs001@sums.edu', 'B.Tech', 'Computer Science and Engineering', '21BCS001', 2021, 7),
      ('21bcs002@sums.edu', 'B.Tech', 'Computer Science and Engineering', '21BCS002', 2021, 7),
      ('21bcs003@sums.edu', 'B.Tech', 'Computer Science and Engineering', '21BCS003', 2021, 7),
      ('21bcs004@sums.edu', 'B.Tech', 'Computer Science and Engineering', '21BCS004', 2021, 7),
      ('21bcs005@sums.edu', 'B.Tech', 'Computer Science and Engineering', '21BCS005', 2021, 7),
      ('21bcs006@sums.edu', 'B.Tech', 'Computer Science and Engineering', '21BCS006', 2021, 7),
      ('21bcs007@sums.edu', 'B.Tech', 'Computer Science and Engineering', '21BCS007', 2021, 7),
      ('21bcs008@sums.edu', 'B.Tech', 'Computer Science and Engineering', '21BCS008', 2021, 7),
      ('21bcs009@sums.edu', 'B.Tech', 'Computer Science and Engineering', '21BCS009', 2021, 7),
      ('21bcs010@sums.edu', 'B.Tech', 'Computer Science and Engineering', '21BCS010', 2021, 7),
      ('22bcs011@sums.edu', 'B.Tech', 'Computer Science and Engineering', '22BCS011', 2022, 5),
      ('22bcs012@sums.edu', 'B.Tech', 'Computer Science and Engineering', '22BCS012', 2022, 5),
      ('22bcs013@sums.edu', 'B.Tech', 'Computer Science and Engineering', '22BCS013', 2022, 5),
      ('22bcs014@sums.edu', 'B.Tech', 'Computer Science and Engineering', '22BCS014', 2022, 5),
      ('22bcs015@sums.edu', 'B.Tech', 'Computer Science and Engineering', '22BCS015', 2022, 5),
      ('22bcs016@sums.edu', 'B.Tech', 'Computer Science and Engineering', '22BCS016', 2022, 5),
      ('22bcs017@sums.edu', 'B.Tech', 'Computer Science and Engineering', '22BCS017', 2022, 5),
      ('22bcs018@sums.edu', 'B.Tech', 'Computer Science and Engineering', '22BCS018', 2022, 5),
      ('22bcs019@sums.edu', 'B.Tech', 'Computer Science and Engineering', '22BCS019', 2022, 5),
      ('22bcs020@sums.edu', 'B.Tech', 'Computer Science and Engineering', '22BCS020', 2022, 5),
      ('23bcs021@sums.edu', 'B.Tech', 'Computer Science and Engineering', '23BCS021', 2023, 3),
      ('23bcs022@sums.edu', 'B.Tech', 'Computer Science and Engineering', '23BCS022', 2023, 3),
      ('23bcs023@sums.edu', 'B.Tech', 'Computer Science and Engineering', '23BCS023', 2023, 3),
      ('23bcs024@sums.edu', 'B.Tech', 'Computer Science and Engineering', '23BCS024', 2023, 3),
      ('23bcs025@sums.edu', 'B.Tech', 'Computer Science and Engineering', '23BCS025', 2023, 3),
      ('23bcs026@sums.edu', 'B.Tech', 'Computer Science and Engineering', '23BCS026', 2023, 3),
      ('23bcs027@sums.edu', 'B.Tech', 'Computer Science and Engineering', '23BCS027', 2023, 3),
      ('23bcs028@sums.edu', 'B.Tech', 'Computer Science and Engineering', '23BCS028', 2023, 3),
      ('23bcs029@sums.edu', 'B.Tech', 'Computer Science and Engineering', '23BCS029', 2023, 3),
      ('23bcs030@sums.edu', 'B.Tech', 'Computer Science and Engineering', '23BCS030', 2023, 3),
      ('24bcs031@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS031', 2024, 1),
      ('24bcs032@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS032', 2024, 1),
      ('24bcs033@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS033', 2024, 1),
      ('24bcs034@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS034', 2024, 1),
      ('24bcs035@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS035', 2024, 1),
      ('24bcs036@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS036', 2024, 1),
      ('24bcs037@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS037', 2024, 1),
      ('24bcs038@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS038', 2024, 1),
      ('24bcs039@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS039', 2024, 1),
      ('24bcs040@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS040', 2024, 1),
      ('24bcs041@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS041', 2024, 1),
      ('24bcs042@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS042', 2024, 1),
      ('24bcs043@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS043', 2024, 1),
      ('24bcs044@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS044', 2024, 1),
      ('24bcs045@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS045', 2024, 1),
      ('24bcs046@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS046', 2024, 1),
      ('24bcs047@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS047', 2024, 1),
      ('24bcs048@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS048', 2024, 1),
      ('24bcs049@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS049', 2024, 1),
      ('24bcs050@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS050', 2024, 1),
      ('23mcs051@sums.edu', 'M.Tech', 'Computer Science', '23MCS051', 2023, 3),
      ('23mcs052@sums.edu', 'M.Tech', 'Computer Science', '23MCS052', 2023, 3),
      ('23mcs053@sums.edu', 'M.Tech', 'Computer Science', '23MCS053', 2023, 3),
      ('23mcs054@sums.edu', 'M.Tech', 'Computer Science', '23MCS054', 2023, 3),
      ('23mcs055@sums.edu', 'M.Tech', 'Computer Science', '23MCS055', 2023, 3),
      ('23mcs056@sums.edu', 'M.Tech', 'Computer Science', '23MCS056', 2023, 3),
      ('23mcs057@sums.edu', 'M.Tech', 'Computer Science', '23MCS057', 2023, 3),
      ('23mcs058@sums.edu', 'M.Tech', 'Computer Science', '23MCS058', 2023, 3),
      ('23mcs059@sums.edu', 'M.Tech', 'Computer Science', '23MCS059', 2023, 3),
      ('23mcs060@sums.edu', 'M.Tech', 'Computer Science', '23MCS060', 2023, 3),
      ('22mcs061@sums.edu', 'M.Tech', 'Computer Science', '24MCS061', 2024, 1),
      ('22mcs062@sums.edu', 'M.Tech', 'Computer Science', '24MCS062', 2024, 1),
      ('22mcs063@sums.edu', 'M.Tech', 'Computer Science', '24MCS063', 2024, 1),
      ('22mcs064@sums.edu', 'M.Tech', 'Computer Science', '24MCS064', 2024, 1),
      ('22mcs065@sums.edu', 'M.Tech', 'Computer Science', '24MCS065', 2024, 1),
      ('22mcs066@sums.edu', 'M.Tech', 'Computer Science', '24MCS066', 2024, 1),
      ('22mcs067@sums.edu', 'M.Tech', 'Computer Science', '24MCS067', 2024, 1),
      ('22mcs068@sums.edu', 'M.Tech', 'Computer Science', '24MCS068', 2024, 1),
      ('22mcs069@sums.edu', 'M.Tech', 'Computer Science', '24MCS069', 2024, 1),
      ('22mcs070@sums.edu', 'M.Tech', 'Computer Science', '24MCS070', 2024, 1),
      ('phd071@sums.edu', 'Ph.D', 'Computer Science', 'PHD071', 2022, 1),
      ('phd072@sums.edu', 'Ph.D', 'Computer Science', 'PHD072', 2022, 1),
      ('phd073@sums.edu', 'Ph.D', 'Computer Science', 'PHD073', 2022, 1),
      ('phd074@sums.edu', 'Ph.D', 'Computer Science', 'PHD074', 2023, 1),
      ('phd075@sums.edu', 'Ph.D', 'Computer Science', 'PHD075', 2023, 1),
      ('23bai076@sums.edu', 'B.Tech', 'Artificial Intelligence', '23BAI076', 2023, 3),
      ('23bai077@sums.edu', 'B.Tech', 'Artificial Intelligence', '23BAI077', 2023, 3),
      ('23bai078@sums.edu', 'B.Tech', 'Artificial Intelligence', '23BAI078', 2023, 3),
      ('23bai079@sums.edu', 'B.Tech', 'Artificial Intelligence', '23BAI079', 2023, 3),
      ('23bai080@sums.edu', 'B.Tech', 'Artificial Intelligence', '23BAI080', 2023, 3),
      ('24bai081@sums.edu', 'B.Tech', 'Artificial Intelligence', '24BAI081', 2024, 1),
      ('24bai082@sums.edu', 'B.Tech', 'Artificial Intelligence', '24BAI082', 2024, 1),
      ('24bai083@sums.edu', 'B.Tech', 'Artificial Intelligence', '24BAI083', 2024, 1),
      ('24bai084@sums.edu', 'B.Tech', 'Artificial Intelligence', '24BAI084', 2024, 1),
      ('24bai085@sums.edu', 'B.Tech', 'Artificial Intelligence', '24BAI085', 2024, 1),
      ('22bai086@sums.edu', 'B.Tech', 'Artificial Intelligence', '22BAI086', 2022, 5),
      ('22bai087@sums.edu', 'B.Tech', 'Artificial Intelligence', '22BAI087', 2022, 5),
      ('22bai088@sums.edu', 'B.Tech', 'Artificial Intelligence', '22BAI088', 2022, 5),
      ('22bai089@sums.edu', 'B.Tech', 'Artificial Intelligence', '22BAI089', 2022, 5),
      ('22bai090@sums.edu', 'B.Tech', 'Artificial Intelligence', '22BAI090', 2022, 5),
      ('21bai091@sums.edu', 'B.Tech', 'Artificial Intelligence', '21BAI091', 2021, 7),
      ('21bai092@sums.edu', 'B.Tech', 'Artificial Intelligence', '21BAI092', 2021, 7),
      ('21bai093@sums.edu', 'B.Tech', 'Artificial Intelligence', '21BAI093', 2021, 7),
      ('21bai094@sums.edu', 'B.Tech', 'Artificial Intelligence', '21BAI094', 2021, 7),
      ('21bai095@sums.edu', 'B.Tech', 'Artificial Intelligence', '21BAI095', 2021, 7),
      ('24bcs096@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS096', 2024, 1),
      ('24bcs097@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS097', 2024, 1),
      ('24bcs098@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS098', 2024, 1),
      ('24bcs099@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS099', 2024, 1),
      ('24bcs100@sums.edu', 'B.Tech', 'Computer Science and Engineering', '24BCS100', 2024, 1)
) AS x(email, degree, branch, roll_number, admission_year, current_semester)
JOIN app_user u ON u.email = x.email
JOIN program p ON p.degree = x.degree AND p.branch = x.branch
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO enrollment (student_id, offering_id, enrollment_type, attempt_no, academic_year, semester_no)
SELECT s.user_id, co.offering_id, 'Credit', 1, '2025-2026', 5
FROM (
        VALUES
            ('21BCS001', 'CS201'),
            ('21BCS002', 'CS201'),
            ('21BCS003', 'CS201'),
            ('21BCS004', 'CS201'),
            ('21BCS005', 'CS201'),
            ('21BCS006', 'CS202'),
            ('21BCS007', 'CS202'),
            ('21BCS008', 'CS202'),
            ('21BCS009', 'CS202'),
            ('21BCS010', 'CS202'),
            ('22BCS011', 'CS201'),
            ('22BCS012', 'CS201'),
            ('22BCS013', 'CS201'),
            ('22BCS014', 'CS202'),
            ('22BCS015', 'CS202')
) AS x(roll_number, course_id)
JOIN student s ON s.roll_number = x.roll_number
JOIN course_offering co ON co.course_id = x.course_id AND co.academic_year = '2025-2026' AND co.section = 'A'
ON CONFLICT (student_id, offering_id) DO NOTHING;

INSERT INTO student_marks (enrollment_id, component_id, marks_obtained, weighted_marks)
SELECT e.enrollment_id, ac.component_id, x.marks_obtained, x.weighted_marks
FROM (
        VALUES
            ('21BCS001', 'Midsem', 22.00::numeric, 22.00::numeric),
            ('21BCS001', 'Endsem', 41.00::numeric, 41.00::numeric),
            ('21BCS001', 'Quiz', 15.00::numeric, 15.00::numeric),
            ('21BCS002', 'Midsem', 25.00::numeric, 25.00::numeric),
            ('21BCS002', 'Endsem', 43.00::numeric, 43.00::numeric),
            ('21BCS002', 'Quiz', 18.00::numeric, 18.00::numeric),
            ('21BCS003', 'Midsem', 19.00::numeric, 19.00::numeric),
            ('21BCS003', 'Endsem', 37.00::numeric, 37.00::numeric),
            ('21BCS003', 'Quiz', 14.00::numeric, 14.00::numeric),
            ('21BCS004', 'Midsem', 21.00::numeric, 21.00::numeric),
            ('21BCS004', 'Endsem', 40.00::numeric, 40.00::numeric),
            ('21BCS004', 'Quiz', 17.00::numeric, 17.00::numeric),
            ('21BCS005', 'Midsem', 26.00::numeric, 26.00::numeric),
            ('21BCS005', 'Endsem', 45.00::numeric, 45.00::numeric),
            ('21BCS005', 'Quiz', 19.00::numeric, 19.00::numeric)
) AS x(roll_number, component_type, marks_obtained, weighted_marks)
JOIN student s ON s.roll_number = x.roll_number
JOIN enrollment e ON e.student_id = s.user_id
JOIN course_offering co ON co.offering_id = e.offering_id AND co.course_id = 'CS201' AND co.academic_year = '2025-2026'
JOIN assessment_component ac ON ac.offering_id = co.offering_id AND ac.type = x.component_type
ON CONFLICT (enrollment_id, component_id) DO NOTHING;

INSERT INTO grade (enrollment_id, grade_letter, is_counted_for_cpi)
SELECT e.enrollment_id, x.grade_letter, TRUE
FROM (
        VALUES
            ('21BCS001', 'A'),
            ('21BCS002', 'A+'),
            ('21BCS003', 'B+'),
            ('21BCS004', 'A'),
            ('21BCS005', 'A+'),
            ('21BCS006', 'B'),
            ('21BCS007', 'B+'),
            ('21BCS008', 'A'),
            ('21BCS009', 'B+'),
            ('21BCS010', 'A')
) AS x(roll_number, grade_letter)
JOIN student s ON s.roll_number = x.roll_number
JOIN enrollment e ON e.student_id = s.user_id
JOIN course_offering co ON co.offering_id = e.offering_id AND co.academic_year = '2025-2026' AND co.course_id IN ('CS201', 'CS202')
ON CONFLICT (enrollment_id) DO NOTHING;

INSERT INTO semester_result (student_id, academic_year, semester_no, spi, credits_earned_sem)
SELECT s.user_id, '2025-2026', 5, x.spi, x.credits_earned_sem
FROM (
        VALUES
            ('21BCS001', 8.72::numeric, 20.00::numeric),
            ('21BCS002', 9.10::numeric, 21.00::numeric),
            ('21BCS003', 8.35::numeric, 19.00::numeric),
            ('21BCS004', 8.90::numeric, 20.00::numeric),
            ('21BCS005', 9.25::numeric, 22.00::numeric),
            ('21BCS006', 7.80::numeric, 18.00::numeric),
            ('21BCS007', 8.40::numeric, 20.00::numeric),
            ('21BCS008', 9.05::numeric, 21.00::numeric),
            ('21BCS009', 8.15::numeric, 19.00::numeric),
            ('21BCS010', 8.60::numeric, 20.00::numeric)
) AS x(roll_number, spi, credits_earned_sem)
JOIN student s ON s.roll_number = x.roll_number
ON CONFLICT (student_id, academic_year, semester_no) DO NOTHING;

SELECT setval('department_department_id_seq', COALESCE((SELECT MAX(department_id) FROM department), 1), true);
SELECT setval('program_program_id_seq', COALESCE((SELECT MAX(program_id) FROM program), 1), true);
SELECT setval('app_user_user_id_seq', COALESCE((SELECT MAX(user_id) FROM app_user), 1), true);
SELECT setval('course_offering_offering_id_seq', COALESCE((SELECT MAX(offering_id) FROM course_offering), 1), true);
SELECT setval('enrollment_enrollment_id_seq', COALESCE((SELECT MAX(enrollment_id) FROM enrollment), 1), true);
SELECT setval('assessment_component_component_id_seq', COALESCE((SELECT MAX(component_id) FROM assessment_component), 1), true);
SELECT setval('company_company_id_seq', COALESCE((SELECT MAX(company_id) FROM company), 1), true);
SELECT setval('placement_offer_offer_id_seq', COALESCE((SELECT MAX(offer_id) FROM placement_offer), 1), true);
SELECT setval('application_application_id_seq', COALESCE((SELECT MAX(application_id) FROM application), 1), true);

COMMIT;
