const bcrypt = require('bcryptjs');

const userModel = require('../models/userModel');
const { query } = require('../config/db');
const ServiceError = require('./serviceError');

async function authenticate(email, password) {
  const user = await userModel.findByEmail(email);

  if (!user) {
    throw new ServiceError('Invalid email or password.', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new ServiceError('Invalid email or password.', 401);
  }

  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    user_type: user.user_type,
    must_change_password: user.must_change_password,
    roll_number: user.roll_number || null,
    employee_code: user.employee_code || null,
    admin_code: user.admin_role || null,
    admin_role: user.admin_role || null
  };
}

async function changePassword(userId, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new ServiceError('Password must be at least 8 characters long.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await query(
    `
      UPDATE app_user
      SET password = $2,
          must_change_password = FALSE
      WHERE user_id = $1
    `,
    [userId, passwordHash]
  );

  await query(
    `
      UPDATE credential_issuance_log
      SET is_active = FALSE,
          consumed_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
        AND is_active = TRUE
    `,
    [userId]
  );
}

module.exports = {
  authenticate,
  changePassword
};
