'use client';

import React from 'react';
import { TextField, TextFieldProps } from '../components/TextField';
import { AppColors } from '../styles/colors';

export interface AppTextFieldProps extends Omit<TextFieldProps, '$labelPosition'> {
  // AppTextField는 항상 outlined 스타일을 사용
}

export const AppTextField: React.FC<AppTextFieldProps> = ({
  errorMessage,
  readOnly = false,
  rightElement,
  height,
  ...props
}) => {
  return (
    <TextField
      {...props}
      $labelPosition="outlined"
      readOnly={readOnly}
      errorMessage={errorMessage}
      radius="12px"
      height={height || '48px'}
      padding="16px"
      
      // AppTextField 색상 스펙
      borderColor={AppColors.onInput1}
      focusBorderColor={errorMessage ? AppColors.onInput4 : AppColors.onInput1} // 에러일 때 onInput4
      placeholderColor={AppColors.onInput1}
      labelBackgroundColor={AppColors.input}
      labelTextColor={AppColors.onInput2}
      inputTextColor={AppColors.onInput3}
      errorBorderColor={AppColors.onInput4}
      errorLabelColor={AppColors.onInput4}
      readOnlyBorderColor={AppColors.onInput5}
      readOnlyLabelColor={AppColors.onInput5}
      readOnlyTextColor={AppColors.onInput5}
      
      // readonly일 때도 일반 input과 같은 배경색 사용
      $readOnlyBackground={AppColors.input}
      
      // 우측 요소
      rightElement={rightElement}
    />
  );
};
