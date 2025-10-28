const { body, param, query } = require('express-validator');

/**
 * 지점 생성 시 유효성 검사
 */
const validateBranch = [
  body('name')
    .notEmpty()
    .withMessage('지점명은 필수입니다')
    .isLength({ min: 1, max: 100 })
    .withMessage('지점명은 1자 이상 100자 이하여야 합니다')
    .trim(),
    
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('주소는 500자를 초과할 수 없습니다')
    .trim(),
    
  body('phone')
    .optional()
    .matches(/^[\d-+().\s]+$/)
    .withMessage('올바른 전화번호 형식이 아닙니다')
    .trim(),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive는 boolean 값이어야 합니다')
];

/**
 * 지점 수정 시 유효성 검사
 */
const validateBranchUpdate = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('지점명은 빈 값일 수 없습니다')
    .isLength({ min: 1, max: 100 })
    .withMessage('지점명은 1자 이상 100자 이하여야 합니다')
    .trim(),
    
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('주소는 500자를 초과할 수 없습니다')
    .trim(),
    
  body('phone')
    .optional()
    .matches(/^[\d-+().\s]+$/)
    .withMessage('올바른 전화번호 형식이 아닙니다')
    .trim(),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive는 boolean 값이어야 합니다')
];

/**
 * MongoDB ObjectId 유효성 검사
 */
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('올바른 ID 형식이 아닙니다')
];

/**
 * 쿼리 파라미터 유효성 검사
 */
const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지는 1 이상의 정수여야 합니다'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit은 1 이상 100 이하의 정수여야 합니다'),
    
  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt', 'isActive'])
    .withMessage('정렬 기준이 유효하지 않습니다'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('정렬 순서는 asc 또는 desc여야 합니다'),
    
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive는 true 또는 false여야 합니다')
];

/**
 * 검색어 유효성 검사
 */
const validateSearch = [
  param('name')
    .notEmpty()
    .withMessage('검색어는 필수입니다')
    .isLength({ min: 1, max: 100 })
    .withMessage('검색어는 1자 이상 100자 이하여야 합니다')
    .trim()
];

module.exports = {
  validateBranch,
  validateBranchUpdate,
  validateObjectId,
  validateQuery,
  validateSearch
};