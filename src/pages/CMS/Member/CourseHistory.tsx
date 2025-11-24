import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, type CourseEnrollment } from '../../../utils/indexedDB';
import { getCompletedSessions } from '../../../utils/db/ReservationHelper';
import { SearchArea, type PeriodOption } from '../../../components/SearchArea';
import UnpaidFilter from '../../../components/SearchArea/UnpaidFilterButton';
import Modal from '../../../components/Modal';
import CustomDropdown from '../../../components/CustomDropdown';
import DataTable, { type TableColumn } from '../../../components/DataTable';
import CourseRegistrationModal from './CourseRegistrationModal';
import CourseManagementModal from './CourseManagementModal';

const PageContainer = styled.div`
  width: 100%;
`;

const StatusBadge = styled.span<{ $status: 'active' | 'completed' | 'suspended' | 'cancelled' | 'unpaid' | 'hold'; $clickable?: boolean }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.$status) {
      case 'completed': return '#e7f5e7';
      case 'active': return '#e3f2fd';
      case 'suspended': return '#fff3e0';
      case 'cancelled': return '#fce4ec';
      case 'unpaid': return '#fff2f2';
      case 'hold': return '#fff3e0';
      default: return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'completed': return '#2d5a2d';
      case 'active': return '#1565c0';
      case 'suspended': return '#ef6c00';
      case 'cancelled': return '#c2185b';
      case 'unpaid': return '#8b1538';
      case 'hold': return '#ef6c00';
      default: return '#424242';
    }
  }};
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s;
  
  &:hover {
    opacity: ${props => props.$clickable ? 0.8 : 1};
    transform: ${props => props.$clickable ? 'translateY(-1px)' : 'none'};
  }
`;

const ProgressInfo = styled.div`
  font-size: 12px;
  color: ${AppColors.onInput1};
  margin-top: 4px;
`;

const PriceInfo = styled.div`
  text-align: right;
`;

const PaidAmount = styled.div`
  color: ${AppColors.primary};
  font-weight: 600;
`;

const UnpaidAmount = styled.div<{ $hasUnpaid: boolean }>`
  color: ${props => props.$hasUnpaid ? '#d32f2f' : AppColors.onInput1};
  font-size: 12px;
  margin-top: 2px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 18px;
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

const ModalContent = styled.div`
  text-align: left;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${AppColors.borderLight};
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: ${AppColors.onBackground};
`;

const InfoValue = styled.span`
  color: ${AppColors.onInput1};
`;

const ModalUnpaidAmount = styled.span`
  color: #d32f2f;
  font-weight: 600;
  font-size: 16px;
`;

const WarningText = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  color: #856404;
  font-size: 14px;
  text-align: center;
`;

const TransferBadge = styled.span<{ $type: 'transferred' | 'received' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  background: ${props => props.$type === 'transferred' ? '#fff3e0' : '#e8f5e8'};
  color: ${props => props.$type === 'transferred' ? '#ef6c00' : '#2e7d32'};
  border: 1px solid ${props => props.$type === 'transferred' ? '#ffcc02' : '#81c784'};
  margin-bottom: 2px;
`;

const MemberNameContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CourseHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 기간 선택 관련 상태
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('1month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // 미수 필터 관련 상태
  const [showUnpaidOnly, setShowUnpaidOnly] = useState<boolean>(false);
  const [unpaidMetaInfo, setUnpaidMetaInfo] = useState<{ unpaidCourseCount: number; totalUnpaidAmount: number }>({
    unpaidCourseCount: 0,
    totalUnpaidAmount: 0
  });
  
  // 완료 처리 모달 관련 상태
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<CourseEnrollment | null>(null);
  
  // 세션 정보 캐시 (enrollmentId -> progressInfo)
  const [enrollmentSessions, setEnrollmentSessions] = useState<Map<string, string>>(new Map());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');

  // 새 수강 등록 모달 관련 상태
  const [showRegistrationModal, setShowRegistrationModal] = useState<boolean>(false);

  // 양도 모달 관련 상태
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [selectedForTransfer, setSelectedForTransfer] = useState<CourseEnrollment | null>(null);

  // 새 수강 등록 성공 처리
  const handleRegistrationSuccess = async () => {
    // 데이터 새로고침
    await loadCourseEnrollments();
    // 현재 검색 조건으로 다시 필터링
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  // 새 수강 등록 모달 열기
  const handleOpenRegistrationModal = () => {
    setShowRegistrationModal(true);
  };

  // 새 수강 등록 모달 닫기
  const handleCloseRegistrationModal = () => {
    setShowRegistrationModal(false);
  };

  // 양도 모달 열기
  const handleOpenTransferModal = (enrollment: CourseEnrollment) => {
    setSelectedForTransfer(enrollment);
    setShowTransferModal(true);
  };

  // 양도 모달 닫기
  const handleCloseTransferModal = () => {
    setShowTransferModal(false);
    setSelectedForTransfer(null);
  };

  // 양도 성공 처리
  const handleTransferSuccess = async () => {
    // 데이터 새로고침
    await loadCourseEnrollments();
    // 현재 검색 조건으로 다시 필터링
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  // 미수 메타정보 로드
  const loadUnpaidMetaInfo = useCallback(async () => {
    try {
      const allEnrollments = await dbManager.getAllCourseEnrollments();
      const unpaidEnrollments = allEnrollments.filter(e => e.enrollmentStatus === 'unpaid');
      const unpaidCourseCount = unpaidEnrollments.length;
      const totalUnpaidAmount = unpaidEnrollments.reduce((sum, e) => sum + (e.unpaidAmount || 0), 0);
      
      setUnpaidMetaInfo({ unpaidCourseCount, totalUnpaidAmount });
    } catch (error) {
      console.error('미수 메타정보 로드 실패:', error);
    }
  }, []);

  // 진행상황 계산 함수
  const getProgressInfo = useCallback(async (enrollment: CourseEnrollment): Promise<string> => {
    if (enrollment.programType === '횟수제' && enrollment.sessionCount) {
      // 이벤트 소싱: 실시간 완료 횟수 계산
      const completedSessions = await getCompletedSessions(enrollment.id);
      const remaining = enrollment.sessionCount - completedSessions;
      return `${remaining}/${enrollment.sessionCount}회 남음`;
    } else if (enrollment.programType === '기간제' && enrollment.endDate) {
      const today = new Date();
      const endDate = new Date(enrollment.endDate);
      const timeDiff = endDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysDiff > 0) {
        return `${daysDiff}일 남음`;
      } else if (daysDiff === 0) {
        return '오늘 종료';
      } else {
        return `${Math.abs(daysDiff)}일 경과`;
      }
    }
    return '진행률 미설정';
  }, []);

  // 기간별 검색 범위 계산
  const getDateRange = useCallback(() => {
    const today = new Date();
    const startDate = new Date();
    
    switch (selectedPeriod) {
      case '1month':
        startDate.setMonth(today.getMonth() - 1);
        return { start: startDate, end: today };
      case '3month':
        startDate.setMonth(today.getMonth() - 3);
        return { start: startDate, end: today };
      case '6month':
        startDate.setMonth(today.getMonth() - 6);
        return { start: startDate, end: today };
      case 'custom':
        if (customStartDate && customEndDate) {
          return { 
            start: new Date(customStartDate), 
            end: new Date(customEndDate) 
          };
        }
        // 커스텀 날짜가 설정되지 않은 경우 기본 1개월
        startDate.setMonth(today.getMonth() - 1);
        return { start: startDate, end: today };
      default:
        startDate.setMonth(today.getMonth() - 1);
        return { start: startDate, end: today };
    }
  }, [selectedPeriod, customStartDate, customEndDate]);

  // 날짜 범위 표시 문자열 생성
  const getDateRangeDisplay = useCallback(() => {
    const range = getDateRange();
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    return `${formatDate(range.start)} ~ ${formatDate(range.end)}`;
  }, [getDateRange]);

  const loadCourseEnrollments = useCallback(async (period?: PeriodOption, startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      console.log('수강 데이터 로딩 시작...');
      
      // 미수 메타정보 로드
      await loadUnpaidMetaInfo();
      
      const allEnrollments = await dbManager.getAllCourseEnrollments();
      console.log('전체 수강 이력 수:', allEnrollments.length);
      
      // 기간별 필터링 (등록일 기준) - 매개변수가 있으면 사용, 없으면 현재 상태 사용
      const currentPeriod = period ?? selectedPeriod;
      const currentStartDate = startDate ?? customStartDate;
      const currentEndDate = endDate ?? customEndDate;
      
      let dateRange: { start: Date; end: Date };
      const today = new Date();
      const rangeStartDate = new Date();
      
      switch (currentPeriod) {
        case '1month':
          rangeStartDate.setMonth(today.getMonth() - 1);
          dateRange = { start: rangeStartDate, end: today };
          break;
        case '3month':
          rangeStartDate.setMonth(today.getMonth() - 3);
          dateRange = { start: rangeStartDate, end: today };
          break;
        case '6month':
          rangeStartDate.setMonth(today.getMonth() - 6);
          dateRange = { start: rangeStartDate, end: today };
          break;
        case 'custom':
          if (currentStartDate && currentEndDate) {
            dateRange = { 
              start: new Date(currentStartDate), 
              end: new Date(currentEndDate) 
            };
          } else {
            // 커스텀 날짜가 설정되지 않은 경우 기본 1개월
            rangeStartDate.setMonth(today.getMonth() - 1);
            dateRange = { start: rangeStartDate, end: today };
          }
          break;
        default:
          rangeStartDate.setMonth(today.getMonth() - 1);
          dateRange = { start: rangeStartDate, end: today };
      }
      
      const filteredByDate = allEnrollments.filter(enrollment => {
        const enrollmentDate = new Date(enrollment.createdAt);
        return enrollmentDate >= dateRange.start && enrollmentDate <= dateRange.end;
      });
      
      console.log(`${currentPeriod} 기간 내 수강 이력:`, filteredByDate.length);
      
      // 최근 등록순으로 정렬 (createdAt 내림차순)
      const sortedEnrollments = filteredByDate.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log('=== CourseHistory 최종 데이터 설정 ===');
      console.log('sortedEnrollments 개수:', sortedEnrollments.length);
      if (sortedEnrollments.length > 0) {
        console.log('첫 번째 수강 이력:', sortedEnrollments[0]);
        console.log('=== IndexedDB 수강 이력 상세 분석 (최근 5개) ===');
        sortedEnrollments.slice(0, 5).forEach((enrollment, index) => {
          console.log(`\n[${index + 1}] ${enrollment.memberName} - ${enrollment.productName}`);
          console.log('  - programType:', enrollment.programType);
          console.log('  - startDate:', enrollment.startDate);
          console.log('  - endDate:', enrollment.endDate);
          console.log('  - createdAt:', enrollment.createdAt);
          console.log('  - sessionCount:', enrollment.sessionCount);
          console.log('  - 전체 객체:', enrollment);
        });
      }
      
      setCourseEnrollments(sortedEnrollments);
      setFilteredEnrollments(sortedEnrollments);
      
      // 세션 정보 미리 계산
      const sessionsMap = new Map<string, string>();
      for (const enrollment of sortedEnrollments) {
        const progressInfo = await getProgressInfo(enrollment);
        sessionsMap.set(enrollment.id!, progressInfo);
      }
      setEnrollmentSessions(sessionsMap);
      
      console.log('수강 이력 상태 업데이트 완료');
    } catch (error) {
      console.error('수강 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [loadUnpaidMetaInfo, selectedPeriod, customStartDate, customEndDate, getProgressInfo]);

  // 컴포넌트 마운트 시 초기 데이터 로드 (1개월 기준)
  useEffect(() => {
    const initializeData = async () => {
      await loadCourseEnrollments();
    };
    initializeData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 필터 적용 함수 (데이터 로드와 분리)
  const applyFilters = useCallback(() => {
    let filtered = courseEnrollments;
    
    // 미수 필터 적용
    if (showUnpaidOnly) {
      filtered = filtered.filter(enrollment => enrollment.enrollmentStatus === 'unpaid');
    }
    
    // 텍스트 검색
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(enrollment =>
        enrollment.memberName.toLowerCase().includes(query) ||
        enrollment.productName.toLowerCase().includes(query) ||
        enrollment.programName.toLowerCase().includes(query) ||
        enrollment.branchName.toLowerCase().includes(query) ||
        enrollment.coachName.toLowerCase().includes(query)
      );
    }
    
    setFilteredEnrollments(filtered);
  }, [courseEnrollments, showUnpaidOnly, searchQuery]);

  // 데이터나 필터 조건이 변경될 때마다 필터 적용
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleSearch = async () => {
    // 현재 선택된 조건으로 데이터를 불러옵니다
    await loadCourseEnrollments(selectedPeriod, customStartDate, customEndDate);
  };

  // 미수 상태 클릭 처리
  const handleUnpaidClick = (enrollment: CourseEnrollment) => {
    setSelectedEnrollment(enrollment);
    setSelectedPaymentMethod('card'); // 기본값을 카드로 설정
    setShowCompleteModal(true);
  };

  // 완료 처리 확인
  const handleCompletePayment = async () => {
    if (!selectedEnrollment) return;

    try {
      setIsProcessing(true);

      // 1. 수강 이력의 상태를 'completed'로 변경하고 미수금액을 0으로 설정
      const updatedEnrollment: CourseEnrollment = {
        ...selectedEnrollment,
        enrollmentStatus: 'completed',
        paidAmount: selectedEnrollment.productPrice, // 상품 전체 금액으로 설정
        unpaidAmount: 0
      };

      await dbManager.updateCourseEnrollment(selectedEnrollment.id, updatedEnrollment);

      // 2. 결제 데이터 생성 및 저장
      const paymentData = {
        memberId: selectedEnrollment.memberId,
        memberName: selectedEnrollment.memberName,
        branchId: selectedEnrollment.branchId,
        branchName: selectedEnrollment.branchName,
        coach: selectedEnrollment.coach,
        coachName: selectedEnrollment.coachName,
        paymentMethod: selectedPaymentMethod, // 사용자가 선택한 결제 방법 사용
        paymentStatus: 'completed' as const, // 완료 상태로 설정
        totalAmount: selectedEnrollment.unpaidAmount || 0, // 이번에 받는 금액
        paidAmount: selectedEnrollment.unpaidAmount || 0, // 이번에 받는 금액
        unpaidAmount: 0, // 완료 처리이므로 0
        paymentDate: new Date(),
        // 수강/자산 구분 및 연결 정보 추가
        paymentType: 'course' as const, // 'course' | 'asset' | 'other'
        relatedCourseId: selectedEnrollment.id, // 수강 이력 ID로 연결
        relatedAssetId: null, // 자산 관련 결제가 아니므로 null
        products: [{
          id: selectedEnrollment.productId,
          name: selectedEnrollment.productName,
          price: selectedEnrollment.unpaidAmount || 0, // 이번에 받는 금액
          quantity: 1,
          programId: selectedEnrollment.programId,
          programName: selectedEnrollment.programName,
          programType: selectedEnrollment.programType
        }],
        memo: `미수금 완료 처리 - ${selectedEnrollment.productName} (수강 ID: ${selectedEnrollment.id})`
      };

      await dbManager.addPayment(paymentData);

      // 결제 방법별 메시지 표시
      const paymentMethodLabels: { [key: string]: string } = {
        'card': '카드',
        'cash': '현금',
        'transfer': '계좌이체'
      };
      const paymentMethodLabel = paymentMethodLabels[selectedPaymentMethod] || '카드';
      
      toast.success(`미수금이 성공적으로 완료 처리되었습니다. (결제방법: ${paymentMethodLabel})`);
      
      // 3. 데이터 새로고침
      await loadCourseEnrollments();
      
      // 4. 현재 검색 조건으로 다시 필터링
      setTimeout(() => {
        handleSearch();
      }, 100);
      
      // 5. 모달 닫기
      setShowCompleteModal(false);
      setSelectedEnrollment(null);
      
    } catch (error) {
      console.error('완료 처리 실패:', error);
      toast.error('완료 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 모달 닫기
  const handleCloseCompleteModal = () => {
    setShowCompleteModal(false);
    setSelectedEnrollment(null);
    setSelectedPaymentMethod('card'); // 기본값으로 리셋
  };

  const formatDate = (date: Date | null | undefined) => {
    return date ? new Date(date).toLocaleDateString() : '-';
  };

  // 양도 정보 확인 함수
  const getTransferInfo = (enrollment: CourseEnrollment) => {
    if (!enrollment.notes) return null;
    
    const notes = enrollment.notes.toLowerCase();
    
    if (notes.includes('[양도]')) {
      // 양도한 경우
      const match = enrollment.notes.match(/\[양도\].*?(\d{4}\.\s*\d{1,2}\.\s*\d{1,2}).*?(.+?)님에게 양도/);
      if (match) {
        return {
          type: 'transferred' as const,
          date: match[1],
          memberName: match[2]
        };
      }
    }
    
    if (notes.includes('[양도받음]')) {
      // 양도받은 경우
      const match = enrollment.notes.match(/\[양도받음\].*?(\d{4}\.\s*\d{1,2}\.\s*\d{1,2}).*?(.+?)님으로부터 양도받음/);
      if (match) {
        return {
          type: 'received' as const,
          date: match[1],
          memberName: match[2]
        };
      }
    }
    
    return null;
  };

  // 결제 방법 옵션
  const paymentMethodOptions = [
    { value: 'card', label: '카드' },
    { value: 'cash', label: '현금' },
    { value: 'transfer', label: '계좌이체' }
  ];

  // 테이블 컬럼 정의
  const columns: TableColumn<CourseEnrollment>[] = [
    {
      key: 'memberName',
      title: '회원명',
      width: '120px',
      render: (value, record) => {
        const transferInfo = getTransferInfo(record);
        return (
          <MemberNameContainer>
            <div>{record.memberName}</div>
            {transferInfo && (
              <TransferBadge $type={transferInfo.type}>
                {transferInfo.type === 'transferred' ? 
                  `↗ ${transferInfo.memberName}님께 양도` : 
                  `↘ ${transferInfo.memberName}님께서 양도받음`
                }
              </TransferBadge>
            )}
          </MemberNameContainer>
        );
      }
    },
    {
      key: 'productName',
      title: '상품명',
      width: '180px',
      render: (value, record) => (
        <div>
          <div>{record.productName}</div>
          <div style={{ fontSize: '12px', color: AppColors.onInput1 }}>
            ID: {record.productId.slice(-8)}
          </div>
        </div>
      )
    },
    {
      key: 'programName',
      title: '프로그램',
      width: '150px',
      render: (value, record) => (
        <div>
          <div>{record.programName}</div>
          <div style={{ fontSize: '12px', color: AppColors.onInput1 }}>
            {record.programType}
          </div>
        </div>
      )
    },
    {
      key: 'productPrice',
      title: '상품금액',
      width: '100px',
      align: 'right' as const,
      render: (value, record) => (
        <div style={{ 
          textAlign: 'right',
          fontSize: '14px',
          fontWeight: '600',
          color: AppColors.onBackground
        }}>
          {record.productPrice.toLocaleString()}원
        </div>
      )
    },
    {
      key: 'progress',
      title: '진행상황',
      width: '120px',
      render: (value, record) => {
        // 취소된 수강권은 진행상황을 표시하지 않음
        if (record.enrollmentStatus === 'cancelled') {
          const transferInfo = getTransferInfo(record);
          if (transferInfo?.type === 'transferred') {
            return (
              <ProgressInfo style={{ color: '#ef6c00' }}>
                양도 완료
              </ProgressInfo>
            );
          }
          return (
            <ProgressInfo style={{ color: '#666' }}>
              취소됨
            </ProgressInfo>
          );
        }
        
        // 캐시된 세션 정보 사용
        const progressInfo = enrollmentSessions.get(record.id!) || '-';
        return (
          <ProgressInfo>
            {progressInfo}
          </ProgressInfo>
        );
      }
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
      key: 'payment',
      title: '결제정보',
      width: '140px',
      align: 'right' as const,
      render: (value, record) => (
        <PriceInfo>
          <PaidAmount>
            적용: {(record.appliedPrice || record.paidAmount).toLocaleString()}원
          </PaidAmount>
          <div style={{ fontSize: '12px', color: AppColors.onInput1, marginTop: '2px' }}>
            수납: {record.paidAmount.toLocaleString()}원
          </div>
          <UnpaidAmount $hasUnpaid={record.unpaidAmount > 0}>
            {record.unpaidAmount > 0 ? 
              `미수: ${record.unpaidAmount.toLocaleString()}원` : 
              '완납'
            }
          </UnpaidAmount>
          {record.appliedPrice && record.productPrice !== record.appliedPrice && (
            <div style={{ 
              fontSize: '11px', 
              color: record.appliedPrice > record.productPrice ? '#dc3545' : '#28a745',
              marginTop: '2px'
            }}>
              {record.appliedPrice > record.productPrice ? '추가' : '할인'}
              {record.appliedPrice > record.productPrice ? '+' : ''}
              {(record.appliedPrice - record.productPrice).toLocaleString()}원
            </div>
          )}
        </PriceInfo>
      )
    },
    {
      key: 'connection',
      title: '연결정보',
      width: '140px',
      render: (value, record) => (
        <div style={{ fontSize: '12px', color: AppColors.onInput1 }}>
          <div style={{ color: AppColors.primary, fontWeight: '600' }}>
            수강 ID: {record.id.slice(-8)}
          </div>
          <div style={{ marginTop: '2px', fontSize: '11px' }}>
            결제 이력에서 확인 가능
          </div>
        </div>
      )
    },
    {
      key: 'period',
      title: '수강기간',
      width: '140px',
      render: (value, record) => (
        <div>
          <div>{formatDate(record.startDate)}</div>
          {record.endDate && (
            <div style={{ fontSize: '12px', color: AppColors.onInput1 }}>
              ~ {formatDate(record.endDate)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'enrollmentStatus',
      title: '상태',
      width: '80px',
      align: 'center' as const,
      render: (value, record) => (
        <StatusBadge 
          $status={record.enrollmentStatus}
          $clickable={record.enrollmentStatus === 'unpaid'}
          onClick={record.enrollmentStatus === 'unpaid' ? () => handleUnpaidClick(record) : undefined}
          title={record.enrollmentStatus === 'unpaid' ? '클릭하여 완료 처리' : ''}
        >
          {(() => {
            switch (record.enrollmentStatus) {
              case 'active': return '수강중';
              case 'completed': return '완료';
              case 'suspended': return '중단';
              case 'cancelled': return '취소';
              case 'unpaid': return '미수';
              case 'hold': return '홀드';
              default: return record.enrollmentStatus;
            }
          })()}
        </StatusBadge>
      )
    }
  ];

  // 결과 카운트 정보 컴포넌트
  const resultCountInfo = (
    <>
      {showUnpaidOnly ? '미수 수강: ' : ''}{filteredEnrollments.length}건 
      (완료: {filteredEnrollments.filter(e => e.enrollmentStatus === 'completed').length}건, 
      미수: {filteredEnrollments.filter(e => e.enrollmentStatus === 'unpaid').length}건)
      <br />
      <span style={{ fontSize: '12px', color: AppColors.onInput1 }}>
        기간: {getDateRangeDisplay()} | 전체: {courseEnrollments.length}건
      </span>
    </>
  );

  if (loading) {
    return (
      <PageContainer>
        <DataTable
          title="수강 이력"
          columns={columns}
          data={[]}
          loading={true}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 새로운 SearchArea 컴포넌트 사용 */}
      <SearchArea
        leftContent={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button onClick={handleOpenRegistrationModal}>
              + 새 수강 등록
            </Button>
            <UnpaidFilter
              active={showUnpaidOnly}
              unpaidCount={unpaidMetaInfo.unpaidCourseCount}
              totalAmount={unpaidMetaInfo.totalUnpaidAmount}
              onClick={() => setShowUnpaidOnly(!showUnpaidOnly)}
            />
          </div>
        }
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartDateChange={setCustomStartDate}
        onCustomEndDateChange={setCustomEndDate}
        dateRangeDisplay={getDateRangeDisplay()}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        searchPlaceholder="회원명, 상품명, 프로그램명, 지점명, 코치명으로 검색..."
        autoSearchOnDateChange={false}
      />

      <DataTable
        title="수강 이력"
        columns={columns}
        data={filteredEnrollments}
        loading={loading}
        emptyText="수강 이력이 없습니다"
        emptyDescription="검색 조건을 변경하거나 새로운 수강생을 등록해보세요."
        resultCount={resultCountInfo}
        onRowClick={(record) => {
          // 관리 가능한 수강권만 클릭 가능 (active, unpaid, hold 상태)
          if (record.enrollmentStatus === 'active' || record.enrollmentStatus === 'unpaid' || record.enrollmentStatus === 'hold') {
            handleOpenTransferModal(record);
          }
        }}
        pagination={{
          enabled: true,
          pageSize: 15,
          pageSizeOptions: [15, 30, 100],
          showTotal: true
        }}
      />

      {/* 새 수강 등록 모달 */}
      <CourseRegistrationModal
        isOpen={showRegistrationModal}
        onClose={handleCloseRegistrationModal}
        onSuccess={handleRegistrationSuccess}
      />

      {/* 완료 처리 모달 */}
      {showCompleteModal && selectedEnrollment && (
        <Modal 
          isOpen={showCompleteModal}
          onClose={handleCloseCompleteModal}
          width="min(95vw, 500px)"
          header="미수금 완료 처리"
          body={
            <ModalContent>
              <WarningText>
                ⚠️ 미수금을 완료 처리하시겠습니까?
              </WarningText>

              <InfoRow>
                <InfoLabel>결제 방법:</InfoLabel>
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <CustomDropdown
                    value={selectedPaymentMethod}
                    onChange={setSelectedPaymentMethod}
                    options={paymentMethodOptions}
                    inModal={true}
                  />
                </div>
              </InfoRow>
              
              <InfoRow>
                <InfoLabel>회원명:</InfoLabel>
                <InfoValue>{selectedEnrollment.memberName}</InfoValue>
              </InfoRow>
              
              <InfoRow>
                <InfoLabel>상품명:</InfoLabel>
                <InfoValue>{selectedEnrollment.productName}</InfoValue>
              </InfoRow>
              
              <InfoRow>
                <InfoLabel>프로그램:</InfoLabel>
                <InfoValue>{selectedEnrollment.programName} ({selectedEnrollment.programType})</InfoValue>
              </InfoRow>
              
              <InfoRow>
                <InfoLabel>지점:</InfoLabel>
                <InfoValue>{selectedEnrollment.branchName}</InfoValue>
              </InfoRow>
              
              <InfoRow>
                <InfoLabel>담당코치:</InfoLabel>
                <InfoValue>{selectedEnrollment.coachName}</InfoValue>
              </InfoRow>
              
              <InfoRow>
                <InfoLabel>미수금액:</InfoLabel>
                <ModalUnpaidAmount>{selectedEnrollment.unpaidAmount?.toLocaleString() || 0}원</ModalUnpaidAmount>
              </InfoRow>
              
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f0f9ff', 
                border: '1px solid #93c5fd', 
                borderRadius: '8px',
                fontSize: '14px',
                color: '#1e40af',
                marginTop: '16px'
              }}>
                💡 완료 처리 시 해당 금액이 결제 내역에 자동으로 등록되며, 수강 상태가 '완료'로 변경됩니다.
              </div>
            </ModalContent>
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
              <Button variant="secondary" onClick={handleCloseCompleteModal} disabled={isProcessing}>
                취소
              </Button>
              <Button onClick={handleCompletePayment} disabled={isProcessing}>
                {isProcessing ? '처리 중...' : '완료 처리'}
              </Button>
            </div>
          }
        />
      )}

      {/* 새 수강 등록 모달 */}
      <CourseManagementModal
        isOpen={showTransferModal}
        onClose={handleCloseTransferModal}
        onSuccess={handleTransferSuccess}
        courseEnrollment={selectedForTransfer}
      />
    </PageContainer>
  );
};

export default CourseHistory;
