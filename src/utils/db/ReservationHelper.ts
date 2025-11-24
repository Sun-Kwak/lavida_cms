/**
 * 예약/수강권 관련 헬퍼 함수 (이벤트 소싱 방식)
 */

import { dbManager } from './index';
import type { CourseEnrollment, ScheduleEvent } from './types';

/**
 * 수강권의 완료된 세션 수 계산 (이벤트 소싱)
 * ScheduleEvent 테이블에서 해당 수강권의 active/completed 상태 예약을 집계
 */
export async function getCompletedSessions(enrollmentId: string): Promise<number> {
  try {
    // 모든 예약 이벤트 조회
    const allEvents = await dbManager.getAllScheduleEvents();
    
    // 해당 수강권의 완료된 예약만 필터링
    const completedEvents = allEvents.filter(event => 
      event.enrollmentId === enrollmentId &&
      event.type === 'class' && // 일반 예약만 (상담/기타 제외)
      (event.status === 'active' || event.status === 'completed') // 취소/노쇼 제외
    );
    
    return completedEvents.length;
  } catch (error) {
    console.error('완료 세션 계산 실패:', error);
    return 0;
  }
}

/**
 * 수강권의 남은 횟수 계산 (이벤트 소싱)
 */
export async function getRemainingSessionsCount(enrollment: CourseEnrollment): Promise<number> {
  if (enrollment.programType !== '횟수제' || !enrollment.sessionCount) {
    return 0;
  }
  
  const completedSessions = await getCompletedSessions(enrollment.id);
  const remaining = (enrollment.sessionCount || 0) - completedSessions;
  
  return Math.max(0, remaining); // 음수 방지
}

/**
 * 회원의 모든 수강권에 대한 남은 횟수 정보 조회 (확장)
 */
export interface EnrollmentWithSessions extends CourseEnrollment {
  completedSessions: number;
  remainingSessions: number;
}

export async function getMemberEnrollmentsWithSessions(memberId: string): Promise<EnrollmentWithSessions[]> {
  try {
    const enrollments = await dbManager.getCourseEnrollmentsByMember(memberId);
    
    const enrollmentsWithSessions: EnrollmentWithSessions[] = [];
    
    for (const enrollment of enrollments) {
      const completedSessions = await getCompletedSessions(enrollment.id);
      const remainingSessions = (enrollment.sessionCount || 0) - completedSessions;
      
      enrollmentsWithSessions.push({
        ...enrollment,
        completedSessions,
        remainingSessions: Math.max(0, remainingSessions)
      });
    }
    
    return enrollmentsWithSessions;
  } catch (error) {
    console.error('회원 수강권 조회 실패:', error);
    return [];
  }
}

/**
 * 수강권의 예약 히스토리 조회
 */
export async function getEnrollmentReservationHistory(enrollmentId: string): Promise<ScheduleEvent[]> {
  try {
    const allEvents = await dbManager.getAllScheduleEvents();
    
    return allEvents.filter(event =>
      event.enrollmentId === enrollmentId &&
      event.type === 'class'
    ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  } catch (error) {
    console.error('예약 히스토리 조회 실패:', error);
    return [];
  }
}

/**
 * 예약 통계 조회
 */
export interface ReservationStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  noshow: number;
}

export async function getEnrollmentReservationStats(enrollmentId: string): Promise<ReservationStats> {
  try {
    const history = await getEnrollmentReservationHistory(enrollmentId);
    
    return {
      total: history.length,
      active: history.filter(e => e.status === 'active').length,
      completed: history.filter(e => e.status === 'completed').length,
      cancelled: history.filter(e => e.status === 'cancelled').length,
      noshow: history.filter(e => e.status === 'noshow').length
    };
  } catch (error) {
    console.error('예약 통계 조회 실패:', error);
    return { total: 0, active: 0, completed: 0, cancelled: 0, noshow: 0 };
  }
}
