import { useState, useEffect, useCallback } from 'react';
import { dbManager } from '../utils/indexedDB';

interface StaffHolidayData {
  staffId: string;
  holidays: string[];
}

/**
 * 직원별 휴일 정보를 관리하는 Hook
 */
export const useStaffHolidays = (staffIds: string[]) => {
  const [staffHolidays, setStaffHolidays] = useState<StaffHolidayData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStaffHolidays = useCallback(async () => {
    if (staffIds.length === 0) {
      setStaffHolidays([]);
      return;
    }

    try {
      setLoading(true);
      const holidayData = await Promise.all(
        staffIds.map(async (staffId) => ({
          staffId,
          holidays: await dbManager.getStaffHolidays(staffId)
        }))
      );
      setStaffHolidays(holidayData);
    } catch (error) {
      console.error('직원 휴일 정보 로드 실패:', error);
      setStaffHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [staffIds]);

  useEffect(() => {
    loadStaffHolidays();
  }, [loadStaffHolidays]);

  /**
   * 특정 직원의 특정 날짜가 휴일인지 확인
   */
  const isStaffHoliday = useCallback((staffId: string, date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0];
    const staffData = staffHolidays.find(data => data.staffId === staffId);
    return staffData?.holidays.includes(dateString) || false;
  }, [staffHolidays]);

  /**
   * 특정 날짜에 휴일인 직원 목록 반환
   */
  const getHolidayStaff = useCallback((date: Date): string[] => {
    const dateString = date.toISOString().split('T')[0];
    return staffHolidays
      .filter(data => data.holidays.includes(dateString))
      .map(data => data.staffId);
  }, [staffHolidays]);

  /**
   * 전체 휴일 정보 재로드
   */
  const refreshHolidays = useCallback(async () => {
    await loadStaffHolidays();
  }, [loadStaffHolidays]);

  return {
    staffHolidays,
    loading,
    isStaffHoliday,
    getHolidayStaff,
    refreshHolidays
  };
};