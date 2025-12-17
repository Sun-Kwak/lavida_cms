'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { AppColors } from '../styles/colors';
import { DeviceType } from '../types/device';
import { useDevice } from '../context/DeviceContext';
import { StyledInput, StyledTextarea } from '../elements/InputElement';
import { InputStyles, LabelStyles } from '../constants/componentConstants';

const Label = styled.label<{ $labelPosition: 'vertical' | 'horizontal' | 'outlined' }>`
  margin-left: 8px;
  margin-bottom: ${({ $labelPosition }) => ($labelPosition === 'vertical' ? '8px' : '0')};
  flex: ${({ $labelPosition }) => ($labelPosition === 'horizontal' ? '1' : 'none')};
`;

const OutlinedLabel = styled.label<{ 
  $device: DeviceType; 
  $hasValue: boolean; 
  $isFocused: boolean;
  $labelBackgroundColor?: string;
  $labelTextColor?: string;
  $errorLabelColor?: string;
  $readOnlyLabelColor?: string;
  $hasError?: boolean;
  $isReadOnly?: boolean;
  $labelColor?: string;
}>`
  position: absolute;
  left: 12px;
  top: ${({ $hasValue, $isFocused, $hasError }) => ($hasValue || $isFocused || $hasError ? '-8px' : '50%')};
  transform: ${({ $hasValue, $isFocused, $hasError }) => ($hasValue || $isFocused || $hasError ? 'translateY(0)' : 'translateY(-50%)')};
  background-color: ${({ $hasValue, $isFocused, $hasError, $labelBackgroundColor }) => 
    ($hasValue || $isFocused || $hasError) ? ($labelBackgroundColor || 'white') : 'transparent'};
  padding: 0 4px;
  font-size: ${({ $hasValue, $isFocused, $hasError, $device }) => {
    const baseSize = $device === 'mobile' ? '14px' : '16px';
    return ($hasValue || $isFocused || $hasError) ? '12px' : baseSize;
  }};
  color: ${({ $hasError, $isReadOnly, $labelTextColor, $errorLabelColor, $readOnlyLabelColor, $labelColor }) => {
    if ($hasError && $errorLabelColor) return $errorLabelColor;
    if ($isReadOnly && $readOnlyLabelColor) return $readOnlyLabelColor;
    if ($labelColor) return $labelColor;
    if ($labelTextColor) return $labelTextColor;
    return AppColors.primary;
  }};
  transition: all 0.2s ease-in-out;
  cursor: text;
  z-index: 1;
`;

const Container = styled.div<{ $device: DeviceType; $labelPosition: 'vertical' | 'horizontal' | 'outlined' }>`
  display: flex;
  flex-direction: ${({ $labelPosition }) => ($labelPosition === 'vertical' ? 'column' : 'row')};
  width: 100%;
  padding: ${({ $device }) => InputStyles.containerPadding[$device]};
  align-items: ${({ $labelPosition }) => ($labelPosition === 'horizontal' ? 'center' : 'flex-start')};
  position: ${({ $labelPosition }) => ($labelPosition === 'outlined' ? 'relative' : 'static')};
`;

const InputWrapper = styled.div<{ $labelPosition: 'vertical' | 'horizontal' | 'outlined'; $hasRightElement?: boolean }>`
  display: flex;
  flex-direction: column;
  flex: ${({ $labelPosition }) => ($labelPosition === 'horizontal' ? '5' : '1')};
  width: ${({ $labelPosition }) => ($labelPosition === 'horizontal' ? 'auto' : '100%')};
  position: ${({ $labelPosition }) => ($labelPosition === 'outlined' ? 'relative' : 'static')};
`;

const InputSection = styled.div<{ $labelPosition: 'vertical' | 'horizontal' | 'outlined' }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  position: ${({ $labelPosition }) => ($labelPosition === 'outlined' ? 'relative' : 'static')};
`;

const InputWithRightElementWrapper = styled.div<{ $hasRightElement?: boolean }>`
  display: flex;
  flex-direction: ${({ $hasRightElement }) => $hasRightElement ? 'row' : 'column'};
  align-items: ${({ $hasRightElement }) => $hasRightElement ? 'center' : 'stretch'};
  width: 100%;
