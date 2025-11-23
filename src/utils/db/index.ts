/**
 * IndexedDB 통합 매니저
 * 모든 개별 서비스들을 통합하여 하나의 인터페이스로 제공
 */

// 필요한 imports를 먼저 선언
import { BranchService } from './BranchService';
import { StaffService } from './StaffService';
import { ProgramService, ProductService, WeeklyWorkScheduleService, ScheduleEventService } from './ProgramService';
import { DailyScheduleService } from './DailyScheduleService';
import { MemberService } from './MemberService';
import { PaymentService, OrderService } from './PaymentService';
import { PointService } from './PointService';
import { CourseService } from './CourseService';
import { TermsService } from './TermsService';
import { LockerService } from './LockerService';
import { ExercisePrescriptionService } from './ExercisePrescriptionService';
import { ReferralPointService } from './ReferralPointService';
import { BaseDBManager } from './BaseDBManager';

// 타입 정의 export
export * from './types';

// 기본 클래스 export
export { BaseDBManager } from './BaseDBManager';

// 개별 서비스 클래스들 export
export { BranchService } from './BranchService';
export { StaffService } from './StaffService';
export { ProgramService, ProductService, WeeklyWorkScheduleService, ScheduleEventService } from './ProgramService';
export { DailyScheduleService } from './DailyScheduleService';
export { MemberService } from './MemberService';
export { PaymentService, OrderService } from './PaymentService';
export { PointService } from './PointService';
export { CourseService } from './CourseService';
export { TermsService } from './TermsService';
export { LockerService } from './LockerService';
export { ExercisePrescriptionService } from './ExercisePrescriptionService';
export { ReferralPointService } from './ReferralPointService';

/**
 * 통합 데이터베이스 매니저
 * 모든 서비스들을 하나의 인스턴스에서 접근할 수 있도록 제공
 */
export class IndexedDBManager extends BaseDBManager {
  public branch: BranchService;
  public staff: StaffService;
  public program: ProgramService;
  public product: ProductService;
  public weeklyWorkSchedule: WeeklyWorkScheduleService;
  public dailySchedule: DailyScheduleService;
  public scheduleEvent: ScheduleEventService;
  public member: MemberService;
  public payment: PaymentService;
  public order: OrderService;
  public point: PointService;
  public course: CourseService;
  public terms: TermsService;
  public locker: LockerService;
  public exercisePrescription: ExercisePrescriptionService;
  public referralPoint: ReferralPointService;

  constructor() {
    super();
    
    // 각 서비스 인스턴스 생성
    this.branch = new BranchService();
    this.staff = new StaffService();
    this.program = new ProgramService();
    this.product = new ProductService();
    this.weeklyWorkSchedule = new WeeklyWorkScheduleService();
    this.dailySchedule = new DailyScheduleService();
    this.scheduleEvent = new ScheduleEventService();
    this.member = new MemberService();
    this.payment = new PaymentService();
    this.order = new OrderService();
    this.point = new PointService();
    this.course = new CourseService();
    this.terms = new TermsService();
    this.locker = new LockerService();
    this.exercisePrescription = new ExercisePrescriptionService();
    this.referralPoint = new ReferralPointService();

    // 데이터 마이그레이션 실행
    this.runMigrations();
  }

  /**
   * 통합 주문 처리 (서비스 간 협력이 필요한 복합 기능)
   */
  async processOrderWithPayments(orderData: import('./types').OrderProcessingData): Promise<string> {
    return await this.order.processOrderWithPayments(orderData, {
      productService: this.product,
      paymentService: this.payment,
      pointService: this.point,
      courseService: this.course
    });
  }

  /**
   * 로그인 ID 중복 체크 (직원과 회원 모두 확인)
   */
  async checkLoginIdDuplicate(loginId: string): Promise<import('./types').LoginIdDuplicateCheckResult> {
    return await this.member.checkLoginIdDuplicate(
      loginId, 
      (id: string) => this.staff.getStaffByLoginId(id)
    );
  }

  /**
   * 회원 포인트 잔액 조회 (호환성 유지)
   */
  async getMemberPointBalance(memberId: string): Promise<number> {
    return await this.point.getMemberPointBalanceV2(memberId);
  }

