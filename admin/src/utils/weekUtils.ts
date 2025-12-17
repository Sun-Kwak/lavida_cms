/**
 * 주별 날짜 계산 유틸리티
 * 
 * 핵심 규칙:
 * - 주는 토요일부터 금요일까지 (7일)
 * - weekStartDate는 항상 해당 주의 월요일 (토요일 + 2일)
 * - 직원 등록: 이번주 (지난/오늘 토요일 ~ 돌아오는 금요일)
 * - 휴일설정 모달: 다음주 (다가오는 토요일 ~ 그 다음주 금요일)
 */

import { formatDateToLocal } from '../components/Calendar/utils';

/**
 * 특정 날짜가 속한 주의 토요일(주 시작일) 계산
 * @param date - 기준 날짜
 * @returns 해당 주의 토요일 Date 객체
 */
export const getWeekStartSaturday = (date: Date): Date => {
  const dayOfWeek = date.getDay(); // 0(일) ~ 6(토)
  const saturday = new Date(date);
  
  if (dayOfWeek === 6) {
    // 토요일이면 오늘이 주 시작
    return saturday;
  } else {
    // 일~금요일이면 지난 토요일 찾기
    // 일요일: 1일 전, 월요일: 2일 전, 화요일: 3일 전, 수요일: 4일 전, 목요일: 5일 전, 금요일: 6일 전
    const daysFromSaturday = dayOfWeek === 0 ? 1 : dayOfWeek + 1;
    saturday.setDate(date.getDate() - daysFromSaturday);
    return saturday;
  }
};

/**
 * 특정 날짜가 속한 주의 월요일(weekStartDate) 계산
 * @param date - 기준 날짜
 * @returns YYYY-MM-DD 형식의 월요일 날짜
 */
export const getWeekStartDate = (date: Date): string => {
  const saturday = getWeekStartSaturday(date);
  const monday = new Date(saturday);
  monday.setDate(saturday.getDate() + 2); // 토요일 + 2일 = 월요일
  return formatDateToLocal(monday);
};

/**
 * 이번주 월요일 계산 (직원 등록용)
 * 오늘이 속한 주의 월요일
 * @returns YYYY-MM-DD 형식의 월요일 날짜
 */
export const getThisWeekMonday = (): string => {
  return getWeekStartDate(new Date());
};

/**
 * 다음주 월요일 계산 (휴일설정 모달용)
 * 다가오는 토요일부터 시작하는 주의 월요일
 * @returns YYYY-MM-DD 형식의 월요일 날짜
 */
export const getNextWeekMonday = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // 다가오는 토요일 계산
  const nextSaturday = new Date(today);
  if (dayOfWeek === 6) {
    // 오늘이 토요일이면 다음 토요일
    nextSaturday.setDate(today.getDate() + 7);
  } else {
    // 아니면 이번주 토요일
    const daysUntilSaturday = 6 - dayOfWeek;
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
  }
  
  // 토요일 + 2일 = 월요일
  const monday = new Date(nextSaturday);
  monday.setDate(nextSaturday.getDate() + 2);
  return formatDateToLocal(monday);
};

/**
 * 주 범위 표시 (토요일 ~ 금요일)
 * @param weekStartDate - 월요일 날짜 (YYYY-MM-DD)
 * @returns "MM/DD ~ MM/DD" 형식
 */
export const getWeekRangeString = (weekStartDate: string): string => {
  const monday = new Date(weekStartDate + 'T00:00:00');
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() - 2); // 월요일 - 2일 = 토요일
  
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6); // 토요일 + 6일 = 금요일
  
  const format = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
  return `${format(saturday)} ~ ${format(friday)}`;
};

/**
 * 특정 날짜가 오늘 또는 과거인지 확인
 * @param date - 확인할 날짜
 * @returns true면 과거 또는 오늘
 */
export const isPastOrToday = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return targetDate <= today;
};
