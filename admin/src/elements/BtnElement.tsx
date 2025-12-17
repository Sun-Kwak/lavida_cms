import styled from "styled-components";
import { AppColors } from "../styles/colors";

export type ButtonVariant = "filled" | "outlined" | "text" | "primary";
export type ButtonSize = "small" | "medium" | "large";

interface StyledButtonProps {
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
}

// Open for extension

const getButtonVariantStyles = (variant: ButtonVariant) => {
  switch (variant) {
    case "filled":
      return `
        background-color: ${AppColors.primary};
        color: ${AppColors.onBackground};
        // &:hover {
        // background-color: ${AppColors.buttonPrimaryHover};
        // }
        `;
    case "outlined":
      return `
        background-color: transparent;
        border: 1px solid;
        // &:hover {
        //   background-color: ${AppColors.primary + "1A"};
        //   color: ${AppColors.primary};
        // }
            `;
    case "text":
      return `
        background-color: transparent;
        // &:hover {
        //   background-color: ${AppColors.primary + "1A"};
        //   color: ${AppColors.primary};
        // }
            `;
  }
};

const getButtonSizeStyles = (size: ButtonSize) => {
  switch (size) {
    case "small":
      return `
        font-size: 0.875rem;
        padding: 0.5rem;
            `;
    case "medium":
      return `
        font-size: 1rem;
        padding: 0.75rem;
            `;
    case "large":
      return `
        font-size: 1.125rem;
        padding: 1rem;
            `;
    default:
      return `
        font-size: 1rem;
        padding: 0.75rem;
            `;
  }
};

const BtnElement = styled.button<StyledButtonProps>`
  border: none;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;

  border-radius: 8px;
  // default styles
  ${({ $variant = "filled" }) => getButtonVariantStyles($variant)}
  ${({ $size = "medium" }) => getButtonSizeStyles($size)}
  width: ${({ $fullWidth = false }) => ($fullWidth ? "100%" : "")};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    border-color: transparent;
  }
`;

export default BtnElement;
