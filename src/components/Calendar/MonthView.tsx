import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';
import { ScheduleEvent, StaffInfo } from './types';
import { getMonthDates, isEventOnDate, isSameMonth, getHolidayStaffNames, formatHolidayInfo } from './utils';
import type { WeeklyHolidaySettings } from '../../utils/db/types';

interface MonthViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  staffList: StaffInfo[];
  selectedStaffIds: string[];
  onEventClick?: (event: ScheduleEvent) => void;
  onEventCreate?: (startTime: Date, endTime: Date, staffId?: string) => void;
  onDateClick?: (date: Date) => void;
  allowEmptyStaff?: boolean; // 코치가 없어도 달력 표시 허용
  programDuration?: number; // 프로그램 소요시간 (분 단위)
  disablePastTime?: boolean; // 과거 시간 비활성화 여부
  staffHolidays?: { staffId: string; holidays: string[] }[]; // 직원별 휴일 정보 (기존 방식)
  weeklyHolidaySettings?: WeeklyHolidaySettings[]; // 새로운 주별 휴일 설정
}

const MonthContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  background-color: ${AppColors.surface};
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  background-color: ${AppColors.background};
  border-bottom: 1px solid ${AppColors.borderLight};
`;

const DayHeader = styled.div`
  flex: 1;
  padding: 12px 8px;
  text-align: center;
  border-right: 1px solid ${AppColors.borderLight};
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};

  &:last-child {
    border-right: none;
  }
`;

const WeekContainer = styled.div`
  display: flex;
  flex: 1;
  min-height: 120px;
  border-bottom: 1px solid ${AppColors.borderLight};

  &:last-child {
    border-bottom: none;
  }
`;

const DayCell = styled.div<{ 
  $isToday: boolean; 
  $isCurrentMonth: boolean; 
  $isWeekend: boolean; 
  $hasEvents: boolean;
  $isPastDate: boolean;
  $hasHoliday?: boolean;
}>`
  flex: 1;
  border-right: 1px solid ${AppColors.borderLight};
  padding: 8px;
  cursor: ${props => props.$isPastDate ? 'not-allowed' : 'pointer'};
  position: relative;
  opacity: ${props => props.$isPastDate ? 0.5 : 1};
  background-color: ${props => 
    props.$isPastDate ? AppColors.onSurface + '05' :
    props.$hasHoliday ? AppColors.error + '05' :
    props.$isToday ? AppColors.primary + '10' : 
    !props.$isCurrentMonth ? AppColors.surface + '80' :
    'transparent'
  };

  &:hover {
    background-color: ${props => 
      props.$isPastDate ? AppColors.onSurface + '05' :
      props.$isCurrentMonth ? AppColors.primary + '05' : AppColors.surface + '90'
    };
  }

  &:last-child {
    border-right: none;
  }
`;

const DateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
  flex-wrap: wrap;
  gap: 2px;
`;

const DateNumber = styled.div<{ 
  $isToday: boolean; 
  $isCurrentMonth: boolean; 
  $isWeekend: boolean;
}>`
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: ${props => props.$isToday ? 600 : 500};
  color: ${props => 
    props.$isToday ? AppColors.primary :
    !props.$isCurrentMonth ? AppColors.onSurface + '40' :
    props.$isWeekend ? AppColors.error :
    AppColors.onSurface
  };
`;

const HolidayInfo = styled.div`
  font-size: 9px;
  color: ${AppColors.error};
  font-weight: 500;
  line-height: 1.1;
  flex: 1;
  text-align: right;
  word-break: break-word;
`;

const EventsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 80px;
  overflow: hidden;
`;

const EventItem = styled.div<{ $color: string }>`
  font-size: 10px;
  padding: 1px 4px;
  background-color: ${props => props.$color}20;
  border: 1px solid ${props => props.$color};
  border-radius: 2px;
  color: ${AppColors.onSurface};
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background-color: ${props => props.$color}30;
  }
`;

const MoreEventsIndicator = styled.div`
  font-size: 10px;
  color: ${AppColors.onSurface}60;
  text-align: center;
  margin-top: 2px;
  cursor: pointer;

  &:hover {
    color: ${AppColors.primary};
  }