`;

const InputFieldWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
`;

const ErrorText = styled.span<{ $errorColor?: string }>`
  color: ${({ $errorColor }) => $errorColor || AppColors.error};
  font-size: 12px;
  margin-top: 4px;
  margin-left: 4px;
  display: block;
  text-align: left;
  width: 100%;
`;

const SuffixIconWrapper = styled.div<{
  $isPasswordVisible?: boolean;
  $device: DeviceType;
}>`
  position: absolute;
  right: ${({ $device }) => InputStyles.suffixIconRight[$device]};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ $isPasswordVisible }) =>
    $isPasswordVisible ? AppColors.iconPrimary : AppColors.iconDisabled};
`;

const RightElementWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: 12px;
  flex-shrink: 0;
  height: 48px; /* input의 기본 높이와 맞춤 */
`;

export interface TextFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  errorMessage?: string;
  showSuffixIcon?: boolean;
  isPasswordField?: boolean;
  readOnly?: boolean;
  background?: string;
  border?: string; 
  multiline?: boolean;
  minLines?: number;
  maxLines?: number;

  radius?: string;
  fontSize?: string;
  height?: string;
  padding?: string;
  paddingRight?: string;
  label?: string;
  labelColor?: string;
  $labelPosition?: 'vertical' | 'horizontal' | 'outlined';
  type?: string; // 추가: type 속성
  inputMode?: 'text' | 'search' | 'none' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal';
  $readOnlyBackground?: string; // 추가
  $readOnlyColor?: string;      // 추가

  autoComplete?: string;
  autoFocus?: boolean;
  
  // 우측 요소 (버튼, 카운터 등)
  rightElement?: React.ReactNode;
  
  // AppTextField용 색상 커스터마이징 props
  borderColor?: string;
  focusBorderColor?: string;
  placeholderColor?: string;
  labelBackgroundColor?: string;
  labelTextColor?: string;
  inputTextColor?: string;
  errorBorderColor?: string;
  errorLabelColor?: string;
  readOnlyBorderColor?: string;
  readOnlyLabelColor?: string;
  readOnlyTextColor?: string;
}

export const TextField = ({
  value,
  onChange,
  placeholder,
  errorMessage,
  showSuffixIcon,
  isPasswordField = false,
  readOnly = false,
  background,
  border,

  multiline = false,
  minLines,
  maxLines,

  radius,
  fontSize,
  height,
  padding,
  paddingRight,
  label,
  labelColor,
  $labelPosition = 'vertical',
  autoComplete,
  type = 'text', // 기본값을 'text'로 설정
  inputMode = 'text', // 기본값을 'text'로 설정

  $readOnlyBackground,
  $readOnlyColor,
  autoFocus = false,
  
  // 우측 요소
  rightElement,
  
  // AppTextField용 색상 props
  borderColor,
  focusBorderColor,
  placeholderColor,
  labelBackgroundColor,
  labelTextColor,
  inputTextColor,
  errorBorderColor,
  errorLabelColor,
  readOnlyBorderColor,
  readOnlyLabelColor,
  readOnlyTextColor,
}: TextFieldProps) => {
  const device = useDevice();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleToggleVisibility = () => setIsPasswordVisible((prev) => !prev);

  // 라벨 클릭 시 input에 포커스
  const handleLabelClick = () => {
    if (!readOnly && containerRef.current) {
      const input = containerRef.current.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
      if (input) {
        input.focus();
      }
    }
  };


  // iOS에서 autoFocus 작동을 위한 useEffect
  useEffect(() => {
    if (autoFocus && !readOnly && containerRef.current) {
      const timer = setTimeout(() => {
        const input = containerRef.current?.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
        if (input) {
          input.focus();
        }
      }, 100); // 약간의 딜레이 추가
      
      return () => clearTimeout(timer);
    }
  }, [autoFocus, readOnly]);

  const resolvedInputType = isPasswordField && !isPasswordVisible ? 'password' : 'text';

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(false);
  };

  const commonProps = {
    value,
    onChange,
    placeholder: (() => {
      // outlined 라벨이 있고, 라벨이 input 내부에 있을 때는 placeholder 숨김
      if ($labelPosition === 'outlined' && label && !value && !isFocused && !errorMessage) {
        return '';
      }
      return placeholder;
    })(),
    radius,
    fontSize,
    background,
    height,
    border: (() => {
      if (errorMessage && errorBorderColor) return `1px solid ${errorBorderColor}`;
      if (readOnly && readOnlyBorderColor) return `1px solid ${readOnlyBorderColor}`;
      if (borderColor) return `1px solid ${borderColor}`;
      return border;
    })(),
    padding,
    paddingRight,
    readOnly,
    $hasSuffix: !!(showSuffixIcon && isPasswordField),
    $device: device,
    autoComplete,
    type: resolvedInputType,
    inputMode,
    $readOnlyBackground,
    $readOnlyColor,
    autoFocus,
    onFocus: handleFocus,
    onBlur: handleBlur,
    style: {
      color: (() => {
        if (readOnly && readOnlyTextColor) return readOnlyTextColor;
        if (inputTextColor) return inputTextColor;
        return undefined;
      })(),
    }
  };

  // styled-components 전용 props
  const styledProps = {
    placeholderColor,
    focusBorderColor: (() => {
      if (errorMessage && errorBorderColor) return errorBorderColor;
      if (readOnly && readOnlyBorderColor) return readOnlyBorderColor;
      if (focusBorderColor) return focusBorderColor;
      return undefined;
    })(),
  };

  return (
    <Container ref={containerRef} $device={device} $labelPosition={$labelPosition}>
      {label && $labelPosition !== 'outlined' && (
        <Label
          $labelPosition={$labelPosition}
          style={{
            fontSize: LabelStyles.fontSize[device],
            color: labelColor || LabelStyles.color,
          }}
        >
          {label}
        </Label>
      )}

      <InputWrapper $labelPosition={$labelPosition} $hasRightElement={!!rightElement}>
        {label && $labelPosition === 'outlined' && (
          <OutlinedLabel
            $device={device}
            $hasValue={!!value}
            $isFocused={isFocused}
            $labelBackgroundColor={labelBackgroundColor}
            $labelTextColor={labelTextColor}
            $errorLabelColor={errorLabelColor}
            $readOnlyLabelColor={readOnlyLabelColor}
            $hasError={!!errorMessage}
            $isReadOnly={readOnly}
            $labelColor={labelColor}
            onClick={handleLabelClick}
          >
            {label}
          </OutlinedLabel>
        )}
        
        <InputWithRightElementWrapper $hasRightElement={!!rightElement}>
          <InputSection $labelPosition={$labelPosition}>
            <InputFieldWrapper>
              {multiline ? (
                <StyledTextarea
                  {...commonProps}
                  {...styledProps}
                  rows={minLines || 1}
                  resize="none"
                />
              ) : (
                <>
                  <StyledInput
                    {...commonProps}
                    {...styledProps}
                    type={resolvedInputType}
                  />
                  {showSuffixIcon && isPasswordField && (
                    <SuffixIconWrapper
                      onClick={handleToggleVisibility}
                      $isPasswordVisible={isPasswordVisible}
                      $device={device}
                    >
                      {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                    </SuffixIconWrapper>
                  )}
                </>
              )}
            </InputFieldWrapper>
          </InputSection>

          {rightElement && (
            <RightElementWrapper>
              {rightElement}
            </RightElementWrapper>
          )}
        </InputWithRightElementWrapper>

        {errorMessage && <ErrorText $errorColor={errorBorderColor}>{errorMessage}</ErrorText>}
      </InputWrapper>
    </Container>
  );
};
