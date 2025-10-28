/**
 * 휴일 설정 마이그레이션 유틸리티
 * 기존 일별 휴일 설정을 주별 휴일 설정으로 변환
 */

import { dbManager } from './indexedDB';
import type { WeeklyHolidaySettings } from './db/types';

interface WeekDataGroup {
  staffId: string;
  weekStartDate: string;
  days: {
    monday: { isHoliday: boolean; workingHours?: { start: number; end: number; }; breakTimes?: Array<{ start: number; end: number; name?: string; }>; };
    tuesday: { isHoliday: boolean; workingHours?: { start: number; end: number; }; breakTimes?: Array<{ start: number; end: number; name?: string; }>; };
    wednesday: { isHoliday: boolean; workingHours?: { start: number; end: number; }; breakTimes?: Array<{ start: number; end: number; name?: string; }>; };
    thursday: { isHoliday: boolean; workingHours?: { start: number; end: number; }; breakTimes?: Array<{ start: number; end: number; name?: string; }>; };
    friday: { isHoliday: boolean; workingHours?: { start: number; end: number; }; breakTimes?: Array<{ start: number; end: number; name?: string; }>; };
    saturday: { isHoliday: boolean; workingHours?: { start: number; end: number; }; breakTimes?: Array<{ start: number; end: number; name?: string; }>; };
    sunday: { isHoliday: boolean; workingHours?: { start: number; end: number; }; breakTimes?: Array<{ start: number; end: number; name?: string; }>; };
  };
}

/**
 * 날짜가 속한 주의 월요일 날짜를 구하는 함수
 */
function getWeekStartDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay(); // 0: 일요일, 1: 월요일, ...
  
  // 월요일을 주의 시작으로 설정
  const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
  const monday = new Date(date);
  monday.setDate(date.getDate() + daysToMonday);
  
  return monday.toISOString().split('T')[0];
}

/**
 * 요일 이름 배열 (일요일부터 시작)
 */
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/**
 * 기존 일별 휴일 설정을 주별 설정으로 변환
 */
