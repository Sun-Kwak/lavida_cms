// 회원 등록 관련 타입 정의

export interface AddressInfo {
  address: string;        // 전체 주소
  sigunguCode: string;    // 시군구 코드
  dong: string;           // 동 정보
  roadAddress: string;    // 도로명 주소
  jibunAddress: string;   // 지번 주소
}

export interface BasicInfo {
  name: string;
  phone: string;
  email: string;
  birth: string;
  gender: string;
  addressInfo: AddressInfo;
}

// 카카오 주소 API 응답 타입
export interface KakaoAddressDocument {
  address_name: string;
  address_type: string;
  x: string;
  y: string;
  address: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    region_3depth_h_name: string;
    h_code: string;
    b_code: string;
    mountain_yn: string;
    main_address_no: string;
    sub_address_no: string;
    x: string;
    y: string;
  };
  road_address?: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    road_name: string;
    underground_yn: string;
    main_building_no: string;
    sub_building_no: string;
    building_name: string;
    zone_no: string;
    x: string;
    y: string;
  };
}

export interface KakaoAddressResponse {
  documents: KakaoAddressDocument[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

export interface JoinInfo {
  branchId: string;
  coach: string;
  joinPath: string;
  referrerId?: string; // 지인추천인 회원 ID (지인추천일 때만)
  referrerName?: string; // 지인추천인 회원 이름 (지인추천일 때만)
  loginId: string;
  loginPassword: string | null; // 공란 가능
  enableLogin: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number; // 상품금액 (기간/횟수에 따라 계산된 정상 가격)
  description?: string;
  programType?: string; // '횟수제' | '기간제'
  duration?: number; // 기간제 상품의 기간 (일 단위)
  sessions?: number; // 횟수제 상품의 수업 횟수
  startDate?: Date; // 시작일 (기간제의 경우)
  endDate?: Date; // 종료일 (기간제의 경우)
  originalPrice?: number; // 원래 기본 가격 (기준)
  basePrice?: number; // 기준 가격 (30일 또는 기준 횟수 기준)
  baseDuration?: number; // 기준 기간 (일 단위, 기간제용)
  baseSessions?: number; // 기준 횟수 (횟수제용)
  appliedPrice?: number; // 적용금액 (실제 받을 금액, 사용자가 수정 가능)
}

export interface PaymentInfo {
  selectedProducts: Product[];
  paymentMethod: string;
  receivedAmount?: number; // 받은금액 (총 결제금액과 다를 수 있음)
  pointPayment?: number; // 포인트 결제 금액
}

export interface Agreement {
  id: string;
  title: string;
  content: string;
  required: boolean;
  agreed: boolean;
}

export interface AgreementInfo {
  agreements: Agreement[];
  customerSignature: string;
  staffSignature: string;
}

export interface MemberFormData {
  basicInfo: BasicInfo;
  joinInfo: JoinInfo;
  paymentInfo: PaymentInfo;
  agreementInfo: AgreementInfo;
}

export interface StepProps {
  formData: MemberFormData;
  onUpdate: (data: Partial<MemberFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isValid: boolean;
  onValidateAndNext?: () => Promise<void>;
  onErrorsChange?: (errors: { [key: string]: string }) => void;
}
