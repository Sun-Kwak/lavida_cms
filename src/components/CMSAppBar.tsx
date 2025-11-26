import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';
import { useAdminAuth } from '../context/AdminAuthContext';
import { executeBackdoor, isBackdoorEnabled } from '../utils/devBackdoor';
import { dbManager } from '../utils/indexedDB';

// 메뉴 카테고리 타입 정의
interface MenuCategoryType {
  id: string;
  title: string;
  subMenus: SubMenu[];
}

interface SubMenu {
  id: string;
  title: string;
  path: string;
}

// 정적 메뉴 데이터 (예약/스케줄 제외)
const staticMenuCategories: MenuCategoryType[] = [
  {
    id: 'staff',
    title: '직원관리',
    subMenus: [
      { id: 'staff-register', title: '신규 등록', path: '/cms/staff/register' },
      { id: 'staff-search', title: '빠른 검색', path: '/cms/staff/search' },
    ],
  },
  {
    id: 'member',
    title: '회원관리',
    subMenus: [
      { id: 'member-register', title: '신규 등록', path: '/cms/member/register' },
      { id: 'member-search', title: '빠른 검색', path: '/cms/member/search' },
      { id: 'member-course-history', title: '수강 이력', path: '/cms/member/course-history' },
      { id: 'member-payment-history', title: '결제 이력', path: '/cms/member/payment-history' },
      { id: 'member-point-history', title: '포인트 이력', path: '/cms/member/point-history' },
      { id: 'member-exercise-prescription-history', title: '운동처방', path: '/cms/member/exercise-prescription-history' },
    ],
  },
  {
    id: 'program',
    title: '프로그램',
    subMenus: [
      { id: 'program-management', title: '프로그램 관리', path: '/cms/program/management' },
    ],
  },
  {
    id: 'terms',
    title: '약관/문서',
    subMenus: [
      { id: 'terms-privacy', title: '개인정보 처리방침', path: '/cms/terms/privacy' },
      { id: 'terms-service', title: '서비스 이용약관', path: '/cms/terms/service' },
      { id: 'terms-membership', title: '회원 이용약관', path: '/cms/terms/membership' },
      { id: 'terms-business', title: '사업자 정보', path: '/cms/terms/business' },
      { id: 'terms-marketing', title: '마케팅 활용 동의', path: '/cms/terms/marketing' },
      { id: 'terms-contract', title: '계약서', path: '/cms/terms/contract' },
    ],
  },
  {
    id: 'assets',
    title: '자산',
    subMenus: [
      { id: 'assets-locker', title: '락커', path: '/cms/assets/locker' },
    ],
  },
  // {
  //   id: 'notification',
  //   title: '알림/문자',
  //   subMenus: [
  //     { id: 'notification-sms', title: '단문 보내기', path: '/cms/notification/sms' },
  //     { id: 'notification-reservation-remind', title: '예약 리마인드', path: '/cms/notification/reservation-remind' },
  //     { id: 'notification-birthday-dormant', title: '생일/휴면', path: '/cms/notification/birthday-dormant' },
  //     { id: 'notification-churn-risk', title: '이탈 위험', path: '/cms/notification/churn-risk' },
  //     { id: 'notification-nps', title: 'NPS 설문', path: '/cms/notification/nps' },
  //   ],
  // },
  // {
  //   id: 'statistics',
  //   title: '통계/리포트',
  //   subMenus: [
  //     { id: 'statistics-period', title: '일/주/월', path: '/cms/statistics/period' },
  //     { id: 'statistics-coach-kpi', title: '코치별 KPI', path: '/cms/statistics/coach-kpi' },
  //     { id: 'statistics-remaining-session', title: '잔여 세션', path: '/cms/statistics/remaining-session' },
  //     { id: 'statistics-churn-risk', title: '이탈 위험', path: '/cms/statistics/churn-risk' },
  //     { id: 'statistics-nps', title: 'NPS 설문', path: '/cms/statistics/nps' },
  //   ],
  // },
  {
    id: 'settings',
    title: '설정',
    subMenus: [], // 하위 메뉴 없음
  },
];

const AppBarContainer = styled.div`
  position: sticky; /* fixed 대신 sticky 사용 */
  top: 0;
  left: 0;
  right: 0;
  background-color: ${AppColors.surface};
  border-bottom: 1px solid ${AppColors.borderLight};
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease; /* 부드러운 트랜지션 추가 */
`;

