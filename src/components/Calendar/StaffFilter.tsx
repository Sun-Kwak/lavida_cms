import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';
import { type StaffInfo } from './types';
import { getCurrentUser, canEditStaffHoliday } from '../../utils/authUtils';

interface StaffFilterProps {
  staffList: StaffInfo[];
  selectedStaffIds: string[];
  onStaffFilter: (staffIds: string[]) => void;
  onHolidaySettings?: (staffId?: string) => void;
}

const FilterContainer = styled.div`
  padding: 16px;
  background-color: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  margin-bottom: 16px;
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const FilterTitle = styled.h3`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0;
`;

const FilterActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 4px 8px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  background-color: ${AppColors.background};
  color: ${AppColors.onSurface};
  font-size: ${AppTextStyles.label2.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${AppColors.primary}10;
    border-color: ${AppColors.primary}40;
    color: ${AppColors.primary};
  }
`;

const StaffGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
`;

const StaffItem = styled.div<{ $selected: boolean; $color: string }>`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 2px solid ${props => props.$selected ? props.$color : AppColors.borderLight};
  border-radius: 6px;
  background-color: ${props => props.$selected ? `${props.$color}10` : AppColors.background};
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    border-color: ${props => props.$color};
    background-color: ${props => `${props.$color}20`};
  }
`;

const StaffColorDot = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.$color};
  margin-right: 8px;
  flex-shrink: 0;
`;

const StaffDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const StaffName = styled.div`
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 500;
  color: ${AppColors.onSurface};
  margin-bottom: 4px;
`;

const HolidayButton = styled.button`
  padding: 2px 6px;
  border: 1px solid ${AppColors.primary}40;
  border-radius: 3px;
  background-color: ${AppColors.primary}10;
  color: ${AppColors.primary};
  font-size: ${AppTextStyles.label3.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${AppColors.primary}20;
    border-color: ${AppColors.primary}60;
  }
`;

const SelectedCount = styled.div`
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${AppColors.onSurface}60;
  margin-top: 8px;
`;

const StaffFilter: React.FC<StaffFilterProps> = ({
  staffList,
  selectedStaffIds,
  onStaffFilter,
  onHolidaySettings
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: 'master' | 'coach' | 'admin' } | null>(null);

  // 현재 사용자 정보 로드
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('현재 사용자 정보 로드 실패:', error);
      }
    };

    loadCurrentUser();
  }, []);

  // 휴일설정 권한 체크
  const canEditHoliday = (staffId: string): boolean => {
    if (!currentUser) return false;
    
    // 마스터 권한은 모든 직원 편집 가능
    if (currentUser.role === 'master') return true;
    
    // 본인만 편집 가능
    return currentUser.id === staffId;
  };

  // 코치 직원들만 필터링
  const coachStaff = staffList.filter(staff => 
    staff.isActive && staff.program // 담당 프로그램이 있는 활성 직원
  );

  const handleStaffToggle = (staffId: string) => {
    const newSelectedIds = selectedStaffIds.includes(staffId)
      ? selectedStaffIds.filter(id => id !== staffId)
      : [...selectedStaffIds, staffId];
    
    onStaffFilter(newSelectedIds);
  };

  const handleSelectAll = () => {
    onStaffFilter(coachStaff.map(staff => staff.id));
  };

  const handleSelectNone = () => {
    onStaffFilter([]);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (coachStaff.length === 0) {
    return null;
  }

  return (
    <FilterContainer>
      <FilterHeader>
        <FilterTitle onClick={toggleExpanded} style={{ cursor: 'pointer' }}>
          코치 필터 {isExpanded ? '▼' : '▶'} ({selectedStaffIds.length}/{coachStaff.length})
        </FilterTitle>
        {isExpanded && (
          <FilterActions>
            <ActionButton onClick={handleSelectAll}>
              전체 선택
            </ActionButton>
            <ActionButton onClick={handleSelectNone}>
              선택 해제
            </ActionButton>
            {/* <ActionButton onClick={() => onHolidaySettings?.()}>
              휴일설정
            </ActionButton> */}
          </FilterActions>
        )}
      </FilterHeader>

      {isExpanded && (
        <>
          <StaffGrid>
            {coachStaff.map((staff) => (
              <StaffItem
                key={staff.id}
                $selected={selectedStaffIds.includes(staff.id)}
                $color={staff.color || AppColors.primary}
                onClick={() => handleStaffToggle(staff.id)}
              >
                <StaffColorDot $color={staff.color || AppColors.primary} />
                <StaffDetails>
                  <StaffName>{staff.name}</StaffName>
                  {canEditHoliday(staff.id) && (
                    <HolidayButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        onHolidaySettings?.(staff.id);
                      }}
                    >
                      휴일설정
                    </HolidayButton>
                  )}
                </StaffDetails>
              </StaffItem>
            ))}
          </StaffGrid>
          
          <SelectedCount>
            {selectedStaffIds.length > 0 
              ? `${selectedStaffIds.length}명의 코치가 선택됨`
              : '선택된 코치가 없습니다'
            }
          </SelectedCount>
        </>
      )}
    </FilterContainer>
  );
};

export default StaffFilter;
