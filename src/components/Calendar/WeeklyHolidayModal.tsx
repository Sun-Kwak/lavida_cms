import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';
import { dbManager } from '../../utils/indexedDB';
import type { DailyScheduleSettings, WeeklyHolidaySettings } from '../../utils/db/types';
import { getUnifiedShiftSettings } from '../../utils/shiftUtils';
import { formatDateToLocal } from './utils';

/**
 * 주별 근무 스케줄 모달
 * 
 * 변경 사항:
 * - 휴일 관리는 Staff.holidays 배열로 통일 (이 모달에서는 휴일 체크박스 기능 비활성화 예정)
 * - 근무시간과 휴게시간 설정만 담당
 * - 향후 WeeklyWorkScheduleModal로 이름 변경 예정
 */

interface WeeklyHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId?: string; // undefined면 전체 코치
  staffList: Array<{
    id: string;
    name: string;
    workShift?: string; // 근무 시간대 (주간/야간)
    contractStartDate?: Date; // 계약 시작일
    contractEndDate?: Date; // 계약 종료일
    workingHours?: {
      start: number;
      end: number;
    };
  }>;
  currentUser?: {
    id: string;
    role: 'master' | 'coach' | 'admin';
  };
  onSave: (settings: Omit<WeeklyHolidaySettings, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  existingWeeklyHolidays?: WeeklyHolidaySettings[]; // 기존 주별 휴일 설정 데이터
  onRefresh?: () => Promise<void>; // 데이터 새로고침 콜백
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: ${AppColors.surface};
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${AppColors.borderLight};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: ${AppTextStyles.headline3.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${AppColors.onSurface};
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: ${AppColors.primary};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  max-height: 70vh;
`;

const ModalFooter = styled.div`
  padding: 20px 24px;
  border-top: 1px solid ${AppColors.borderLight};
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ErrorMessage = styled.div`
  background-color: ${AppColors.error}15;
  color: ${AppColors.error};
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: ${AppTextStyles.body2.fontSize};
`;

const StaffSelector = styled.div`
  margin-bottom: 24px;
`;

const SelectorTitle = styled.h4`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0 0 12px 0;
`;

const StaffCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  
  input[type="checkbox"] {
    margin-right: 8px;
  }
  
  label {
    font-size: ${AppTextStyles.body2.fontSize};
    color: ${AppColors.onSurface};
    cursor: pointer;
  }
`;

const WeekSection = styled.div`
  margin-bottom: 24px;
`;

const WeekNavigationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const WeekTitle = styled.h3`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0;
  text-align: center;
  min-width: 250px;
`;

const WeekDaysContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 12px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const WeekDay = styled.div<{ $isWeekend: boolean; $isHoliday: boolean }>`
  background-color: ${props => props.$isHoliday ? AppColors.error + '10' : AppColors.surface};
  border: 1px solid ${props => props.$isHoliday ? AppColors.error + '30' : AppColors.borderLight};
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.$isHoliday ? AppColors.error + '50' : AppColors.primary + '30'};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

// Removed unused styled component DayHeader

// Removed unused styled component DayInfo

const DayLabel = styled.div<{ $isWeekend: boolean; $isHoliday: boolean }>`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  color: ${props => {
    if (props.$isHoliday) return AppColors.error;
    if (props.$isWeekend) return AppColors.primary;
    return AppColors.onSurface;
  }};
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// Removed duplicate DayDate - using the one defined later

const DayToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: ${AppColors.error};
  }
  
  label {
    font-size: ${AppTextStyles.body2.fontSize};
    color: ${AppColors.onSurface};
    cursor: pointer;
    font-weight: 500;
  }
`;

const WorkingHoursSection = styled.div<{ $isVisible: boolean }>`
  display: ${props => props.$isVisible ? 'block' : 'none'};
  margin-top: 12px;
`;

// Removed unused styled component WorkingHoursRow

const BreakTimesSection = styled.div`
  margin-top: 12px;
`;

const BreakTimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 6px;
  margin-top: 8px;
  padding: 8px;
  background-color: ${AppColors.background};
  border-radius: 6px;
  border: 1px solid ${AppColors.borderLight};
`;

const TimeSlotButton = styled.button<{ $isActive: boolean; $isDisabled: boolean }>`
  padding: 6px 4px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
  border: 1px solid ${props => {
    if (props.$isDisabled) return AppColors.borderLight;
    if (props.$isActive) return AppColors.error;
    return AppColors.borderLight;
  }};
  background-color: ${props => {
    if (props.$isDisabled) return AppColors.surface + '50';
    if (props.$isActive) return AppColors.error + '20';
    return AppColors.surface;
  }};
  color: ${props => {
    if (props.$isDisabled) return AppColors.onSurface + '40';
    if (props.$isActive) return AppColors.error;
    return AppColors.onSurface;
  }};
  transition: all 0.2s ease;
  
  &:hover {
    ${props => !props.$isDisabled && `
      background-color: ${props.$isActive ? AppColors.error + '30' : AppColors.primary + '10'};
      border-color: ${props.$isActive ? AppColors.error : AppColors.primary};
    `}
  }
`;

/* Unused for now - may be used in future iterations
const BreakTimeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  
  input {
    width: 50px;
    padding: 4px 6px;
    border: 1px solid ${AppColors.borderLight};
    border-radius: 4px;
    font-size: ${AppTextStyles.body2.fontSize};
    text-align: center;
  }
  
  input[type="text"] {
    width: 80px;
  }
  
  button {
    background: ${AppColors.error};
    color: ${AppColors.onPrimary};
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    
    &:hover {
      background: ${AppColors.error + 'CC'};
    }
  }
`;
*/


const TimeSelectContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TimeSelect = styled.select`
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
    box-shadow: 0 0 0 2px ${AppColors.primary}20;
  }
`;

const HourSelect = styled(TimeSelect)`
  width: 50px;
`;

const MinuteSelect = styled(TimeSelect)`
  width: 50px;
`;

// DayDate component removed - date now included in day label

const WorkingHoursLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const WorkingHoursInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  
  span {
    color: #666;
    font-size: 0.9rem;
    font-weight: 500;
  }
`;

const BreakTimesLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

/* Unused - removed in favor of TimeSlotButton UI
const BreakTimeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const BreakTimeInput = styled.input`
  flex: 1;
  min-width: 80px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
`;

const RemoveBreakTimeButton = styled.button`
  background: #ffebee;
  border: 1px solid #f44336;
  color: #f44336;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  min-width: 50px;
  
  &:hover {
    background: #f44336;
    color: white;
  }
`;

const AddBreakTimeButton = styled.button`
  background: #e3f2fd;
  border: 1px solid #2196f3;
  color: #2196f3;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #2196f3;
    color: white;
  }
