/**
 * 비동기 함수의 에러를 처리하는 래퍼 함수
 * try-catch 블록을 반복해서 쓰지 않기 위해 사용
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;