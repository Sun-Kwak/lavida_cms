import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';
import { ScheduleEvent, StaffInfo } from './types';
import { getWeekDates, isEventOnDate, generateTimeSlots, getHolidayStaffNames, formatHolidayInfo } from './utils';
import type { WeeklyHolidaySettings } from '../../utils/db/types';

interface WeekViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  staffList: StaffInfo[];
  selectedStaffIds: string[];
  onEventClick?: (event: ScheduleEvent) => void;
  onEventCreate?: (startTime: Date, endTime: Date, staffId?: string, replaceEventId?: string) => void;
  allowEmptyStaff?: boolean; // 코치가 없어도 달력 표시 허용
  programDuration?: number; // 프로그램 소요시간 (분 단위)
  disablePastTime?: boolean; // 과거 시간 비활성화 여부
  weeklyHolidaySettings?: WeeklyHolidaySettings[]; // 주별 휴일설정 추가
  currentUser?: {
    id: string;
    role: 'master' | 'coach' | 'admin';
    name?: string;
  }; // 현재 사용자 정보
}

const WeekContainer = styled.div`
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
  width: 100%;
`;

const TimeHeader = styled.div`
  width: 80px;
  min-width: 80px;
  max-width: 80px;
  padding: 12px 8px;
  text-align: center;
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  border-right: 1px solid ${AppColors.borderLight};
  box-sizing: border-box;
`;

const DayHeader = styled.div<{ $isToday: boolean; $isWeekend: boolean }>`
  flex: 1;
  padding: 12px 8px;
  text-align: center;
  border-right: 1px solid ${AppColors.borderLight};
  background-color: ${props => props.$isToday ? AppColors.primary + '10' : 'transparent'};
  
  &:last-child {
    border-right: none;
  }
`;

const DayName = styled.div<{ $isWeekend: boolean }>`
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 500;
  color: ${props => props.$isWeekend ? AppColors.error : AppColors.onSurface}80;
  margin-bottom: 4px;
`;

const DayDate = styled.div<{ $isToday: boolean; $isWeekend: boolean }>`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: ${props => props.$isToday ? 600 : 500};
  color: ${props => 
    props.$isToday ? AppColors.primary : 
    props.$isWeekend ? AppColors.error : 
    AppColors.onSurface
  };
`;

const HolidayInfo = styled.div`
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${AppColors.error};
  font-weight: 500;
  margin-top: 2px;
  line-height: 1.2;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 600px;
  
  /* 스크롤바 숨김 - Webkit 브라우저 (Chrome, Safari, Edge) */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* 스크롤바 숨김 - Firefox */
  scrollbar-width: none;
  
  /* 스크롤바 숨김 - IE/Edge Legacy */
  -ms-overflow-style: none;
`;

const TimeGrid = styled.div`
  display: flex;
  width: 100%;
`;

const TimeColumn = styled.div`
  width: 80px;
  min-width: 80px;
  max-width: 80px;
  border-right: 1px solid ${AppColors.borderLight};
  box-sizing: border-box;
`;

const TimeSlot = styled.div`
  height: 30px;
  padding: 4px 8px;
  border-bottom: 1px solid ${AppColors.borderLight}20;
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${AppColors.onSurface}60;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
`;

const DayGridColumn = styled.div<{ $isToday: boolean; $isWeekend: boolean }>`
  flex: 1;
  border-right: 1px solid ${AppColors.borderLight};
  position: relative;
  background-color: ${props => 
    props.$isToday ? AppColors.primary + '05' : 
    props.$isWeekend ? AppColors.surface + 'F0' : 
    'transparent'
  };
  overflow: hidden;

  &:last-child {
    border-right: none;
  }
`;

const DayTimeSlot = styled.div<{ $isPastTime?: boolean }>`
  height: 30px;
  border-bottom: 1px solid ${AppColors.borderLight}20;
  position: relative;
  cursor: ${props => props.$isPastTime ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$isPastTime ? 0.5 : 1};
  background-color: ${props => {
    if (props.$isPastTime) return AppColors.onSurface + '05';
    return 'transparent';
  }};

  &:hover {
    background-color: ${props => {
      if (props.$isPastTime) return AppColors.onSurface + '05';
      return AppColors.primary + '08';
    }};
  }
`;

const StaffEventsContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
`;

const EventBlock = styled.div<{ 
  $color: string; 
  $top: number; 
  $height: number; 
  $left: number; 
  $width: number;
  $opacity?: number;
}>`
  position: absolute;
  left: ${props => props.$left}%;
  width: ${props => props.$width}%;
  top: ${props => props.$top}px;
  height: ${props => props.$height}px;
  background-color: ${props => props.$color}30;
  border: 1px solid ${props => props.$color};
  border-radius: 3px;
  padding: 2px 4px;
  overflow: hidden;
  cursor: pointer;
  z-index: 1;
  pointer-events: auto;
  opacity: ${props => props.$opacity || 1};
  box-sizing: border-box;
  max-width: calc(100% - 2px);
  word-wrap: break-word;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${props => props.$color}50;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    z-index: 2;
  }
`;

const EventTitle = styled.div`
  font-size: ${AppTextStyles.label3.fontSize};
  font-weight: 500;
  color: ${AppColors.onSurface};
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  width: 100%;
`;

const StaffLegend = styled.div`
  padding: 8px 12px;
  background-color: ${AppColors.background};
  border-top: 1px solid ${AppColors.borderLight};
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const StaffLegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StaffColorDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$color};
`;

const StaffLegendName = styled.span`
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${AppColors.onSurface};
`;

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  staffList,
  selectedStaffIds,
  onEventClick,
  onEventCreate,
  allowEmptyStaff = false,
  programDuration,
  disablePastTime = false,
  weeklyHolidaySettings = [],
  currentUser
}) => {
  const weekDates = getWeekDates(currentDate);
  
  // 항상 30분 단위로 시간 슬롯 생성
  const timeSlots = generateTimeSlots(programDuration);
  
  // 필터링된 직원 목록 (선택된 코치만)
  const filteredStaff = staffList.filter(staff => 
    selectedStaffIds.includes(staff.id) && staff.role === '코치'
  );

  // 해당 주의 이벤트만 필터링
  const weekEvents = events.filter(event => 
    weekDates.some(day => isEventOnDate(event.startTime, event.endTime, day.date))
  );

  // 이벤트 위치 계산
  const getEventPosition = (event: ScheduleEvent, dayDate: Date) => {
    if (!isEventOnDate(event.startTime, event.endTime, dayDate)) {
      return null;
    }

    const dayStart = new Date(dayDate);
    dayStart.setHours(6, 0, 0, 0);

    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    // 시작/종료 시간이 당일 범위를 벗어나면 조정
    if (eventStart.toDateString() !== dayDate.toDateString()) {
      eventStart.setTime(dayStart.getTime());
    }
    if (eventEnd.toDateString() !== dayDate.toDateString()) {
      eventEnd.setHours(22, 0, 0, 0);
    }

    const startMinutes = (eventStart.getTime() - dayStart.getTime()) / (1000 * 60);
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);

    return {
      top: Math.max(0, (startMinutes / 30) * 30), // 30분당 30px (30분 단위로 조정)
      height: Math.max(15, (durationMinutes / 30) * 30)
    };
  };

  // 같은 시간대 이벤트들의 위치 조정
  const getEventLayout = (dayEvents: ScheduleEvent[], targetEvent: ScheduleEvent) => {
    // 같은 시간대에 겹치는 이벤트들 찾기
    const overlapping = dayEvents.filter(e => {
      if (e.id === targetEvent.id) return false;
      return (targetEvent.startTime < e.endTime && targetEvent.endTime > e.startTime);
    });

    // 겹치는 이벤트가 없으면 전체 너비 사용
    if (overlapping.length === 0) {
      return {
        left: 0,
        width: 100,
        opacity: 1
      };
    }

    // 모든 겹치는 이벤트들을 ID 순으로 정렬 (일관된 순서 보장)
    const allOverlapping = [...overlapping, targetEvent].sort((a, b) => 
      a.id.localeCompare(b.id)
    );

    const totalCount = allOverlapping.length;
    const eventIndex = allOverlapping.findIndex(e => e.id === targetEvent.id);

    // 각 이벤트가 동일한 너비를 가지도록 계산
    const eventWidth = Math.floor(100 / totalCount);
    const eventLeft = eventIndex * eventWidth;

    return {
      left: eventLeft,
      width: eventWidth,
      opacity: 0.95
    };
  };

  // 특정 시간이 휴게시간에 포함되는지 확인
  const isTimeInBreak = (staffId: string, dayDate: Date, hour: number, minute: number) => {
    const targetTime = new Date(dayDate);
    targetTime.setHours(hour, minute, 0, 0);
    
    return events.some(event => 
      event.staffId === staffId &&
      event.type === 'break' &&
      targetTime >= event.startTime &&
      targetTime < event.endTime
    );
  };

  const handleSlotClick = (dayDate: Date, slot: { hour: number; minute: number }) => {
    // 과거 시간 체크 (disablePastTime이 true인 경우)
    if (disablePastTime) {
      const now = new Date();
      const slotTime = new Date(dayDate);
      slotTime.setHours(slot.hour, slot.minute, 0, 0);
      
      if (slotTime < now) {
        return; // 과거 시간인 경우 클릭 이벤트 무시
      }
    }

    // WeekView에서는 선택된 코치가 하나일 때만 예약 생성
    if (filteredStaff.length !== 1) {
      alert('예약을 생성하려면 코치를 하나만 선택해주세요.');
      return;
    }

    const staffId = filteredStaff[0].id;

    // 해당 날짜가 휴일인지 확인 (날짜 레벨에서)
    const holidayStaffNames = getHolidayStaffNames(dayDate, weeklyHolidaySettings || [], staffList);
    const isStaffOnHoliday = holidayStaffNames.includes(filteredStaff[0].name);
    
    if (isStaffOnHoliday) {
      // 휴일에 포함된 경우, 코치 권한이 있는지 확인
      if (currentUser && (currentUser.role === 'master' || currentUser.id === staffId)) {
        // 마스터이거나 본인 코치인 경우 허용
        if (window.confirm(`이 날짜는 휴일입니다. 예약을 생성하시겠습니까?`)) {
          // 예약 생성 진행
          if (onEventCreate) {
            const startTime = new Date(dayDate);
            startTime.setHours(slot.hour, slot.minute, 0, 0);
            
            const endTime = new Date(startTime);
            const duration = programDuration || 30;
            const actualDuration = duration > 30 ? 60 : duration;
            endTime.setMinutes(endTime.getMinutes() + actualDuration);
            
            onEventCreate(startTime, endTime, staffId);
          }
        }
      } else {
        // 일반 사용자는 휴일에 예약 불가
        alert('휴일에는 예약을 생성할 수 없습니다. 관리자 또는 해당 코치에게 문의하세요.');
      }
      return;
    }

    // 휴게시간 체크
    const isInBreak = isTimeInBreak(staffId, dayDate, slot.hour, slot.minute);
    if (isInBreak) {
      alert('휴게시간에는 예약을 생성할 수 없습니다.');
      return;
    }

    if (onEventCreate) {
      const startTime = new Date(dayDate);
      startTime.setHours(slot.hour, slot.minute, 0, 0);
      
      const endTime = new Date(startTime);
      // 프로그램 소요시간에 따른 종료시간 계산
      const duration = programDuration || 30; // 기본 30분
      const actualDuration = duration > 30 ? 60 : duration; // 50분은 1시간으로 처리
      endTime.setMinutes(endTime.getMinutes() + actualDuration);
      
      onEventCreate(startTime, endTime, staffId);
    }
  };

  if (!allowEmptyStaff && filteredStaff.length === 0) {
    return (
      <WeekContainer>
        <div style={{ padding: '48px', textAlign: 'center', color: AppColors.onSurface + '60' }}>
          표시할 코치를 선택해주세요.
        </div>
      </WeekContainer>
    );
  }

  return (
    <WeekContainer>
      {/* 헤더 */}
      <Header>
        <TimeHeader>시간</TimeHeader>
        {weekDates.map(day => {
          // 각 날짜의 휴일 정보 가져오기
          const holidayStaffNames = getHolidayStaffNames(day.date, weeklyHolidaySettings || [], staffList);
          const holidayInfo = formatHolidayInfo(holidayStaffNames);
          
          return (
            <DayHeader 
              key={day.date.toISOString()} 
              $isToday={day.isToday}
              $isWeekend={day.isWeekend}
            >
              <DayName $isWeekend={day.isWeekend}>{day.dayName}</DayName>
              <DayDate $isToday={day.isToday} $isWeekend={day.isWeekend}>
                {day.date.getDate()}
              </DayDate>
              {holidayInfo && <HolidayInfo>{holidayInfo}</HolidayInfo>}
            </DayHeader>
          );
        })}
      </Header>

      {/* 스크롤 가능한 타임 그리드 */}
      <ScrollableContent>
        <TimeGrid>
          {/* 시간 컬럼 */}
          <TimeColumn>
            {timeSlots.map(slot => (
              <TimeSlot key={`${slot.hour}-${slot.minute}`}>
                {slot.minute === 0 ? slot.display : ''}
              </TimeSlot>
            ))}
          </TimeColumn>

          {/* 각 날짜별 컬럼 */}
          {weekDates.map(day => {
            const dayEvents = allowEmptyStaff 
              ? weekEvents.filter(event => 
                  isEventOnDate(event.startTime, event.endTime, day.date)
                )
              : weekEvents.filter(event => 
                  isEventOnDate(event.startTime, event.endTime, day.date) &&
                  selectedStaffIds.includes(event.staffId)
                );

            return (
              <DayGridColumn 
                key={day.date.toISOString()}
                $isToday={day.isToday}
                $isWeekend={day.isWeekend}
              >
                {timeSlots.map(slot => {
                  // 과거 시간 체크
                  const isPastTime = disablePastTime && (() => {
                    const now = new Date();
                    const slotTime = new Date(day.date);
                    slotTime.setHours(slot.hour, slot.minute, 0, 0);
                    return slotTime < now;
                  })();

                  return (
                    <DayTimeSlot
                      key={`${day.date.toISOString()}-${slot.hour}-${slot.minute}`}
                      $isPastTime={isPastTime}
                      onClick={() => handleSlotClick(day.date, slot)}
                    />
                  );
                })}

                {/* 해당 날짜의 이벤트들 */}
                <StaffEventsContainer>
                  {dayEvents.map(event => {
                    const position = getEventPosition(event, day.date);
                    if (!position) return null;

                    const layout = getEventLayout(dayEvents, event);
                    const staff = filteredStaff.find(s => s.id === event.staffId);

                    return (
                      <EventBlock
                        key={event.id}
                        $color={staff?.color || AppColors.primary}
                        $top={position.top}
                        $height={position.height}
                        $left={layout.left}
                        $width={layout.width}
                        $opacity={layout.opacity}
                        onClick={() => onEventClick?.(event)}
                      >
                        <EventTitle>
                          {event.type === 'holiday' ? '휴일' : 
                           event.type === 'break' ? event.title :
                           (event.memberName || '예약자')}
                        </EventTitle>
                      </EventBlock>
                    );
                  })}
                </StaffEventsContainer>
              </DayGridColumn>
            );
          })}
        </TimeGrid>
      </ScrollableContent>

      {/* 직원 범례 */}
      <StaffLegend>
        <span style={{ 
          fontSize: AppTextStyles.label2.fontSize, 
          fontWeight: 500, 
          color: AppColors.onSurface,
          marginRight: '8px'
        }}>
          코치:
        </span>
        {filteredStaff.map(staff => (
          <StaffLegendItem key={staff.id}>
            <StaffColorDot $color={staff.color || AppColors.primary} />
            <StaffLegendName>{staff.name}</StaffLegendName>
          </StaffLegendItem>
        ))}
      </StaffLegend>
    </WeekContainer>
  );
};

export default WeekView;
