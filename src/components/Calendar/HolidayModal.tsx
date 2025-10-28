import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';
import { HolidayModalProps } from './types';
import type { HolidaySettings } from '../../utils/indexedDB';

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
  max-width: 800px;
  max-height: 90vh;
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
  font-size: ${AppTextStyles.title2.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${AppColors.onSurface}60;
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: ${AppColors.onSurface};
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  
  /* 스크롤바 숨기기 - WebKit 브라우저 (Chrome, Safari) */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* 스크롤바 숨기기 - Firefox */
  scrollbar-width: none;
  
  /* 스크롤바 숨기기 - IE/Edge */
  -ms-overflow-style: none;
`;

const StaffSelector = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background-color: ${AppColors.background};
  border-radius: 8px;
`;

const StaffSelectorTitle = styled.h3`
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

const CalendarSection = styled.div`
  margin-bottom: 24px;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CalendarTitle = styled.h3`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0;
`;

const MonthNavButton = styled.button`
  background: none;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  color: ${AppColors.onSurface};
  
  &:hover {
    background-color: ${AppColors.background};
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: ${AppColors.borderLight};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  overflow: hidden;
`;

const CalendarGridHeader = styled.div`
  background-color: ${AppColors.primary}10;
  padding: 12px 8px;
  text-align: center;
  font-size: ${AppTextStyles.label1.fontSize};
  font-weight: 600;
  color: ${AppColors.primary};
`;

const CalendarDay = styled.div<{ 
  $isSelectable: boolean; 
  $isWeekend: boolean; 
  $isHoliday: boolean;
  $isToday: boolean;
  $isPastDate?: boolean;
  $hasReservation?: boolean;
}>`
  background-color: ${props => {
    if (props.$isPastDate) return AppColors.onSurface + '05'; // 과거 날짜는 매우 연한 회색
    if (!props.$isSelectable) return AppColors.onSurface + '10';
    // 예약이 있는 경우 초록색 배경 (휴일 설정 불가)
    if (props.$hasReservation) return '#10b98125'; // 초록색
    // 휴일인 경우 빨간색 배경
    if (props.$isHoliday) return AppColors.error + '25';
    // 주말이지만 휴일이 아닌 경우 (근무일로 변경된 주말) 연한 파란색
    if (props.$isWeekend && !props.$isHoliday) return AppColors.primary + '15';
    // 평일 근무일 흰색 배경
    return AppColors.surface;
  }};
  padding: 8px 4px;
  min-height: 40px;
  text-align: center;
  cursor: ${props => (props.$isSelectable && !props.$hasReservation) ? 'pointer' : 'not-allowed'};
  border: ${props => props.$isToday ? `2px solid ${AppColors.primary}` : 'none'};
  transition: background-color 0.2s ease;
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${props => props.$isPastDate ? AppColors.onSurface + '40' : AppColors.onSurface};
  position: relative;
  
  &:hover {
    background-color: ${props => {
      if (!props.$isSelectable || props.$hasReservation) return undefined;
      return props.$isHoliday ? AppColors.error + '40' : AppColors.primary + '30';
    }};
  }
  
  ${props => props.$isPastDate && `
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 10%;
      right: 10%;
      height: 1px;
      background-color: ${AppColors.onSurface}40;
      transform: translateY(-50%);
    }
  `}
`;

const TimeSettingsSection = styled.div`
  margin-bottom: 24px;
`;

const TimeSettingsTitle = styled.h3`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0 0 16px 0;
`;

const TimeInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
`;

const TimeInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  font-size: ${AppTextStyles.body2.fontSize};
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
`;

