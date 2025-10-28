import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';

const ModalFooterContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 12px;
`;

const ModalButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  
  ${({ $variant }) => $variant === 'primary' ? `
    background-color: ${AppColors.btnCEmphasis};
    color: ${AppColors.onBtnCEmphasis};
    
    &:hover {
      background-color: #262626;
      color: #FFFFFF;
    }
  ` : `
    background-color: ${AppColors.btnC};
    color: ${AppColors.onBtnC};
    
    &:hover {
      background-color: #e0e0e0;
    }
  `}
`;

interface ModalFooterProps {
  leftButtonText: string;
  rightButtonText: string;
  onLeftClick: () => void;
  onRightClick: () => void;
}

const ModalFooter: React.FC<ModalFooterProps> = ({
  leftButtonText,
  rightButtonText,
  onLeftClick,
  onRightClick,
}) => {
  return (
    <ModalFooterContainer>
      <ModalButton $variant="secondary" onClick={onLeftClick}>
        {leftButtonText}
      </ModalButton>
      <ModalButton $variant="primary" onClick={onRightClick}>
        {rightButtonText}
      </ModalButton>
    </ModalFooterContainer>
  );
};

export default ModalFooter;
