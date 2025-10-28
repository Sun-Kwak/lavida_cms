const express = require('express');
const router = express.Router();
const {
  getAllBranches,
  getActiveBranches,
  getBranchById,
  searchBranchesByName,
  createBranch,
  updateBranch,
  deleteBranch,
  toggleBranchStatus,
  getBranchStats
} = require('../controllers/branchController');

const { validateBranch, validateBranchUpdate } = require('../middlewares/validation');
const auth = require('../middlewares/auth');

// 모든 라우트에 인증 미들웨어 적용 (실제 환경에서)
// router.use(auth);

/**
 * @route   GET /api/branches
 * @desc    모든 지점 조회 (페이지네이션, 필터링, 정렬 지원)
 * @query   isActive, sortBy, sortOrder, page, limit
 */
router.get('/', getAllBranches);

/**
 * @route   GET /api/branches/stats
 * @desc    지점 통계 조회
 */
router.get('/stats', getBranchStats);

/**
 * @route   GET /api/branches/active
 * @desc    활성 지점만 조회
 */
router.get('/active', getActiveBranches);

/**
 * @route   GET /api/branches/search/:name
 * @desc    지점명으로 검색
 * @query   isActive
 */
router.get('/search/:name', searchBranchesByName);

/**
 * @route   GET /api/branches/:id
 * @desc    ID로 지점 조회
 */
router.get('/:id', getBranchById);

/**
 * @route   POST /api/branches
 * @desc    새 지점 생성
 * @body    name(required), address, phone, isActive
 */
router.post('/', validateBranch, createBranch);

/**
 * @route   PUT /api/branches/:id
 * @desc    지점 정보 수정
 * @body    name, address, phone, isActive
 */
router.put('/:id', validateBranchUpdate, updateBranch);

/**
 * @route   PATCH /api/branches/:id/toggle-status
 * @desc    지점 활성/비활성 상태 토글
 */
router.patch('/:id/toggle-status', toggleBranchStatus);

/**
 * @route   DELETE /api/branches/:id
 * @desc    지점 삭제
 */
router.delete('/:id', deleteBranch);

module.exports = router;