export async function migrateHolidaySettingsToWeekly(): Promise<void> {
  try {
    console.log('휴일 설정 마이그레이션 시작...');
    
    // 1. 기존 일별 휴일 설정 조회
    const now = new Date();
    const startDate = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear() + 1, 11, 31).toISOString().split('T')[0];
    
    const existingHolidaySettings = await dbManager.getHolidaySettingsByDateRange(startDate, endDate);
    
    if (existingHolidaySettings.length === 0) {
      console.log('마이그레이션할 기존 휴일 설정이 없습니다.');
      return;
    }
    
    console.log(`${existingHolidaySettings.length}개의 기존 휴일 설정을 발견했습니다.`);
    
    // 2. 주별로 그룹화
    const weekGroups = new Map<string, WeekDataGroup>();
    
    for (const setting of existingHolidaySettings) {
      const weekStartDate = getWeekStartDate(setting.date);
      const groupKey = `${setting.staffId}-${weekStartDate}`;
      
      if (!weekGroups.has(groupKey)) {
        const defaultWorkingHours = setting.workingHours || { start: 9, end: 21 };
        weekGroups.set(groupKey, {
          staffId: setting.staffId,
          weekStartDate,
          days: {
            monday: { isHoliday: false, workingHours: defaultWorkingHours, breakTimes: [] },
            tuesday: { isHoliday: false, workingHours: defaultWorkingHours, breakTimes: [] },
            wednesday: { isHoliday: false, workingHours: defaultWorkingHours, breakTimes: [] },
            thursday: { isHoliday: false, workingHours: defaultWorkingHours, breakTimes: [] },
            friday: { isHoliday: false, workingHours: defaultWorkingHours, breakTimes: [] },
            saturday: { isHoliday: true, workingHours: defaultWorkingHours, breakTimes: [] },  // 기본값: 주말 휴일
            sunday: { isHoliday: true, workingHours: defaultWorkingHours, breakTimes: [] }     // 기본값: 주말 휴일
          }
        });
      }
      
      const group = weekGroups.get(groupKey)!;
      const date = new Date(setting.date + 'T00:00:00');
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek];
      
      // 휴일 설정 적용
      group.days[dayName].isHoliday = setting.isHoliday;
      
      // 근무시간 설정 (가장 최근 설정 사용)
      if (setting.workingHours && !setting.isHoliday) {
        group.days[dayName].workingHours = setting.workingHours;
      }
    }
    
    // 3. 주별 휴일 설정으로 변환
    const weeklySettings: Omit<WeeklyHolidaySettings, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    weekGroups.forEach(group => {
      weeklySettings.push({
        staffId: group.staffId,
        weekStartDate: group.weekStartDate,
        weekDays: group.days
      });
    });
    
    // 4. 주별 휴일 설정 저장
    if (weeklySettings.length > 0) {
      await dbManager.saveWeeklyHolidaySettings(weeklySettings);
      console.log(`${weeklySettings.length}개의 주별 휴일 설정을 생성했습니다.`);
    }
    
    console.log('휴일 설정 마이그레이션이 완료되었습니다.');
    
  } catch (error) {
    console.error('휴일 설정 마이그레이션 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 기존 일별 휴일 설정을 백업하고 삭제
 * 주의: 이 함수는 마이그레이션이 성공적으로 완료된 후에만 실행해야 합니다.
 */
export async function cleanupOldHolidaySettings(): Promise<void> {
  try {
    console.log('기존 일별 휴일 설정 정리 시작...');
    
    // 여기서는 실제 삭제를 하지 않고 로그만 남깁니다.
    // 필요시 수동으로 삭제할 수 있도록 합니다.
    console.log('기존 일별 휴일 설정은 호환성을 위해 유지됩니다.');
    console.log('필요시 수동으로 정리해주세요.');
    
  } catch (error) {
    console.error('기존 휴일 설정 정리 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 주별 휴일 설정으로부터 특정 날짜의 휴일 여부 확인
 */
export async function isHolidayFromWeeklySettings(staffId: string, date: string): Promise<boolean> {
  try {
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    
    // 해당 주의 월요일 찾기
    const weekStartDate = getWeekStartDate(date);
    
    const settings = await dbManager.getWeeklyHolidaySettingsByStaffAndWeek(staffId, weekStartDate);
    
    if (settings.length === 0) {
      // 설정이 없으면 주말을 기본 휴일로 간주
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
    
    const setting = settings[0];
    const dayName = dayNames[dayOfWeek];
    
    return setting.weekDays[dayName].isHoliday;
  } catch (error) {
    console.error('주별 휴일 설정에서 휴일 여부 확인 실패:', error);
    // 오류시 주말을 기본 휴일로 간주
    const dateObj = new Date(date + 'T00:00:00');
    return dateObj.getDay() === 0 || dateObj.getDay() === 6;
  }
}

/**
 * 마이그레이션 상태 확인
 */
export async function checkMigrationStatus(): Promise<{
  hasOldSettings: boolean;
  hasNewSettings: boolean;
  oldSettingsCount: number;
  newSettingsCount: number;
}> {
  try {
    // 기존 설정 확인
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
    
    const oldSettings = await dbManager.getHolidaySettingsByDateRange(startDate, endDate);
    
    // 새로운 설정 확인 (모든 직원의 주별 설정)
    const allStaff = await dbManager.getAllStaff();
    let newSettingsCount = 0;
    
    for (const staff of allStaff) {
      const weeklySettings = await dbManager.getWeeklyHolidaySettingsByStaff(staff.id);
      newSettingsCount += weeklySettings.length;
    }
    
    return {
      hasOldSettings: oldSettings.length > 0,
      hasNewSettings: newSettingsCount > 0,
      oldSettingsCount: oldSettings.length,
      newSettingsCount
    };
  } catch (error) {
    console.error('마이그레이션 상태 확인 실패:', error);
    return {
      hasOldSettings: false,
      hasNewSettings: false,
      oldSettingsCount: 0,
      newSettingsCount: 0
    };
  }
}