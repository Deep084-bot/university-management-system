const { query } = require('../config/db');

async function findByEmail(email) {
  const result = await query(
    `
      SELECT
        u.user_id,
        u.name,
        u.email,
        u.phone,
        u.dob,
        u.gender,
        u.password,
        u.user_type,
        s.roll_number,
        s.program_id,
        s.current_semester,
        f.department_id AS faculty_department_id,
        f.employee_code,
        f.designation,
        a.admin_code,
        a.role_title
      FROM app_user u
      LEFT JOIN student s ON s.user_id = u.user_id
      LEFT JOIN faculty f ON f.user_id = u.user_id
      LEFT JOIN admin_user a ON a.user_id = u.user_id
      WHERE u.email = $1
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function findById(userId) {
  const result = await query(
    `
      SELECT
        u.user_id,
        u.name,
        u.email,
        u.phone,
        u.dob,
        u.gender,
        u.user_type,
        s.roll_number,
        s.program_id,
        s.current_semester,
        f.department_id AS faculty_department_id,
        f.employee_code,
        f.designation,
        a.admin_code,
        a.role_title
      FROM app_user u
      LEFT JOIN student s ON s.user_id = u.user_id
      LEFT JOIN faculty f ON f.user_id = u.user_id
      LEFT JOIN admin_user a ON a.user_id = u.user_id
      WHERE u.user_id = $1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

module.exports = {
  findByEmail,
  findById
};
