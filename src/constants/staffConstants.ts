/**
 * 직원 관련 상수 데이터
 * 설정에서 관리되는 고정값들
 */

// 직급 목록 (PositionTable.tsx 참조)
export const POSITIONS = [
  '대표',
  '이사',
  '부장',
  '차장',
  '과장',
  '대리',
  '사원',
  '인턴'
] as const;

// 직책 목록 (RoleTable.tsx 참조)
export const ROLES = [
  '센터장',
  '팀장',
  '코치',
  '본부장',
  '실장'
] as const;

// 고용형태 목록 (EmploymentTypeTable.tsx 참조)
export const EMPLOYMENT_TYPES = [
  '정규직',
  '계약직',
  '프리랜서'
] as const;

// 권한 목록 (PermissionTable.tsx 참조)
export const PERMISSIONS = [
  { value: 'MASTER', label: 'MASTER', description: '모든 기능 접근 및 수정 가능' },
  { value: 'EDITOR', label: 'EDITOR', description: '소속 지점 데이터 편집 및 조회 가능' },
  { value: 'VIEWER', label: 'VIEWER', description: '소속 지점 데이터 조회만 가능' }
] as const;

// 시스템 관리자 설정
export const SYSTEM_ADMIN_CONFIG = {
  // 시스템 관리자 로그인 ID (절대 삭제/권한변경 불가)
  SYSTEM_ADMIN_LOGIN_ID: 'master01',
  // 시스템 관리자 계정 표시명
  SYSTEM_ADMIN_DISPLAY_NAME: '임성근',
  // 시스템 관리자 임시 비밀번호 (최초 생성 시)
  TEMP_PASSWORD: 'lavida1901!',
  // 시스템 관리자 기본 정보
  DEFAULT_EMAIL: 'sg.lim@theprimavera.co.kr',
  DEFAULT_PHONE: '010-3759-6790',
  DEFAULT_POSITION: '대표'
} as const;

// 타입 정의
export type Position = typeof POSITIONS[number];
export type Role = typeof ROLES[number];
export type EmploymentType = typeof EMPLOYMENT_TYPES[number];
export type Permission = typeof PERMISSIONS[number]['value'];
