/**
 * 근무 시간대(shift)에 따른 기본 설정 유틸리티
 */

// 시간을 분으로 변환하는 헬퍼 함수
const timeToMinutes = (hour: number, minute: number = 0): number => {
  return hour * 60 + minute;
};

// 근무 시간대별 기본 설정
export interface ShiftSettings {
  workingHours: {
    start: number; // 분 단위
    end: number;   // 분 단위
  };
  defaultBreakTime: {
    start: number; // 분 단위
    end: number;   // 분 단위
    name: string;
  };
}

/**
 * 주간/야간 shift에 따른 기본 근무시간과 휴게시간 반환
 * @param shift - '주간' 또는 '야간'
 * @returns ShiftSettings 객체
 */
export const getShiftDefaultSettings = (shift: string): ShiftSettings => {
  switch (shift) {
    case '주간':
      return {
        workingHours: {
          start: timeToMinutes(9, 0),   // 09:00
          end: timeToMinutes(18, 0)     // 18:00
        },
        defaultBreakTime: {
          start: timeToMinutes(14, 0),  // 14:00
          end: timeToMinutes(15, 0),    // 15:00
          name: '기본 휴게시간'
        }
      };
    
    case '야간':
      return {
        workingHours: {
          start: timeToMinutes(12, 30), // 12:30
          end: timeToMinutes(21, 30)    // 21:30
        },
        defaultBreakTime: {
          start: timeToMinutes(16, 0),  // 16:00
          end: timeToMinutes(17, 0),    // 17:00
          name: '기본 휴게시간'
        }
      };
    
    default:
      // 기본값 (현재 설정과 동일)
      return {
        workingHours: {
          start: timeToMinutes(9, 0),   // 09:00
          end: timeToMinutes(21, 0)     // 21:00
        },
        defaultBreakTime: {
          start: timeToMinutes(12, 0),  // 12:00
          end: timeToMinutes(13, 0),    // 13:00
          name: '점심시간'
        }
      };
  }
};

/**
 * 여러 직원의 shift 정보를 기반으로 통합 기본 설정 반환
 * 모든 직원이 같은 shift면 해당 shift 설정 반환
 * 다른 shift가 섞여있으면 기본값 반환
 * @param staffShifts - 직원들의 shift 정보 배열
 * @returns ShiftSettings 객체
 */
export const getUnifiedShiftSettings = (staffShifts: string[]): ShiftSettings => {
  // 빈 배열이거나 shift 정보가 없으면 기본값
  if (!staffShifts || staffShifts.length === 0) {
    return getShiftDefaultSettings('');
  }

  // 유효한 shift 정보만 필터링
  const validShifts = staffShifts.filter(shift => shift === '주간' || shift === '야간');
  
  // 유효한 shift가 없으면 기본값
  if (validShifts.length === 0) {
    return getShiftDefaultSettings('');
  }

  // 모든 직원이 같은 shift인지 확인
  const uniqueShifts = Array.from(new Set(validShifts));
  if (uniqueShifts.length === 1) {
    return getShiftDefaultSettings(uniqueShifts[0]);
  }

  // 다른 shift가 섞여있으면 기본값
  return getShiftDefaultSettings('');
};

/**
 * 분을 시:분 형태의 문자열로 변환
 * @param minutes - 분 단위 시간
 * @returns "HH:MM" 형태의 문자열
 */
export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};