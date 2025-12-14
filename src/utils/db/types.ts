/**
 * IndexedDB 관련 타입 정의
 */

// 기본 레코드 인터페이스
export interface DBRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 지점 인터페이스
export interface Branch extends DBRecord {
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  lockerPrice?: number; // 지점별 라커 가격 (기본값: 5000원)
}

// 앱 설정 인터페이스
export interface AppSettings extends DBRecord {
  key: string;
  value: string;
}

// 직원 인터페이스
export interface Staff extends DBRecord {
  name: string;
  loginId: string; // 로그인 ID
  password: string; // 비밀번호
  phone: string;
  email: string;
  branchId: string;
  position: string; // 직급
  role: string; // 직책
  employmentType: string; // 고용형태
  permission: string; // 권한
  program?: string; // 담당프로그램 (코치일 경우만)
  workShift?: string; // 근무 시간대 (횟수제 프로그램 코치일 경우만)
  contractStartDate: Date;
  contractEndDate?: Date | null; // 계약종료일 (정규직은 없을 수 있음)
  contractFile?: File | null; // 계약서 파일
  contractFileName?: string; // 계약서 파일명 저장용
  contractFileData?: ArrayBuffer; // 계약서 파일 데이터 저장용
  workingHours?: {
    start: number; // 기본 근무 시작 시간 (시)
    end: number; // 기본 근무 종료 시간 (시)
  };
  holidays?: string[]; // 휴일 날짜 배열 (YYYY-MM-DD 형식)
  isActive: boolean; // 활성/비활성 상태
}

// 라커 인터페이스
export interface Locker extends DBRecord {
  number: string;
  status: 'available' | 'occupied' | 'maintenance' | 'pending';
  branchId: string;
  branchName: string; // 조회 성능을 위해 저장
  userId?: string; // 사용자 ID
  userName?: string; // 사용자 이름
  startDate?: string; // 사용 시작일 (YYYY-MM-DD)
  endDate?: string; // 사용 종료일 (YYYY-MM-DD)
  paymentId?: string; // 관련 결제 ID
  months?: number; // 사용 기간 (개월)
  changeHistory?: string[]; // 수정 이력 (메모 배열)
  isActive: boolean;
}

// 프로그램 인터페이스
export interface Program extends DBRecord {
  name: string;
  type: string; // '횟수제' | '기간제'
  isActive: boolean;
}

// 상품 인터페이스
export interface Product extends DBRecord {
  name: string;
  branchId: string;
  programId: string;
  programName: string; // 프로그램명 저장 (조회 성능 향상)
  programType: string; // 프로그램 종류 저장 (조회 성능 향상)
  sessions?: number; // 횟수 (횟수제인 경우에만 필요)
  months?: number; // 개월수 (기간제인 경우에만 필요)
  duration?: number; // 소요시간 (분 단위, 횟수제인 경우에만 필요)
  validityMonths?: number; // 유효기간 개월수 (횟수제인 경우에만 필요)
  price?: number; // 가격
  description?: string; // 상품소개
  isActive: boolean;
}

// 일별 스케줄 설정 인터페이스 (간소화된 구조)
export interface DailyScheduleSettings extends DBRecord {
  staffId: string;
  date: string; // YYYY-MM-DD 형식
  isHoliday: boolean;
  workingHours?: {
    start: number; // 분 단위 (예: 540 = 9:00)
    end: number;   // 분 단위 (예: 1260 = 21:00)
  };
  breakTimes?: Array<{
    start: number;  // 분 단위
    end: number;    // 분 단위
    name?: string;  // 휴게시간 이름 (예: "점심시간")
  }>;
}

