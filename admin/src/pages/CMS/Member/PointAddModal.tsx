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
  height: auto;
  min-height: 500px;
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

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 12px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
  }
`;

const PointSummary = styled.div`
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

const InfoCard = styled.div`
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  font-size: 14px;
  color: ${AppColors.onSurface};
  
  .info-title {
    font-weight: 600;
    margin-bottom: 4px;
    color: ${AppColors.primary};
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

interface PointAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedMember?: Member | null; // 미리 선택된 회원
}

const PointAddModal: React.FC<PointAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedMember = null
}) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberPointBalance, setMemberPointBalance] = useState<number>(0);
  const [pointType, setPointType] = useState<'earned' | 'adjusted'>('earned');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
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
      setPointType('earned');
      setAmount('');
      setDescription('');
      setSource('');
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
    const numericValue = value.replace(/[^\d-]/g, '');
    if (numericValue === '' || numericValue === '-') return numericValue;
    return parseInt(numericValue).toLocaleString();
  };

  // 금액 입력 처리
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d-]/g, '');
    setAmount(value);
  };

  // 포인트 추가 처리
  const handleSubmit = async () => {
    if (!selectedMember) {
      toast.error('회원을 선택해주세요.');
      return;
    }

    if (!amount || parseInt(amount) === 0) {
      toast.error('유효한 포인트 금액을 입력해주세요.');
      return;
    }

    if (!source.trim()) {
      toast.error('포인트 출처를 입력해주세요.');
      return;
    }

    if (!description.trim()) {
      toast.error('포인트 설명을 입력해주세요.');
      return;
    }

    const pointAmount = parseInt(amount);
    const isNegative = pointAmount < 0;

    // 음수 포인트인 경우 잔액 확인
    if (isNegative && Math.abs(pointAmount) > memberPointBalance) {
      toast.error(`포인트 잔액이 부족합니다. (현재 잔액: ${memberPointBalance.toLocaleString()}원)`);
      return;
    }

    setIsProcessing(true);
    try {
      // 포인트 트랜잭션 추가
      await dbManager.point.addPointTransaction({
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        amount: pointAmount,
        transactionType: pointAmount > 0 ? 'earn' : 'adjust',
        relatedOrderId: undefined,
        relatedPaymentId: undefined,
        products: [],
        branchId: selectedMember.branchId,
        branchName: selectedMember.branchName,
        staffId: selectedMember.coach,
        staffName: selectedMember.coachName,
        earnedDate: new Date(),
        isExpired: false,
        source: source.trim(),
        description: description.trim()
      });

      const actionText = isNegative ? '차감' : '적립';
      toast.success(`포인트 ${actionText}이 완료되었습니다. (${pointAmount > 0 ? '+' : ''}${pointAmount.toLocaleString()}원)`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('포인트 추가 실패:', error);
      toast.error('포인트 추가 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 모달 닫기 처리
  const handleClose = () => {
    if (isProcessing) return;
    onClose();
  };

  const pointTypeOptions = [
    { value: 'earned', label: '포인트 적립' },
    { value: 'adjusted', label: '포인트 조정' }
  ];

  const pointAmount = amount ? parseInt(amount) : 0;
  const isValid = selectedMember && pointAmount !== 0 && source.trim() && description.trim();
  const isNegative = pointAmount < 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      width="min(95vw, 1000px)"
      header="포인트 추가/조정"
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
            <PanelTitle>포인트 정보</PanelTitle>
            {!selectedMember ? (
              <WarningText>
                먼저 왼쪽에서 회원을 선택해주세요.
              </WarningText>
            ) : (
              <FormContainer>
                {/* 포인트 타입 */}
                <FormGroup>
                  <Label>
                    포인트 타입<RequiredMark>*</RequiredMark>
                  </Label>
                  <CustomDropdown
                    value={pointType}
                    onChange={(value) => setPointType(value as 'earned' | 'adjusted')}
                    options={pointTypeOptions}
                    placeholder="포인트 타입 선택"
                    inModal={true}
                  />
                </FormGroup>

                {/* 포인트 금액 */}
                <FormGroup>
                  <Label>
                    포인트 금액<RequiredMark>*</RequiredMark>
                  </Label>
                  <AmountInput
                    type="text"
                    value={formatAmount(amount)}
                    onChange={handleAmountChange}
                    placeholder="포인트 금액 입력 (음수 입력 시 차감)"
                  />
                  <InfoCard>
                    <div className="info-title">💡 입력 안내</div>
                    <div>• 양수: 포인트 적립 (+100,000)</div>
                    <div>• 음수: 포인트 차감 (-50,000)</div>
                  </InfoCard>
                </FormGroup>

                {/* 포인트 출처 */}
                <FormGroup>
                  <Label>
                    포인트 출처<RequiredMark>*</RequiredMark>
                  </Label>
                  <TextInput
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="예: 이벤트 참여, 고객 불만 보상, 시스템 오류 수정 등"
                  />
                </FormGroup>

                {/* 상세 설명 */}
                <FormGroup>
                  <Label>
                    상세 설명<RequiredMark>*</RequiredMark>
                  </Label>
                  <TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="포인트 추가/차감 사유를 상세히 입력해주세요"
                  />
                </FormGroup>

                {/* 포인트 요약 */}
                {pointAmount !== 0 && (
                  <PointSummary>
                    <div className="summary-title">포인트 변경 요약</div>
                    <div className="summary-item">
                      <span>현재 포인트 잔액</span>
                      <span>{memberPointBalance.toLocaleString()}원</span>
                    </div>
                    <div className="summary-item">
                      <span>{isNegative ? '차감' : '적립'} 포인트</span>
                      <span style={{ color: isNegative ? '#dc3545' : '#28a745' }}>
                        {pointAmount > 0 ? '+' : ''}{pointAmount.toLocaleString()}원
                      </span>
                    </div>
                    <div className="summary-item total">
                      <span>변경 후 예상 잔액</span>
                      <span>{(memberPointBalance + pointAmount).toLocaleString()}원</span>
                    </div>
                  </PointSummary>
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
            {isProcessing ? '처리 중...' : '포인트 추가'}
          </Button>
        </ButtonGroup>
      }
    />
  );
};

export default PointAddModal;