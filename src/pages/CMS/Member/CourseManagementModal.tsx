import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, type Member, type CourseEnrollment } from '../../../utils/indexedDB';
import Modal from '../../../components/Modal';
import { TextField } from '../../../components/TextField';
import DataTable, { type TableColumn } from '../../../components/DataTable';
import CustomDropdown from '../../../components/CustomDropdown';

interface CourseManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseEnrollment: CourseEnrollment | null;
}

type TabType = 'transfer' | 'hold' | 'extend';

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 0;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 4px;
  border-bottom: 2px solid ${AppColors.borderLight};
  margin-bottom: 20px;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 20px;
  border: none;
  background: ${props => props.$active ? AppColors.primary : 'transparent'};
  color: ${props => props.$active ? AppColors.onPrimary : AppColors.onSurface};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  ${AppTextStyles.title3};
  color: ${AppColors.onSurface};
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid ${AppColors.borderLight};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px;
  background: ${AppColors.surface};
  border-radius: 8px;
  border: 1px solid ${AppColors.borderLight};
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${AppColors.onInput1};
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: ${AppColors.onSurface};
  font-weight: 500;
`;

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MemberTableContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border-radius: 8px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 12px 18px;
  border: ${props => 
    props.variant === 'secondary' ? `1px solid ${AppColors.borderLight}` : 
    props.variant === 'danger' ? `1px solid #d32f2f` : 'none'
  };
  border-radius: 8px;
  background: ${props => 
    props.variant === 'secondary' ? AppColors.surface : 
    props.variant === 'danger' ? '#d32f2f' : AppColors.primary
  };
  color: ${props => 
    props.variant === 'secondary' ? AppColors.onSurface : AppColors.onPrimary
  };
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

const WarningText = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  color: #856404;
  font-size: 14px;
  line-height: 1.4;
`;

const SmallTextField = styled(TextField)`
  width: 120px;
`;

const InputRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: end;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    switch (props.$status) {
      case 'active': return '#e8f5e8';
      case 'hold': return '#fff3e0';
      case 'completed': return '#e3f2fd';
      case 'cancelled': return '#ffebee';
      default: return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'active': return '#2e7d32';
      case 'hold': return '#ef6c00';
      case 'completed': return '#1976d2';
      case 'cancelled': return '#d32f2f';
      default: return '#666';
    }
  }};
`;

const PaymentSection = styled.div`
  padding: 16px;
  background: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  margin-top: 16px;
`;

const PaymentRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const PaymentLabel = styled.label`
  min-width: 80px;
  font-size: 14px;
  font-weight: 600;
  color: ${AppColors.onSurface};
`;

const PaymentInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
  
  &:disabled {
    background: #f5f5f5;
    color: #999;
  }
`;

const FeeInfo = styled.div`
  background: #e3f2fd;
  border: 1px solid #93c5fd;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  font-size: 14px;
  color: #1e40af;
  
  .fee-amount {
    font-weight: 600;
    font-size: 16px;
    color: ${AppColors.primary};
  }
`;

const BalanceInfo = styled.div`
  font-size: 12px;
  color: ${AppColors.onInput1};
  margin-top: 4px;
