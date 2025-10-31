/**
 * 개발용 백도어 유틸리티
 * IndexedDB 초기화 및 테스트 기능
 */

// 백도어 비밀번호
const BACKDOOR_PASSWORD = 'lavida1901!';

/**
 * 전체 IndexedDB 삭제
 */
export const deleteAllIndexedDB = async (): Promise<boolean> => {
  try {
    // 현재 데이터베이스 연결 닫기
    const dbName = 'LavidaDB';
    
    // IndexedDB 삭제
    return new Promise((resolve, reject) => {
      const deleteReq = indexedDB.deleteDatabase(dbName);
      
      deleteReq.onerror = () => {
        console.error('IndexedDB 삭제 실패:', deleteReq.error);
        reject(false);
      };
      
      deleteReq.onsuccess = () => {
        console.log('IndexedDB가 성공적으로 삭제되었습니다.');
        resolve(true);
      };
      
      deleteReq.onblocked = () => {
        console.warn('IndexedDB 삭제가 차단되었습니다. 다른 탭을 닫고 다시 시도하세요.');
        // 차단되어도 성공으로 처리 (페이지 새로고침으로 해결 가능)
        resolve(true);
      };
    });
  } catch (error) {
    console.error('IndexedDB 삭제 중 오류:', error);
    return false;
  }
};

/**
 * 백도어 비밀번호 확인 및 DB 삭제
 */
export const executeBackdoor = async (): Promise<void> => {
  const password = prompt('개발자 모드 - 비밀번호를 입력하세요:');
  
  if (password === null) {
    // 취소 버튼 클릭
    return;
  }
  
  if (password !== BACKDOOR_PASSWORD) {
    alert('잘못된 비밀번호입니다.');
    return;
  }
  
  // eslint-disable-next-line no-restricted-globals
  const confirmed = confirm(
    '⚠️ 경고: 모든 데이터가 삭제됩니다.\n\n' +
    '다음 데이터가 영구적으로 삭제됩니다:\n' +
    '• 모든 직원 정보\n' +
    '• 모든 지점 정보\n' +
    '• 시스템 설정\n\n' +
    '정말로 삭제하시겠습니까?'
  );
  
  if (!confirmed) {
    return;
  }
  
  try {
    const success = await deleteAllIndexedDB();
    
    if (success) {
      // localStorage 정리 (중복 방지 플래그 제거)
      localStorage.removeItem('lavida_cleanup_done');
      console.log('🧹 localStorage 정리 완료');
      
      alert(
        '✅ IndexedDB가 성공적으로 삭제되었습니다.\n\n' +
        '페이지를 새로고침하면 시스템 관리자가 자동으로 다시 생성됩니다.'
      );
      
      // 자동으로 페이지 새로고침 (사용자에게 묻지 않고 바로 실행)
      console.log('🔄 페이지를 새로고침하여 시스템을 재초기화합니다...');
      window.location.reload();
    } else {
      alert('❌ IndexedDB 삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('백도어 실행 중 오류:', error);
    alert('❌ 삭제 중 오류가 발생했습니다.');
  }
};

/**
 * 백도어 기능 활성화 (테스트용으로 모든 환경에서 활성화)
 */
export const isBackdoorEnabled = (): boolean => {
  return true; // 배포 환경에서도 테스트할 수 있도록 임시로 활성화
};
