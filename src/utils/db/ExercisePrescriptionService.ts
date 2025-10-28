/**
 * 운동처방서 서비스
 * 운동처방서 관련 모든 데이터베이스 작업을 처리
 */

import { BaseDBManager } from './BaseDBManager';
import { ExercisePrescription, BodyImagePoint } from './types';

export class ExercisePrescriptionService extends BaseDBManager {
  private readonly STORE_NAME = 'exercisePrescriptions';

  /**
   * 운동처방서 저장
   */
  async saveExercisePrescription(
    prescriptionData: Omit<ExercisePrescription, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      await this.initDB();
      
      // 서명 검증
      if (!prescriptionData.signatureData || prescriptionData.signatureData.trim() === '') {
        throw new Error('서명이 필요합니다. 서명을 완료해주세요.');
      }
      
      const prescription: ExercisePrescription = {
        ...prescriptionData,
        id: this.generateUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        // 최초 저장 시에만 서명 날짜 설정
        signedAt: prescriptionData.signedAt || new Date(),
      };

      await this.executeTransaction(this.STORE_NAME, 'readwrite', (store) => {
        return store.put(prescription);
      });
      
      console.log(`운동처방서 저장 완료: ${prescription.id}`);
      return prescription.id;
    } catch (error) {
      console.error('운동처방서 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 운동처방서 업데이트
   */
  async updateExercisePrescription(
    id: string, 
    updates: Partial<Omit<ExercisePrescription, 'id' | 'createdAt' | 'updatedAt' | 'signedAt'>>
  ): Promise<boolean> {
    try {
      await this.initDB();
      
      const existing = await this.getExercisePrescriptionById(id);
      if (!existing) {
        throw new Error('운동처방서를 찾을 수 없습니다.');
      }

      const updated: ExercisePrescription = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
        // 서명 날짜는 최초 서명 시에만 설정되고 이후 업데이트에서는 변경하지 않음
        signedAt: existing.signedAt,
      };

      await this.executeTransaction(this.STORE_NAME, 'readwrite', (store) => {
        return store.put(updated);
      });
      
      console.log(`운동처방서 업데이트 완료: ${id}`);
      return true;
    } catch (error) {
      console.error('운동처방서 업데이트 실패:', error);
      throw new Error('운동처방서 업데이트에 실패했습니다.');
    }
  }

  /**
   * 회원별 운동처방서 조회
   */
  async getExercisePrescriptionByMember(memberId: string): Promise<ExercisePrescription | null> {
    try {
      await this.initDB();
      
      const allPrescriptions = await this.executeTransaction(this.STORE_NAME, 'readonly', (store) => {
        const index = store.index('memberId');
        return index.getAll(memberId);
      }) as ExercisePrescription[];
      
      // 가장 최근 운동처방서 반환
      if (allPrescriptions.length > 0) {
        return allPrescriptions.sort((a: ExercisePrescription, b: ExercisePrescription) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];
      }
      
      return null;
    } catch (error) {
      console.error('운동처방서 조회 실패:', error);
      return null;
    }
  }

  /**
   * 운동처방서 ID로 조회
   */
  async getExercisePrescriptionById(id: string): Promise<ExercisePrescription | null> {
    try {
      await this.initDB();
      
      const prescription = await this.executeTransaction(this.STORE_NAME, 'readonly', (store) => {
        return store.get(id);
      }) as ExercisePrescription;
      
      return prescription || null;
    } catch (error) {
      console.error('운동처방서 조회 실패:', error);
      return null;
    }
  }

  /**
   * 모든 운동처방서 조회
   */
  async getAllExercisePrescriptions(): Promise<ExercisePrescription[]> {
    try {
      await this.initDB();
      
      const prescriptions = await this.executeTransaction(this.STORE_NAME, 'readonly', (store) => {
        return store.getAll();
      }) as ExercisePrescription[];
      
      // 업데이트 시간순 정렬 (최신순)
      return prescriptions.sort((a: ExercisePrescription, b: ExercisePrescription) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('모든 운동처방서 조회 실패:', error);
      return [];
    }
  }

  /**
   * 회원별 운동처방서 히스토리 조회
   */
  async getExercisePrescriptionHistory(memberId: string): Promise<ExercisePrescription[]> {
    try {
      await this.initDB();
      
      const prescriptions = await this.executeTransaction(this.STORE_NAME, 'readonly', (store) => {
        const index = store.index('memberId');
        return index.getAll(memberId);
      }) as ExercisePrescription[];
      
      // 업데이트 시간순 정렬 (최신순)
      return prescriptions.sort((a: ExercisePrescription, b: ExercisePrescription) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('운동처방서 히스토리 조회 실패:', error);
      return [];
    }
  }

  /**
   * 운동처방서 삭제
   */
  async deleteExercisePrescription(id: string): Promise<boolean> {
    try {
      await this.initDB();
      
      await this.executeTransaction(this.STORE_NAME, 'readwrite', (store) => {
        return store.delete(id);
      });
      
      console.log(`운동처방서 삭제 완료: ${id}`);
      return true;
    } catch (error) {
      console.error('운동처방서 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 신체 이미지 포인트 추가
   */
  async addBodyImagePoint(
    prescriptionId: string, 
    imageType: 'front' | 'spine' | 'back', 
    point: Omit<BodyImagePoint, 'id'>
  ): Promise<boolean> {
    try {
      const prescription = await this.getExercisePrescriptionById(prescriptionId);
      if (!prescription) {
        throw new Error('운동처방서를 찾을 수 없습니다.');
      }

      const newPoint: BodyImagePoint = {
        ...point,
        id: this.generateUUID(),
      };

      const updatedBodyImages = {
        ...prescription.bodyImages,
        [imageType]: [...prescription.bodyImages[imageType], newPoint],
      };

      return await this.updateExercisePrescription(prescriptionId, {
        bodyImages: updatedBodyImages,
      });
    } catch (error) {
      console.error('신체 이미지 포인트 추가 실패:', error);
      return false;
    }
  }

  /**
   * 신체 이미지 포인트 업데이트
   */
  async updateBodyImagePoint(
    prescriptionId: string, 
    imageType: 'front' | 'spine' | 'back', 
    pointId: string, 
    updates: Partial<Omit<BodyImagePoint, 'id'>>
  ): Promise<boolean> {
    try {
      const prescription = await this.getExercisePrescriptionById(prescriptionId);
      if (!prescription) {
        throw new Error('운동처방서를 찾을 수 없습니다.');
      }

      const points = prescription.bodyImages[imageType];
      const pointIndex = points.findIndex(p => p.id === pointId);
      
      if (pointIndex === -1) {
        throw new Error('포인트를 찾을 수 없습니다.');
      }

      const updatedPoints = [...points];
      updatedPoints[pointIndex] = { ...updatedPoints[pointIndex], ...updates };

      const updatedBodyImages = {
        ...prescription.bodyImages,
        [imageType]: updatedPoints,
      };

      return await this.updateExercisePrescription(prescriptionId, {
        bodyImages: updatedBodyImages,
      });
    } catch (error) {
      console.error('신체 이미지 포인트 업데이트 실패:', error);
      return false;
    }
  }

  /**
   * 신체 이미지 포인트 삭제
   */
  async deleteBodyImagePoint(
    prescriptionId: string, 
    imageType: 'front' | 'spine' | 'back', 
    pointId: string
  ): Promise<boolean> {
    try {
      const prescription = await this.getExercisePrescriptionById(prescriptionId);
      if (!prescription) {
        throw new Error('운동처방서를 찾을 수 없습니다.');
      }

      const points = prescription.bodyImages[imageType];
      const filteredPoints = points.filter(p => p.id !== pointId);

      const updatedBodyImages = {
        ...prescription.bodyImages,
        [imageType]: filteredPoints,
      };

      return await this.updateExercisePrescription(prescriptionId, {
        bodyImages: updatedBodyImages,
      });
    } catch (error) {
      console.error('신체 이미지 포인트 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 기본 운동처방서 템플릿 생성
   */
  createEmptyPrescription(memberId: string, memberName: string): Omit<ExercisePrescription, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      memberId,
      memberName,
      height: '',
      weight: '',
      footSize: '',
      medications: '',
      medicalHistory: {
        musculoskeletal: false,
        cardiovascular: false,
        diabetes: false,
        osteoporosis: false,
        thyroid: false,
        varicose: false,
        arthritis: false,
      },
      painHistory: '',
      bodyImages: {
        front: [],
        spine: [],
        back: [],
      },
      signatureData: '', // 서명 데이터 초기값
      signedAt: null, // 서명 날짜 초기값
      isActive: true,
      prescriptionDate: new Date(),
    };
  }

  /**
   * 운동처방서 검색
   */
  async searchExercisePrescriptions(searchTerm: string): Promise<ExercisePrescription[]> {
    try {
      const allPrescriptions = await this.getAllExercisePrescriptions();
      
      if (!searchTerm.trim()) {
        return allPrescriptions;
      }

      const term = searchTerm.toLowerCase();
      return allPrescriptions.filter(prescription => 
        prescription.memberName.toLowerCase().includes(term) ||
        prescription.medications.toLowerCase().includes(term) ||
        prescription.painHistory.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('운동처방서 검색 실패:', error);
      return [];
    }
  }
}