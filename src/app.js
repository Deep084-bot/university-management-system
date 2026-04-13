const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const expressLayouts = require('express-ejs-layouts');
const morgan = require('morgan');

const env = require('./config/env');
const { pool } = require('./config/db');
const flashMiddleware = require('./middleware/flash');
const { ensureAuthenticated, enforcePasswordChange } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const placementRoutes = require('./routes/placementRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

if (env.trustProxy) {
  app.set('trust proxy', 1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

app.use(expressLayouts);
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true
    }),
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production'
    }
  })
);
app.use(flashMiddleware);
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentAcademicYear = env.currentAcademicYear;
  res.locals.currentSemester = env.currentSemester;
  next();
});
app.use(enforcePasswordChange);

app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  return res.redirect('/dashboard');
});

app.use('/', authRoutes);
app.use('/dashboard', ensureAuthenticated, dashboardRoutes);
app.use('/student', studentRoutes);
app.use('/faculty', facultyRoutes);
app.use('/placements', placementRoutes);
app.use('/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;