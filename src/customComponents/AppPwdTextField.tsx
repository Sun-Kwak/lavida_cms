'use client';

import React, { useState, useEffect } from 'react';
import { AppTextField } from './AppTextField';
import { AppColors } from '../styles/colors';

// 다국어 텍스트 객체
const texts = {
  ko: {
    password: '비밀번호',
    passwordConfirm: '비밀번호 확인',
    passwordPlaceholder: '(영어 + 숫자 + 특수문자 포함 8자 이상)',
    passwordConfirmPlaceholder: '비밀번호를 한 번 더 입력해주세요',
    passwordError: '비밀번호는 영문자, 숫자, 특수문자를 포함하여 8자리 이상이어야 합니다',
    passwordConfirmError: '비밀번호가 일치하지 않습니다',
    passwordValid: '✓ 유효한 비밀번호입니다',
    passwordConfirmValid: '✓ 비밀번호가 일치합니다'
  },
  en: {
    password: 'Password',
    passwordConfirm: 'Confirm Password',
    passwordPlaceholder: '(8+ chars with letters, numbers, and symbols)',
    passwordConfirmPlaceholder: 'Please enter your password again',
    passwordError: 'Password must be at least 8 characters with letters, numbers, and symbols',
    passwordConfirmError: 'Passwords do not match',
    passwordValid: '✓ Valid password',
    passwordConfirmValid: '✓ Passwords match'
  },
};

export enum PwdFieldType {
  PASSWORD = 'password',
  PASSWORD_CONFIRM = 'passwordConfirm'
}

export interface AppPwdTextFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  fieldType: PwdFieldType;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  readOnly?: boolean;
  
  // 비밀번호 validation 관련
  onValidationChange?: (isValid: boolean) => void;
  showValidationMessage?: boolean;
  
  // 비밀번호 확인용 (fieldType이 PASSWORD_CONFIRM일 때)
  originalPassword?: string;
  
  // 기타 TextField props
  autoComplete?: string;
  autoFocus?: boolean;
  
  // 언어 설정
  language?: 'ko' | 'en';
}

export const AppPwdTextField: React.FC<AppPwdTextFieldProps> = ({
  value,
  onChange,
  fieldType,
  label,
  placeholder,
  errorMessage,
  readOnly = false,
  onValidationChange,
  showValidationMessage = true,
  originalPassword = '',
  autoComplete,
  autoFocus = false,
  language = 'ko',
}) => {
  const [internalError, setInternalError] = useState<string>('');

  const t = texts[language];

  // 기본 라벨과 placeholder 설정
  const defaultLabel = fieldType === PwdFieldType.PASSWORD ? t.password : t.passwordConfirm;
  const defaultPlaceholder = fieldType === PwdFieldType.PASSWORD 
    ? t.passwordPlaceholder
    : t.passwordConfirmPlaceholder;
  const defaultAutoComplete = fieldType === PwdFieldType.PASSWORD ? 'new-password' : 'new-password';

  // 비밀번호 validation (영문, 숫자, 특수문자 각각 1개 이상 포함, 8자 이상)
  const validatePassword = (pwd: string) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(pwd);
  };

  // 비밀번호 확인 validation
  const validatePasswordConfirm = (confirmPwd: string, originalPwd: string) => {
    return confirmPwd === originalPwd;
  };

  // validation 로직
  const isValid = fieldType === PwdFieldType.PASSWORD 
    ? validatePassword(value)
    : validatePasswordConfirm(value, originalPassword);

  // validation 상태 변경 시 콜백 호출
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [isValid, onValidationChange]);

  // 내부 에러 메시지 처리
  useEffect(() => {
    if (value && !isValid && showValidationMessage) {
      if (fieldType === PwdFieldType.PASSWORD) {
        setInternalError(t.passwordError);
      } else {
        setInternalError(t.passwordConfirmError);
      }
    } else {
      setInternalError('');
    }
  }, [value, isValid, showValidationMessage, fieldType, t]);

  // 외부에서 전달된 errorMessage가 우선
  const displayErrorMessage = errorMessage || internalError;

  // const validationMessage = showValidationMessage && value && !displayErrorMessage && isValid ? (
  //   <div style={{ 
  //     fontSize: '12px', 
  //     color: AppColors.onInput2, 
  //     marginTop: '4px' 
  //   }}>
  //     {fieldType === PwdFieldType.PASSWORD 
  //       ? t.passwordValid
  //       : t.passwordConfirmValid}
  //   </div>
  // ) : null;

  return (
    <div>
      <AppTextField
        value={value}
        onChange={onChange}
        label={label || defaultLabel}
        placeholder={placeholder || defaultPlaceholder}
        errorMessage={displayErrorMessage}
        readOnly={readOnly}
        isPasswordField={true}
        showSuffixIcon={true}
        autoComplete={autoComplete || defaultAutoComplete}
        autoFocus={autoFocus}
        type="password"
      />
      {/* {validationMessage} */}
    </div>
  );
};
