import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';
import { ScheduleEvent, StaffInfo } from './types';
import { generateTimeSlots, formatTime, isEventOnDate, getHolidayStaffNames, formatHolidayInfo } from './utils';
import type { WeeklyHolidaySettings } from '../../utils/db/types';

interface DayViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  staffList: StaffInfo[];
  selectedStaffIds: string[];
  onEventClick?: (event: ScheduleEvent) => void;
  onEventCreate?: (startTime: Date, endTime: Date, staffId?: string, replaceEventId?: string) => void;
  weeklyHolidaySettings?: WeeklyHolidaySettings[]; // 주별 휴일설정 추가
  allowEmptyStaff?: boolean; // 코치가 없어도 달력 표시 허용
  programDuration?: number; // 프로그램 소요시간 (분 단위)
  disablePastTime?: boolean; // 과거 시간 비활성화 여부
  currentUser?: {
    id: string;
    role: 'master' | 'coach' | 'admin';
    name?: string;
  }; // 현재 사용자 정보
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

const DateHeader = styled.div`
  padding: 16px 24px;
  background-color: ${AppColors.background};
  border-bottom: 1px solid ${AppColors.borderLight};
  text-align: center;
`;

const DateInfo = styled.div`
  font-size: ${AppTextStyles.headline2.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin-bottom: 4px;
`;

const HolidayInfo = styled.div`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.error};
  font-weight: 500;
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

const StaffColumn = styled.div`
  flex: 1;
  border-right: 1px solid ${AppColors.borderLight};
  min-width: 150px;
  position: relative;

  &:last-child {
    border-right: none;
  }
