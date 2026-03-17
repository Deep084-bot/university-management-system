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
  req.flash('success', `Welcome back, ${user.name}.`);
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
  logout
};
