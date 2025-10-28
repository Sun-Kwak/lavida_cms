import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';

interface UnpaidFilterButtonProps {
  active: boolean;
  unpaidCount: number;
  totalAmount: number;
  onClick: () => void;
}

const FilterButton = styled.button<{ $active: boolean; $hasUnpaid: boolean }>`
  padding: 12px 18px;
  border: 1px solid ${props => props.$active ? '#dc2626' : (props.$hasUnpaid ? '#fca5a5' : AppColors.borderLight)};
  border-radius: 8px;
  background: ${props => props.$active ? '#dc2626' : (props.$hasUnpaid ? '#fef2f2' : AppColors.surface)};
  color: ${props => props.$active ? '#ffffff' : (props.$hasUnpaid ? '#dc2626' : AppColors.onInput1)};
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  cursor: ${props => props.$hasUnpaid ? 'pointer' : 'not-allowed'};
  opacity: ${props => props.$hasUnpaid ? 1 : 0.5};
  transition: all 0.2s;
  
  &:hover {
    ${props => props.$hasUnpaid && `
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

const UnpaidFilterButton: React.FC<UnpaidFilterButtonProps> = ({
  active,
  unpaidCount,
  totalAmount,
  onClick
}) => {
  const hasUnpaid = unpaidCount > 0;

  return (
    <FilterButton
      $active={active}
      $hasUnpaid={hasUnpaid}
      onClick={() => {
        if (hasUnpaid) {
          onClick();
        }
      }}
      title={unpaidCount === 0 ? '미수 고객이 없습니다' : ''}
    >
      미수 {unpaidCount}건
      {totalAmount > 0 && (
        <div style={{ fontSize: '11px', marginTop: '2px' }}>
          (총 {totalAmount.toLocaleString()}원)
        </div>
      )}
    </FilterButton>
  );
};

export default UnpaidFilterButton;
