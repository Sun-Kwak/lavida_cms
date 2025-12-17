'use client';

import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';

export interface AuthButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean; // validation 통과 여부
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const StyledButton = styled.button<{ $isActive?: boolean }>`
  height: 48px;
  width: 76px;
  border-radius: 12px;
  padding: 12px;
  border: none;
  cursor: ${({ $isActive }) => $isActive ? 'pointer' : 'not-allowed'};
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease-in-out;
  
  background: ${({ $isActive }) => 
    $isActive ? AppColors.btnAActive : AppColors.btnA};
  color: ${AppColors.onBtnA};
  
  &:hover {
    background: ${({ $isActive }) => 
      $isActive ? AppColors.btnAHover : AppColors.btnA};
  }
  
  &:active {
    background: ${({ $isActive }) => 
      $isActive ? AppColors.btnAHover : AppColors.btnA};
  }
  
  &:focus {
    outline: ${({ $isActive }) => 
      $isActive ? `2px solid ${AppColors.btnAHover}` : 'none'};
    outline-offset: 2px;
  }
`;

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  onClick,
  isActive = false,
  type = 'button',
  className,
}) => {
  return (
    <StyledButton
      type={type}
      onClick={isActive ? onClick : undefined}
      $isActive={isActive}
      className={className}
    >
      {children}
    </StyledButton>
  );
};
