import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, type Member as DBMember } from '../../../utils/indexedDB';
import { openPreviewWindow } from './PreviewDocument';
import { MemberFormData } from './types';
import QRCodeModal from '../../../components/QRCodeModal';

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
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const FilterRow = styled.div<{ $visible: boolean }>`
  display: ${props => props.$visible ? 'flex' : 'none'};
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterLabel = styled.span`
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${AppColors.onInput1};
  font-weight: 500;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${props => props.$active ? AppColors.primary : AppColors.borderLight};
  border-radius: 20px;
  background: ${props => props.$active ? AppColors.primary : AppColors.surface};
  color: ${props => props.$active ? AppColors.onPrimary : AppColors.onSurface};
  font-size: ${AppTextStyles.label2.fontSize};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${AppColors.primary};
    background: ${props => props.$active ? AppColors.primary : 'rgba(0, 123, 255, 0.1)'};
  }
`;

const ResultsSection = styled.div`
  background: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${AppColors.borderLight};
`;

const ResultsTitle = styled.h2`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 600;
  color: ${AppColors.onBackground};
  margin: 0;
`;

const ResultsCount = styled.span`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onInput1};
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f8f9fa;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${AppColors.borderLight};
  
  &:hover {
    background: #f8f9fa;
  }
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 600;
  color: ${AppColors.onInput1};
  border-bottom: 1px solid ${AppColors.borderLight};
`;

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onBackground};
  vertical-align: middle;
`;

const StatusBadge = styled.span<{ $status: 'active' | 'inactive' }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.$status === 'active' ? '#e7f5e7' : '#fff2f2'};
  color: ${props => props.$status === 'active' ? '#2d5a2d' : '#8b1538'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  background: ${AppColors.surface};
  color: ${AppColors.primary};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${AppColors.primary};
    color: ${AppColors.onPrimary};
  }
`;

const EmptyState = styled.div`
  padding: 60px 24px;
  text-align: center;
  color: ${AppColors.onInput1};
`;

const EmptyStateTitle = styled.h3`
  font-size: ${AppTextStyles.title3.fontSize};
  margin: 0 0 8px 0;
`;

const EmptyStateDescription = styled.p`
  font-size: ${AppTextStyles.body2.fontSize};
  margin: 0;
`;

const LoadingState = styled.div`
  padding: 60px 24px;
  text-align: center;
  color: ${AppColors.onInput1};
