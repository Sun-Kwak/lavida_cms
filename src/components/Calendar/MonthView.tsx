import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';
import { ScheduleEvent, StaffInfo } from './types';
import { getMonthDates, isEventOnDate, isSameMonth } from './utils';

interface MonthViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  staffList: StaffInfo[];
  selectedStaffIds: string[];
  onEventClick?: (event: ScheduleEvent) => void;
  onEventCreate?: (startTime: Date, endTime: Date, staffId?: string) => void;
  onDateClick?: (date: Date) => void;
  allowEmptyStaff?: boolean; // 코치가 없어도 달력 표시 허용
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
}>`
  flex: 1;
  border-right: 1px solid ${AppColors.borderLight};
  padding: 8px;
  cursor: pointer;
  position: relative;
  background-color: ${props => 
    props.$isToday ? AppColors.primary + '10' : 
    !props.$isCurrentMonth ? AppColors.surface + '80' :
    'transparent'
  };

  &:hover {
    background-color: ${props => 
      props.$isCurrentMonth ? AppColors.primary + '05' : AppColors.surface + '90'
    };
  }

  &:last-child {
    border-right: none;
  }
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
  margin-bottom: 4px;
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
  allowEmptyStaff = false
}) => {
  const monthWeeks = getMonthDates(currentDate);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  
  // 필터링된 직원 목록 (선택된 코치만)
  const filteredStaff = staffList.filter(staff => 
    selectedStaffIds.includes(staff.id) && staff.role === '코치'
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

  const handleDayClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    } else if (onEventCreate) {
      const startTime = new Date(date);
      startTime.setHours(9, 0, 0, 0); // 기본 오전 9시
      
      const endTime = new Date(startTime);
      endTime.setHours(10, 0, 0, 0); // 1시간 후
      
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

            return (
              <DayCell
                key={day.date.toISOString()}
                $isToday={day.isToday}
                $isCurrentMonth={isSameMonth(day.date, currentDate)}
                $isWeekend={day.isWeekend}
                $hasEvents={dayEvents.length > 0}
                onClick={() => handleDayClick(day.date)}
              >
                <DateNumber
                  $isToday={day.isToday}
                  $isCurrentMonth={isSameMonth(day.date, currentDate)}
                  $isWeekend={day.isWeekend}
                >
                  {day.date.getDate()}
                </DateNumber>

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
