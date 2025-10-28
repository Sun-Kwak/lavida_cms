/**
 * 라커 관련 데이터베이스 서비스
 */

import { BaseDBManager } from './BaseDBManager';
import type { Locker } from './types';

export class LockerService extends BaseDBManager {

  /**
   * 모든 라커 조회
   */
  async getAllLockers(): Promise<Locker[]> {
    try {
      return await this.executeTransaction('lockers', 'readonly', (store) => 
        store.getAll()
      );
    } catch (error) {
      console.error('라커 조회 실패:', error);
      return [];
    }
  }

  /**
   * 지점별 라커 조회
   */
  async getLockersByBranch(branchId: string): Promise<Locker[]> {
    const allLockers = await this.getAllLockers();
    return allLockers.filter(locker => locker.branchId === branchId && locker.isActive);
  }

  /**
   * 라커 추가
   */
  async addLocker(lockerData: Omit<Locker, 'id' | 'createdAt' | 'updatedAt'>): Promise<Locker> {
    const now = new Date();
    const newLocker: Locker = {
      ...lockerData,
      id: this.generateUUID(),
      createdAt: now,
      updatedAt: now
    };

    try {
      await this.executeTransaction('lockers', 'readwrite', (store) => 
        store.add(newLocker)
      );
      return newLocker;
    } catch (error) {
      console.error('라커 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 여러 라커 일괄 추가
   */
  async addMultipleLockers(lockersData: Omit<Locker, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Locker[]> {
    const now = new Date();
    const newLockers: Locker[] = lockersData.map(lockerData => ({
      ...lockerData,
      id: this.generateUUID(),
      createdAt: now,
      updatedAt: now
    }));

    try {
      // 각각 개별적으로 추가
      for (const locker of newLockers) {
        await this.executeTransaction('lockers', 'readwrite', (store) => 
          store.add(locker)
        );
      }
      return newLockers;
    } catch (error) {
      console.error('여러 라커 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 라커 정보 업데이트
   */
  async updateLocker(id: string, updates: Partial<Locker>): Promise<Locker> {
    try {
      // 기존 라커 정보 조회
      const existingLocker = await this.executeTransaction('lockers', 'readonly', (store) => 
        store.get(id)
      );

      if (!existingLocker) {
        throw new Error('라커를 찾을 수 없습니다.');
      }

      // 업데이트된 라커 정보 생성
      const updatedLocker: Locker = {
        ...existingLocker,
        ...updates,
        id: existingLocker.id, // ID는 변경되지 않도록
        createdAt: new Date(existingLocker.createdAt),
        updatedAt: new Date()
      };

      await this.executeTransaction('lockers', 'readwrite', (store) => 
        store.put(updatedLocker)
      );

      return updatedLocker;
    } catch (error) {
      console.error('라커 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 라커 삭제 (소프트 삭제)
   */
  async deleteLocker(id: string): Promise<Locker> {
    return await this.updateLocker(id, { isActive: false });
  }

  /**
   * 라커 완전 삭제 (하드 삭제)
   */
  async permanentDeleteLocker(id: string): Promise<boolean> {
    try {
      await this.executeTransaction('lockers', 'readwrite', (store) => 
        store.delete(id)
      );
      return true;
    } catch (error) {
      console.error('라커 완전 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 라커 ID로 조회
   */
  async getLockerById(id: string): Promise<Locker | null> {
    try {
      const result = await this.executeTransaction('lockers', 'readonly', (store) => 
        store.get(id)
      );
      return result || null;
    } catch (error) {
      console.error('라커 조회 실패:', error);
      return null;
    }
  }

  /**
   * 사용자별 라커 조회
   */
  async getLockersByUser(userId: string): Promise<Locker[]> {
    const allLockers = await this.getAllLockers();
    return allLockers.filter(locker => locker.userId === userId && locker.isActive);
  }

  /**
   * 라커 배정 (사용자 할당 및 회원 정보 업데이트)
   */
  async assignLockerToUser(
    lockerId: string, 
    userId: string, 
    userName: string, 
    months: number,
    paymentId?: string,
    memberService?: any // MemberService 타입 (순환 참조 방지를 위해 any 사용)
  ): Promise<Locker> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + months);

    // 라커 정보 업데이트
    const updatedLocker = await this.updateLocker(lockerId, {
      status: 'occupied',
      userId,
      userName,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      months,
      paymentId
    });

    // 회원 정보에도 라커 정보 추가 (MemberService가 있는 경우)
    if (memberService) {
      try {
        await memberService.updateMemberLockerInfo(userId, {
          lockerId,
          lockerNumber: updatedLocker.number,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          months,
          paymentId
        });
        console.log('회원 라커 정보 업데이트 완료:', userId);
      } catch (error) {
        console.error('회원 라커 정보 업데이트 실패:', error);
        // 라커 배정은 성공했으므로 에러를 throw하지 않고 로그만 남김
      }
    }

    return updatedLocker;
  }

  /**
   * 라커 해제 (사용자 할당 해제 및 회원 정보 업데이트)
   */
  async unassignLocker(lockerId: string, memberService?: any): Promise<Locker> {
    // 라커 정보에서 사용자 ID 가져오기
    const locker = await this.getLockerById(lockerId);
    const userId = locker?.userId;

    // 라커 해제
    const updatedLocker = await this.updateLocker(lockerId, {
      status: 'available',
      userId: undefined,
      userName: undefined,
      startDate: undefined,
      endDate: undefined,
      months: undefined,
      paymentId: undefined
    });

    // 회원 정보에서도 라커 정보 제거 (MemberService가 있고 userId가 있는 경우)
    if (memberService && userId) {
      try {
        await memberService.updateMemberLockerInfo(userId, null);
        console.log('회원 라커 정보 제거 완료:', userId);
      } catch (error) {
        console.error('회원 라커 정보 제거 실패:', error);
        // 라커 해제는 성공했으므로 에러를 throw하지 않고 로그만 남김
      }
    }

    return updatedLocker;
  }

  /**
   * 만료된 라커 조회 (자동 해제용)
   */
  async getExpiredLockers(): Promise<Locker[]> {
    const allLockers = await this.getAllLockers();
    const today = new Date().toISOString().split('T')[0];
    
    return allLockers.filter(locker => 
      locker.status === 'occupied' && 
      locker.endDate && 
      locker.endDate < today &&
      locker.isActive
    );
  }

  /**
   * 라커 번호 중복 체크
   */
  async checkLockerNumberDuplicate(branchId: string, number: string, excludeId?: string): Promise<boolean> {
    const branchLockers = await this.getLockersByBranch(branchId);
    return branchLockers.some(locker => 
      locker.number === number && 
      locker.id !== excludeId
    );
  }
}