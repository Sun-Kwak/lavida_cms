'use client';

import React, { useState, useEffect } from 'react';
import { AppTextField } from './AppTextField';
import { AuthButton } from './AuthButton';

// 다국어 텍스트 객체
const texts = {
  ko: {
    authCode: "인증번호",
    placeholder: "인증번호 6자리를 입력하세요",
    verifyButton: "인증확인",
    errorMessage: "자리 숫자를 입력해주세요" // "{maxLength}자리 숫자를 입력해주세요"에서 사용
  },
  en: {
    authCode: "Verification Code",
    placeholder: "Enter 6-digit verification code",
    verifyButton: "Verify",
    errorMessage: "-digit number" // "Please enter {maxLength}-digit number"에서 사용
  },
};

export interface AppAuthCodeTextFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  readOnly?: boolean;
  
  // 인증번호 validation 관련
  onValidationChange?: (isValid: boolean) => void;
  showValidationMessage?: boolean;
  
  // 인증 확인 버튼 관련
  showVerifyButton?: boolean;
  onVerifyRequest?: () => void;
  verifyButtonText?: string;
  
  // 기타 TextField props
  autoFocus?: boolean;
  maxLength?: number;
  
  // 언어 설정
  language?: 'ko' | 'en';
}

export const AppAuthCodeTextField: React.FC<AppAuthCodeTextFieldProps> = ({
  value,
  onChange,
  label,
  placeholder,
  errorMessage,
  readOnly = false,
  onValidationChange,
  showValidationMessage = true,
  showVerifyButton = true,
  onVerifyRequest,
  verifyButtonText,
  autoFocus = false,
  maxLength = 6,
  language = 'ko',
}) => {
  const [internalError, setInternalError] = useState<string>('');
  
  const t = texts[language];
  
  // 기본값 설정 (언어에 따라)
  const displayLabel = label || t.authCode;
  const displayPlaceholder = placeholder || (language === 'ko' 
    ? `인증번호 ${maxLength}자리를 입력하세요`
    : `Enter ${maxLength}-digit verification code`);
  const displayVerifyButtonText = verifyButtonText || t.verifyButton;

  // 인증번호 validation (6자리 숫자)
  const validateAuthCode = (code: string) => {
    const authCodeRegex = new RegExp(`^\\d{${maxLength}}$`);
    return authCodeRegex.test(code);
  };

  const isAuthCodeValid = validateAuthCode(value);

  // validation 상태 변경 시 콜백 호출
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isAuthCodeValid);
    }
  }, [isAuthCodeValid, onValidationChange]);

  // 내부 에러 메시지 처리
  useEffect(() => {
    if (value && !isAuthCodeValid && showValidationMessage) {
      const errorMsg = language === 'ko' 
        ? `${maxLength}자리 숫자를 입력해주세요`
        : `Please enter ${maxLength}-digit number`;
      setInternalError(errorMsg);
    } else {
      setInternalError('');
    }
  }, [value, isAuthCodeValid, showValidationMessage, maxLength, language]);

  // 숫자만 입력 허용 및 길이 제한
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    // 숫자만 허용하고 최대 길이까지만
    const filteredValue = inputValue.replace(/\D/g, '').slice(0, maxLength);
    
    // 필터링된 값으로 이벤트 객체 수정
    e.target.value = filteredValue;
    onChange(e);
  };

  // 외부에서 전달된 errorMessage가 우선
  const displayErrorMessage = errorMessage || internalError;

  const rightElement = showVerifyButton ? (
    <AuthButton 
      isActive={isAuthCodeValid && !readOnly}
      onClick={onVerifyRequest}
    >
      {displayVerifyButtonText}
    </AuthButton>
  ) : undefined;

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
        autoFocus={autoFocus}
        type="text"
        inputMode="numeric"
      />
    </div>
  );
};
