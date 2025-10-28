import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { dbManager, Payment } from '../../../utils/indexedDB';
import { SearchArea, type PeriodOption } from '../../../components/SearchArea';
import UnpaidFilter from '../../../components/SearchArea/UnpaidFilterButton';
import DataTable, { type TableColumn } from '../../../components/DataTable';
import PaymentRegistrationModal from './PaymentRegistrationModal';

const PageContainer = styled.div`
  width: 100%;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 18px;
  border: ${props => props.variant === 'secondary' ? `1px solid ${AppColors.borderLight}` : 'none'};
  border-radius: 8px;
  background: ${props => props.variant === 'secondary' ? AppColors.surface : AppColors.primary};
  color: ${props => props.variant === 'secondary' ? AppColors.onSurface : AppColors.onPrimary};
  font-size: 14px;
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
  }
`;

const MemberPaymentHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // 기간 선택 관련 상태
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('1month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // 미수 필터 관련 상태
  const [showUnpaidOnly, setShowUnpaidOnly] = useState<boolean>(false);
  const [unpaidMetaInfo, setUnpaidMetaInfo] = useState<{ unpaidPaymentCount: number; totalUnpaidAmount: number }>({
    unpaidPaymentCount: 0,
    totalUnpaidAmount: 0
  });

  // 현장 결제 등록 모달 상태
  const [isPaymentRegistrationModalOpen, setIsPaymentRegistrationModalOpen] = useState(false);

  // 현장 결제 등록 모달 열기
  const handleOpenPaymentRegistrationModal = () => {
    setIsPaymentRegistrationModalOpen(true);
  };

  // 현장 결제 등록 모달 닫기
  const handleClosePaymentRegistrationModal = () => {
    setIsPaymentRegistrationModalOpen(false);
  };

  // 현장 결제 등록 성공 처리
  const handlePaymentRegistrationSuccess = () => {
    // 결제 이력 새로고침
    loadPaymentHistory();
  };

  // 미수 메타정보 로드
  const loadUnpaidMetaInfo = useCallback(async () => {
    try {
      const allPayments = await dbManager.getAllPayments();
      const unpaidPayments = allPayments.filter(payment => payment.unpaidAmount > 0);
      const unpaidPaymentCount = unpaidPayments.length;
      const totalUnpaidAmount = unpaidPayments.reduce((sum, payment) => sum + payment.unpaidAmount, 0);
      
      setUnpaidMetaInfo({ unpaidPaymentCount, totalUnpaidAmount });
    } catch (error) {
      console.error('미수 메타정보 로드 실패:', error);
    }
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
        // 커스텀 날짜가 설정되지 않았다면 기본값 (1개월)
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

  const loadPaymentHistory = useCallback(async (period?: PeriodOption, startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      console.log('결제 이력 데이터 로딩 시작...');
      
      // 미수 메타정보 로드
      await loadUnpaidMetaInfo();
      
      const allPayments = await dbManager.getAllPayments();
      console.log('전체 결제 이력 수:', allPayments.length);
      
      // 기간별 필터링 (결제일 기준) - 매개변수가 있으면 사용, 없으면 현재 상태 사용
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
            // 커스텀 날짜가 설정되지 않았다면 기본값 (1개월)
            rangeStartDate.setMonth(today.getMonth() - 1);
            dateRange = { start: rangeStartDate, end: today };
          }
          break;
        default:
          rangeStartDate.setMonth(today.getMonth() - 1);
          dateRange = { start: rangeStartDate, end: today };
      }
      
      // 날짜 범위에 따른 필터링
      const filteredByDate = allPayments.filter(payment => {
        const paymentDate = payment.paymentDate ? new Date(payment.paymentDate) : new Date(payment.createdAt);
        return paymentDate >= dateRange.start && paymentDate <= dateRange.end;
      });
      
      console.log(`${currentPeriod} 기간 내 결제 이력:`, filteredByDate.length);
      
      // 최근 등록순으로 정렬 (createdAt 내림차순)
      const sortedPayments = filteredByDate.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setPaymentHistory(sortedPayments);
      setFilteredHistory(sortedPayments);
    } catch (error) {
      console.error('결제 이력 로딩 실패:', error);
      setPaymentHistory([]);
      setFilteredHistory([]);
    } finally {
      setLoading(false);
    }
  }, [loadUnpaidMetaInfo, selectedPeriod, customStartDate, customEndDate]);

  // 컴포넌트 마운트 시 초기 데이터 로드 (1개월 기준)
  useEffect(() => {
    const initializeData = async () => {
      await loadPaymentHistory();
    };
    initializeData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async () => {
    console.log('검색 실행:', searchQuery, selectedPeriod);
    await loadPaymentHistory(selectedPeriod, customStartDate, customEndDate);
  };

  // 필터 적용 함수
  const applyFilters = useCallback(() => {
    let filtered = [...paymentHistory];
    
    // 검색어 필터링
    if (searchQuery.trim()) {
      filtered = filtered.filter(payment => 
        payment.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.memberId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.products.some(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    // 미수만 보기 필터링
    if (showUnpaidOnly) {
      filtered = filtered.filter(payment => payment.unpaidAmount > 0);
    }
    
    setFilteredHistory(filtered);
  }, [paymentHistory, showUnpaidOnly, searchQuery]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatDate = (date: string | Date) => {
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    return dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 테이블 컬럼 정의
  const columns: TableColumn<Payment>[] = [
    {
      key: 'paymentDate',
      title: '결제일',
      width: '120px',
      render: (value, record) => formatDate(record.paymentDate || record.createdAt)
    },
    {
      key: 'memberName',
      title: '회원명',
      width: '100px'
    },
    {
      key: 'products',
      title: '상품',
      width: '150px',
      render: (value, record) => record.products.map(product => product.name).join(', ')
    },
    {
      key: 'paymentType',
      title: '결제타입',
      width: '80px',
      align: 'center' as const,
      render: (value, record) => (
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '12px', 
          fontSize: '12px',
          backgroundColor: record.paymentType === 'course' ? '#e3f2fd' : record.paymentType === 'asset' ? '#f3e5f5' : '#f5f5f5',
          color: record.paymentType === 'course' ? '#1565c0' : record.paymentType === 'asset' ? '#7b1fa2' : '#424242'
        }}>
          {record.paymentType === 'course' ? '수강' : record.paymentType === 'asset' ? '자산' : '기타'}
        </span>
      )
    },
    {
      key: 'totalAmount',
      title: '총금액',
      width: '100px',
      align: 'right' as const,
      render: (value, record) => formatAmount(record.totalAmount)
    },
    {
      key: 'paidAmount',
      title: '결제금액',
      width: '100px',
      align: 'right' as const,
      render: (value, record) => (
        <span style={{ color: '#2e7d32', fontWeight: '600' }}>
          {formatAmount(record.paidAmount)}
        </span>
      )
    },
    {
      key: 'unpaidAmount',
      title: '미수금액',
      width: '100px',
      align: 'right' as const,
      render: (value, record) => (
        <span style={{ 
          color: record.unpaidAmount > 0 ? '#d32f2f' : '#2e7d32', 
          fontWeight: record.unpaidAmount > 0 ? '600' : 'normal'
        }}>
          {record.unpaidAmount > 0 ? formatAmount(record.unpaidAmount) : '-'}
        </span>
      )
    },
    {
      key: 'paymentMethod',
      title: '결제방법',
      width: '100px',
      render: (value, record) => record.paymentMethod || '-'
    },
    {
      key: 'connectionInfo',
      title: '연결정보',
      width: '140px',
      render: (value, record) => (
        record.paymentType === 'course' && record.memo ? (
          record.memo.includes('포인트') ? (
            <div style={{ fontSize: '12px', color: AppColors.secondary }}>
              <div style={{ fontWeight: '600' }}>포인트 적립</div>
            </div>
          ) : record.memo?.includes('수강') && record.memo?.includes('ID:') ? (
            <div style={{ fontSize: '12px', color: AppColors.primary }}>
              <div style={{ fontWeight: '600' }}>
                {record.memo.match(/수강 \d+개|ID: [\w,\s-]+/g)?.join(' | ') || '다중 수강'}
              </div>
            </div>
          ) : '-'
        ) : '-'
      )
    },
    {
      key: 'memo',
      title: '메모',
      width: '200px',
      render: (value, record) => (
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          {record.memo ? (
            <span title={record.memo}>
              {record.memo.length > 50 ? record.memo.substring(0, 50) + '...' : record.memo}
            </span>
          ) : '-'}
        </div>
      )
    }
  ];

  // 결과 카운트 정보 컴포넌트
  const resultCountInfo = (
    <>
      {showUnpaidOnly ? '미수 결제: ' : ''}{filteredHistory.length}건 
      (완납: {filteredHistory.filter(p => p.unpaidAmount === 0).length}건, 
      미수: {filteredHistory.filter(p => p.unpaidAmount > 0).length}건)
      <br />
      <span style={{ fontSize: '12px', color: AppColors.onInput1 }}>
        기간: {getDateRangeDisplay()} | 전체: {paymentHistory.length}건
      </span>
    </>
  );

  // 결제 이력이 변경될 때 또는 필터 조건이 변경될 때 필터 적용
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  if (loading) {
    return (
      <PageContainer>
        <DataTable
          title="결제 이력"
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
        metaContent={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button onClick={handleOpenPaymentRegistrationModal}>
              + 현장 결제 등록
            </Button>
            <UnpaidFilter
              active={showUnpaidOnly}
              unpaidCount={unpaidMetaInfo.unpaidPaymentCount}
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
        searchPlaceholder="회원명, 회원ID, 상품명으로 검색..."
        autoSearchOnDateChange={false}
      />

      <DataTable
        title="결제 이력"
        columns={columns}
        data={filteredHistory}
        loading={loading}
        emptyText="검색 결과가 없습니다"
        emptyDescription="다른 검색어를 입력하거나 필터를 조정해보세요."
        resultCount={resultCountInfo}
        pagination={{
          enabled: true,
          pageSize: 15,
          pageSizeOptions: [15, 30, 100],
          showTotal: true
        }}
      />

      {/* 적립금 등록 모달 */}
      <PaymentRegistrationModal
        isOpen={isPaymentRegistrationModalOpen}
        onClose={handleClosePaymentRegistrationModal}
        onSuccess={handlePaymentRegistrationSuccess}
      />
    </PageContainer>
  );
};

export default MemberPaymentHistory;