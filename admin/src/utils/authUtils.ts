/**
 * 권한 관리 유틸리티
 */

import { dbManager } from './indexedDB';

export interface CurrentUser {
  id: string;
  name: string;
  role: 'master' | 'coach' | 'admin';
  permission: string;
}

/**
 * 현재 로그인한 사용자 정보 조회
 */
export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  try {
    const adminId = sessionStorage.getItem('adminId');
    if (!adminId) return null;

    const allStaff = await dbManager.getAllStaff();
    const user = allStaff.find(staff => staff.loginId === adminId);
    
    if (!user) return null;

    // 권한에 따른 role 매핑
    let role: 'master' | 'coach' | 'admin';
    if (user.permission === 'MASTER' || user.permission === 'master' || user.permission === '마스터') {
      role = 'master';
    } else if (user.role === '코치') {
      role = 'coach';
    } else {
      role = 'admin';
    }

    return {
      id: user.id,
      name: user.name,
      role,
      permission: user.permission
    };
  } catch (error) {
    console.error('현재 사용자 정보 조회 실패:', error);
    return null;
  }
};

/**
 * 특정 직원의 휴일설정 권한 체크
 */
export const canEditStaffHoliday = async (targetStaffId: string): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;

    // 마스터 권한은 모든 직원 편집 가능
    if (currentUser.role === 'master') return true;

    // 본인만 편집 가능
    return currentUser.id === targetStaffId;
  } catch (error) {
    console.error('휴일설정 권한 체크 실패:', error);
    return false;
  }
};

/**
 * 여러 직원의 휴일설정 권한 체크
 */
export const canEditMultipleStaffHoliday = async (targetStaffIds: string[]): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;

    // 마스터 권한은 모든 직원 편집 가능
    if (currentUser.role === 'master') return true;

    // 본인만 포함된 경우만 가능
    return targetStaffIds.length === 1 && targetStaffIds[0] === currentUser.id;
  } catch (error) {
    console.error('다중 직원 휴일설정 권한 체크 실패:', error);
    return false;
  }
};

/**
 * 권한별 접근 가능한 직원 목록 조회
 */
export const getAccessibleStaff = async (): Promise<string[]> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];

    // 마스터 권한은 모든 담당 프로그램이 있는 활성 직원
    if (currentUser.role === 'master') {
      const allStaff = await dbManager.getAllStaff();
      return allStaff
        .filter(staff => staff.program && staff.isActive) // 담당 프로그램이 있는 활성 직원
        .map(staff => staff.id);
    }

    // 일반 코치는 본인만
    if (currentUser.role === 'coach') {
      return [currentUser.id];
    }

    return [];
  } catch (error) {
    console.error('접근 가능한 직원 목록 조회 실패:', error);
    return [];
  }
};
