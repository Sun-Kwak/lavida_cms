'use client';

import React, { useState, useEffect } from 'react';
import { AppTextField } from './AppTextField';
import { AuthButton } from './AuthButton';

// 다국어 텍스트 객체
const texts = {
  ko: {
    email: "이메일",
    placeholder: "이메일을 입력해주세요",
    authButton: "인증요청",
    errorMessage: "올바른 이메일 형식을 입력해주세요",
    validMessage: "✓ 유효한 이메일입니다"
  },
  en: {
    email: "Email",
    placeholder: "Please enter your email",
    authButton: "Request Auth",
    errorMessage: "Please enter a valid email format",
    validMessage: "✓ Valid email"
  },
};

export interface AppEmailTextFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  readOnly?: boolean;
  
  // 이메일 validation 관련
  onValidationChange?: (isValid: boolean) => void;
  showValidationMessage?: boolean;
  
  // 인증 버튼 관련
  showAuthButton?: boolean;
  onAuthRequest?: () => void;
  authButtonText?: string;
  
  // 기타 TextField props
  autoComplete?: string;
  autoFocus?: boolean;
  
  // 언어 설정
  language?: 'ko' | 'en';
}

export const AppEmailTextField: React.FC<AppEmailTextFieldProps> = ({
  value,
  onChange,
  label,
  placeholder,
  errorMessage,
  readOnly = false,
  onValidationChange,
  showValidationMessage = true,
  showAuthButton = false,
  onAuthRequest,
  authButtonText,
  autoComplete = "email",
  autoFocus = false,
  language = 'ko',
}) => {
  const [internalError, setInternalError] = useState<string>('');

  const t = texts[language];
  
  // 기본값 설정 (언어에 따라)
  const displayLabel = label || t.email;
  const displayPlaceholder = placeholder || t.placeholder;
  const displayAuthButtonText = authButtonText || t.authButton;

  // 이메일 validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isEmailValid = validateEmail(value);

  // validation 상태 변경 시 콜백 호출
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isEmailValid);
    }
  }, [isEmailValid, onValidationChange]);

  // 내부 에러 메시지 처리
  useEffect(() => {
    if (value && !isEmailValid && showValidationMessage) {
      setInternalError(t.errorMessage);
    } else {
      setInternalError('');
    }
  }, [value, isEmailValid, showValidationMessage, t.errorMessage]);

  // 한글 입력 방지 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    // 한글 제거 (한글 유니코드 범위: \u3130-\u318F, \uAC00-\uD7AF)
    const filteredValue = inputValue.replace(/[\u3130-\u318F\uAC00-\uD7AF]/g, '');
    
    // 필터링된 값으로 이벤트 객체 수정
    e.target.value = filteredValue;
    onChange(e);
  };

  // 외부에서 전달된 errorMessage가 우선
  const displayErrorMessage = errorMessage || internalError;

  const rightElement = showAuthButton ? (
    <AuthButton 
      isActive={isEmailValid && !readOnly}
      onClick={onAuthRequest}
    >
      {displayAuthButtonText}
    </AuthButton>
  ) : undefined;

  // const validationMessage = showValidationMessage && value && !displayErrorMessage && isEmailValid ? (
  //   <div style={{ 
  //     fontSize: '12px', 
  //     color: AppColors.onInput2, 
  //     marginTop: '4px',
  //     paddingLeft: '16px',
  //     textAlign: 'left'
  //   }}>
  //     {t.validMessage}
  //   </div>
  // ) : null;

  return (
    <div>
      <AppTextField
        value={value}
        onChange={handleChange}
        label={displayLabel}
        placeholder={displayPlaceholder}
        errorMessage={displayErrorMessage}
        readOnly={readOnly}
        rightElement={rightElement}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        type="email"
        inputMode="email"
      />
      {/* {validationMessage} */}
    </div>
  );
};
