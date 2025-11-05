import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import Modal from '../../../components/Modal';
import { dbManager, type Member } from '../../../utils/indexedDB';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import MemberSearchPanel from './MemberSearchPanel';
import CoursePaymentPanel from './CoursePaymentPanel';

const ModalContainer = styled.div`
  display: flex;
  /* gap: 24px; */
  height: 600px;
  min-width: 900px;
  width: 100%;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  flex: 1;
  border-right: 1px solid ${AppColors.borderLight};
  padding-right: 24px;
  min-width: 0; /* 플렉스 아이템이 축소될 수 있도록 */
  display: flex;
  flex-direction: column;
`;

const RightPanel = styled.div`
  flex: 1;
  padding-left: 24px;
  min-width: 0; /* 플렉스 아이템이 축소될 수 있도록 */
  display: flex;
  flex-direction: column;
`;

const PanelTitle = styled.h3`
  ${AppTextStyles.title3}
  margin-bottom: 16px;
  color: ${AppColors.onBackground};
  border-bottom: 2px solid ${AppColors.primary};
  padding-bottom: 8px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border: ${props => props.variant === 'secondary' ? `1px solid ${AppColors.borderLight}` : 'none'};
  border-radius: 8px;
  background: ${props => props.variant === 'secondary' ? AppColors.surface : AppColors.primary};
  color: ${props => props.variant === 'secondary' ? AppColors.onSurface : AppColors.onPrimary};
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const WarningText = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  margin: 16px 0;
  color: #856404;
  font-size: 14px;
  text-align: center;
`;

interface Product {
  id: string;
  name: string;
  originalPrice?: number; // DB에서 가져온 기본 가격
  basePrice?: number; // 기준 가격
  price: number; // 상품금액 (계산될 정확한 금액)
  appliedPrice?: number; // 적용금액 (사용자가 조정할 수 있는 최종 금액)
  description?: string;
  programType?: string; // '기간제' | '횟수제'
  // 기간제 관련
  duration?: number; // 기간(일)
  baseDuration?: number; // 기준 기간
  months?: number; // 개월수
  baseMonths?: number; // 기준 개월수
  startDate?: Date;
  endDate?: Date;
  // 횟수제 관련
  sessions?: number; // 수업 횟수
  baseSessions?: number; // 기준 횟수
}

interface PaymentInfo {
  selectedProducts: Product[];
  paymentMethod: string;
  receivedAmount?: number;
  pointPayment?: number; // 포인트로 결제할 금액
}

interface CourseRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedMember?: Member | null; // 미리 선택된 회원
}

