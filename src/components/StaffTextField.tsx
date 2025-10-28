import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';

const FormField = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  grid-column: ${props => props.$fullWidth ? '1 / -1' : 'auto'};
`;

const Label = styled.label<{ $required?: boolean }>`
  font-size: ${AppTextStyles.label1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  
  &::after {
    content: ${props => props.$required ? '" *"' : '""'};
    color: ${AppColors.error};
  }
`;

const Input = styled.input`
  height: 48px;
  padding: 0 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 12px;
  font-size: ${AppTextStyles.body1.fontSize};
  outline: none;
  background: ${AppColors.surface};
  color: ${AppColors.onSurface};
  transition: all 0.2s ease;
  box-sizing: border-box;
  
  &:hover {
    border-color: ${AppColors.primary};
    box-shadow: 0 2px 8px rgba(55, 187, 214, 0.1);
  }
  
  &:focus {
    border-color: ${AppColors.primary};
    box-shadow: 0 0 0 3px rgba(55, 187, 214, 0.1);
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
  }
  
  &:disabled {
    background-color: ${AppColors.background};
    color: ${AppColors.disabled};
    border-color: ${AppColors.borderLight};
  }
`;

const ErrorMessage = styled.div`
  color: ${AppColors.error};
  font-size: ${AppTextStyles.label3.fontSize};
  margin-top: 4px;
`;

export interface StaffTextFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number';
  maxLength?: number;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
}

export const StaffTextField: React.FC<StaffTextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  errorMessage,
  required = false,
  disabled = false,
  fullWidth = false,
  type = 'text',
  maxLength,
  autoComplete,
  inputMode
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <FormField $fullWidth={fullWidth}>
      {label && (
        <Label $required={required}>
          {label}
        </Label>
      )}
      <Input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
      />
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </FormField>
  );
};
