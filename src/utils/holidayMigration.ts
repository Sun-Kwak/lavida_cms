/**
 * 휴일 설정 마이그레이션 유틸리티
 * 기존 HolidaySettings와 WeeklyHolidaySettings의 휴일 정보를 Staff.holidays 배열로 통합
 */

import { dbManager } from './indexedDB';

/**
 * 요일 이름 배열 (일요일부터 시작)
 */
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/**
 * WeeklyHolidaySettings에서 휴일 정보를 추출하여 Staff.holidays로 마이그레이션
 */
export async function migrateWeeklyHolidaysToStaff(): Promise<void> {
  try {
    console.log('WeeklyHolidaySettings의 휴일 정보를 Staff.holidays로 마이그레이션 시작...');
    
    // 1. 모든 직원 조회
    const allStaff = await dbManager.getAllStaff();
    
    for (const staff of allStaff) {
      try {
        // 2. 해당 직원의 WeeklyHolidaySettings 조회
        const weeklySettings = await dbManager.getWeeklyHolidaySettingsByStaff(staff.id);
        
        if (weeklySettings.length === 0) continue;
        
        // 3. 기존 Staff.holidays 가져오기
        const existingHolidays = staff.holidays || [];
        const newHolidays = new Set(existingHolidays);
        
        // 4. WeeklyHolidaySettings에서 휴일 정보 추출
        for (const setting of weeklySettings) {
          const weekStartDate = new Date(setting.weekStartDate + 'T00:00:00');
          
          // 각 요일 확인
          dayNames.forEach((dayName, index) => {
            const dayData = setting.weekDays[dayName];
            if (dayData && dayData.isHoliday) {
              // 해당 날짜 계산
              const targetDate = new Date(weekStartDate);
              // 월요일 기준으로 각 요일까지의 차이 계산
              const dayOffset = index === 0 ? 6 : index - 1; // 일요일은 6일 후, 월요일은 0일 후
              targetDate.setDate(targetDate.getDate() + dayOffset);
              
              const dateString = targetDate.toISOString().split('T')[0];
              newHolidays.add(dateString);
            }
          });
        }
        
        // 5. Staff.holidays 업데이트
        const updatedHolidays = Array.from(newHolidays).sort();
        if (updatedHolidays.length !== existingHolidays.length || 
            !updatedHolidays.every((date, index) => date === existingHolidays[index])) {
          await dbManager.updateStaffHolidays(staff.id, updatedHolidays);
          console.log(`${staff.name}의 휴일 정보 마이그레이션 완료:`, updatedHolidays.length, '개');
        }
        
      } catch (error) {
        console.error(`${staff.name} 휴일 마이그레이션 실패:`, error);
      }
    }
    
    console.log('WeeklyHolidaySettings → Staff.holidays 마이그레이션 완료');
    
  } catch (error) {
    console.error('휴일 마이그레이션 중 오류 발생:', error);
    throw error;
  }
}

/**
 * Staff.holidays 기반으로 특정 날짜의 휴일 여부 확인
 */
export async function isStaffHoliday(staffId: string, date: string): Promise<boolean> {
  try {
    const staff = await dbManager.getStaffById(staffId);
    if (!staff || !staff.holidays) return false;
    
    return staff.holidays.includes(date);
  } catch (error) {
    console.error('직원 휴일 확인 실패:', error);
    return false;
  }
}

/**
 * 마이그레이션 상태 확인
 */
export async function checkMigrationStatus(): Promise<{
  hasWeeklySettings: boolean;
  staffWithHolidays: number;
  totalStaff: number;
}> {
  try {
    const allStaff = await dbManager.getAllStaff();
    let staffWithHolidays = 0;
    let hasWeeklySettings = false;
    
    for (const staff of allStaff) {
      if (staff.holidays && staff.holidays.length > 0) {
        staffWithHolidays++;
      }
      
      if (!hasWeeklySettings) {
        const weeklySettings = await dbManager.getWeeklyHolidaySettingsByStaff(staff.id);
        if (weeklySettings.length > 0) {
          hasWeeklySettings = true;
        }
      }
    }
    
    return {
      hasWeeklySettings,
      staffWithHolidays,
      totalStaff: allStaff.length
    };
  } catch (error) {
    console.error('마이그레이션 상태 확인 실패:', error);
    return {
      hasWeeklySettings: false,
      staffWithHolidays: 0,
      totalStaff: 0
    };
  }
}