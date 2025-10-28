/**
 * IndexedDB를 활용한 로컬 데이터베이스 관리 유틸리티
 * 
 * ⚠️ 주의: 이 파일은 더 이상 사용되지 않습니다.
 * 새로운 모듈화된 구조를 사용하세요:
 * 
 * import { dbManager } from './db';
 * 
 * 사용 예시:
 * - 지점 관리: dbManager.branch.getAllBranches()
 * - 직원 관리: dbManager.staff.getAllStaff()
 * - 회원 관리: dbManager.member.getAllMembers()
 * - 결제 관리: dbManager.payment.getAllPayments()
 * - 포인트 관리: dbManager.point.getMemberPointBalance()
 * - 수강 관리: dbManager.course.getAllCourseEnrollments()
 * - 약관 관리: dbManager.terms.getAllTermsDocuments()
 * 
 * 기존 호환성을 위해 이 파일은 유지되지만, 
 * 새로운 코드는 모듈화된 구조를 사용하는 것을 권장합니다.
 */

import { dbManager } from './db';

// 기존 호환성을 위한 re-export
export { IndexedDBManager } from './db';
export * from './db/types';

// 기본 export
export { dbManager };

// 기본 export는 dbManager
export default dbManager;
