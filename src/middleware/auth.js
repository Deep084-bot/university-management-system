function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Please sign in to continue.');
    return res.redirect('/login');
  }

  return next();
}

function ensureGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  return next();
}

function ensureRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.session.user) {
      req.flash('error', 'Please sign in to continue.');
      return res.redirect('/login');
    }

    if (!roles.includes(req.session.user.user_type)) {
      req.flash('error', 'You do not have permission to access that page.');
      return res.redirect('/dashboard');
    }

    return next();
  };
}

function enforcePasswordChange(req, res, next) {
  const user = req.session.user;

  if (!user) {
    return next();
  }

  if (!['STUDENT', 'FACULTY'].includes(user.user_type)) {
    return next();
  }

  if (!user.must_change_password) {
    return next();
  }

  if (req.path === '/change-password' || req.path === '/logout') {
    return next();
  }

  req.flash('error', 'Please change your password before continuing.');
  return res.redirect('/change-password');
}

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  ensureRole,
  enforcePasswordChange
};