`;

const CourseManagementModal: React.FC<CourseManagementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  courseEnrollment
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('transfer');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memo, setMemo] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // 홀드 관련 상태
  const [holdReason, setHoldReason] = useState<string>('');
  
  // 연장 관련 상태
  const [extendDays, setExtendDays] = useState<number>(30);
  const [extendReason, setExtendReason] = useState<string>('');
  
  // 양도 결제 관련 상태
  const [transferPaymentMethod, setTransferPaymentMethod] = useState<string>('card');
  const [pointPayment, setPointPayment] = useState<number>(0);
  const [receiverPointBalance, setReceiverPointBalance] = useState<number>(0);

  // 수강권 유형에 따른 탭 필터링
  const getAvailableTabs = useCallback((): TabType[] => {
    const tabs: TabType[] = [];
    
    // 홀드 상태가 아닌 경우에만 양도 가능
    if (courseEnrollment?.enrollmentStatus !== 'hold') {
      tabs.push('transfer');
    }
    
    if (courseEnrollment?.programType === '기간제') {
      tabs.push('hold');
      
      // 홀드 상태가 아닌 경우에만 연장 가능
      if (courseEnrollment?.enrollmentStatus !== 'hold') {
        tabs.push('extend');
      }
    }
    
    return tabs;
  }, [courseEnrollment?.programType, courseEnrollment?.enrollmentStatus]);

  // 양도 수수료 계산 (적용금액의 10%)
  const getTransferFee = useCallback((): number => {
    if (!courseEnrollment?.appliedPrice) return 0;
    return Math.floor(courseEnrollment.appliedPrice * 0.1);
  }, [courseEnrollment?.appliedPrice]);

  // 탭명 반환
  const getTabLabel = (tab: TabType): string => {
    switch (tab) {
      case 'transfer': return '양도';
      case 'hold': return '홀드';
      case 'extend': return '연장';
      default: return '';
    }
  };

  // 회원 목록 로드
  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      const allMembers = await dbManager.getAllMembers();
      
      // 현재 수강생 제외 (자기 자신에게는 양도 불가)
      const filteredMembers = allMembers.filter(member => 
        member.id !== courseEnrollment?.memberId && member.isActive
      );
      
      setMembers(filteredMembers);
      setFilteredMembers(filteredMembers);
    } catch (error) {
      console.error('회원 목록 로드 실패:', error);
      toast.error('회원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [courseEnrollment?.memberId]);

  useEffect(() => {
    if (isOpen) {
      // 첫 번째 가능한 탭을 기본값으로 설정
      const availableTabs = getAvailableTabs();
      setActiveTab(availableTabs[0]);
      
      // 양도 탭에서만 회원 목록 로드
      if (availableTabs.includes('transfer')) {
        loadMembers();
      }
    }
  }, [isOpen, loadMembers, getAvailableTabs]);

  // 검색 필터링
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(query) ||
        member.phone.includes(query) ||
        member.email.toLowerCase().includes(query)
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchQuery, members]);

  // 양도 결제 처리
  const processTransferPayment = async (selectedMember: Member, transferFee: number): Promise<void> => {
    const cashPayment = Math.max(0, transferFee - pointPayment);
    
    // 1. 포인트 사용 처리 (있는 경우)
    if (pointPayment > 0) {
      await dbManager.point.usePointsFIFO(
        selectedMember.id,
        pointPayment,
        `transfer_${courseEnrollment?.id}`,
        `수강권 양도 수수료 포인트 결제`
      );
    }

    // 2. 현금/카드/계좌이체 결제 기록 생성 (실제 현금 흐름이 있는 경우만)
    if (cashPayment > 0) {
      await dbManager.payment.addPayment({
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        branchId: selectedMember.branchId,
        branchName: selectedMember.branchName,
        coach: selectedMember.coach,
        coachName: selectedMember.coachName,
        products: [{
          id: 'transfer_fee',
          name: '수강권 양도 수수료',
          price: cashPayment, // 실제 현금성 결제 금액만
          quantity: 1,
          description: `${courseEnrollment?.productName} 양도 수수료`
        }],
        totalAmount: cashPayment, // 실제 현금성 결제 금액
        paidAmount: cashPayment,
        unpaidAmount: 0,
        paymentStatus: 'completed',
        paymentMethod: transferPaymentMethod,
        paymentDate: new Date(),
        paymentType: 'other',
        amount: cashPayment,
        memo: `수강권 양도 수수료 - ${courseEnrollment?.productName} (총 수수료: ${transferFee.toLocaleString()}원${pointPayment > 0 ? `, 포인트 사용: ${pointPayment.toLocaleString()}원` : ''})`
      });
    }
  };

  const handleMemberSelect = async (member: Member) => {
    setSelectedMember(member);
    
    // 선택된 회원의 포인트 잔액 로드
    try {
      const balance = await dbManager.point.getMemberPointBalanceV2(member.id);
      setReceiverPointBalance(balance);
    } catch (error) {
      console.error('포인트 잔액 조회 실패:', error);
      setReceiverPointBalance(0);
    }
  };

  // 양도 처리
  const handleTransfer = async () => {
    if (!courseEnrollment || !selectedMember) {
      toast.error('양도할 수강권과 양도받을 회원을 선택해주세요.');
      return;
    }

    const transferFee = getTransferFee();

    // 결제 검증
    if (pointPayment > receiverPointBalance) {
      toast.error('포인트 잔액이 부족합니다.');
      return;
    }

    try {
      setIsProcessing(true);

      // 1. 양도 수수료 결제 처리
      if (transferFee > 0) {
        await processTransferPayment(selectedMember, transferFee);
      }

      // 2. 기존 수강 이력 종료 처리
      const updatedOriginalEnrollment: CourseEnrollment = {
        ...courseEnrollment,
        enrollmentStatus: 'cancelled',
        completedSessions: 0,
        notes: `${courseEnrollment.notes || ''}\n[양도] ${new Date().toLocaleDateString()} ${selectedMember.name}님에게 양도 (수수료: ${transferFee.toLocaleString()}원)`.trim()
      };

      await dbManager.updateCourseEnrollment(courseEnrollment.id, updatedOriginalEnrollment);

      // 3. 새로운 수강 이력 생성
      const newEnrollment: Omit<CourseEnrollment, 'id' | 'createdAt' | 'updatedAt'> = {
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        productId: courseEnrollment.productId,
        productName: courseEnrollment.productName,
        productPrice: courseEnrollment.productPrice,
        appliedPrice: courseEnrollment.appliedPrice,
        programId: courseEnrollment.programId,
        programName: courseEnrollment.programName,
        programType: courseEnrollment.programType,
        branchId: selectedMember.branchId,
        branchName: selectedMember.branchName,
        coach: selectedMember.coach,
        coachName: selectedMember.coachName,
        enrollmentStatus: 'active',
        paidAmount: courseEnrollment.paidAmount,
        unpaidAmount: courseEnrollment.unpaidAmount,
        startDate: new Date(),
        endDate: courseEnrollment.endDate,
        sessionCount: courseEnrollment.sessionCount,
        completedSessions: courseEnrollment.completedSessions || 0,
        notes: `[양도받음] ${new Date().toLocaleDateString()} ${courseEnrollment.memberName}님으로부터 양도받음 (수수료 지불: ${transferFee.toLocaleString()}원)${memo ? `\n${memo}` : ''}`
      };

      await dbManager.addCourseEnrollment(newEnrollment);
      
      const successMessage = `수강권이 성공적으로 ${selectedMember.name}님에게 양도되었습니다.${transferFee > 0 ? `\n양도 수수료: ${transferFee.toLocaleString()}원` : ''}`;
      toast.success(successMessage);
      
      onSuccess();
      handleClose();

    } catch (error) {
      console.error('수강권 양도 실패:', error);
      toast.error('수강권 양도 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 홀드 시작
  const handleStartHold = async () => {
    if (!courseEnrollment) {
      toast.error('수강권 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setIsProcessing(true);
      await dbManager.startHold(courseEnrollment.id, holdReason);
      toast.success('홀드가 시작되었습니다.');
      
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('홀드 시작 실패:', error);
      toast.error(error instanceof Error ? error.message : '홀드 시작 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 홀드 종료
  const handleEndHold = async () => {
    if (!courseEnrollment) {
      toast.error('수강권 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setIsProcessing(true);
      await dbManager.endHold(courseEnrollment.id);
      toast.success('홀드가 종료되고 수강 기간이 자동으로 연장되었습니다.');
      
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('홀드 종료 실패:', error);
      toast.error(error instanceof Error ? error.message : '홀드 종료 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 기간 연장
  const handleExtend = async () => {
    if (!courseEnrollment) {
      toast.error('수강권 정보를 찾을 수 없습니다.');
      return;
    }

    if (extendDays <= 0) {
      toast.error('연장 기간은 1일 이상이어야 합니다.');
      return;
    }

    try {
      setIsProcessing(true);
      await dbManager.extendCourse(courseEnrollment.id, extendDays, extendReason);
      toast.success(`수강 기간이 ${extendDays}일 연장되었습니다.`);
      
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('기간 연장 실패:', error);
      toast.error(error instanceof Error ? error.message : '기간 연장 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedMember(null);
    setMemo('');
    setHoldReason('');
    setExtendDays(30);
    setExtendReason('');
    // 양도 관련 상태 초기화
    setTransferPaymentMethod('card');
    setPointPayment(0);
    setReceiverPointBalance(0);
    onClose();
  };

  // 수강권 상태 텍스트
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active': return '수강중';
      case 'hold': return '홀드';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      case 'unpaid': return '미수';
      default: return status;
    }
  };

  // 홀드 정보 포맷팅
  const formatHoldInfo = () => {
    const holdInfo = courseEnrollment?.holdInfo;
    if (!holdInfo?.isHold) return null;

    const startDate = holdInfo.holdStartDate ? new Date(holdInfo.holdStartDate).toLocaleDateString() : '';
    const days = holdInfo.totalHoldDays || 0;
    
    return `${startDate}부터 홀드 시작 (총 ${days}일)`;
  };

  // 회원 테이블 컬럼 정의
  const memberColumns: TableColumn<Member>[] = [
    {
      key: 'name',
      title: '회원명',
      width: '120px'
    },
    {
      key: 'phone',
      title: '연락처',
      width: '130px'
    },
    {
      key: 'branchName',
      title: '지점',
      width: '100px'
    },
    {
      key: 'coachName',
      title: '담당코치',
      width: '100px'
    },
    {
      key: 'action',
      title: '선택',
      width: '80px',
      align: 'center' as const,
      render: (value, record) => (
        <Button
          variant={selectedMember?.id === record.id ? 'primary' : 'secondary'}
          onClick={() => handleMemberSelect(record)}
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          {selectedMember?.id === record.id ? '선택됨' : '선택'}
        </Button>
      )
    }
  ];

  if (!courseEnrollment) return null;

  const availableTabs = getAvailableTabs();

  // 기본 정보 섹션
  const renderBasicInfo = () => (
    <Section>
      <SectionTitle>수강권 정보</SectionTitle>
      <InfoGrid>
        <InfoItem>
          <InfoLabel>회원명</InfoLabel>
          <InfoValue>{courseEnrollment.memberName}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>상품명</InfoLabel>
          <InfoValue>{courseEnrollment.productName}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>프로그램</InfoLabel>
          <InfoValue>{courseEnrollment.programName} ({courseEnrollment.programType})</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>진행상황</InfoLabel>
          <InfoValue>
            {courseEnrollment.programType === '횟수제' && courseEnrollment.sessionCount ? 
              `${courseEnrollment.completedSessions || 0}/${courseEnrollment.sessionCount}회 완료` :
              courseEnrollment.endDate ? 
                `${new Date(courseEnrollment.endDate).toLocaleDateString()}까지` : 
                '기간제'
            }
          </InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>잔여 미수금</InfoLabel>
          <InfoValue style={{ color: courseEnrollment.unpaidAmount > 0 ? '#d32f2f' : AppColors.primary }}>
            {courseEnrollment.unpaidAmount.toLocaleString()}원
          </InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>수강 상태</InfoLabel>
          <InfoValue>
            <StatusBadge $status={courseEnrollment.enrollmentStatus}>
              {getStatusText(courseEnrollment.enrollmentStatus)}
            </StatusBadge>
            {courseEnrollment.holdInfo?.isHold && (
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#ef6c00' }}>
                {formatHoldInfo()}
              </div>
            )}
          </InfoValue>
        </InfoItem>
      </InfoGrid>
    </Section>
  );

  // 양도 탭 내용
  const renderTransferContent = () => {
    const transferFee = getTransferFee();
    const cashPayment = Math.max(0, transferFee - pointPayment);
    
    return (
      <>
        <Section>
          <SectionTitle>양도받을 회원 선택</SectionTitle>
          <SearchContainer>
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="회원명, 연락처, 이메일로 검색..."
            />
            
            <MemberTableContainer>
              <DataTable
                columns={memberColumns}
                data={filteredMembers}
                loading={loading}
                emptyText="검색된 회원이 없습니다"
                emptyDescription="다른 검색어로 시도해보세요"
                pagination={{
                  enabled: false
                }}
              />
            </MemberTableContainer>
          </SearchContainer>
        </Section>

        {/* 양도 수수료 및 결제 정보 */}
        {selectedMember && (
          <Section>
            <SectionTitle>양도 수수료 결제</SectionTitle>
            
            <FeeInfo>
              <div>양도 수수료 (상품 적용금액의 10%)</div>
              <div className="fee-amount">{transferFee.toLocaleString()}원</div>
            </FeeInfo>

            <PaymentSection>
              <PaymentRow>
                <PaymentLabel>결제방법</PaymentLabel>
                <CustomDropdown
                  value={transferPaymentMethod}
                  onChange={setTransferPaymentMethod}
                  options={[
                    { value: 'card', label: '카드' },
                    { value: 'cash', label: '현금' },
                    { value: 'transfer', label: '계좌이체' }
                  ]}
                  inModal={true}
                />
              </PaymentRow>

              <PaymentRow>
                <PaymentLabel>포인트 사용</PaymentLabel>
                <PaymentInput
                  type="number"
                  value={pointPayment}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(parseInt(e.target.value) || 0, Math.min(transferFee, receiverPointBalance)));
                    setPointPayment(value);
                  }}
                  placeholder="0"
                  max={Math.min(transferFee, receiverPointBalance)}
                />
                <span style={{ minWidth: '20px', fontSize: '14px' }}>원</span>
              </PaymentRow>
              <BalanceInfo>사용 가능 포인트: {receiverPointBalance.toLocaleString()}원</BalanceInfo>

              <PaymentRow>
                <PaymentLabel>{transferPaymentMethod === 'card' ? '카드' : transferPaymentMethod === 'cash' ? '현금' : '계좌이체'}</PaymentLabel>
                <PaymentInput
                  type="number"
                  value={cashPayment}
                  readOnly
                  style={{ background: '#f5f5f5' }}
                />
                <span style={{ minWidth: '20px', fontSize: '14px' }}>원</span>
              </PaymentRow>
            </PaymentSection>
          </Section>
        )}

        <Section>
          <SectionTitle>양도 관련 메모</SectionTitle>
          <TextField
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="양도 관련 메모 (선택사항)"
            multiline
          />
        </Section>

        <WarningText>
          <strong>⚠️ 양도 시 주의사항</strong><br />
          • 양도 수수료는 양도받는 회원이 결제합니다.<br />
          • 양도 후에는 취소할 수 없습니다.<br />
          • 기존 회원의 수강 이력은 '취소' 상태로 변경됩니다.<br />
          • 양도받는 회원의 지점과 담당 코치로 자동 변경됩니다.<br />
          • 진행된 수업 횟수는 그대로 유지됩니다.<br />
          • 미수금이 있는 경우 양도받는 회원이 승계합니다.
        </WarningText>
      </>
    );
  };

  // 홀드 탭 내용
  const renderHoldContent = () => {
    const isCurrentlyHold = courseEnrollment.enrollmentStatus === 'hold';
    
    return (
      <>
        <Section>
          <SectionTitle>{isCurrentlyHold ? '홀드 종료' : '홀드 시작'}</SectionTitle>
          
          {isCurrentlyHold ? (
            <>
              <WarningText>
                <strong>🔄 홀드 종료 안내</strong><br />
                • 홀드를 종료하면 홀드 기간만큼 수강 종료일이 자동으로 연장됩니다.<br />
                • 홀드 시작일: {courseEnrollment.holdInfo?.holdStartDate ? 
                  new Date(courseEnrollment.holdInfo.holdStartDate).toLocaleDateString() : '알 수 없음'}<br />
                • 홀드 사유: {courseEnrollment.holdInfo?.holdReason || '없음'}<br />
                • 현재까지 홀드 기간: {courseEnrollment.holdInfo?.holdStartDate ? 
                  Math.ceil((new Date().getTime() - new Date(courseEnrollment.holdInfo.holdStartDate).getTime()) / (1000 * 60 * 60 * 24)) : 0}일
              </WarningText>
              
              <div style={{ 
                padding: '12px', 
                background: '#fff3e0', 
                borderRadius: '8px',
                fontSize: '14px',
                color: '#ef6c00',
                marginTop: '16px'
              }}>
                ⚠️ <strong>홀드 상태 제한사항</strong><br />
                • 홀드 중에는 양도 및 연장이 불가능합니다.<br />
                • 수업 참여가 제한됩니다.<br />
                • 홀드를 종료하시면 다시 정상 이용이 가능합니다.
              </div>
            </>
          ) : (
            <>
              <TextField
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="홀드 사유를 입력하세요 (선택사항)"
                multiline
              />
              
              <WarningText>
                <strong>⏸️ 홀드 시작 안내</strong><br />
                • 홀드 시작 시 수강 상태가 '홀드'로 변경됩니다.<br />
                • 홀드 종료 시 홀드 기간만큼 수강 종료일이 자동으로 연장됩니다.<br />
                • 홀드 중에는 수업 참여가 불가능합니다.<br />
                • 홀드 중에는 양도 및 연장 기능이 제한됩니다.
              </WarningText>
            </>
          )}
        </Section>
      </>
    );
  };

  // 연장 탭 내용
  const renderExtendContent = () => (
    <>
      <Section>
        <SectionTitle>수강 기간 연장</SectionTitle>
        
        <InputRow>
          <SmallTextField
            type="number"
            value={extendDays.toString()}
            onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
            placeholder="연장 일수"
          />
          <span style={{ color: AppColors.onSurface, fontSize: '14px' }}>일</span>
        </InputRow>
        
        <TextField
          value={extendReason}
          onChange={(e) => setExtendReason(e.target.value)}
          placeholder="연장 사유를 입력하세요 (선택사항)"
          multiline
        />
        
        {courseEnrollment.endDate && (
          <div style={{ 
            padding: '12px', 
            background: '#e8f5e8', 
            borderRadius: '8px',
            fontSize: '14px',
            color: '#2e7d32'
          }}>
            <strong>연장 후 종료일 예상:</strong> {' '}
            {new Date(new Date(courseEnrollment.endDate).getTime() + extendDays * 24 * 60 * 60 * 1000)
              .toLocaleDateString()}
          </div>
        )}
        
        <WarningText>
          <strong>⏰ 연장 안내</strong><br />
          • 현재 종료일에서 입력된 일수만큼 연장됩니다.<br />
          • 연장 이력은 비고란에 자동으로 기록됩니다.<br />
          • 홀드 중인 수강권은 연장할 수 없습니다.
        </WarningText>
      </Section>
    </>
  );

  // 푸터 버튼
  const renderFooterButtons = () => {
    const cancelButton = (
      <Button variant="secondary" onClick={handleClose} disabled={isProcessing}>
        취소
      </Button>
    );

    switch (activeTab) {
      case 'transfer':
        const transferFee = getTransferFee();
        const isTransferValid = selectedMember && pointPayment <= receiverPointBalance;
        
        return (
          <>
            {cancelButton}
            <Button 
              onClick={handleTransfer} 
              disabled={isProcessing || !isTransferValid}
            >
              {isProcessing ? '처리 중...' : `양도 확인 (수수료: ${transferFee.toLocaleString()}원)`}
            </Button>
          </>
        );
      
      case 'hold':
        const isCurrentlyHold = courseEnrollment.enrollmentStatus === 'hold';
        return (
          <>
            {cancelButton}
            <Button 
              variant={isCurrentlyHold ? 'primary' : 'danger'}
              onClick={isCurrentlyHold ? handleEndHold : handleStartHold}
              disabled={isProcessing}
            >
              {isProcessing ? '처리 중...' : isCurrentlyHold ? '홀드 종료' : '홀드 시작'}
            </Button>
          </>
        );
      
      case 'extend':
        return (
          <>
            {cancelButton}
            <Button 
              onClick={handleExtend} 
              disabled={isProcessing || extendDays <= 0 || courseEnrollment.enrollmentStatus === 'hold'}
            >
              {isProcessing ? '처리 중...' : `${extendDays}일 연장`}
            </Button>
          </>
        );
      
      default:
        return cancelButton;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      width="min(95vw, 800px)"
      header="수강권 관리"
      body={
        <ModalContent>
          {/* 기본 정보 (항상 표시) */}
          {renderBasicInfo()}

          {/* 탭 네비게이션 */}
          <TabContainer>
            {availableTabs.map(tab => (
              <Tab
                key={tab}
                $active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                disabled={isProcessing}
              >
                {getTabLabel(tab)}
              </Tab>
            ))}
          </TabContainer>

          {/* 탭 내용 */}
          {activeTab === 'transfer' && renderTransferContent()}
          {activeTab === 'hold' && renderHoldContent()}
          {activeTab === 'extend' && renderExtendContent()}
        </ModalContent>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          {renderFooterButtons()}
        </div>
      }
    />
  );
};

export default CourseManagementModal;