`;

const MemberSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [members, setMembers] = useState<DBMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<DBMember[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // QR 모달 관련 상태
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [selectedMemberForQR, setSelectedMemberForQR] = useState<DBMember | null>(null);

  // 컴포넌트 마운트 시 회원 데이터 로드
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const allMembers = await dbManager.getAllMembers();
      const activeMembers = allMembers.filter(member => member.isActive);
      setMembers(activeMembers);
      setFilteredMembers(activeMembers);
    } catch (error) {
      console.error('회원 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = members;
    
    // 텍스트 검색
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(query) ||
        member.phone.includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.coachName.toLowerCase().includes(query)
      );
    }
    
    // 필터 적용
    if (activeFilters.length > 0) {
      filtered = filtered.filter(member => {
        return activeFilters.some(filter => {
          switch (filter) {
            case '남성':
              return member.gender === 'male';
            case '여성':
              return member.gender === 'female';
            case '로그인사용':
              return member.enableLogin;
            default:
              return member.branchName === filter; // 지점명으로 필터링
          }
        });
      });
    }
    
    setFilteredMembers(filtered);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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

  const handlePreviewDocument = async (member: DBMember) => {
    try {
      // 회원 데이터를 MemberFormData 형식으로 변환
      const payments = await dbManager.getPaymentsByMember(member.id);
      const products = payments.flatMap(payment => payment.products);
      
      const formData: MemberFormData = {
        basicInfo: {
          name: member.name,
          phone: member.phone,
          email: member.email,
          birth: member.birth,
          gender: member.gender,
          addressInfo: {
            address: member.address,
            sigunguCode: member.sigunguCode,
            dong: member.dong,
            roadAddress: member.roadAddress,
            jibunAddress: member.jibunAddress,
          },
        },
        joinInfo: {
          branchId: member.branchId,
          coach: member.coach,
          joinPath: member.joinPath,
          loginId: member.loginId,
          loginPassword: member.loginPassword || '', // null인 경우 빈 문자열로 변환
          enableLogin: member.enableLogin,
        },
        paymentInfo: {
          selectedProducts: products,
          paymentMethod: 'card', // 기본값으로 카드 설정
        },
        agreementInfo: member.agreementInfo,
      };
      
      await openPreviewWindow(formData);
    } catch (error) {
      console.error('문서 미리보기 실패:', error);
      toast.error('문서 미리보기 중 오류가 발생했습니다.');
    }
  };

  const handleQRCode = (member: DBMember) => {
    setSelectedMemberForQR(member);
    setQrModalOpen(true);
  };

  const handleQRModalClose = () => {
    setQrModalOpen(false);
    setSelectedMemberForQR(null);
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
    setFilteredMembers(members);
  };

  // 고유한 지점명들을 필터 옵션으로 생성
  const branchNames = Array.from(new Set(members.map(member => member.branchName))).filter(Boolean);
  const filterOptions = ['남성', '여성', '로그인사용', ...branchNames];

  if (loading) {
    return (
      <PageContainer>
        <LoadingState>
          <h3>회원 데이터를 불러오는 중...</h3>
        </LoadingState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SearchSection>
        <SearchRow>
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="회원명, 전화번호, 이메일, 코치명으로 검색..."
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

      <ResultsSection>
        <ResultsHeader>
          <ResultsTitle>검색 결과</ResultsTitle>
          <ResultsCount>총 {filteredMembers.length}명</ResultsCount>
        </ResultsHeader>

        {filteredMembers.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>이름</TableHeaderCell>
                  <TableHeaderCell>연락처</TableHeaderCell>
                  <TableHeaderCell>이메일</TableHeaderCell>
                  <TableHeaderCell>지점</TableHeaderCell>
                  <TableHeaderCell>담당코치</TableHeaderCell>
                  <TableHeaderCell>가입경로</TableHeaderCell>
                  <TableHeaderCell>라커</TableHeaderCell>
                  <TableHeaderCell>상태</TableHeaderCell>
                  <TableHeaderCell>QR</TableHeaderCell>
                  <TableHeaderCell>액션</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <tbody>
                {filteredMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>{member.email || '-'}</TableCell>
                    <TableCell>{member.branchName || '-'}</TableCell>
                    <TableCell>{member.coachName || '-'}</TableCell>
                    <TableCell>{member.joinPath || '-'}</TableCell>
                    <TableCell>
                      {member.lockerInfo ? (
                        <div>
                          <div style={{ fontWeight: '600', color: AppColors.primary }}>
                            {member.lockerInfo.lockerNumber}번
                          </div>
                          <div style={{ fontSize: '12px', color: AppColors.onInput1 }}>
                            ~{new Date(member.lockerInfo.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: AppColors.onInput1 }}>미사용</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge $status={member.isActive ? 'active' : 'inactive'}>
                        {member.isActive ? '활성' : '비활성'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <ActionButton onClick={() => handleQRCode(member)}>
                        QR
                      </ActionButton>
                    </TableCell>
                    <TableCell>
                      <ActionButtons>
                        <ActionButton onClick={() => handlePreviewDocument(member)}>
                          문서보기
                        </ActionButton>
                      </ActionButtons>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyState>
            <EmptyStateTitle>검색 결과가 없습니다</EmptyStateTitle>
            <EmptyStateDescription>
              다른 검색어를 입력하거나 필터를 조정해보세요.
            </EmptyStateDescription>
          </EmptyState>
        )}
      </ResultsSection>
      
      {/* QR 코드 모달 */}
      {selectedMemberForQR && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={handleQRModalClose}
          memberName={selectedMemberForQR.name}
          memberId={selectedMemberForQR.id}
        />
      )}
    </PageContainer>
  );
};

export default MemberSearch;
