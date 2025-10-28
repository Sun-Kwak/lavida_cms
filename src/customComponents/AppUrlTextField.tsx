'use client';

import React, { useState, useEffect } from 'react';
import { AppTextField } from './AppTextField';

// 다국어 텍스트 객체
const urlTextFieldTexts = {
  ko: {
    defaultLabel: 'URL',
    defaultPlaceholder: 'URL을 입력해주세요 (예: https://example.com)',
    validationError: '올바른 URL 형식을 입력해주세요'
  },
  en: {
    defaultLabel: 'URL',
    defaultPlaceholder: 'Enter URL (e.g., https://example.com)',
    validationError: 'Please enter a valid URL format'
  }
};

export interface AppUrlTextFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  readOnly?: boolean;
  language?: 'ko' | 'en'; // 언어 설정
  
  // URL validation 관련
  onValidationChange?: (isValid: boolean) => void;
  showValidationMessage?: boolean;
  
  // 기타 TextField props
  autoComplete?: string;
  autoFocus?: boolean;
}

export const AppUrlTextField: React.FC<AppUrlTextFieldProps> = ({
  value,
  onChange,
  label,
  placeholder,
  errorMessage,
  readOnly = false,
  language = 'ko',
  onValidationChange,
  showValidationMessage = true,
  autoComplete = "url",
  autoFocus = false,
}) => {
  const texts = urlTextFieldTexts[language];
  
  // 다국어 적용된 기본값들
  const finalLabel = label || texts.defaultLabel;
  const finalPlaceholder = placeholder || texts.defaultPlaceholder;
  const [internalError, setInternalError] = useState<string>('');

  // URL validation
  const validateUrl = (url: string) => {
    try {
      // 빈 문자열은 유효하지 않은 것으로 처리
      if (!url.trim()) return false;
      
      // http:// 또는 https://가 없으면 자동으로 https:// 추가해서 검증
      const urlToValidate = url.match(/^https?:\/\//) ? url : `https://${url}`;
      
      // URL 생성자로 기본 검증
      const parsedUrl = new URL(urlToValidate);
      
      // 도메인이 유효한지 확인 (최소한 점이 하나는 있어야 함)
      const hostname = parsedUrl.hostname;
      if (!hostname || !hostname.includes('.')) {
        return false;
      }
      
      // 유효한 프로토콜인지 확인
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  };

  const isUrlValid = validateUrl(value);

  // validation 상태 변경 시 콜백 호출
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isUrlValid);
    }
  }, [isUrlValid, onValidationChange]);

  // 내부 에러 메시지 처리
  useEffect(() => {
    if (value && !isUrlValid && showValidationMessage) {
      setInternalError(texts.validationError);
    } else {
      setInternalError('');
    }
  }, [value, isUrlValid, showValidationMessage, texts.validationError]);

  // URL 입력 처리 (공백 제거, 소문자 변환)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let inputValue = e.target.value;
    
    // 공백 제거
    inputValue = inputValue.trim();
    
    // 한글 제거 (URL에는 한글이 들어갈 수 없음)
    inputValue = inputValue.replace(/[\u3130-\u318F\uAC00-\uD7AF]/g, '');
    
    // 필터링된 값으로 이벤트 객체 수정
    e.target.value = inputValue;
    onChange(e);
  };

  // 외부에서 전달된 errorMessage가 우선
  const displayErrorMessage = errorMessage || internalError;

  return (
    <div>
      <AppTextField
        value={value}
        onChange={handleChange}
        label={finalLabel}
        placeholder={finalPlaceholder}
        errorMessage={displayErrorMessage}
        readOnly={readOnly}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        type="url"
        inputMode="url"
      />
    </div>
  );
};
