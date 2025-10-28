import React from 'react';
import { StaffTextField, StaffTextFieldProps } from './StaffTextField';

export interface StaffEmailFieldProps extends Omit<StaffTextFieldProps, 'type' | 'inputMode' | 'onChange'> {
  onChange: (value: string) => void;
}

export const StaffEmailField: React.FC<StaffEmailFieldProps> = ({
  value,
  onChange,
  label = '이메일',
  placeholder = 'example@email.com',
  required = true,
  ...props
}) => {
  const handleChange = (inputValue: string) => {
    // 한글 입력 방지 (한글 유니코드 범위: \u3130-\u318F, \uAC00-\uD7AF)
    const filteredValue = inputValue.replace(/[\u3130-\u318F\uAC00-\uD7AF]/g, '');
    onChange(filteredValue);
  };

  return (
    <StaffTextField
      {...props}
      type="email"
      inputMode="email"
      value={value}
      onChange={handleChange}
      label={label}
      placeholder={placeholder}
      required={required}
      autoComplete="email"
    />
  );
};