  /**
   * 전체 데이터 마이그레이션 실행
   */
  private async runMigrations(): Promise<void> {
    try {
      console.log('=== 데이터 마이그레이션 시작 ===');
      
      // 1. 직원 isActive 필드 마이그레이션
      await this.staff.migrateStaffActiveStatus();
      
      // 2. 포인트 데이터 마이그레이션
      await this.point.migratePointsToTransactions();
      
      // 3. 결제 데이터에 주문 ID 추가
      await this.migratePaymentsWithOrderId();
      
      // 4. 수강 데이터에 appliedPrice 필드 추가
      await this.course.migrateAppliedPriceField();
      
      console.log('=== 데이터 마이그레이션 완료 ===');
    } catch (error) {
      console.error('데이터 마이그레이션 실패:', error);
    }
  }

  /**
   * 기존 결제 데이터에 orderId 추가 (역호환성)
   */
  private async migratePaymentsWithOrderId(): Promise<void> {
    try {
      console.log('결제 데이터 주문 ID 마이그레이션 시작...');
      
      const payments = await this.payment.getAllPayments();
      const paymentsWithoutOrderId = payments.filter(p => !p.orderId);
      
      if (paymentsWithoutOrderId.length === 0) {
        console.log('마이그레이션이 필요한 결제 데이터가 없습니다.');
        return;
      }
      
      // 각 결제에 대해 가상의 주문 생성
      for (const payment of paymentsWithoutOrderId) {
        // 1. 기존 결제를 위한 주문 생성
        const orderId = await this.order.createOrder({
          memberId: payment.memberId,
          memberName: payment.memberName,
          branchId: payment.branchId,
          branchName: payment.branchName,
          coach: payment.coach,
          coachName: payment.coachName,
          orderItems: payment.products.map(p => ({
            productId: p.id,
            productName: p.name,
            programId: p.programId || '',
            programName: p.programName || '',
            programType: p.programType || '',
            price: p.price,
            quantity: p.quantity
          })),
          totalAmount: payment.totalAmount,
          paidAmount: payment.paidAmount,
          unpaidAmount: payment.unpaidAmount,
          pointsUsed: 0, // 기존 데이터에서는 포인트 사용 정보 없음
          pointsEarned: 0,
          orderStatus: payment.paymentStatus === 'completed' ? 'completed' : 
                      payment.paymentStatus === 'unpaid' ? 'partially_paid' : 'pending',
          orderType: payment.paymentType === 'course' ? 'course_enrollment' : 'product_purchase',
          memo: `마이그레이션된 기존 결제 (원본 결제 ID: ${payment.id.slice(-8)})`
        });
        
        // 2. 결제에 주문 ID 추가
        await this.payment.updatePayment(payment.id, { orderId });
        
        // 3. 관련 수강 등록에도 주문 ID 추가
        if (payment.relatedCourseId) {
          await this.course.updateCourseEnrollment(payment.relatedCourseId, { orderId });
        }
      }
      
      console.log(`결제 데이터 주문 ID 마이그레이션 완료: ${paymentsWithoutOrderId.length}건 처리`);
    } catch (error) {
      console.error('결제 데이터 주문 ID 마이그레이션 실패:', error);
    }
  }

  /**
   * 전체 데이터베이스 초기화 (개발/테스트용)
   */
  async clearAllData(): Promise<void> {
    await super.clearAllData();
  }

  /**
   * 데이터베이스 연결 상태 확인
   */
  get isConnected(): boolean {
    return this.db !== null;
  }

  /**
   * 데이터베이스 버전 정보
   */
  get dbVersion(): number {
    return this.version;
  }

  // ===============================
  // Backward Compatibility Layer
  // 기존 API 호환성을 위한 메서드들
  // ===============================

  // Branch 관련 호환성 메서드
  async getAllBranches() {
    return await this.branch.getAllBranches();
  }

  async addBranch(branchData: Omit<import('./types').Branch, 'id' | 'createdAt' | 'updatedAt'>) {
    return await this.branch.addBranch(branchData);
  }

  async updateBranch(id: string, updates: Partial<import('./types').Branch>) {
    return await this.branch.updateBranch(id, updates);
  }

  async deleteBranch(id: string) {
    return await this.branch.deleteBranch(id);
  }

  async getBranchById(id: string) {
    return await this.branch.getBranchById(id);
  }

  async getOrCreateBranchByName(name: string) {
    return await this.branch.getOrCreateBranchByName(name);
  }

  // 라커 가격 관련 메서드
  async getLockerPrice(branchId: string) {
    return await this.branch.getLockerPrice(branchId);
  }

  async updateLockerPrice(branchId: string, price: number) {
    return await this.branch.updateLockerPrice(branchId, price);
  }