`;

const StaffTimeSlot = styled.div<{ $isAvailable: boolean; $isBreakTime: boolean; $isPastTime: boolean }>`
  height: 30px;
  border-bottom: 1px solid ${AppColors.borderLight}20;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: ${props => {
    if (props.$isPastTime) return AppColors.onSurface + '05';
    if (props.$isBreakTime) return '#fbbf2415'; // 휴게시간 배경색
    if (!props.$isAvailable) return AppColors.onSurface + '10';
    return 'transparent';
  }};
  border-left: ${props => props.$isBreakTime ? '3px solid #fbbf24' : 'none'};
  
  &:hover {
    background-color: ${props => {
      if (props.$isPastTime) return AppColors.onSurface + '10';
      if (props.$isBreakTime) return '#fbbf2425'; // 휴게시간 호버 색상
      return AppColors.primary + '10';
    }};
  }

  &::after {
    content: ${props => props.$isBreakTime ? '"휴게"' : 'none'};
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 10px;
    color: #fbbf24;
    font-weight: 500;
    pointer-events: none;
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
  allowEmptyStaff = false,
  programDuration,
  disablePastTime = false,
  currentUser
}) => {
  const timeSlots = generateTimeSlots(programDuration);
  
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
        // 휴일이면 근무시간 체크 안함 (항상 true 반환)
        if (daySettings.isHoliday) return true;

        // 근무시간 외면 예약 불가
        if (daySettings.workingHours) {
          const { start, end } = daySettings.workingHours;
          const currentTimeInMinutes = hour * 60 + minute;
          if (currentTimeInMinutes < start || currentTimeInMinutes >= end) return false;
        }

        // 휴게시간이면 예약 불가
        if (daySettings.breakTimes) {
          for (const breakTime of daySettings.breakTimes) {
            const currentTimeInMinutes = hour * 60 + minute;
            if (currentTimeInMinutes >= breakTime.start && currentTimeInMinutes < breakTime.end) return false;
          }
        }
      }
    } else {
      // 주별 설정이 없으면 기본값 (주말은 휴일)
      if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    }

    return true;
  };

  // 특정 직원의 특정 시간대가 휴게시간인지 확인하는 함수 (분 단위)
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
      top: Math.max(0, (startMinutes / 30) * 30), // 30분당 30px
      height: Math.max(15, (durationMinutes / 30) * 30)
    };
  };

  // 특정 시간이 휴일인지 확인 (WeeklyHolidaySettings 기반)
  const isTimeInHoliday = (staffId: string, hour: number, minute: number) => {
    if (!weeklyHolidaySettings || weeklyHolidaySettings.length === 0) {
      console.log('weeklyHolidaySettings가 없음:', weeklyHolidaySettings);
      return false;
    }
    
    const dayOfWeek = currentDate.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    const weekStartDate = (() => {
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      return monday.toISOString().split('T')[0];
    })();

    console.log('휴일 체크:', { 
      staffId, 
      hour, 
      minute, 
      dayOfWeek, 
      weekStartDate,
      settingsCount: weeklyHolidaySettings.length 
    });

    const weeklySettings = weeklyHolidaySettings.find(
      s => s.staffId === staffId && s.weekStartDate === weekStartDate
    );

    if (weeklySettings) {
      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayKey = dayKeys[dayOfWeek] as keyof typeof weeklySettings.weekDays;
      const daySettings = weeklySettings.weekDays[dayKey];
      
      console.log('휴일 설정 찾음:', { dayKey, isHoliday: daySettings?.isHoliday });
      return daySettings?.isHoliday || false;
    }

    console.log('해당 주차 휴일 설정 없음');
    return false;
  };

  // 특정 시간이 휴게시간에 포함되는지 확인 (스케줄 이벤트 기반)
  const isTimeInBreak = (staffId: string, hour: number, minute: number) => {
    const targetTime = new Date(currentDate);
    targetTime.setHours(hour, minute, 0, 0);
    
    // 휴게시간 이벤트 중에서 해당 시간이 포함되는 것이 있는지 확인
    return events.some(event => 
      event.staffId === staffId &&
      event.type === 'break' &&
      targetTime >= event.startTime &&
      targetTime < event.endTime
    );
  };

  const handleSlotClick = (timeSlot: any, staffId: string) => {
    // 계약 기간 체크
    const staff = staffList.find(s => s.id === staffId);
    if (staff?.contractStartDate && staff?.contractEndDate) {
      const contractStart = new Date(staff.contractStartDate);
      contractStart.setHours(0, 0, 0, 0);
      const contractEnd = new Date(staff.contractEndDate);
      contractEnd.setHours(0, 0, 0, 0);
      
      const selectedDate = new Date(currentDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < contractStart || selectedDate > contractEnd) {
        alert('해당 코치의 계약 기간 외입니다. 예약을 생성할 수 없습니다.');
        return;
      }
    }

    // 과거 시간 체크 (disablePastTime이 true인 경우)
    if (disablePastTime) {
      const now = new Date();
      const slotTime = new Date(currentDate);
      slotTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
      
      if (slotTime < now) {
        return; // 과거 시간인 경우 클릭 이벤트 무시
      }
    }

    // 해당 시간이 휴일인지 확인
    const isInHoliday = isTimeInHoliday(staffId, timeSlot.hour, timeSlot.minute);
    
    if (isInHoliday) {
      // 휴일에 포함된 경우, 코치 권한이 있는지 확인
      if (currentUser && (currentUser.role === 'master' || currentUser.id === staffId)) {
        // 마스터이거나 본인 코치인 경우 허용
        if (window.confirm(`이 시간대는 휴일입니다. 예약을 생성하시겠습니까?`)) {
          // 예약 생성 진행
          if (onEventCreate) {
            const startTime = new Date(currentDate);
            startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
            
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

    // 휴게시간 체크 (마스터나 본인 코치는 예외)
    const isInBreak = isTimeInBreak(staffId, timeSlot.hour, timeSlot.minute);
    if (isInBreak) {
      if (currentUser && (currentUser.role === 'master' || currentUser.id === staffId)) {
        // 마스터이거나 본인 코치인 경우 허용 (확인 없이 바로 진행)
      } else {
        alert('휴게시간에는 예약을 생성할 수 없습니다.');
        return;
      }
    }

    // 근무시간 체크 (마스터나 본인 코치는 예외)
    const isAvailable = isTimeSlotAvailable(staffId, timeSlot.hour, timeSlot.minute);
    if (!isAvailable) {
      if (currentUser && (currentUser.role === 'master' || currentUser.id === staffId)) {
        // 마스터이거나 본인 코치인 경우 허용 (확인 없이 바로 진행)
      } else {
        // 일반 사용자는 근무시간 외/휴일/휴게시간에 예약 불가
        alert('이 시간대는 예약할 수 없습니다.');
        return;
      }
    }

    // 정상적인 예약 생성
    if (onEventCreate) {
      const startTime = new Date(currentDate);
      startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
      
      const endTime = new Date(startTime);
      const duration = programDuration || 30;
      const actualDuration = duration > 30 ? 60 : duration;
      endTime.setMinutes(endTime.getMinutes() + actualDuration);
      
      onEventCreate(startTime, endTime, staffId);
    }
  };

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const currentDayName = dayNames[currentDate.getDay()];
  const currentDateString = `${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 (${currentDayName})`;
  
  // 오늘 날짜의 휴일 정보 가져오기
  const holidayStaffNames = getHolidayStaffNames(currentDate, weeklyHolidaySettings || [], staffList);
  const holidayInfo = formatHolidayInfo(holidayStaffNames);

  if (!allowEmptyStaff && filteredStaff.length === 0) {
    return (
      <DayContainer>
        <DateHeader>
          <DateInfo>{currentDateString}</DateInfo>
          {holidayInfo && <HolidayInfo>{holidayInfo}</HolidayInfo>}
        </DateHeader>
        <div style={{ padding: '48px', textAlign: 'center', color: AppColors.onSurface + '60' }}>
          표시할 코치를 선택해주세요.
        </div>
      </DayContainer>
    );
  }

  return (
    <DayContainer>
      {/* 날짜 헤더 */}
      <DateHeader>
        <DateInfo>{currentDateString}</DateInfo>
        {holidayInfo && <HolidayInfo>{holidayInfo}</HolidayInfo>}
      </DateHeader>
      
      {/* 스태프 헤더 */}
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
                const isBreak = isTimeInBreak(staff.id, slot.hour, slot.minute);
                
                // 과거 시간 체크
                const isPastTime = disablePastTime && (() => {
                  const now = new Date();
                  const slotTime = new Date(currentDate);
                  slotTime.setHours(slot.hour, slot.minute, 0, 0);
                  return slotTime < now;
                })();
                
                return (
                  <StaffTimeSlot
                    key={`${staff.id}-${slot.hour}-${slot.minute}`}
                    $isAvailable={isAvailable}
                    $isBreakTime={isBreak}
                    $isPastTime={isPastTime}
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
