import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, type Member } from '../../../utils/indexedDB';
import Modal from '../../../components/Modal';
import CustomDropdown from '../../../components/CustomDropdown';
import MemberSearchPanel from './MemberSearchPanel';

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
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const RightPanel = styled.div`
  flex: 1;
  padding-left: 24px;
  min-width: 0;
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

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  overflow-y: auto;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  display: block;
  ${AppTextStyles.body1}
  font-weight: 600;
  color: ${AppColors.onSurface};
  text-align: left;
  margin-bottom: 8px;
`;

const RequiredMark = styled.span`
  color: ${AppColors.error};
  margin-left: 4px;
`;

const AmountInput = styled.input`
  padding: 12px 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  text-align: right;
  height: 48px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
    font-weight: normal;
  }
`;

const TextInput = styled.input`
  padding: 12px 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 12px;
  font-size: 14px;
  height: 48px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
  }
`;

const PaymentSummary = styled.div`
  padding: 16px;
  background: #e3f2fd;
  border-radius: 8px;
  border: 1px solid ${AppColors.primary};
  
  .summary-title {
    font-weight: 600;
    margin-bottom: 12px;
    color: ${AppColors.primary};
  }
  
  .summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    
    &.total {
      border-top: 1px solid ${AppColors.primary};
      padding-top: 8px;
      font-weight: 600;
      font-size: 16px;
    }
  }
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

const BonusInfo = styled.div`
  padding: 12px;
  background: #e8f5e8;
  border: 1px solid ${AppColors.success};
  border-radius: 8px;
  font-size: 14px;
  color: ${AppColors.success};
  
  .bonus-title {
    font-weight: 600;
    margin-bottom: 4px;
  }
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

interface PaymentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedMember?: Member | null; // 미리 선택된 회원
}

