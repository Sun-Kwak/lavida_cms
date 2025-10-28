import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';
import { ScheduleEvent, StaffInfo } from './types';
import { generateTimeSlots, formatTime, isEventOnDate } from './utils';
import type { WeeklyHolidaySettings } from '../../utils/db/types';

interface DayViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  staffList: StaffInfo[];
  selectedStaffIds: string[];
  onEventClick?: (event: ScheduleEvent) => void;
  onEventCreate?: (startTime: Date, endTime: Date, staffId?: string) => void;
  weeklyHolidaySettings?: WeeklyHolidaySettings[]; // 주별 휴일설정 추가
  allowEmptyStaff?: boolean; // 코치가 없어도 달력 표시 허용
}

const DayContainer = styled.div`
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

const StaffHeader = styled.div`
  flex: 1;
  padding: 12px;
  text-align: center;
  border-right: 1px solid ${AppColors.borderLight};
  min-width: 150px;

  &:last-child {
    border-right: none;
  }
`;

const StaffName = styled.div`
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin-bottom: 4px;
`;

const StaffProgram = styled.div`
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${AppColors.primary};
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
  height: 60px;
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

const StaffColumn = styled.div`
  flex: 1;
  border-right: 1px solid ${AppColors.borderLight};
  min-width: 150px;
  position: relative;

  &:last-child {
    border-right: none;
  }
`;

const StaffTimeSlot = styled.div<{ $isAvailable: boolean; $isBreakTime: boolean }>`
  height: 60px;
  border-bottom: 1px solid ${AppColors.borderLight}20;
  position: relative;
  cursor: ${props => props.$isAvailable ? 'pointer' : 'not-allowed'};
  background-color: ${props => {
    if (props.$isBreakTime) return AppColors.warning + '10';
    if (!props.$isAvailable) return AppColors.error + '10';
    return 'transparent';
  }};

  &:hover {
    background-color: ${props => {
      if (props.$isBreakTime) return AppColors.warning + '15';
      if (!props.$isAvailable) return AppColors.error + '15';
      return AppColors.primary + '05';
    }};
  }
`;

const EventBlock = styled.div<{ $color: string; $top: number; $height: number }>`
  position: absolute;
  left: 2px;
  right: 2px;
  top: ${props => props.$top}px;
  height: ${props => props.$height}px;
  background-color: ${props => props.$color}20;
  border: 1px solid ${props => props.$color};
  border-radius: 4px;
  padding: 4px 6px;
  overflow: hidden;
  cursor: pointer;
  z-index: 1;

  &:hover {
    background-color: ${props => props.$color}30;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const EventTitle = styled.div`
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 500;
  color: ${AppColors.onSurface};
  margin-bottom: 2px;
  line-height: 1.2;
`;

const EventTime = styled.div`
  font-size: ${AppTextStyles.label3.fontSize};
  color: ${AppColors.onSurface}70;
  line-height: 1.1;
`;

const EventMember = styled.div`
  font-size: ${AppTextStyles.label3.fontSize};
  color: ${AppColors.primary};
  line-height: 1.1;
  margin-top: 2px;
