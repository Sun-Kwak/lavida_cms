/**
 * 코치 휴일 설정 관련 유틸리티 함수들
 */

import { HolidaySettings } from './indexedDB';

// IndexedDB 데이터베이스 이름 및 버전
const DB_NAME = 'LavidaDB';
const DB_VERSION = 1;
const HOLIDAY_STORE = 'holidaySettings';

/**
 * IndexedDB 초기화
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 휴일 설정 스토어 생성
      if (!db.objectStoreNames.contains(HOLIDAY_STORE)) {
        const store = db.createObjectStore(HOLIDAY_STORE, { keyPath: 'id' });
        store.createIndex('staffId', 'staffId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('staffDate', ['staffId', 'date'], { unique: true });
      }
    };
  });
};

/**
 * 휴일 설정 저장
 */
export const saveHolidaySettings = async (settings: HolidaySettings[]): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction([HOLIDAY_STORE], 'readwrite');
  const store = transaction.objectStore(HOLIDAY_STORE);
  
  // 기존 설정 삭제 후 새로운 설정 저장
  const staffIds = Array.from(new Set(settings.map(s => s.staffId)));
  const dates = Array.from(new Set(settings.map(s => s.date)));
  
  // 해당 코치들의 해당 날짜들 기존 설정 삭제
  for (const staffId of staffIds) {
    for (const date of dates) {
      const deleteRequest = store.delete(`${staffId}-${date}`);
      await new Promise((resolve, reject) => {
        deleteRequest.onsuccess = () => resolve(undefined);
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    }
  }
  
  // 새로운 설정 저장
  for (const setting of settings) {
    const addRequest = store.put(setting);
    await new Promise((resolve, reject) => {
      addRequest.onsuccess = () => resolve(undefined);
      addRequest.onerror = () => reject(addRequest.error);
    });
  }
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

/**
 * 특정 코치의 휴일 설정 조회
 */
export const getHolidaySettingsByStaffId = async (staffId: string): Promise<HolidaySettings[]> => {
  const db = await initDB();
  const transaction = db.transaction([HOLIDAY_STORE], 'readonly');
  const store = transaction.objectStore(HOLIDAY_STORE);
  const index = store.index('staffId');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(staffId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 특정 날짜 범위의 휴일 설정 조회
 */
export const getHolidaySettingsByDateRange = async (
  startDate: string, 
  endDate: string, 
  staffIds?: string[]
): Promise<HolidaySettings[]> => {
  const db = await initDB();
  const transaction = db.transaction([HOLIDAY_STORE], 'readonly');
  const store = transaction.objectStore(HOLIDAY_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const allSettings = request.result;
      const filteredSettings = allSettings.filter(setting => {
        const isInDateRange = setting.date >= startDate && setting.date <= endDate;
        const isTargetStaff = !staffIds || staffIds.includes(setting.staffId);
        return isInDateRange && isTargetStaff;
      });
      resolve(filteredSettings);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * 모든 휴일 설정 조회
 */
export const getAllHolidaySettings = async (): Promise<HolidaySettings[]> => {
  const db = await initDB();
  const transaction = db.transaction([HOLIDAY_STORE], 'readonly');
  const store = transaction.objectStore(HOLIDAY_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 특정 휴일 설정 삭제
 */
export const deleteHolidaySettings = async (staffId: string, dates: string[]): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction([HOLIDAY_STORE], 'readwrite');
  const store = transaction.objectStore(HOLIDAY_STORE);
  
  for (const date of dates) {
    const deleteRequest = store.delete(`${staffId}-${date}`);
    await new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => resolve(undefined);
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

/**
 * 특정 날짜가 휴일인지 확인 (주말 기본 휴일 고려)
 */
export const isHoliday = async (staffId: string, date: string): Promise<boolean> => {
  const dateObj = new Date(date);
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  
  const db = await initDB();
  const transaction = db.transaction([HOLIDAY_STORE], 'readonly');
  const store = transaction.objectStore(HOLIDAY_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.get(`${staffId}-${date}`);
    request.onsuccess = () => {
      const setting = request.result;
      if (setting) {
        resolve(setting.isHoliday);
      } else {
        // 설정이 없으면 주말 기본값 사용
        resolve(isWeekend);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * 특정 코치의 근무일 목록 조회 (주어진 날짜 범위 내)
 */
export const getWorkingDays = async (
  staffId: string, 
  startDate: string, 
  endDate: string
): Promise<string[]> => {
  const settings = await getHolidaySettingsByDateRange(startDate, endDate, [staffId]);
  const workingDays: string[] = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    const setting = settings.find(s => s.date === dateStr);
    const isHolidayForDate = setting ? setting.isHoliday : isWeekend;
    
    if (!isHolidayForDate) {
      workingDays.push(dateStr);
    }
  }
  
  return workingDays;
};