  // Staff 관련 호환성 메서드
  async getAllStaff() {
    return await this.staff.getAllStaff();
  }

  async addStaff(staffData: Omit<import('./types').Staff, 'id' | 'createdAt' | 'updatedAt'>) {
    return await this.staff.addStaff(staffData);
  }

  async updateStaff(id: string, updates: Partial<import('./types').Staff>) {
    return await this.staff.updateStaff(id, updates);
  }

  async deleteStaff(id: string) {
    return await this.staff.deleteStaff(id);
  }

  async getStaffById(id: string) {
    return await this.staff.getStaffById(id);
  }

  async getStaffByLoginId(loginId: string) {
    return await this.staff.getStaffByLoginId(loginId);
  }

  async toggleStaffStatus(id: string) {
    return await this.staff.toggleStaffStatus(id);
  }

  // Staff Holiday 관련 메서드
  async getStaffHolidays(staffId: string) {
    return await this.staff.getStaffHolidays(staffId);
  }

  async updateStaffHolidays(staffId: string, holidays: string[]) {
    return await this.staff.updateStaffHolidays(staffId, holidays);
  }

  async addStaffHoliday(staffId: string, date: string) {
    return await this.staff.addStaffHoliday(staffId, date);
  }

  async removeStaffHoliday(staffId: string, date: string) {
    return await this.staff.removeStaffHoliday(staffId, date);
  }

  async isStaffHoliday(staffId: string, date: string) {
    return await this.staff.isStaffHoliday(staffId, date);
  }

  async getStaffHolidaysInRange(staffId: string, startDate: string, endDate: string) {
    return await this.staff.getStaffHolidaysInRange(staffId, startDate, endDate);
  }

  async getAllStaffHolidayStatus(date: string) {
    return await this.staff.getAllStaffHolidayStatus(date);
  }

  // Member 관련 호환성 메서드
  async getAllMembers() {
    return await this.member.getAllMembers();
  }

  async addMember(memberData: Omit<import('./types').Member, 'id' | 'createdAt' | 'updatedAt'>) {
    return await this.member.addMember(memberData);
  }

  async updateMember(id: string, updates: Partial<import('./types').Member>) {
    return await this.member.updateMember(id, updates);
  }

  async deleteMember(id: string) {
    return await this.member.deleteMember(id);
  }

  async getMemberById(id: string) {
    return await this.member.getMemberById(id);
  }

  async searchMembers(searchTerm: string) {
    return await this.member.searchMembers(searchTerm);
  }

  async checkMemberDuplicate(phone: string, email?: string) {
    return await this.member.checkMemberDuplicate(phone, email);
  }

  // Product 관련 호환성 메서드
  async getAllProducts() {
    return await this.product.getAllProducts();
  }

  async addProduct(productData: Omit<import('./types').Product, 'id' | 'createdAt' | 'updatedAt'>) {
    return await this.product.addProduct(productData);
  }

  async updateProduct(id: string, updates: Partial<import('./types').Product>) {
    return await this.product.updateProduct(id, updates);
  }

  async deleteProduct(id: string) {
    return await this.product.deleteProduct(id);
  }

  async getProductById(id: string) {
    return await this.product.getProductById(id);
  }

  async getProductsByBranch(branchId: string) {
    return await this.product.getProductsByBranch(branchId);
  }

  async getProductsByProgram(programId: string) {
    return await this.product.getProductsByProgram(programId);
  }

  // Program 관련 호환성 메서드
  async getAllPrograms() {
    return await this.program.getAllPrograms();
  }

  async addProgram(programData: Omit<import('./types').Program, 'id' | 'createdAt' | 'updatedAt'>) {
    return await this.program.addProgram(programData);
  }

  async updateProgram(id: string, updates: Partial<import('./types').Program>) {
    return await this.program.updateProgram(id, updates);
  }

  async deleteProgram(id: string) {
    return await this.program.deleteProgram(id);
  }

  async getProgramById(id: string) {
    const programs = await this.program.getAllPrograms();
    return programs.find(p => p.id === id) || null;
  }

  async getProgramsByBranch(branchId: string) {
    const products = await this.product.getAllProducts();
    const programIds = Array.from(new Set(products.filter(p => p.branchId === branchId).map(p => p.programId)));
    const programs = await this.program.getAllPrograms();
    return programs.filter(p => programIds.includes(p.id));
  }

  // Payment 관련 호환성 메서드
  async getAllPayments() {
    return await this.payment.getAllPayments();
  }

