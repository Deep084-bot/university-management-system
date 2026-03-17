BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS final_outcome CASCADE;
DROP TABLE IF EXISTS application CASCADE;
DROP TABLE IF EXISTS placement_offer CASCADE;
DROP TABLE IF EXISTS company CASCADE;
DROP TABLE IF EXISTS semester_result CASCADE;
DROP TABLE IF EXISTS grade CASCADE;
DROP TABLE IF EXISTS student_marks CASCADE;
DROP TABLE IF EXISTS assessment_component CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS enrollment CASCADE;
DROP TABLE IF EXISTS prerequisite CASCADE;
DROP TABLE IF EXISTS teaches CASCADE;
DROP TABLE IF EXISTS course_offering CASCADE;
DROP TABLE IF EXISTS course CASCADE;
DROP TABLE IF EXISTS grade_scale CASCADE;
DROP TABLE IF EXISTS admin_user CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS student CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;
DROP TABLE IF EXISTS program CASCADE;
DROP TABLE IF EXISTS department CASCADE;

CREATE TABLE department (
    department_id BIGSERIAL PRIMARY KEY,
    department_name VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE program (
    program_id BIGSERIAL PRIMARY KEY,
    department_id BIGINT NOT NULL REFERENCES department(department_id) ON DELETE RESTRICT,
    degree VARCHAR(50) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    duration_years INTEGER NOT NULL CHECK (duration_years BETWEEN 1 AND 8),
    UNIQUE (department_id, degree, branch)
);

CREATE TABLE app_user (
    user_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    phone VARCHAR(20) NOT NULL UNIQUE,
    dob DATE NOT NULL CHECK (dob <= CURRENT_DATE - INTERVAL '15 years'),
    gender VARCHAR(30) NOT NULL CHECK (gender IN ('Male', 'Female', 'Non-Binary', 'Prefer Not To Say')),
    password TEXT NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('STUDENT', 'FACULTY', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student (
    user_id BIGINT PRIMARY KEY REFERENCES app_user(user_id) ON DELETE CASCADE,
    program_id BIGINT NOT NULL REFERENCES program(program_id) ON DELETE RESTRICT,
    roll_number VARCHAR(30) NOT NULL UNIQUE,
    admission_year INTEGER NOT NULL CHECK (admission_year BETWEEN 2000 AND 2100),
    current_semester INTEGER NOT NULL CHECK (current_semester BETWEEN 1 AND 12)
);

CREATE TABLE faculty (
    user_id BIGINT PRIMARY KEY REFERENCES app_user(user_id) ON DELETE CASCADE,
    department_id BIGINT NOT NULL REFERENCES department(department_id) ON DELETE RESTRICT,
    employee_code VARCHAR(30) NOT NULL UNIQUE,
    designation VARCHAR(100) NOT NULL
);

CREATE TABLE admin_user (
    user_id BIGINT PRIMARY KEY REFERENCES app_user(user_id) ON DELETE CASCADE,
    admin_code VARCHAR(30) NOT NULL UNIQUE,
    role_title VARCHAR(100) NOT NULL
);

CREATE TABLE grade_scale (
    grade_letter VARCHAR(5) PRIMARY KEY,
    grade_point NUMERIC(4,2) NOT NULL UNIQUE CHECK (grade_point BETWEEN 0 AND 10)
);

CREATE TABLE course (
    course_id VARCHAR(20) PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL,
    credits NUMERIC(4,1) NOT NULL CHECK (credits > 0),
    category VARCHAR(30) NOT NULL CHECK (category IN ('Core', 'Elective', 'Lab', 'Open Elective', 'Audit')),
    min_attendance_req NUMERIC(5,2) NOT NULL CHECK (min_attendance_req BETWEEN 0 AND 100),
    program_id BIGINT NOT NULL REFERENCES program(program_id) ON DELETE RESTRICT,
    semester_no INTEGER NOT NULL CHECK (semester_no BETWEEN 1 AND 12)
);

CREATE TABLE course_offering (
    offering_id BIGSERIAL PRIMARY KEY,
    course_id VARCHAR(20) NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
    academic_year VARCHAR(9) NOT NULL CHECK (academic_year ~ '^[0-9]{4}-[0-9]{4}$'),
    section VARCHAR(20) NOT NULL DEFAULT 'A',
    UNIQUE (course_id, academic_year, section)
);

CREATE TABLE teaches (
    faculty_id BIGINT NOT NULL REFERENCES faculty(user_id) ON DELETE CASCADE,
    offering_id BIGINT NOT NULL REFERENCES course_offering(offering_id) ON DELETE CASCADE,
    assigned_on TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (faculty_id, offering_id)
);

CREATE TABLE prerequisite (
    course_id VARCHAR(20) NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
    prereq_id VARCHAR(20) NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
    min_grade_req VARCHAR(5) NOT NULL REFERENCES grade_scale(grade_letter),
    PRIMARY KEY (course_id, prereq_id),
    CHECK (course_id <> prereq_id)
);

CREATE TABLE enrollment (
    enrollment_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES student(user_id) ON DELETE CASCADE,
    offering_id BIGINT NOT NULL REFERENCES course_offering(offering_id) ON DELETE CASCADE,
    enrollment_type VARCHAR(20) NOT NULL CHECK (enrollment_type IN ('Credit', 'Audit')),
    attempt_no INTEGER NOT NULL CHECK (attempt_no >= 1),
    academic_year VARCHAR(9) NOT NULL CHECK (academic_year ~ '^[0-9]{4}-[0-9]{4}$'),
    semester_no INTEGER NOT NULL CHECK (semester_no BETWEEN 1 AND 12),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, offering_id)
);

CREATE TABLE attendance (
    enrollment_id BIGINT NOT NULL REFERENCES enrollment(enrollment_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Excused')),
    PRIMARY KEY (enrollment_id, attendance_date)
);

CREATE TABLE assessment_component (
    component_id BIGSERIAL PRIMARY KEY,
    offering_id BIGINT NOT NULL REFERENCES course_offering(offering_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    weightage NUMERIC(5,2) NOT NULL CHECK (weightage > 0 AND weightage <= 100),
    max_marks NUMERIC(6,2) NOT NULL CHECK (max_marks > 0),
    UNIQUE (offering_id, type)
);

CREATE TABLE student_marks (
    enrollment_id BIGINT NOT NULL REFERENCES enrollment(enrollment_id) ON DELETE CASCADE,
    component_id BIGINT NOT NULL REFERENCES assessment_component(component_id) ON DELETE CASCADE,
    marks_obtained NUMERIC(6,2) NOT NULL CHECK (marks_obtained >= 0),
    weighted_marks NUMERIC(6,2) NOT NULL CHECK (weighted_marks >= 0),
    PRIMARY KEY (enrollment_id, component_id)
);

CREATE TABLE grade (
    enrollment_id BIGINT PRIMARY KEY REFERENCES enrollment(enrollment_id) ON DELETE CASCADE,
    grade_letter VARCHAR(5) NOT NULL REFERENCES grade_scale(grade_letter),
    is_counted_for_cpi BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE semester_result (
    student_id BIGINT NOT NULL REFERENCES student(user_id) ON DELETE CASCADE,
    academic_year VARCHAR(9) NOT NULL CHECK (academic_year ~ '^[0-9]{4}-[0-9]{4}$'),
    semester_no INTEGER NOT NULL CHECK (semester_no BETWEEN 1 AND 12),
    spi NUMERIC(4,2) NOT NULL CHECK (spi BETWEEN 0 AND 10),
    credits_earned_sem NUMERIC(5,2) NOT NULL CHECK (credits_earned_sem >= 0),
    PRIMARY KEY (student_id, academic_year, semester_no)
);

CREATE TABLE company (
    company_id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL UNIQUE,
    contact VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    industry_type VARCHAR(100) NOT NULL
);

CREATE TABLE placement_offer (
    offer_id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES company(company_id) ON DELETE CASCADE,
    role_name VARCHAR(120) NOT NULL,
    package_ctc NUMERIC(10,2) NOT NULL CHECK (package_ctc >= 0),
    offer_type VARCHAR(20) NOT NULL CHECK (offer_type IN ('Internship', 'Full Time', 'PPO')),
    location VARCHAR(120),
    eligible_min_cpi NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (eligible_min_cpi BETWEEN 0 AND 10),
    application_deadline DATE,
    UNIQUE (company_id, role_name, offer_type, application_deadline)
);

CREATE TABLE application (
    application_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES student(user_id) ON DELETE CASCADE,
    offer_id BIGINT NOT NULL REFERENCES placement_offer(offer_id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL CHECK (status IN ('Applied', 'Shortlisted', 'Interviewing', 'Offered', 'Rejected', 'Withdrawn')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, offer_id)
);

CREATE TABLE final_outcome (
    student_id BIGINT PRIMARY KEY REFERENCES student(user_id) ON DELETE CASCADE,
    graduating_cpi NUMERIC(4,2) NOT NULL CHECK (graduating_cpi BETWEEN 0 AND 10),
    total_credits_earned NUMERIC(6,2) NOT NULL CHECK (total_credits_earned >= 0),
    class_awarded VARCHAR(100) NOT NULL,
    degree_awarded VARCHAR(100) NOT NULL,
    graduation_year INTEGER NOT NULL CHECK (graduation_year BETWEEN 2000 AND 2100)
);

CREATE OR REPLACE FUNCTION enforce_user_subtype()
RETURNS TRIGGER AS $$
DECLARE
    actual_type TEXT;
    expected_type TEXT := TG_ARGV[0];
BEGIN
    SELECT user_type INTO actual_type
    FROM app_user
    WHERE user_id = NEW.user_id
    FOR KEY SHARE;

    IF expected_type IS NULL THEN
        RAISE EXCEPTION 'Expected user_type argument missing for trigger %', TG_NAME;
    END IF;

    IF actual_type IS NULL THEN
        RAISE EXCEPTION 'User % does not exist', NEW.user_id;
    END IF;

    IF actual_type <> expected_type THEN
        RAISE EXCEPTION 'User % must be of type %, found %', NEW.user_id, expected_type, actual_type;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_user_type_trigger
BEFORE INSERT OR UPDATE ON student
FOR EACH ROW EXECUTE FUNCTION enforce_user_subtype('STUDENT');

CREATE TRIGGER faculty_user_type_trigger
BEFORE INSERT OR UPDATE ON faculty
FOR EACH ROW EXECUTE FUNCTION enforce_user_subtype('FACULTY');

CREATE TRIGGER admin_user_type_trigger
BEFORE INSERT OR UPDATE ON admin_user
FOR EACH ROW EXECUTE FUNCTION enforce_user_subtype('ADMIN');

CREATE OR REPLACE FUNCTION validate_component_weightage()
RETURNS TRIGGER AS $$
DECLARE
    target_offering BIGINT;
    total_weight NUMERIC(7,2);
BEGIN
    target_offering := COALESCE(NEW.offering_id, OLD.offering_id);

    SELECT COALESCE(SUM(weightage), 0)
    INTO total_weight
    FROM assessment_component
    WHERE offering_id = target_offering;

    IF total_weight > 100 THEN
        RAISE EXCEPTION 'Total assessment weightage for offering % cannot exceed 100', target_offering;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessment_component_weightage_trigger
AFTER INSERT OR UPDATE OR DELETE ON assessment_component
FOR EACH ROW EXECUTE FUNCTION validate_component_weightage();

CREATE OR REPLACE FUNCTION validate_student_marks()
RETURNS TRIGGER AS $$
DECLARE
    component_offering BIGINT;
    enrollment_offering BIGINT;
    component_weight NUMERIC(5,2);
    component_max NUMERIC(6,2);
BEGIN
    SELECT offering_id, weightage, max_marks
    INTO component_offering, component_weight, component_max
    FROM assessment_component
    WHERE component_id = NEW.component_id
    FOR KEY SHARE;

    SELECT offering_id
    INTO enrollment_offering
    FROM enrollment
    WHERE enrollment_id = NEW.enrollment_id
    FOR KEY SHARE;

    IF component_offering IS NULL OR enrollment_offering IS NULL THEN
        RAISE EXCEPTION 'Invalid enrollment/component reference in student_marks';
    END IF;

    IF component_offering <> enrollment_offering THEN
        RAISE EXCEPTION 'Enrollment % does not belong to offering for component %', NEW.enrollment_id, NEW.component_id;
    END IF;

    IF NEW.marks_obtained > component_max THEN
        RAISE EXCEPTION 'Marks %.2f exceed max marks %.2f for component %', NEW.marks_obtained, component_max, NEW.component_id;
    END IF;

    NEW.weighted_marks := ROUND((NEW.marks_obtained / component_max) * component_weight, 2);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_marks_validation_trigger
BEFORE INSERT OR UPDATE ON student_marks
FOR EACH ROW EXECUTE FUNCTION validate_student_marks();

CREATE INDEX idx_app_user_type ON app_user(user_type);
CREATE INDEX idx_student_program ON student(program_id);
CREATE INDEX idx_course_program_sem ON course(program_id, semester_no);
CREATE INDEX idx_course_offering_course_year ON course_offering(course_id, academic_year);
CREATE INDEX idx_enrollment_student ON enrollment(student_id);
CREATE INDEX idx_enrollment_offering ON enrollment(offering_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_assessment_offering ON assessment_component(offering_id);
CREATE INDEX idx_application_student ON application(student_id);
CREATE INDEX idx_application_offer ON application(offer_id);

COMMIT;
