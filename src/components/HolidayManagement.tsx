import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';
import { dbManager } from '../utils/indexedDB';
import type { Staff } from '../utils/db/types';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const Container = styled.div`
  padding: 24px;
  background: ${AppColors.surface};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
  ${AppTextStyles.title2}
  color: ${AppColors.onSurface};
  margin-bottom: 24px;
`;

const StaffSelector = styled.select`
  width: 100%;
  max-width: 300px;
  padding: 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 24px;
  background: ${AppColors.surface};
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
`;

const CalendarContainer = styled.div`
  display: flex;
  gap: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CalendarWrapper = styled.div`
  flex: 1;
  
  .react-calendar {
    width: 100%;
    background: white;
    border: 1px solid ${AppColors.borderLight};
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    font-family: inherit;
  }
  
  .react-calendar__navigation {
    display: flex;
    height: 44px;
    margin-bottom: 1em;
  }
  
  .react-calendar__navigation button {
    min-width: 44px;
    background: none;
    border: none;
    font-size: 16px;
    font-weight: bold;
    color: ${AppColors.onSurface};
    
    &:hover {
      background-color: ${AppColors.btnC};
    }
    
    &:disabled {
      color: ${AppColors.onBtnC};
    }
  }
  
  .react-calendar__month-view__weekdays {
    text-align: center;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 0.75em;
    color: ${AppColors.onInput2};
  }
  
  .react-calendar__tile {
    max-width: 100%;
    padding: 10px 6px;
    background: none;
    border: none;
    text-align: center;
    line-height: 16px;
    font-size: 0.833em;
    color: ${AppColors.onSurface};
    
    &:hover {
      background-color: ${AppColors.btnC};
    }
    
    &:disabled {
      color: ${AppColors.onBtnC};
    }
  }
  
  .react-calendar__tile--active {
    background: ${AppColors.primary} !important;
    color: white !important;
  }
  
  .react-calendar__tile--now {
    background: ${AppColors.tertiary};
    color: white;
  }
  
  .react-calendar__tile--holiday {
    background-color: ${AppColors.error} !important;
    color: white !important;
    font-weight: bold;
  }
  
  .react-calendar__tile--weekend {
    color: ${AppColors.error};
  }
`;

const InfoPanel = styled.div`
  flex: 0 0 300px;
  background: ${AppColors.btnC};
  border-radius: 8px;
  padding: 16px;
`;

const InfoTitle = styled.h4`
  ${AppTextStyles.title3}
  color: ${AppColors.onSurface};
  margin-bottom: 16px;
`;

const HolidayList = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

const HolidayItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid ${AppColors.borderLight};
  
  &:last-child {
    border-bottom: none;
  }
`;

const HolidayDate = styled.span`
  font-size: 14px;
  color: ${AppColors.onSurface};
`;

const RemoveButton = styled.button`
  background: ${AppColors.error};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background: ${AppColors.buttonPrimaryHover};
  }
`;

const ActionButtons = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'primary' ? `
    background: ${AppColors.primary};
    color: white;
    
    &:hover {
      background: ${AppColors.buttonPrimaryHover};
    }
  ` : `
    background: ${AppColors.btnC};
    color: ${AppColors.onSurface};
    
    &:hover {
      background: ${AppColors.borderLight};
    }
  `}
  
  &:disabled {
    background: ${AppColors.borderLight};
    color: ${AppColors.onBtnC};
    cursor: not-allowed;
  }
`;

const StatusText = styled.p`
  font-size: 14px;
  color: ${AppColors.onInput2};
  margin-top: 12px;