`;

const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  staffList,
  selectedStaffIds,
  onEventClick,
  onEventCreate,
  weeklyHolidaySettings = [],
  allowEmptyStaff = false
}) => {
  const timeSlots = generateTimeSlots();
  
  // 필터링된 직원 목록 (선택된 코치만)
  const filteredStaff = staffList.filter(staff => 
    selectedStaffIds.includes(staff.id) && staff.role === '코치'
  );

  // 해당 날짜의 이벤트만 필터링
  const dayEvents = events.filter(event => 
    isEventOnDate(event.startTime, event.endTime, currentDate)
  );

  // 특정 직원의 특정 시간대가 예약 가능한지 확인하는 함수
  const isTimeSlotAvailable = (staffId: string, hour: number, minute: number) => {
    const dayOfWeek = currentDate.getDay();
    const weekStartDate = (() => {
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      return monday.toISOString().split('T')[0];
    })();

    const weeklySettings = weeklyHolidaySettings.find(
      s => s.staffId === staffId && s.weekStartDate === weekStartDate
    );

    if (weeklySettings) {
      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayKey = dayKeys[dayOfWeek] as keyof typeof weeklySettings.weekDays;
      const daySettings = weeklySettings.weekDays[dayKey];

      if (daySettings) {
        // 휴일이면 예약 불가
        if (daySettings.isHoliday) return false;

        // 근무시간 외면 예약 불가
        if (daySettings.workingHours) {
          const { start, end } = daySettings.workingHours;
          if (hour < start || hour >= end) return false;
        }

        // 휴게시간이면 예약 불가
        if (daySettings.breakTimes) {
          for (const breakTime of daySettings.breakTimes) {
            if (hour >= breakTime.start && hour < breakTime.end) return false;
          }
        }
      }
    } else {
      // 주별 설정이 없으면 기본값 (주말은 휴일)
      if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    }

    return true;
  };

  // 특정 직원의 특정 시간대가 휴게시간인지 확인하는 함수
  const isBreakTime = (staffId: string, hour: number, minute: number) => {
    const dayOfWeek = currentDate.getDay();
    const weekStartDate = (() => {
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      return monday.toISOString().split('T')[0];
    })();

    const weeklySettings = weeklyHolidaySettings.find(
      s => s.staffId === staffId && s.weekStartDate === weekStartDate
    );

    if (weeklySettings) {
      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayKey = dayKeys[dayOfWeek] as keyof typeof weeklySettings.weekDays;
      const daySettings = weeklySettings.weekDays[dayKey];

      if (daySettings?.breakTimes) {
        for (const breakTime of daySettings.breakTimes) {
          if (hour >= breakTime.start && hour < breakTime.end) return true;
        }
      }
    }

    return false;
  };

  // 이벤트 위치 계산 (분 단위를 픽셀로 변환)
  const getEventPosition = (startTime: Date, endTime: Date) => {
    const dayStart = new Date(currentDate);
    dayStart.setHours(6, 0, 0, 0); // 오전 6시 시작

    const eventStart = new Date(startTime);
    const eventEnd = new Date(endTime);

    // 시작 시간이 당일이 아니면 당일 시작으로 조정
    if (eventStart.toDateString() !== currentDate.toDateString()) {
      eventStart.setTime(dayStart.getTime());
    }

    // 종료 시간이 당일이 아니면 당일 끝으로 조정
    if (eventEnd.toDateString() !== currentDate.toDateString()) {
      eventEnd.setHours(22, 0, 0, 0); // 오후 10시 끝
    }

    const startMinutes = (eventStart.getTime() - dayStart.getTime()) / (1000 * 60);
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);

    return {
      top: Math.max(0, (startMinutes / 30) * 60), // 30분당 60px
      height: Math.max(30, (durationMinutes / 30) * 60)
    };
  };

  const handleSlotClick = (timeSlot: any, staffId: string) => {
    // 예약 가능한 시간대인지 확인
    const isAvailable = isTimeSlotAvailable(staffId, timeSlot.hour, timeSlot.minute);
    if (!isAvailable) {
      alert('이 시간대는 예약할 수 없습니다. (휴일, 근무시간 외, 또는 휴게시간)');
      return;
    }

    if (onEventCreate) {
      const startTime = new Date(currentDate);
      startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30); // 기본 30분 슬롯
      
      onEventCreate(startTime, endTime, staffId);
    }
  };

  if (!allowEmptyStaff && filteredStaff.length === 0) {
    return (
      <DayContainer>
        <div style={{ padding: '48px', textAlign: 'center', color: AppColors.onSurface + '60' }}>
          표시할 코치를 선택해주세요.
        </div>
      </DayContainer>
    );
  }

  return (
    <DayContainer>
      {/* 헤더 */}
      <Header>
        <TimeHeader>시간</TimeHeader>
        {filteredStaff.map(staff => (
          <StaffHeader key={staff.id}>
            <StaffName>{staff.name}</StaffName>
            {staff.program && <StaffProgram>{staff.program}</StaffProgram>}
          </StaffHeader>
        ))}
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

          {/* 각 직원별 컬럼 */}
          {filteredStaff.map(staff => (
            <StaffColumn key={staff.id}>
              {timeSlots.map(slot => {
                const isAvailable = isTimeSlotAvailable(staff.id, slot.hour, slot.minute);
                const isBreak = isBreakTime(staff.id, slot.hour, slot.minute);
                
                return (
                  <StaffTimeSlot
                    key={`${staff.id}-${slot.hour}-${slot.minute}`}
                    $isAvailable={isAvailable}
                    $isBreakTime={isBreak}
                    onClick={() => handleSlotClick(slot, staff.id)}
                  />
                );
              })}

              {/* 해당 직원의 이벤트들 */}
              {dayEvents
                .filter(event => event.staffId === staff.id)
                .map(event => {
                  const position = getEventPosition(event.startTime, event.endTime);
                  return (
                    <EventBlock
                      key={event.id}
                      $color={staff.color || AppColors.primary}
                      $top={position.top}
                      $height={position.height}
                      onClick={() => onEventClick?.(event)}
                    >
                      <EventTitle>{event.title}</EventTitle>
                      <EventTime>
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </EventTime>
                      {event.memberName && (
                        <EventMember>{event.memberName}</EventMember>
                      )}
                    </EventBlock>
                  );
                })}
            </StaffColumn>
          ))}
        </TimeGrid>
      </ScrollableContent>
    </DayContainer>
  );
};

export default DayView;
