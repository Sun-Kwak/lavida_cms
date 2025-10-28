import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import UserPage from './pages/UserPage';
import CMSRoutes from './pages/CMS';
import ExercisePrescriptionPage from './pages/ExercisePrescriptionPage';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { DeviceProvider } from './context/DeviceContext';
import { autoInitializeSystem } from './utils/systemInit';
import { dbManager } from './utils/indexedDB';

// 개발 환경에서 IndexedDB 개발자 도구 활성화
if (process.env.NODE_ENV === 'development') {
  import('./utils/devDBUtils');
}

function App() {
  // 앱 시작 시 시스템 초기화
  useEffect(() => {
    const initSystem = async () => {
      try {
        console.log('🚀 App 시작: 시스템 초기화를 시작합니다...');
        
        // IndexedDB가 완전히 초기화될 때까지 대기
        await waitForDatabase();
        
        // 시스템 초기화 (시스템 관리자 자동 생성)
        console.log('📊 시스템 관리자 자동 생성을 시작합니다...');
        await autoInitializeSystem();
        
        console.log('✅ 시스템 초기화 완료');
      } catch (error) {
        console.error('❌ 시스템 초기화 실패:', error);
      }
    };
    
    initSystem();
  }, []);

  /**
   * IndexedDB가 완전히 준비될 때까지 대기
   */
  const waitForDatabase = async (): Promise<void> => {
    let attempts = 0;
    const maxAttempts = 10; // 시도 횟수 줄임
    
    while (attempts < maxAttempts) {
      try {
        // IndexedDB 연결 테스트 - 더 간단한 테스트
        const allBranches = await dbManager.getAllBranches();
        console.log('✅ IndexedDB 연결 확인 완료, 지점 수:', allBranches.length);
        return;
      } catch (error) {
        attempts++;
        console.log(`🔄 IndexedDB 연결 대기 중... (${attempts}/${maxAttempts})`);
        
        if (attempts >= maxAttempts) {
          console.warn('⚠️ IndexedDB 연결 대기 시간 초과, 계속 진행합니다...');
          return; // 실패해도 계속 진행
        }
        
        // 대기 시간을 점진적으로 증가
        const waitTime = Math.min(500 * attempts, 2000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };

  return (
    <AdminAuthProvider>
      <DeviceProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* 루트 경로: 사용자 화면 */}
              <Route path="/" element={<UserPage />} />
              
              {/* 운동처방 페이지 */}
              <Route path="/exercise-prescription" element={<ExercisePrescriptionPage />} />
              
              {/* CMS 경로들 */}
              <Route path="/cms/*" element={<CMSRoutes />} />
            </Routes>
            
            {/* Toast 알림 컨테이너 */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </Router>
      </DeviceProvider>
    </AdminAuthProvider>
  );
}

export default App;
