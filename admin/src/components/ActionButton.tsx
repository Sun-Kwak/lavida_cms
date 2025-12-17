import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import { ThemeMode } from '../styles/theme_colors';

const ActionButton = styled.button<{ $themeMode: ThemeMode }>`
  padding: 8px 15px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid ${AppColors.borderPrimary};
  background-color: ${({ $themeMode }) => ($themeMode === "light" ? "#FFFFFF" : AppColors.primary)};
  color: ${({ $themeMode }) => ($themeMode === "light" ? AppColors.primary : AppColors.onPrimary)};
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${({ $themeMode }) => ($themeMode === "light" ? AppColors.primary : AppColors.secondary)};
    color: ${AppColors.onPrimary};
    border-color: ${AppColors.secondary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: ${AppColors.buttonDisabled};
    color: #999;
    border-color: ${AppColors.borderLight};
  }
`;

export default ActionButton;