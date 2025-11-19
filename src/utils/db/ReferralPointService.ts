/**
 * 추천 포인트 설정 관리 서비스
 */

import { BaseDBManager } from './BaseDBManager';
import { ReferralPointSettings } from './types';

export class ReferralPointService extends BaseDBManager {
  
  /**
   * 모든 추천 포인트 설정 조회
   */
  async getAllReferralPointSettings(): Promise<ReferralPointSettings[]> {
    try {
      return await this.executeTransaction('referralPointSettings', 'readonly', (store) => 
        store.getAll()
      );
    } catch (error) {
      console.error('추천 포인트 설정 조회 실패:', error);
      return [];
    }
  }

  /**
   * 지점 ID로 추천 포인트 설정 조회
   */
  async getReferralPointSettingsByBranchId(branchId: string): Promise<ReferralPointSettings | null> {
    try {
      const allSettings = await this.getAllReferralPointSettings();
      const setting = allSettings.find(s => s.branchId === branchId);
      return setting || null;
    } catch (error) {
      console.error('추천 포인트 설정 조회 실패:', error);
      return null;
    }
  }

  /**
   * ID로 추천 포인트 설정 조회
   */
  async getReferralPointSettingsById(id: string): Promise<ReferralPointSettings | null> {
    try {
      const result = await this.executeTransaction('referralPointSettings', 'readonly', (store) => 
        store.get(id)
      );
      return result || null;
    } catch (error) {
      console.error('추천 포인트 설정 조회 실패:', error);
      return null;
    }
  }

  /**
   * 추천 포인트 설정 추가
   */
  async addReferralPointSettings(
    settingsData: Omit<ReferralPointSettings, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReferralPointSettings> {
    const now = new Date();
    
    // 해당 지점에 이미 설정이 있는지 확인
    const existing = await this.getReferralPointSettingsByBranchId(settingsData.branchId);
    if (existing) {
      throw new Error('해당 지점의 추천 포인트 설정이 이미 존재합니다.');
    }

    const newSettings: ReferralPointSettings = {
      ...settingsData,
      id: this.generateUUID(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.executeTransaction('referralPointSettings', 'readwrite', (store) => 
        store.add(newSettings)
      );
      console.log('추천 포인트 설정 추가 성공:', newSettings);
      return newSettings;
    } catch (error) {
      console.error('추천 포인트 설정 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 추천 포인트 설정 수정
   */
  async updateReferralPointSettings(
    id: string, 
    updates: Partial<Omit<ReferralPointSettings, 'id' | 'createdAt' | 'branchId'>>
  ): Promise<ReferralPointSettings | null> {
    try {
      const existing = await this.getReferralPointSettingsById(id);
      if (!existing) {
        throw new Error('존재하지 않는 추천 포인트 설정입니다.');
      }

      const updatedSettings: ReferralPointSettings = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };

      await this.executeTransaction('referralPointSettings', 'readwrite', (store) => 
        store.put(updatedSettings)
      );
      
      console.log('추천 포인트 설정 수정 성공:', updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('추천 포인트 설정 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 추천 포인트 설정 삭제
   */
  async deleteReferralPointSettings(id: string): Promise<boolean> {
    try {
      await this.executeTransaction('referralPointSettings', 'readwrite', (store) => 
        store.delete(id)
      );
      
      console.log('추천 포인트 설정 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('추천 포인트 설정 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 지점별 추천 포인트 가져오기 (활성화된 설정만)
   * 해당 지점 설정이 없으면 "전체" 지점 설정을 사용
   * @param branchId 지점 ID
   * @returns {referrerPoints, referredPoints} 또는 기본값 {0, 0}
   */
  async getReferralPoints(branchId: string): Promise<{ referrerPoints: number; referredPoints: number }> {
    try {
      // 1. 해당 지점의 설정 확인
      let settings = await this.getReferralPointSettingsByBranchId(branchId);
      
      // 2. 해당 지점 설정이 없으면 "전체" 지점 설정 사용
      if (!settings) {
        const allSettings = await this.getAllReferralPointSettings();
        settings = allSettings.find(s => s.branchName === '전체') || null;
      }
      
      if (settings && settings.isActive) {
        return {
          referrerPoints: settings.referrerPoints,
          referredPoints: settings.referredPoints,
        };
      }
      
      // 설정이 없거나 비활성화된 경우 기본값 반환
      return {
        referrerPoints: 0,
        referredPoints: 0,
      };
    } catch (error) {
      console.error('추천 포인트 조회 실패:', error);
      return {
        referrerPoints: 0,
        referredPoints: 0,
      };
    }
  }
}