`;
*/

const ApplyToAllButton = styled.button`
  background: #f3e5f5;
  border: 1px solid #9c27b0;
  color: #9c27b0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  font-weight: 500;
  margin-left: 8px;
  
  &:hover {
    background: #9c27b0;
    color: white;
  }
`;



const Button = styled.button<{ $variant: 'primary' | 'secondary'; $disabled?: boolean }>`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 500;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  border: none;
  opacity: ${props => props.$disabled ? 0.6 : 1};
  
  ${props => props.$variant === 'primary' ? `
    background-color: ${props.$disabled ? AppColors.primary + '80' : AppColors.primary};
    color: ${AppColors.onPrimary};
    
    &:hover {
      background-color: ${props.$disabled ? AppColors.primary : AppColors.primary + 'CC'};
    }
  ` : `
    background-color: ${AppColors.surface};
    color: ${AppColors.onSurface};
    border: 1px solid ${AppColors.borderLight};
    
    &:hover {
      background-color: ${props.$disabled ? AppColors.surface : AppColors.background};
    }
  `}
`;

const WeeklyHolidayModal: React.FC<WeeklyHolidayModalProps> = ({
  isOpen,
  onClose,
  staffId,
  staffList,
  currentUser,
  onSave,
  onRefresh
}) => {


  // 분을 시와 분으로 분리하는 함수
  const minutesToHourMinute = (minutes: number): { hour: number; minute: number } => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return { hour, minute };
  };

  // 시와 분을 분으로 변환하는 함수
  const hourMinuteToMinutes = (hour: number, minute: number): number => {
    return hour * 60 + minute;
  };

  // 선택된 직원들의 shift 정보를 기반으로 기본 설정 생성
  const getDefaultSettingsForSelectedStaff = () => {
    const selectedStaffs = staffList.filter(staff => selectedStaffIds.includes(staff.id));
    const staffShifts = selectedStaffs.map(staff => staff.workShift || '').filter(Boolean);
    const shiftSettings = getUnifiedShiftSettings(staffShifts);
    
    console.log('Selected staffs:', selectedStaffs.map(s => ({ id: s.id, name: s.name, workShift: s.workShift })));
    console.log('Staff shifts:', staffShifts);
    console.log('Unified shift settings:', shiftSettings);
    
    return {
      workingHours: shiftSettings.workingHours,
      defaultBreakTime: shiftSettings.defaultBreakTime
    };
  };


  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState('');
  const [weekDaySettings, setWeekDaySettings] = useState<{
    monday: { isHoliday: boolean; workingHours: { start: number; end: number; }; lunchTime: { start: number; end: number; name: string; }; breakTimes: { start: number; end: number; name: string; }[]; };
    tuesday: { isHoliday: boolean; workingHours: { start: number; end: number; }; lunchTime: { start: number; end: number; name: string; }; breakTimes: { start: number; end: number; name: string; }[]; };
    wednesday: { isHoliday: boolean; workingHours: { start: number; end: number; }; lunchTime: { start: number; end: number; name: string; }; breakTimes: { start: number; end: number; name: string; }[]; };
    thursday: { isHoliday: boolean; workingHours: { start: number; end: number; }; lunchTime: { start: number; end: number; name: string; }; breakTimes: { start: number; end: number; name: string; }[]; };
    friday: { isHoliday: boolean; workingHours: { start: number; end: number; }; lunchTime: { start: number; end: number; name: string; }; breakTimes: { start: number; end: number; name: string; }[]; };
    saturday: { isHoliday: boolean; workingHours: { start: number; end: number; }; lunchTime: { start: number; end: number; name: string; }; breakTimes: { start: number; end: number; name: string; }[]; };
    sunday: { isHoliday: boolean; workingHours: { start: number; end: number; }; lunchTime: { start: number; end: number; name: string; }; breakTimes: { start: number; end: number; name: string; }[]; };
  }>({
    monday: {
      isHoliday: false,
      workingHours: { start: 540, end: 1260 }, // 09:00 ~ 21:00 (분 단위)
      lunchTime: { start: 720, end: 780, name: '점심시간' }, // 12:00 ~ 13:00 기본 점심시간
      breakTimes: []
    },
    tuesday: {
      isHoliday: false,
      workingHours: { start: 540, end: 1260 },
      lunchTime: { start: 720, end: 780, name: '점심시간' },
      breakTimes: []
    },
    wednesday: {
      isHoliday: false,
      workingHours: { start: 540, end: 1260 },
      lunchTime: { start: 720, end: 780, name: '점심시간' },
      breakTimes: []
    },
    thursday: {
      isHoliday: false,
      workingHours: { start: 540, end: 1260 },
      lunchTime: { start: 720, end: 780, name: '점심시간' },
      breakTimes: []
    },
    friday: {
      isHoliday: false,
      workingHours: { start: 540, end: 1260 },
      lunchTime: { start: 720, end: 780, name: '점심시간' },
      breakTimes: []
    },
    saturday: {
      isHoliday: true,  // 기본값: 주말 휴일
      workingHours: { start: 540, end: 1260 },
      lunchTime: { start: 720, end: 780, name: '점심시간' },
      breakTimes: []
    },
    sunday: {
      isHoliday: true,  // 기본값: 주말 휴일
      workingHours: { start: 540, end: 1260 },
      lunchTime: { start: 720, end: 780, name: '점심시간' },
      breakTimes: []
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 현재 설정 가능한 주의 토요일 날짜 계산 (주의 시작 = 토요일)
  const getCurrentSettableWeekStartDate = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // 다가오는 토요일 계산
    const nextSaturday = new Date(today);
    if (dayOfWeek === 6) {
      // 오늘이 토요일이면 다음 토요일
      nextSaturday.setDate(today.getDate() + 7);
    } else {
      // 아니면 이번주 토요일
      const daysUntilSaturday = 6 - dayOfWeek;
      nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    }
    
    // 토요일을 주의 시작일로 반환
    return formatDateToLocal(nextSaturday);
  };

  // 주 날짜 범위 표시 (토요일부터 금요일까지)
  const getWeekDateRange = (): string => {
    if (!currentWeekStartDate) return '';
    
    const saturday = new Date(currentWeekStartDate + 'T00:00:00');
    const friday = new Date(saturday);
    friday.setDate(saturday.getDate() + 6); // 토요일 + 6일 = 금요일
    
    const format = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
    return `${format(saturday)} ~ ${format(friday)}`;
  };

  // 초기화
  useEffect(() => {
    console.log('Initialization useEffect triggered, isOpen:', isOpen);
    
    if (isOpen) {
      // 현재 설정 가능한 주로 초기 설정
      const settableWeek = getCurrentSettableWeekStartDate();
      console.log('Setting currentWeekStartDate to:', settableWeek);
      setCurrentWeekStartDate(settableWeek);
      
      // 직원 선택 초기화
      if (staffId) {
        console.log('Setting selectedStaffIds to single staff:', staffId);
        setSelectedStaffIds([staffId]);
      } else if (currentUser?.role === 'master') {
        console.log('Master user, setting empty staff selection');
        setSelectedStaffIds([]);
      } else if (currentUser?.id) {
        console.log('Setting selectedStaffIds to current user:', currentUser.id);
        setSelectedStaffIds([currentUser.id]);
      }

      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, staffId, currentUser]);

  // 기존 설정 로드 (dailyScheduleSettings에서)
  useEffect(() => {
    console.log('useEffect triggered:', { isOpen, currentWeekStartDate, selectedStaffIds: selectedStaffIds.length });
    
    if (isOpen && currentWeekStartDate && selectedStaffIds.length > 0) {
      const loadDailySchedules = async () => {
        try {
          // 첫 번째 선택된 직원의 dailyScheduleSettings 로드
          const staffId = selectedStaffIds[0];
          
          // 해당 주의 토요일부터 금요일까지 날짜 계산 (타임존 문제 방지)
          const weekStart = new Date(currentWeekStartDate + 'T00:00:00');
          const dailySettings: { [key: string]: DailyScheduleSettings | null } = {};
          const dayKeys = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
          
          for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = formatDateToLocal(date);
            
            const setting = await dbManager.getDailyScheduleByStaffAndDate(staffId, dateStr);
            dailySettings[dayKeys[i]] = setting;
          }
          
          console.log('Loaded daily schedules:', dailySettings);
          
          // dailySettings가 있으면 weekDaySettings로 변환
          const hasAnySettings = Object.values(dailySettings).some(s => s !== null);
          
          if (hasAnySettings) {
            // 선택된 직원들의 shift 정보를 기반으로 기본 설정 생성
            const defaultSettings = getDefaultSettingsForSelectedStaff();
            
            // breakTimes에서 lunchTime 분리
            const extractLunchAndBreaks = (breakTimes: any[] | undefined, defaultBreakTime: any) => {
              if (!breakTimes || breakTimes.length === 0) {
                return {
                  lunchTime: defaultBreakTime,
                  breakTimes: []
                };
              }
              
              // 첫 번째 breakTime을 lunchTime으로 사용
              const [first, ...rest] = breakTimes;
              return {
                lunchTime: first || defaultBreakTime,
                breakTimes: rest
              };
            };
            
            const normalizedWeekDays = {
              monday: dailySettings.monday ? {
                isHoliday: dailySettings.monday.isHoliday,
                workingHours: dailySettings.monday.workingHours || defaultSettings.workingHours,
                ...extractLunchAndBreaks(dailySettings.monday.breakTimes, defaultSettings.defaultBreakTime)
              } : {
                isHoliday: false,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              },
              tuesday: dailySettings.tuesday ? {
                isHoliday: dailySettings.tuesday.isHoliday,
                workingHours: dailySettings.tuesday.workingHours || defaultSettings.workingHours,
                ...extractLunchAndBreaks(dailySettings.tuesday.breakTimes, defaultSettings.defaultBreakTime)
              } : {
                isHoliday: false,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              },
              wednesday: dailySettings.wednesday ? {
                isHoliday: dailySettings.wednesday.isHoliday,
                workingHours: dailySettings.wednesday.workingHours || defaultSettings.workingHours,
                ...extractLunchAndBreaks(dailySettings.wednesday.breakTimes, defaultSettings.defaultBreakTime)
              } : {
                isHoliday: false,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              },
              thursday: dailySettings.thursday ? {
                isHoliday: dailySettings.thursday.isHoliday,
                workingHours: dailySettings.thursday.workingHours || defaultSettings.workingHours,
                ...extractLunchAndBreaks(dailySettings.thursday.breakTimes, defaultSettings.defaultBreakTime)
              } : {
                isHoliday: false,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              },
              friday: dailySettings.friday ? {
                isHoliday: dailySettings.friday.isHoliday,
                workingHours: dailySettings.friday.workingHours || defaultSettings.workingHours,
                ...extractLunchAndBreaks(dailySettings.friday.breakTimes, defaultSettings.defaultBreakTime)
              } : {
                isHoliday: false,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              },
              saturday: dailySettings.saturday ? {
                isHoliday: dailySettings.saturday.isHoliday,
                workingHours: dailySettings.saturday.workingHours || defaultSettings.workingHours,
                ...extractLunchAndBreaks(dailySettings.saturday.breakTimes, defaultSettings.defaultBreakTime)
              } : {
                isHoliday: true,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              },
              sunday: dailySettings.sunday ? {
                isHoliday: dailySettings.sunday.isHoliday,
                workingHours: dailySettings.sunday.workingHours || defaultSettings.workingHours,
                ...extractLunchAndBreaks(dailySettings.sunday.breakTimes, defaultSettings.defaultBreakTime)
              } : {
                isHoliday: true,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              }
            };
            
            console.log('Setting weekDaySettings from daily schedules:', normalizedWeekDays);
            setWeekDaySettings(normalizedWeekDays);
          } else {
            console.log('No existing setting found, using shift-based default state');
            
            // 선택된 직원들의 shift 정보를 기반으로 기본 설정 생성
            const defaultSettings = getDefaultSettingsForSelectedStaff();
            
            // 기본값으로 리셋 (주말만 휴일)
            setWeekDaySettings({
              monday: {
                isHoliday: false,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              },
              tuesday: {
                isHoliday: false,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              },
              wednesday: {
                isHoliday: false,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              },
              thursday: {
                isHoliday: false,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              },
              friday: {
                isHoliday: false,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              },
              saturday: {
                isHoliday: true,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              },
              sunday: {
                isHoliday: true,
                workingHours: defaultSettings.workingHours,
                lunchTime: defaultSettings.defaultBreakTime,
                breakTimes: []
              }
            });
          }
        } catch (error) {
          console.error('Failed to load daily schedules:', error);
        }
      };
      
      loadDailySchedules();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentWeekStartDate, selectedStaffIds]);

  const handleStaffToggle = (staffId: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleDayToggle = (day: keyof typeof weekDaySettings) => {
    console.log('handleDayToggle called:', day, 'current state:', weekDaySettings[day]);
    setWeekDaySettings(prev => {
      const currentDay = prev[day];
      const newIsHoliday = !currentDay.isHoliday;
      
      // 선택된 직원들의 shift 정보를 기반으로 기본 설정 생성
      const defaultSettings = getDefaultSettingsForSelectedStaff();
      
      const newState = {
        ...prev,
        [day]: {
          ...currentDay,
          isHoliday: newIsHoliday,
          // 휴일로 설정할 때 근무시간과 휴게시간을 비움
          // 휴일 해제할 때는 shift 기반 기본 근무시간으로 설정
          workingHours: newIsHoliday 
            ? { start: 0, end: 0 } 
            : (currentDay.workingHours.start === 0 && currentDay.workingHours.end === 0 
               ? defaultSettings.workingHours
               : currentDay.workingHours),
          // 휴일로 설정할 때 휴게시간 비움, 해제할 때 shift 기반 기본 휴게시간
          lunchTime: newIsHoliday 
            ? { start: 0, end: 0, name: defaultSettings.defaultBreakTime.name }
            : (currentDay.lunchTime.start === 0 && currentDay.lunchTime.end === 0
               ? defaultSettings.defaultBreakTime
               : currentDay.lunchTime),
          breakTimes: newIsHoliday ? [] : currentDay.breakTimes
        }
      };
      console.log('new state for', day, ':', newState[day]);
      return newState;
    });
  };



  // 드롭다운용 시간 변경 핸들러
  const handleTimeDropdownChange = (
    day: keyof typeof weekDaySettings, 
    field: 'start' | 'end', 
    type: 'hour' | 'minute', 
    value: string
  ) => {
    const currentTime = minutesToHourMinute(weekDaySettings[day].workingHours[field]);
    let newHour = currentTime.hour;
    let newMinute = currentTime.minute;
    
    if (type === 'hour') {
      newHour = parseInt(value, 10);
    } else {
      newMinute = parseInt(value, 10);
    }
    
    const newMinutes = hourMinuteToMinutes(newHour, newMinute);
    
    // 시작 시간이 종료 시간보다 늦지 않도록 검증
    const otherField = field === 'start' ? 'end' : 'start';
    const otherTime = weekDaySettings[day].workingHours[otherField];
    
    let finalMinutes = newMinutes;
    if (field === 'start' && newMinutes >= otherTime) {
      finalMinutes = otherTime - 30; // 최소 30분 차이
      if (finalMinutes < 0) finalMinutes = 0;
    } else if (field === 'end' && newMinutes <= otherTime) {
      finalMinutes = otherTime + 30; // 최소 30분 차이
      if (finalMinutes >= 24 * 60) finalMinutes = 24 * 60 - 30;
    }
    
    // 새로운 근무시간이 다른 시간들과 겹치는지 체크 (경고만 표시)
    const newStart = field === 'start' ? finalMinutes : weekDaySettings[day].workingHours.start;
    const newEnd = field === 'end' ? finalMinutes : weekDaySettings[day].workingHours.end;
    const overlapError = checkTimeOverlap(day, newStart, newEnd, 'working');
    
    if (overlapError) {
      console.warn('근무시간 겹침 경고:', overlapError);
      // alert을 제거하고 경고만 표시 - 저장 시점에 검증
    }
    
    setWeekDaySettings(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        workingHours: {
          ...prev[day].workingHours,
          [field]: finalMinutes
        }
      }
    }));
  };

  // 점심시간 변경 핸들러
  const handleLunchTimeDropdownChange = (
    day: keyof typeof weekDaySettings, 
    field: 'start' | 'end', 
    type: 'hour' | 'minute', 
    value: string
  ) => {
    const currentLunchTime = weekDaySettings[day].lunchTime;
    const currentHour = field === 'start' ? 
      Math.floor(currentLunchTime.start / 60) : Math.floor(currentLunchTime.end / 60);
    const currentMinute = field === 'start' ? 
      currentLunchTime.start % 60 : currentLunchTime.end % 60;
    
    const newHour = type === 'hour' ? parseInt(value) : currentHour;
    const newMinute = type === 'minute' ? parseInt(value) : currentMinute;
    
    // 유효성 검사
    if (newHour < 0 || newHour > 23 || newMinute < 0 || newMinute > 59) {
      return;
    }
    
    const newMinutes = hourMinuteToMinutes(newHour, newMinute);
    
    // 시작 시간이 종료 시간보다 늦지 않도록 검증
    const otherField = field === 'start' ? 'end' : 'start';
    const otherTime = weekDaySettings[day].lunchTime[otherField];
    
    let finalMinutes = newMinutes;
    if (field === 'start' && newMinutes >= otherTime) {
      finalMinutes = otherTime - 30; // 최소 30분 차이
      if (finalMinutes < 0) finalMinutes = 0;
    } else if (field === 'end' && newMinutes <= otherTime) {
      finalMinutes = otherTime + 30; // 최소 30분 차이
      if (finalMinutes >= 24 * 60) finalMinutes = 24 * 60 - 30;
    }
    
    // 새로운 기본 휴게시간이 다른 시간들과 겹치는지 체크 (경고만 표시)
    const newStart = field === 'start' ? finalMinutes : weekDaySettings[day].lunchTime.start;
    const newEnd = field === 'end' ? finalMinutes : weekDaySettings[day].lunchTime.end;
    const overlapError = checkTimeOverlap(day, newStart, newEnd, 'lunch');
    
    if (overlapError) {
      console.warn('기본 휴게시간 겹침 경고:', overlapError);
      // alert을 제거하고 경고만 표시 - 저장 시점에 검증
    }
    
    setWeekDaySettings(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        lunchTime: {
          ...prev[day].lunchTime,
          [field]: finalMinutes
        }
      }
    }));
  };

  // 시간 중복 체크 함수
  const checkTimeOverlap = (day: keyof typeof weekDaySettings, newStart: number, newEnd: number, excludeType?: 'working' | 'lunch' | 'break', excludeIndex?: number): string | null => {
    const daySettings = weekDaySettings[day];
    
    // 새로운 시간이 유효한지 체크
    if (newStart >= newEnd) {
      return '시작 시간이 종료 시간보다 늦거나 같을 수 없습니다.';
    }
    
    // 휴게시간은 근무시간 내에 있어야 함 (근무시간 수정이 아닌 경우)
    if (excludeType === 'lunch' || excludeType === 'break') {
      const workingHours = daySettings.workingHours;
      if (workingHours.start < workingHours.end) { // 유효한 근무시간이 있는 경우
        if (newStart < workingHours.start || newEnd > workingHours.end) {
          return '휴게시간은 근무시간 내에 있어야 합니다.';
        }
      }
    }
    
    // 기본 휴게시간(lunchTime)과 겹치는지 체크 (기본 휴게시간 수정 시에는 제외)
    if (excludeType !== 'lunch') {
      const lunchTime = daySettings.lunchTime;
      if (lunchTime.start > 0 && lunchTime.start < lunchTime.end) { // 유효한 기본 휴게시간이 있는 경우
        if (!(newEnd <= lunchTime.start || newStart >= lunchTime.end)) {
          return `기본 휴게시간(${lunchTime.name})과 겹칠 수 없습니다.`;
        }
      }
    }
    
    // 다른 휴게시간들과 겹치는지 체크 (해당 휴게시간 수정 시에는 제외)
    if (excludeType !== 'break') {
      for (let i = 0; i < daySettings.breakTimes.length; i++) {
        const breakTime = daySettings.breakTimes[i];
        if (breakTime.start > 0 && breakTime.start < breakTime.end) { // 유효한 휴게시간인 경우
          if (!(newEnd <= breakTime.start || newStart >= breakTime.end)) {
            return `휴게시간 "${breakTime.name || `휴게${i+1}`}"과 겹칠 수 없습니다.`;
          }
        }
      }
    } else if (typeof excludeIndex === 'number') {
      // 특정 휴게시간 수정 시 다른 휴게시간들과만 체크
      for (let i = 0; i < daySettings.breakTimes.length; i++) {
        if (i === excludeIndex) continue; // 자기 자신은 제외
        const breakTime = daySettings.breakTimes[i];
        if (breakTime.start > 0 && breakTime.start < breakTime.end) {
          if (!(newEnd <= breakTime.start || newStart >= breakTime.end)) {
            return `휴게시간 "${breakTime.name || `휴게${i+1}`}"과 겹칠 수 없습니다.`;
          }
        }
      }
    }
    
    return null; // 겹치지 않음
  };

  // 30분 단위 타임슬롯 생성 함수
  const generateTimeSlots = (startMinutes: number, endMinutes: number): number[] => {
    const slots: number[] = [];
    for (let time = startMinutes; time < endMinutes; time += 30) {
      slots.push(time);
    }
    return slots;
  };

  // 특정 타임슬롯이 휴게시간에 포함되는지 확인
  const isTimeSlotInBreak = (day: keyof typeof weekDaySettings, slotStart: number): boolean => {
    const daySettings = weekDaySettings[day];
    const slotEnd = slotStart + 30;
    
    // 기본 휴게시간(lunchTime) 확인
    if (daySettings.lunchTime.start > 0 && daySettings.lunchTime.end > 0) {
      if (slotStart >= daySettings.lunchTime.start && slotEnd <= daySettings.lunchTime.end) {
        return true;
      }
    }
    
    // 추가 휴게시간들 확인
    for (const breakTime of daySettings.breakTimes) {
      if (breakTime.start > 0 && breakTime.end > 0) {
        if (slotStart >= breakTime.start && slotEnd <= breakTime.end) {
          return true;
        }
      }
    }
    
    return false;
  };

  // 타임슬롯 토글 핸들러
  const handleTimeSlotToggle = (day: keyof typeof weekDaySettings, slotStart: number) => {
    const slotEnd = slotStart + 30;
    const daySettings = weekDaySettings[day];
    
    // 기본 휴게시간에 포함되는지 확인
    const isInLunchTime = daySettings.lunchTime.start > 0 && 
                          daySettings.lunchTime.end > 0 &&
                          slotStart >= daySettings.lunchTime.start && 
                          slotEnd <= daySettings.lunchTime.end;
    
    if (isInLunchTime) {
      // 기본 휴게시간 토글 불가 (경고 메시지)
      alert(`${daySettings.lunchTime.name}은 여기서 직접 토글할 수 없습니다. 위의 ${daySettings.lunchTime.name} 설정에서 변경해주세요.`);
      return;
    }
    
    // 추가 휴게시간에 포함되는지 확인
    let foundBreakIndex = -1;
    for (let i = 0; i < daySettings.breakTimes.length; i++) {
      const breakTime = daySettings.breakTimes[i];
      if (breakTime.start > 0 && breakTime.end > 0) {
        if (slotStart >= breakTime.start && slotEnd <= breakTime.end) {
          foundBreakIndex = i;
          break;
        }
      }
    }
    
    if (foundBreakIndex >= 0) {
      // 이미 휴게시간에 포함된 슬롯 → 해당 휴게시간 삭제
      const breakTime = daySettings.breakTimes[foundBreakIndex];
      
      // 해당 휴게시간이 단일 슬롯(30분)인 경우 삭제
      if (breakTime.end - breakTime.start === 30) {
        handleRemoveBreakTime(day, foundBreakIndex);
      } else {
        // 여러 슬롯으로 구성된 경우, 클릭한 슬롯을 제외한 부분으로 분할
        const newBreakTimes: { start: number; end: number; name: string }[] = [];
        
        // 클릭한 슬롯 이전 부분
        if (slotStart > breakTime.start) {
          newBreakTimes.push({
            start: breakTime.start,
            end: slotStart,
            name: breakTime.name
          });
        }
        
        // 클릭한 슬롯 이후 부분
        if (slotEnd < breakTime.end) {
          newBreakTimes.push({
            start: slotEnd,
            end: breakTime.end,
            name: breakTime.name
          });
        }
        
        // 기존 휴게시간 제거하고 새 휴게시간들 추가
        setWeekDaySettings(prev => ({
          ...prev,
          [day]: {
            ...prev[day],
            breakTimes: [
              ...prev[day].breakTimes.slice(0, foundBreakIndex),
              ...newBreakTimes,
              ...prev[day].breakTimes.slice(foundBreakIndex + 1)
            ]
          }
        }));
      }
    } else {
      // 휴게시간이 아닌 슬롯 → 새 휴게시간 추가 또는 인접한 휴게시간 확장
      
      // 인접한 휴게시간 찾기
      let adjacentBreakIndex = -1;
      for (let i = 0; i < daySettings.breakTimes.length; i++) {
        const breakTime = daySettings.breakTimes[i];
        if (breakTime.end === slotStart || breakTime.start === slotEnd) {
          adjacentBreakIndex = i;
          break;
        }
      }
      
      if (adjacentBreakIndex >= 0) {
        // 인접한 휴게시간 확장
        const adjacentBreak = daySettings.breakTimes[adjacentBreakIndex];
        const newStart = Math.min(adjacentBreak.start, slotStart);
        const newEnd = Math.max(adjacentBreak.end, slotEnd);
        
        setWeekDaySettings(prev => ({
          ...prev,
          [day]: {
            ...prev[day],
            breakTimes: prev[day].breakTimes.map((bt, i) => 
              i === adjacentBreakIndex ? { ...bt, start: newStart, end: newEnd } : bt
            )
          }
        }));
      } else {
        // 새 휴게시간 추가
        setWeekDaySettings(prev => ({
          ...prev,
          [day]: {
            ...prev[day],
            breakTimes: [
              ...prev[day].breakTimes,
              { start: slotStart, end: slotEnd, name: '휴게시간' }
            ]
          }
        }));
      }
    }
  };

  /* Unused - replaced with TimeSlot toggle UI
  const handleAddBreakTime = (day: keyof typeof weekDaySettings) => {
    // 겹치지 않는 시간을 자동으로 찾는 함수
    const findAvailableTimeSlot = (daySettings: any): { start: number; end: number } => {
      const workStart = daySettings.workingHours.start;
      const workEnd = daySettings.workingHours.end;
      const existingTimes: { start: number; end: number }[] = [];
      
      // 기본 휴게시간(lunchTime) 추가
      if (daySettings.lunchTime.start > 0 && daySettings.lunchTime.end > 0) {
        existingTimes.push({
          start: daySettings.lunchTime.start,
          end: daySettings.lunchTime.end
        });
      }
      
      // 기존 휴게시간들 추가
      daySettings.breakTimes.forEach((bt: any) => {
        existingTimes.push({
          start: bt.start,
          end: bt.end
        });
      });
      
      // 시간을 오름차순으로 정렬
      existingTimes.sort((a, b) => a.start - b.start);
      
      // 30분 슬롯으로 사용 가능한 시간 찾기
      const slotDuration = 30; // 30분
      
      // 근무 시작 시간부터 첫 번째 휴게시간 사이 확인
      if (existingTimes.length === 0) {
        return { start: workStart + 60, end: workStart + 60 + slotDuration }; // 근무 시작 1시간 후
      }
      
      // 근무 시작부터 첫 번째 휴게시간까지 공간 확인
      if (existingTimes[0].start - workStart >= slotDuration) {
        return { start: workStart + 30, end: workStart + 30 + slotDuration };
      }
      
      // 기존 휴게시간들 사이의 공간 확인
      for (let i = 0; i < existingTimes.length - 1; i++) {
        const gapStart = existingTimes[i].end;
        const gapEnd = existingTimes[i + 1].start;
        
        if (gapEnd - gapStart >= slotDuration) {
          return { start: gapStart, end: gapStart + slotDuration };
        }
      }
      
      // 마지막 휴게시간 이후부터 근무 종료까지 공간 확인
      const lastEnd = existingTimes[existingTimes.length - 1].end;
      if (workEnd - lastEnd >= slotDuration) {
        return { start: lastEnd, end: lastEnd + slotDuration };
      }
      
      // 공간이 없으면 마지막 휴게시간 30분 후로 설정 (겹침 허용)
      return { start: lastEnd + 30, end: lastEnd + 30 + slotDuration };
    };
    
    const daySettings = weekDaySettings[day];
    const { start: newStart, end: newEnd } = findAvailableTimeSlot(daySettings);
    
    setWeekDaySettings(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breakTimes: [
          ...prev[day].breakTimes,
          { start: newStart, end: newEnd, name: '휴게시간' }
        ]
      }
    }));
  };

  const handleBreakTimeChange = (
    day: keyof typeof weekDaySettings, 
    index: number, 
    field: 'start' | 'end' | 'name', 
    value: number | string
  ) => {
    setWeekDaySettings(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breakTimes: prev[day].breakTimes.map((breakTime, i) => {
          if (i === index) {
            if (field === 'start' || field === 'end') {
              // 시간 필드인 경우 숫자 그대로 사용 (이미 분 단위)
              const timeValue = typeof value === 'number' ? value : parseInt(value as string, 10);
              return { ...breakTime, [field]: timeValue };
            } else {
              // 이름 필드인 경우 그대로
              return { ...breakTime, [field]: value };
            }
          }
          return breakTime;
        })
      }
    }));
  };

  // 휴게시간용 드롭다운 변경 핸들러
  const handleBreakTimeDropdownChange = (
    day: keyof typeof weekDaySettings, 
    index: number, 
    field: 'start' | 'end', 
    type: 'hour' | 'minute', 
    value: string
  ) => {
    const breakTime = weekDaySettings[day].breakTimes[index];
    if (!breakTime) return;
    
    const currentTime = minutesToHourMinute(breakTime[field]);
    let newHour = currentTime.hour;
    let newMinute = currentTime.minute;
    
    if (type === 'hour') {
      newHour = parseInt(value, 10);
    } else {
      newMinute = parseInt(value, 10);
    }
    
    const newMinutes = hourMinuteToMinutes(newHour, newMinute);
    
    // 시작 시간이 종료 시간보다 늦지 않도록 검증
    const otherField = field === 'start' ? 'end' : 'start';
    const otherTime = breakTime[otherField];
    
    let finalMinutes = newMinutes;
    if (field === 'start' && newMinutes >= otherTime) {
      finalMinutes = otherTime - 30;
      if (finalMinutes < 0) finalMinutes = 0;
    } else if (field === 'end' && newMinutes <= otherTime) {
      finalMinutes = otherTime + 30;
      if (finalMinutes >= 24 * 60) finalMinutes = 24 * 60 - 30;
    }
    
    // 새로운 휴게시간이 다른 시간들과 겹치는지 체크 (경고만 표시)
    const newStart = field === 'start' ? finalMinutes : breakTime.start;
    const newEnd = field === 'end' ? finalMinutes : breakTime.end;
    const overlapError = checkTimeOverlap(day, newStart, newEnd, 'break', index);
    
    if (overlapError) {
      console.warn('휴게시간 겹침 경고:', overlapError);
      // alert을 제거하고 경고만 표시 - 저장 시점에 검증
    }
    
    setWeekDaySettings(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breakTimes: prev[day].breakTimes.map((bt, i) => 
          i === index ? { ...bt, [field]: finalMinutes } : bt
        )
      }
    }));
  };
  */

  const handleApplyToAll = (sourceDay: keyof typeof weekDaySettings) => {
    const sourceSettings = weekDaySettings[sourceDay];
    const allDayKeys: (keyof typeof weekDaySettings)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    setWeekDaySettings(prev => {
      const newSettings = { ...prev };
      
      allDayKeys.forEach(dayKey => {
        if (dayKey !== sourceDay) {
          newSettings[dayKey] = {
            ...newSettings[dayKey],
            workingHours: { ...sourceSettings.workingHours },
            breakTimes: sourceSettings.breakTimes.map(bt => ({ ...bt }))
          };
        }
      });
      
      return newSettings;
    });
  };

  // 기본 휴게시간을 모든 비휴일 요일에 적용하는 함수
  const handleApplyLunchTimeToAll = (sourceDay: keyof typeof weekDaySettings) => {
    const sourceLunchTime = weekDaySettings[sourceDay].lunchTime;
    const allDayKeys: (keyof typeof weekDaySettings)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    setWeekDaySettings(prev => {
      const newSettings = { ...prev };
      
      allDayKeys.forEach(dayKey => {
        // 휴일이 아닌 요일에만 적용
        if (dayKey !== sourceDay && !newSettings[dayKey].isHoliday) {
          newSettings[dayKey] = {
            ...newSettings[dayKey],
            lunchTime: { ...sourceLunchTime }
          };
        }
      });
      
      return newSettings;
    });
  };

  const handleRemoveBreakTime = (day: keyof typeof weekDaySettings, index: number) => {
    setWeekDaySettings(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breakTimes: prev[day].breakTimes.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = async () => {
    if (selectedStaffIds.length === 0) {
      setError('코치를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // 저장 전 종합 검증
      const validationErrors: string[] = [];
      
      Object.entries(weekDaySettings).forEach(([dayKey, daySettings]) => {
        if (daySettings.isHoliday) return; // 휴일은 검증하지 않음
        
        const dayName = {
          monday: '월요일',
          tuesday: '화요일', 
          wednesday: '수요일',
          thursday: '목요일',
          friday: '금요일',
          saturday: '토요일',
          sunday: '일요일'
        }[dayKey] || dayKey;
        
        // 기본 휴게시간 검증
        if (daySettings.lunchTime.start > 0 && daySettings.lunchTime.end > 0) {
          const lunchError = checkTimeOverlap(dayKey as keyof typeof weekDaySettings, 
            daySettings.lunchTime.start, daySettings.lunchTime.end, 'lunch');
          if (lunchError) {
            validationErrors.push(`${dayName}: ${lunchError}`);
          }
        }
        
        // 휴게시간들 검증
        daySettings.breakTimes.forEach((breakTime, index) => {
          if (breakTime.start > 0 && breakTime.end > 0) {
            const breakError = checkTimeOverlap(dayKey as keyof typeof weekDaySettings,
              breakTime.start, breakTime.end, 'break', index);
            if (breakError) {
              validationErrors.push(`${dayName}: ${breakError}`);
            }
          }
        });
      });
      
      // 검증 오류가 있으면 저장 중단
      if (validationErrors.length > 0) {
        setError(`다음 오류를 수정해주세요:\n${validationErrors.join('\n')}`);
        setIsLoading(false);
        return;
      }

      // 토요일부터 금요일까지 7일치 DailyScheduleSettings 생성
      const weekStart = new Date(currentWeekStartDate + 'T00:00:00');
      
      console.log('🔍 [휴일설정 저장] weekStart:', weekStart, 'currentWeekStartDate:', currentWeekStartDate);
      
      for (const staffId of selectedStaffIds) {
        const dailySchedules: Omit<DailyScheduleSettings, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        
        // 7일간 반복 (토요일부터 금요일까지)
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const dateString = formatDateToLocal(date);
          
          // 요일 이름 가져오기 (UI 표시용만)
          const dayOfWeek = date.getDay(); // 0=일, 1=월, ..., 6=토
          const dayKeyMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayKey = dayKeyMap[dayOfWeek] as keyof typeof weekDaySettings;
          const daySettings = weekDaySettings[dayKey];
          
          console.log(`🔍 [휴일설정 저장] 날짜: ${dateString}, 요일: ${dayKey}:`, {
            date: date,
            dateString: dateString,
            isHoliday: daySettings.isHoliday
          });
          
          if (daySettings.isHoliday) {
            dailySchedules.push({
              staffId,
              date: dateString,
              isHoliday: true,
              workingHours: { start: 0, end: 0 },
              breakTimes: []
            });
          } else {
            const allBreakTimes = [...daySettings.breakTimes];
            
            // lunchTime이 유효한 경우에만 breakTimes에 추가
            if (daySettings.lunchTime.start > 0 && daySettings.lunchTime.end > 0) {
              allBreakTimes.unshift({
                start: daySettings.lunchTime.start,
                end: daySettings.lunchTime.end,
                name: daySettings.lunchTime.name
              });
            }
            
            dailySchedules.push({
              staffId,
              date: dateString,
              isHoliday: false,
              workingHours: daySettings.workingHours,
              breakTimes: allBreakTimes
            });
          }
        }
        
        // 일별 스케줄 저장
        await dbManager.dailySchedule.saveDailySchedules(dailySchedules);
      }
      
      console.log('일별 스케줄 설정 저장 완료:', selectedStaffIds.length, '명');
      
      // 데이터베이스 작업이 완전히 완료되도록 약간의 지연
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 부모 컴포넌트에 데이터 새로고침 요청
      if (onRefresh) {
        await onRefresh();
      }
      
      onClose();
    } catch (error) {
      console.error('주별 휴일 설정 저장 중 오류 발생:', error);
      setError('휴일 설정 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const dayLabels = [
    { key: 'saturday' as const, label: '토요일', isWeekend: true },
    { key: 'sunday' as const, label: '일요일', isWeekend: true },
    { key: 'monday' as const, label: '월요일', isWeekend: false },
    { key: 'tuesday' as const, label: '화요일', isWeekend: false },
    { key: 'wednesday' as const, label: '수요일', isWeekend: false },
    { key: 'thursday' as const, label: '목요일', isWeekend: false },
    { key: 'friday' as const, label: '금요일', isWeekend: false }
  ];

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {staffId ? `${staffList.find(s => s.id === staffId)?.name} 코치 휴일설정` : '코치 휴일설정'}
          </ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          {/* 에러 메시지 표시 */}
          {error && (
            <ErrorMessage>{error}</ErrorMessage>
          )}

          {/* 코치 선택 (master 권한인 경우만) */}
          {currentUser?.role === 'master' && !staffId && (
            <StaffSelector>
              <SelectorTitle>코치 선택</SelectorTitle>
              {staffList.map(staff => (
                <StaffCheckbox key={staff.id}>
                  <input
                    type="checkbox"
                    id={`staff-${staff.id}`}
                    checked={selectedStaffIds.includes(staff.id)}
                    onChange={() => handleStaffToggle(staff.id)}
                  />
                  <label htmlFor={`staff-${staff.id}`}>{staff.name}</label>
                </StaffCheckbox>
              ))}
            </StaffSelector>
          )}



          {/* 주별 휴일설정 */}
          <WeekSection>
            <WeekNavigationContainer>
              <WeekTitle>
                설정 대상 주: {getWeekDateRange()}
              </WeekTitle>
            </WeekNavigationContainer>
            
            <div style={{ fontSize: '14px', marginBottom: '12px', color: AppColors.onSurface + '80' }}>
              휴일설정은 다음 토요일부터 그 다음주 금요일까지에 대한 결정입니다.
              <br />
              체크하면 휴일, 체크 해제하면 근무일입니다.
            </div>
            
            <WeekDaysContainer>
              {dayLabels.map(({ key, label, isWeekend }) => {
                const daySettings = weekDaySettings[key];
                
                // 토요일부터 시작하는 주간에서 각 요일의 날짜 계산
                const saturdayDate = new Date(currentWeekStartDate + 'T00:00:00');
                
                // 현재 요일에 해당하는 날짜 계산
                const dayOfWeek = saturdayDate.getDay(); // 토요일=6
                const dayKeyMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const currentDayIndex = dayKeyMap.indexOf(key);
                
                // 토요일(6)부터 시작해서 현재 요일까지의 일수 계산
                let daysFromSaturday;
                if (currentDayIndex === 6) { // saturday
                  daysFromSaturday = 0;
                } else if (currentDayIndex === 0) { // sunday
                  daysFromSaturday = 1;
                } else { // monday~friday
                  daysFromSaturday = currentDayIndex + 1;
                }
                
                const currentDate = new Date(saturdayDate);
                currentDate.setDate(saturdayDate.getDate() + daysFromSaturday);
                
                return (
                  <WeekDay key={key} $isWeekend={isWeekend} $isHoliday={daySettings.isHoliday}>
                    <DayLabel $isWeekend={isWeekend} $isHoliday={daySettings.isHoliday}>
                      <span>{label} ({currentDate.getMonth() + 1}/{currentDate.getDate()})</span>
                      <DayToggle>
                        <input
                          type="checkbox"
                          id={`holiday-${key}`}
                          checked={daySettings.isHoliday}
                          onChange={() => {
                            console.log('Checkbox clicked for:', key);
                            handleDayToggle(key);
                          }}
                        />
                        <label htmlFor={`holiday-${key}`}>휴일</label>
                      </DayToggle>
                    </DayLabel>
                    
                    {!daySettings.isHoliday && (
                      <WorkingHoursSection $isVisible={!daySettings.isHoliday}>
                        <WorkingHoursLabel>
                          근무 시간
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <WorkingHoursInputs>
                              <TimeSelectContainer>
                                <HourSelect
                                  value={minutesToHourMinute(daySettings.workingHours.start).hour}
                                  onChange={(e) => handleTimeDropdownChange(key, 'start', 'hour', e.target.value)}
                                >
                                  {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                                    <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
                                  ))}
                                </HourSelect>
                                <span>:</span>
                                <MinuteSelect
                                  value={minutesToHourMinute(daySettings.workingHours.start).minute}
                                  onChange={(e) => handleTimeDropdownChange(key, 'start', 'minute', e.target.value)}
                                >
                                  <option value={0}>00</option>
                                  <option value={30}>30</option>
                                </MinuteSelect>
                              </TimeSelectContainer>
                              <span>~</span>
                              <TimeSelectContainer>
                                <HourSelect
                                  value={minutesToHourMinute(daySettings.workingHours.end).hour}
                                  onChange={(e) => handleTimeDropdownChange(key, 'end', 'hour', e.target.value)}
                                >
                                  {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                                    <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
                                  ))}
                                </HourSelect>
                                <span>:</span>
                                <MinuteSelect
                                  value={minutesToHourMinute(daySettings.workingHours.end).minute}
                                  onChange={(e) => handleTimeDropdownChange(key, 'end', 'minute', e.target.value)}
                                >
                                  <option value={0}>00</option>
                                  <option value={30}>30</option>
                                </MinuteSelect>
                              </TimeSelectContainer>
                            </WorkingHoursInputs>
                            <ApplyToAllButton onClick={() => handleApplyToAll(key)}>
                              모두적용
                            </ApplyToAllButton>
                          </div>
                        </WorkingHoursLabel>
                        
                        {/* 기본 휴게시간 섹션 추가 */}
                        <BreakTimesSection>
                          <WorkingHoursLabel>
                            {daySettings.lunchTime.name}
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <WorkingHoursInputs>
                                <TimeSelectContainer>
                                  <HourSelect
                                    value={minutesToHourMinute(daySettings.lunchTime.start).hour}
                                    onChange={(e) => handleLunchTimeDropdownChange(key, 'start', 'hour', e.target.value)}
                                  >
                                    {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                                      <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
                                    ))}
                                  </HourSelect>
                                  <span>:</span>
                                  <MinuteSelect
                                    value={minutesToHourMinute(daySettings.lunchTime.start).minute}
                                    onChange={(e) => handleLunchTimeDropdownChange(key, 'start', 'minute', e.target.value)}
                                  >
                                    <option value={0}>00</option>
                                    <option value={30}>30</option>
                                  </MinuteSelect>
                                </TimeSelectContainer>
                                <span>~</span>
                                <TimeSelectContainer>
                                  <HourSelect
                                    value={minutesToHourMinute(daySettings.lunchTime.end).hour}
                                    onChange={(e) => handleLunchTimeDropdownChange(key, 'end', 'hour', e.target.value)}
                                  >
                                    {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                                      <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
                                    ))}
                                  </HourSelect>
                                  <span>:</span>
                                  <MinuteSelect
                                    value={minutesToHourMinute(daySettings.lunchTime.end).minute}
                                    onChange={(e) => handleLunchTimeDropdownChange(key, 'end', 'minute', e.target.value)}
                                  >
                                    <option value={0}>00</option>
                                    <option value={30}>30</option>
                                  </MinuteSelect>
                                </TimeSelectContainer>
                              </WorkingHoursInputs>
                              <ApplyToAllButton onClick={() => handleApplyLunchTimeToAll(key)}>
                                모두적용
                              </ApplyToAllButton>
                            </div>
                          </WorkingHoursLabel>
                        </BreakTimesSection>
                        
                        <BreakTimesSection>
                          <BreakTimesLabel>
                            휴게 시간
                            <ApplyToAllButton onClick={() => {
                              const sourceBreakTimes = weekDaySettings[key].breakTimes;
                              const allDayKeys: (keyof typeof weekDaySettings)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                              
                              setWeekDaySettings(prev => {
                                const newSettings = { ...prev };
                                
                                allDayKeys.forEach(dayKey => {
                                  if (dayKey !== key && !newSettings[dayKey].isHoliday) {
                                    newSettings[dayKey] = {
                                      ...newSettings[dayKey],
                                      breakTimes: sourceBreakTimes.map(bt => ({ ...bt }))
                                    };
                                  }
                                });
                                
                                return newSettings;
                              });
                            }}>
                              모두적용
                            </ApplyToAllButton>
                          </BreakTimesLabel>
                          <BreakTimeGrid>
                            {generateTimeSlots(daySettings.workingHours.start, daySettings.workingHours.end).map(slotStart => {
                              const slotEnd = slotStart + 30;
                              const hour = Math.floor(slotStart / 60);
                              const minute = slotStart % 60;
                              const isInBreak = isTimeSlotInBreak(key, slotStart);
                              
                              return (
                                <TimeSlotButton
                                  key={slotStart}
                                  $isActive={isInBreak}
                                  $isDisabled={false}
                                  onClick={() => handleTimeSlotToggle(key, slotStart)}
                                  title={`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} - ${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`}
                                >
                                  {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                                </TimeSlotButton>
                              );
                            })}
                          </BreakTimeGrid>
                        </BreakTimesSection>
                      </WorkingHoursSection>
                    )}
                  </WeekDay>
                );
              })}
            </WeekDaysContainer>
          </WeekSection>
        </ModalBody>

        <ModalFooter>
          <Button $variant="secondary" onClick={onClose} $disabled={isLoading}>
            취소
          </Button>
          <Button $variant="primary" onClick={handleSave} $disabled={isLoading || selectedStaffIds.length === 0}>
            {isLoading ? '저장 중...' : '저장'}
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default WeeklyHolidayModal;