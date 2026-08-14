class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function logError(err, req) {
  var timestamp = new Date().toISOString();
  var requestId = req ? (req.id || 'unknown') : 'system';
  var logEntry = {
    timestamp: timestamp,
    requestId: requestId,
    level: 'ERROR',
    name: err.name || 'Error',
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
  };
  if (req) {
    logEntry.method = req.method;
    logEntry.path = req.originalUrl || req.url;
    logEntry.ip = req.ip;
    logEntry.userId = req.user ? req.user.id : undefined;
  }
  if (process.env.NODE_ENV !== 'production') {
    logEntry.stack = err.stack;
  }
  console.error(JSON.stringify(logEntry));
}

function errorHandler(err, req, res, _next) {
  var requestId = req.id || 'req-' + Date.now();

  logError(err, req);

  if (err.name === 'ValidationError' && err.isJoi) {
    var details = err.details ? err.details.map(function (d) {
      return { field: d.path.join('.'), message: d.message };
    }) : [];
    return res.status(422).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      requestId: requestId,
      errors: details,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
      requestId: requestId,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
      requestId: requestId,
    });
  }

  if (err.name === 'MulterError') {
    var message = 'File upload error';
    var statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
      statusCode = 413;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
    }
    return res.status(statusCode).json({
      message: message,
      code: err.code,
      requestId: requestId,
    });
  }

  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      message: 'Malformed request body',
      code: 'BAD_REQUEST',
      requestId: requestId,
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Request body too large',
      code: 'PAYLOAD_TOO_LARGE',
      requestId: requestId,
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      message: err.message,
      code: err.code || 'ERROR',
      requestId: requestId,
    });
  }

  var finalStatus = err.status || err.statusCode || 500;
  res.status(finalStatus).json({
    message: finalStatus === 500
      ? (process.env.NODE_ENV !== 'production' ? err.message || 'Internal server error' : 'Internal server error')
      : (err.message || 'Request failed'),
    code: err.code || (finalStatus >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
    requestId: requestId,
  });
}

module.exports = errorHandler;
module.exports.AppError = AppError;
