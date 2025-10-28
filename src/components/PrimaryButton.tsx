import { styled } from "styled-components";
import BtnElement from "../elements/BtnElement";
import { AppColors } from "../styles/colors";

const StyledPrimaryButton = styled(BtnElement)<{ $disabled?: boolean }>`
  background-color: ${({ $disabled }) => $disabled ? AppColors.btnE_Disabled : AppColors.btnE};
  color: ${({ $disabled }) => $disabled ? AppColors.onBtnE_Disabled : AppColors.onBtnE};
  border-radius: 16px;
  height: 48px;
  padding: 14px 0;
  font-size: 15px;
  font-weight: 500;
  cursor: ${({ $disabled }) => $disabled ? "not-allowed" : "pointer"};
  opacity: ${({ $disabled }) => $disabled ? 0.6 : 1};
  transition: background-color 0.2s, color 0.2s, opacity 0.2s;
  
  &:hover:not(:disabled) {
    background-color: ${AppColors.btnE_Hover};
    color: ${AppColors.onBtnE_Hover};
  }
`;

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export default function PrimaryButton({ children, onClick, disabled = false }: PrimaryButtonProps) {
  return (
    <StyledPrimaryButton
      $fullWidth={true}
      $variant="filled"
      $size="large"
      $disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </StyledPrimaryButton>
  );
}
