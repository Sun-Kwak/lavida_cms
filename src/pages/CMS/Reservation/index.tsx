import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import CustomDropdown from '../../../components/CustomDropdown';
import ReservationModal from '../../../components/ReservationModal';
import { dbManager, type Branch, type Program } from '../../../utils/indexedDB';
import { getCurrentUser } from '../../../utils/authUtils';
import { 
  ScheduleCalendar, 
  WeeklyHolidayModal,
  type CalendarView, 
  type ScheduleEvent, 
  type StaffInfo,
  type DailyScheduleSettings,
  type WeeklyHolidaySettings,
  assignStaffColor 
} from '../../../components/Calendar';
import ReservationEditModal from '../../../components/ReservationEditModal';

const Container = styled.div`
  width: 100%;
`;

const ContentContainer = styled.div`
  padding: 24px;
  background-color: ${AppColors.surface};
  border-radius: 8px;
  border: 1px solid ${AppColors.borderLight};
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background-color: ${AppColors.background};
  border-radius: 8px;
  border: 1px solid ${AppColors.borderLight};
  justify-content: flex-start;
`;

const ProgramTitle = styled.h3`
  font-size: ${AppTextStyles.title2.fontSize};
  font-weight: 600;
  color: ${AppColors.primary};
  margin: 0;
  margin-right: 24px;
`;

const FilterLabel = styled.label`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 500;
  color: ${AppColors.onSurface};
  min-width: 80px;
  flex-shrink: 0;
`;

const DropdownWrapper = styled.div`
  width: 250px;
  flex-shrink: 0;
`;

const PlaceholderContent = styled.div`
  padding: 48px;
  text-align: center;
  color: ${AppColors.onSurface}60;
  font-size: ${AppTextStyles.body1.fontSize};
  border: 2px dashed ${AppColors.borderLight};
  border-radius: 8px;
`;

