# Smart University Academic & Placement Management System

A full-stack Smart University Academic & Placement Management System built with Node.js, Express.js, EJS, and PostgreSQL. The project uses a BCNF-oriented relational schema with explicit specialization from a common USER supertype into STUDENT, FACULTY, and ADMIN subtypes, and models the academic lifecycle from registration through placements and final outcomes.

## Stack

- PostgreSQL for the normalized relational database and transactional integrity
- Node.js and Express.js for the MVC backend
- EJS for server-rendered frontend views
- `pg` for database access and transaction control
- `express-session` with `connect-pg-simple` for session-backed authentication

## Project Structure

```text
src/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  views/
public/
  css/
sql/
  schema.sql
  seed.sql
```

## Database Design Highlights

- `app_user` is the identity supertype with common attributes: `user_id`, `name`, `email`, `phone`, `dob`, `gender`, `password`, `user_type`.
- `student`, `faculty`, and `admin_user` use `user_id` as both primary key and foreign key to enforce specialization.
- `grade_scale` removes grade point transitive dependencies from grade records.
- `semester_result` and `final_outcome` store approved historical snapshots without denormalizing the core transactional tables.
- `prerequisite` supports recursive course dependencies using `(course_id, prereq_id)`.
- `assessment_component` and `student_marks` support flexible evaluation structures per offering.
- Triggers enforce subtype integrity, component weight ceilings, and weighted-mark calculation consistency.

## Transaction and Concurrency Controls

The backend routes workflow-critical mutations through PostgreSQL transactions with `SERIALIZABLE` isolation in the service layer.

Covered flows include:

- Course registration with prerequisite validation and attempt-number calculation
- Attendance upserts per enrollment and date
- Component mark entry with trigger-based weighted mark computation
- Final grade publication with grade-scale foreign key enforcement
- Placement applications with eligibility and duplicate-application prevention

## Setup

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env` and update the connection string and session secret.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Apply the schema:
   ```bash
   npm run db:schema
   ```
5. Seed demo data:
   ```bash
   npm run db:seed
   ```
6. Start the app:
   ```bash
   npm run dev
   ```

## Seeded Accounts

- Admin: `admin@sums.edu` / `Admin@123`
- Faculty: `faculty@sums.edu` / `Faculty@123`
- Student: `student@sums.edu` / `Student@123`

## Available Workflows

### Student
- Login and role-based dashboard
- Course registration for current-semester offerings
- Enrollment history and semester results
- Placement board with eligibility-aware applications

### Faculty
- Offering-wise attendance capture
- Assessment component creation
- Marks entry with automatic weighted-mark calculation
- Final grade publication

### Admin
- Company onboarding
- Placement offer creation
- Course offering creation
- Faculty-to-offering assignment
- Snapshot visibility into academic and placement operations

## Notes

- The schema uses `crypt(..., gen_salt('bf'))` in PostgreSQL for seeded password hashes, which are compatible with `bcryptjs` verification in the Node.js app.
- `connect-pg-simple` will create the session table automatically when the app starts.
- The current academic year and semester used by the registration workflow are controlled through environment variables.
