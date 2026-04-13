# Smart University Academic & Placement Management System

A full-stack Smart University Academic & Placement Management System built with Node.js, Express.js, EJS, and PostgreSQL. The project uses a BCNF-oriented relational schema with explicit specialization from a common USER supertype into STUDENT, FACULTY, and ADMIN subtypes, and models the academic lifecycle from registration through placements and final outcomes.

## Stack

- PostgreSQL for the normalized relational database and transactional integrity
- Node.js and Express.js for the MVC backend
- EJS for server-rendered frontend views
- `pg` for database access and transaction control
- `cookie-session` for signed cookie-based authentication sessions

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
5. Run the seed step (adds one admin account):
   ```bash
   npm run db:seed
   ```
6. Start the app:
   ```bash
   npm run dev
   ```

## Seeded Admin

- Admin: `admin@sums.edu` / `Admin@123`

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

- `npm run db:schema` and `npm run db:seed` both load the `.env` file through the Node scripts, so you do not need to export `DATABASE_URL` manually in your shell.
- `npm run db:seed` inserts a single admin account by default; add your own fixture data if you want more sample records.
- `CURRENT_ACADEMIC_YEAR` is optional; if you omit it, the app auto-derives academic year from current date.

## Deploy on Vercel

This project is configured to run on Vercel using a serverless Node.js function.

### 1. Push code to GitHub

Commit and push your latest code (including `api/index.js` and `vercel.json`).

### 2. Create a Vercel project

1. Go to Vercel dashboard.
2. Import your GitHub repository.
3. Keep the default build settings (Vercel will use `vercel.json`).

### 3. Add environment variables in Vercel

Add these variables in Project Settings -> Environment Variables:

- `NODE_ENV=production`
- `TRUST_PROXY=true`
- `DATABASE_URL=<your production postgres connection string>`
- `SESSION_SECRET=<a long random secret>`
- `CURRENT_ACADEMIC_YEAR=2025-2026` (optional override)

### 4. Prepare your production database

Run schema and seed scripts against your production database once:

```bash
DATABASE_URL="<your production database url>" npm run db:schema
DATABASE_URL="<your production database url>" npm run db:seed
```

### 5. Deploy

Trigger deployment from Vercel (or push a new commit). After deployment, open your Vercel URL and log in.

### 6. Important production note

Use a strong `SESSION_SECRET` and keep using a persistent hosted PostgreSQL database in production for your application data.