const ReservationPage: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  
  // 지점 관련 상태
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  
  // 프로그램 관련 상태
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [programDuration, setProgramDuration] = useState<number | undefined>(undefined);
  
  // 달력 관련 상태
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [staffList, setStaffList] = useState<StaffInfo[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);

  // 휴일설정 모달 상태 (HolidayModal 제거, WeeklyHolidayModal만 유지)
  const [isWeeklyHolidayModalOpen, setIsWeeklyHolidayModalOpen] = useState(false);
  const [weeklyHolidayModalStaffId, setWeeklyHolidayModalStaffId] = useState<string | undefined>();
  const [currentUser, setCurrentUser] = useState<{ id: string; role: 'master' | 'coach' | 'admin'; name?: string } | undefined>();
  
  // 일별 스케줄 설정
  const [weeklyHolidaySettings, setWeeklyHolidaySettings] = useState<DailyScheduleSettings[]>([]);

  // 예약 모달 상태
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservationModalData, setReservationModalData] = useState<{
    startTime: Date;
    endTime: Date;
    staffId: string;
    staffName: string;
  } | null>(null);

  // 예약 편집 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  // 현재 선택된 메뉴 확인
  const getMenuType = () => {
    const path = location.pathname;
    if (path.includes('/program/')) return 'program';
    if (path.includes('/new') || path.endsWith('/new')) return 'new';
    if (path.includes('/timetable') || path.endsWith('/timetable')) return 'timetable';
    if (path.includes('/batch') || path.endsWith('/batch')) return 'batch';
    if (path.includes('/waiting') || path.endsWith('/waiting')) return 'waiting';
    if (path.includes('/auto-remind') || path.endsWith('/auto-remind')) return 'auto-remind';
    if (path === '/cms/reservation' || path === '/cms/reservation/') return 'main';
    return 'main';
  };

  // 지점 데이터 로드
  const loadBranchData = useCallback(async () => {
    try {
      const branchData = await dbManager.getAllBranches();
      console.log('모든 지점 정보:', branchData.map(b => ({ id: b.id, name: b.name })));
      console.log('지점 상세:', branchData.forEach(b => console.log(`지점: ${b.name}, ID: ${b.id}`)));
      setBranches(branchData);
      
      // 지점이 이미 선택되어 있지 않은 경우에만 첫 번째 지점 선택
      if (!selectedBranchId) {
        const activeBranches = branchData.filter(branch => branch.name !== '전체');
        if (activeBranches.length > 0) {
          console.log('기본 선택 지점:', activeBranches[0].name, activeBranches[0].id);
          setSelectedBranchId(activeBranches[0].id);
        }
      }
    } catch (error) {
      console.error('지점 데이터 로드 실패:', error);
    }
  }, [selectedBranchId]);

  // 지점 드랍다운 옵션 생성
  const getBranchOptions = () => {
    const activeBranches = branches.filter(branch => branch.name !== '전체');
    console.log('활성 지점 목록:', activeBranches.map(b => ({ id: b.id, name: b.name })));
    console.log('현재 선택된 지점 ID:', selectedBranchId);
    
    const selectedBranch = activeBranches.find(b => b.id === selectedBranchId);
    console.log('현재 선택된 지점:', selectedBranch?.name);
    
    return activeBranches.map(branch => ({
      value: branch.id,
      label: branch.name,
      description: branch.address
    }));
  };

  // 프로그램 데이터 로드
  const loadProgramData = useCallback(async () => {
    if (programId) {
      try {
        const allPrograms = await dbManager.getAllPrograms();
        const foundProgram = allPrograms.find(p => p.id === programId);
        setCurrentProgram(foundProgram || null);

        // 프로그램과 연결된 상품의 소요시간 조회
        if (foundProgram && selectedBranchId) {
          const allProducts = await dbManager.getAllProducts();
          const programProducts = allProducts.filter(product => 
            product.programId === foundProgram.id && 
            product.branchId === selectedBranchId &&
            product.isActive
          );

          // 첫 번째 활성 상품의 소요시간을 사용 (대부분의 경우 프로그램당 하나의 소요시간)
          if (programProducts.length > 0) {
            setProgramDuration(programProducts[0].duration);
          } else {
            setProgramDuration(undefined);
          }
        } else {
          setProgramDuration(undefined);
        }
      } catch (error) {
        console.error('프로그램 데이터 로드 실패:', error);
        setCurrentProgram(null);
        setProgramDuration(undefined);
      }
    } else {
      setCurrentProgram(null);
      setProgramDuration(undefined);
    }
  }, [programId, selectedBranchId]);

  // 직원 데이터 로드 (횟수제/기간제 프로그램용)
  const loadStaffData = useCallback(async () => {
    try {
      const allStaff = await dbManager.getAllStaff();
      let activeCoaches = allStaff.filter(staff => 
        staff.isActive && staff.program // 담당 프로그램이 있는 활성 직원
      );
      
      // 지점이 선택된 경우 해당 지점의 직원만 필터링
      if (selectedBranchId) {
        activeCoaches = activeCoaches.filter(staff => staff.branchId === selectedBranchId);
      }
      
      // 프로그램이 선택된 경우 해당 프로그램을 담당하는 코치만 필터링
      if (currentProgram) {
        activeCoaches = activeCoaches.filter(staff => staff.program === currentProgram.name);
      }
      
      const staffInfo: StaffInfo[] = activeCoaches.map((staff, index) => ({
        id: staff.id,
        name: staff.name,
        role: staff.role,
        program: staff.program || '', // 담당 프로그램 정보 표시
        isActive: staff.isActive,
        color: assignStaffColor(staff.id, index),
        contractStartDate: staff.contractStartDate,
        contractEndDate: staff.contractEndDate || undefined,
        workingHours: {
          start: 9, // 기본 근무 시간 (필요시 직원별 설정으로 확장 가능)
          end: 21
        },
        workShift: (staff as any).workShift || '' // 근무 시간대 정보 추가
      }));
      
      setStaffList(staffInfo);
      
      // 사용자 권한에 따른 기본 코치 선택
      if (currentUser) {
        if (currentUser.role === 'master') {
          // Master: 기본적으로 모든 코치 선택
          setSelectedStaffIds(staffInfo.map(staff => staff.id));
        } else if (currentUser.role === 'coach') {
          // 담당 코치: 본인만 선택
          const myStaffInfo = staffInfo.find(staff => staff.id === currentUser.id);
          if (myStaffInfo) {
            setSelectedStaffIds([currentUser.id]);
          } else {
            // 본인이 목록에 없는 경우 (다른 프로그램 담당 등) 빈 배열
            setSelectedStaffIds([]);
          }
        } else {
          setSelectedStaffIds([]);
        }
      } else {
        // 사용자 정보가 없는 경우 기본적으로 모든 코치 선택
        setSelectedStaffIds(staffInfo.map(staff => staff.id));
      }
    } catch (error) {
      console.error('직원 데이터 로드 실패:', error);
    }
  }, [selectedBranchId, currentProgram, currentUser]);





  // 휴일설정 로드 (더 이상 사용 안함 - 스케줄 이벤트로 대체)
  // const loadHolidaySettings = useCallback(async () => {
  //   try {
  //     const currentMonth = new Date();
  //     const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  //     const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  //     
  //     const startDateStr = startDate.toISOString().split('T')[0];
  //     const endDateStr = endDate.toISOString().split('T')[0];
  //     
  //     const settings = await dbManager.getHolidaySettingsByDateRange(startDateStr, endDateStr);
  //     setHolidaySettings(settings);
  //   } catch (error) {
  //     console.error('휴일설정 로드 실패:', error);
  //   }
  // }, []);

  // 주별 휴일설정 로드
  const loadWeeklyHolidaySettings = useCallback(async () => {
    try {
      if (!selectedBranchId || staffList.length === 0) return;
      
      console.log('일별 스케줄 설정 로드 시작:', { selectedBranchId, staffCount: staffList.length });
      
      const allSettings: DailyScheduleSettings[] = [];
      
      // 각 코치별로 일별 스케줄 로드
      for (const staff of staffList) {
        try {
          const staffSettings = await dbManager.getDailySchedulesByStaff(staff.id);
          console.log(`${staff.name} 코치 일별 스케줄:`, staffSettings.length, '개');
          allSettings.push(...staffSettings);
        } catch (error) {
          console.error(`${staff.name} 코치 일별 스케줄 로드 실패:`, error);
        }
      }
      
      console.log('전체 일별 스케줄 로드 완료:', allSettings.length, '개');
      setWeeklyHolidaySettings(allSettings);
    } catch (error) {
      console.error('일별 스케줄 로드 실패:', error);
    }
  }, [selectedBranchId, staffList]);

  // 현재 사용자 정보 로드
  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('현재 사용자 정보 로드 실패:', error);
    }
  }, []);

  // 휴일설정 모달 관련 함수들 (주별 휴일설정으로 변경)
  const handleHolidaySettings = async (staffId?: string) => {
    // 권한 체크
    if (!currentUser) {
      alert('사용자 정보를 확인할 수 없습니다.');
      return;
    }

    // 특정 직원의 휴일설정인 경우 권한 체크
    if (staffId) {
      // 마스터 권한이 아니고 본인이 아닌 경우 접근 차단
      if (currentUser.role !== 'master' && currentUser.id !== staffId) {
        alert('권한이 없습니다. 본인의 휴일설정만 수정할 수 있습니다.');
        return;
      }
    }

    setWeeklyHolidayModalStaffId(staffId);
    setIsWeeklyHolidayModalOpen(true);
  };

  // 주별 근무 스케줄 모달 관련 함수들
  const handleWeeklyHolidayModalClose = async () => {
    setIsWeeklyHolidayModalOpen(false);
    setWeeklyHolidayModalStaffId(undefined);
    
    // 모달을 닫을 때 데이터 새로고침
    try {
      await loadWeeklyHolidaySettings();
      await loadScheduleEvents();
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
    }
  };

  // HolidaySettings 제거: 휴일 관리는 Staff.holidays 배열로 통일

  const handleWeeklyHolidaySettingsSave = async (settings: Omit<WeeklyHolidaySettings, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      // 권한 재검증
      if (!currentUser) {
        throw new Error('사용자 정보를 확인할 수 없습니다.');
      }

      // 저장하려는 설정에 포함된 모든 직원에 대한 권한 체크
      const uniqueStaffIds = Array.from(new Set(settings.map(s => s.staffId)));
      
      for (const staffId of uniqueStaffIds) {
        if (currentUser.role !== 'master' && currentUser.id !== staffId) {
          throw new Error('권한이 없습니다. 본인의 휴일설정만 수정할 수 있습니다.');
        }
      }

      // 1. 일별 스케줄 저장 (임시로 주석 처리)
      // TODO: settings를 DailyScheduleSettings 배열로 변환하여 저장
      // await dbManager.saveDailySchedules(dailySettings);
      console.log('일별 스케줄 저장 스킵 (임시):', settings);
      
      // 2. 기존 휴일/휴게시간 이벤트 삭제 (해당 주차, 해당 직원)
      for (const setting of settings) {
        const weekStartDate = setting.weekStartDate;
        const weekEndDate = new Date(weekStartDate + 'T00:00:00');
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        const weekEndDateStr = weekEndDate.toISOString().split('T')[0];
        
        // 해당 주차의 기존 휴일/휴게시간 이벤트 삭제
        // TODO: 스케줄 이벤트 삭제 로직 구현 필요
        console.log(`${setting.staffId}의 ${weekStartDate}~${weekEndDateStr} 주차 이벤트 삭제 예정`);
      }
      
      // 3. 새로운 휴일/휴게시간을 스케줄 이벤트로 생성하여 저장하지 않음
      // 대신 휴일 정보는 WeeklyHolidaySettings에만 저장하고, 
      // 화면에서는 해당 정보를 읽어서 시각적으로만 표시
      
      // 휴게시간만 스케줄 이벤트로 생성 (휴게시간은 실제로 예약 불가해야 함)
      const scheduleEvents: ScheduleEvent[] = [];
      
      for (const setting of settings) {
        const staff = staffList.find(s => s.id === setting.staffId);
        if (!staff) continue;
        
        const weekStartDate = new Date(setting.weekStartDate + 'T00:00:00');
        
        // 각 요일별로 휴게시간 이벤트만 생성
        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
        
        dayKeys.forEach((dayKey, index) => {
          const daySettings = setting.weekDays[dayKey];
          const currentDate = new Date(weekStartDate);
          currentDate.setDate(weekStartDate.getDate() + index);
          const dateStr = currentDate.toISOString().split('T')[0];
          
          // 휴일은 스케줄 이벤트로 생성하지 않음 - 화면에서만 표시
          
          // 휴게시간만 스케줄 이벤트로 생성
          if (!daySettings.isHoliday && daySettings.breakTimes && daySettings.breakTimes.length > 0) {
            daySettings.breakTimes.forEach((breakTime, breakIndex) => {
              if (breakTime.name && breakTime.name.trim() !== '') {
                const breakStartTime = new Date(currentDate);
                breakStartTime.setHours(breakTime.start, 0, 0, 0);
                const breakEndTime = new Date(currentDate);
                breakEndTime.setHours(breakTime.end, 0, 0, 0);
                
                scheduleEvents.push({
                  id: `break-${setting.staffId}-${dateStr}-${breakIndex}`,
                  title: breakTime.name,
                  startTime: breakStartTime,
                  endTime: breakEndTime,
                  staffId: setting.staffId,
                  staffName: staff.name,
                  type: 'break',
                  color: '#fbbf24',
                  description: `${staff.name} 코치 ${breakTime.name}`,
                  sourceType: 'weekly_holiday',
                  sourceId: setting.staffId + '-' + setting.weekStartDate,
                  status: 'active' // 이벤트 소싱: 모든 이벤트는 status 필수
                });
              }
            });
          }
        });
      }
      
      // 4. 생성된 스케줄 이벤트들을 데이터베이스에 저장
      if (scheduleEvents.length > 0) {
        console.log('생성된 휴일/휴게시간 이벤트들:', scheduleEvents);
        await dbManager.saveScheduleEvents(scheduleEvents);
        console.log('스케줄 이벤트 저장 완료');
      }
      
      // 5. 전체 스케줄 이벤트 새로고침 (기존 이벤트들과 함께 다시 로드)
      await loadScheduleEvents();
      
      // 6. 주별 휴일 설정도 새로고침
      await loadWeeklyHolidaySettings();
      
    } catch (error) {
      console.error('주별 휴일설정 저장 실패:', error);
      throw error; // 에러를 다시 throw하여 WeeklyHolidayModal에서 처리하도록 함
    }
  };

  // 저장된 스케줄 이벤트 로드
  const loadScheduleEvents = useCallback(async () => {
    try {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 7); // 현재 날짜 1주 전부터
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + 14); // 현재 날짜 2주 후까지
      
      let allEvents: ScheduleEvent[] = [];

      console.log('스케줄 이벤트 로드 시작:', { 
        programType: currentProgram?.type,
        selectedBranchId, 
        programName: currentProgram?.name 
      });

      // 모든 프로그램 타입에서 저장된 스케줄 이벤트 로드 (코치 스케줄, 예약 등)
      const savedEvents = await dbManager.getAllScheduleEvents(startDate, endDate);
      allEvents = [...savedEvents];
      console.log('저장된 스케줄 이벤트 로드:', savedEvents.length, '개');
      
      setEvents(allEvents);
      console.log('달력에 설정된 이벤트 수:', allEvents.length);
      if (allEvents.length > 0) {
        console.log('첫 번째 이벤트:', allEvents[0]);
      }
    } catch (error) {
      console.error('스케줄 이벤트 로드 실패:', error);
    }
  }, [currentDate, currentProgram, selectedBranchId]);

  // 프로그램 정보 로드
  useEffect(() => {
    const loadData = async () => {
      if (programId) {
        try {
          setLoading(true);
          // 실제로는 이 곳에서 필요한 데이터를 로드할 수 있습니다
        } catch (error) {
          console.error('데이터 로드 실패:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [programId]);

  // 지점 데이터 로드
  useEffect(() => {
    const initializeData = async () => {
      // HolidaySettings 마이그레이션 제거: Staff.holidays로 통일
      
      // 기본 데이터 로드
      await loadBranchData();
      loadCurrentUser();
      // 초기 스케줄 이벤트는 지점이 선택된 후에 로드
    };
    
    initializeData();
  }, [loadBranchData, loadCurrentUser]);

  // 지점이 선택된 후 초기 스케줄 이벤트 로드 (지점/프로그램 변경 시)
  useEffect(() => {
    console.log('=== useEffect 트리거 ===');
    console.log('selectedBranchId:', selectedBranchId);
    console.log('currentProgram:', currentProgram?.name);
    console.log('loading:', loading);
    
    if (selectedBranchId && currentProgram && !loading) {
      console.log('조건 만족 - loadScheduleEvents 호출');
      loadScheduleEvents();
    } else {
      console.log('조건 불만족 - loadScheduleEvents 호출 안함');
    }
  }, [selectedBranchId, currentProgram, loadScheduleEvents]); // eslint-disable-line react-hooks/exhaustive-deps

  // 프로그램 데이터 로드
  useEffect(() => {
    loadProgramData();
  }, [loadProgramData]);

  // 직원 데이터 로드 (지점 선택이나 프로그램이 변경될 때마다)
  useEffect(() => {
    if (selectedBranchId && currentUser) {
      loadStaffData();
    }
  }, [selectedBranchId, currentProgram, currentUser, loadStaffData]);

  // 직원 데이터가 로드된 후 주별 휴일설정 로드
  useEffect(() => {
    if (staffList.length > 0) {
      loadWeeklyHolidaySettings();
    }
  }, [staffList, loadWeeklyHolidaySettings]);

  // 지점 선택 변경 핸들러
  const handleBranchChange = useCallback(async (branchId: string) => {
    console.log('=== 지점 변경 시작 ===');
    console.log('이전 지점 ID:', selectedBranchId);
    console.log('새로운 지점 ID:', branchId);
    
    // 이전 이벤트 초기화
    setEvents([]);
    console.log('이벤트 초기화 완료');
    
    // 지점 설정
    setSelectedBranchId(branchId);
    console.log('지점 ID 설정 완료');
    
  }, [selectedBranchId]);

  // 달력 날짜 변경 핸들러 (최적화)
  const handleDateChange = useCallback((newDate: Date) => {
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth()).padStart(2, '0')}`;
    const oldMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth()).padStart(2, '0')}`;
    
    setCurrentDate(newDate);
    
    // 월이 변경된 경우에만 스케줄 이벤트 새로고침
    if (newMonth !== oldMonth) {
      // 약간의 지연을 두어 상태 업데이트가 완료된 후 로드
      setTimeout(() => {
        loadScheduleEvents();
      }, 0);
    }
  }, [currentDate, loadScheduleEvents]);

  // 이벤트 핸들러들
  const handleEventClick = (event: ScheduleEvent) => {
    console.log('이벤트 클릭:', event);
    
    // 휴일, 휴게시간, 기간제 이벤트는 편집 모달을 열지 않음
    if (event.type === 'holiday' || event.type === 'break' || event.sourceType === 'period_enrollment') {
      return;
    }
    
    // 예약/상담/기타 이벤트인 경우 편집 모달 열기
    if (event.type === 'class' || event.type === 'consultation' || event.type === 'other') {
      setSelectedEvent(event);
      setIsEditModalOpen(true);
    }
  };

  // 예약 가능 여부 체크 
  // 휴일설정 주가 아닌 경우는 언제든 수정 가능, 휴일설정 주는 해당 권한이 있어야 수정 가능
  const isReservationAllowed = (targetDate: Date): boolean => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ..., 5: 금요일, 6: 토요일
    
    // 설정 대상 토요일 계산 (토요일이면 다음주 토요일, 아니면 이번주 토요일)
    let targetSaturday = new Date(today);
    if (dayOfWeek === 6) {
      // 오늘이 토요일인 경우 다음주 토요일부터 설정
      targetSaturday.setDate(today.getDate() + 7);
    } else {
      // 다른 요일인 경우 이번주 토요일부터 설정
      const daysUntilSaturday = 6 - dayOfWeek;
      targetSaturday.setDate(today.getDate() + daysUntilSaturday);
    }
    
    // 휴일설정 대상 주의 시작(토요일)과 끝(금요일) 계산
    const holidaySettingWeekStart = new Date(targetSaturday);
    holidaySettingWeekStart.setHours(0, 0, 0, 0);
    
    const holidaySettingWeekEnd = new Date(targetSaturday);
    holidaySettingWeekEnd.setDate(targetSaturday.getDate() + 6); // 토요일 + 6일 = 금요일
    holidaySettingWeekEnd.setHours(23, 59, 59, 999);
    
    // 대상 날짜가 휴일설정 주에 해당하는지 확인
    const targetDateTime = targetDate.getTime();
    const isHolidaySettingWeek = targetDateTime >= holidaySettingWeekStart.getTime() && 
                                targetDateTime <= holidaySettingWeekEnd.getTime();
    
    if (isHolidaySettingWeek) {
      // 휴일설정 주인 경우: 마스터이거나 본인 코치만 수정 가능
      if (!currentUser) return false;
      return currentUser.role === 'master' || currentUser.role === 'coach';
    } else {
      // 휴일설정 주가 아닌 경우: 모든 권한 있는 사용자가 수정 가능
      return true;
    }
  };

  const handleEventCreate = (startTime: Date, endTime: Date, staffId?: string, replaceEventId?: string) => {
    // 프로그램이 선택되어 있는지 확인
    if (!currentProgram) {
      alert('프로그램을 선택해주세요.');
      return;
    }

    // 사용자 권한에 따른 코치 선택 로직
    let selectedStaffId = staffId;
    let selectedStaff: StaffInfo | undefined;

    if (!currentUser) {
      alert('사용자 정보를 확인할 수 없습니다.');
      return;
    }

    // 휴일에 대한 권한 체크 (날짜 기반으로 단순화)
    const targetStaffId = staffId || selectedStaffIds[0];
    if (targetStaffId) {
      // 날짜를 YYYY-MM-DD 형식으로 변환
      const year = startTime.getFullYear();
      const month = String(startTime.getMonth() + 1).padStart(2, '0');
      const day = String(startTime.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // 해당 날짜의 스케줄 찾기
      const dailySettings = weeklyHolidaySettings.find(
        s => s.staffId === targetStaffId && s.date === dateStr
      );

      if (dailySettings?.isHoliday) {
        // 휴일에 예약하려는 경우 권한 체크
        if (currentUser.role === 'master' || currentUser.id === targetStaffId) {
          // 마스터이거나 본인 코치인 경우 허용
          console.log('휴일 예약 권한 확인됨:', currentUser.role, currentUser.id, targetStaffId);
        } else {
          // 일반 사용자는 휴일에 예약 불가
          alert('휴일에는 예약을 생성할 수 없습니다. 관리자에게 문의하세요.');
          return;
        }
      }
    }

    // 휴게시간에 대한 체크 (스케줄 이벤트 기반)
    const isBreakTime = events.some(event => 
      event.staffId === targetStaffId &&
      event.type === 'break' &&
      startTime >= event.startTime &&
      startTime < event.endTime
    );

    if (isBreakTime) {
      alert('휴게시간에는 예약을 생성할 수 없습니다.');
      return;
    }

    if (currentUser.role === 'master') {
      // Master: 여러 코치가 선택되어도 팝업을 띄움 (팝업에서 코치 선택)
      // staffId가 명시적으로 전달된 경우 (달력에서 특정 코치 셀 클릭) 해당 코치 사용
      if (staffId) {
        selectedStaffId = staffId;
        selectedStaff = staffList.find(s => s.id === selectedStaffId);
      } else if (selectedStaffIds.length === 1) {
        // 하나만 선택된 경우 기본값으로 사용
        selectedStaffId = selectedStaffIds[0];
        selectedStaff = staffList.find(s => s.id === selectedStaffId);
      }
      // 여러 코치가 선택되었거나 아무도 선택 안된 경우에도 팝업을 열고, 팝업에서 코치 선택
    } else if (currentUser.role === 'coach') {
      // 담당 코치: 본인의 코치 ID 사용
      selectedStaffId = currentUser.id;
      selectedStaff = staffList.find(s => s.id === selectedStaffId);
      
      if (!selectedStaff) {
        alert('코치 정보를 찾을 수 없습니다.');
        return;
      }
    } else {
      alert('예약 생성 권한이 없습니다.');
      return;
    }

    // 예약 가능 시점 체크
    if (!isReservationAllowed(startTime)) {
      alert('휴일설정 대상 주에는 관리자 또는 해당 코치만 수정할 수 있습니다.');
      return;
    }
    
    // 예약 모달 데이터 설정 및 모달 열기
    setReservationModalData({
      startTime,
      endTime,
      staffId: selectedStaffId || '', // master인 경우 팝업에서 선택
      staffName: selectedStaff?.name || '' // master인 경우 팝업에서 선택
    });
    setIsReservationModalOpen(true);
  };

  // 예약 모달 닫기
  const handleReservationModalClose = () => {
    setIsReservationModalOpen(false);
    setReservationModalData(null);
  };

  // 예약 생성 완료 후 콜백
  const handleReservationCreate = (newReservation: ScheduleEvent) => {
    // 이벤트 목록에 새 예약 추가
    setEvents(prev => [...prev, newReservation]);
    
    // 모달 닫기
    handleReservationModalClose();
  };

  // 예약 편집 모달 핸들러들
  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedEvent(null);
  };

  const handleEventUpdate = (updatedEvent: ScheduleEvent) => {
    // 이벤트 목록에서 업데이트
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const handleEventDelete = (eventId: string) => {
    // 이벤트 목록에서 제거
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const menuType = getMenuType();

  return (
    <>
      <Container>
        <ContentContainer>
          {/* 지점 필터 */}
          <FilterContainer>
            {currentProgram && (
              <ProgramTitle>{currentProgram.name}</ProgramTitle>
            )}
            <FilterLabel>지점 선택:</FilterLabel>
            <DropdownWrapper>
              <CustomDropdown
                value={selectedBranchId}
                onChange={handleBranchChange}
                options={getBranchOptions()}
                placeholder="지점을 선택하세요"
              />
            </DropdownWrapper>
          </FilterContainer>
          
          {loading ? (
            <PlaceholderContent>
              데이터를 불러오는 중...
            </PlaceholderContent>
          ) : menuType === 'main' ? (
            // 메인 화면에서는 프로그램 선택 안내 메시지 표시
            <PlaceholderContent>
              좌측 메뉴에서 프로그램을 선택하여 해당 프로그램의 예약 관리를 시작하세요.
            </PlaceholderContent>
          ) : menuType === 'program' ? (
            // 프로그램별 예약에서는 달력 컴포넌트 표시 (지점이 선택된 경우만)
            selectedBranchId ? (
              currentProgram ? (
                // 모든 프로그램 타입에서 코치 스케줄 표시 (횟수제, 기간제 동일)
                staffList.length > 0 ? (
                  <ScheduleCalendar
                    view={calendarView}
                    currentDate={currentDate}
                    events={events}
                    staffList={staffList}
                    selectedStaffIds={selectedStaffIds}
                    onViewChange={setCalendarView}
                    onDateChange={handleDateChange}
                    onStaffFilter={setSelectedStaffIds}
                    onEventClick={handleEventClick}
                    onEventCreate={handleEventCreate}
                    onHolidaySettings={handleHolidaySettings}
                    dailyScheduleSettings={weeklyHolidaySettings}
                    programDuration={programDuration}
                    disablePastTime={true}
                    currentUser={currentUser}
                  />
                ) : (
                  <PlaceholderContent>
                    선택한 지점에 "{currentProgram.name}" 프로그램을 담당하는 코치가 없습니다.
                    <br />
                    직원 관리에서 코치의 담당 프로그램을 설정해주세요.
                  </PlaceholderContent>
                )
              ) : (
                <PlaceholderContent>
                  프로그램 정보를 불러오는 중입니다...
                </PlaceholderContent>
              )
            ) : (
              <PlaceholderContent>
                지점을 선택해주세요.
              </PlaceholderContent>
            )
          ) : (
            <PlaceholderContent>
              예약 관리 기능이 준비 중입니다.
              <br />
              <br />
              이곳에 실제 예약 관리 기능이 구현될 예정입니다.
            </PlaceholderContent>
          )}
        </ContentContainer>
      </Container>

      {/* 휴일 관리는 HolidayManagement 컴포넌트와 Staff.holidays로 통일 */}

      {/* 주별 근무 스케줄 모달 (WeeklyWorkSchedule로 변경 예정) */}
      <WeeklyHolidayModal
        isOpen={isWeeklyHolidayModalOpen}
        onClose={handleWeeklyHolidayModalClose}
        staffId={weeklyHolidayModalStaffId}
        staffList={staffList}
        currentUser={currentUser}
        onSave={handleWeeklyHolidaySettingsSave}
        onRefresh={async () => {
          await loadWeeklyHolidaySettings();
          await loadScheduleEvents();
        }}
      />

      {/* 예약 생성 모달 */}
      {isReservationModalOpen && reservationModalData && currentProgram && (
        <ReservationModal
          isOpen={isReservationModalOpen}
          onClose={handleReservationModalClose}
          startTime={reservationModalData.startTime}
          endTime={reservationModalData.endTime}
          staffId={reservationModalData.staffId}
          staffName={reservationModalData.staffName}
          programId={currentProgram.id}
          programName={currentProgram.name}
          program={currentProgram}
          branchId={selectedBranchId}
          branchName={branches.find(b => b.id === selectedBranchId)?.name || ''}
          currentUser={currentUser}
          existingEvents={events}
          onReservationCreate={handleReservationCreate}
          staffList={staffList}
        />
      )}

      {/* 예약 편집 모달 */}
      {isEditModalOpen && selectedEvent && (
        <ReservationEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          event={selectedEvent}
          onUpdate={handleEventUpdate}
          onDelete={handleEventDelete}
          currentUser={currentUser}
          dailyScheduleSettings={weeklyHolidaySettings}
        />
      )}
    </>
  );
};

export default ReservationPage;