const TopBar = styled.header`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  min-width: 1200px; /* 최소 너비만 설정 */
  width: 100%; /* 화면 전체 너비 사용 */
  box-sizing: border-box;
  transition: all 0.2s ease; /* 부드러운 트랜지션 추가 */
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  flex-shrink: 0; /* 좌측 섹션이 축소되지 않도록 */
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  font-weight: 700;
  font-size: ${AppTextStyles.title2.fontSize};
  color: ${AppColors.primary};
  cursor: pointer;
  user-select: none;
`;

const MenuSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
  flex-shrink: 0; /* 메뉴 섹션이 축소되지 않도록 */
`;

const MenuCategory = styled.div<{ $isActive: boolean }>`
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${props => props.$isActive ? AppColors.primary : AppColors.onSurface};
  background-color: ${props => props.$isActive ? `${AppColors.primary}10` : 'transparent'};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${AppColors.primary}10;
    color: ${AppColors.primary};
  }
`;

const SubMenuChipsContainer = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid ${AppColors.borderLight};
  background-color: ${AppColors.surface};
  min-width: 1200px; /* 최소 너비만 설정 */
  width: 100%; /* 화면 전체 너비 사용 */
  box-sizing: border-box;
  transition: all 0.2s ease; /* 부드러운 트랜지션 추가 */
`;

const ChipsWrapper = styled.div`
  display: flex;
  flex-wrap: nowrap; /* 줄바꿈 방지 */
  gap: 8px;
  align-items: center;
  min-width: max-content; /* 콘텐츠 크기에 맞춰 최소 너비 설정 */
`;

const CategoryLabel = styled.span`
  font-size: ${AppTextStyles.label1.fontSize};
  color: ${AppColors.onSurface};
  font-weight: 500;
  margin-right: 12px;
`;

const SubMenuChip = styled.div<{ $isActive?: boolean }>`
  padding: 6px 12px;
  border-radius: 16px;
  background-color: ${props => props.$isActive ? `${AppColors.primary}10` : `${AppColors.primary}10`};
  color: ${props => props.$isActive ? AppColors.primary : AppColors.primary};
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.$isActive ? AppColors.primary : 'transparent'};

  &:hover {
    background-color: ${AppColors.primary};
    color: ${AppColors.onPrimary};
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0; /* 우측 섹션이 축소되지 않도록 */
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onSurface};
`;

const UserNameSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UserName = styled.span`
  font-weight: 500;
`;

const AppVersion = styled.span`
  font-size: 11px;
  color: ${AppColors.onSurface}80;
  font-weight: 400;
`;

const LogoutButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 6px;
  background-color: transparent;
  color: ${AppColors.onSurface};
  font-size: ${AppTextStyles.label2.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${AppColors.error}10;
    border-color: ${AppColors.error};
    color: ${AppColors.error};
  }
