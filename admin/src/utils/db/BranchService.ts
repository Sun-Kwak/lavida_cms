/**
 * 지점 관리 서비스
 */

import { BaseDBManager } from './BaseDBManager';
import { Branch } from './types';

export class BranchService extends BaseDBManager {
  
  /**
   * 모든 지점 조회
   */
  async getAllBranches(): Promise<Branch[]> {
    try {
      return await this.executeTransaction('branches', 'readonly', (store) => 
        store.getAll()
      );
    } catch (error) {
      console.error('지점 조회 실패:', error);
      return [];
    }
  }

  /**
   * ID로 지점 조회
   */
  async getBranchById(id: string): Promise<Branch | null> {
    try {
      const result = await this.executeTransaction('branches', 'readonly', (store) => 
        store.get(id)
      );
      return result || null;
    } catch (error) {
      console.error('지점 조회 실패:', error);
      return null;
    }
  }

  /**
   * 지점 추가
   */
  async addBranch(branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<Branch> {
    const now = new Date();
    const newBranch: Branch = {
      ...branchData,
      id: this.generateUUID(),
      createdAt: now,
      updatedAt: now,
      lockerPrice: branchData.lockerPrice || 5000, // 기본 라커 가격 5000원
    };

    try {
      await this.executeTransaction('branches', 'readwrite', (store) => 
        store.add(newBranch)
      );
      console.log('지점 추가 성공:', newBranch);
      return newBranch;
    } catch (error) {
      console.error('지점 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 지점 수정
   */
  async updateBranch(id: string, updates: Partial<Omit<Branch, 'id' | 'createdAt'>>): Promise<Branch | null> {
    try {
      const existing = await this.getBranchById(id);
      if (!existing) {
        throw new Error('존재하지 않는 지점입니다.');
      }

      const updatedBranch: Branch = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };

      await this.executeTransaction('branches', 'readwrite', (store) => 
        store.put(updatedBranch)
      );

      console.log('지점 수정 성공:', updatedBranch);
      return updatedBranch;
    } catch (error) {
      console.error('지점 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 지점 삭제
   */
  async deleteBranch(id: string): Promise<boolean> {
    try {
      await this.executeTransaction('branches', 'readwrite', (store) => 
        store.delete(id)
      );
      console.log('지점 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('지점 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 활성 지점만 조회
   */
  async getActiveBranches(): Promise<Branch[]> {
    try {
      return await this.executeTransaction('branches', 'readonly', (store) => {
        const index = store.index('isActive');
        return index.getAll(IDBKeyRange.only(true));
      });
    } catch (error) {
      console.error('활성 지점 조회 실패:', error);
      return [];
    }
  }

  /**
   * 지점명으로 정확히 일치하는 지점 조회 또는 생성 (원자적 처리)
   * 동시 실행 시 race condition 방지
   */
  async getOrCreateBranchByName(name: string, branchData?: Omit<Branch, 'id' | 'createdAt' | 'updatedAt' | 'name'>): Promise<Branch> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['branches'], 'readwrite');
      const store = transaction.objectStore('branches');
      const index = store.index('name');
      
      // 먼저 기존 지점 확인
      const getRequest = index.get(name);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          // 이미 존재함
          resolve(getRequest.result);
        } else {
          // 존재하지 않음, 새로 생성
          const now = new Date();
          const newBranch: Branch = {
            name,
            address: branchData?.address || '',
            phone: branchData?.phone || '',
            isActive: branchData?.isActive ?? true,
            id: this.generateUUID(),
            createdAt: now,
            updatedAt: now,
          };

          const addRequest = store.add(newBranch);
          addRequest.onsuccess = () => {
            console.log('새 지점 생성 완료:', newBranch);
            resolve(newBranch);
          };
          addRequest.onerror = () => {
            console.error('지점 추가 실패:', addRequest.error);
            reject(addRequest.error);
          };
        }
      };
      
      getRequest.onerror = () => {
        console.error('지점 조회 실패:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  /**
   * 지점명으로 정확히 일치하는 지점 조회
   */
  async getBranchByName(name: string): Promise<Branch | null> {
    try {
      const allBranches = await this.getAllBranches();
      const branch = allBranches.find(branch => branch.name === name);
      return branch || null;
    } catch (error) {
      console.error('지점명으로 조회 실패:', error);
      return null;
    }
  }

  /**
   * 지점명으로 검색
   */
  async searchBranchesByName(name: string): Promise<Branch[]> {
    try {
      const allBranches = await this.getAllBranches();
      return allBranches.filter(branch => 
        branch.name.toLowerCase().includes(name.toLowerCase())
      );
    } catch (error) {
      console.error('지점 검색 실패:', error);
      return [];
    }
  }

  /**
   * 지점별 라커 가격 설정
   */
  async updateLockerPrice(branchId: string, price: number): Promise<boolean> {
    try {
      const existing = await this.getBranchById(branchId);
      if (!existing) {
        throw new Error('존재하지 않는 지점입니다.');
      }

      const updatedBranch: Branch = {
        ...existing,
        lockerPrice: price,
        updatedAt: new Date(),
      };

      await this.executeTransaction('branches', 'readwrite', (store) => 
        store.put(updatedBranch)
      );

      console.log('지점별 라커 가격 설정 성공:', { branchId, price });
      return true;
    } catch (error) {
      console.error('지점별 라커 가격 설정 실패:', error);
      return false;
    }
  }

  /**
   * 지점별 라커 가격 조회
   */
  async getLockerPrice(branchId: string): Promise<number> {
    try {
      const branch = await this.getBranchById(branchId);
      return branch?.lockerPrice || 5000; // 기본값 5천원
    } catch (error) {
      console.error('지점별 라커 가격 조회 실패:', error);
      return 5000; // 기본값 반환
    }
  }
}