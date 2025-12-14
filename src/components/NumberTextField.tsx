import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';

interface NumberTextFieldProps {
  value: number | string | undefined;
  onChange: (value: number | undefined) => void; // undefined도 허용
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  step?: number;
  width?: string;
  allowEmpty?: boolean; // 빈 값을 허용할지 여부
  className?: string;
  style?: React.CSSProperties; // 스타일 prop 추가
}

const NumberInput = styled.input<{ 
  $error?: boolean; 
  $width?: string;
}>`
  width: ${props => props.$width || '100%'};
  min-height: 48px;
  padding: 14px 16px;
  border: 1px solid ${props => props.$error ? AppColors.error : AppColors.borderLight};
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  background: ${AppColors.surface};
  color: ${AppColors.onSurface};
  box-sizing: border-box;
  transition: all 0.2s ease;
  
  /* 스피너 버튼 제거 */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: textfield;
  
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.$error ? AppColors.error : AppColors.primary};
    box-shadow: 0 0 0 3px rgba(55, 187, 214, 0.1);
  }
  
  &:hover:not(:disabled) {
    border-color: ${props => props.$error ? AppColors.error : AppColors.primary};
    box-shadow: 0 2px 8px rgba(55, 187, 214, 0.1);
  }
  
  &:disabled {
    background-color: ${AppColors.background};
    color: ${AppColors.disabled};
    cursor: not-allowed;
    border-color: ${AppColors.borderLight};
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
    opacity: 0.7;
  }
`;

const NumberTextField: React.FC<NumberTextFieldProps> = ({
  value,
  onChange,
  placeholder = "숫자를 입력하세요",
  disabled = false,
  error = false,
  step,
  width,
  allowEmpty = false,
  className,
  style
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // 빈 값 처리
    if (inputValue === '' || inputValue === '-') {
      if (allowEmpty) {
        // 빈 값을 허용하는 경우 undefined 전달
        onChange(undefined);
        return;
      } else {
        // 빈 값을 허용하지 않는 경우 0으로 설정
        onChange(0);
        return;
      }
    }
    
    // 숫자만 허용 (음수, 소수점 포함)
    const numericValue = parseFloat(inputValue);
    
    if (!isNaN(numericValue)) {
      // 실시간 min/max 범위 체크 제거 - 입력 과정에서는 자유롭게 입력 허용
      onChange(numericValue);
    } else if (allowEmpty) {
      // allowEmpty가 true이고 유효하지 않은 값인 경우에도 undefined 전달
      onChange(undefined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 허용되는 키: 숫자, 백스페이스, 삭제, 탭, 엔터, 화살표, 마이너스, 소수점
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    
    const allowedChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '-'];
    
    if (allowedKeys.includes(e.key)) {
      return; // 허용되는 키는 그대로 통과
    }
    
    if (!allowedChars.includes(e.key)) {
      e.preventDefault(); // 허용되지 않는 문자는 차단
      return;
    }
    
    // 소수점은 하나만 허용
    if (e.key === '.' && e.currentTarget.value.includes('.')) {
      e.preventDefault();
      return;
    }
    
    // 마이너스는 맨 앞에만 허용
    if (e.key === '-' && e.currentTarget.selectionStart !== 0) {
      e.preventDefault();
      return;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // 빈 값이고 allowEmpty가 false인 경우에만 0으로 설정
    if (!allowEmpty && (inputValue === '' || inputValue === '-')) {
      onChange(0);
      return;
    }
    
    // allowEmpty가 true인 경우 빈 값을 그대로 유지
    if (allowEmpty && (inputValue === '' || inputValue === '-')) {
      onChange(undefined);
      return;
    }
  };

  // 값 표시 처리
  const displayValue = (() => {
    if (value === undefined || value === null) {
      return '';
    }
    // allowEmpty가 true이고 값이 0이 아닌 경우에만 빈 문자열로 표시하지 않음
    // 0도 유효한 값으로 표시
    return value.toString();
  })();

  return (
    <NumberInput
      type="text" // number 대신 text를 사용해서 더 자유로운 입력 허용
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      $error={error}
      $width={width}
      step={step}
      className={className}
      style={style}
      inputMode="numeric" // 모바일에서 숫자 키패드 표시
    />
  );
};

export default NumberTextField;