`;

interface CMSAppBarProps {
  currentPath?: string;
  onMenuClick?: (path: string) => void;
  onRefreshPrograms?: (refreshFunction: () => Promise<void>) => void; // 프로그램 목록 새로고침 함수를 외부에서 호출할 수 있도록
}

const CMSAppBar: React.FC<CMSAppBarProps> = React.memo(({ currentPath, onMenuClick, onRefreshPrograms }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('staff'); // 기본값 변경
  const [selectedSubMenuPath, setSelectedSubMenuPath] = useState<string>('');
  const [currentUserPermission, setCurrentUserPermission] = useState<string>(''); // 현재 사용자 권한
  const [menuCategories, setMenuCategories] = useState<MenuCategoryType[]>(staticMenuCategories); // 동적 메뉴
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 프로그램 목록을 가져와서 예약/스케줄 메뉴 생성
  const loadProgramsAndCreateReservationMenu = useCallback(async () => {
    try {
      const programs = await dbManager.getAllPrograms();
      const activePrograms = programs.filter(program => program.isActive);
      
      // 기본 예약 메뉴 (제거)
      // const basicReservationMenus: SubMenu[] = [
      //   { id: 'reservation-new', title: '신규 예약', path: '/cms/reservation/new' },
      //   { id: 'reservation-timetable', title: '시간표 보기', path: '/cms/reservation/timetable' },
      //   { id: 'reservation-batch', title: '일괄 예약', path: '/cms/reservation/batch' },
      //   { id: 'reservation-waiting', title: '대기 관리', path: '/cms/reservation/waiting' },
      //   { id: 'reservation-auto-remind', title: '자동 리마인드', path: '/cms/reservation/auto-remind' },
      // ];

      // 프로그램별 예약 메뉴 생성 (프로그램명만 표시)
      const programReservationMenus: SubMenu[] = activePrograms.map(program => ({
        id: `reservation-program-${program.id}`,
        title: program.name, // '프로그램명 예약'이 아닌 '프로그램명'만 표시
        path: `/cms/reservation/program/${program.id}`,
      }));

      // 예약/스케줄 메뉴 카테고리 생성 (프로그램 목록만 포함)
      const reservationCategory: MenuCategoryType = {
        id: 'reservation',
        title: '예약/스케줄',
        subMenus: programReservationMenus, // 기본 메뉴 제거하고 프로그램 메뉴만 포함
      };

      // 정적 메뉴에 동적으로 생성된 예약 메뉴 추가
      const updatedMenuCategories = [
        staticMenuCategories[0], // 직원관리
        staticMenuCategories[1], // 회원관리
        reservationCategory,     // 동적 예약/스케줄
        staticMenuCategories[2], // 프로그램
        staticMenuCategories[3], // 약관/문서
        staticMenuCategories[4], // 자산
        staticMenuCategories[5], // 설정
      ];

      setMenuCategories(updatedMenuCategories);
    } catch (error) {
      console.error('프로그램 목록 로드 실패:', error);
      // 실패시 빈 예약 메뉴 사용
      const basicReservationCategory: MenuCategoryType = {
        id: 'reservation',
        title: '예약/스케줄',
        subMenus: [], // 프로그램이 없으면 하위 메뉴도 없음
      };

      const fallbackMenuCategories = [
        staticMenuCategories[0], // 직원관리
        staticMenuCategories[1], // 회원관리
        basicReservationCategory, // 기본 예약/스케줄
        staticMenuCategories[2], // 프로그램
        staticMenuCategories[3], // 약관/문서
        staticMenuCategories[4], // 자산
        staticMenuCategories[5], // 설정
      ];

      setMenuCategories(fallbackMenuCategories);
    }
  }, []);

  // 컴포넌트 마운트 시 프로그램 목록 로드
  useEffect(() => {
    loadProgramsAndCreateReservationMenu();
  }, [loadProgramsAndCreateReservationMenu]);

  // 외부에서 프로그램 목록 새로고침을 요청할 수 있도록 함수 제공
  useEffect(() => {
    if (onRefreshPrograms) {
      onRefreshPrograms(loadProgramsAndCreateReservationMenu);
    }
  }, [onRefreshPrograms, loadProgramsAndCreateReservationMenu]);

  // 현재 경로에 따라 선택된 카테고리와 서브메뉴 설정
  useEffect(() => {
    const currentPathToUse = currentPath || location.pathname;
    
    // 설정 페이지인 경우
    if (currentPathToUse.includes('/cms/settings/')) {
      setSelectedCategoryId('settings');
      setSelectedSubMenuPath(currentPathToUse);
      return;
    }
    
    // 예약 메인 페이지인 경우
    if (currentPathToUse === '/cms/reservation' || currentPathToUse === '/cms/reservation/') {
      setSelectedCategoryId('reservation');
      setSelectedSubMenuPath(currentPathToUse);
      return;
    }
    
    // 현재 경로에 해당하는 카테고리와 서브메뉴 찾기
    for (const category of menuCategories) {
      const foundSubMenu = category.subMenus.find((subMenu: SubMenu) => subMenu.path === currentPathToUse);
      if (foundSubMenu) {
        setSelectedCategoryId(category.id);
        setSelectedSubMenuPath(foundSubMenu.path);
        return;
      }
    }
    
    // 기본 경로인 경우 (예: /cms/staff/search)
    if (currentPathToUse === '/cms/staff/search') {
      setSelectedCategoryId('staff');
      setSelectedSubMenuPath('/cms/staff/search');
    }
  }, [currentPath, location.pathname, menuCategories]);

  // 현재 사용자 권한 정보 가져오기
  useEffect(() => {
    const getCurrentUserPermission = async () => {
      const adminId = sessionStorage.getItem('adminId');
      if (adminId) {
        try {
          const allStaff = await dbManager.getAllStaff();
          const currentUser = allStaff.find(staff => staff.loginId === adminId);
          setCurrentUserPermission(currentUser?.permission || '');
        } catch (error) {
          console.error('현재 사용자 권한 정보 로드 실패:', error);
        }
      }
    };

    getCurrentUserPermission();
  }, []);

  // 권한에 따라 메뉴 필터링
  const getFilteredSubMenus = useCallback((categoryId: string, subMenus: SubMenu[]) => {
    // 예약/스케줄 카테고리의 경우 VIEWER도 모든 프로그램 예약을 볼 수 있도록 허용
    if (categoryId === 'reservation') {
      return subMenus; // 모든 프로그램 예약 메뉴 허용
    }
    
    // 약관/문서, 자산 카테고리의 경우 모든 권한에서 접근 허용
    if (categoryId === 'terms' || categoryId === 'assets') {
      return subMenus; // 모든 하위 메뉴 허용
    }
    
    // VIEWER 권한인 경우 조회/검색 관련 메뉴만 허용
    if (currentUserPermission === 'VIEWER') {
      return subMenus.filter(subMenu => {
        const title = subMenu.title;
        // 허용되는 메뉴: 검색, 조회, 보기, 현황, 대시보드 등
        const allowedKeywords = ['검색', '조회', '보기', '현황', '대시보드', '리포트', '통계', '내역', '목록'];
        // 금지되는 메뉴: 등록, 신규, 수정, 삭제, 배정, 충전, 발송 등  
        const forbiddenKeywords = ['등록', '신규', '수정', '삭제', '배정', '충전', '발송', '업로드', '내보내기', '출력', '타이머', '리마인드'];
        
        // 프로그램 관리와 상품 관리는 VIEWER도 조회 가능하도록 특별 허용
        if (title === '프로그램 관리' || title === '상품 관리') {
          return true;
        }
        
        // 금지 키워드가 포함된 경우 제외
        if (forbiddenKeywords.some(keyword => title.includes(keyword))) {
          return false;
        }
        
        // 허용 키워드가 포함되거나 특별히 허용되는 메뉴인 경우 포함
        return allowedKeywords.some(keyword => title.includes(keyword)) || 
               title === '빠른 검색' || 
               title === '시간표 보기' ||
               title === '매출 대시보드';
      });
    }
    
    return subMenus;
  }, [currentUserPermission]);

  // 현재 사용자 정보 가져오기 (sessionStorage에서)
  const adminId = sessionStorage.getItem('adminId');
  const adminName = adminId || '관리자';

  const handleCategoryClick = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
    
    // 해당 카테고리 찾기
    const category = menuCategories.find((cat: MenuCategoryType) => cat.id === categoryId);
    
    if (categoryId === 'settings') {
      // 설정 메뉴는 하위 메뉴가 없으므로 바로 페이지 이동
      const settingsPath = '/cms/settings/staff-permission';
      setSelectedSubMenuPath(settingsPath);
      if (onMenuClick) {
        onMenuClick(settingsPath);
      } else {
        navigate(settingsPath);
      }
    } else if (categoryId === 'reservation') {
      // 예약/스케줄 메뉴 클릭 시 첫 번째 프로그램을 자동 선택
      if (category && category.subMenus.length > 0) {
        const filteredSubMenus = getFilteredSubMenus(categoryId, category.subMenus);
        if (filteredSubMenus.length > 0) {
          const firstProgramPath = filteredSubMenus[0].path;
          setSelectedSubMenuPath(firstProgramPath);
          if (onMenuClick) {
            onMenuClick(firstProgramPath);
          } else {
            navigate(firstProgramPath);
          }
        }
      } else {
        // 프로그램이 없는 경우 기본 예약 페이지로 이동
        const reservationPath = '/cms/reservation';
        setSelectedSubMenuPath(reservationPath);
        if (onMenuClick) {
          onMenuClick(reservationPath);
        } else {
          navigate(reservationPath);
        }
      }
    } else if (category && category.subMenus.length > 0) {
      // 다른 카테고리는 기존대로 첫 번째 하위메뉴로 이동
      const filteredSubMenus = getFilteredSubMenus(categoryId, category.subMenus);
      
      if (filteredSubMenus.length > 0) {
        // 필터링된 첫 번째 하위메뉴로 이동
        const firstSubMenuPath = filteredSubMenus[0].path;
        setSelectedSubMenuPath(firstSubMenuPath);
        if (onMenuClick) {
          onMenuClick(firstSubMenuPath);
        } else {
          navigate(firstSubMenuPath);
        }
      } else {
        setSelectedSubMenuPath(''); // 접근 가능한 하위메뉴가 없는 경우 초기화
      }
    } else {
      setSelectedSubMenuPath(''); // 하위메뉴가 없는 경우 초기화
    }
  }, [menuCategories, getFilteredSubMenus, onMenuClick, navigate]);

  const handleSubMenuClick = useCallback((path: string) => {
    setSelectedSubMenuPath(path);
    
    // 예약/스케줄 관련 메뉴인 경우 특별 처리
    if (selectedCategoryId === 'reservation') {
      // 프로그램별 예약 메뉴인 경우 (path에 /program/이 포함된 경우)
      if (path.includes('/program/')) {
        if (onMenuClick) {
          onMenuClick(path);
        } else {
          navigate(path);
        }
      } else {
        // 기본 예약 메뉴들인 경우 임시로 동일한 경로로 이동하되 상태만 변경
        const reservationBasePath = '/cms/reservation';
        if (onMenuClick) {
          onMenuClick(reservationBasePath + path.replace('/cms/reservation', ''));
        } else {
          navigate(reservationBasePath + path.replace('/cms/reservation', ''));
        }
      }
    } else {
      // 다른 카테고리는 기존대로 동작
      if (onMenuClick) {
        onMenuClick(path);
      } else {
        // React Router를 사용하여 페이지 이동 (새로고침 없음)
        navigate(path);
      }
    }
  }, [selectedCategoryId, onMenuClick, navigate]);

  const handleLogoClick = useCallback(() => {
    setSelectedCategoryId('staff');
    setSelectedSubMenuPath('/cms/staff/search');
    if (onMenuClick) {
      onMenuClick('/cms/staff/search');
    } else {
      navigate('/cms/staff/search');
    }
  }, [onMenuClick, navigate]);

  // 개발용 백도어 - 더블클릭 핸들러
  const handleLogoDoubleClick = useCallback(() => {
    if (isBackdoorEnabled()) {
      executeBackdoor();
    }
  }, []);

  const handleLogout = useCallback(() => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      logout();
      navigate('/cms/login');
    }
  }, [logout, navigate]);

  // 현재 선택된 카테고리 찾기
  const selectedCategory = useMemo(() => {
    return menuCategories.find((category: MenuCategoryType) => category.id === selectedCategoryId);
  }, [menuCategories, selectedCategoryId]);

  return (
    <AppBarContainer>
      <TopBar>
        <LeftSection>
          <Logo 
            onClick={handleLogoClick}
            onDoubleClick={handleLogoDoubleClick}
          >
            LAVIDA CMS
          </Logo>
          
          <MenuSection>
            {menuCategories.map((category: MenuCategoryType) => (
              <MenuCategory
                key={category.id}
                $isActive={selectedCategoryId === category.id}
                onClick={() => handleCategoryClick(category.id)}
              >
                {category.title}
              </MenuCategory>
            ))}
          </MenuSection>
        </LeftSection>

        <RightSection>
          <UserInfo>
            <UserNameSection>
              <UserName>{adminName}</UserName>
              <span>님</span>
            </UserNameSection>
            <AppVersion>v1.0.7</AppVersion>
          </UserInfo>
          
          <LogoutButton onClick={handleLogout}>
            로그아웃
          </LogoutButton>
        </RightSection>
      </TopBar>

      {/* 선택된 카테고리의 하위 메뉴를 chips 형태로 표시 (하위 메뉴가 있고 설정이 아닌 경우만) */}
      {selectedCategory && selectedCategory.subMenus.length > 0 && selectedCategoryId !== 'settings' && (
        <SubMenuChipsContainer>
          <ChipsWrapper>
            <CategoryLabel>{selectedCategoryId === 'reservation' ? '예약:' : `${selectedCategory.title}:`}</CategoryLabel>
            {getFilteredSubMenus(selectedCategory.id, selectedCategory.subMenus).map((subMenu) => (
              <SubMenuChip
                key={subMenu.id}
                $isActive={selectedSubMenuPath === subMenu.path}
                onClick={() => handleSubMenuClick(subMenu.path)}
              >
                {subMenu.title}
              </SubMenuChip>
            ))}
          </ChipsWrapper>
        </SubMenuChipsContainer>
      )}
    </AppBarContainer>
  );
});

CMSAppBar.displayName = 'CMSAppBar';

export default CMSAppBar;
