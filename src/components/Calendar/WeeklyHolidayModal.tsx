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

const TimeInput = styled.input`
  width: 50px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
    box-shadow: 0 0 0 2px ${AppColors.primary}20;
  }
  
  /* Hide number input spinners */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &[type=number] {
    appearance: textfield;
    -moz-appearance: textfield;
  }
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

const TimeSettingsSection = styled.div`
  margin-bottom: 20px;
  background-color: ${AppColors.background};
  border-radius: 8px;
  padding: 12px;
  border: 1px solid ${AppColors.borderLight};
`;

const TimeSettingsTitle = styled.h4`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const TimeInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  label {
    font-size: 0.9rem;
    color: ${AppColors.onSurface};
    font-weight: 500;
    min-width: 70px;
  }
  
  input {
    width: 60px;
    padding: 8px 10px;
    border: 1px solid ${AppColors.borderLight};
    border-radius: 4px;
    text-align: center;
    font-size: 0.9rem;
    font-weight: 500;
    
    &:focus {
      outline: none;
      border-color: ${AppColors.primary};
      box-shadow: 0 0 0 2px ${AppColors.primary}20;
    }
  }
  
  span {
    color: ${AppColors.onSurface + '80'};
    font-size: 0.9rem;
  }
`;

const TimeInputRow = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
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
      workingHours: { start: 9, end: 21 },
      breakTimes: []
    },
    tuesday: {
      isHoliday: false,
      workingHours: { start: 9, end: 21 },
      breakTimes: []
    },
    wednesday: {
      isHoliday: false,
      workingHours: { start: 9, end: 21 },
      breakTimes: []
    },
    thursday: {
      isHoliday: false,
      workingHours: { start: 9, end: 21 },
      breakTimes: []
    },
    friday: {
      isHoliday: false,
      workingHours: { start: 9, end: 21 },
      breakTimes: []
    },
    saturday: {
      isHoliday: true,  // 기본값: 주말 휴일
      workingHours: { start: 9, end: 21 },
      breakTimes: []
    },
    sunday: {
      isHoliday: true,  // 기본값: 주말 휴일
      workingHours: { start: 9, end: 21 },
      breakTimes: []
    }
  });
  const [defaultStartTime, setDefaultStartTime] = useState(9);
  const [defaultEndTime, setDefaultEndTime] = useState(21);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 현재 설정 가능한 주의 월요일 날짜 계산
  const getCurrentSettableWeekStartDate = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ..., 5: 금요일, 6: 토요일
    
    let targetWeek: Date;
    
    if (dayOfWeek >= 0 && dayOfWeek <= 5) {
      // 일요일부터 금요일까지: 다음주 설정 가능
      targetWeek = new Date(today);
      const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      targetWeek.setDate(today.getDate() + daysUntilNextMonday);
    } else {
      // 토요일(6): 그 다음주 설정 가능 (다다음주)
      targetWeek = new Date(today);
      const daysUntilNextNextMonday = 2; // 토요일 기준으로 2일 후가 다다음주 월요일
      targetWeek.setDate(today.getDate() + daysUntilNextNextMonday);
    }
    
    return targetWeek.toISOString().split('T')[0];
  };
  
  // 주 날짜 범위 표시
  const getWeekDateRange = (): string => {
    const startDate = new Date(currentWeekStartDate + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
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

      // 기본 근무시간 설정 (첫 번째 선택된 직원 기준)
      const firstStaffId = staffId || selectedStaffIds[0];
      if (firstStaffId) {
        const staff = staffList.find(s => s.id === firstStaffId);
        if (staff?.workingHours) {
          setDefaultStartTime(staff.workingHours.start);
          setDefaultEndTime(staff.workingHours.end);
        }
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
              workingHours: existingDay?.workingHours ?? { start: 9, end: 21 },
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
            workingHours: { start: defaultStartTime, end: defaultEndTime },
            breakTimes: []
          },
          tuesday: {
            isHoliday: false,
            workingHours: { start: defaultStartTime, end: defaultEndTime },
            breakTimes: []
          },
          wednesday: {
            isHoliday: false,
            workingHours: { start: defaultStartTime, end: defaultEndTime },
            breakTimes: []
          },
          thursday: {
            isHoliday: false,
            workingHours: { start: defaultStartTime, end: defaultEndTime },
            breakTimes: []
          },
          friday: {
            isHoliday: false,
            workingHours: { start: defaultStartTime, end: defaultEndTime },
            breakTimes: []
          },
          saturday: {
            isHoliday: true,
            workingHours: { start: defaultStartTime, end: defaultEndTime },
            breakTimes: []
          },
          sunday: {
            isHoliday: true,
            workingHours: { start: defaultStartTime, end: defaultEndTime },
            breakTimes: []
          }
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentWeekStartDate, selectedStaffIds, existingWeeklyHolidays, defaultStartTime, defaultEndTime]);

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

  const handleWorkingHoursChange = (day: keyof typeof weekDaySettings, field: 'start' | 'end', value: number) => {
    setWeekDaySettings(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        workingHours: {
          ...prev[day].workingHours,
          [field]: value
        }
      }
    }));
  };

  // 시간 입력 처리 함수 추가
  const handleTimeInputChange = (
    value: string, 
    onChange: (value: number) => void
  ) => {
    // 숫자만 허용
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue === '') {
      onChange(1); // 빈 값일 때 최소값으로 설정
      return;
    }
    
    const num = parseInt(numericValue, 10);
    
    // 1-24 범위로 제한
    if (num >= 1 && num <= 24) {
      onChange(num);
    } else if (num > 24) {
      onChange(24);
    } else if (num < 1) {
      onChange(1);
    }
  };

  const handleDefaultTimeChange = (field: 'start' | 'end', value: string) => {
    handleTimeInputChange(value, (num) => {
      if (field === 'start') {
        setDefaultStartTime(num);
      } else {
        setDefaultEndTime(num);
      }
    });
  };

  const handleAddBreakTime = (day: keyof typeof weekDaySettings) => {
    setWeekDaySettings(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breakTimes: [
          ...prev[day].breakTimes,
          { start: 12, end: 13, name: '점심시간' }
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
        breakTimes: prev[day].breakTimes.map((breakTime, i) => 
          i === index ? { ...breakTime, [field]: value } : breakTime
        )
      }
    }));
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
    { key: 'monday' as const, label: '월요일', isWeekend: false },
    { key: 'tuesday' as const, label: '화요일', isWeekend: false },
    { key: 'wednesday' as const, label: '수요일', isWeekend: false },
    { key: 'thursday' as const, label: '목요일', isWeekend: false },
    { key: 'friday' as const, label: '금요일', isWeekend: false },
    { key: 'saturday' as const, label: '토요일', isWeekend: true },
    { key: 'sunday' as const, label: '일요일', isWeekend: true }
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

          {/* 기본 근무시간 설정 */}
          <TimeSettingsSection>
            <TimeSettingsTitle>
              기본 근무시간
              <TimeInputRow>
                <TimeInputContainer>
                  <label>시작:</label>
                  <input
                    type="text"
                    value={defaultStartTime}
                    onChange={(e) => handleDefaultTimeChange('start', e.target.value)}
                    style={{
                      width: '60px',
                      padding: '8px 10px',
                      border: `1px solid ${AppColors.borderLight}`,
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  />
                  <span>시</span>
                </TimeInputContainer>
                <TimeInputContainer>
                  <label>종료:</label>
                  <input
                    type="text"
                    value={defaultEndTime}
                    onChange={(e) => handleDefaultTimeChange('end', e.target.value)}
                    style={{
                      width: '60px',
                      padding: '8px 10px',
                      border: `1px solid ${AppColors.borderLight}`,
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  />
                  <span>시</span>
                </TimeInputContainer>
              </TimeInputRow>
            </TimeSettingsTitle>
          </TimeSettingsSection>

          {/* 주별 휴일설정 */}
          <WeekSection>
            <WeekHeader>
              <WeekTitle>
                설정 대상 주: {getWeekDateRange()}
              </WeekTitle>
            </WeekHeader>
            
            <div style={{ fontSize: '14px', marginBottom: '12px', color: AppColors.onSurface + '80' }}>
              {(() => {
                const today = new Date();
                const dayOfWeek = today.getDay();
                if (dayOfWeek >= 0 && dayOfWeek <= 5) {
                  return '금요일 오후 6시 전까지 다음주 휴일과 근무시간을 설정할 수 있습니다.';
                } else {
                  return '토요일이므로 그 다음주 휴일과 근무시간을 설정할 수 있습니다.';
                }
              })()}
              <br />
              체크하면 휴일, 체크 해제하면 근무일입니다.
            </div>
            
            <WeekDaysContainer>
              {dayLabels.map(({ key, label, isWeekend }) => {
                const daySettings = weekDaySettings[key];
                const currentDate = new Date(currentWeekStartDate);
                currentDate.setDate(currentDate.getDate() + ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(key));
                
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
                          <WorkingHoursInputs>
                            <TimeInput
                              type="text"
                              value={daySettings.workingHours.start}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                handleTimeInputChange(e.target.value, (num) => {
                                  handleWorkingHoursChange(key, 'start', num);
                                });
                              }}
                            />
                            <span>시 ~</span>
                            <TimeInput
                              type="text"
                              value={daySettings.workingHours.end}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                handleTimeInputChange(e.target.value, (num) => {
                                  handleWorkingHoursChange(key, 'end', num);
                                });
                              }}
                            />
                            <span>시</span>
                          </WorkingHoursInputs>
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
                              <TimeInput
                                type="text"
                                value={breakTime.start}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  handleTimeInputChange(e.target.value, (num) => {
                                    handleBreakTimeChange(key, index, 'start', num);
                                  });
                                }}
                              />
                              <span>시 ~</span>
                              <TimeInput
                                type="text"
                                value={breakTime.end}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  handleTimeInputChange(e.target.value, (num) => {
                                    handleBreakTimeChange(key, index, 'end', num);
                                  });
                                }}
                              />
                              <span>시</span>
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