  async addPayment(paymentData: Omit<import('./types').Payment, 'id' | 'createdAt' | 'updatedAt'>) {
    return await this.payment.addPayment(paymentData);
  }

  async updatePayment(id: string, updates: Partial<import('./types').Payment>) {
    return await this.payment.updatePayment(id, updates);
  }

  async deletePayment(id: string) {
    return await this.payment.deletePayment(id);
  }

  async getPaymentById(id: string) {
    return await this.payment.getPaymentById(id);
  }

  async getPaymentsByMember(memberId: string) {
    return await this.payment.getPaymentsByMember(memberId);
  }

  async getPaymentsByBranch(branchId: string) {
    const payments = await this.payment.getAllPayments();
    return payments.filter(p => p.branchId === branchId);
  }

  // Point 관련 호환성 메서드
  async getAllPoints() {
    return await this.point.getAllPoints();
  }

  // 새로운 포인트 시스템에서만 포인트 내역 조회
  async getAllPointsUnified() {
    return await this.point.getAllPointsFromTransactions();
  }

  async getMemberPointStats(memberId: string) {
    return await this.point.getMemberPointStatsUnified(memberId);
  }

  async addPoint(pointData: import('./types').Point) {
    return await this.point.addPoint(pointData);
  }

  async updatePoint(id: string, updates: Partial<import('./types').Point>) {
    const points = await this.point.getAllPoints();
    const point = points.find(p => p.id === id);
    if (!point) {
      throw new Error('포인트를 찾을 수 없습니다.');
    }
    // Point 업데이트 로직을 대체 구현
    const updatedPoint = { ...point, ...updates, updatedAt: new Date() };
    return await this.point.addPoint(updatedPoint);
  }

  async deletePoint(id: string) {
    // Point 삭제는 직접 구현 필요 (서비스에 없음)
    console.warn('Point 삭제는 지원되지 않습니다.');
    return false;
  }

  async getPointById(id: string) {
    const points = await this.point.getAllPoints();
    return points.find(p => p.id === id) || null;
  }

  async getPointsByMember(memberId: string) {
    return await this.point.getPointsByMember(memberId);
  }

  // Course 관련 호환성 메서드
  async getAllCourseEnrollments() {
    return await this.course.getAllCourseEnrollments();
  }

  async addCourseEnrollment(enrollmentData: Omit<import('./types').CourseEnrollment, 'id' | 'createdAt' | 'updatedAt'>) {
    return await this.course.addCourseEnrollment(enrollmentData);
  }

  async updateCourseEnrollment(id: string, updates: Partial<import('./types').CourseEnrollment>) {
    return await this.course.updateCourseEnrollment(id, updates);
  }

  async deleteCourseEnrollment(id: string) {
    return await this.course.deleteCourseEnrollment(id);
  }

  async getCourseEnrollmentById(id: string) {
    return await this.course.getCourseEnrollmentById(id);
  }

  async getCourseEnrollmentsByMember(memberId: string) {
    return await this.course.getCourseEnrollmentsByMember(memberId);
  }

  async getCourseEnrollmentsByBranch(branchId: string) {
    return await this.course.getCourseEnrollmentsByBranch(branchId);
  }

  async getUnpaidMetaInfo() {
    return await this.course.getUnpaidMetaInfo();
  }

  async getMemberUnpaidTotal(memberId: string) {
    return await this.course.getMemberUnpaidTotal(memberId);
  }

  // 홀드 및 연장 관련 메서드 추가
  async startHold(enrollmentId: string, holdReason?: string) {
    return await this.course.startHold(enrollmentId, holdReason);
  }

  async endHold(enrollmentId: string) {
    return await this.course.endHold(enrollmentId);
  }

  async extendCourse(enrollmentId: string, extendDays: number, extendReason?: string) {
    return await this.course.extendCourse(enrollmentId, extendDays, extendReason);
  }

  async getHoldCourseEnrollments() {
    return await this.course.getHoldCourseEnrollments();
  }

  // Terms 관련 호환성 메서드
  async getAllTermsDocuments() {
    return await this.terms.getAllTermsDocuments();
  }

  async addTermsDocument(termsData: Omit<import('./types').TermsDocument, 'id' | 'createdAt' | 'updatedAt'>) {
    return await this.terms.addTermsDocument(termsData);
  }

  async updateTermsDocument(id: string, updates: Partial<import('./types').TermsDocument>) {
    return await this.terms.updateTermsDocument(id, updates);
  }

  async deleteTermsDocument(id: string) {
    return await this.terms.deleteTermsDocument(id);
  }

