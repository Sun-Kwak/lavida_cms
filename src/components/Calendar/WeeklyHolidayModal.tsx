import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';
import type { WeeklyHolidaySettings } from '../../utils/db/types';

interface WeeklyHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId?: string; // undefined면 전체 코치
  staffList: Array<{
    id: string;
    name: string;
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

const WeekHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
`;

const WeekTitle = styled.h3`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0;
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
  existingWeeklyHolidays = []
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


  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState('');
  const [weekDaySettings, setWeekDaySettings] = useState<{
    monday: { isHoliday: boolean; workingHours: { start: number; end: number; }; breakTimes: { start: number; end: number; name: string; }[]; };
    tuesday: { isHoliday: boolean; workingHours: { start: number; end: number; }; breakTimes: { start: number; end: number; name: string; }[]; };
    wednesday: { isHoliday: boolean; workingHours: { start: number; end: number; }; breakTimes: { start: number; end: number; name: string; }[]; };
    thursday: { isHoliday: boolean; workingHours: { start: number; end: number; }; breakTimes: { start: number; end: number; name: string; }[]; };
    friday: { isHoliday: boolean; workingHours: { start: number; end: number; }; breakTimes: { start: number; end: number; name: string; }[]; };
    saturday: { isHoliday: boolean; workingHours: { start: number; end: number; }; breakTimes: { start: number; end: number; name: string; }[]; };
    sunday: { isHoliday: boolean; workingHours: { start: number; end: number; }; breakTimes: { start: number; end: number; name: string; }[]; };
  }>({
    monday: {
      isHoliday: false,
      workingHours: { start: 540, end: 1260 }, // 09:00 ~ 21:00 (분 단위)
      breakTimes: []
    },
    tuesday: {
      isHoliday: false,
      workingHours: { start: 540, end: 1260 },
      breakTimes: []
    },
    wednesday: {
      isHoliday: false,
      workingHours: { start: 540, end: 1260 },
      breakTimes: []
    },
    thursday: {
      isHoliday: false,
      workingHours: { start: 540, end: 1260 },
      breakTimes: []
    },
    friday: {
      isHoliday: false,
      workingHours: { start: 540, end: 1260 },
      breakTimes: []
    },
    saturday: {
      isHoliday: true,  // 기본값: 주말 휴일
      workingHours: { start: 540, end: 1260 },
      breakTimes: []
    },
    sunday: {
      isHoliday: true,  // 기본값: 주말 휴일
      workingHours: { start: 540, end: 1260 },
      breakTimes: []
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 현재 설정 가능한 주의 월요일 날짜 계산
  // 휴일설정은 이번주 토요일부터 다음주 금요일까지에 대한 결정
  const getCurrentSettableWeekStartDate = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ..., 5: 금요일, 6: 토요일
    
    // 이번주 토요일 계산
    let thisWeekSaturday = new Date(today);
    const daysUntilSaturday = 6 - dayOfWeek; // 토요일까지 남은 일수 (토요일이면 0)
    thisWeekSaturday.setDate(today.getDate() + daysUntilSaturday);
    
    // 토요일부터 시작하는 주의 월요일 계산 (토요일 + 2일)
    const targetMonday = new Date(thisWeekSaturday);
    targetMonday.setDate(thisWeekSaturday.getDate() + 2); // 토요일 + 2일 = 월요일
    
    return targetMonday.toISOString().split('T')[0];
  };
  
  // 주 날짜 범위 표시 (토요일부터 금요일까지)
  const getWeekDateRange = (): string => {
    const mondayDate = new Date(currentWeekStartDate + 'T00:00:00');
    
    // 월요일에서 토요일로 이동 (월요일 - 2일 = 토요일)
    const saturdayDate = new Date(mondayDate);
    saturdayDate.setDate(mondayDate.getDate() - 2);
    
    // 토요일에서 금요일로 이동 (토요일 + 6일 = 금요일)
    const fridayDate = new Date(saturdayDate);
    fridayDate.setDate(saturdayDate.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };
    
    return `${formatDate(saturdayDate)} - ${formatDate(fridayDate)}`;
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
  }, [isOpen, staffId, currentUser, staffList, selectedStaffIds]);

  // 기존 설정 로드
  useEffect(() => {
    console.log('useEffect triggered:', { isOpen, currentWeekStartDate, selectedStaffIds: selectedStaffIds.length });
    
    if (isOpen && currentWeekStartDate) {
      if (selectedStaffIds.length > 0) {
        const existingSetting = existingWeeklyHolidays.find(
          setting => setting.weekStartDate === currentWeekStartDate && 
                    selectedStaffIds.includes(setting.staffId)
        );
        
        if (existingSetting) {
          console.log('Found existing setting:', existingSetting);
          // 기존 설정이 있다면 로드하되, 구조가 맞지 않으면 기본값 사용
          const normalizedWeekDays = Object.keys(weekDaySettings).reduce((acc, day) => {
            const dayKey = day as keyof typeof weekDaySettings;
            const existingDay = existingSetting.weekDays[dayKey];
            
            acc[dayKey] = {
              isHoliday: existingDay?.isHoliday ?? false,
              workingHours: existingDay?.workingHours ?? { start: 540, end: 1260 }, // 기본값: 09:00 ~ 21:00
              breakTimes: (existingDay?.breakTimes ?? []).map(bt => ({
                start: bt.start,
                end: bt.end,
                name: bt.name || '휴게시간'
              }))
            };
            
            return acc;
          }, {} as typeof weekDaySettings);
          
          setWeekDaySettings(normalizedWeekDays);
        } else {
          console.log('No existing setting found, using default state');
        }
      } else {
        // 기본값으로 리셋 (주말만 휴일)
        setWeekDaySettings({
          monday: {
            isHoliday: false,
            workingHours: { start: 540, end: 1260 }, // 09:00 ~ 21:00
            breakTimes: []
          },
          tuesday: {
            isHoliday: false,
            workingHours: { start: 540, end: 1260 },
            breakTimes: []
          },
          wednesday: {
            isHoliday: false,
            workingHours: { start: 540, end: 1260 },
            breakTimes: []
          },
          thursday: {
            isHoliday: false,
            workingHours: { start: 540, end: 1260 },
            breakTimes: []
          },
          friday: {
            isHoliday: false,
            workingHours: { start: 540, end: 1260 },
            breakTimes: []
          },
          saturday: {
            isHoliday: true,
            workingHours: { start: 540, end: 1260 },
            breakTimes: []
          },
          sunday: {
            isHoliday: true,
            workingHours: { start: 540, end: 1260 },
            breakTimes: []
          }
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentWeekStartDate, selectedStaffIds, existingWeeklyHolidays]);

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
      const newState = {
        ...prev,
        [day]: {
          ...prev[day],
          isHoliday: !prev[day].isHoliday
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





  const handleAddBreakTime = (day: keyof typeof weekDaySettings) => {
    setWeekDaySettings(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breakTimes: [
          ...prev[day].breakTimes,
          { start: 720, end: 780, name: '점심시간' } // 12:00 ~ 13:00
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
      const settings: Omit<WeeklyHolidaySettings, 'id' | 'createdAt' | 'updatedAt'>[] = [];
      
      selectedStaffIds.forEach(staffId => {
        settings.push({
          staffId,
          weekStartDate: currentWeekStartDate,
          weekDays: weekDaySettings
        });
      });
      
      await onSave(settings);
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
            <WeekHeader>
              <WeekTitle>
                설정 대상 주: {getWeekDateRange()}
              </WeekTitle>
            </WeekHeader>
            
            <div style={{ fontSize: '14px', marginBottom: '12px', color: AppColors.onSurface + '80' }}>
              휴일설정은 다음 토요일부터 그 다음주 금요일까지에 대한 결정입니다.
              <br />
              체크하면 휴일, 체크 해제하면 근무일입니다.
            </div>
            
            <WeekDaysContainer>
              {dayLabels.map(({ key, label, isWeekend }) => {
                const daySettings = weekDaySettings[key];
                
                // 토요일부터 시작하는 주간에서 각 요일의 날짜 계산
                const mondayDate = new Date(currentWeekStartDate);
                const saturdayDate = new Date(mondayDate);
                saturdayDate.setDate(mondayDate.getDate() - 2); // 월요일 - 2일 = 토요일
                
                // 토요일부터의 요일 순서로 계산
                const dayOrder = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                const dayIndex = dayOrder.indexOf(key);
                const currentDate = new Date(saturdayDate);
                currentDate.setDate(saturdayDate.getDate() + dayIndex);
                
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
                        
                        <BreakTimesSection>
                          <BreakTimesLabel>
                            휴게 시간
                            <AddBreakTimeButton onClick={() => handleAddBreakTime(key)}>
                              + 추가
                            </AddBreakTimeButton>
                          </BreakTimesLabel>
                          {daySettings.breakTimes && daySettings.breakTimes.map((breakTime, index) => (
                            <BreakTimeRow key={index}>
                              <BreakTimeInput
                                type="text"
                                placeholder="휴게시간명"
                                value={breakTime.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBreakTimeChange(key, index, 'name', e.target.value)}
                              />
                              <TimeSelectContainer>
                                <HourSelect
                                  value={minutesToHourMinute(breakTime.start).hour}
                                  onChange={(e) => handleBreakTimeDropdownChange(key, index, 'start', 'hour', e.target.value)}
                                >
                                  {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                                    <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
                                  ))}
                                </HourSelect>
                                <span>:</span>
                                <MinuteSelect
                                  value={minutesToHourMinute(breakTime.start).minute}
                                  onChange={(e) => handleBreakTimeDropdownChange(key, index, 'start', 'minute', e.target.value)}
                                >
                                  <option value={0}>00</option>
                                  <option value={30}>30</option>
                                </MinuteSelect>
                              </TimeSelectContainer>
                              <span>~</span>
                              <TimeSelectContainer>
                                <HourSelect
                                  value={minutesToHourMinute(breakTime.end).hour}
                                  onChange={(e) => handleBreakTimeDropdownChange(key, index, 'end', 'hour', e.target.value)}
                                >
                                  {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                                    <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
                                  ))}
                                </HourSelect>
                                <span>:</span>
                                <MinuteSelect
                                  value={minutesToHourMinute(breakTime.end).minute}
                                  onChange={(e) => handleBreakTimeDropdownChange(key, index, 'end', 'minute', e.target.value)}
                                >
                                  <option value={0}>00</option>
                                  <option value={30}>30</option>
                                </MinuteSelect>
                              </TimeSelectContainer>
                              <RemoveBreakTimeButton onClick={() => handleRemoveBreakTime(key, index)}>
                                삭제
                              </RemoveBreakTimeButton>
                            </BreakTimeRow>
                          ))}
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