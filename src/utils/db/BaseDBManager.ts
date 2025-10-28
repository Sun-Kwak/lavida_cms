/**
 * IndexedDB 기본 매니저 클래스
 * - 데이터베이스 초기화 및 연결 관리
 * - 트랜잭션 처리
 * - 스키마 정의 및 업그레이드
 */

export abstract class BaseDBManager {
  protected dbName: string = 'LavidaDB';
  protected version: number = 16; // 운동처방서 테이블 추가로 버전 업데이트
  protected db: IDBDatabase | null = null;
  protected isInitializing: boolean = false;

  constructor() {
    this.initDB();
  }

  /**
   * IndexedDB 초기화
   */
  protected async initDB(): Promise<void> {
    // 이미 초기화되었으면 바로 반환
    if (this.db) {
      console.log('IndexedDB가 이미 연결되어 있습니다.');
      return Promise.resolve();
    }

    // 이미 초기화 중이면 대기
    if (this.isInitializing) {
      console.log('IndexedDB 초기화가 이미 진행 중입니다. 대기 중...');
      // 최대 5초까지 대기
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.db) {
          return;
        }
      }
      throw new Error('IndexedDB 초기화 대기 시간 초과');
    }

    console.log('IndexedDB 초기화를 시작합니다...');
    this.isInitializing = true;
    
    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
          console.error('❌ IndexedDB 열기 실패:', request.error);
          this.isInitializing = false;
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          console.log('✅ IndexedDB 연결 성공');
          
          // DB 연결 오류 핸들러 설정
          this.db.onerror = (event) => {
            console.error('IndexedDB 오류:', event);
          };
          
          this.isInitializing = false;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          console.log('🔄 IndexedDB 스키마 업데이트 중...');
          const db = (event.target as IDBOpenDBRequest).result;
          this.createSchema(db, event);
        };
      });
    } catch (error) {
      console.error('❌ IndexedDB 초기화 중 오류:', error);
      this.isInitializing = false;
      throw error;
    }
  }

  /**
   * 데이터베이스 스키마 생성
   */
  protected createSchema(db: IDBDatabase, event: IDBVersionChangeEvent): void {
    // 지점 테이블 생성
    if (!db.objectStoreNames.contains('branches')) {
      const branchStore = db.createObjectStore('branches', { keyPath: 'id' });
      branchStore.createIndex('name', 'name', { unique: true });
      branchStore.createIndex('isActive', 'isActive', { unique: false });
      branchStore.createIndex('createdAt', 'createdAt', { unique: false });
    } else {
      const transaction = (event.target as IDBOpenDBRequest).transaction!;
      const branchStore = transaction.objectStore('branches');
      
      if (branchStore.indexNames.contains('name')) {
        branchStore.deleteIndex('name');
      }
      branchStore.createIndex('name', 'name', { unique: true });
    }

    // 직원 테이블 생성
    if (!db.objectStoreNames.contains('staff')) {
      const staffStore = db.createObjectStore('staff', { keyPath: 'id' });
      staffStore.createIndex('name', 'name', { unique: false });
      staffStore.createIndex('loginId', 'loginId', { unique: true });
      staffStore.createIndex('email', 'email', { unique: true });
      staffStore.createIndex('branchId', 'branchId', { unique: false });
      staffStore.createIndex('position', 'position', { unique: false });
      staffStore.createIndex('role', 'role', { unique: false });
      staffStore.createIndex('employmentType', 'employmentType', { unique: false });
      staffStore.createIndex('permission', 'permission', { unique: false });
      staffStore.createIndex('isActive', 'isActive', { unique: false });
      staffStore.createIndex('createdAt', 'createdAt', { unique: false });
    } else {
      const transaction = (event.target as IDBOpenDBRequest).transaction!;
      const staffStore = transaction.objectStore('staff');
      
      if (!staffStore.indexNames.contains('isActive')) {
        staffStore.createIndex('isActive', 'isActive', { unique: false });
      }
    }

    // 프로그램 테이블 생성
    if (!db.objectStoreNames.contains('programs')) {
      const programStore = db.createObjectStore('programs', { keyPath: 'id' });
      programStore.createIndex('name', 'name', { unique: true });
      programStore.createIndex('type', 'type', { unique: false });
      programStore.createIndex('isActive', 'isActive', { unique: false });
      programStore.createIndex('createdAt', 'createdAt', { unique: false });
    } else {
      const transaction = (event.target as IDBOpenDBRequest).transaction!;
      const programStore = transaction.objectStore('programs');
      
      if (programStore.indexNames.contains('name')) {
        programStore.deleteIndex('name');
      }
      programStore.createIndex('name', 'name', { unique: true });
    }

    // 상품 테이블 생성
    if (!db.objectStoreNames.contains('products')) {
      const productStore = db.createObjectStore('products', { keyPath: 'id' });
      productStore.createIndex('name', 'name', { unique: false });
      productStore.createIndex('branchId', 'branchId', { unique: false });
      productStore.createIndex('programId', 'programId', { unique: false });
      productStore.createIndex('programType', 'programType', { unique: false });
      productStore.createIndex('isActive', 'isActive', { unique: false });
      productStore.createIndex('createdAt', 'createdAt', { unique: false });
      productStore.createIndex('branchProgram', ['branchId', 'programId'], { unique: false });
    }

    // 휴일설정 테이블 생성
    if (!db.objectStoreNames.contains('holidaySettings')) {
      const holidayStore = db.createObjectStore('holidaySettings', { keyPath: 'id' });
      holidayStore.createIndex('staffId', 'staffId', { unique: false });
      holidayStore.createIndex('date', 'date', { unique: false });
      holidayStore.createIndex('isHoliday', 'isHoliday', { unique: false });
      holidayStore.createIndex('staffDate', ['staffId', 'date'], { unique: true });
    }

    // 주별 휴일설정 테이블 생성
    if (!db.objectStoreNames.contains('weeklyHolidaySettings')) {
      const weeklyHolidayStore = db.createObjectStore('weeklyHolidaySettings', { keyPath: 'id' });
      weeklyHolidayStore.createIndex('staffId', 'staffId', { unique: false });
      weeklyHolidayStore.createIndex('weekStartDate', 'weekStartDate', { unique: false });
      weeklyHolidayStore.createIndex('staffWeek', ['staffId', 'weekStartDate'], { unique: true });
      weeklyHolidayStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    // 스케줄 이벤트 테이블 생성
    if (!db.objectStoreNames.contains('scheduleEvents')) {
      const scheduleStore = db.createObjectStore('scheduleEvents', { keyPath: 'id' });
      scheduleStore.createIndex('staffId', 'staffId', { unique: false });
      scheduleStore.createIndex('type', 'type', { unique: false });
      scheduleStore.createIndex('startTime', 'startTime', { unique: false });
      scheduleStore.createIndex('endTime', 'endTime', { unique: false });
      scheduleStore.createIndex('sourceType', 'sourceType', { unique: false });
      scheduleStore.createIndex('sourceId', 'sourceId', { unique: false });
      scheduleStore.createIndex('staffDate', ['staffId', 'startTime'], { unique: false });
      scheduleStore.createIndex('typeDate', ['type', 'startTime'], { unique: false });
      scheduleStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    // 약관/문서 테이블 생성
    if (!db.objectStoreNames.contains('termsDocuments')) {
      const termsStore = db.createObjectStore('termsDocuments', { keyPath: 'id' });
      termsStore.createIndex('type', 'type', { unique: false });
      termsStore.createIndex('language', 'language', { unique: false });
      termsStore.createIndex('title', 'title', { unique: false });
      termsStore.createIndex('version', 'version', { unique: false });
      termsStore.createIndex('isActive', 'isActive', { unique: false });
      termsStore.createIndex('publishedAt', 'publishedAt', { unique: false });
      termsStore.createIndex('createdAt', 'createdAt', { unique: false });
      termsStore.createIndex('typeLanguage', ['type', 'language'], { unique: false });
      termsStore.createIndex('typeLanguageActive', ['type', 'language', 'isActive'], { unique: false });
    }

    // 회원 테이블 생성
    if (!db.objectStoreNames.contains('members')) {
      const memberStore = db.createObjectStore('members', { keyPath: 'id' });
      memberStore.createIndex('name', 'name', { unique: false });
      memberStore.createIndex('phone', 'phone', { unique: true });
      memberStore.createIndex('email', 'email', { unique: false });
      memberStore.createIndex('branchId', 'branchId', { unique: false });
      memberStore.createIndex('coach', 'coach', { unique: false });
      memberStore.createIndex('loginId', 'loginId', { unique: true });
      memberStore.createIndex('isActive', 'isActive', { unique: false });
      memberStore.createIndex('createdAt', 'createdAt', { unique: false });
      memberStore.createIndex('branchActive', ['branchId', 'isActive'], { unique: false });
    }

    // 결제 테이블 생성
    if (!db.objectStoreNames.contains('payments')) {
      const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
      paymentStore.createIndex('memberId', 'memberId', { unique: false });
      paymentStore.createIndex('memberName', 'memberName', { unique: false });
      paymentStore.createIndex('paymentStatus', 'paymentStatus', { unique: false });
      paymentStore.createIndex('paymentDate', 'paymentDate', { unique: false });
      paymentStore.createIndex('totalAmount', 'totalAmount', { unique: false });
      paymentStore.createIndex('receivedAmount', 'receivedAmount', { unique: false });
      paymentStore.createIndex('createdAt', 'createdAt', { unique: false });
      paymentStore.createIndex('memberStatus', ['memberId', 'paymentStatus'], { unique: false });
    } else {
      const transaction = (event.target as IDBOpenDBRequest).transaction!;
      const paymentStore = transaction.objectStore('payments');
      
      if (!paymentStore.indexNames.contains('receivedAmount')) {
        paymentStore.createIndex('receivedAmount', 'receivedAmount', { unique: false });
      }
    }

    // 포인트 테이블 생성 (기존 시스템 호환용)
    if (!db.objectStoreNames.contains('points')) {
      const pointStore = db.createObjectStore('points', { keyPath: 'id' });
      pointStore.createIndex('memberId', 'memberId', { unique: false });
      pointStore.createIndex('memberName', 'memberName', { unique: false });
      pointStore.createIndex('type', 'type', { unique: false });
      pointStore.createIndex('source', 'source', { unique: false });
      pointStore.createIndex('amount', 'amount', { unique: false });
      pointStore.createIndex('expiryDate', 'expiryDate', { unique: false });
      pointStore.createIndex('relatedPaymentId', 'relatedPaymentId', { unique: false });
      pointStore.createIndex('createdAt', 'createdAt', { unique: false });
      pointStore.createIndex('memberType', ['memberId', 'type'], { unique: false });
      pointStore.createIndex('memberActive', ['memberId', 'expiryDate'], { unique: false });
    }

    // 수강정보 테이블 생성
    if (!db.objectStoreNames.contains('courseEnrollments')) {
      const courseStore = db.createObjectStore('courseEnrollments', { keyPath: 'id' });
      courseStore.createIndex('memberId', 'memberId', { unique: false });
      courseStore.createIndex('memberName', 'memberName', { unique: false });
      courseStore.createIndex('productId', 'productId', { unique: false });
      courseStore.createIndex('productName', 'productName', { unique: false });
      courseStore.createIndex('programId', 'programId', { unique: false });
      courseStore.createIndex('programName', 'programName', { unique: false });
      courseStore.createIndex('programType', 'programType', { unique: false });
      courseStore.createIndex('branchId', 'branchId', { unique: false });
      courseStore.createIndex('branchName', 'branchName', { unique: false });
      courseStore.createIndex('coach', 'coach', { unique: false });
      courseStore.createIndex('coachName', 'coachName', { unique: false });
      courseStore.createIndex('enrollmentStatus', 'enrollmentStatus', { unique: false });
      courseStore.createIndex('paidAmount', 'paidAmount', { unique: false });
      courseStore.createIndex('unpaidAmount', 'unpaidAmount', { unique: false });
      courseStore.createIndex('startDate', 'startDate', { unique: false });
      courseStore.createIndex('endDate', 'endDate', { unique: false });
      courseStore.createIndex('relatedPaymentId', 'relatedPaymentId', { unique: false });
      courseStore.createIndex('orderId', 'orderId', { unique: false });
      courseStore.createIndex('createdAt', 'createdAt', { unique: false });
      courseStore.createIndex('memberStatus', ['memberId', 'enrollmentStatus'], { unique: false });
      courseStore.createIndex('branchProgram', ['branchId', 'programId'], { unique: false });
      courseStore.createIndex('coachStatus', ['coach', 'enrollmentStatus'], { unique: false });
    }

    // 주문 테이블 생성 (새로운 스키마)
    if (!db.objectStoreNames.contains('orders')) {
      const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
      orderStore.createIndex('memberId', 'memberId', { unique: false });
      orderStore.createIndex('memberName', 'memberName', { unique: false });
      orderStore.createIndex('branchId', 'branchId', { unique: false });
      orderStore.createIndex('branchName', 'branchName', { unique: false });
      orderStore.createIndex('coach', 'coach', { unique: false });
      orderStore.createIndex('coachName', 'coachName', { unique: false });
      orderStore.createIndex('orderStatus', 'orderStatus', { unique: false });
      orderStore.createIndex('orderType', 'orderType', { unique: false });
      orderStore.createIndex('totalAmount', 'totalAmount', { unique: false });
      orderStore.createIndex('unpaidAmount', 'unpaidAmount', { unique: false });
      orderStore.createIndex('createdAt', 'createdAt', { unique: false });
      orderStore.createIndex('memberStatus', ['memberId', 'orderStatus'], { unique: false });
      orderStore.createIndex('branchStatus', ['branchId', 'orderStatus'], { unique: false });
    }

    // 포인트 거래내역 테이블 생성 (새로운 스키마)
    if (!db.objectStoreNames.contains('pointTransactions')) {
      const ptStore = db.createObjectStore('pointTransactions', { keyPath: 'id' });
      ptStore.createIndex('memberId', 'memberId', { unique: false });
      ptStore.createIndex('memberName', 'memberName', { unique: false });
      ptStore.createIndex('transactionType', 'transactionType', { unique: false });
      ptStore.createIndex('relatedOrderId', 'relatedOrderId', { unique: false });
      ptStore.createIndex('relatedPaymentId', 'relatedPaymentId', { unique: false });
      ptStore.createIndex('earnedDate', 'earnedDate', { unique: false });
      ptStore.createIndex('expiryDate', 'expiryDate', { unique: false });
      ptStore.createIndex('isExpired', 'isExpired', { unique: false });
      ptStore.createIndex('originalTransactionId', 'originalTransactionId', { unique: false });
      ptStore.createIndex('createdAt', 'createdAt', { unique: false });
      ptStore.createIndex('memberType', ['memberId', 'transactionType'], { unique: false });
      ptStore.createIndex('memberExpiry', ['memberId', 'expiryDate', 'isExpired'], { unique: false });
    }

    // 포인트 잔액 테이블 생성 (새로운 스키마)
    if (!db.objectStoreNames.contains('pointBalances')) {
      const pbStore = db.createObjectStore('pointBalances', { keyPath: 'id' });
      pbStore.createIndex('memberId', 'memberId', { unique: true });
      pbStore.createIndex('totalBalance', 'totalBalance', { unique: false });
      pbStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
    }

    // 라커 테이블 생성
    if (!db.objectStoreNames.contains('lockers')) {
      const lockerStore = db.createObjectStore('lockers', { keyPath: 'id' });
      lockerStore.createIndex('number', 'number', { unique: false });
      lockerStore.createIndex('status', 'status', { unique: false });
      lockerStore.createIndex('branchId', 'branchId', { unique: false });
      lockerStore.createIndex('userId', 'userId', { unique: false });
      lockerStore.createIndex('isActive', 'isActive', { unique: false });
      lockerStore.createIndex('branchNumber', ['branchId', 'number'], { unique: true });
      lockerStore.createIndex('branchStatus', ['branchId', 'status'], { unique: false });
      lockerStore.createIndex('branchActive', ['branchId', 'isActive'], { unique: false });
      lockerStore.createIndex('userActive', ['userId', 'isActive'], { unique: false });
      lockerStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    // 운동처방서 테이블 생성
    if (!db.objectStoreNames.contains('exercisePrescriptions')) {
      const exerciseStore = db.createObjectStore('exercisePrescriptions', { keyPath: 'id' });
      exerciseStore.createIndex('memberId', 'memberId', { unique: false });
      exerciseStore.createIndex('memberName', 'memberName', { unique: false });
      exerciseStore.createIndex('prescriptionDate', 'prescriptionDate', { unique: false });
      exerciseStore.createIndex('isActive', 'isActive', { unique: false });
      exerciseStore.createIndex('createdAt', 'createdAt', { unique: false });
      exerciseStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      exerciseStore.createIndex('memberActive', ['memberId', 'isActive'], { unique: false });
    }
  }

  /**
   * 고유 ID 생성 (UUID v4 형식)
   */
  protected generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 트랜잭션 실행 헬퍼
   */
  protected async executeTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    // DB가 없으면 최대 3번 초기화 시도
    if (!this.db) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await this.initDB();
          if (this.db) break;
        } catch (error) {
          if (attempt === 3) {
            throw new Error(`IndexedDB 초기화 실패 (${attempt}번 시도): ${error}`);
          }
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        }
      }
    }
    
    if (!this.db) {
      throw new Error('IndexedDB 연결에 실패했습니다');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], mode);
        const store = transaction.objectStore(storeName);
        
        transaction.onerror = () => {
          reject(transaction.error || new Error('트랜잭션 오류'));
        };
        
        transaction.onabort = () => {
          reject(new Error('트랜잭션이 중단되었습니다'));
        };

        const request = operation(store);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(request.error || new Error('요청 오류'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 파일을 ArrayBuffer로 변환
   */
  protected fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * ArrayBuffer를 Blob으로 변환 (파일 다운로드용)
   */
  protected arrayBufferToBlob(buffer: ArrayBuffer, mimeType: string): Blob {
    return new Blob([buffer], { type: mimeType });
  }

  /**
   * ArrayBuffer를 File 객체로 변환
   */
  protected arrayBufferToFile(buffer: ArrayBuffer, fileName: string, mimeType: string = 'application/octet-stream'): File {
    const blob = new Blob([buffer], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  }

  /**
   * 데이터베이스 초기화 (개발/테스트용)
   */
  async clearAllData(): Promise<void> {
    const storeNames = [
      'branches', 'staff', 'programs', 'products', 'holidaySettings',
      'termsDocuments', 'members', 'payments', 'points', 'courseEnrollments',
      'orders', 'pointTransactions', 'pointBalances', 'lockers'
    ];

    try {
      for (const storeName of storeNames) {
        if (this.db?.objectStoreNames.contains(storeName)) {
          await this.executeTransaction(storeName, 'readwrite', (store) => 
            store.clear()
          );
        }
      }
      console.log('모든 데이터 삭제 완료');
    } catch (error) {
      console.error('데이터 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * DB 연결 상태 확인
   */
  get isConnected(): boolean {
    return !!this.db;
  }

  /**
   * DB 버전 정보
   */
  get dbVersion(): number {
    return this.version;
  }
}