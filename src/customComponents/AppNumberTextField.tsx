'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppTextField } from './AppTextField';

// 다국어 텍스트 객체
const texts = {
  ko: {
    number: "숫자",
    placeholder: "숫자를 입력해주세요",
    invalidNumber: "올바른 숫자를 입력해주세요",
    minValue: "최소값은 {min}입니다",
    maxValue: "최대값은 {max}입니다"
  },
  en: {
    number: "Number",
    placeholder: "Please enter a number",
    invalidNumber: "Please enter a valid number",
    minValue: "Minimum value is {min}",
    maxValue: "Maximum value is {max}"
  },
};

export interface AppNumberTextFieldProps {
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  readOnly?: boolean;
  
  // 숫자 관련 설정
  maxValue?: number;
  minValue?: number;
  allowDecimal?: boolean;
  decimalPlaces?: number;
  unit?: string;
  
  // validation 관련
  onValidationChange?: (isValid: boolean) => void;
  showValidationMessage?: boolean;
  
  // 기타 TextField props
  autoComplete?: string;
  autoFocus?: boolean;
  
  // 언어 설정
  language?: 'ko' | 'en';
}

export const AppNumberTextField: React.FC<AppNumberTextFieldProps> = ({
  value,
  onChange,
  label,
  placeholder,
  errorMessage,
  readOnly = false,
  maxValue,
  minValue = 0,
  allowDecimal = false,
  decimalPlaces = 2,
  unit,
  onValidationChange,
  showValidationMessage = true,
  autoComplete = "off",
  autoFocus = false,
  language = 'ko',
}) => {
  const [internalError, setInternalError] = useState<string>('');
  const [displayValue, setDisplayValue] = useState<string>('');

  const t = texts[language];
  
  // 기본값 설정 (언어에 따라)
  const displayLabel = label || t.number;
  const displayPlaceholder = placeholder || t.placeholder;

  // 숫자를 콤마 포맷으로 변환
  const formatNumberWithCommas = useCallback((num: string): string => {
    // 숫자가 아닌 문자 제거 (소수점 제외)
    const cleanNum = num.replace(/[^\d.]/g, '');
    
    if (!cleanNum) return '';
    
    // 소수점이 허용되지 않으면 소수점 제거
    const processedNum = allowDecimal ? cleanNum : cleanNum.replace(/\./g, '');
    
    // 소수점이 여러 개 있으면 첫 번째만 유지
    const parts = processedNum.split('.');
    if (parts.length > 2) {
      parts.splice(2);
    }
    
    // 정수 부분에 콤마 추가
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    // 소수점 자릿수 제한
    if (allowDecimal && parts.length === 2 && parts[1].length > decimalPlaces) {
      parts[1] = parts[1].substring(0, decimalPlaces);
    }
    
    return parts.join('.');
  }, [allowDecimal, decimalPlaces]);

  // 콤마를 제거하고 실제 숫자값 추출
  const getNumericValue = useCallback((formattedValue: string): number => {
    const cleanValue = formattedValue.replace(/,/g, '');
    return parseFloat(cleanValue) || 0;
  }, []);

  // 숫자 유효성 검증
  const validateNumber = useCallback((numericValue: number): boolean => {
    if (isNaN(numericValue)) return false;
    if (minValue !== undefined && numericValue < minValue) return false;
    if (maxValue !== undefined && numericValue > maxValue) return false;
    return true;
  }, [minValue, maxValue]);

  // value prop이 변경될 때 displayValue 업데이트
  useEffect(() => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value.toString());
    
    // NaN이거나 빈 값이면 빈 문자열로 표시
    if (isNaN(numericValue) || value === '') {
      setDisplayValue('');
    } else {
      const formattedValue = formatNumberWithCommas(numericValue.toString());
      if (formattedValue !== displayValue) {
        setDisplayValue(formattedValue);
      }
    }
  }, [value, formatNumberWithCommas, displayValue]);

  // validation 상태 변경 감지
  useEffect(() => {
    const numericValue = getNumericValue(displayValue);
    const isValid = validateNumber(numericValue);
    
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [displayValue, maxValue, minValue, onValidationChange, getNumericValue, validateNumber]);

  // 내부 에러 메시지 처리
  useEffect(() => {
    if (displayValue && showValidationMessage) {
      const numericValue = getNumericValue(displayValue);
      
      if (isNaN(numericValue)) {
        setInternalError(t.invalidNumber);
      } else if (minValue !== undefined && numericValue < minValue) {
        setInternalError(t.minValue.replace('{min}', minValue.toLocaleString()));
      } else if (maxValue !== undefined && numericValue > maxValue) {
        setInternalError(t.maxValue.replace('{max}', maxValue.toLocaleString()));
      } else {
        setInternalError('');
      }
    } else {
      setInternalError('');
    }
  }, [displayValue, maxValue, minValue, showValidationMessage, getNumericValue, t]);

  // 입력 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let inputValue = e.target.value;
    
    // 한글 및 특수문자 제거 (숫자, 콤마, 소수점만 허용)
    inputValue = inputValue.replace(/[^\d.,]/g, '');
    
    // 콤마 포맷팅 적용
    const formattedValue = formatNumberWithCommas(inputValue);
    setDisplayValue(formattedValue);
    
    // 실제 숫자값으로 변환하여 onChange 호출
    const numericValue = getNumericValue(formattedValue);
    e.target.value = numericValue.toString();
    onChange(e);
  };

  // 외부에서 전달된 errorMessage가 우선
  const displayErrorMessage = errorMessage || internalError;

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <AppTextField
        value={displayValue}
        onChange={handleChange}
        label={displayLabel}
        placeholder={displayPlaceholder}
        errorMessage={displayErrorMessage}
        readOnly={readOnly}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        type="text"
        inputMode="numeric"
        paddingRight={unit ? '50px' : undefined}
      />
      {unit && (
        <div style={{
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#495057',
          fontSize: '16px',
          fontWeight: '500',
          pointerEvents: 'none',
          zIndex: 2
        }}>
          {unit}
        </div>
      )}
    </div>
  );
};
