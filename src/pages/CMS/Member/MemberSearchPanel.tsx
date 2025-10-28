import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { dbManager, type Member } from '../../../utils/indexedDB';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 12px 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  font-size: ${AppTextStyles.body1.fontSize};
  margin-bottom: 16px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
    box-shadow: 0 0 0 2px ${AppColors.primary}20;
  }
`;

const SearchResults = styled.div`
  flex: 1;
  overflow-y: auto;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
  min-height: 0; /* 플렉스 아이템이 축소될 수 있도록 */
`;

const MemberItem = styled.div<{ $selected: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid ${AppColors.borderLight};
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$selected ? AppColors.primary : 'transparent'};
  color: ${props => props.$selected ? AppColors.onPrimary : AppColors.onSurface};
  
  &:hover {
    background: ${props => props.$selected ? AppColors.primary : `${AppColors.primary}10`};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const MemberName = styled.div`
  font-weight: 600;
  font-size: ${AppTextStyles.body1.fontSize};
  margin-bottom: 4px;
`;

const MemberInfo = styled.div`
  font-size: ${AppTextStyles.body3.fontSize};
  opacity: 0.8;
  line-height: 1.4;
`;

const SelectedMemberCard = styled.div`
  background: ${AppColors.surface};
  border: 2px solid ${AppColors.primary};
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  width: 100%;
  box-sizing: border-box;
`;

const SelectedMemberName = styled.div`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 700;
  color: ${AppColors.primary};
  margin-bottom: 8px;
`;

const SelectedMemberDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: ${AppTextStyles.body3.fontSize};
  color: ${AppColors.onInput1};
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  grid-column: 1 / -1;
`;

const PointBalance = styled.div`
  background: ${AppColors.primary}15;
  border: 1px solid ${AppColors.primary}30;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  text-align: center;
`;

const PointAmount = styled.div`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 700;
  color: ${AppColors.primary};
`;

const PointLabel = styled.div`
  font-size: ${AppTextStyles.body3.fontSize};
  color: ${AppColors.onInput1};
  margin-top: 4px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${AppColors.onInput1};
  font-size: ${AppTextStyles.body2.fontSize};
`;

const NoResults = styled.div`
  text-align: center;
  padding: 20px;
  color: ${AppColors.onInput1};
  font-size: ${AppTextStyles.body2.fontSize};
`;

interface MemberSearchPanelProps {
  selectedMember: Member | null;
  onMemberSelect: (member: Member) => void;
  memberPointBalance: number;
  preselectedMember?: Member | null; // 미리 선택된 회원 (수정 불가)
  readonly?: boolean; // 읽기 전용 모드
}

const MemberSearchPanel: React.FC<MemberSearchPanelProps> = ({
  selectedMember,
  onMemberSelect,
  memberPointBalance,
  preselectedMember = null,
  readonly = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 미리 선택된 회원이 있으면 해당 회원을 자동으로 선택
  useEffect(() => {
    if (preselectedMember && !selectedMember) {
      onMemberSelect(preselectedMember);
    }
  }, [preselectedMember, selectedMember, onMemberSelect]);

  // 검색 수행 (읽기 전용 모드가 아닐 때만)
  useEffect(() => {
    if (readonly || preselectedMember) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await dbManager.searchMembers(searchQuery.trim());
        // 활성 회원만 필터링
        const activeMembers = results.filter(member => member.isActive);
        setSearchResults(activeMembers);
      } catch (error) {
        console.error('회원 검색 실패:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, readonly, preselectedMember]);

  const handleMemberClick = (member: Member) => {
    onMemberSelect(member);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR');
    } catch {
      return dateString;
    }
  };

  return (
    <Container>
      {/* 읽기 전용 모드가 아니고 미리 선택된 회원이 없을 때만 검색 입력 표시 */}
      {!readonly && !preselectedMember && (
        <SearchInput
          type="text"
          placeholder="회원명, 전화번호, 이메일로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}

      {/* 미리 선택된 회원이 있거나 읽기 전용 모드에서 선택된 회원이 있을 때 */}
      {((readonly || preselectedMember) && selectedMember) || (selectedMember && !searchQuery.trim()) ? (
        <SelectedMemberCard>
          <SelectedMemberName>
            {selectedMember.name}
            {readonly || preselectedMember ? (
              <span style={{ fontSize: '14px', fontWeight: 'normal', color: AppColors.onInput1, marginLeft: '8px' }}>
                (선택된 회원)
              </span>
            ) : null}
          </SelectedMemberName>
          <SelectedMemberDetails>
            <DetailRow>
              <span>전화번호:</span>
              <span>{selectedMember.phone}</span>
            </DetailRow>
            <DetailRow>
              <span>이메일:</span>
              <span>{selectedMember.email || '-'}</span>
            </DetailRow>
            <DetailRow>
              <span>지점:</span>
              <span>{selectedMember.branchName}</span>
            </DetailRow>
            <DetailRow>
              <span>담당코치:</span>
              <span>{selectedMember.coachName}</span>
            </DetailRow>
            <DetailRow>
              <span>가입일:</span>
              <span>{formatDate(selectedMember.registrationDate)}</span>
            </DetailRow>
          </SelectedMemberDetails>
          
          <PointBalance>
            <PointAmount>{memberPointBalance.toLocaleString()}원</PointAmount>
            <PointLabel>사용 가능한 포인트</PointLabel>
          </PointBalance>
        </SelectedMemberCard>
      ) : !readonly && !preselectedMember ? (
        <SearchResults>
          {!searchQuery.trim() ? (
            <EmptyState>
              위에서 회원을 검색해주세요.<br />
              이름, 전화번호, 이메일로 검색할 수 있습니다.
            </EmptyState>
          ) : isSearching ? (
            <EmptyState>검색 중...</EmptyState>
          ) : searchResults.length === 0 ? (
            <NoResults>
              검색 결과가 없습니다.<br />
              다른 검색어를 입력해보세요.
            </NoResults>
          ) : (
            searchResults.map((member) => (
              <MemberItem
                key={member.id}
                $selected={selectedMember?.id === member.id}
                onClick={() => handleMemberClick(member)}
              >
                <MemberName>{member.name}</MemberName>
                <MemberInfo>
                  {member.phone} • {member.email || '이메일 없음'}<br />
                  {member.branchName} • {member.coachName}<br />
                  가입일: {formatDate(member.registrationDate)}
                </MemberInfo>
              </MemberItem>
            ))
          )}
        </SearchResults>
      ) : null}
    </Container>
  );
};

export default MemberSearchPanel;