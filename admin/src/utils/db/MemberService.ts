/**
 * 회원 관리 서비스
 */

import { BaseDBManager } from './BaseDBManager';
import { Member, DuplicateCheckResult, LoginIdDuplicateCheckResult } from './types';

export class MemberService extends BaseDBManager {

  /**
   * 회원 추가
   */
  async addMember(memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('=== addMember 함수 시작 ===');
      console.log('받은 memberData:', memberData);
      
      // 데이터베이스 연결 확인
      if (!this.db) {
        console.log('데이터베이스가 연결되지 않음, 초기화 시도...');
        await this.initDB();
      }
      console.log('데이터베이스 연결 상태:', this.db ? '연결됨' : '연결 안됨');
      
      const member: Member = {
        id: this.generateUUID(),
        ...memberData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('생성할 회원 객체:', member);
      console.log('회원 ID:', member.id);
      
      console.log('트랜잭션 시작...');
      await this.executeTransaction('members', 'readwrite', (store) => {
        console.log('store.add 실행 중...');
        console.log('추가할 멤버 객체:', member);
        try {
          const request = store.add(member);
          console.log('store.add 요청 생성됨');
          return request;
        } catch (storeError) {
          console.error('❌ store.add에서 즉시 에러:', storeError);
          throw storeError;
        }
      });

      console.log('✅ 회원 추가 성공:', member.id);
      
      // 즉시 확인
      console.log('=== 저장 확인 ===');
      const savedMember = await this.executeTransaction('members', 'readonly', (store) => 
        store.get(member.id)
      );
      
      if (savedMember) {
        console.log('✅ 저장된 회원 확인됨:', savedMember);
      } else {
        console.error('❌ 방금 저장한 회원을 찾을 수 없음');
      }
      
      return member.id;
    } catch (error) {
      console.error('❌ 회원 추가 실패:', error);
      console.error('에러 상세:', error);
      throw error;
    }
  }

