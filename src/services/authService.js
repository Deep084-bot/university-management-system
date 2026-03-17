const bcrypt = require('bcryptjs');

const userModel = require('../models/userModel');
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
    roll_number: user.roll_number || null,
    employee_code: user.employee_code || null,
    admin_code: user.admin_code || null
  };
}

module.exports = {
  authenticate
};
