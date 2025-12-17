import { BaseDBManager } from './BaseDBManager';
import type { DailyScheduleSettings } from './types';

/**
 * 일별 스케줄 설정 서비스 클래스
 * 직원의 날짜별 근무시간/휴일 정보를 관리
 */
export class DailyScheduleService extends BaseDBManager {
  /**
   * 일별 스케줄설정 저장/업데이트 (배열 일괄 처리)
   */
  async saveDailySchedules(
    settingsArray: Omit<DailyScheduleSettings, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<DailyScheduleSettings[]> {
    try {
      const savedSettings: DailyScheduleSettings[] = [];

      for (const setting of settingsArray) {
        // 기존 설정이 있는지 확인 (staffId + date 조합)
        const existing = await this.getDailyScheduleByStaffAndDate(
          setting.staffId,
          setting.date
        );

        let savedSetting: DailyScheduleSettings;

        if (existing) {
          // 업데이트
          savedSetting = {
            ...existing,
            ...setting,
            updatedAt: new Date(),
          };

          await this.executeTransaction('dailyScheduleSettings', 'readwrite', (store) =>
            store.put(savedSetting)
          );
        } else {
          // 새로 추가
          savedSetting = {
            ...setting,
            id: this.generateUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await this.executeTransaction('dailyScheduleSettings', 'readwrite', (store) =>
            store.add(savedSetting)
          );
        }

        savedSettings.push(savedSetting);
      }

      console.log('일별 스케줄설정 저장 성공:', savedSettings.length);
      return savedSettings;
    } catch (error) {
      console.error('일별 스케줄설정 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 직원의 특정 날짜 스케줄 조회
   */
  async getDailyScheduleByStaffAndDate(
    staffId: string,
    date: string
  ): Promise<DailyScheduleSettings | null> {
    try {
      const settings = await this.executeTransaction(
        'dailyScheduleSettings',
        'readonly',
        (store) => {
          const index = store.index('staffDate');
          return index.getAll(IDBKeyRange.only([staffId, date]));
        }
      );

      if (settings.length === 0) return null;

      return {
        ...settings[0],
        createdAt: new Date(settings[0].createdAt),
        updatedAt: new Date(settings[0].updatedAt),
      };
    } catch (error) {
      console.error('일별 스케줄 조회 실패:', error);
      return null;
    }
  }

  /**
   * 특정 직원의 날짜 범위 스케줄 조회
   */
  async getDailySchedulesByStaffAndDateRange(
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<DailyScheduleSettings[]> {
    try {
      const allSettings = await this.getDailySchedulesByStaff(staffId);

      // 날짜 범위 필터링
      return allSettings.filter(
        (setting) => setting.date >= startDate && setting.date <= endDate
      );
    } catch (error) {
      console.error('날짜 범위 스케줄 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 직원의 모든 일별 스케줄 조회
   */
  async getDailySchedulesByStaff(staffId: string): Promise<DailyScheduleSettings[]> {
    try {
      const settings = await this.executeTransaction(
        'dailyScheduleSettings',
        'readonly',
        (store) => {
          const index = store.index('staffId');
          return index.getAll(IDBKeyRange.only(staffId));
        }
      );

      return settings.map((setting) => ({
        ...setting,
        createdAt: new Date(setting.createdAt),
        updatedAt: new Date(setting.updatedAt),
      }));
    } catch (error) {
      console.error('직원별 일별 스케줄 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 날짜의 모든 스케줄 조회
   */
  async getDailySchedulesByDate(date: string): Promise<DailyScheduleSettings[]> {
    try {
      const settings = await this.executeTransaction(
        'dailyScheduleSettings',
        'readonly',
        (store) => {
          const index = store.index('date');
          return index.getAll(IDBKeyRange.only(date));
        }
      );

      return settings.map((setting) => ({
        ...setting,
        createdAt: new Date(setting.createdAt),
        updatedAt: new Date(setting.updatedAt),
      }));
    } catch (error) {
      console.error('날짜별 스케줄 조회 실패:', error);
      return [];
    }
  }

  /**
   * 일별 스케줄 삭제
   */
  async deleteDailySchedule(id: string): Promise<boolean> {
    try {
      await this.executeTransaction('dailyScheduleSettings', 'readwrite', (store) =>
        store.delete(id)
      );

      console.log('일별 스케줄 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('일별 스케줄 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 직원의 모든 일별 스케줄 삭제
   */
  async deleteAllDailySchedulesByStaff(staffId: string): Promise<boolean> {
    try {
      const settings = await this.getDailySchedulesByStaff(staffId);

      for (const setting of settings) {
        await this.deleteDailySchedule(setting.id);
      }

      console.log('직원 일별 스케줄 전체 삭제 성공:', staffId);
      return true;
    } catch (error) {
      console.error('직원 일별 스케줄 전체 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 날짜 범위의 스케줄 삭제
   */
  async deleteDailySchedulesByDateRange(
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<boolean> {
    try {
      const settings = await this.getDailySchedulesByStaffAndDateRange(
        staffId,
        startDate,
        endDate
      );

      for (const setting of settings) {
        await this.deleteDailySchedule(setting.id);
      }

      console.log('날짜 범위 스케줄 삭제 성공:', staffId, startDate, endDate);
      return true;
    } catch (error) {
      console.error('날짜 범위 스케줄 삭제 실패:', error);
      throw error;
    }
  }
}
