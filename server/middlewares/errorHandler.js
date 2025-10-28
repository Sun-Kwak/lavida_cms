const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 콘솔에 에러 로그 출력
  console.error('Error:', err);

  // Mongoose 잘못된 ObjectId 에러
  if (err.name === 'CastError') {
    const message = '잘못된 리소스 ID입니다';
    error = new AppError(message, 400);
  }

  // Mongoose 중복 키 에러
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    let message = '';
    
    switch (field) {
      case 'name':
        message = '이미 존재하는 지점명입니다';
        break;
      default:
        message = '중복된 데이터입니다';
    }
    
    error = new AppError(message, 400);
  }

  // Mongoose 유효성 검사 에러
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = messages.join(', ');
    error = new AppError(message, 400);
  }

  // JWT 에러
  if (err.name === 'JsonWebTokenError') {
    const message = '유효하지 않은 토큰입니다';
    error = new AppError(message, 401);
  }

  // JWT 만료 에러
  if (err.name === 'TokenExpiredError') {
    const message = '토큰이 만료되었습니다';
    error = new AppError(message, 401);
  }

  // 응답 구조
  const response = {
    success: false,
    message: error.message || '서버 내부 오류가 발생했습니다',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  };

  // 유효성 검사 에러의 경우 상세 정보 추가
  if (error.validationErrors) {
    response.validationErrors = error.validationErrors;
  }

  res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;