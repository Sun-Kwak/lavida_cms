import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';

interface ExpiredFilterButtonProps {
  expiredCount: number;
  onClick: () => void;
}

const FilterButton = styled.button<{ $hasExpired: boolean }>`
  padding: 12px 18px;
  border: 1px solid ${props => props.$hasExpired ? '#f59e0b' : AppColors.borderLight};
  border-radius: 8px;
  background: ${props => props.$hasExpired ? '#fef3c7' : AppColors.surface};
  color: ${props => props.$hasExpired ? '#d97706' : AppColors.onInput1};
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  cursor: ${props => props.$hasExpired ? 'pointer' : 'not-allowed'};
  opacity: ${props => props.$hasExpired ? 1 : 0.5};
  transition: all 0.2s;
  
  &:hover {
    ${props => props.$hasExpired && `
      opacity: 0.9;
      transform: translateY(-1px);
    `}
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ExpiredFilterButton: React.FC<ExpiredFilterButtonProps> = ({
  expiredCount,
  onClick
}) => {
  const hasExpired = expiredCount > 0;

  return (
    <FilterButton
      $hasExpired={hasExpired}
      onClick={() => {
        if (hasExpired) {
          onClick();
        }
      }}
      title={expiredCount === 0 ? '만료된 수강권이 없습니다' : '클릭하여 만료 수강권 처리'}
    >
      만료 {expiredCount}건
    </FilterButton>
  );
};

export default ExpiredFilterButton;