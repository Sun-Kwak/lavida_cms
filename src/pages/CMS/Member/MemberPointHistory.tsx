import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, Point } from '../../../utils/indexedDB';
import { SearchArea, type PeriodOption } from '../../../components/SearchArea';
import DataTable, { type TableColumn } from '../../../components/DataTable';

// 스타일 컴포넌트들
const PageContainer = styled.div`
  width: 100%;
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div<{ $isActive?: boolean; $isClickable?: boolean }>`
  background: ${props => props.$isActive ? '#f0f7ff' : 'white'};
  border: ${props => props.$isActive ? `2px solid ${AppColors.primary}` : '1px solid #e1e5e9'};
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};
  transition: all 0.2s ease;
  
  ${props => props.$isClickable && `
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-color: ${AppColors.primary};
    }
  `}
`;

const StatLabel = styled.div`
  ${AppTextStyles.body2}
  color: ${AppColors.secondary};
  margin-bottom: 8px;
`;

const StatValue = styled.div<{ color?: string }>`
  ${AppTextStyles.headline2}
  color: ${props => props.color || AppColors.onSurface};
  margin: 0;
`;

const AmountCell = styled.span<{ isPositive?: boolean }>`
  font-weight: 600;
  color: ${props => props.isPositive ? '#28a745' : '#dc3545'};
`;

const Badge = styled.span<{ type: 'earned' | 'used' | 'expired' | 'adjusted' }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => {
    switch (props.type) {
      case 'earned':
        return `
          background: #d4edda;
          color: #155724;
        `;
      case 'used':
        return `
          background: #f8d7da;
          color: #721c24;
        `;
      case 'expired':
        return `
          background: #fff3cd;
          color: #856404;
        `;
      case 'adjusted':
        return `
          background: #d1ecf1;
          color: #0c5460;
        `;
      default:
        return `
          background: #e2e3e5;
          color: #383d41;
        `;
    }
  }}
`;

// 포인트 타입 한글 매핑
const pointTypeLabels: Record<Point['type'], string> = {
  earned: '적립',
  used: '사용',
  expired: '만료',
  adjusted: '조정'
};

interface MemberStats {
  totalEarned: number;
  totalUsed: number;
  totalExpired: number;
  currentBalance: number;
  transactionCount: number;
}

