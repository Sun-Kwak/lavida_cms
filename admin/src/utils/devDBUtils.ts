/**
 * 개발자 도구용 IndexedDB 관리 헬퍼
 * 브라우저 콘솔에서 사용할 수 있는 유틸리티 함수들
 */

import { dbManager } from './indexedDB';

// 개발자 도구에서 사용할 수 있는 전역 함수들
export const devDBUtils = {
  // 모든 지점 조회
  async getAllBranches() {
    const branches = await dbManager.getAllBranches();
    console.table(branches);
    return branches;
  },

  // 지점 추가 (개발용)
  async addTestBranch(name: string, address?: string, phone?: string) {
    const result = await dbManager.addBranch({
      name,
      address,
      phone,
      isActive: true,
    });
    console.log('지점 추가됨:', result);
    return result;
  },

  // 지점 삭제
  async deleteBranch(id: string) {
    const result = await dbManager.deleteBranch(id);
    console.log(`지점 ${id} 삭제 ${result ? '성공' : '실패'}`);
    return result;
  },

  // 모든 데이터 삭제 (주의!)
  async clearAll() {
    console.warn('⚠️ 모든 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.');
    await dbManager.clearAllData();
    console.log('모든 데이터가 삭제되었습니다.');
  },

  // 샘플 데이터 재생성 (시스템 관리자 재생성)
  async resetSampleData() {
    await this.clearAll();
    // 시스템 관리자는 autoInitializeSystem에서 자동으로 생성됨
    console.log('데이터가 초기화되었습니다. 페이지를 새로고침하면 시스템 관리자가 자동 생성됩니다.');
  },

  // IndexedDB 상태 확인
  async getDBInfo() {
    const branches = await dbManager.getAllBranches();
    const info = {
      totalBranches: branches.length,
      activeBranches: branches.filter(b => b.isActive).length,
      inactiveBranches: branches.filter(b => !b.isActive).length,
      recentlyAdded: branches
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    };
    console.log('IndexedDB 상태:', info);
    return info;
  },

  // 지점 검색
  async searchBranches(keyword: string) {
    const results = await dbManager.searchBranchesByName(keyword);
    console.log(`"${keyword}" 검색 결과:`, results);
    return results;
  },

  // 대량 데이터 생성 (테스트용)
  async generateTestData(count: number = 10) {
    const testData = [];
    for (let i = 1; i <= count; i++) {
      const branch = await dbManager.addBranch({
        name: `테스트지점${i}`,
        address: `테스트주소${i}`,
        phone: `010-${String(i).padStart(4, '0')}-${String(i).padStart(4, '0')}`,
        isActive: Math.random() > 0.2, // 80% 확률로 활성
      });
      testData.push(branch);
    }
    console.log(`${count}개의 테스트 데이터가 생성되었습니다.`);
    return testData;
  },

  // 데이터 내보내기 (JSON)
  async exportData() {
    const branches = await dbManager.getAllBranches();
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      branches,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lavida-branches-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('데이터가 내보내기되었습니다.');
    return exportData;
  },

  // 사용법 안내
  help() {
    console.log(`
=== Lavida IndexedDB 개발자 도구 ===

사용 가능한 명령어:
- devDB.getAllBranches()          : 모든 지점 조회
- devDB.addTestBranch(name)       : 테스트 지점 추가
- devDB.deleteBranch(id)          : 지점 삭제
- devDB.clearAll()                : 모든 데이터 삭제 (주의!)
- devDB.resetSampleData()         : 샘플 데이터 재생성
- devDB.getDBInfo()               : DB 상태 정보
- devDB.searchBranches(keyword)   : 지점 검색
- devDB.generateTestData(count)   : 테스트 데이터 대량 생성
- devDB.exportData()              : 데이터 JSON 내보내기

예시:
devDB.addTestBranch("신규지점", "서울시 강남구", "02-1234-5678")
devDB.searchBranches("강남")
devDB.generateTestData(5)
    `);
  },
};

// 개발 환경에서만 전역 객체에 추가
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).devDB = devDBUtils;
  
  // 페이지 로드 시 안내 메시지
  console.log(`
🗄️ Lavida IndexedDB 개발자 도구가 활성화되었습니다!
콘솔에서 'devDB.help()'를 입력하여 사용법을 확인하세요.
  `);
}
