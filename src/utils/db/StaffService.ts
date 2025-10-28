/**
 * 직원 관리 서비스
 */

import { BaseDBManager } from './BaseDBManager';
import { Staff, DuplicateCheckResult } from './types';
import { SYSTEM_ADMIN_CONFIG } from '../../constants/staffConstants';

export class StaffService extends BaseDBManager {

  /**
   * 모든 직원 조회
   */
  async getAllStaff(): Promise<Staff[]> {
    try {
      const staffList = await this.executeTransaction('staff', 'readonly', (store) => 
        store.getAll()
      );

      // 저장된 파일 데이터를 File 객체로 복원
      return staffList.map(staff => {
        if (staff.contractFileData && staff.contractFileName) {
          // 파일 확장자로부터 MIME 타입 추정
          const extension = staff.contractFileName.split('.').pop()?.toLowerCase();
          let mimeType = 'application/octet-stream';
          
          if (extension === 'pdf') {
            mimeType = 'application/pdf';
          } else if (['jpg', 'jpeg'].includes(extension || '')) {
            mimeType = 'image/jpeg';
          } else if (extension === 'png') {
            mimeType = 'image/png';
          }

          staff.contractFile = this.arrayBufferToFile(
            staff.contractFileData, 
            staff.contractFileName, 
            mimeType
          );
        }
        return staff;
      });
    } catch (error) {
      console.error('직원 조회 실패:', error);
      return [];
    }
  }

  /**
   * ID로 직원 조회
   */
  async getStaffById(id: string): Promise<Staff | null> {
    try {
      const staff = await this.executeTransaction('staff', 'readonly', (store) => 
        store.get(id)
      );

      if (!staff) return null;

      // 저장된 파일 데이터를 File 객체로 복원
      if (staff.contractFileData && staff.contractFileName) {
        const extension = staff.contractFileName.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        
        if (extension === 'pdf') {
          mimeType = 'application/pdf';
        } else if (['jpg', 'jpeg'].includes(extension || '')) {
          mimeType = 'image/jpeg';
        } else if (extension === 'png') {
          mimeType = 'image/png';
        }

        staff.contractFile = this.arrayBufferToFile(
          staff.contractFileData, 
          staff.contractFileName, 
          mimeType
        );
      }

      return staff;
    } catch (error) {
      console.error('직원 조회 실패:', error);
      return null;
    }
  }

