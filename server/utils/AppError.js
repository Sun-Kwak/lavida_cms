/**
 * 커스텀 에러 클래스
 * Express 에러 핸들링을 위한 표준화된 에러 객체
 */
class AppError extends Error {
  constructor(message, statusCode, validationErrors = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.validationErrors = validationErrors;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;