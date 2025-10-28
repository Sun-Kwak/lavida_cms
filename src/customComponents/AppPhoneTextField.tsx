import React from 'react';
import { AppTextField } from './AppTextField';

// 다국어 텍스트 객체
const texts = {
  ko: {
    contact: "연락처",
    placeholder: "연락처를 입력해주세요",
    errorMessage: "연락처는 {min}자리에서 {max}자리까지 입력해주세요"
  },
  en: {
    contact: "Phone Number",
    placeholder: "Please enter your phone number",
    errorMessage: "Phone number must be between {min} and {max} digits"
  },
};

interface AppPhoneTextFieldProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  language?: 'ko' | 'en';
}

export function AppPhoneTextField({
  value,
  onChange,
  label,
  placeholder,
  errorMessage,
  autoComplete = "tel",
  minLength = 8,
  maxLength = 15,
  language = 'ko'
}: AppPhoneTextFieldProps) {
  
  const t = texts[language];
  
  // 기본값 설정 (언어에 따라)
  const displayLabel = label || t.contact;
  const displayPlaceholder = placeholder || t.placeholder;
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // 숫자만 입력되도록 필터링
    const numbersOnly = e.target.value.replace(/[^0-9]/g, '');
    // 최대 자리수까지만 입력 허용
    const limitedNumbers = numbersOnly.slice(0, maxLength);
    // 유효성 검사
    const isValid = limitedNumbers.length >= minLength && limitedNumbers.length <= maxLength;
    
    onChange(limitedNumbers, isValid);
  };

  const defaultErrorMessage = errorMessage || 
    (value && (value.length < minLength || value.length > maxLength) 
      ? t.errorMessage.replace('{min}', minLength.toString()).replace('{max}', maxLength.toString())
      : '');

  return (
    <AppTextField
      value={value}
      onChange={handlePhoneChange}
      label={displayLabel}
      placeholder={displayPlaceholder}
      errorMessage={defaultErrorMessage}
      autoComplete={autoComplete}
      type="tel"
      inputMode="numeric"
    />
  );
}