const CourseRegistrationModal: React.FC<CourseRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedMember = null
}) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberPointBalance, setMemberPointBalance] = useState<number>(0);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    selectedProducts: [],
    paymentMethod: 'card',
    receivedAmount: 0,
    pointPayment: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // 미리 선택된 회원이 있으면 설정하고 포인트 잔액 로드
  useEffect(() => {
    if (preselectedMember && isOpen) {
      handleMemberSelect(preselectedMember);
    }
  }, [preselectedMember, isOpen]);

  // 회원 선택 시 포인트 잔액 로드
  const handleMemberSelect = async (member: Member) => {
    setSelectedMember(member);
    try {
      const pointBalance = await dbManager.getMemberPointBalance(member.id);
      setMemberPointBalance(pointBalance);
    } catch (error) {
      console.error('포인트 잔액 조회 실패:', error);
      setMemberPointBalance(0);
    }
  };

  // 결제 정보 업데이트
  const handlePaymentUpdate = (updates: Partial<PaymentInfo>) => {
    setPaymentInfo(prev => ({ ...prev, ...updates }));
  };

  // 수강 등록 처리 - 개선된 통합 주문 방식
  const handleRegisterCourse = async () => {
    if (!selectedMember) {
      toast.error('회원을 선택해주세요.');
      return;
    }

    if (paymentInfo.selectedProducts.length === 0) {
      toast.error('등록할 상품을 선택해주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      const totalAmount = paymentInfo.selectedProducts.reduce((sum, product) => 
        sum + (product.appliedPrice || product.price), 0);
      const pointPayment = paymentInfo.pointPayment || 0;
      const cashPayment = paymentInfo.receivedAmount || 0; // 현금/카드로 받은 금액
      const totalReceived = pointPayment + cashPayment; // 총 받은 금액

      // 포인트 결제가 잔액을 초과하는지 확인
      if (pointPayment > memberPointBalance) {
        toast.error(`포인트 잔액이 부족합니다. (잔액: ${memberPointBalance.toLocaleString()}원)`);
        return;
      }

      // 총 받은 금액이 총 결제 금액을 초과하는지 확인
      if (totalReceived > totalAmount) {
        const excessAmount = totalReceived - totalAmount;
        
        // 보너스 포인트 계산
        let confirmMessage = `총 받은 금액이 결제 금액보다 ${excessAmount.toLocaleString()}원 많습니다.\n초과 금액은 포인트로 적립됩니다.`;
        
        if (excessAmount >= 1000000) {
          const millionUnits = Math.floor(excessAmount / 1000000);
          const bonusPoints = millionUnits * 100000;
          confirmMessage += `\n\n🎁 보너스 혜택: 추가 ${bonusPoints.toLocaleString()}원 더 적립됩니다!`;
          confirmMessage += `\n(${millionUnits}개 100만원 단위 × 10만원 보너스)`;
        }
        
        confirmMessage += `\n\n계속 진행하시겠습니까?`;
        
        const confirmed = window.confirm(confirmMessage);
        if (!confirmed) return;
      }

      // 상품 정보 조회 및 준비
      const orderProducts = [];
      for (const product of paymentInfo.selectedProducts) {
        const dbProduct = await dbManager.getProductById(product.id);
        if (!dbProduct) {
          throw new Error(`상품 정보를 찾을 수 없습니다: ${product.name}`);
        }
        
        orderProducts.push({
          id: product.id,
          name: product.name,
          price: product.appliedPrice || product.price, // 적용금액 사용
          programId: dbProduct.programId,
          programName: dbProduct.programName,
          programType: dbProduct.programType
        });
      }

      // 통합 주문 처리 실행
      const orderId = await dbManager.processOrderWithPayments({
        memberInfo: {
          id: selectedMember.id,
          name: selectedMember.name,
          branchId: selectedMember.branchId,
          branchName: selectedMember.branchName,
          coach: selectedMember.coach,
          coachName: selectedMember.coachName
        },
        products: orderProducts,
        payments: {
          cash: paymentInfo.paymentMethod === 'cash' ? cashPayment : 0,
          card: paymentInfo.paymentMethod === 'card' ? cashPayment : 0,
          transfer: paymentInfo.paymentMethod === 'transfer' ? cashPayment : 0,
          points: pointPayment
        },
        orderType: 'course_enrollment'
      });

      console.log(`수강 등록 통합 주문 처리 완료 - 주문 ID: ${orderId}`);
      toast.success(`수강 등록이 완료되었습니다. (주문 ID: ${orderId.slice(-8)})`);
      onSuccess();
      onClose();

    } catch (error) {
      console.error('수강 등록 실패:', error);
      toast.error('수강 등록 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 모달 닫기 처리
  const handleClose = () => {
    if (isProcessing) return;
    
    // 미리 선택된 회원이 없는 경우에만 초기화
    if (!preselectedMember) {
      setSelectedMember(null);
      setMemberPointBalance(0);
    }
    setPaymentInfo({
      selectedProducts: [],
      paymentMethod: 'card',
      receivedAmount: 0,
      pointPayment: 0
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      width="min(95vw, 1000px)"
      header="새 수강 등록"
      disableOutsideClick={true}
      body={
        <ModalContainer>
          <LeftPanel>
            <PanelTitle>회원 검색 및 선택</PanelTitle>
            <MemberSearchPanel
              selectedMember={selectedMember}
              onMemberSelect={handleMemberSelect}
              memberPointBalance={memberPointBalance}
              preselectedMember={preselectedMember}
              readonly={!!preselectedMember}
            />
          </LeftPanel>
          
          <RightPanel>
            <PanelTitle>결제 정보</PanelTitle>
            {!selectedMember ? (
              <WarningText>
                먼저 왼쪽에서 회원을 선택해주세요.
              </WarningText>
            ) : (
              <CoursePaymentPanel
                selectedMember={selectedMember}
                memberPointBalance={memberPointBalance}
                paymentInfo={paymentInfo}
                onPaymentUpdate={handlePaymentUpdate}
              />
            )}
          </RightPanel>
        </ModalContainer>
      }
      footer={
        <ButtonGroup>
          <Button variant="secondary" onClick={handleClose} disabled={isProcessing}>
            취소
          </Button>
          <Button 
            onClick={handleRegisterCourse} 
            disabled={isProcessing || !selectedMember || paymentInfo.selectedProducts.length === 0}
          >
            {isProcessing ? '등록 중...' : '수강 등록'}
          </Button>
        </ButtonGroup>
      }
    />
  );
};

export default CourseRegistrationModal;