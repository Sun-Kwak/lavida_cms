import React from 'react';
import styled from 'styled-components';
import { CalendarProps } from './types';
import CalendarHeader from './CalendarHeader';
import StaffFilter from './StaffFilter';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';

const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const CalendarContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const ScheduleCalendar: React.FC<CalendarProps> = ({
  view,
  currentDate,
  events,
  staffList,
  selectedStaffIds,
  onViewChange,
  onDateChange,
  onStaffFilter,
  onEventClick,
  onEventCreate,
  onHolidaySettings,
  weeklyHolidaySettings,
  allowEmptyStaff = false,
  programDuration,
  hideViewOptions = [],
  disablePastTime = false,
  currentUser
}) => {
  const handleDateClick = (date: Date) => {
    // 월별 뷰에서 날짜 클릭 시 일별 뷰로 전환
    onDateChange(date);
    onViewChange('day');
  };

  const renderCalendarView = () => {
    switch (view) {
      case 'day':
        return (
          <DayView
            currentDate={currentDate}
            events={events}
            staffList={staffList}
            selectedStaffIds={selectedStaffIds}
            onEventClick={onEventClick}
            onEventCreate={onEventCreate}
            weeklyHolidaySettings={weeklyHolidaySettings}
            allowEmptyStaff={allowEmptyStaff}
            programDuration={programDuration}
            disablePastTime={disablePastTime}
            currentUser={currentUser}
          />
        );
      case 'week':
        return (
          <WeekView
            currentDate={currentDate}
            events={events}
            staffList={staffList}
            selectedStaffIds={selectedStaffIds}
            onEventClick={onEventClick}
            onEventCreate={onEventCreate}
            allowEmptyStaff={allowEmptyStaff}
            programDuration={programDuration}
            disablePastTime={disablePastTime}
            weeklyHolidaySettings={weeklyHolidaySettings}
            currentUser={currentUser}
          />
        );
      case 'month':
        return (
          <MonthView
            currentDate={currentDate}
            events={events}
            staffList={staffList}
            selectedStaffIds={selectedStaffIds}
            onEventClick={onEventClick}
            onEventCreate={onEventCreate}
            onDateClick={handleDateClick}
            allowEmptyStaff={allowEmptyStaff}
            programDuration={programDuration}
            disablePastTime={disablePastTime}
          />
        );
      default:
        return null;
    }
  };

  return (
    <CalendarContainer>
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={onViewChange}
        onDateChange={onDateChange}
        hideViewOptions={hideViewOptions}
      />
      
      {/* 기간제 프로그램이 아닌 경우에만 스태프 필터 표시 */}
      {!allowEmptyStaff && (
        <StaffFilter
          staffList={staffList}
          selectedStaffIds={selectedStaffIds}
          onStaffFilter={onStaffFilter}
          onHolidaySettings={onHolidaySettings}
        />
      )}
      
      <CalendarContent>
        {renderCalendarView()}
      </CalendarContent>
    </CalendarContainer>
  );
};

export default ScheduleCalendar;