  async getTermsDocumentById(id: string) {
    return await this.terms.getTermsDocumentById(id);
  }

  async getLatestTermsDocument(type: string) {
    // 타입을 명시적으로 캐스팅
    const validType = type as "privacy_policy" | "terms_of_service" | "business_info" | "marketing_consent" | "member_terms" | "contract";
    return await this.terms.getActiveTermsDocument(validType);
  }

  // 휴일 관리는 Staff.holidays 배열을 사용 (HolidaySettings 제거됨)

  async getHolidayById(id: string) {
    console.warn('HolidaySettings 테이블이 제거되었습니다. Staff.holidays 배열을 사용하세요.');
    return null;
  }

  async getHolidaysByYear(year: number) {
    console.warn('HolidaySettings 테이블이 제거되었습니다. Staff.holidays 배열을 사용하세요.');
    return [];
  }

  async isHoliday(date: Date) {
    console.warn('HolidaySettings 테이블이 제거되었습니다. Staff.holidays 배열을 사용하세요.');
    return false;
  }

  async getHolidaySettingsByDateRange(startDate: string, endDate: string) {
    console.warn('HolidaySettings 테이블이 제거되었습니다. Staff.holidays 배열을 사용하세요.');
    return [];
  }

  // WeeklyWorkSchedule 관련 메서드
  async saveWeeklyWorkSchedule(settings: Omit<import('./types').WeeklyWorkSchedule, 'id' | 'createdAt' | 'updatedAt'>[]) {
    return await this.weeklyWorkSchedule.saveWeeklyWorkSchedule(settings);
  }

  async getWeeklyWorkScheduleByStaff(staffId: string) {
    return await this.weeklyWorkSchedule.getWeeklyWorkScheduleByStaff(staffId);
  }

  async getWeeklyWorkScheduleByStaffAndWeek(staffId: string, weekStartDate: string) {
    return await this.weeklyWorkSchedule.getWeeklyWorkScheduleByStaffAndWeek(staffId, weekStartDate);
  }

  async deleteWeeklyWorkSchedule(id: string) {
    return await this.weeklyWorkSchedule.deleteWeeklyWorkSchedule(id);
  }

  async deleteWeeklyWorkScheduleByStaff(staffId: string) {
    return await this.weeklyWorkSchedule.deleteWeeklyWorkScheduleByStaff(staffId);
  }

  // 일별 스케줄 설정 관련 메서드
  async saveDailySchedules(settings: Omit<import('./types').DailyScheduleSettings, 'id' | 'createdAt' | 'updatedAt'>[]) {
    return await this.dailySchedule.saveDailySchedules(settings);
  }

  async getDailyScheduleByStaffAndDate(staffId: string, date: string) {
    return await this.dailySchedule.getDailyScheduleByStaffAndDate(staffId, date);
  }

  async getDailySchedulesByStaff(staffId: string) {
    return await this.dailySchedule.getDailySchedulesByStaff(staffId);
  }

  async getDailySchedulesByDate(date: string) {
    return await this.dailySchedule.getDailySchedulesByDate(date);
  }

  async getDailySchedulesByStaffAndDateRange(staffId: string, startDate: string, endDate: string) {
    return await this.dailySchedule.getDailySchedulesByStaffAndDateRange(staffId, startDate, endDate);
  }

  async deleteDailySchedule(id: string) {
    return await this.dailySchedule.deleteDailySchedule(id);
  }

  async deleteAllDailySchedulesByStaff(staffId: string) {
    return await this.dailySchedule.deleteAllDailySchedulesByStaff(staffId);
  }

  // 주별 휴일설정 관련 메서드 (@deprecated - DailySchedule 사용)
  // async saveWeeklyHolidaySettings(settings: Omit<import('./types').WeeklyHolidaySettings, 'id' | 'createdAt' | 'updatedAt'>[]) {
  //   return await this.weeklyHoliday.saveWeeklyHolidaySettings(settings);
  // }

  // async getWeeklyHolidaySettingsByStaff(staffId: string) {
  //   return await this.weeklyHoliday.getWeeklyHolidaySettingsByStaff(staffId);
  // }

  // async getWeeklyHolidaySettingsByStaffAndWeek(staffId: string, weekStartDate: string) {
  //   return await this.weeklyHoliday.getWeeklyHolidaySettingsByStaffAndWeek(staffId, weekStartDate);
  // }

