import styled from 'styled-components';
import React from 'react';
import { DeviceType } from '../types/device';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';
import { InputStyles } from '../constants/componentConstants';

export interface BaseInputElementProps {
  radius?: string;
  padding?: string;
  height?: string;
  fontSize?: string;
  paddingRight?: string;
  $hasSuffix?: boolean;
  $device: DeviceType;
  background?: string;
  autoComplete?: string;
  $readOnlyBackground?: string; // 추가
  $readOnlyColor?: string;      // 추가
  inputMode?: string; // 추가
  placeholderColor?: string; // 추가
  focusBorderColor?: string; // 추가
}

// Textarea 전용 props
interface TextareaElementProps extends BaseInputElementProps {
  rows?: number;
  maxRows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

/** 단일 라인 input 필드 */
export const StyledInput = styled.input.withConfig({
  shouldForwardProp: (prop) => !['placeholderColor', 'focusBorderColor'].includes(prop),
})<BaseInputElementProps & { 
  border?: string; 
  focusBorderColor?: string;
  placeholderColor?: string;
}>`
  background: ${({ background, readOnly, $readOnlyBackground }) =>
    readOnly
      ? $readOnlyBackground || '#f5f5f5'
      : background || AppColors.surface};
  color: ${({ readOnly, $readOnlyColor }) =>
    readOnly
      ? $readOnlyColor || '#666'
      : AppColors.onSurface};
  padding: ${({ padding, $device }) => padding || InputStyles.padding[$device]};
  padding-right: ${({ paddingRight, $hasSuffix, $device }) =>
    paddingRight ||
    ($hasSuffix ? InputStyles.paddingRightWithSuffix[$device] : InputStyles.padding[$device])};

  border: ${({ border }) => border ?? `1px solid ${AppColors.borderLight}`};
  border-radius: ${({ radius, $device }) => radius || InputStyles.radius[$device]};
  font-size: ${({ fontSize }) => fontSize || AppTextStyles.body1.fontSize};
  width: 100%;
  height: ${({ height, $device }) => height || InputStyles.height[$device]};
  box-sizing: border-box;

  &:focus {
    border-color: ${({ focusBorderColor }) => focusBorderColor || AppColors.onSurface};
    outline: none;
  }

  /* 자동완성 스타일 제거 - 투명한 배경 사용 */
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px transparent inset !important;
    -webkit-text-fill-color: ${({ readOnly, $readOnlyColor }) =>
      readOnly ? $readOnlyColor || '#666' : AppColors.onSurface} !important;
    transition: background-color 5000s ease-in-out 0s;
  }

  &::placeholder {
    color: ${({ placeholderColor }) => placeholderColor || '#cdcdcd'};
    opacity: 1;
  }

  ${({ readOnly }) =>
    readOnly &&
    `
    cursor: default;
    `}
`;

/** 멀티라인 textarea 필드 (자동 높이 조절) */
const RawTextarea = styled.textarea.withConfig({
  shouldForwardProp: (prop) => !['placeholderColor', 'focusBorderColor'].includes(prop),
})<BaseInputElementProps & { 
  border?: string; 
  focusBorderColor?: string;
  placeholderColor?: string;
}>`
  background: ${({ background, readOnly, $readOnlyBackground }) =>
    readOnly
      ? $readOnlyBackground || '#f5f5f5'
      : background || AppColors.surface};
  color: ${({ readOnly, $readOnlyColor }) =>
    readOnly
      ? $readOnlyColor || '#666'
      : AppColors.onSurface};
  padding: ${({ padding, $device }) => padding || InputStyles.padding[$device]};
  padding-right: ${({ paddingRight, $hasSuffix, $device }) =>
    paddingRight ||
    ($hasSuffix ? InputStyles.paddingRightWithSuffix[$device] : InputStyles.padding[$device])};

  border: ${({ border }) => border ?? `1px solid ${AppColors.borderLight}`};
  border-radius: ${({ radius, $device }) => radius || InputStyles.radius[$device]};
  font-size: ${({ fontSize }) => fontSize || AppTextStyles.body1.fontSize};
  width: 100%;
  height: ${({ height }) => height || 'auto'};
  min-height: ${({ height }) => height || '80px'};
  resize: none;
  overflow: hidden;
  overflow-y: auto;
  line-height: 1.5;
  box-sizing: border-box;

  /* 스크롤바가 border-radius 영역을 벗어나지 않도록 설정 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: ${({ radius, $device }) => radius || InputStyles.radius[$device]};
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #999;
  }

  white-space: pre-wrap;
  word-break: break-word;

  &:focus {
    border-color: ${({ focusBorderColor }) => focusBorderColor || AppColors.onSurface};
    outline: none;
  }

  &::placeholder {
    color: ${({ placeholderColor }) => placeholderColor || AppColors.iconDisabled};
  }

  ${({ readOnly }) =>
    readOnly &&
    `
    cursor: default;
  `}
`;

/** 고정 높이 Textarea 컴포넌트 */
export const StyledTextarea: React.FC<TextareaElementProps> = ({
  value,
  onChange,
  ...rest
}) => {
  return (
    <RawTextarea
      value={value}
      onChange={onChange}
      {...rest}
    />
  );
};

