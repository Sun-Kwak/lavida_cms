/**
 * 시스템 초기화 관련 유틸리티
 * 시스템 관리자 자동 생성 및 초기 설정
 */

import { dbManager } from './indexedDB';
import { SYSTEM_ADMIN_CONFIG } from '../constants/staffConstants';

/**
 * 중복된 '전체' 지점 정리
 * 여러 개의 '전체' 지점이 있을 경우 가장 오래된 것만 남기고 나머지 삭제
 */
export const cleanupDuplicateBranches = async (): Promise<void> => {
  try {
    const allBranches = await dbManager.getAllBranches();
    const allBranches전체 = allBranches.filter(branch => branch.name === '전체');
    
    if (allBranches전체.length > 1) {
      console.log(`중복된 '전체' 지점 ${allBranches전체.length}개 발견, 정리를 시작합니다.`);
      
      // 가장 오래된 지점 (첫 번째로 생성된 지점) 찾기
      const oldestBranch = allBranches전체.reduce((oldest, current) => 
        oldest.createdAt < current.createdAt ? oldest : current
      );
      
      // 가장 오래된 지점을 제외한 나머지 삭제
      for (const branch of allBranches전체) {
        if (branch.id !== oldestBranch.id) {
          console.log(`중복된 '전체' 지점 삭제: ${branch.id}`);
          await dbManager.deleteBranch(branch.id);
        }
      }
      
      console.log(`'전체' 지점 정리 완료. 남은 지점: ${oldestBranch.id}`);
    }
  } catch (error) {
    console.error('중복 지점 정리 실패:', error);
  }
};

/**
 * 시스템 관리자 계정 자동 생성
 * 시스템 최초 실행 시 또는 시스템 관리자가 없을 때 호출
 */
export const initializeSystemAdmin = async (): Promise<boolean> => {
  try {
    console.log('🔍 시스템 관리자 존재 여부 확인 중...');
    
    // 이미 시스템 관리자가 존재하는지 확인
    const existingAdmin = await dbManager.getStaffByLoginId(SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID);
    
    if (existingAdmin) {
      // 이미 시스템 관리자가 존재함
      console.log('✅ 시스템 관리자가 이미 존재합니다.');
      return false;
    }

    console.log('📋 시스템 관리자가 없습니다. 새로 생성합니다...');
    
    // IndexedDB 연결 상태 확인
    await ensureDatabaseConnection();
    
    // '전체' 지점 확인 또는 생성 (원자적 처리로 중복 방지)
    console.log("🏢 '전체' 지점을 확인하거나 생성합니다...");
    const defaultBranch = await dbManager.getOrCreateBranchByName('전체', {
      address: '',
      phone: '',
      isActive: true
    });
    console.log("✅ '전체' 지점 처리 완료:", defaultBranch.id);

    // '전체' 지점에 기본 추천 포인트 설정 생성
    console.log("🎁 '전체' 지점 기본 추천 포인트 설정을 확인합니다...");
    const existingReferralSettings = await dbManager.referralPoint.getReferralPointSettingsByBranchId(defaultBranch.id);
    
    if (!existingReferralSettings) {
      await dbManager.referralPoint.addReferralPointSettings({
        branchId: defaultBranch.id,
        branchName: '전체',
        referrerPoints: 40000, // 추천한 사람 기본 40,000P (기존 하드코딩 값)
        referredPoints: 35000, // 추천받은 사람 기본 35,000P (기존 하드코딩 값)
        isActive: true,
      });
      console.log("✅ '전체' 지점 기본 추천 포인트 설정 생성 완료 (40,000P / 35,000P)");
    } else {
      console.log("✅ '전체' 지점 추천 포인트 설정이 이미 존재합니다.");
    }

    // 시스템 관리자 계정 생성
    console.log('👤 시스템 관리자 계정을 생성합니다...');
    await dbManager.addStaff({
      name: SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_DISPLAY_NAME,
      loginId: SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID,
      password: SYSTEM_ADMIN_CONFIG.TEMP_PASSWORD,
      email: SYSTEM_ADMIN_CONFIG.DEFAULT_EMAIL,
      phone: SYSTEM_ADMIN_CONFIG.DEFAULT_PHONE,
      branchId: defaultBranch.id, // 찾은 또는 생성된 '전체' 지점 사용
      position: SYSTEM_ADMIN_CONFIG.DEFAULT_POSITION,
      role: '센터장',
      employmentType: '정규직',
      permission: 'MASTER',
      contractStartDate: new Date(),
      contractEndDate: null, // 정규직이므로 계약종료일 없음
      isActive: true, // 시스템 관리자는 기본적으로 활성 상태
    });

    console.log('🎉 시스템 관리자 계정이 성공적으로 생성되었습니다!');
    
    // 생성 확인
    const verifyAdmin = await dbManager.getStaffByLoginId(SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID);
    if (verifyAdmin) {
      console.log('✅ 시스템 관리자 생성 검증 완료:', verifyAdmin.name);
      return true; // 새로운 계정이 생성됨
    } else {
      console.error('❌ 시스템 관리자 생성 검증 실패');
      return false;
    }
  } catch (error) {
    console.error('❌ 시스템 관리자 초기화 실패:', error);
    return false;
  }
};

