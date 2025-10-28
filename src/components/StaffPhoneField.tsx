import React from 'react';
import { StaffTextField, StaffTextFieldProps } from './StaffTextField';

export interface StaffPhoneFieldProps extends Omit<StaffTextFieldProps, 'type' | 'inputMode' | 'onChange'> {
  onChange: (value: string) => void;
}

export const StaffPhoneField: React.FC<StaffPhoneFieldProps> = ({
  value,
  onChange,
  label = '전화번호',
  placeholder = '010-1234-5678',
  required = true,
  ...props
}) => {
  // 전화번호 자동 포맷팅 함수
  const formatPhoneNumber = (inputValue: string): string => {
    // 숫자만 추출
    const numbers = inputValue.replace(/[^\d]/g, '');
    
    // 11자리를 초과하면 잘라내기
    const truncated = numbers.slice(0, 11);
    
    // 자동 하이픈 추가
    if (truncated.length <= 3) {
      return truncated;
    } else if (truncated.length <= 7) {
      return `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
    } else {
      return `${truncated.slice(0, 3)}-${truncated.slice(3, 7)}-${truncated.slice(7)}`;
    }
  };

  const handleChange = (inputValue: string) => {
    const formattedPhone = formatPhoneNumber(inputValue);
    onChange(formattedPhone);
  };

  return (
    <StaffTextField
      {...props}
      type="tel"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      label={label}
      placeholder={placeholder}
      required={required}
      maxLength={13} // 010-1234-5678 형태로 최대 13자
      autoComplete="tel"
    />
  );
};