  // async getWeeklyHolidaySettingsByWeek(weekStartDate: string) {
  //   return await this.weeklyHoliday.getWeeklyHolidaySettingsByWeek(weekStartDate);
  // }

  // async deleteWeeklyHolidaySettings(id: string) {
  //   return await this.weeklyHoliday.deleteWeeklyHolidaySettings(id);
  // }

  // async deleteWeeklyHolidaySettingsByStaff(staffId: string) {
  //   return await this.weeklyHoliday.deleteWeeklyHolidaySettingsByStaff(staffId);
  // }

  // async isHolidayByDate(staffId: string, date: string) {
  //   return await this.weeklyHoliday.isHolidayByDate(staffId, date);
  // }

  // getNextMondayDate() {
  //   return this.weeklyHoliday.getNextMondayDate();
  // }

  // getCurrentMondayDate() {
  //   return this.weeklyHoliday.getCurrentMondayDate();
  // }

  // Staff migration 관련 호환성 메서드
  async migrateStaffActiveStatus() {
    return await this.staff.migrateStaffActiveStatus();
  }

  async checkDuplicateStaff(loginId: string, email: string, phone: string) {
    return await this.staff.checkDuplicateStaff(loginId, email, phone);
  }

  // Locker 관련 호환성 메서드
  async getAllLockers() {
    return await this.locker.getAllLockers();
  }

  async getLockersByBranch(branchId: string) {
    return await this.locker.getLockersByBranch(branchId);
  }

  async addLocker(lockerData: Omit<import('./types').Locker, 'id' | 'createdAt' | 'updatedAt'>) {
    return await this.locker.addLocker(lockerData);
  }

  async addMultipleLockers(lockersData: Omit<import('./types').Locker, 'id' | 'createdAt' | 'updatedAt'>[]) {
    return await this.locker.addMultipleLockers(lockersData);
  }

  async updateLocker(id: string, updates: Partial<import('./types').Locker>) {
    return await this.locker.updateLocker(id, updates);
  }

  async deleteLocker(id: string) {
    return await this.locker.deleteLocker(id);
  }

  async getLockerById(id: string) {
    return await this.locker.getLockerById(id);
  }

  async getLockersByUser(userId: string) {
    return await this.locker.getLockersByUser(userId);
  }

  async assignLockerToUser(lockerId: string, userId: string, userName: string, months: number, paymentId?: string) {
    return await this.locker.assignLockerToUser(lockerId, userId, userName, months, paymentId, this.member);
  }

  async assignLockerToUserWithDates(lockerId: string, userId: string, userName: string, months: number, startDate: string, endDate: string, paymentId?: string) {
    return await this.locker.assignLockerToUserWithDates(lockerId, userId, userName, months, startDate, endDate, paymentId, this.member);
  }

  async unassignLocker(lockerId: string) {
    return await this.locker.unassignLocker(lockerId, this.member);
  }

  async getExpiredLockers() {
    return await this.locker.getExpiredLockers();
  }

  async checkLockerNumberDuplicate(branchId: string, number: string, excludeId?: string) {
    return await this.locker.checkLockerNumberDuplicate(branchId, number, excludeId);
  }

  // ScheduleEvent 관련 호환성 메서드
  async saveScheduleEvents(events: Omit<import('./types').ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>[]) {
    return await this.scheduleEvent.saveScheduleEvents(events);
  }

  async deleteScheduleEventsBySource(sourceType: string, sourceId?: string) {
    return await this.scheduleEvent.deleteScheduleEventsBySource(sourceType, sourceId);
  }

  async getScheduleEventsByStaff(staffId: string, startDate?: Date, endDate?: Date) {
    return await this.scheduleEvent.getScheduleEventsByStaff(staffId, startDate, endDate);
  }

  async getAllScheduleEvents(startDate?: Date, endDate?: Date) {
    return await this.scheduleEvent.getAllScheduleEvents(startDate, endDate);
  }

  async deleteScheduleEvent(eventId: string) {
    return await this.scheduleEvent.deleteScheduleEvent(eventId);
  }

  async updateScheduleEvent(eventId: string, updates: Partial<import('./types').ScheduleEvent>) {
    return await this.scheduleEvent.updateScheduleEvent(eventId, updates);
  }
}

// 싱글톤 인스턴스 생성 및 export
export const dbManager = new IndexedDBManager();

// 개발자 도구에서 사용할 수 있도록 전역 객체에 추가
if (typeof window !== 'undefined') {
  (window as any).dbManager = dbManager;
}

// 기존 호환성을 위한 default export
export default dbManager;