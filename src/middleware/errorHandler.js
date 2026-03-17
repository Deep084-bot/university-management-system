function notFoundHandler(req, res) {
  res.status(404).render('error', {
    title: 'Not Found',
    error: {
      statusCode: 404,
      message: 'The requested page could not be found.'
    }
  });
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  if (res.headersSent) {
    return next(error);
  }

  res.status(statusCode).render('error', {
    title: 'Application Error',
    error: {
      statusCode,
      message: error.message || 'An unexpected error occurred.'
    }
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
