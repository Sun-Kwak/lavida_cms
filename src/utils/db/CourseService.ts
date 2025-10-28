/**
 * 수강정보 관리 서비스
 */

import { BaseDBManager } from './BaseDBManager';
import { CourseEnrollment, UnpaidMetaInfo } from './types';

export class CourseService extends BaseDBManager {

  /**
   * 수강정보 추가
   */
  async addCourseEnrollment(enrollmentData: Omit<CourseEnrollment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const enrollment: CourseEnrollment = {
        id: this.generateUUID(),
        ...enrollmentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.executeTransaction('courseEnrollments', 'readwrite', (store) => 
        store.add(enrollment)
      );

      console.log('수강정보 추가 성공:', enrollment.id);
      return enrollment.id;
    } catch (error) {
      console.error('수강정보 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 수강정보 조회
   */
  async getAllCourseEnrollments(): Promise<CourseEnrollment[]> {
    try {
      return await this.executeTransaction('courseEnrollments', 'readonly', (store) => 
        store.getAll()
      );
    } catch (error) {
      console.error('수강정보 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * ID로 수강정보 조회
   */
  async getCourseEnrollmentById(id: string): Promise<CourseEnrollment | null> {
    try {
      return await this.executeTransaction('courseEnrollments', 'readonly', (store) => 
        store.get(id)
      ) || null;
    } catch (error) {
      console.error('수강정보 조회 실패:', error);
      return null;
    }
  }

  /**
   * 회원별 수강정보 조회
   */
  async getCourseEnrollmentsByMember(memberId: string): Promise<CourseEnrollment[]> {
    try {
      return await this.executeTransaction('courseEnrollments', 'readonly', (store) => {
        const index = store.index('memberId');
        return index.getAll(memberId);
      });
    } catch (error) {
      console.error('회원별 수강정보 조회 실패:', error);
      return [];
    }
  }

  /**
   * 지점별 수강정보 조회
   */
  async getCourseEnrollmentsByBranch(branchId: string): Promise<CourseEnrollment[]> {
    try {
      return await this.executeTransaction('courseEnrollments', 'readonly', (store) => {
        const index = store.index('branchId');
        return index.getAll(branchId);
      });
    } catch (error) {
      console.error('지점별 수강정보 조회 실패:', error);
      return [];
    }
  }

  /**
   * 코치별 수강정보 조회
   */
  async getCourseEnrollmentsByCoach(coachId: string): Promise<CourseEnrollment[]> {
    try {
      return await this.executeTransaction('courseEnrollments', 'readonly', (store) => {
        const index = store.index('coach');
        return index.getAll(coachId);
      });
    } catch (error) {
      console.error('코치별 수강정보 조회 실패:', error);
      return [];
    }
  }

  /**
   * 수강상태별 수강정보 조회
   */
  async getCourseEnrollmentsByStatus(status: 'completed' | 'unpaid'): Promise<CourseEnrollment[]> {
    try {
      return await this.executeTransaction('courseEnrollments', 'readonly', (store) => {
        const index = store.index('enrollmentStatus');
        return index.getAll(status);
      });
    } catch (error) {
      console.error('상태별 수강정보 조회 실패:', error);
      return [];
    }
  }

  /**
   * 프로그램별 수강정보 조회
   */
  async getCourseEnrollmentsByProgram(programId: string): Promise<CourseEnrollment[]> {
    try {
      return await this.executeTransaction('courseEnrollments', 'readonly', (store) => {
        const index = store.index('programId');
        return index.getAll(programId);
      });
    } catch (error) {
      console.error('프로그램별 수강정보 조회 실패:', error);
      return [];
    }
  }

  /**
   * 미수 수강정보 조회 (회원별)
   */
  async getUnpaidCourseEnrollmentsByMember(memberId: string): Promise<CourseEnrollment[]> {
    try {
      return await this.executeTransaction('courseEnrollments', 'readonly', (store) => {
        const index = store.index('memberStatus');
        return index.getAll([memberId, 'unpaid']);
      });
    } catch (error) {
      console.error('회원별 미수 수강정보 조회 실패:', error);
      return [];
    }
  }

  /**
   * 수강정보 수정
   */
  async updateCourseEnrollment(id: string, updates: Partial<Omit<CourseEnrollment, 'id' | 'createdAt'>>): Promise<boolean> {
    try {
      const existingEnrollment = await this.getCourseEnrollmentById(id);
      if (!existingEnrollment) {
        throw new Error('수정할 수강정보를 찾을 수 없습니다.');
      }

      const updatedEnrollment: CourseEnrollment = {
        ...existingEnrollment,
        ...updates,
        updatedAt: new Date(),
      };

      await this.executeTransaction('courseEnrollments', 'readwrite', (store) => 
        store.put(updatedEnrollment)
      );

      console.log('수강정보 수정 성공:', id);
      return true;
    } catch (error) {
      console.error('수강정보 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 수강정보 삭제
   */
  async deleteCourseEnrollment(id: string): Promise<boolean> {
    try {
      await this.executeTransaction('courseEnrollments', 'readwrite', (store) => 
        store.delete(id)
      );

      console.log('수강정보 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('수강정보 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 수강정보 검색 (회원명, 상품명, 프로그램명으로 검색)
   */
  async searchCourseEnrollments(searchTerm: string): Promise<CourseEnrollment[]> {
    try {
      const allEnrollments = await this.getAllCourseEnrollments();
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      return allEnrollments.filter(enrollment => 
        enrollment.memberName.toLowerCase().includes(lowerSearchTerm) ||
        enrollment.productName.toLowerCase().includes(lowerSearchTerm) ||
        enrollment.programName.toLowerCase().includes(lowerSearchTerm) ||
        enrollment.branchName.toLowerCase().includes(lowerSearchTerm) ||
        enrollment.coachName.toLowerCase().includes(lowerSearchTerm)
      );
    } catch (error) {
      console.error('수강정보 검색 실패:', error);
      return [];
    }
  }

  /**
   * 회원의 미수 총액 계산
   */
  async getMemberUnpaidTotal(memberId: string): Promise<number> {
    try {
      const unpaidEnrollments = await this.getUnpaidCourseEnrollmentsByMember(memberId);
      return unpaidEnrollments.reduce((total, enrollment) => total + enrollment.unpaidAmount, 0);
    } catch (error) {
      console.error('회원 미수 총액 계산 실패:', error);
      return 0;
    }
  }

  /**
   * 수강정보 일괄 추가 (회원가입 시 사용)
   */
  async addMultipleCourseEnrollments(enrollmentsData: Omit<CourseEnrollment, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    try {
      const enrollmentIds: string[] = [];

      for (const enrollmentData of enrollmentsData) {
        const enrollmentId = await this.addCourseEnrollment(enrollmentData);
        enrollmentIds.push(enrollmentId);
      }

      console.log('수강정보 일괄 추가 성공:', enrollmentIds.length, '건');
      return enrollmentIds;
    } catch (error) {
      console.error('수강정보 일괄 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 전체 미수 메타정보 조회 (미수 회원 수와 총 미수 금액)
   */
  async getUnpaidMetaInfo(): Promise<UnpaidMetaInfo> {
    try {
      const unpaidEnrollments = await this.executeTransaction('courseEnrollments', 'readonly', (store) => {
        const index = store.index('enrollmentStatus');
        return index.getAll('unpaid');
      });
      
      // 미수 회원 ID 중복 제거
      const uniqueUnpaidMembers = new Set(unpaidEnrollments.map((e: CourseEnrollment) => e.memberId));
      const unpaidMemberCount = uniqueUnpaidMembers.size;
      
      // 총 미수 금액 계산
      const totalUnpaidAmount = unpaidEnrollments.reduce((total: number, enrollment: CourseEnrollment) => total + enrollment.unpaidAmount, 0);
      
      return {
        unpaidMemberCount,
        totalUnpaidAmount
      };
    } catch (error) {
      console.error('전체 미수 메타정보 조회 실패:', error);
      return {
        unpaidMemberCount: 0,
        totalUnpaidAmount: 0
      };
    }
  }

  /**
   * 활성 수강정보 조회 (active 상태만)
   */
  async getActiveCourseEnrollments(): Promise<CourseEnrollment[]> {
    try {
      return await this.executeTransaction('courseEnrollments', 'readonly', (store) => {
        const index = store.index('enrollmentStatus');
        return index.getAll('active');
      });
    } catch (error) {
      console.error('활성 수강정보 조회 실패:', error);
      return [];
    }
  }

  /**
   * 완료된 수강정보 조회 (completed 상태만)
   */
  async getCompletedCourseEnrollments(): Promise<CourseEnrollment[]> {
    try {
      return await this.executeTransaction('courseEnrollments', 'readonly', (store) => {
        const index = store.index('enrollmentStatus');
        return index.getAll('completed');
      });
    } catch (error) {
      console.error('완료된 수강정보 조회 실패:', error);
      return [];
    }
  }

  /**
   * 수강 세션 완료 처리 (횟수제 프로그램용)
   */
  async completeSession(enrollmentId: string): Promise<boolean> {
    try {
      const enrollment = await this.getCourseEnrollmentById(enrollmentId);
      if (!enrollment) {
        throw new Error('수강정보를 찾을 수 없습니다.');
      }

      if (enrollment.programType !== '횟수제') {
        throw new Error('횟수제 프로그램만 세션 완료 처리가 가능합니다.');
      }

      const completedSessions = (enrollment.completedSessions || 0) + 1;
      const sessionCount = enrollment.sessionCount || 0;

      // 모든 세션이 완료되었는지 확인
      const enrollmentStatus = completedSessions >= sessionCount ? 'completed' : enrollment.enrollmentStatus;

      return await this.updateCourseEnrollment(enrollmentId, {
        completedSessions,
        enrollmentStatus
      });
    } catch (error) {
      console.error('세션 완료 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 기간제 수강 만료 처리
   */
  async checkAndUpdateExpiredEnrollments(): Promise<number> {
    try {
      const now = new Date();
      const allEnrollments = await this.getAllCourseEnrollments();
      
      // 기간제 프로그램 중 종료일이 지났지만 아직 완료 처리되지 않은 것들
      const expiredEnrollments = allEnrollments.filter(enrollment =>
        enrollment.programType === '기간제' &&
        enrollment.endDate &&
        enrollment.endDate <= now &&
        enrollment.enrollmentStatus === 'active'
      );

      let updatedCount = 0;
      for (const enrollment of expiredEnrollments) {
        await this.updateCourseEnrollment(enrollment.id, {
          enrollmentStatus: 'completed'
        });
        updatedCount++;
      }

      if (updatedCount > 0) {
        console.log(`${updatedCount}건의 만료된 수강정보를 완료 처리했습니다.`);
      }

      return updatedCount;
    } catch (error) {
      console.error('만료된 수강정보 처리 실패:', error);
      return 0;
    }
  }

  /**
   * 지점별 프로그램별 수강현황 통계
   */
  async getCourseStatsByBranchAndProgram(branchId: string, programId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    suspended: number;
    cancelled: number;
    unpaid: number;
  }> {
    try {
      const enrollments = await this.executeTransaction('courseEnrollments', 'readonly', (store) => {
        const index = store.index('branchProgram');
        return index.getAll([branchId, programId]);
      });

      const stats = {
        total: enrollments.length,
        active: 0,
        completed: 0,
        suspended: 0,
        cancelled: 0,
        unpaid: 0
      };

      for (const enrollment of enrollments) {
        switch (enrollment.enrollmentStatus) {
          case 'active':
            stats.active++;
            break;
          case 'completed':
            stats.completed++;
            break;
          case 'suspended':
            stats.suspended++;
            break;
          case 'cancelled':
            stats.cancelled++;
            break;
          case 'unpaid':
            stats.unpaid++;
            break;
        }
      }

      return stats;
    } catch (error) {
      console.error('수강현황 통계 조회 실패:', error);
      return {
        total: 0,
        active: 0,
        completed: 0,
        suspended: 0,
        cancelled: 0,
        unpaid: 0
      };
    }
  }

  /**
   * appliedPrice 필드 마이그레이션
   * 기존 데이터에 appliedPrice 필드가 없는 경우 paidAmount 값으로 설정
   */
  async migrateAppliedPriceField(): Promise<void> {
    try {
      console.log('CourseEnrollment appliedPrice 필드 마이그레이션 시작...');
      
      const enrollments = await this.getAllCourseEnrollments();
      let migratedCount = 0;
      
      for (const enrollment of enrollments) {
        if (enrollment.appliedPrice === undefined) {
          // appliedPrice가 없는 경우 paidAmount + unpaidAmount로 설정
          const appliedPrice = enrollment.paidAmount + (enrollment.unpaidAmount || 0);
          
          const updatedEnrollment = {
            ...enrollment,
            appliedPrice: appliedPrice,
            updatedAt: new Date()
          };
          
          await this.executeTransaction('courseEnrollments', 'readwrite', (store) =>
            store.put(updatedEnrollment)
          );
          
          migratedCount++;
        }
      }
      
      console.log(`CourseEnrollment appliedPrice 필드 마이그레이션 완료: ${migratedCount}건 업데이트`);
    } catch (error) {
      console.error('CourseEnrollment appliedPrice 필드 마이그레이션 실패:', error);
    }
  }
}