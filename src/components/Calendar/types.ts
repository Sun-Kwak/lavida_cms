/**
 * 달력 컴포넌트 관련 타입 정의
 */

// Calendar에서는 IndexedDB의 HolidaySettings를 그대로 사용
import type { HolidaySettings, WeeklyHolidaySettings } from '../../utils/db/types';

export type CalendarView = 'day' | 'week' | 'month';

export interface ScheduleEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  staffId: string;
  staffName: string;
  programId?: string;
  programName?: string;
  memberId?: string;
  memberName?: string;
  type: 'class' | 'personal' | 'meeting' | 'break' | 'holiday';
  color?: string;
  description?: string;
  branchId?: string;
  branchName?: string;
  recurrenceRule?: string; // RRULE for recurring events
  sourceType: 'manual' | 'weekly_holiday' | 'booking' | 'period_enrollment'; // 이벤트 생성 출처
  sourceId?: string; // 원본 데이터 ID (WeeklyHolidaySettings ID 등)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StaffInfo {
  id: string;
  name: string;
  role: string;
  program?: string;
  isActive: boolean;
  color?: string; // 달력에서 구분용 색상
  contractStartDate?: Date; // 계약 시작일
  contractEndDate?: Date; // 계약 종료일
  workingHours?: {
    start: number; // 기본 근무 시작 시간 (시)
    end: number; // 기본 근무 종료 시간 (시)
  };
}

export interface HolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId?: string; // undefined면 전체 코치
  staffList: StaffInfo[];
  currentUser?: {
    id: string;
    role: 'master' | 'coach' | 'admin';
  };
  onSave: (settings: Omit<HolidaySettings, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>; // dbManager 타입에 맞춤
  existingHolidays?: HolidaySettings[]; // 기존 휴일 설정 데이터
  existingEvents?: ScheduleEvent[]; // 기존 예약 이벤트 데이터 (휴일 설정 제한용)
}

export interface CalendarProps {
  view: CalendarView;
  currentDate: Date;
  events: ScheduleEvent[];
  staffList: StaffInfo[];
  selectedStaffIds: string[];
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: Date) => void;
  onStaffFilter: (staffIds: string[]) => void;
  onEventClick?: (event: ScheduleEvent) => void;
  onEventCreate?: (startTime: Date, endTime: Date, staffId?: string, replaceEventId?: string) => void;
  onHolidaySettings?: (staffId?: string) => void; // 휴일설정 핸들러 추가
  weeklyHolidaySettings?: WeeklyHolidaySettings[]; // 주별 휴일설정 추가
  allowEmptyStaff?: boolean; // 코치가 없어도 달력 표시 허용 (기간제용)
  programDuration?: number; // 프로그램 소요시간 (분 단위)
  hideViewOptions?: CalendarView[]; // 숨길 뷰 옵션들 (기간제용)
  disablePastTime?: boolean; // 과거 시간 비활성화 여부
  currentUser?: {
    id: string;
    role: 'master' | 'coach' | 'admin';
    name?: string;
  }; // 현재 사용자 정보
}

export interface TimeSlot {
  hour: number;
  minute: number;
  display: string;
}

export interface DayColumn {
  date: Date;
  dayName: string;
  isToday: boolean;
  isWeekend: boolean;
}
