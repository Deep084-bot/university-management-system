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

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  ensureRole
};