// 주별 근무 스케줄 인터페이스 (휴일은 Staff.holidays 사용, 근무시간/휴게시간만 관리)
// @deprecated - DailyScheduleSettings로 대체됨
export interface WeeklyWorkSchedule extends DBRecord {
  staffId: string;
  weekStartDate: string; // 해당 주의 월요일 날짜 (YYYY-MM-DD 형식)
  weekDays: {
    monday: {
      workingHours: {
        start: number;
        end: number;
      };
      breakTimes: Array<{
        start: number;  // 시간 (예: 12시 = 12)
        end: number;    // 시간 (예: 13시 = 13)
        name?: string;  // 휴게시간 이름 (예: "점심시간")
      }>;
    };
    tuesday: {
      workingHours: {
        start: number;
        end: number;
      };
      breakTimes: Array<{
        start: number;
        end: number;
        name?: string;
      }>;
    };
    wednesday: {
      workingHours: {
        start: number;
        end: number;
      };
      breakTimes: Array<{
        start: number;
        end: number;
        name?: string;
      }>;
    };
    thursday: {
      workingHours: {
        start: number;
        end: number;
      };
      breakTimes: Array<{
        start: number;
        end: number;
        name?: string;
      }>;
    };
    friday: {
      workingHours: {
        start: number;
        end: number;
      };
      breakTimes: Array<{
        start: number;
        end: number;
        name?: string;
      }>;
    };
    saturday: {
      workingHours: {
        start: number;
        end: number;
      };
      breakTimes: Array<{
        start: number;
        end: number;
        name?: string;
      }>;
    };
    sunday: {
      workingHours: {
        start: number;
        end: number;
      };
      breakTimes: Array<{
        start: number;
        end: number;
        name?: string;
      }>;
    };
  };
}

// 새로운 주별 휴일 설정 인터페이스
// @deprecated - DailyScheduleSettings로 대체됨
export interface WeeklyHolidaySettings extends DBRecord {
  staffId: string;
  weekStartDate: string; // 해당 주의 월요일 날짜 (YYYY-MM-DD 형식)
  weekDays: {
    monday: {
      isHoliday: boolean;
      workingHours?: {
        start: number;
        end: number;
      };
      breakTimes?: Array<{
        start: number;  // 시간 (예: 12시 = 12)
        end: number;    // 시간 (예: 13시 = 13)
        name?: string;  // 휴게시간 이름 (예: "점심시간")
      }>;
    };
    tuesday: {
      isHoliday: boolean;
      workingHours?: {
        start: number;
        end: number;
      };
      breakTimes?: Array<{
        start: number;
        end: number;
        name?: string;
      }>;
    };
    wednesday: {
      isHoliday: boolean;
      workingHours?: {
        start: number;
        end: number;
      };
      breakTimes?: Array<{
        start: number;
        end: number;
        name?: string;
      }>;
    };
    thursday: {
      isHoliday: boolean;
      workingHours?: {
        start: number;
        end: number;
      };
      breakTimes?: Array<{
        start: number;
        end: number;
        name?: string;
      }>;
    };
    friday: {
      isHoliday: boolean;
      workingHours?: {
        start: number;
        end: number;
      };
      breakTimes?: Array<{
        start: number;
        end: number;
        name?: string;
      }>;
    };
    saturday: {
      isHoliday: boolean;
      workingHours?: {
        start: number;
        end: number;
      };
      breakTimes?: Array<{
        start: number;
        end: number;
        name?: string;
      }>;
    };
    sunday: {
      isHoliday: boolean;
      workingHours?: {
        start: number;
        end: number;
      };
      breakTimes?: Array<{
        start: number;
        end: number;
        name?: string;
      }>;
    };
  };
}

// 약관 문서 인터페이스
export interface TermsDocument extends DBRecord {
  type: 'privacy_policy' | 'terms_of_service' | 'business_info' | 'marketing_consent' | 'member_terms' | 'contract';
  title: string;
  content: string;
  version: number; // 버전 관리
  isActive: boolean;
  publishedAt?: Date | null; // 발행일
}

// 회원 인터페이스
export interface Member extends DBRecord {
  name: string;
  phone: string;
  email: string;
  birth: string;
  gender: 'male' | 'female' | '';
  address: string;
  sigunguCode: string;
  dong: string;
  roadAddress: string;
  jibunAddress: string;
  branchId: string;
  branchName: string; // 조회 성능을 위해 저장
  coach: string; // 담당 코치 ID
  coachName: string; // 조회 성능을 위해 저장
  joinPath: string;
  loginId: string; // 로그인 ID (공란일 때는 임시값 생성)
  loginPassword: string | null; // 로그인 비밀번호 (공란 가능)
  enableLogin: boolean;
  agreementInfo: {
    agreements: Array<{
      id: string;
      title: string;
      content: string;
      required: boolean;
      agreed: boolean;
    }>;
    customerSignature: string;
    staffSignature: string;
  };
  isActive: boolean;
  registrationDate: string; // 회원가입일
  remarks?: string; // 비고
  reservationMemo?: string; // 예약 전용 메모
  
