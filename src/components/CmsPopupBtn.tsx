import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';

export enum CmsPopupBtnType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DANGER = 'danger',
}

interface CmsPopupBtnProps {
  type?: CmsPopupBtnType;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

const StyledButton = styled.button<{ $type: CmsPopupBtnType; $disabled?: boolean }>`
  width: 100px;
  height: 40px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  
  ${({ $type }) => {
    if ($type === CmsPopupBtnType.PRIMARY) {
      return `
        background-color: ${AppColors.primary};
        color: ${AppColors.onPrimary};
        border: 1px solid ${AppColors.primary};
        
        &:hover:not(:disabled) {
          background-color: ${AppColors.secondary};
          border-color: ${AppColors.secondary};
        }
      `;
    } else if ($type === CmsPopupBtnType.DANGER) {
      return `
        background-color: ${AppColors.error};
        color: white;
        border: 1px solid ${AppColors.error};
        
        &:hover:not(:disabled) {
          background-color: #e63946;
          border-color: #e63946;
        }
      `;
    } else {
      return `
        background-color: white;
        color: ${AppColors.primary};
        border: 1px solid ${AppColors.borderPrimary};
        
        &:hover:not(:disabled) {
          background-color: ${AppColors.btnCEmphasis};
          color: ${AppColors.secondary};
        }
      `;
    }
  }}
`;

const CmsPopupBtn: React.FC<CmsPopupBtnProps> = ({
  type = CmsPopupBtnType.PRIMARY,
  children,
  onClick,
  disabled = false,
}) => {
  return (
    <StyledButton
      $type={type}
      $disabled={disabled}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </StyledButton>
  );
};

export default CmsPopupBtn;