const ModalFooter = styled.div`
  padding: 24px;
  border-top: 1px solid ${AppColors.borderLight};
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ErrorMessage = styled.div`
  background-color: ${AppColors.error}10;
  border: 1px solid ${AppColors.error}40;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  color: ${AppColors.error};
  font-size: ${AppTextStyles.body2.fontSize};
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary'; $disabled?: boolean }>`
  padding: 12px 24px;
  border-radius: 6px;
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 500;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.$disabled ? 0.6 : 1};
  
  ${props => props.$variant === 'primary' ? `
    background-color: ${AppColors.primary};
    color: ${AppColors.onPrimary};
    border: none;
    
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

const HolidayModal: React.FC<HolidayModalProps> = ({
  isOpen,
  onClose,
  staffId,
  staffList,
  currentUser,
  onSave,
  existingHolidays = [], // 기존 휴일 설정 데이터
  existingEvents = [] // 기존 예약 이벤트 데이터
}) => {
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [holidaySettings, setHolidaySettings] = useState<Map<string, boolean>>(new Map());
  const [defaultStartTime, setDefaultStartTime] = useState(10);
  const [defaultEndTime, setDefaultEndTime] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 특정 날짜에 예약이 있는지 확인하는 함수
  const hasReservationOnDate = useCallback((dateKey: string, staffId: string): boolean => {
    return existingEvents.some(event => {
      // '휴일' 이벤트는 제외
      if (event.title === '휴일') return false;
      
      const eventDate = new Date(event.startTime);
      const eventDateKey = eventDate.toISOString().split('T')[0];
      
      return event.staffId === staffId && eventDateKey === dateKey;
    });
  }, [existingEvents]);

  // 권한 체크 - useCallback으로 최적화
  const canEditStaff = useCallback((targetStaffId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'master') return true;
    return currentUser.id === targetStaffId;
  }, [currentUser]);

  // 선택 가능한 코치 목록 필터링 - useMemo로 최적화
  const selectableStaff = useMemo(() => 
    staffList.filter(staff => 
      staff.role === '코치' && canEditStaff(staff.id)
    ), [staffList, canEditStaff]
  );

  useEffect(() => {
    if (isOpen) {
      if (staffId) {
        // 특정 코치 선택
        setSelectedStaffIds([staffId]);
      } else {
        // 전체 코치 또는 권한에 따른 기본 선택
        const defaultSelected = currentUser?.role === 'master' 
          ? selectableStaff.map(s => s.id)
          : selectableStaff.filter(s => s.id === currentUser?.id).map(s => s.id);
        setSelectedStaffIds(defaultSelected);
      }
    }
  }, [isOpen, staffId, currentUser, selectableStaff]);

  // 기존 휴일 설정 로드
  useEffect(() => {
    if (isOpen && existingHolidays && selectedStaffIds.length > 0) {
      const newHolidaySettings = new Map<string, boolean>();
      
      // 선택된 코치들의 기존 휴일 설정 로드
      selectedStaffIds.forEach(staffId => {
        const staffHolidays = existingHolidays.filter(h => h.staffId === staffId);
        staffHolidays.forEach(holiday => {
          newHolidaySettings.set(holiday.date, holiday.isHoliday);
        });
      });
      
      setHolidaySettings(newHolidaySettings);
    } else if (isOpen) {
      // 모달이 열렸을 때 기존 설정이 없으면 초기화
      setHolidaySettings(new Map());
    }
  }, [isOpen, existingHolidays, selectedStaffIds]);

  // 달력 데이터 생성 - useMemo로 성능 최적화 및 상태 변경 감지
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간 정보 제거하여 날짜만 비교
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0); // 시간 정보 제거
      
      const isCurrentMonth = date.getMonth() === month;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isToday = date.getTime() === today.getTime();
      const isPastDate = date < today; // 오늘 이전 날짜 체크
      
      // 선택 가능 조건:
      // 1. 현재 월에 속함
      // 2. 오늘 이후 날짜
      // 3. 선택된 코치들의 계약기간 내
      const isSelectable = isCurrentMonth && !isPastDate && selectedStaffIds.every(staffId => {
        const staff = staffList.find(s => s.id === staffId);
        if (!staff?.contractStartDate || !staff?.contractEndDate) return true;
        
        // 계약일도 Date 객체의 시간 정보 제거
        const contractStart = new Date(staff.contractStartDate);
        contractStart.setHours(0, 0, 0, 0);
        const contractEnd = new Date(staff.contractEndDate);
        contractEnd.setHours(0, 0, 0, 0);
        
        return date >= contractStart && date <= contractEnd;
      });
      
      const dateKey = date.toISOString().split('T')[0];
      // 휴일 설정: 명시적으로 설정된 값이 있으면 사용, 없으면 주말 기본값
      const isHoliday = holidaySettings.has(dateKey) 
        ? holidaySettings.get(dateKey)! 
        : isWeekend;
      
      // 선택된 코치들 중 하나라도 예약이 있는지 확인
      const hasReservation = selectedStaffIds.some(staffId => 
        hasReservationOnDate(dateKey, staffId)
      );

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isWeekend,
        isToday,
        isPastDate,
        isSelectable: isSelectable && !hasReservation, // 예약이 있으면 선택 불가
        isHoliday,
        dateKey,
        hasReservation
      });
    }
    
    return days;
  }, [currentMonth, selectedStaffIds, staffList, holidaySettings, hasReservationOnDate]);

  const handleStaffToggle = (staffId: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleDateClick = (dateKey: string, isSelectable: boolean, isWeekend: boolean, hasReservation: boolean) => {
    if (!isSelectable || hasReservation) return;
    
    console.log('Date clicked:', { dateKey, isSelectable, isWeekend, hasReservation });
    
    setHolidaySettings(prev => {
      const newMap = new Map(prev);
      const currentValue = newMap.has(dateKey) ? newMap.get(dateKey)! : isWeekend;
      const newValue = !currentValue;
      
      console.log('Holiday setting change:', { 
        dateKey, 
        currentValue, 
        newValue,
        isWeekend 
      });
      
      newMap.set(dateKey, newValue);
      return newMap;
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const settings: Omit<HolidaySettings, 'id' | 'createdAt' | 'updatedAt'>[] = [];
      
      // 모든 명시적으로 설정된 날짜들을 저장
      holidaySettings.forEach((isHoliday, dateKey) => {
        selectedStaffIds.forEach(staffId => {
          settings.push({
            staffId,
            date: dateKey,
            isHoliday,
            workingHours: isHoliday ? undefined : {
              start: defaultStartTime,
              end: defaultEndTime
            }
          });
        });
      });
      
      await onSave(settings);
      onClose();
    } catch (error) {
      console.error('휴일 설정 저장 중 오류 발생:', error);
      setError('휴일 설정 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  if (!isOpen) return null;

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

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
              <StaffSelectorTitle>대상 코치 선택</StaffSelectorTitle>
              {selectableStaff.map(staff => (
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
            <TimeSettingsTitle>기본 근무시간 설정</TimeSettingsTitle>
            <TimeInputContainer>
              <span>시작 시간:</span>
              <TimeInput
                type="number"
                min="0"
                max="23"
                value={defaultStartTime}
                onChange={(e) => setDefaultStartTime(Number(e.target.value))}
              />
              <span>시</span>
              <span>종료 시간:</span>
              <TimeInput
                type="number"
                min="1"
                max="24"
                value={defaultEndTime}
                onChange={(e) => setDefaultEndTime(Number(e.target.value))}
              />
              <span>시</span>
            </TimeInputContainer>
          </TimeSettingsSection>

          {/* 달력 */}
          <CalendarSection>
            <CalendarHeader>
              <CalendarTitle>
                {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
              </CalendarTitle>
              <div>
                <MonthNavButton onClick={handlePrevMonth}>이전</MonthNavButton>
                <MonthNavButton onClick={handleNextMonth} style={{ marginLeft: '8px' }}>다음</MonthNavButton>
              </div>
            </CalendarHeader>
            <div style={{ fontSize: '14px', marginBottom: '12px', color: AppColors.onSurface + '80' }}>
              * 클릭하여 휴일/근무일 전환 (빨간색: 휴일, 연한파란색: 근무일로 변경된 주말, 흰색: 평일 근무일)
              <br />* 초록색: 예약이 있는 날짜 (휴일 설정 불가)
              <br />* 오늘 이전 날짜 및 계약기간 외 날짜는 설정 불가
              <br />* 주말은 기본 휴일이지만 클릭으로 근무일 변경 가능
            </div>
            <CalendarGrid>
              {weekDays.map(day => (
                <CalendarGridHeader key={day}>{day}</CalendarGridHeader>
              ))}
              {calendarDays.map((day, index) => (
                <CalendarDay
                  key={index}
                  $isSelectable={day.isSelectable}
                  $isWeekend={day.isWeekend}
                  $isHoliday={day.isHoliday}
                  $isToday={day.isToday}
                  $isPastDate={day.isPastDate}
                  $hasReservation={day.hasReservation}
                  onClick={() => handleDateClick(day.dateKey, day.isSelectable, day.isWeekend, day.hasReservation)}
                >
                  {day.isCurrentMonth ? day.day : ''}
                </CalendarDay>
              ))}
            </CalendarGrid>
          </CalendarSection>
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

export default HolidayModal;