  // 라커 정보 (배정된 경우만)
  lockerInfo?: {
    lockerId: string;
    lockerNumber: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    months: number;
    paymentId?: string;
  } | null;
}

// 결제 인터페이스
export interface Payment extends DBRecord {
  orderId?: string;           // 주문 ID 참조 (기존 데이터 호환성을 위해 optional)
  memberId: string;
  memberName: string; // 조회 성능을 위해 저장
  branchId: string;
  branchName: string; // 지점명
  coach: string; // 담당 코치 ID
  coachName: string; // 담당 코치명
  products: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    programId?: string;
    programName?: string;
    programType?: string;
    description?: string;
  }>;
  totalAmount: number; // 총 결제 예정 금액
  paidAmount: number; // 실제 결제된 금액
  unpaidAmount: number; // 미결제 금액 (totalAmount - paidAmount)
  paymentStatus: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'unpaid';
  paymentMethod?: string;
  paymentDate?: Date | null;
  // 결제 타입 및 연결 정보 추가
  paymentType: 'course' | 'asset' | 'other'; // 수강 결제 | 자산 결제 | 기타
  relatedCourseId?: string | null; // 연결된 수강 이력 ID
  relatedAssetId?: string | null; // 연결된 자산 ID (향후 사용)
  memo?: string; // 메모
  
  // 새로운 필드 추가
  amount?: number;            // 해당 결제수단으로 결제한 금액 (개별 결제 기록용)
  paymentReference?: string;  // 결제 참조번호 (카드 승인번호 등)
}

// 포인트 인터페이스 (기존 시스템 호환용)
export interface Point extends DBRecord {
  memberId: string;
  memberName: string; // 조회 성능을 위해 저장
  amount: number; // 포인트 금액 (양수: 적립, 음수: 사용)
  type: 'earned' | 'used' | 'expired' | 'adjusted'; // 적립, 사용, 만료, 조정
  source: string; // 포인트 발생 출처 (예: '회원등록 초과금', '상품구매', '포인트사용' 등)
  description?: string; // 상세 설명
  expiryDate?: Date | null; // 만료일 (적립된 포인트의 경우)
  relatedPaymentId?: string; // 연관된 결제 ID (있는 경우)
}

// 수강 등록 인터페이스
export interface CourseEnrollment extends DBRecord {
  orderId?: string; // 주문 ID 참조 (기존 데이터 호환성을 위해 optional)
  memberId: string;
  memberName: string; // 조회 성능을 위해 저장
  productId: string;
  productName: string; // 상품명
  productPrice: number; // 상품 가격 (계산된 정확한 금액)
  appliedPrice?: number; // 적용 가격 (사용자가 조정한 최종 금액) - 기존 데이터 호환성을 위해 optional
  programId: string;
  programName: string; // 프로그램명
  programType: string; // 프로그램 타입 ('횟수제' | '기간제')
  branchId: string;
  branchName: string; // 지점명
  coach: string; // 담당 코치 ID
  coachName: string; // 담당 코치명
  enrollmentStatus: 'active' | 'completed' | 'suspended' | 'cancelled' | 'unpaid' | 'hold'; // 수강 상태 확장 (홀드 추가)
  paidAmount: number; // 실제 지불한 금액
  unpaidAmount: number; // 미납 금액 (appliedPrice - paidAmount)
  startDate?: Date | null; // 수강 시작일
  endDate?: Date | null; // 수강 종료일 (기간제인 경우)
  sessionCount?: number; // 총 수업 횟수 (횟수제인 경우)
  completedSessions?: number; // 완료된 세션 수 (횟수제인 경우)
  
  // 홀드 관련 필드 추가
  holdInfo?: {
    isHold: boolean; // 홀드 상태 여부
    holdStartDate: Date | null; // 홀드 시작일
    holdEndDate: Date | null; // 홀드 종료일 (예정일)
    holdReason?: string; // 홀드 사유
    totalHoldDays: number; // 총 홀드 일수 (자동 계산)
    originalEndDate?: Date | null; // 원래 종료일 (홀드 시 백업)
  } | null;
  