const PaymentRegistrationModal: React.FC<PaymentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedMember = null
}) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberPointBalance, setMemberPointBalance] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [amount, setAmount] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 미리 선택된 회원이 있으면 설정하고 포인트 잔액 로드
  useEffect(() => {
    if (preselectedMember && isOpen) {
      handleMemberSelect(preselectedMember);
    }
  }, [preselectedMember, isOpen]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      // 미리 선택된 회원이 없는 경우에만 초기화
      if (!preselectedMember) {
        setSelectedMember(null);
        setMemberPointBalance(0);
      }
      setPaymentMethod('cash');
      setAmount('');
      setMemo('');
      setIsProcessing(false);
    }
  }, [isOpen, preselectedMember]);

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

  // 금액 포맷팅
  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    return numericValue ? parseInt(numericValue).toLocaleString() : '';
  };

  // 금액 입력 처리
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setAmount(value);
  };

  // 보너스 포인트 계산
  const calculateBonus = (baseAmount: number) => {
    if (baseAmount >= 1000000) {
      const millionUnits = Math.floor(baseAmount / 1000000);
      return millionUnits * 100000; // 100만원당 10만원(10%) 보너스
    }
    return 0;
  };

  // 결제 등록 처리
  const handleSubmit = async () => {
    if (!selectedMember) {
      toast.error('회원을 선택해주세요.');
      return;
    }

    if (!amount || parseInt(amount) <= 0) {
      toast.error('유효한 금액을 입력해주세요.');
      return;
    }

    const baseAmount = parseInt(amount);
    const bonusAmount = calculateBonus(baseAmount);
    const totalAmount = baseAmount + bonusAmount;

    setIsProcessing(true);
    try {
      // 1. 결제 정보 기록 생성
      const paymentId = await dbManager.addPayment({
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        branchId: selectedMember.branchId,
        branchName: selectedMember.branchName,
        coach: selectedMember.coach,
        coachName: selectedMember.coachName,
        products: [], // 상품 없음
        totalAmount: baseAmount,
        paidAmount: baseAmount,
        unpaidAmount: 0,
        paymentStatus: 'completed',
        paymentMethod: paymentMethod,
        paymentDate: new Date(),
        paymentType: 'other',
        amount: baseAmount,
        memo: memo || `현장 결제 등록 - ${paymentMethod} ${baseAmount.toLocaleString()}원`
      });

      // 2. 기본 포인트 적립
      await dbManager.point.addPointTransaction({
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        amount: baseAmount,
        transactionType: 'earn',
        relatedOrderId: undefined,
        relatedPaymentId: paymentId,
        products: [],
        branchId: selectedMember.branchId,
        branchName: selectedMember.branchName,
        staffId: selectedMember.coach,
        staffName: selectedMember.coachName,
        earnedDate: new Date(),
        isExpired: false,
        source: '현장결제',
        description: `현장 결제 등록 - ${paymentMethod} ${baseAmount.toLocaleString()}원${memo ? ` (${memo})` : ''}`
      });

      // 3. 보너스 포인트 적립 (100만원 이상인 경우)
      if (bonusAmount > 0) {
        await dbManager.point.addPointTransaction({
          memberId: selectedMember.id,
          memberName: selectedMember.name,
          amount: bonusAmount,
          transactionType: 'earn',
          relatedOrderId: undefined,
          relatedPaymentId: paymentId,
          products: [],
          branchId: selectedMember.branchId,
          branchName: selectedMember.branchName,
          staffId: selectedMember.coach,
          staffName: selectedMember.coachName,
          earnedDate: new Date(),
          isExpired: false,
          source: '보너스포인트',
          description: `현장 결제 등록 보너스 포인트 (${baseAmount.toLocaleString()}원 → ${Math.floor(baseAmount / 1000000)}개 100만원 단위)`
        });
      }

      const successMessage = bonusAmount > 0 
        ? `현장 결제가 등록되었습니다!\n결제금액: ${baseAmount.toLocaleString()}원\n기본 포인트: ${baseAmount.toLocaleString()}원\n보너스 포인트: ${bonusAmount.toLocaleString()}원\n총 적립: ${totalAmount.toLocaleString()}원`
        : `현장 결제가 등록되었습니다!\n결제금액: ${baseAmount.toLocaleString()}원\n포인트 적립: ${baseAmount.toLocaleString()}원`;

      toast.success(successMessage);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('현장 결제 등록 실패:', error);
      toast.error('현장 결제 등록 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 모달 닫기 처리
  const handleClose = () => {
    if (isProcessing) return;
    onClose();
  };

  const paymentMethodOptions = [
    { value: 'cash', label: '현금' },
    { value: 'card', label: '카드' },
    { value: 'transfer', label: '계좌이체' }
  ];

  const baseAmount = amount ? parseInt(amount) : 0;
  const bonusAmount = calculateBonus(baseAmount);
  const totalAmount = baseAmount + bonusAmount;
  const isValid = selectedMember && baseAmount > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      width="min(95vw, 1000px)"
      header="현장 결제 등록"
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
              <FormContainer>
                {/* 결제 방식 */}
                <FormGroup>
                  <Label>
                    결제 방식<RequiredMark>*</RequiredMark>
                  </Label>
                  <CustomDropdown
                    value={paymentMethod}
                    onChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'transfer')}
                    options={paymentMethodOptions}
                    placeholder="결제 방식 선택"
                    inModal={true}
                  />
                </FormGroup>

                {/* 금액 */}
                <FormGroup>
                  <Label>
                    금액<RequiredMark>*</RequiredMark>
                  </Label>
                  <AmountInput
                    type="text"
                    value={formatAmount(amount)}
                    onChange={handleAmountChange}
                    placeholder="금액을 입력하세요"
                  />
                </FormGroup>

                {/* 메모 */}
                <FormGroup>
                  <Label>메모</Label>
                  <TextInput
                    value={memo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemo(e.target.value)}
                    placeholder="추가 메모 (선택사항)"
                  />
                </FormGroup>

                {/* 100만원 이상일 때 보너스 정보 표시 */}
                {bonusAmount > 0 && (
                  <BonusInfo>
                    <div className="bonus-title">🎉 보너스 포인트 적용!</div>
                    <div>100만원 단위마다 10% 추가 적립됩니다.</div>
                  </BonusInfo>
                )}

                {/* 적립 요약 */}
                {baseAmount > 0 && (
                  <PaymentSummary>
                    <div className="summary-title">결제 및 포인트 적립 요약</div>
                    <div className="summary-item">
                      <span>결제 금액</span>
                      <span>{baseAmount.toLocaleString()}원</span>
                    </div>
                    <div className="summary-item">
                      <span>기본 포인트 적립</span>
                      <span>{baseAmount.toLocaleString()}원</span>
                    </div>
                    {bonusAmount > 0 && (
                      <div className="summary-item">
                        <span>보너스 포인트 ({Math.floor(baseAmount / 1000000)}개 100만원 단위)</span>
                        <span>{bonusAmount.toLocaleString()}원</span>
                      </div>
                    )}
                    <div className="summary-item total">
                      <span>총 포인트 적립</span>
                      <span>{totalAmount.toLocaleString()}원</span>
                    </div>
                  </PaymentSummary>
                )}
              </FormContainer>
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
            onClick={handleSubmit} 
            disabled={!isValid || isProcessing}
          >
            {isProcessing ? '등록 중...' : '현장 결제 등록'}
          </Button>
        </ButtonGroup>
      }
    />
  );
};

export default PaymentRegistrationModal;