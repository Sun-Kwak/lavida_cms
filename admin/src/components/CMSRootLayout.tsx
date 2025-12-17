import React, { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import CMSAppBar from './CMSAppBar';
import { AppColors } from '../styles/colors';

// 전체 CMS를 감싸는 최소 너비 컨테이너
const CMSContainer = styled.div`
  min-width: 1200px;
  width: 100%;
`;

const LayoutContainer = styled.div`
  min-height: 100vh;
  background-color: ${AppColors.background};
  width: 100%;
`;

const ContentContainer = styled.main<{ $appBarHeight?: number }>`
  /* 앱바 높이를 고려한 정확한 높이 계산 */
  height: ${props => `calc(100vh - ${props.$appBarHeight || 124}px)`};
  padding-left: 0; /* 사이드바가 없으므로 좌측 패딩 제거 */
  padding-right: 0; /* 우측 패딩도 제거하여 전체 너비 활용 */
  padding-bottom: 0; /* 하단 패딩 제거하여 스크롤 방지 */
  width: 100%;
  transition: all 0.2s ease; /* 부드러운 트랜지션 추가 */
  overflow-y: auto; /* 필요시에만 스크롤 */
`;

const ContentWrapper = styled.div`
  width: 100%; /* 전체 너비 사용 */
  padding: 24px; /* 내부 콘텐츠 여백은 여기서 처리 */
  box-sizing: border-box; /* 패딩이 너비에 포함되도록 */
  transition: all 0.2s ease; /* 부드러운 트랜지션 추가 */
  height: 100%; /* 부모 컨테이너의 전체 높이 사용 */
  overflow-y: auto; /* 콘텐츠가 넘치면 스크롤 */
`;

interface CMSRootLayoutProps {
  children: React.ReactNode;
}

// 전역 프로그램 새로고침 함수를 저장할 변수
let globalProgramRefreshFunction: (() => Promise<void>) | null = null;

// 외부에서 프로그램 목록을 새로고침할 수 있는 유틸리티 함수
export const refreshProgramsInNavigation = async () => {
  if (globalProgramRefreshFunction) {
    try {
      await (globalProgramRefreshFunction as () => Promise<void>)();
    } catch (error) {
      console.error('프로그램 네비게이션 새로고침 실패:', error);
    }
  }
};

const CMSRootLayout: React.FC<CMSRootLayoutProps> = React.memo(({ children }) => {
  const location = useLocation();
  
  // 로그인 페이지인지 확인
  const isLoginPage = location.pathname === '/cms/login';
  
  // 프로그램 새로고침 함수를 전역 변수에 저장
  const handleProgramRefresh = useCallback((refreshFunction: () => Promise<void>) => {
    globalProgramRefreshFunction = refreshFunction;
  }, []);

  // 앱바 높이 계산: 기본 TopBar 64px + SubMenu 있을 때 약 60px
  const calculateAppBarHeight = () => {
    // 현재 경로에 따라 서브메뉴 표시 여부 결정
    const hasSubMenu = location.pathname && (
      location.pathname.includes('/cms/staff/') ||
      location.pathname.includes('/cms/member/') ||
      location.pathname.includes('/cms/reservation/') ||
      location.pathname.includes('/cms/program/') ||
      location.pathname.includes('/cms/terms/') ||
      location.pathname.includes('/cms/assets/')
    );
    
    return hasSubMenu ? 124 : 64; // 서브메뉴 있으면 124px, 없으면 64px
  };

  // 로그인 페이지라면 AppBar 없이 children만 렌더링
  if (isLoginPage) {
    return <>{children}</>;
  }

  // 다른 CMS 페이지들은 AppBar와 함께 렌더링
  return (
    <CMSContainer>
      <LayoutContainer>
        <CMSAppBar 
          currentPath={location.pathname}
          onRefreshPrograms={handleProgramRefresh}
        />
        <ContentContainer $appBarHeight={calculateAppBarHeight()}>
          <ContentWrapper>
            {children}
          </ContentWrapper>
        </ContentContainer>
      </LayoutContainer>
    </CMSContainer>
  );
});

CMSRootLayout.displayName = 'CMSRootLayout';

export default CMSRootLayout;