  notes?: string; // 비고
  relatedPaymentId?: string; // 연관된 결제 ID (기존 호환성)
}

// ==================== 새로운 개선된 스키마 ====================

// 주문 인터페이스
export interface Order extends DBRecord {
  memberId: string;
  memberName: string;
  branchId: string;
  branchName: string;
  coach: string;
  coachName: string;
  
  // 주문 상품 정보
  orderItems: Array<{
    productId: string;
    productName: string;
    programId: string;
    programName: string;
    programType: string;
    price: number;
    quantity: number;
  }>;
  
  // 금액 정보
  totalAmount: number;        // 총 주문 금액
  paidAmount: number;         // 총 지불 금액
  unpaidAmount: number;       // 총 미수 금액
  pointsUsed: number;         // 사용된 포인트
  pointsEarned: number;       // 적립된 포인트 (초과금)
  
  // 상태 정보
  orderStatus: 'pending' | 'completed' | 'partially_paid' | 'cancelled';
  orderType: 'registration' | 'course_enrollment' | 'product_purchase';
  
  memo?: string;
}

// 포인트 거래 관련 상품 정보
export interface PointTransactionProduct {
  productId: string;
  productName: string;
  productPrice: number;
  courseId?: string;          // 연결된 수강 ID (상품 구매 시 생성됨)
  courseName?: string;        // 수강명
}

// 포인트 거래 인터페이스 (개선된 시스템)
export interface PointTransaction extends DBRecord {
  memberId: string;
  memberName: string;
  
  // 거래 정보
  amount: number;             // 포인트 금액 (+ 적립, - 사용)
  balance: number;            // 거래 후 잔액 (성능 최적화)
  transactionType: 'earn' | 'use' | 'expire' | 'adjust' | 'refund';
  
  // 관련 정보
  relatedOrderId?: string;    // 관련 주문 ID
  relatedPaymentId?: string;  // 관련 결제 ID (기존 호환성)
  
  // 추적 정보 강화
  products?: PointTransactionProduct[];  // 관련 상품 정보 (복수 가능)
  branchId?: string;          // 지점 정보
  branchName?: string;        // 지점명
  staffId?: string;           // 담당 직원 ID
  staffName?: string;         // 담당 직원명
  
  // 포인트 정책
  earnedDate?: Date;          // 적립일 (사용/만료 추적용)
  expiryDate?: Date;          // 만료일
  isExpired: boolean;         // 만료 여부
  
  source: string;             // 포인트 발생 출처
  description?: string;
  
  // FIFO 처리를 위한 추가 필드
  originalTransactionId?: string; // 원본 적립 거래 ID (사용/만료 시)
}

// 포인트 잔액 인터페이스 (성능 최적화용)
export interface PointBalance extends DBRecord {
  memberId: string;
  
  // 실시간 잔액 정보
  totalBalance: number;       // 총 사용가능 포인트
  earnedPoints: number;       // 총 적립 포인트
  usedPoints: number;         // 총 사용 포인트
  expiredPoints: number;      // 총 만료 포인트
  
  // 만료 예정 포인트 (성능 최적화)
  expiringIn30Days: number;   // 30일 내 만료 예정
  expiringIn7Days: number;    // 7일 내 만료 예정
  
  lastUpdated: Date;          // 마지막 업데이트 시간
}

// 스케줄 이벤트 인터페이스 (이벤트 소싱 방식)
export interface ScheduleEvent extends DBRecord {
  title: string;
  startTime: Date;
  endTime: Date;
  staffId: string;
  staffName: string;
  programId?: string;
  programName?: string;
  memberId?: string;
  memberName?: string;
  type: 'class' | 'personal' | 'meeting' | 'break' | 'holiday' | 'consultation' | 'other';
  color?: string;
  description?: string;
  branchId?: string;
  branchName?: string;
  recurrenceRule?: string; // RRULE for recurring events
  sourceType: 'manual' | 'weekly_holiday' | 'booking' | 'period_enrollment'; // 이벤트 생성 출처
  sourceId?: string; // 원본 데이터 ID (WeeklyHolidaySettings ID 등)
  reservationMemo?: string; // 예약 전용 메모 (회원 remarks와 별도)
  