  /**
   * 직원 추가
   */
  async addStaff(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Staff> {
    const now = new Date();
    
    // 파일 데이터 처리
    let contractFileData: ArrayBuffer | undefined;
    let contractFileName: string | undefined;
    
    if (staffData.contractFile) {
      contractFileData = await this.fileToArrayBuffer(staffData.contractFile);
      contractFileName = staffData.contractFile.name;
    }

    const newStaff: Staff = {
      ...staffData,
      id: this.generateUUID(),
      createdAt: now,
      updatedAt: now,
      isActive: staffData.isActive !== undefined ? staffData.isActive : true, // 기본값 true
      contractFile: undefined, // File 객체는 저장하지 않음
      contractFileName,
      contractFileData,
    };

    try {
      await this.executeTransaction('staff', 'readwrite', (store) => 
        store.add(newStaff)
      );
      console.log('직원 추가 성공:', newStaff);
      return newStaff;
    } catch (error) {
      console.error('직원 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 시스템 관리자 계정인지 확인
   */
  private isSystemAdmin(staff: Staff): boolean {
    return staff.loginId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
  }

  /**
   * 시스템 관리자 보호 검증
   */
  private validateSystemAdminProtection(staff: Staff, operation: 'delete' | 'permission_change'): void {
    if (this.isSystemAdmin(staff)) {
      const message = operation === 'delete' 
        ? '시스템 관리자 계정은 삭제할 수 없습니다.'
        : '시스템 관리자 계정의 권한은 변경할 수 없습니다.';
      throw new Error(message);
    }
  }

  /**
   * 직원 수정
   */
  async updateStaff(id: string, updates: Partial<Omit<Staff, 'id' | 'createdAt'>>): Promise<Staff | null> {
    try {
      const existing = await this.getStaffById(id);
      if (!existing) {
        throw new Error('존재하지 않는 직원입니다.');
      }

      // 시스템 관리자 권한 변경 보호
      if (updates.permission && updates.permission !== existing.permission) {
        this.validateSystemAdminProtection(existing, 'permission_change');
      }

      // 파일 데이터 처리
      let contractFileData = existing.contractFileData;
      let contractFileName = existing.contractFileName;
      
      if (updates.contractFile) {
        contractFileData = await this.fileToArrayBuffer(updates.contractFile);
        contractFileName = updates.contractFile.name;
      }

      const updatedStaff: Staff = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
        contractFile: undefined, // File 객체는 저장하지 않음
        contractFileName,
        contractFileData,
      };

      await this.executeTransaction('staff', 'readwrite', (store) => 
        store.put(updatedStaff)
      );

      console.log('직원 수정 성공:', updatedStaff);
      return updatedStaff;
    } catch (error) {
      console.error('직원 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 직원 삭제
   */
  async deleteStaff(id: string): Promise<boolean> {
    try {
      const existing = await this.getStaffById(id);
      if (!existing) {
        throw new Error('존재하지 않는 직원입니다.');
      }

      // 시스템 관리자 삭제 보호
      this.validateSystemAdminProtection(existing, 'delete');

      await this.executeTransaction('staff', 'readwrite', (store) => 
        store.delete(id)
      );
      console.log('직원 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('직원 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 직원 활성/비활성 상태 토글
   */
  async toggleStaffStatus(id: string): Promise<Staff | null> {
    try {
      const existing = await this.getStaffById(id);
      if (!existing) {
        throw new Error('존재하지 않는 직원입니다.');
      }

      // 시스템 관리자 상태 변경 보호
      if (existing.loginId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID) {
        throw new Error('시스템 관리자 계정의 상태는 변경할 수 없습니다.');
      }

      const updatedStaff = {
        ...existing,
        isActive: !existing.isActive,
        updatedAt: new Date()
      };

      await this.executeTransaction('staff', 'readwrite', (store) => 
        store.put(updatedStaff)
      );

      console.log('직원 상태 변경 성공:', id, `-> ${updatedStaff.isActive ? '활성' : '비활성'}`);
      return updatedStaff;
    } catch (error) {
      console.error('직원 상태 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 지점별 직원 조회
   */
  async getStaffByBranch(branchId: string): Promise<Staff[]> {
    try {
      return await this.executeTransaction('staff', 'readonly', (store) => {
        const index = store.index('branchId');
        return index.getAll(IDBKeyRange.only(branchId));
      });
    } catch (error) {
      console.error('지점별 직원 조회 실패:', error);
      return [];
    }
  }

  /**
   * 이메일로 직원 조회
   */
  async getStaffByEmail(email: string): Promise<Staff | null> {
    try {
      const result = await this.executeTransaction('staff', 'readonly', (store) => {
        const index = store.index('email');
        return index.get(email);
      });
      return result || null;
    } catch (error) {
      console.error('이메일로 직원 조회 실패:', error);
      return null;
    }
  }

  /**
   * 로그인ID로 직원 조회
   */
  async getStaffByLoginId(loginId: string): Promise<Staff | null> {
    try {
      const staff = await this.executeTransaction('staff', 'readonly', (store) => {
        const index = store.index('loginId');
        return index.get(loginId);
      });

      if (!staff) return null;

      // 저장된 파일 데이터를 File 객체로 복원
      if (staff.contractFileData && staff.contractFileName) {
        const extension = staff.contractFileName.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        
        if (extension === 'pdf') {
          mimeType = 'application/pdf';
        } else if (['jpg', 'jpeg'].includes(extension || '')) {
          mimeType = 'image/jpeg';
        } else if (extension === 'png') {
          mimeType = 'image/png';
        }

        staff.contractFile = this.arrayBufferToFile(
          staff.contractFileData, 
          staff.contractFileName, 
          mimeType
        );
      }

      return staff;
    } catch (error) {
      console.error('로그인ID로 직원 조회 실패:', error);
      return null;
    }
  }

  /**
   * 전화번호로 직원 조회
   */
  async getStaffByPhone(phone: string): Promise<Staff | null> {
    try {
      const allStaff = await this.getAllStaff();
      const found = allStaff.find(staff => staff.phone === phone);
      return found || null;
    } catch (error) {
      console.error('전화번호로 직원 조회 실패:', error);
      return null;
    }
  }

  /**
   * 중복 체크 함수 (등록 시 사용)
   */
  async checkDuplicateStaff(loginId: string, email: string, phone: string): Promise<DuplicateCheckResult> {
    try {
      // 로그인 ID 중복 체크
      const existingByLoginId = await this.getStaffByLoginId(loginId);
      if (existingByLoginId) {
        return {
          isDuplicate: true,
          duplicateField: 'loginId',
          message: '이미 사용 중인 로그인 ID입니다.'
        };
      }

      // 이메일 중복 체크
      const existingByEmail = await this.getStaffByEmail(email);
      if (existingByEmail) {
        return {
          isDuplicate: true,
          duplicateField: 'email',
          message: '이미 사용 중인 이메일입니다.'
        };
      }

      // 전화번호 중복 체크
      const existingByPhone = await this.getStaffByPhone(phone);
      if (existingByPhone) {
        return {
          isDuplicate: true,
          duplicateField: 'phone',
          message: '이미 사용 중인 전화번호입니다.'
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('중복 체크 실패:', error);
      throw error;
    }
  }

  /**
   * 기존 직원 데이터의 isActive 필드 초기화 (마이그레이션용)
   */
  async migrateStaffActiveStatus(): Promise<void> {
    try {
      const allStaff = await this.executeTransaction('staff', 'readonly', (store) => 
        store.getAll()
      );

      // isActive 필드가 없는 직원들을 찾아서 업데이트
      const staffToUpdate = allStaff.filter(staff => staff.isActive === undefined);
      
      if (staffToUpdate.length > 0) {
        console.log(`${staffToUpdate.length}명의 직원 isActive 필드를 초기화합니다.`);
        
        for (const staff of staffToUpdate) {
          const updatedStaff = {
            ...staff,
            isActive: true, // 기본값을 true로 설정
            updatedAt: new Date()
          };
          
          await this.executeTransaction('staff', 'readwrite', (store) => 
            store.put(updatedStaff)
          );
        }
        
        console.log('직원 isActive 필드 초기화 완료');
      }
    } catch (error) {
      console.error('직원 isActive 필드 초기화 실패:', error);
    }
  }
}