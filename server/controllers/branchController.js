const Branch = require('../models/Branch');
const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * @desc    모든 지점 조회
 * @route   GET /api/branches
 * @access  Private
 */
const getAllBranches = asyncHandler(async (req, res) => {
  const { isActive, sortBy = 'createdAt', sortOrder = 'asc', page = 1, limit = 50 } = req.query;
  
  // 필터 조건 구성
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  // 정렬 조건 구성
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  // 페이지네이션
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const branches = await Branch.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));
    
  const total = await Branch.countDocuments(filter);
  
  res.status(200).json({
    success: true,
    count: branches.length,
    total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    data: branches
  });
});

/**
 * @desc    활성 지점만 조회
 * @route   GET /api/branches/active
 * @access  Private
 */
const getActiveBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.findActive();
  
  res.status(200).json({
    success: true,
    count: branches.length,
    data: branches
  });
});

/**
 * @desc    ID로 지점 조회
 * @route   GET /api/branches/:id
 * @access  Private
 */
const getBranchById = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  
  if (!branch) {
    throw new AppError('지점을 찾을 수 없습니다', 404);
  }
  
  res.status(200).json({
    success: true,
    data: branch
  });
});

/**
 * @desc    지점명으로 검색
 * @route   GET /api/branches/search/:name
 * @access  Private
 */
const searchBranchesByName = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const { isActive } = req.query;
  
  const filter = {
    name: { $regex: name, $options: 'i' } // 대소문자 구분 없이 검색
  };
  
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  const branches = await Branch.find(filter).sort({ name: 1 });
  
  res.status(200).json({
    success: true,
    count: branches.length,
    data: branches
  });
});

/**
 * @desc    지점 생성
 * @route   POST /api/branches
 * @access  Private
 */
const createBranch = asyncHandler(async (req, res) => {
  // 유효성 검사 에러 체크
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('입력 데이터가 유효하지 않습니다', 400, errors.array());
  }
  
  const { name, address, phone, isActive = true } = req.body;
  
  const branch = await Branch.create({
    name: name.trim(),
    address: address?.trim(),
    phone: phone?.trim(),
    isActive
  });
  
  res.status(201).json({
    success: true,
    message: '지점이 성공적으로 생성되었습니다',
    data: branch
  });
});

/**
 * @desc    지점 수정
 * @route   PUT /api/branches/:id
 * @access  Private
 */
const updateBranch = asyncHandler(async (req, res) => {
  // 유효성 검사 에러 체크
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('입력 데이터가 유효하지 않습니다', 400, errors.array());
  }
  
  const { name, address, phone, isActive } = req.body;
  
  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (address !== undefined) updateData.address = address?.trim();
  if (phone !== undefined) updateData.phone = phone?.trim();
  if (isActive !== undefined) updateData.isActive = isActive;
  
  const branch = await Branch.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true, // 수정된 문서 반환
      runValidators: true // 스키마 유효성 검사 실행
    }
  );
  
  if (!branch) {
    throw new AppError('지점을 찾을 수 없습니다', 404);
  }
  
  res.status(200).json({
    success: true,
    message: '지점이 성공적으로 수정되었습니다',
    data: branch
  });
});

/**
 * @desc    지점 삭제
 * @route   DELETE /api/branches/:id
 * @access  Private
 */
const deleteBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  
  if (!branch) {
    throw new AppError('지점을 찾을 수 없습니다', 404);
  }
  
  // 관련 데이터 체크 (실제 구현에서는 직원, 회원 등이 있는지 확인)
  // const hasRelatedData = await checkRelatedData(branch._id);
  // if (hasRelatedData) {
  //   throw new AppError('관련 데이터가 있는 지점은 삭제할 수 없습니다', 400);
  // }
  
  await branch.deleteOne();
  
  res.status(200).json({
    success: true,
    message: '지점이 성공적으로 삭제되었습니다',
    data: { id: req.params.id }
  });
});

/**
 * @desc    지점 활성/비활성 토글
 * @route   PATCH /api/branches/:id/toggle-status
 * @access  Private
 */
const toggleBranchStatus = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  
  if (!branch) {
    throw new AppError('지점을 찾을 수 없습니다', 404);
  }
  
  await branch.toggleActive();
  
  res.status(200).json({
    success: true,
    message: `지점이 ${branch.isActive ? '활성화' : '비활성화'}되었습니다`,
    data: branch
  });
});

/**
 * @desc    지점 통계 조회
 * @route   GET /api/branches/stats
 * @access  Private
 */
const getBranchStats = asyncHandler(async (req, res) => {
  const totalBranches = await Branch.countDocuments();
  const activeBranches = await Branch.countDocuments({ isActive: true });
  const inactiveBranches = await Branch.countDocuments({ isActive: false });
  
  // 최근 생성된 지점들
  const recentBranches = await Branch.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name createdAt isActive');
  
  res.status(200).json({
    success: true,
    data: {
      totalBranches,
      activeBranches,
      inactiveBranches,
      recentBranches
    }
  });
});

module.exports = {
  getAllBranches,
  getActiveBranches,
  getBranchById,
  searchBranchesByName,
  createBranch,
  updateBranch,
  deleteBranch,
  toggleBranchStatus,
  getBranchStats
};