  // 횟수제 수강권 연결 (이벤트 소싱용)
  enrollmentId?: string; // 횟수제 수강권 ID (일반 예약만 해당)
  status: 'active' | 'cancelled' | 'completed' | 'noshow'; // 예약 상태 (히스토리 추적용)
}

// 중복 체크 결과 타입
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateField?: string;
  message?: string;
}

// 로그인 ID 중복 체크 결과 타입
export interface LoginIdDuplicateCheckResult {
  isDuplicate: boolean;
  duplicateType?: 'staff' | 'member';
  message?: string;
}

// 포인트 통계 타입
export interface PointStats {
  totalEarned: number;
  totalUsed: number;
  totalExpired: number;
  currentBalance: number;
  transactionCount: number;
}

// 미수 메타 정보 타입
export interface UnpaidMetaInfo {
  unpaidMemberCount: number;
  totalUnpaidAmount: number;
}

// 주문 처리 데이터 타입
export interface OrderProcessingData {
  memberInfo: {
    id: string;
    name: string;
    branchId: string;
    branchName: string;
    coach: string;
    coachName: string;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    programId: string;
    programName: string;
    programType: string;
    // 기간제 상품의 경우 추가 정보
    startDate?: Date;
    endDate?: Date;
    duration?: number; // 일 단위
    // 횟수제 상품의 경우 추가 정보
    sessions?: number; // 수업 횟수
    // 가격 정보
    originalPrice?: number; // 계산되기 전 원래 가격
    appliedPrice?: number; // 실제 적용된 가격
  }>;
  payments: {
    cash: number;
    card: number;
    transfer: number;
    points: number;
    bonusPointsEnabled?: boolean; // 보너스 포인트 활성화 여부
  };
  orderType: 'registration' | 'course_enrollment' | 'asset_assignment';
}

// 운동처방서 관련 타입들
export interface BodyImagePoint {
  id: string;
  x: number; // 좌표 x (%)
  y: number; // 좌표 y (%)
  memo: string; // 메모
  color?: string; // 점 색상 (기본: 빨강)
}

export interface ExercisePrescriptionMedicalHistory {
  musculoskeletal: boolean; // 근골격계질환
  cardiovascular: boolean; // 심혈관계질환
  diabetes: boolean; // 당뇨
  osteoporosis: boolean; // 골다공증
  thyroid: boolean; // 갑상선
  varicose: boolean; // 정맥류
  arthritis: boolean; // 관절염
}

export interface ExercisePrescription extends DBRecord {
  memberId: string;
  memberName: string; // 조회 성능을 위해 저장
  
  // 기본 신체 정보
  height: string; // 키
  weight: string; // 체중
  footSize: string; // 발사이즈
  
  // 의료 정보
  medications: string; // 복용중인 약
  medicalHistory: ExercisePrescriptionMedicalHistory; // 병력사항
  painHistory: string; // 통증 히스토리 및 운동목적
  
  // 신체 이미지 점찍기 정보
  bodyImages: {
    front: BodyImagePoint[]; // 정면 이미지 점들
    spine: BodyImagePoint[]; // 척추 이미지 점들
    back: BodyImagePoint[]; // 후면 이미지 점들
  };
  
  // 서명 정보
  signatureData: string; // 서명 이미지 데이터 (base64)
  signedAt: Date | null; // 서명한 날짜 (최초 서명만 기록)
  
  // 메타 정보
  isActive: boolean;
  prescriptionDate: Date; // 처방서 작성일
  version: number; // 버전 번호 (히스토리 관리용)
  isLatest: boolean; // 최신 버전 여부
}

// 추천 포인트 설정 인터페이스
export interface ReferralPointSettings extends DBRecord {
  branchId: string; // 지점 ID
  branchName: string; // 지점명 (조회 성능을 위해 저장)
  referrerPoints: number; // 추천한 사람이 받는 포인트
  referredPoints: number; // 추천받은 사람이 받는 포인트
  isActive: boolean; // 활성/비활성 상태
}