/**
 * IndexedDB 연결이 확실히 준비되었는지 확인
 */
const ensureDatabaseConnection = async (): Promise<void> => {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      // 간단한 연결 테스트
      await dbManager.getAllBranches();
      console.log('✅ IndexedDB 연결 확인됨');
      return;
    } catch (error) {
      attempts++;
      console.log(`🔄 IndexedDB 연결 재시도... (${attempts}/${maxAttempts})`);
      
      if (attempts >= maxAttempts) {
        throw new Error('IndexedDB 연결에 실패했습니다');
      }
      
      // 500ms 대기 후 재시도
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
};/**
 * 시스템이 초기 설정 상태인지 확인 (더 이상 모달 팝업용으로 사용하지 않음)
 * - 시스템 관리자가 기본 정보를 사용하고 있는지 확인
 * - 이제 단순 정보 확인용으로만 사용
 */
export const isSystemInInitialState = async (): Promise<boolean> => {
  try {
    const systemAdmin = await dbManager.getStaffByLoginId(SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID);
    
    if (!systemAdmin) {
      return true; // 시스템 관리자가 없으면 초기 상태
    }
    
    // 설정된 기본 정보를 사용하고 있는지 확인 (정보용으로만 사용)
    const hasDefaultEmail = systemAdmin.email === SYSTEM_ADMIN_CONFIG.DEFAULT_EMAIL;
    const hasDefaultPhone = systemAdmin.phone === SYSTEM_ADMIN_CONFIG.DEFAULT_PHONE;
    
    return hasDefaultEmail && hasDefaultPhone;
  } catch (error) {
    console.error('시스템 초기 상태 확인 실패:', error);
    return true; // 오류 시 초기 상태로 간주
  }
};

/**
 * 시스템 초기 설정 완료 처리
 * 시스템 관리자가 정보를 업데이트했을 때 호출
 */
export const markSystemInitialized = async (): Promise<void> => {
  // 현재는 별도 플래그 없이 시스템 관리자 정보로만 판단
  // 필요시 localStorage 또는 별도 설정 테이블 사용 가능
};

/**
 * 시스템 최초 실행 시 자동 초기화
 * App.tsx에서 호출하여 시스템 관리자가 없으면 자동 생성
 */
export const autoInitializeSystem = async (): Promise<void> => {
  try {
    console.log('🚀 시스템 자동 초기화를 시작합니다...');
    
    // 먼저 기존 중복 데이터 정리 (한 번만 실행)
    if (!localStorage.getItem('lavida_cleanup_done')) {
      console.log('🧹 중복 데이터 정리를 시작합니다...');
      await cleanupDuplicateBranches();
      localStorage.setItem('lavida_cleanup_done', 'true');
      console.log('✅ 중복 데이터 정리 완료');
    }
    
    // 시스템 관리자 초기화
    const adminCreated = await initializeSystemAdmin();
    
    if (adminCreated) {
      console.log('🎉 새로운 시스템 관리자가 생성되었습니다!');
    } else {
      console.log('ℹ️ 시스템 관리자가 이미 존재하거나 생성에 실패했습니다.');
    }
    
    console.log('✅ 시스템 자동 초기화 완료');
  } catch (error) {
    console.error('❌ 시스템 자동 초기화 실패:', error);
    
    // 재시도 로직 (한 번만)
    try {
      console.log('🔄 시스템 초기화 재시도...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      await initializeSystemAdmin();
      console.log('✅ 재시도로 시스템 초기화 성공');
    } catch (retryError) {
      console.error('❌ 재시도도 실패:', retryError);
    }
  }
};
