import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { dbManager, ExercisePrescription } from '../../../utils/indexedDB';
import { SearchArea, type PeriodOption } from '../../../components/SearchArea';
import DataTable, { type TableColumn } from '../../../components/DataTable';
import ExercisePrescriptionModal from '../../../components/ExercisePrescriptionModal';
import ExercisePrescriptionForm from '../../../components/ExercisePrescriptionForm';

// 스타일 컴포넌트들
const PageContainer = styled.div`
  width: 100%;
`;

const VersionBadge = styled.span<{ $isLatest?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: ${props => props.$isLatest ? AppColors.success : AppColors.borderLight};
  color: ${props => props.$isLatest ? 'white' : AppColors.onInput1};
`;

const ActionButton = styled.button`
  background: none;
  border: 1px solid ${AppColors.primary};
  color: ${AppColors.primary};
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${AppColors.primary};
    color: white;
  }
`;

const MemberExercisePrescriptionHistory: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<ExercisePrescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<ExercisePrescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<ExercisePrescription | null>(null);
  
  // 기간 선택 관련 상태
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('1month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

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
            start: new Date(customStartDate + 'T00:00:00'),
            end: new Date(customEndDate + 'T23:59:59')
          };
        }
        return { start: new Date(0), end: today };
      default:
        startDate.setMonth(today.getMonth() - 1);
        return { start: startDate, end: today };
    }
  }, [selectedPeriod, customStartDate, customEndDate]);

  // 통계 계산
  const calculateStats = useCallback((prescriptionsList: ExercisePrescription[]) => {
    // 통계 카드가 제거되어 더 이상 필요하지 않음
  }, []);

  const loadPrescriptionHistory = useCallback(async (period?: PeriodOption, startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      console.log('운동처방 히스토리 데이터 로딩 시작...');
      
      // 모든 운동처방서 조회
      const allPrescriptions = await dbManager.exercisePrescription.getAllExercisePrescriptions();
      console.log('전체 운동처방서 수:', allPrescriptions.length);
      
      // 기간별 필터링 (생성일 기준) - 매개변수가 있으면 사용, 없으면 현재 상태 사용
      const currentPeriod = period ?? selectedPeriod;
      const currentStartDate = startDate ?? customStartDate;
      const currentEndDate = endDate ?? customEndDate;
      
      let dateRange: { start: Date; end: Date };
      
      if (currentPeriod === 'custom' && currentStartDate && currentEndDate) {
        dateRange = {
          start: new Date(currentStartDate + 'T00:00:00'),
          end: new Date(currentEndDate + 'T23:59:59')
        };
      } else {
        const today = new Date();
        const rangeStartDate = new Date();
        
        switch (currentPeriod) {
          case '3month':
            rangeStartDate.setMonth(today.getMonth() - 3);
            dateRange = { start: rangeStartDate, end: today };
            break;
          case '6month':
            rangeStartDate.setMonth(today.getMonth() - 6);
            dateRange = { start: rangeStartDate, end: today };
            break;
          default:
            rangeStartDate.setMonth(today.getMonth() - 1);
            dateRange = { start: rangeStartDate, end: today };
        }
      }
      
      const filteredByDate = allPrescriptions.filter(prescription => {
        const prescriptionDate = new Date(prescription.createdAt);
        return prescriptionDate >= dateRange.start && prescriptionDate <= dateRange.end;
      });
      
      // 최신 순으로 정렬
      const sortedPrescriptions = filteredByDate.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log(`${currentPeriod} 기간 내 운동처방 히스토리:`, sortedPrescriptions.length);
      
      setPrescriptions(sortedPrescriptions);
      calculateStats(sortedPrescriptions);
    } catch (error) {
      console.error('운동처방 히스토리 로드 실패:', error);
      toast.error('운동처방 히스토리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, customStartDate, customEndDate, calculateStats]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadPrescriptionHistory();
  }, [loadPrescriptionHistory]);

  // 기간 변경 시 자동 검색
  useEffect(() => {
    if (selectedPeriod !== 'custom') {
      loadPrescriptionHistory(selectedPeriod);
    }
  }, [selectedPeriod, loadPrescriptionHistory]);

  // 검색 및 필터링
  useEffect(() => {
    let filtered = prescriptions;

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prescription => 
        prescription.memberName.toLowerCase().includes(query) ||
        prescription.memberId.toLowerCase().includes(query) ||
        prescription.medications.toLowerCase().includes(query) ||
        prescription.painHistory.toLowerCase().includes(query)
      );
    }

    setFilteredPrescriptions(filtered);
  }, [prescriptions, searchQuery]);

  // 날짜 범위 표시
  const getDateRangeDisplay = useCallback(() => {
    const range = getDateRange();
    return `${range.start.toLocaleDateString('ko-KR')} ~ ${range.end.toLocaleDateString('ko-KR')}`;
  }, [getDateRange]);

  // 검색 핸들러
  const handleSearch = async () => {
    await loadPrescriptionHistory(selectedPeriod, customStartDate, customEndDate);
  };

  // 날짜 포맷 함수
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 운동처방서 상세 보기
  const handleViewPrescription = (prescription: ExercisePrescription) => {
    // 모달로 운동처방서 상세보기
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrescription(null);
  };

  // 테이블 컬럼 정의
  const columns: TableColumn<ExercisePrescription>[] = [
    {
      key: 'createdAt',
      title: '작성일시',
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
      key: 'version',
      title: '버전',
      width: '80px',
      align: 'center' as const,
      render: (value, record) => (
        <VersionBadge $isLatest={record.isLatest}>
          v{record.version || 1}
          {record.isLatest && ' 최신'}
        </VersionBadge>
      )
    },
    {
      key: 'height',
      title: '키/체중',
      width: '100px',
      render: (value, record) => (
        record.height && record.weight 
          ? `${record.height}cm / ${record.weight}kg`
          : '-'
      )
    },
    {
      key: 'medications',
      title: '복용약물',
      width: '150px',
      render: (value, record) => (
        record.medications ? (
          <span title={record.medications}>
            {record.medications.length > 20 
              ? record.medications.substring(0, 20) + '...' 
              : record.medications
            }
          </span>
        ) : '-'
      )
    },
    {
      key: 'prescriptionDate',
      title: '처방일',
      width: '120px',
      render: (value, record) => formatDate(record.prescriptionDate)
    },
    {
      key: 'signedAt',
      title: '서명일',
      width: '120px',
      render: (value, record) => (
        record.signedAt ? formatDate(record.signedAt) : '-'
      )
    },
    {
      key: 'actions',
      title: '작업',
      width: '100px',
      align: 'center' as const,
      render: (value, record) => (
        <ActionButton onClick={() => handleViewPrescription(record)}>
          상세보기
        </ActionButton>
      )
    }
  ];

  if (loading) {
    return (
      <PageContainer>
        <DataTable
          title="운동처방 히스토리"
          columns={columns}
          data={[]}
          loading={true}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* SearchArea 컴포넌트 사용 */}
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
        searchPlaceholder="회원명, 회원ID, 복용약물, 이력으로 검색..."
        autoSearchOnDateChange={false}
      />

      <DataTable
        title="운동처방 히스토리"
        columns={columns}
        data={filteredPrescriptions}
        loading={loading}
      />

      {/* 운동처방 상세보기 모달 */}
      <ExercisePrescriptionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        version={selectedPrescription?.version}
      >
        {selectedPrescription && (
          <ExercisePrescriptionForm
            selectedMember={{
              id: selectedPrescription.memberId,
              name: selectedPrescription.memberName,
              phone: '',
              email: '',
              birth: '',
              gender: 'male',
              address: '',
              sigunguCode: '',
              dong: '',
              roadAddress: '',
              jibunAddress: '',
              branchId: '',
              branchName: '',
              coach: '',
              coachName: '',
              joinPath: '',
              loginId: '',
              loginPassword: null,
              enableLogin: false,
              agreementInfo: {
                agreements: [],
                customerSignature: '',
                staffSignature: ''
              },
              isActive: true,
              registrationDate: '',
              createdAt: new Date(),
              updatedAt: new Date()
            }}
            prescription={selectedPrescription}
            formData={{
              height: selectedPrescription.height,
              weight: selectedPrescription.weight,
              footSize: selectedPrescription.footSize,
              medications: selectedPrescription.medications,
              medicalHistory: selectedPrescription.medicalHistory,
              painHistory: selectedPrescription.painHistory,
              bodyImages: selectedPrescription.bodyImages,
              signatureData: selectedPrescription.signatureData
            }}
            readOnly={true}
          />
        )}
      </ExercisePrescriptionModal>
    </PageContainer>
  );
};

export default MemberExercisePrescriptionHistory;