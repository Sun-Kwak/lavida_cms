import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CMSRootLayout from '../../components/CMSRootLayout';
import CMSLogin from './Login';
import AdminManagementPage from './AdminManagement';
import TermsPage from './Terms';

// 직원관리 페이지들
import StaffRegister from './Staff/StaffRegister';
import StaffSearch from './Staff/StaffSearch';

// 회원관리 페이지들
import MemberRegister from './Member/MemberRegister';
import MemberSearch from './Member/MemberSearch';
import MemberCourseHistory from './Member/CourseHistory';
import MemberPaymentHistory from './Member/MemberPaymentHistory';
import MemberPointHistory from './Member/MemberPointHistory';
import MemberExercisePrescriptionHistory from './Member/MemberExercisePrescriptionHistory';

// 프로그램 페이지들
import ProgramManagement from './Program/ProgramManagement';
import ProductManagement from './Program/ProductManagement';

// 예약/스케줄 페이지
import ReservationPage from './Reservation';

// 약관/문서 페이지들
import PrivacyPolicy from './Terms/PrivacyPolicy';
import ServiceTerms from './Terms/ServiceTerms';
import MembershipTerms from './Terms/MembershipTerms';
import BusinessInfo from './Terms/BusinessInfo';
import MarketingConsent from './Terms/MarketingConsent';
import Contract from './Terms/Contract';

// 자산 페이지들
import LockerManagement from './Assets/LockerManagement';

// 설정 페이지
import SettingsPage from './Settings';

// 임시 페이지 컴포넌트들 (나중에 실제 페이지로 교체)
const ExerciseAssessmentPage = () => <div>평가 등록 페이지</div>;
const ExerciseBodyAnalysisPage = () => <div>체형 분석 페이지</div>;
const ExerciseGaitPressurePage = () => <div>보행/족저압 페이지</div>;
const ExerciseProgramPage = () => <div>프로그램 배정 페이지</div>;
const ExerciseQRCardPage = () => <div>QR 카드 출력 페이지</div>;

const RelaxingBedAssignPage = () => <div>베드 배정 페이지</div>;
const RelaxingTimerPage = () => <div>타이머 페이지</div>;
const RelaxingSessionManagePage = () => <div>회차권 관리 페이지</div>;
const RelaxingConditionNotePage = () => <div>컨디션 노트 페이지</div>;
const RelaxingTodayStatusPage = () => <div>금일 현황 페이지</div>;

const PaymentRegisterPage = () => <div>결제 등록 페이지</div>;
const PaymentPointChargePage = () => <div>포인트 충전 페이지</div>;
const PaymentRefundPage = () => <div>환불/조정 페이지</div>;
const PaymentReceiptPage = () => <div>영수증 보내기 페이지</div>;
const PaymentSalesDashboardPage = () => <div>매출 대시보드 페이지</div>;

const NotificationSMSPage = () => <div>단문 보내기 페이지</div>;
const NotificationReservationRemindPage = () => <div>예약 리마인드 페이지</div>;
const NotificationBirthdayDormantPage = () => <div>생일/휴면 페이지</div>;
const NotificationCouponPage = () => <div>쿠폰 발송 페이지</div>;
const NotificationTemplatePage = () => <div>템플릿 관리 페이지</div>;

const StatisticsPeriodPage = () => <div>일/주/월 통계 페이지</div>;
const StatisticsCoachKPIPage = () => <div>코치별 KPI 페이지</div>;
const StatisticsRemainingSessionPage = () => <div>잔여 세션 페이지</div>;
const StatisticsChurnRiskPage = () => <div>이탈 위험 페이지</div>;
const StatisticsNPSPage = () => <div>NPS 설문 페이지</div>;

const SettingsProgramPricePage = () => <div>프로그램/가격 페이지</div>;
const SettingsChannelIntegrationPage = () => <div>채널 연동 페이지</div>;
const SettingsDataBackupPage = () => <div>데이터 백업 페이지</div>;

