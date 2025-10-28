/**
 * 달력 관련 유틸리티 함수들
 */

import { DayColumn, TimeSlot } from './types';

// 시간대 생성 (오전 6시 ~ 오후 10시)
export const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      slots.push({
        hour,
        minute,
        display: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      });
    }
  }
  return slots;
};

// 주간 날짜 배열 생성
export const getWeekDates = (date: Date): DayColumn[] => {
  const start = new Date(date);
  const day = start.getDay(); // 0: 일요일, 1: 월요일, ...
  start.setDate(start.getDate() - day); // 해당 주의 일요일로 이동

  const weekDates: DayColumn[] = [];
  const today = new Date();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    
    weekDates.push({
      date: currentDate,
      dayName: dayNames[i],
      isToday: isSameDay(currentDate, today),
      isWeekend: i === 0 || i === 6
    });
  }

  return weekDates;
};

// 월간 날짜 배열 생성 (달력 형태)
export const getMonthDates = (date: Date): DayColumn[][] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // 해당 월의 첫째 날
  const firstDay = new Date(year, month, 1);
  
  // 달력 시작일 (해당 월 첫째 주의 일요일)
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  
  const weeks: DayColumn[][] = [];
  const today = new Date();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  let currentDate = new Date(startDate);
  
  // 6주 표시 (달력 형태)
  for (let week = 0; week < 6; week++) {
    const weekDays: DayColumn[] = [];
    
    for (let day = 0; day < 7; day++) {
      weekDays.push({
        date: new Date(currentDate),
        dayName: dayNames[day],
        isToday: isSameDay(currentDate, today),
        isWeekend: day === 0 || day === 6
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    weeks.push(weekDays);
  }

  return weeks;
};

// 같은 날인지 체크
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// 같은 주인지 체크
export const isSameWeek = (date1: Date, date2: Date): boolean => {
  const week1 = getWeekDates(date1);
  return week1.some(day => isSameDay(day.date, date2));
};

// 같은 월인지 체크
export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
};

// 날짜 포맷팅
export const formatDate = (date: Date, format: 'full' | 'short' | 'month-year' = 'full'): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  switch (format) {
    case 'short':
      return `${month}/${day}`;
    case 'month-year':
      return `${year}년 ${month}월`;
    case 'full':
    default:
      return `${year}년 ${month}월 ${day}일`;
  }
};

// 시간 포맷팅
export const formatTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// 이벤트가 특정 날짜에 포함되는지 체크
export const isEventOnDate = (eventStart: Date, eventEnd: Date, targetDate: Date): boolean => {
  const targetStart = new Date(targetDate);
  targetStart.setHours(0, 0, 0, 0);
  
  const targetEnd = new Date(targetDate);
  targetEnd.setHours(23, 59, 59, 999);
  
  return (eventStart <= targetEnd && eventEnd >= targetStart);
};

// 색상 팔레트 (직원별 구분용)
export const STAFF_COLORS = [
  '#3B82F6', // 파랑
  '#EF4444', // 빨강
  '#10B981', // 초록
  '#F59E0B', // 주황
  '#8B5CF6', // 보라
  '#06B6D4', // 청록
  '#F97316', // 주황
  '#84CC16', // 라임
  '#EC4899', // 핑크
  '#6B7280', // 회색
];

// 직원에게 색상 할당
export const assignStaffColor = (staffId: string, index: number): string => {
  return STAFF_COLORS[index % STAFF_COLORS.length];
};
