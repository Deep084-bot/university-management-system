const authService = require('../services/authService');

async function showLogin(req, res) {
  return res.render('auth/login', {
    title: 'Sign In'
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await authService.authenticate(email, password);

  req.session.user = user;

  if (user.must_change_password && ['STUDENT', 'FACULTY'].includes(user.user_type)) {
    req.flash('success', `Welcome, ${user.name}. Please change your password to continue.`);
    return res.redirect('/change-password');
  }

  req.flash('success', `Welcome back, ${user.name}.`);
  return res.redirect('/dashboard');
}

async function showChangePassword(req, res) {
  return res.render('auth/change-password', {
    title: 'Change Password'
  });
}

async function updatePassword(req, res) {
  const { newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    req.flash('error', 'Password confirmation does not match.');
    return res.redirect('/change-password');
  }

  await authService.changePassword(req.session.user.user_id, newPassword);
  req.session.user.must_change_password = false;

  req.flash('success', 'Password updated successfully.');
  return res.redirect('/dashboard');
}

async function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

module.exports = {
  showLogin,
  login,
  showChangePassword,
  updatePassword,
  logout
};