const CMSRoutes: React.FC = () => {
  return (
    <CMSRootLayout>
      <Routes>
        <Route path="/login" element={<CMSLogin />} />
        
        {/* 직원관리 */}
        <Route path="/staff/register" element={<StaffRegister />} />
        <Route path="/staff/search" element={<StaffSearch />} />
        
        {/* 회원관리 */}
        <Route path="/member/register" element={<MemberRegister />} />
        <Route path="/member/search" element={<MemberSearch />} />
        <Route path="/member/course-history" element={<MemberCourseHistory />} />
        <Route path="/member/payment-history" element={<MemberPaymentHistory />} />
        <Route path="/member/point-history" element={<MemberPointHistory />} />
        <Route path="/member/exercise-prescription-history" element={<MemberExercisePrescriptionHistory />} />
        
        {/* 프로그램 */}
        <Route path="/program/management" element={<ProgramManagement />} />
        <Route path="/program/product" element={<ProductManagement />} />
        
        {/* 예약/스케줄 */}
        <Route path="/reservation" element={<ReservationPage />} />
        <Route path="/reservation/new" element={<ReservationPage />} />
        <Route path="/reservation/timetable" element={<ReservationPage />} />
        <Route path="/reservation/batch" element={<ReservationPage />} />
        <Route path="/reservation/waiting" element={<ReservationPage />} />
        <Route path="/reservation/auto-remind" element={<ReservationPage />} />
        <Route path="/reservation/program/:programId" element={<ReservationPage />} />
        
        {/* 약관/문서 */}
        <Route path="/terms/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms/service" element={<ServiceTerms />} />
        <Route path="/terms/membership" element={<MembershipTerms />} />
        <Route path="/terms/business" element={<BusinessInfo />} />
        <Route path="/terms/marketing" element={<MarketingConsent />} />
        <Route path="/terms/contract" element={<Contract />} />
        
        {/* 자산 */}
        <Route path="/assets/locker" element={<LockerManagement />} />
        
        {/* 운동처방 */}
        <Route path="/exercise/assessment" element={<ExerciseAssessmentPage />} />
        <Route path="/exercise/body-analysis" element={<ExerciseBodyAnalysisPage />} />
        <Route path="/exercise/gait-pressure" element={<ExerciseGaitPressurePage />} />
        <Route path="/exercise/program" element={<ExerciseProgramPage />} />
        <Route path="/exercise/qr-card" element={<ExerciseQRCardPage />} />
        
        {/* 릴렉싱 */}
        <Route path="/relaxing/bed-assign" element={<RelaxingBedAssignPage />} />
        <Route path="/relaxing/timer" element={<RelaxingTimerPage />} />
        <Route path="/relaxing/session-manage" element={<RelaxingSessionManagePage />} />
        <Route path="/relaxing/condition-note" element={<RelaxingConditionNotePage />} />
        <Route path="/relaxing/today-status" element={<RelaxingTodayStatusPage />} />
        
        {/* 결제/포인트 */}
        <Route path="/payment/register" element={<PaymentRegisterPage />} />
        <Route path="/payment/point-charge" element={<PaymentPointChargePage />} />
        <Route path="/payment/refund" element={<PaymentRefundPage />} />
        <Route path="/payment/receipt" element={<PaymentReceiptPage />} />
        <Route path="/payment/sales-dashboard" element={<PaymentSalesDashboardPage />} />
        
        {/* 알림/문자 */}
        <Route path="/notification/sms" element={<NotificationSMSPage />} />
        <Route path="/notification/reservation-remind" element={<NotificationReservationRemindPage />} />
        <Route path="/notification/birthday-dormant" element={<NotificationBirthdayDormantPage />} />
        <Route path="/notification/coupon" element={<NotificationCouponPage />} />
        <Route path="/notification/template" element={<NotificationTemplatePage />} />
        
        {/* 통계/리포트 */}
        <Route path="/statistics/period" element={<StatisticsPeriodPage />} />
        <Route path="/statistics/coach-kpi" element={<StatisticsCoachKPIPage />} />
        <Route path="/statistics/remaining-session" element={<StatisticsRemainingSessionPage />} />
        <Route path="/statistics/churn-risk" element={<StatisticsChurnRiskPage />} />
        <Route path="/statistics/nps" element={<StatisticsNPSPage />} />
        
        {/* 설정 */}
        <Route path="/settings/staff-permission" element={<SettingsPage />} />
        <Route path="/settings/program-price" element={<SettingsProgramPricePage />} />
        <Route path="/settings/channel-integration" element={<SettingsChannelIntegrationPage />} />
        <Route path="/settings/data-backup" element={<SettingsDataBackupPage />} />
        
        {/* 기존 페이지들 */}
        <Route path="/admin" element={<AdminManagementPage />} />
        <Route path="/terms" element={<TermsPage />} />
        
        {/* 기본 리다이렉트 */}
        <Route path="/" element={<Navigate to="/cms/member/search" replace />} />
        <Route path="*" element={<Navigate to="/cms/member/search" replace />} />
      </Routes>
    </CMSRootLayout>
  );
};

export default CMSRoutes;
