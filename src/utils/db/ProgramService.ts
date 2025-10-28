/**
 * 프로그램 및 상품 관리 서비스
 */

import { BaseDBManager } from './BaseDBManager';
import { Program, Product } from './types';

export class ProgramService extends BaseDBManager {

  // =================== 프로그램 관리 메서드 ===================

  /**
   * 프로그램 추가
   */
  async addProgram(programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Promise<Program> {
    try {
      // 프로그램명 중복 체크
      const existingProgram = await this.getProgramByName(programData.name);
      if (existingProgram) {
        throw new Error('이미 존재하는 프로그램명입니다.');
      }

      const newProgram: Program = {
        id: this.generateUUID(),
        ...programData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.executeTransaction('programs', 'readwrite', (store) => 
        store.add(newProgram)
      );

      console.log('프로그램 추가 성공:', newProgram);
      return newProgram;
    } catch (error) {
      console.error('프로그램 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 프로그램 조회
   */
  async getAllPrograms(): Promise<Program[]> {
    try {
      const programs = await this.executeTransaction('programs', 'readonly', (store) => 
        store.getAll()
      );
      
      return programs.map(program => ({
        ...program,
        createdAt: new Date(program.createdAt),
        updatedAt: new Date(program.updatedAt)
      }));
    } catch (error) {
      console.error('프로그램 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 프로그램명으로 조회
   */
  async getProgramByName(name: string): Promise<Program | null> {
    try {
      const program = await this.executeTransaction('programs', 'readonly', (store) => 
        store.index('name').get(name)
      );
      
      if (program) {
        return {
          ...program,
          createdAt: new Date(program.createdAt),
          updatedAt: new Date(program.updatedAt)
        };
      }
      
      return null;
    } catch (error) {
      console.error('프로그램 조회 실패:', error);
      return null;
    }
  }

  /**
   * 프로그램 수정
   */
  async updateProgram(id: string, updates: Partial<Omit<Program, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Program | null> {
    try {
      const existingProgram = await this.executeTransaction('programs', 'readonly', (store) => 
        store.get(id)
      );

      if (!existingProgram) {
        console.error('수정할 프로그램을 찾을 수 없습니다:', id);
        return null;
      }

      // 프로그램명 변경 시 중복 체크
      if (updates.name && updates.name !== existingProgram.name) {
        const duplicateProgram = await this.getProgramByName(updates.name);
        if (duplicateProgram) {
          throw new Error('이미 존재하는 프로그램명입니다.');
        }
      }

      const updatedProgram: Program = {
        ...existingProgram,
        ...updates,
        id,
        createdAt: new Date(existingProgram.createdAt),
        updatedAt: new Date()
      };

      await this.executeTransaction('programs', 'readwrite', (store) => 
        store.put(updatedProgram)
      );

      console.log('프로그램 수정 성공:', updatedProgram);
      return updatedProgram;
    } catch (error) {
      console.error('프로그램 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 프로그램 삭제
   */
  async deleteProgram(id: string): Promise<boolean> {
    try {
      await this.executeTransaction('programs', 'readwrite', (store) => 
        store.delete(id)
      );

      console.log('프로그램 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('프로그램 삭제 실패:', error);
      throw error;
    }
  }
}

export class ProductService extends BaseDBManager {

  // =================== 상품 관리 메서드 ===================

  /**
   * 상품 추가
   */
  async addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      const newProduct: Product = {
        id: this.generateUUID(),
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.executeTransaction('products', 'readwrite', (store) => 
        store.add(newProduct)
      );

      console.log('상품 추가 성공:', newProduct);
      return newProduct;
    } catch (error) {
      console.error('상품 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 상품 조회
   */
  async getAllProducts(): Promise<Product[]> {
    try {
      const products = await this.executeTransaction('products', 'readonly', (store) => 
        store.getAll()
      );
      
      return products.map(product => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt)
      }));
    } catch (error) {
      console.error('상품 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * ID로 상품 조회
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const product = await this.executeTransaction('products', 'readonly', (store) => 
        store.get(id)
      );
      
      if (product) {
        return {
          ...product,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt)
        };
      }
      
      return null;
    } catch (error) {
      console.error('상품 조회 실패:', error);
      return null;
    }
  }

  /**
   * 지점별 상품 조회
   */
  async getProductsByBranch(branchId: string): Promise<Product[]> {
    try {
      const products = await this.executeTransaction('products', 'readonly', (store) => {
        const index = store.index('branchId');
        return index.getAll(IDBKeyRange.only(branchId));
      });
      
      return products.map(product => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt)
      }));
    } catch (error) {
      console.error('지점별 상품 조회 실패:', error);
      return [];
    }
  }

  /**
   * 프로그램별 상품 조회
   */
  async getProductsByProgram(programId: string): Promise<Product[]> {
    try {
      const products = await this.executeTransaction('products', 'readonly', (store) => {
        const index = store.index('programId');
        return index.getAll(IDBKeyRange.only(programId));
      });
      
      return products.map(product => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt)
      }));
    } catch (error) {
      console.error('프로그램별 상품 조회 실패:', error);
      return [];
    }
  }

  /**
   * 지점과 프로그램으로 상품 조회
   */
  async getProductsByBranchAndProgram(branchId: string, programId: string): Promise<Product[]> {
    try {
      const products = await this.executeTransaction('products', 'readonly', (store) => {
        const index = store.index('branchProgram');
        return index.getAll(IDBKeyRange.only([branchId, programId]));
      });
      
      return products.map(product => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt)
      }));
    } catch (error) {
      console.error('지점-프로그램별 상품 조회 실패:', error);
      return [];
    }
  }

  /**
   * 상품 수정
   */
  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> {
    try {
      const existingProduct = await this.executeTransaction('products', 'readonly', (store) => 
        store.get(id)
      );

      if (!existingProduct) {
        console.error('수정할 상품을 찾을 수 없습니다:', id);
        return null;
      }

      const updatedProduct: Product = {
        ...existingProduct,
        ...updates,
        id,
        createdAt: new Date(existingProduct.createdAt),
        updatedAt: new Date()
      };

      await this.executeTransaction('products', 'readwrite', (store) => 
        store.put(updatedProduct)
      );

      console.log('상품 수정 성공:', updatedProduct);
      return updatedProduct;
    } catch (error) {
      console.error('상품 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 상품 삭제
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.executeTransaction('products', 'readwrite', (store) => 
        store.delete(id)
      );

      console.log('상품 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('상품 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 활성 상품만 조회
   */
  async getActiveProducts(): Promise<Product[]> {
    try {
      const products = await this.executeTransaction('products', 'readonly', (store) => {
        const index = store.index('isActive');
        return index.getAll(IDBKeyRange.only(true));
      });
      
      return products.map(product => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt)
      }));
    } catch (error) {
      console.error('활성 상품 조회 실패:', error);
      return [];
    }
  }

  /**
   * 상품명으로 검색
   */
  async searchProductsByName(name: string): Promise<Product[]> {
    try {
      const allProducts = await this.getAllProducts();
      return allProducts.filter(product => 
        product.name.toLowerCase().includes(name.toLowerCase())
      );
    } catch (error) {
      console.error('상품 검색 실패:', error);
      return [];
    }
  }
}

// 휴일설정 서비스 클래스
export class HolidayService extends BaseDBManager {

  /**
   * 휴일설정 추가/업데이트
   */
  async saveHolidaySettings(settingsArray: Omit<import('./types').HolidaySettings, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<import('./types').HolidaySettings[]> {
    try {
      const savedSettings: import('./types').HolidaySettings[] = [];
      
      for (const setting of settingsArray) {
        // 기존 설정이 있는지 확인
        const existingSettings = await this.getHolidaySettingsByStaffAndDate(setting.staffId, setting.date);
        
        let savedSetting: import('./types').HolidaySettings;
        
        if (existingSettings.length > 0) {
          // 업데이트
          const existing = existingSettings[0];
          savedSetting = {
            ...existing,
            ...setting,
            updatedAt: new Date()
          };
          
          await this.executeTransaction('holidaySettings', 'readwrite', (store) => 
            store.put(savedSetting)
          );
        } else {
          // 새로 추가
          savedSetting = {
            ...setting,
            id: this.generateUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await this.executeTransaction('holidaySettings', 'readwrite', (store) => 
            store.add(savedSetting)
          );
        }
        
        savedSettings.push(savedSetting);
      }

      console.log('휴일설정 저장 성공:', savedSettings.length);
      return savedSettings;
    } catch (error) {
      console.error('휴일설정 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 직원의 모든 휴일설정 조회
   */
  async getHolidaySettingsByStaff(staffId: string): Promise<import('./types').HolidaySettings[]> {
    try {
      const settings = await this.executeTransaction('holidaySettings', 'readonly', (store) => {
        const index = store.index('staffId');
        return index.getAll(IDBKeyRange.only(staffId));
      });
      
      return settings.map(setting => ({
        ...setting,
        createdAt: new Date(setting.createdAt),
        updatedAt: new Date(setting.updatedAt)
      }));
    } catch (error) {
      console.error('직원별 휴일설정 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 직원의 특정 날짜 휴일설정 조회
   */
  async getHolidaySettingsByStaffAndDate(staffId: string, date: string): Promise<import('./types').HolidaySettings[]> {
    try {
      const settings = await this.executeTransaction('holidaySettings', 'readonly', (store) => {
        const index = store.index('staffDate');
        return index.getAll(IDBKeyRange.only([staffId, date]));
      });
      
      return settings.map(setting => ({
        ...setting,
        createdAt: new Date(setting.createdAt),
        updatedAt: new Date(setting.updatedAt)
      }));
    } catch (error) {
      console.error('직원별 날짜별 휴일설정 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 날짜의 모든 휴일설정 조회
   */
  async getHolidaySettingsByDate(date: string): Promise<import('./types').HolidaySettings[]> {
    try {
      const settings = await this.executeTransaction('holidaySettings', 'readonly', (store) => {
        const index = store.index('date');
        return index.getAll(IDBKeyRange.only(date));
      });
      
      return settings.map(setting => ({
        ...setting,
        createdAt: new Date(setting.createdAt),
        updatedAt: new Date(setting.updatedAt)
      }));
    } catch (error) {
      console.error('날짜별 휴일설정 조회 실패:', error);
      return [];
    }
  }

  /**
   * 날짜 범위의 휴일설정 조회
   */
  async getHolidaySettingsByDateRange(startDate: string, endDate: string): Promise<import('./types').HolidaySettings[]> {
    try {
      const settings = await this.executeTransaction('holidaySettings', 'readonly', (store) => {
        const index = store.index('date');
        return index.getAll(IDBKeyRange.bound(startDate, endDate));
      });
      
      return settings.map(setting => ({
        ...setting,
        createdAt: new Date(setting.createdAt),
        updatedAt: new Date(setting.updatedAt)
      }));
    } catch (error) {
      console.error('날짜 범위별 휴일설정 조회 실패:', error);
      return [];
    }
  }

  /**
   * 휴일설정 삭제
   */
  async deleteHolidaySettings(id: string): Promise<boolean> {
    try {
      await this.executeTransaction('holidaySettings', 'readwrite', (store) => 
        store.delete(id)
      );

      console.log('휴일설정 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('휴일설정 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 직원의 모든 휴일설정 삭제
   */
  async deleteHolidaySettingsByStaff(staffId: string): Promise<boolean> {
    try {
      const settings = await this.getHolidaySettingsByStaff(staffId);
      
      for (const setting of settings) {
        await this.deleteHolidaySettings(setting.id);
      }

      console.log('직원 휴일설정 전체 삭제 성공:', staffId);
      return true;
    } catch (error) {
      console.error('직원 휴일설정 전체 삭제 실패:', error);
      throw error;
    }
  }
}

// 주별 휴일설정 서비스 클래스
export class WeeklyHolidayService extends BaseDBManager {

  /**
   * 주별 휴일설정 추가/업데이트
   */
  async saveWeeklyHolidaySettings(settingsArray: Omit<import('./types').WeeklyHolidaySettings, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<import('./types').WeeklyHolidaySettings[]> {
    try {
      const savedSettings: import('./types').WeeklyHolidaySettings[] = [];
      
      for (const setting of settingsArray) {
        // 기존 설정이 있는지 확인
        const existingSettings = await this.getWeeklyHolidaySettingsByStaffAndWeek(setting.staffId, setting.weekStartDate);
        
        let savedSetting: import('./types').WeeklyHolidaySettings;
        
        if (existingSettings.length > 0) {
          // 업데이트
          const existing = existingSettings[0];
          savedSetting = {
            ...existing,
            ...setting,
            updatedAt: new Date()
          };
          
          await this.executeTransaction('weeklyHolidaySettings', 'readwrite', (store) => 
            store.put(savedSetting)
          );
        } else {
          // 새로 추가
          savedSetting = {
            ...setting,
            id: this.generateUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await this.executeTransaction('weeklyHolidaySettings', 'readwrite', (store) => 
            store.add(savedSetting)
          );
        }
        
        savedSettings.push(savedSetting);
      }

      console.log('주별 휴일설정 저장 성공:', savedSettings.length);
      return savedSettings;
    } catch (error) {
      console.error('주별 휴일설정 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 직원의 모든 주별 휴일설정 조회
   */
  async getWeeklyHolidaySettingsByStaff(staffId: string): Promise<import('./types').WeeklyHolidaySettings[]> {
    try {
      const settings = await this.executeTransaction('weeklyHolidaySettings', 'readonly', (store) => {
        const index = store.index('staffId');
        return index.getAll(IDBKeyRange.only(staffId));
      });
      
      return settings.map(setting => ({
        ...setting,
        createdAt: new Date(setting.createdAt),
        updatedAt: new Date(setting.updatedAt)
      }));
    } catch (error) {
      console.error('직원별 주별 휴일설정 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 직원의 특정 주 휴일설정 조회
   */
  async getWeeklyHolidaySettingsByStaffAndWeek(staffId: string, weekStartDate: string): Promise<import('./types').WeeklyHolidaySettings[]> {
    try {
      const settings = await this.executeTransaction('weeklyHolidaySettings', 'readonly', (store) => {
        const index = store.index('staffWeek');
        return index.getAll(IDBKeyRange.only([staffId, weekStartDate]));
      });
      
      return settings.map(setting => ({
        ...setting,
        createdAt: new Date(setting.createdAt),
        updatedAt: new Date(setting.updatedAt)
      }));
    } catch (error) {
      console.error('직원별 주별 휴일설정 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 주의 모든 휴일설정 조회
   */
  async getWeeklyHolidaySettingsByWeek(weekStartDate: string): Promise<import('./types').WeeklyHolidaySettings[]> {
    try {
      const settings = await this.executeTransaction('weeklyHolidaySettings', 'readonly', (store) => {
        const index = store.index('weekStartDate');
        return index.getAll(IDBKeyRange.only(weekStartDate));
      });
      
      return settings.map(setting => ({
        ...setting,
        createdAt: new Date(setting.createdAt),
        updatedAt: new Date(setting.updatedAt)
      }));
    } catch (error) {
      console.error('주별 휴일설정 조회 실패:', error);
      return [];
    }
  }

  /**
   * 주별 휴일설정 삭제
   */
  async deleteWeeklyHolidaySettings(id: string): Promise<boolean> {
    try {
      await this.executeTransaction('weeklyHolidaySettings', 'readwrite', (store) => 
        store.delete(id)
      );

      console.log('주별 휴일설정 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('주별 휴일설정 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 직원의 모든 주별 휴일설정 삭제
   */
  async deleteWeeklyHolidaySettingsByStaff(staffId: string): Promise<boolean> {
    try {
      const settings = await this.getWeeklyHolidaySettingsByStaff(staffId);
      
      for (const setting of settings) {
        await this.deleteWeeklyHolidaySettings(setting.id);
      }

      console.log('직원 주별 휴일설정 전체 삭제 성공:', staffId);
      return true;
    } catch (error) {
      console.error('직원 주별 휴일설정 전체 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 주어진 날짜가 휴일인지 확인하는 헬퍼 메소드
   */
  async isHolidayByDate(staffId: string, date: string): Promise<boolean> {
    try {
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dateObj.getDay(); // 0: 일요일, 1: 월요일, ...
      
      // 해당 주의 월요일 찾기
      const monday = new Date(dateObj);
      monday.setDate(dateObj.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const weekStartDate = monday.toISOString().split('T')[0];
      
      const settings = await this.getWeeklyHolidaySettingsByStaffAndWeek(staffId, weekStartDate);
      
      if (settings.length === 0) {
        // 설정이 없으면 주말을 기본 휴일로 간주
        return dayOfWeek === 0 || dayOfWeek === 6;
      }
      
      const setting = settings[0];
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
      const dayName = dayNames[dayOfWeek];
      
      return setting.weekDays[dayName].isHoliday;
    } catch (error) {
      console.error('휴일 여부 확인 실패:', error);
      return false;
    }
  }

  /**
   * 다음주 월요일 날짜 계산 헬퍼 메소드
   */
  getNextMondayDate(): string {
    const today = new Date();
    const nextMonday = new Date(today);
    const dayOfWeek = today.getDay();
    
    // 다음주 월요일까지의 일수 계산
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);
    
    return nextMonday.toISOString().split('T')[0];
  }

  /**
   * 현재 주 월요일 날짜 계산 헬퍼 메소드
   */
  getCurrentMondayDate(): string {
    const today = new Date();
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    
    // 이번주 월요일까지의 일수 계산
    const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    monday.setDate(today.getDate() + daysToMonday);
    
    return monday.toISOString().split('T')[0];
  }
}

// 스케줄 이벤트 서비스 클래스
export class ScheduleEventService extends BaseDBManager {

  /**
   * 스케줄 이벤트 추가/업데이트
   */
  async saveScheduleEvents(events: Omit<import('./types').ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<import('./types').ScheduleEvent[]> {
    try {
      await this.initDB();
      if (!this.db) throw new Error('데이터베이스 연결 실패');

      const transaction = this.db.transaction(['scheduleEvents'], 'readwrite');
      const store = transaction.objectStore('scheduleEvents');
      const savedEvents: import('./types').ScheduleEvent[] = [];

      for (const eventData of events) {
        const now = new Date();
        const event: import('./types').ScheduleEvent = {
          ...eventData,
          id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now
        };

        await store.add(event);
        savedEvents.push(event);
      }

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log('스케줄 이벤트 저장 성공:', savedEvents.length);
          resolve(savedEvents);
        };
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('스케줄 이벤트 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 출처의 스케줄 이벤트 삭제
   */
  async deleteScheduleEventsBySource(sourceType: string, sourceId?: string): Promise<void> {
    try {
      await this.initDB();
      if (!this.db) throw new Error('데이터베이스 연결 실패');

      const transaction = this.db.transaction(['scheduleEvents'], 'readwrite');
      const store = transaction.objectStore('scheduleEvents');
      
      // sourceType으로 인덱스 검색
      const index = store.index('sourceType');
      const request = index.openCursor(IDBKeyRange.only(sourceType));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const scheduleEvent = cursor.value as import('./types').ScheduleEvent;
          
          // sourceId가 지정된 경우 추가 필터링
          if (!sourceId || scheduleEvent.sourceId === sourceId) {
            cursor.delete();
          }
          
          cursor.continue();
        }
      };

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`스케줄 이벤트 삭제 완료: sourceType=${sourceType}, sourceId=${sourceId}`);
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('스케줄 이벤트 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 직원의 스케줄 이벤트 조회
   */
  async getScheduleEventsByStaff(staffId: string, startDate?: Date, endDate?: Date): Promise<import('./types').ScheduleEvent[]> {
    try {
      await this.initDB();
      if (!this.db) throw new Error('데이터베이스 연결 실패');

      const transaction = this.db.transaction(['scheduleEvents'], 'readonly');
      const store = transaction.objectStore('scheduleEvents');
      const index = store.index('staffId');
      
      const events: import('./types').ScheduleEvent[] = [];
      const request = index.openCursor(IDBKeyRange.only(staffId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const scheduleEvent = cursor.value as import('./types').ScheduleEvent;
          
          // 날짜 범위 필터링
          if (startDate && endDate) {
            const eventStart = new Date(scheduleEvent.startTime);
            if (eventStart >= startDate && eventStart <= endDate) {
              events.push(scheduleEvent);
            }
          } else {
            events.push(scheduleEvent);
          }
          
          cursor.continue();
        }
      };

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(events);
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('스케줄 이벤트 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 스케줄 이벤트 조회
   */
  async getAllScheduleEvents(startDate?: Date, endDate?: Date): Promise<import('./types').ScheduleEvent[]> {
    try {
      await this.initDB();
      if (!this.db) throw new Error('데이터베이스 연결 실패');

      const transaction = this.db.transaction(['scheduleEvents'], 'readonly');
      const store = transaction.objectStore('scheduleEvents');
      
      const events: import('./types').ScheduleEvent[] = [];
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const scheduleEvent = cursor.value as import('./types').ScheduleEvent;
          
          // 날짜 범위 필터링
          if (startDate && endDate) {
            const eventStart = new Date(scheduleEvent.startTime);
            if (eventStart >= startDate && eventStart <= endDate) {
              events.push(scheduleEvent);
            }
          } else {
            events.push(scheduleEvent);
          }
          
          cursor.continue();
        }
      };

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(events);
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('스케줄 이벤트 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 이벤트 삭제
   */
  async deleteScheduleEvent(eventId: string): Promise<void> {
    try {
      await this.initDB();
      if (!this.db) throw new Error('데이터베이스 연결 실패');

      const transaction = this.db.transaction(['scheduleEvents'], 'readwrite');
      const store = transaction.objectStore('scheduleEvents');
      
      await store.delete(eventId);
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log('스케줄 이벤트 삭제 완료:', eventId);
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('스케줄 이벤트 삭제 실패:', error);
      throw error;
    }
  }
}