const MemberPointHistory: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [filteredPoints, setFilteredPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 기간 선택 관련 상태
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('1month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // 추가 필터 상태
  const [selectedStatCard, setSelectedStatCard] = useState<'all' | 'earned' | 'used' | 'expired' | 'balance'>('all');
  
  const [stats, setStats] = useState<MemberStats>({
    totalEarned: 0,
    totalUsed: 0,
    totalExpired: 0,
    currentBalance: 0,
    transactionCount: 0
  });

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

  const calculateStats = useCallback((pointsList: Point[]) => {
    const totalEarned = pointsList
      .filter(p => p.type === 'earned')
      .reduce((sum, p) => sum + p.amount, 0);
      
    const totalUsed = Math.abs(pointsList
      .filter(p => p.type === 'used')
      .reduce((sum, p) => sum + p.amount, 0));
      
    const totalExpired = Math.abs(pointsList
      .filter(p => p.type === 'expired')
      .reduce((sum, p) => sum + p.amount, 0));
    
    // 만료되지 않은 포인트로 현재 잔액 계산
    const now = new Date();
    const currentBalance = pointsList
      .filter(p => !p.expiryDate || new Date(p.expiryDate) > now)
      .reduce((sum, p) => sum + p.amount, 0);

    setStats({
      totalEarned,
      totalUsed,
      totalExpired,
      currentBalance,
      transactionCount: pointsList.length
    });
  }, []);

  const loadPointHistory = useCallback(async (period?: PeriodOption, startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      console.log('포인트 이력 데이터 로딩 시작...');
      
      // 통합 포인트 내역 조회 (기존 + 새로운 시스템)
      const allPoints = await dbManager.getAllPointsUnified();
      console.log('통합 포인트 이력 수:', allPoints.length);
      
      // 기간별 필터링 (생성일 기준) - 매개변수가 있으면 사용, 없으면 현재 상태 사용
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
      
      const filteredByDate = allPoints.filter(point => {
        const pointDate = new Date(point.createdAt);
        return pointDate >= dateRange.start && pointDate <= dateRange.end;
      });
      
      // 최신 순으로 정렬
      const sortedPoints = filteredByDate.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log(`${currentPeriod} 기간 내 포인트 이력:`, sortedPoints.length);
      
      setPoints(sortedPoints);
      calculateStats(sortedPoints);
    } catch (error) {
      console.error('포인트 이력 로드 실패:', error);
      toast.error('포인트 이력을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, customStartDate, customEndDate, calculateStats]);

  const applyFilters = useCallback(() => {
    let filtered = [...points];

    // 회원명, 회원ID, 출처 검색 (통합 검색)
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(point => 
        point.memberName.toLowerCase().includes(searchTerm) ||
        point.memberId.includes(searchTerm) ||
        point.source.toLowerCase().includes(searchTerm)
      );
    }

    // 선택된 카드에 따른 필터링
    if (selectedStatCard !== 'all') {
      switch (selectedStatCard) {
        case 'earned':
          filtered = filtered.filter(point => point.type === 'earned');
          break;
        case 'used':
          filtered = filtered.filter(point => point.type === 'used');
          break;
        case 'expired':
          filtered = filtered.filter(point => point.type === 'expired');
          break;
        case 'balance':
          // 현재 잔액에 영향을 주는 포인트들 (만료되지 않은 것들)
          const now = new Date();
          filtered = filtered.filter(point => 
            !point.expiryDate || new Date(point.expiryDate) > now
          );
          break;
      }
    }

    setFilteredPoints(filtered);
    calculateStats(filtered);
  }, [points, searchQuery, selectedStatCard, calculateStats]);

  // 컴포넌트 마운트 시 초기 데이터 로드 (1개월 기준)
  useEffect(() => {
    const initializeData = async () => {
      await loadPointHistory();
    };
    initializeData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 필터 변경 시 필터링 적용
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleSearch = async () => {
    // 현재 선택된 조건으로 데이터를 불러옵니다
    await loadPointHistory(selectedPeriod, customStartDate, customEndDate);
  };

  // 테이블 컬럼 정의
  const columns: TableColumn<Point>[] = [
    {
      key: 'createdAt',
      title: '날짜/시간',
      width: '150px',
      render: (value, record) => formatDate(record.createdAt)
    },
    {
      key: 'memberName',
      title: '회원명',
      width: '120px'
    },
    {
      key: 'memberId',
      title: '회원ID',
      width: '100px'
    },
    {
      key: 'type',
      title: '타입',
      width: '80px',
      align: 'center' as const,
      render: (value, record) => (
        <Badge type={record.type}>
          {pointTypeLabels[record.type]}
        </Badge>
      )
    },
    {
      key: 'amount',
      title: '금액',
      width: '120px',
      align: 'right' as const,
      render: (value, record) => (
        <AmountCell isPositive={record.amount > 0}>
          {record.amount > 0 ? '+' : ''}{formatAmount(record.amount)}원
        </AmountCell>
      )
    },
    {
      key: 'source',
      title: '출처',
      width: '150px'
    },
    {
      key: 'products',
      title: '관련 상품/수강',
      width: '250px',
      render: (value, record) => {
        // 새로운 포인트 시스템의 PointTransaction에서 products 정보 표시
        const extendedRecord = record as any; // 타입 확장을 위한 캐스팅
        if (extendedRecord.products && Array.isArray(extendedRecord.products) && extendedRecord.products.length > 0) {
          return (
            <div style={{ fontSize: '12px' }}>
              {extendedRecord.products.map((product: any, index: number) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  <div style={{ fontWeight: '600', color: AppColors.primary }}>
                    {product.productName} ({product.productPrice?.toLocaleString()}원)
                  </div>
                  {product.courseId && (
                    <div style={{ color: AppColors.secondary, fontSize: '11px' }}>
                      수강ID: {product.courseId}
                      {product.courseName && ` | ${product.courseName}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }
        
        // 기존 시스템의 relatedPaymentId 표시
        if (record.relatedPaymentId) {
          return (
            <div style={{ fontSize: '12px', color: AppColors.secondary }}>
              결제ID: {record.relatedPaymentId}
            </div>
          );
        }
        
        return '-';
      }
    },
    {
      key: 'description',
      title: '설명',
      width: '200px',
      render: (value, record) => record.description || '-'
    },
    {
      key: 'expiryDate',
      title: '만료일',
      width: '150px',
      render: (value, record) => 
        record.expiryDate ? formatDate(record.expiryDate) : '-'
    }
  ];

  // 결과 카운트 정보 컴포넌트
  const resultCountInfo = (
    <>
      총 {filteredPoints.length.toLocaleString()}건 (전체: {points.length.toLocaleString()}건)
      <br />
      <span style={{ fontSize: '12px', color: AppColors.onInput1 }}>
        기간: {getDateRangeDisplay()}
        {selectedStatCard !== 'all' && (
          <span style={{ color: AppColors.primary, fontWeight: '500', marginLeft: '8px' }}>
            • 필터 활성
          </span>
        )}
      </span>
    </>
  );

  // StatCard 클릭 핸들러
  const handleStatCardClick = (cardType: 'all' | 'earned' | 'used' | 'expired' | 'balance') => {
    if (selectedStatCard === cardType) {
      // 이미 선택된 카드를 다시 클릭하면 전체로 돌아감
      setSelectedStatCard('all');
    } else {
      setSelectedStatCard(cardType);
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString();
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <DataTable
          title="포인트 이력"
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
        searchPlaceholder="회원명, 회원ID, 출처로 검색..."
        autoSearchOnDateChange={false}
      />

      <StatsSection>
        <StatCard 
          $isActive={selectedStatCard === 'earned'} 
          $isClickable={true}
          onClick={() => handleStatCardClick('earned')}
        >
          <StatLabel>총 적립</StatLabel>
          <StatValue color="#28a745">+{formatAmount(stats.totalEarned)}원</StatValue>
        </StatCard>
        <StatCard 
          $isActive={selectedStatCard === 'used'} 
          $isClickable={true}
          onClick={() => handleStatCardClick('used')}
        >
          <StatLabel>총 사용</StatLabel>
          <StatValue color="#dc3545">-{formatAmount(stats.totalUsed)}원</StatValue>
        </StatCard>
        <StatCard 
          $isActive={selectedStatCard === 'expired'} 
          $isClickable={true}
          onClick={() => handleStatCardClick('expired')}
        >
          <StatLabel>총 만료</StatLabel>
          <StatValue color="#ffc107">-{formatAmount(stats.totalExpired)}원</StatValue>
        </StatCard>
        <StatCard 
          $isActive={selectedStatCard === 'balance'} 
          $isClickable={true}
          onClick={() => handleStatCardClick('balance')}
        >
          <StatLabel>현재 잔액</StatLabel>
          <StatValue color="#007bff">{formatAmount(stats.currentBalance)}원</StatValue>
        </StatCard>
        <StatCard $isActive={false} $isClickable={false}>
          <StatLabel>총 거래</StatLabel>
          <StatValue>{stats.transactionCount.toLocaleString()}건</StatValue>
        </StatCard>
      </StatsSection>

      <DataTable
        title={
          <div>
            포인트 이력
            {selectedStatCard !== 'all' && (
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 'normal', 
                color: AppColors.primary,
                marginLeft: '8px'
              }}>
                ({selectedStatCard === 'earned' ? '적립만' : 
                  selectedStatCard === 'used' ? '사용만' : 
                  selectedStatCard === 'expired' ? '만료만' : 
                  selectedStatCard === 'balance' ? '유효 포인트만' : ''} 표시)
              </span>
            )}
          </div>
        }
        columns={columns}
        data={filteredPoints}
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
    </PageContainer>
  );
};

export default MemberPointHistory;