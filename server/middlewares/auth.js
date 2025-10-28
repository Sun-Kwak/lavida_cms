const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * JWT 토큰 검증 미들웨어
 */
const auth = asyncHandler(async (req, res, next) => {
  let token;

  // 헤더에서 토큰 추출
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 토큰이 없는 경우
  if (!token) {
    throw new AppError('접근 권한이 없습니다. 로그인이 필요합니다.', 401);
  }

  try {
    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 여기서 실제로는 데이터베이스에서 사용자 정보를 조회해야 함
    // const user = await User.findById(decoded.id);
    // if (!user) {
    //   throw new AppError('토큰에 해당하는 사용자를 찾을 수 없습니다', 401);
    // }
    
    req.user = decoded;
    next();
  } catch (error) {
    throw new AppError('유효하지 않은 토큰입니다', 401);
  }
});

/**
 * 역할 기반 접근 제어 미들웨어
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('이 작업을 수행할 권한이 없습니다', 403);
    }

    next();
  };
};

/**
 * 관리자 권한 확인 미들웨어
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('관리자 권한이 필요합니다', 403);
  }
  next();
};

/**
 * 지점 접근 권한 확인 미들웨어
 */
const checkBranchAccess = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // 관리자는 모든 지점에 접근 가능
  if (req.user.role === 'admin') {
    return next();
  }
  
  // 일반 사용자는 자신의 지점만 접근 가능
  if (req.user.branchId !== id) {
    throw new AppError('해당 지점에 접근할 권한이 없습니다', 403);
  }
  
  next();
});

module.exports = {
  auth,
  authorize,
  requireAdmin,
  checkBranchAccess
};