`;

interface HolidayManagementProps {
  staffId?: string;
  onHolidayChange?: (staffId: string, holidays: string[]) => void;
}

const HolidayManagement: React.FC<HolidayManagementProps> = ({
  staffId: initialStaffId,
  onHolidayChange
}) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(initialStaffId || '');
  const [holidays, setHolidays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  // 직원 목록 로드
  const loadStaffList = useCallback(async () => {
    try {
      const allStaff = await dbManager.getAllStaff();
      const activeCoaches = allStaff.filter(staff => 
        staff.isActive && staff.role === '코치'
      );
      setStaffList(activeCoaches);
      
      if (!selectedStaffId && activeCoaches.length > 0) {
        setSelectedStaffId(activeCoaches[0].id);
      }
    } catch (error) {
      console.error('직원 목록 로드 실패:', error);
    }
  }, [selectedStaffId]);

  // 선택된 직원의 휴일 목록 로드
  const loadHolidays = useCallback(async () => {
    if (!selectedStaffId) return;
    
    try {
      setLoading(true);
      const staffHolidays = await dbManager.getStaffHolidays(selectedStaffId);
      setHolidays(staffHolidays);
    } catch (error) {
      console.error('휴일 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStaffId]);

  useEffect(() => {
    loadStaffList();
  }, [loadStaffList]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleStaffChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStaffId(event.target.value);
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const addHoliday = async () => {
    if (!selectedDate || !selectedStaffId) return;
    
    try {
      setLoading(true);
      const dateString = formatDate(selectedDate);
      
      if (!holidays.includes(dateString)) {
        await dbManager.addStaffHoliday(selectedStaffId, dateString);
        const updatedHolidays = await dbManager.getStaffHolidays(selectedStaffId);
        setHolidays(updatedHolidays);
        
        onHolidayChange?.(selectedStaffId, updatedHolidays);
      }
    } catch (error) {
      console.error('휴일 추가 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeHoliday = async (dateString: string) => {
    if (!selectedStaffId) return;
    
    try {
      setLoading(true);
      await dbManager.removeStaffHoliday(selectedStaffId, dateString);
      const updatedHolidays = await dbManager.getStaffHolidays(selectedStaffId);
      setHolidays(updatedHolidays);
      
      onHolidayChange?.(selectedStaffId, updatedHolidays);
    } catch (error) {
      console.error('휴일 제거 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeSelectedHoliday = async () => {
    if (!selectedDate || !selectedStaffId) return;
    
    const dateString = formatDate(selectedDate);
    if (holidays.includes(dateString)) {
      await removeHoliday(dateString);
    }
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const dateString = formatDate(date);
    const isHoliday = holidays.includes(dateString);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    const classes = [];
    if (isHoliday) classes.push('react-calendar__tile--holiday');
    if (isWeekend) classes.push('react-calendar__tile--weekend');
    
    return classes.join(' ');
  };

  const selectedStaff = staffList.find(staff => staff.id === selectedStaffId);
  const isSelectedDateHoliday = selectedDate ? 
    holidays.includes(formatDate(selectedDate)) : false;

  return (
    <Container>
      <Title>직원 휴일 관리</Title>
      
      <StaffSelector value={selectedStaffId} onChange={handleStaffChange}>
        <option value="">직원을 선택하세요</option>
        {staffList.map(staff => (
          <option key={staff.id} value={staff.id}>
            {staff.name}
          </option>
        ))}
      </StaffSelector>

      {selectedStaffId && (
        <CalendarContainer>
          <CalendarWrapper>
            <Calendar
              onClickDay={handleDateClick}
              value={selectedDate}
              tileClassName={tileClassName}
              locale="ko-KR"
            />
          </CalendarWrapper>

          <InfoPanel>
            <InfoTitle>
              {selectedStaff?.name}의 휴일 목록
            </InfoTitle>
            
            <HolidayList>
              {holidays.length === 0 ? (
                <StatusText>설정된 휴일이 없습니다.</StatusText>
              ) : (
                holidays.map(holiday => (
                  <HolidayItem key={holiday}>
                    <HolidayDate>{holiday}</HolidayDate>
                    <RemoveButton onClick={() => removeHoliday(holiday)}>
                      삭제
                    </RemoveButton>
                  </HolidayItem>
                ))
              )}
            </HolidayList>

            {selectedDate && (
              <>
                <StatusText>
                  선택된 날짜: {formatDate(selectedDate)}
                  {isSelectedDateHoliday ? ' (휴일)' : ' (근무일)'}
                </StatusText>
                
                <ActionButtons>
                  {isSelectedDateHoliday ? (
                    <ActionButton 
                      variant="secondary" 
                      onClick={removeSelectedHoliday}
                      disabled={loading}
                    >
                      휴일 해제
                    </ActionButton>
                  ) : (
                    <ActionButton 
                      variant="primary" 
                      onClick={addHoliday}
                      disabled={loading}
                    >
                      휴일 설정
                    </ActionButton>
                  )}
                </ActionButtons>
              </>
            )}
          </InfoPanel>
        </CalendarContainer>
      )}
    </Container>
  );
};

export default HolidayManagement;