'use client';

import React, { useState, useEffect } from 'react';
import { AppTextField } from './AppTextField';

// 다국어 텍스트 객체
const texts = {
  ko: {
    userId: '아이디',
    placeholder: '영문자와 숫자를 포함한 6~20자',
    errorMessage: '아이디는 영문자와 숫자를 포함한 6~20자여야 합니다'
  },
  en: {
    userId: 'User ID',
    placeholder: '6-20 characters with letters and numbers',
    errorMessage: 'User ID must be 6-20 characters with letters and numbers'
  },
};

export interface AppIdTextFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  readOnly?: boolean;
  
  // 아이디 validation 관련
  onValidationChange?: (isValid: boolean) => void;
  showValidationMessage?: boolean;
  
  // 기타 TextField props
  autoComplete?: string;
  autoFocus?: boolean;
  
  // 언어 설정
  language?: 'ko' | 'en';
}

export const AppIdTextField: React.FC<AppIdTextFieldProps> = ({
  value,
  onChange,
  label,
  placeholder,
  errorMessage,
  readOnly = false,
  onValidationChange,
  showValidationMessage = true,
  autoComplete = 'username',
  autoFocus = false,
  language = 'ko',
}) => {
  const [internalError, setInternalError] = useState<string>('');

  const t = texts[language];
  
  // 기본값 설정 (언어에 따라)
  const displayLabel = label || t.userId;
  const displayPlaceholder = placeholder || t.placeholder;

  // 아이디 validation (영문자와 숫자를 포함한 6~20자)
  const validateUserId = (value: string) => {
    const pattern = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{6,20}$/;
    return pattern.test(value);
  };

  // validation 로직
  const isValid = validateUserId(value);

  // validation 상태 변경 시 콜백 호출
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [isValid, onValidationChange]);

  // 내부 에러 메시지 처리
  useEffect(() => {
    if (value && !isValid && showValidationMessage) {
      setInternalError(t.errorMessage);
    } else {
      setInternalError('');
    }
  }, [value, isValid, showValidationMessage, t.errorMessage]);

  // 한글과 특수문자 입력 방지 처리 (영문자와 숫자만 허용)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    // 영문자와 숫자만 허용 (한글, 특수문자 제거)
    const filteredValue = inputValue.replace(/[^A-Za-z0-9]/g, '');
    
    // 필터링된 값으로 이벤트 객체 수정
    e.target.value = filteredValue;
    onChange(e);
  };

  // 외부에서 전달된 errorMessage가 우선
  const displayErrorMessage = errorMessage || internalError;

  return (
    <AppTextField
      value={value}
      onChange={handleChange}
      label={displayLabel}
      placeholder={displayPlaceholder}
      errorMessage={displayErrorMessage}
      readOnly={readOnly}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      type="text"
      inputMode="text"
    />
  );
};
