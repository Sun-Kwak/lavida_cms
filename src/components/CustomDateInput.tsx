import React, { useRef } from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';

interface CustomDateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  min?: string; // 최소 날짜 (YYYY-MM-DD 형식)
  max?: string; // 최대 날짜 (YYYY-MM-DD 형식)
  defaultViewDate?: string; // 기본 달력 뷰 날짜 (값이 없을 때 표시할 날짜)
}

const DateInputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const DateInputWrapper = styled.div<{ $error?: boolean; $hasValue: boolean; $disabled?: boolean }>`
  height: 48px;
  padding: 0 12px;
  border: 1px solid ${props => props.$error ? AppColors.error : AppColors.borderLight};
  border-radius: 12px;
  background: ${props => props.$disabled ? AppColors.background : AppColors.surface};
  color: ${props => props.$disabled ? AppColors.disabled : AppColors.onSurface};
  transition: all 0.2s ease;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  
  &:hover {
    ${props => !props.$disabled && `
      border-color: ${props.$error ? AppColors.error : AppColors.primary};
      box-shadow: 0 2px 8px rgba(55, 187, 214, 0.1);
    `}
  }
  
  &:focus-within {
    ${props => !props.$disabled && `
      border-color: ${props.$error ? AppColors.error : AppColors.primary};
      box-shadow: 0 0 0 3px rgba(55, 187, 214, 0.1);
    `}
  }
`;

const HiddenDateInput = styled.input.attrs({ type: 'date' })`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
`;

const DateDisplay = styled.span<{ $hasValue: boolean; $disabled?: boolean }>`
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${props => {
    if (props.$disabled) return AppColors.disabled;
    return props.$hasValue ? AppColors.onSurface : AppColors.onInput1;
  }};
  flex: 1;
`;

const CalendarIcon = styled.div<{ $disabled?: boolean }>`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$disabled ? AppColors.disabled : AppColors.onInput1};
  margin-left: 8px;
`;

const CustomDateInput: React.FC<CustomDateInputProps> = ({
  value,
  onChange,
  placeholder = "날짜를 선택하세요",
  disabled = false,
  error = false,
  required = false,
  min,
  max,
  defaultViewDate
}) => {
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const formatDateForDisplay = (dateValue: string): string => {
    if (!dateValue) return '';
    
    try {
      const date = new Date(dateValue);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateValue;
    }
  };

  const handleWrapperClick = () => {
    if (!disabled && hiddenInputRef.current) {
      // 값이 없을 때만 임시로 defaultViewDate 설정
      if (!value) {
        const viewDate = defaultViewDate || new Date().toISOString().split('T')[0];
        hiddenInputRef.current.value = viewDate;
        
        if (hiddenInputRef.current.showPicker) {
          hiddenInputRef.current.showPicker();
        } else {
          hiddenInputRef.current.focus();
        }
        
        // 사용자가 날짜를 선택하지 않으면 원래 값으로 복원
        setTimeout(() => {
          if (hiddenInputRef.current && hiddenInputRef.current.value === viewDate && !value) {
            hiddenInputRef.current.value = '';
          }
        }, 100);
      } else {
        if (hiddenInputRef.current.showPicker) {
          hiddenInputRef.current.showPicker();
        } else {
          hiddenInputRef.current.focus();
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <DateInputContainer>
      <DateInputWrapper
        $error={error}
        $hasValue={!!value}
        $disabled={disabled}
        onClick={handleWrapperClick}
      >
        <DateDisplay $hasValue={!!value} $disabled={disabled}>
          {value ? formatDateForDisplay(value) : placeholder}
        </DateDisplay>
        <CalendarIcon $disabled={disabled}>
          📅
        </CalendarIcon>
      </DateInputWrapper>
      
      <HiddenDateInput
        ref={hiddenInputRef}
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
      />
    </DateInputContainer>
  );
};

export default CustomDateInput;