`;

const StaffFilter = styled.div`
  padding: 8px 12px;
  background-color: ${AppColors.background};
  border-bottom: 1px solid ${AppColors.borderLight};
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const FilterLabel = styled.span`
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 500;
  color: ${AppColors.onSurface};
`;

const StaffChip = styled.div<{ $color: string; $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid ${props => props.$active ? props.$color : AppColors.borderLight};
  border-radius: 12px;
  background-color: ${props => props.$active ? props.$color + '20' : AppColors.surface};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.$color};
    background-color: ${props => props.$color}30;
  }
`;

const StaffColorDot = styled.div<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${props => props.$color};
`;

const StaffName = styled.span`
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${AppColors.onSurface};
`;

const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  staffList,
  selectedStaffIds,
  onEventClick,
  onEventCreate,
  onDateClick,
  allowEmptyStaff = false,
  programDuration,
  disablePastTime = false,
  staffHolidays = [],
  weeklyHolidaySettings = []
}) => {
  const monthWeeks = getMonthDates(currentDate);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  
  // 필터링된 직원 목록 (선택된 코치만)
  const filteredStaff = staffList.filter(staff => 
    selectedStaffIds.includes(staff.id) && staff.program // 담당 프로그램이 있는 직원
  );

  // 해당 월의 이벤트만 필터링
  const monthEvents = events.filter(event => {
    const isInMonth = monthWeeks.some(week => 
      week.some(day => isEventOnDate(event.startTime, event.endTime, day.date))
    );
    
    // 기간제 프로그램인 경우 스태프 필터링 건너뛰기
    if (allowEmptyStaff) {
      return isInMonth;
    }
    
    return isInMonth && selectedStaffIds.includes(event.staffId);
  });

  // 특정 날짜의 이벤트 가져오기
  const getDayEvents = (date: Date) => {
    return monthEvents.filter(event => isEventOnDate(event.startTime, event.endTime, date));
  };

  // 특정 날짜에 휴일인 직원들의 이름 가져오기 (새로운 주별 휴일 설정 우선 사용)
  const getHolidayStaffInfo = (date: Date) => {
    const holidayStaffNames = getHolidayStaffNames(date, weeklyHolidaySettings, staffList);
    
    // 새로운 주별 설정에서 휴일인 직원들 중 선택된 직원들만 필터링
    const weeklyHolidayNames = holidayStaffNames.filter(name => {
      const staff = staffList.find(s => s.name === name);
      return staff && selectedStaffIds.includes(staff.id);
    });
    
    // 주별 설정이 있으면 그것을 우선 사용
    if (weeklyHolidayNames.length > 0) {
      return formatHolidayInfo(weeklyHolidayNames);
    }
    
    // 기존 방식 (하위 호환성)
    const dateString = date.toISOString().split('T')[0];
    const legacyHolidayNames = selectedStaffIds
      .filter(staffId => {
        const staffHolidayData = staffHolidays.find(data => data.staffId === staffId);
        return staffHolidayData?.holidays.includes(dateString);
      })
      .map(staffId => {
        const staff = staffList.find(s => s.id === staffId);
        return staff?.name || '';
      })
      .filter(name => name);
    
    return formatHolidayInfo(legacyHolidayNames);
  };

  const handleDayClick = (date: Date) => {
    // 과거 날짜 체크 (disablePastTime이 true인 경우)
    if (disablePastTime && onEventCreate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const clickedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (clickedDate < today) {
        return; // 과거 날짜인 경우 클릭 이벤트 무시
      }
    }

    // 계약 기간 체크 (선택된 코치들이 있는 경우)
    if (onEventCreate && selectedStaffIds.length > 0) {
      const canCreateReservation = selectedStaffIds.every(staffId => {
        const staff = staffList.find(s => s.id === staffId);
        if (!staff?.contractStartDate || !staff?.contractEndDate) return true;
        
        const contractStart = new Date(staff.contractStartDate);
        contractStart.setHours(0, 0, 0, 0);
        const contractEnd = new Date(staff.contractEndDate);
        contractEnd.setHours(0, 0, 0, 0);
        
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        
        return selectedDate >= contractStart && selectedDate <= contractEnd;
      });

      if (!canCreateReservation) {
        alert('선택된 코치(들)의 계약 기간 외입니다. 예약을 생성할 수 없습니다.');
        return;
      }
    }

    if (onDateClick) {
      onDateClick(date);
    } else if (onEventCreate) {
      const startTime = new Date(date);
      startTime.setHours(9, 0, 0, 0); // 기본 오전 9시
      
      const endTime = new Date(startTime);
      // 프로그램 소요시간에 따른 종료시간 계산
      const duration = programDuration || 30; // 기본 30분
      const actualDuration = duration > 30 ? 60 : duration; // 50분은 1시간으로 처리
      endTime.setMinutes(endTime.getMinutes() + actualDuration);
      
      onEventCreate(startTime, endTime);
    }
  };

  const toggleStaffFilter = (staffId: string) => {
    // 이 기능은 상위 컴포넌트에서 처리해야 하므로 콜백이 필요하지만
    // 여기서는 단순히 표시만 합니다
  };

  if (!allowEmptyStaff && filteredStaff.length === 0) {
    return (
      <MonthContainer>
        <div style={{ padding: '48px', textAlign: 'center', color: AppColors.onSurface + '60' }}>
          표시할 코치를 선택해주세요.
        </div>
      </MonthContainer>
    );
  }

  return (
    <MonthContainer>
      {/* 직원 필터 */}
      <StaffFilter>
        <FilterLabel>표시 중인 코치:</FilterLabel>
        {filteredStaff.map(staff => (
          <StaffChip
            key={staff.id}
            $color={staff.color || AppColors.primary}
            $active={true}
            onClick={() => toggleStaffFilter(staff.id)}
          >
            <StaffColorDot $color={staff.color || AppColors.primary} />
            <StaffName>{staff.name}</StaffName>
          </StaffChip>
        ))}
      </StaffFilter>

      {/* 요일 헤더 */}
      <Header>
        {dayNames.map(dayName => (
          <DayHeader key={dayName}>{dayName}</DayHeader>
        ))}
      </Header>

      {/* 주별로 날짜 표시 */}
      {monthWeeks.map((week, weekIndex) => (
        <WeekContainer key={weekIndex}>
          {week.map(day => {
            const dayEvents = getDayEvents(day.date);
            const visibleEvents = dayEvents.slice(0, 3); // 최대 3개만 표시
            const hiddenCount = dayEvents.length - visibleEvents.length;
            const holidayInfo = getHolidayStaffInfo(day.date);
            const isAnyStaffOnHoliday = !!holidayInfo;

            // 과거 날짜 체크
            const isPastDate = disablePastTime && (() => {
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const currentDay = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());
              return currentDay < today;
            })();

            return (
              <DayCell
                key={day.date.toISOString()}
                $isToday={day.isToday}
                $isCurrentMonth={isSameMonth(day.date, currentDate)}
                $isWeekend={day.isWeekend}
                $hasEvents={dayEvents.length > 0}
                $isPastDate={isPastDate}
                $hasHoliday={isAnyStaffOnHoliday}
                onClick={() => handleDayClick(day.date)}
              >
                <DateHeader>
                  <DateNumber
                    $isToday={day.isToday}
                    $isCurrentMonth={isSameMonth(day.date, currentDate)}
                    $isWeekend={day.isWeekend}
                  >
                    {day.date.getDate()}
                  </DateNumber>
                  {holidayInfo && <HolidayInfo>{holidayInfo}</HolidayInfo>}
                </DateHeader>

                <EventsContainer>
                  {visibleEvents.map(event => {
                    const staff = filteredStaff.find(s => s.id === event.staffId);
                    return (
                      <EventItem
                        key={event.id}
                        $color={staff?.color || AppColors.primary}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        title={`${event.title} - ${event.staffName} ${event.memberName ? `(${event.memberName})` : ''}`}
                      >
                        {event.title}
                      </EventItem>
                    );
                  })}
                  
                  {hiddenCount > 0 && (
                    <MoreEventsIndicator
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayClick(day.date);
                      }}
                    >
                      +{hiddenCount}개 더
                    </MoreEventsIndicator>
                  )}
                </EventsContainer>
              </DayCell>
            );
          })}
        </WeekContainer>
      ))}
    </MonthContainer>
  );
};

export default MonthView;
