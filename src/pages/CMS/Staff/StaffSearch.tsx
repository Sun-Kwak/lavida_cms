import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, type Staff, type Branch } from '../../../utils/indexedDB';
import { SYSTEM_ADMIN_CONFIG } from '../../../constants/staffConstants';
import StaffEditPopup from './StaffEditPopup';
import DataTable, { type TableColumn } from '../../../components/DataTable';

const PageContainer = styled.div`
  width: 100%;
`;

const SearchSection = styled.div`
  background: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
`;

const SearchRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  font-size: ${AppTextStyles.body1.fontSize};
  outline: none;
  
  &:focus {
    border-color: ${AppColors.primary};
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
  }
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
  }
`;

const FilterRow = styled.div<{ $visible: boolean }>`
  display: ${props => props.$visible ? 'flex' : 'none'};
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterLabel = styled.span`
  font-size: ${AppTextStyles.label1.fontSize};
  color: ${AppColors.onSurface};
  margin-right: 8px;
`;

const FilterChip = styled.button<{ $active?: boolean }>`
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid ${props => props.$active ? AppColors.primary : AppColors.borderLight};
  background: ${props => props.$active ? AppColors.primary : AppColors.surface};
  color: ${props => props.$active ? AppColors.onPrimary : AppColors.onSurface};
  font-size: ${AppTextStyles.label2.fontSize};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? AppColors.primary : AppColors.primary}10;
  }
`;

const Tag = styled.span`
  display: inline-block;
  padding: 4px 8px;
  background: ${AppColors.primary}10;
  color: ${AppColors.primary};
  border-radius: 12px;
  font-size: 12px;
  margin-right: 4px;
`;

const StatusTag = styled.span<{ $clickable?: boolean }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: opacity 0.2s;
  
  &:hover {
    opacity: ${props => props.$clickable ? 0.8 : 1};
  }
`;

const FileLink = styled.span`
  color: ${AppColors.primary};
  cursor: pointer;
  text-decoration: underline;
  font-size: ${AppTextStyles.body2.fontSize};
  
  &:hover {
    color: ${AppColors.secondary};
  }
`;

const Modal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const ModalContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 8px;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${AppColors.borderLight};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${AppColors.surface};
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: ${AppTextStyles.title3.fontSize};
  color: ${AppColors.onSurface};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${AppColors.onSurface};
  padding: 4px;
  
  &:hover {
    color: ${AppColors.primary};
  }
`;

const PreviewContainer = styled.div`
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
`;

const PreviewIframe = styled.iframe`
  width: 80vw;
  height: 70vh;
  border: none;
`;

const ErrorMessage = styled.div`
  color: ${AppColors.error};
  text-align: center;
  padding: 40px;
`;

const StaffSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string>('');
  
  // 상태 토글 확인 모달 상태
  const [statusToggleModal, setStatusToggleModal] = useState<{
    isOpen: boolean;
    staff: Staff | null;
    newStatus: 'active' | 'inactive';
  }>({
    isOpen: false,
    staff: null,
    newStatus: 'active'
  });

  // 시스템 관리자인지 확인하는 함수
  const isSystemAdmin = (staff: Staff): boolean => {
    return staff.loginId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
  };

  // 지점명 가져오기 헬퍼 함수
  const getBranchName = useCallback((branchId: string): string => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : '알 수 없음';
  }, [branches]);

  // 날짜 포맷팅 함수 (yy.mm.dd 형식)
  const formatDate = (dateValue: Date | string): string => {
    if (!dateValue) return '';
    
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      
      // Invalid Date 체크
      if (isNaN(date.getTime())) return '';
      
      const year = date.getFullYear().toString().slice(-2); // 마지막 2자리
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      return `${year}.${month}.${day}`;
    } catch {
      return '';
    }
  };

  // 계약기간 포맷팅 함수
  const formatContractPeriod = (startDate: Date | string, endDate?: Date | string | null): string => {
    const formattedStart = formatDate(startDate);
    
    if (!formattedStart) return '';
    
    // 종료일이 없거나 null인 경우 (정규직 등)
    if (!endDate) {
      return `${formattedStart} 부터`;
    }
    
    const formattedEnd = formatDate(endDate);
    
    // 종료일이 Invalid Date인 경우
    if (!formattedEnd) {
      return `${formattedStart} 부터`;
    }
    
    return `${formattedStart} ~ ${formattedEnd}`;
  };

  // 파일명 추출 함수
  const getFileName = (file: File | null): string => {
    if (!file) return '';
    return file.name;
  };

  // 파일 미리보기 핸들러
  const handleFilePreview = (e: React.MouseEvent, file: File | null) => {
    e.stopPropagation(); // 행 클릭 이벤트 방지
    
    if (!file) return;
    
    setPreviewFile(file);
    setPreviewError('');
    setIsPreviewOpen(true);
  };

  // 미리보기 모달 닫기
  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
    setPreviewError('');
  };

  // 파일 타입 확인
  const getFileType = (file: File): 'image' | 'pdf' | 'unknown' => {
    if (!file) return 'unknown';
    
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    return 'unknown';
  };

  // 파일 URL 생성
  const getFileUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  // 직원 상태 확인 함수 (DB의 isActive 필드 기반)
  const getStaffStatus = (staff: Staff): 'active' | 'inactive' => {
    return staff.isActive ? 'active' : 'inactive';
  };

  // 상태 토글 클릭 핸들러
  const handleStatusClick = (e: React.MouseEvent, staff: Staff) => {
    e.stopPropagation(); // 행 클릭 이벤트 방지
    
    const currentStatus = getStaffStatus(staff);
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    setStatusToggleModal({
      isOpen: true,
      staff: staff,
      newStatus: newStatus
    });
  };

  // 상태 토글 확인
  const handleConfirmStatusToggle = async () => {
    if (!statusToggleModal.staff) return;

    try {
      await dbManager.toggleStaffStatus(statusToggleModal.staff.id);
      await loadData(); // 데이터 새로고침
      setStatusToggleModal({ isOpen: false, staff: null, newStatus: 'active' });
    } catch (error) {
      console.error('상태 변경 실패:', error);
      if (error instanceof Error && error.message.includes('시스템 관리자')) {
        alert('시스템 관리자 계정의 상태는 변경할 수 없습니다.');
      } else {
        alert('상태 변경에 실패했습니다.');
      }
      setStatusToggleModal({ isOpen: false, staff: null, newStatus: 'active' });
    }
  };

  // 상태 토글 취소
  const handleCancelStatusToggle = () => {
    setStatusToggleModal({ isOpen: false, staff: null, newStatus: 'active' });
  };

  const handleSearch = useCallback(() => {
    let filtered = allStaff;
    
    // 텍스트 검색
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(staff =>
        staff.id.toLowerCase().includes(query) ||
        staff.name.toLowerCase().includes(query) ||
        staff.loginId.toLowerCase().includes(query) ||
        staff.phone.includes(query) ||
        staff.email.toLowerCase().includes(query) ||
        staff.position.toLowerCase().includes(query) ||
        staff.role.toLowerCase().includes(query) ||
        (staff.program && staff.program.toLowerCase().includes(query)) ||
        getBranchName(staff.branchId).toLowerCase().includes(query)
      );
    }
    
    // 필터 적용
    if (activeFilters.length > 0) {
      filtered = filtered.filter(staff => {
        return activeFilters.some(filter => {
          switch (filter) {
            case 'MASTER':
              return staff.permission === 'MASTER';
            case 'EDITOR':
              return staff.permission === 'EDITOR';
            case 'VIEWER':
              return staff.permission === 'VIEWER';
            case '활성':
              return getStaffStatus(staff) === 'active';
            case '비활성':
              return getStaffStatus(staff) === 'inactive';
            default:
              // 직급, 직책, 고용형태 필터
              return staff.position === filter || 
                     staff.role === filter || 
                     staff.employmentType === filter;
          }
        });
      });
    }
    
    setFilteredStaff(filtered);
  }, [allStaff, searchQuery, activeFilters, getBranchName]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 검색 조건이 변경될 때마다 자동으로 필터링 적용
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffData, branchData] = await Promise.all([
        dbManager.getAllStaff(),
        dbManager.getAllBranches()
      ]);
      
      // 최근 등록순으로 정렬 (createdAt 내림차순)
      const sortedStaffData = staffData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setAllStaff(sortedStaffData);
      setBranches(branchData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Enter 키를 눌렀을 때는 즉시 검색 실행
      handleSearch();
    }
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
    // allStaff가 변경되면 자동으로 handleSearch가 호출되므로 별도로 setFilteredStaff 호출 불필요
  };

  // 테이블 컬럼 정의
  const columns: TableColumn<Staff>[] = [
    {
      key: 'name',
      title: '이름',
      width: '120px',
      render: (value, record) => (
        <div>
          {record.name}
          {isSystemAdmin(record) && (
            <span style={{ 
              marginLeft: '8px', 
              fontSize: '12px'
            }}>
              🔒
            </span>
          )}
        </div>
      )
    },
    {
      key: 'loginId',
      title: '로그인ID',
      width: '120px'
    },
    {
      key: 'phone',
      title: '연락처',
      width: '130px'
    },
    {
      key: 'email',
      title: '이메일',
      width: '180px'
    },
    {
      key: 'branchId',
      title: '지점',
      width: '100px',
      render: (value, record) => getBranchName(record.branchId)
    },
    {
      key: 'position',
      title: '직급',
      width: '80px'
    },
    {
      key: 'role',
      title: '직책',
      width: '80px'
    },
    {
      key: 'program',
      title: '담당프로그램',
      width: '120px',
      render: (value, record) => (
        record.role === '코치' && record.program ? (
          <span style={{ color: AppColors.primary }}>{record.program}</span>
        ) : (
          <span style={{ color: AppColors.onInput1 }}>-</span>
        )
      )
    },
    {
      key: 'employmentType',
      title: '고용형태',
      width: '100px'
    },
    {
      key: 'permission',
      title: '권한',
      width: '100px',
      render: (value, record) => (
        <Tag style={{
          backgroundColor: isSystemAdmin(record) ? AppColors.primary : `${AppColors.primary}10`,
          color: isSystemAdmin(record) ? AppColors.onPrimary : AppColors.primary,
          fontWeight: isSystemAdmin(record) ? 'bold' : 'normal'
        }}>
          {record.permission}
          {isSystemAdmin(record) && ' 🔒'}
        </Tag>
      )
    },
    {
      key: 'contractPeriod',
      title: '계약기간',
      width: '160px',
      render: (value, record) => 
        formatContractPeriod(record.contractStartDate, record.contractEndDate)
    },
    {
      key: 'contractFile',
      title: '계약서',
      width: '120px',
      render: (value, record) => (
        record.contractFile ? (
          <FileLink onClick={(e) => handleFilePreview(e, record.contractFile || null)}>
            {getFileName(record.contractFile)}
          </FileLink>
        ) : (
          <span style={{ color: AppColors.onInput1 }}>없음</span>
        )
      )
    },
    {
      key: 'isActive',
      title: '상태',
      width: '100px',
      align: 'center' as const,
      render: (value, record) => (
        <StatusTag 
          $clickable={!isSystemAdmin(record)}
          onClick={(e) => !isSystemAdmin(record) && handleStatusClick(e, record)}
          style={{ 
            backgroundColor: getStaffStatus(record) === 'active' ? '#e8f5e8' : '#ffebee',
            color: getStaffStatus(record) === 'active' ? '#2e7d32' : '#c62828'
          }}
          title={isSystemAdmin(record) ? "시스템 관리자는 상태 변경 불가" : "클릭하여 상태 변경"}
        >
          {getStaffStatus(record) === 'active' ? '활성' : '비활성'}
          {isSystemAdmin(record) && ' 🔒'}
        </StatusTag>
      )
    }
  ];

  // 직원 row 클릭 핸들러
  const handleStaffRowClick = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsEditPopupOpen(true);
  };

  // 팝업 닫기 핸들러
  const handleCloseEditPopup = () => {
    setIsEditPopupOpen(false);
    setSelectedStaff(null);
  };

  // 직원 수정/삭제 후 데이터 새로고침
  const handleStaffUpdate = async () => {
    await loadData();
    // 데이터가 로드되면 자동으로 handleSearch가 호출되므로 별도로 호출 불필요
  };

  // 동적 필터 옵션 생성
  const getFilterOptions = () => {
    const positions = Array.from(new Set(allStaff.map(staff => staff.position)));
    const roles = Array.from(new Set(allStaff.map(staff => staff.role)));
    const employmentTypes = Array.from(new Set(allStaff.map(staff => staff.employmentType)));
    const permissions = ['MASTER', 'EDITOR', 'VIEWER'];
    const statuses = ['활성', '비활성'];
    
    return [...positions, ...roles, ...employmentTypes, ...permissions, ...statuses];
  };

  const filterOptions = getFilterOptions();

  return (
    <PageContainer>
        <SearchSection>
          <SearchRow>
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="직원명, ID, 로그인ID, 전화번호, 이메일, 직급, 직책, 담당프로그램, 지점명으로 검색..."
            />
            <Button onClick={handleSearch}>검색</Button>
            <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
              필터
            </Button>
            {(activeFilters.length > 0 || searchQuery) && (
              <Button variant="secondary" onClick={clearFilters}>
                초기화
              </Button>
            )}
          </SearchRow>
          
          <FilterRow $visible={showFilters}>
            <FilterLabel>필터:</FilterLabel>
            {filterOptions.map(filter => (
              <FilterChip
                key={filter}
                $active={activeFilters.includes(filter)}
                onClick={() => toggleFilter(filter)}
              >
                {filter}
              </FilterChip>
            ))}
          </FilterRow>
        </SearchSection>

        <DataTable
          title="검색 결과"
          columns={columns}
          data={filteredStaff}
          loading={loading}
          emptyText="검색 결과가 없습니다."
          emptyDescription="다른 검색어를 시도해보세요."
          resultCount={`총 ${filteredStaff.length}명`}
          onRowClick={handleStaffRowClick}
          pagination={{
            enabled: true,
            pageSize: 15,
            pageSizeOptions: [15, 30, 100],
            showTotal: true
          }}
        />

        {/* 직원 수정/삭제 팝업 */}
        <StaffEditPopup
          isOpen={isEditPopupOpen}
          staff={selectedStaff}
          onClose={handleCloseEditPopup}
          onUpdate={handleStaffUpdate}
        />

        {/* 파일 미리보기 모달 */}
        <Modal $isOpen={isPreviewOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {previewFile ? getFileName(previewFile) : '파일 미리보기'}
              </ModalTitle>
              <CloseButton onClick={closePreview}>×</CloseButton>
            </ModalHeader>
            <PreviewContainer>
              {previewError ? (
                <ErrorMessage>{previewError}</ErrorMessage>
              ) : previewFile ? (
                (() => {
                  const fileType = getFileType(previewFile);
                  const fileUrl = getFileUrl(previewFile);
                  
                  switch (fileType) {
                    case 'image':
                      return (
                        <PreviewImage 
                          src={fileUrl} 
                          alt="계약서 미리보기"
                          onError={() => setPreviewError('이미지를 불러올 수 없습니다.')}
                        />
                      );
                    case 'pdf':
                      return (
                        <PreviewIframe 
                          src={fileUrl}
                          title="PDF 미리보기"
                          onError={() => setPreviewError('PDF를 불러올 수 없습니다.')}
                        />
                      );
                    default:
                      return <ErrorMessage>지원하지 않는 파일 형식입니다.</ErrorMessage>;
                  }
                })()
              ) : (
                <ErrorMessage>파일을 찾을 수 없습니다.</ErrorMessage>
              )}
            </PreviewContainer>
          </ModalContent>
        </Modal>

        {/* 상태 토글 확인 모달 */}
        <Modal $isOpen={statusToggleModal.isOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>직원 상태 변경 확인</ModalTitle>
              <CloseButton onClick={handleCancelStatusToggle}>×</CloseButton>
            </ModalHeader>
            <div style={{ 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              textAlign: 'left'
            }}>
              <div style={{ 
                fontSize: '16px', 
                lineHeight: '1.5',
                color: '#333'
              }}>
                <strong>{statusToggleModal.staff?.name}</strong> 직원의 상태를{' '}
                <strong style={{ 
                  color: statusToggleModal.newStatus === 'active' ? '#2e7d32' : '#c62828' 
                }}>
                  {statusToggleModal.newStatus === 'active' ? '활성' : '비활성'}
                </strong>으로 변경하시겠습니까?
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666',
                backgroundColor: '#fff3cd',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #ffeaa7'
              }}>
                ℹ️ {statusToggleModal.newStatus === 'active' 
                  ? '활성화하면 해당 직원이 시스템에 로그인할 수 있습니다.' 
                  : '비활성화하면 해당 직원이 시스템에 로그인할 수 없습니다.'}
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '8px'
              }}>
                <Button variant="secondary" onClick={handleCancelStatusToggle}>
                  취소
                </Button>
                <Button 
                  variant={statusToggleModal.newStatus === 'active' ? 'primary' : 'secondary'}
                  onClick={handleConfirmStatusToggle}
                  style={statusToggleModal.newStatus === 'inactive' ? { 
                    backgroundColor: AppColors.error, 
                    color: AppColors.onPrimary,
                    border: 'none'
                  } : {}}
                >
                  {statusToggleModal.newStatus === 'active' ? '활성화' : '비활성화'}
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>
      </PageContainer>
    );
  };

export default StaffSearch;