  /**
   * 모든 회원 조회
   */
  async getAllMembers(): Promise<Member[]> {
    try {
      return await this.executeTransaction('members', 'readonly', (store) => 
        store.getAll()
      );
    } catch (error) {
      console.error('회원 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * ID로 회원 조회
   */
  async getMemberById(id: string): Promise<Member | null> {
    try {
      return await this.executeTransaction('members', 'readonly', (store) => 
        store.get(id)
      ) || null;
    } catch (error) {
      console.error('회원 조회 실패:', error);
      return null;
    }
  }

  /**
   * 전화번호로 회원 조회
   */
  async getMemberByPhone(phone: string): Promise<Member | null> {
    try {
      const result = await this.executeTransaction('members', 'readonly', (store) => {
        const index = store.index('phone');
        return index.get(phone);
      });
      
      // 활성 회원만 반환
      return (result && result.isActive) ? result : null;
    } catch (error) {
      console.error('전화번호로 회원 조회 실패:', error);
      return null;
    }
  }

  /**
   * 지점별 회원 조회
   */
  async getMembersByBranch(branchId: string): Promise<Member[]> {
    try {
      return await this.executeTransaction('members', 'readonly', (store) => {
        const index = store.index('branchId');
        return index.getAll(branchId);
      });
    } catch (error) {
      console.error('지점별 회원 조회 실패:', error);
      return [];
    }
  }

  /**
   * 회원 정보 수정
   */
  async updateMember(id: string, updates: Partial<Omit<Member, 'id' | 'createdAt'>>): Promise<boolean> {
    try {
      const existingMember = await this.getMemberById(id);
      if (!existingMember) {
        throw new Error('수정할 회원을 찾을 수 없습니다.');
      }

      const updatedMember: Member = {
        ...existingMember,
        ...updates,
        updatedAt: new Date(),
      };

      await this.executeTransaction('members', 'readwrite', (store) => 
        store.put(updatedMember)
      );

      console.log('회원 정보 수정 성공:', id);
      return true;
    } catch (error) {
      console.error('회원 정보 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 회원 삭제 (비활성화)
   */
  async deleteMember(id: string): Promise<boolean> {
    try {
      await this.updateMember(id, { isActive: false });
      console.log('회원 삭제(비활성화) 성공:', id);
      return true;
    } catch (error) {
      console.error('회원 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 회원 검색 (이름, 전화번호, 이메일)
   */
  async searchMembers(searchTerm: string): Promise<Member[]> {
    try {
      const allMembers = await this.getAllMembers();
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      return allMembers.filter(member => 
        member.name.toLowerCase().includes(lowerSearchTerm) ||
        member.phone.includes(searchTerm) ||
        member.email.toLowerCase().includes(lowerSearchTerm)
      );
    } catch (error) {
      console.error('회원 검색 실패:', error);
      return [];
    }
  }

  /**
   * 이메일로 회원 조회
   */
  async getMemberByEmail(email: string): Promise<Member | null> {
    try {
      // 이메일이 비어있으면 null 반환
      if (!email || email.trim() === '') {
        return null;
      }

      // 모든 회원을 조회해서 이메일이 일치하는 회원 찾기 (대소문자 구분 없이)
      const allMembers = await this.getAllMembers();
      const member = allMembers.find(m => 
        m.email.toLowerCase() === email.toLowerCase() && m.isActive
      );
      
      return member || null;
    } catch (error) {
      console.error('이메일로 회원 조회 실패:', error);
      return null;
    }
  }

  /**
   * 회원 중복 체크 (연락처와 이메일)
   */
  async checkMemberDuplicate(phone: string, email?: string): Promise<DuplicateCheckResult> {
    try {
      // 전화번호 중복 체크
      if (phone && phone.trim() !== '') {
        const existingByPhone = await this.getMemberByPhone(phone);
        if (existingByPhone) {
          return {
            isDuplicate: true,
            duplicateField: 'phone',
            message: `연락처 ${phone}는(은) 이미 등록된 회원입니다.`
          };
        }
      }

      // 이메일 중복 체크 (이메일이 있는 경우만)
      if (email && email.trim() !== '') {
        const existingByEmail = await this.getMemberByEmail(email);
        if (existingByEmail) {
          return {
            isDuplicate: true,
            duplicateField: 'email',
            message: `이메일 ${email}는(은) 이미 등록된 회원입니다.`
          };
        }
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('회원 중복 체크 실패:', error);
      throw error;
    }
  }

  /**
   * 로그인 ID로 회원 조회
   */
  async getMemberByLoginId(loginId: string): Promise<Member | null> {
    try {
      // 로그인 ID가 비어있으면 null 반환
      if (!loginId || loginId.trim() === '') {
        return null;
      }

      return await this.executeTransaction('members', 'readonly', (store) => {
        const index = store.index('loginId');
        return index.get(loginId);
      }) || null;
    } catch (error) {
      console.error('로그인 ID로 회원 조회 실패:', error);
      return null;
    }
  }

  /**
   * 로그인 ID 중복 체크 (직원과 회원 모두 확인)
   * StaffService에 대한 참조가 필요하므로 외부에서 주입받는 방식으로 처리
   */
  async checkLoginIdDuplicate(
    loginId: string, 
    getStaffByLoginId: (loginId: string) => Promise<any>
  ): Promise<LoginIdDuplicateCheckResult> {
    try {
      // 로그인 ID가 비어있거나 임시 ID이면 중복 없음
      if (!loginId || loginId.trim() === '' || loginId.startsWith('temp_')) {
        return { isDuplicate: false };
      }

      // 직원 테이블에서 중복 검사
      const existingStaff = await getStaffByLoginId(loginId);
      if (existingStaff) {
        return {
          isDuplicate: true,
          duplicateType: 'staff',
          message: `로그인 ID ${loginId}는(은) 이미 직원으로 등록되어 있습니다.`
        };
      }

      // 회원 테이블에서 중복 검사
      const existingMember = await this.getMemberByLoginId(loginId);
      if (existingMember && !existingMember.loginId.startsWith('temp_')) {
        return {
          isDuplicate: true,
          duplicateType: 'member',
          message: `로그인 ID ${loginId}는(은) 이미 회원으로 등록되어 있습니다.`
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('로그인 ID 중복 체크 실패:', error);
      throw error;
    }
  }

  /**
   * 회원의 라커 정보 업데이트
   */
  async updateMemberLockerInfo(
    memberId: string, 
    lockerInfo: {
      lockerId: string;
      lockerNumber: string;
      startDate: string;
      endDate: string;
      months: number;
      paymentId?: string;
    } | null
  ): Promise<boolean> {
    try {
      return await this.updateMember(memberId, { lockerInfo });
    } catch (error) {
      console.error('회원 라커 정보 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 라커가 배정된 회원 조회
   */
  async getMembersWithLockers(): Promise<Member[]> {
    try {
      const allMembers = await this.getAllMembers();
      return allMembers.filter(member => member.lockerInfo !== null && member.lockerInfo !== undefined);
    } catch (error) {
      console.error('라커 배정된 회원 조회 실패:', error);
      return [];
    }
  }

  /**
   * 라커 ID로 회원 조회
   */
  async getMemberByLockerId(lockerId: string): Promise<Member | null> {
    try {
      const allMembers = await this.getAllMembers();
      return allMembers.find(member => member.lockerInfo?.lockerId === lockerId) || null;
    } catch (error) {
      console.error('라커 ID로 회원 조회 실패:', error);
      return null;
    }
  }
}