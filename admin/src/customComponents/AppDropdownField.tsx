'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { KeyboardArrowDown } from '@mui/icons-material';
import { AppColors } from '../styles/colors';
import { DeviceType } from '../types/device';
import { useDevice } from '../context/DeviceContext';
import { InputStyles } from '../constants/componentConstants';

const Container = styled.div<{ $device: DeviceType }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: ${({ $device }) => InputStyles.containerPadding[$device]};
  align-items: flex-start;
  position: relative;
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
}>`
  position: absolute;
  left: 12px;
  top: ${({ $hasValue, $isFocused, $hasError }) => ($hasValue || $isFocused || $hasError ? '-8px' : '50%')};
  transform: ${({ $hasValue, $isFocused, $hasError }) => ($hasValue || $isFocused || $hasError ? 'translateY(0)' : 'translateY(-50%)')};
  background-color: ${({ $hasValue, $isFocused, $hasError, $labelBackgroundColor }) => 
    ($hasValue || $isFocused || $hasError) ? ($labelBackgroundColor || AppColors.input) : 'transparent'};
  padding: 0 4px;
  font-size: ${({ $hasValue, $isFocused, $hasError, $device }) => {
    const baseSize = $device === 'mobile' ? '14px' : '16px';
    return ($hasValue || $isFocused || $hasError) ? '12px' : baseSize;
  }};
  color: ${({ $hasError, $isReadOnly, $labelTextColor, $errorLabelColor, $readOnlyLabelColor }) => {
    if ($hasError && $errorLabelColor) return $errorLabelColor;
    if ($isReadOnly && $readOnlyLabelColor) return $readOnlyLabelColor;
    if ($labelTextColor) return $labelTextColor;
    return AppColors.onInput2;
  }};
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  z-index: 1;
  pointer-events: none;
`;

const DropdownContainer = styled.div<{
  $radius?: string;
  $height?: string;
  $borderColor?: string;
  $focusBorderColor?: string;
  $errorBorderColor?: string;
  $readOnlyBorderColor?: string;
  $hasError?: boolean;
  $isReadOnly?: boolean;
  $isFocused?: boolean;
  $background?: string;
  $readOnlyBackground?: string;
}>`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: ${({ $height }) => $height || '48px'};
  border-radius: ${({ $radius }) => $radius || '12px'};
  border: ${({ $hasError, $isReadOnly, $isFocused, $errorBorderColor, $readOnlyBorderColor, $focusBorderColor, $borderColor }) => {
    if ($hasError && $errorBorderColor) return `1px solid ${$errorBorderColor}`;
    if ($isReadOnly && $readOnlyBorderColor) return `1px solid ${$readOnlyBorderColor}`;
    if ($isFocused && $focusBorderColor) return `1px solid ${$focusBorderColor}`;
    if ($borderColor) return `1px solid ${$borderColor}`;
    return `1px solid ${AppColors.onInput1}`;
  }};
  background-color: ${({ $isReadOnly, $background, $readOnlyBackground }) => {
    if ($isReadOnly && $readOnlyBackground) return $readOnlyBackground;
    if ($background) return $background;
    return AppColors.input;
  }};
  cursor: ${({ $isReadOnly }) => $isReadOnly ? 'default' : 'pointer'};
  transition: all 0.2s ease-in-out;
  box-sizing: border-box;
`;

const SelectedValue = styled.div<{
  $padding?: string;
  $placeholderColor?: string;
  $inputTextColor?: string;
  $readOnlyTextColor?: string;
  $isReadOnly?: boolean;
  $isPlaceholder?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  padding: ${({ $padding }) => $padding || '16px'};
  padding-right: 40px; /* 화살표 아이콘 공간 확보 */
  font-size: 16px;
  line-height: 1;
  color: ${({ $isPlaceholder, $isReadOnly, $placeholderColor, $inputTextColor, $readOnlyTextColor }) => {
    if ($isPlaceholder && $placeholderColor) return $placeholderColor;
    if ($isReadOnly && $readOnlyTextColor) return $readOnlyTextColor;
    if ($inputTextColor) return $inputTextColor;
    return $isPlaceholder ? AppColors.onInput1 : AppColors.onInput3;
  }};
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
`;

const ArrowIcon = styled.div<{
  $isOpen: boolean;
  $isReadOnly?: boolean;
}>`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $isReadOnly }) => $isReadOnly ? AppColors.onInput5 : AppColors.onInput2};
  transition: transform 0.2s ease-in-out;
  pointer-events: none;
  
  ${({ $isOpen }) => $isOpen && 'transform: translateY(-50%) rotate(180deg);'}
`;

const DropdownList = styled.div<{
  $isOpen: boolean;
  $radius?: string;
  $maxHeight?: string;
}>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background-color: ${AppColors.input};
  border: 1px solid ${AppColors.onInput1};
  border-radius: ${({ $radius }) => $radius || '12px'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: ${({ $maxHeight }) => $maxHeight || '200px'};
  overflow-y: auto;
  opacity: ${({ $isOpen }) => $isOpen ? 1 : 0};
  visibility: ${({ $isOpen }) => $isOpen ? 'visible' : 'hidden'};
  transform: ${({ $isOpen }) => $isOpen ? 'translateY(0)' : 'translateY(-8px)'};
  transition: all 0.2s ease-in-out;
`;

const DropdownItem = styled.div<{
  $isSelected?: boolean;
  $isHovered?: boolean;
}>`
  padding: 12px 16px;
  font-size: 16px;
  color: ${({ $isSelected }) => $isSelected ? AppColors.onInput3 : AppColors.onInput2};
  background-color: ${({ $isHovered, $isSelected }) => {
    if ($isSelected) return AppColors.onInput1 + '20'; // 20% opacity
    if ($isHovered) return AppColors.onInput1 + '10'; // 10% opacity
    return 'transparent';
  }};
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
  
  &:hover {
    background-color: ${AppColors.onInput1}20;
  }
  
  &:first-child {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
  
  &:last-child {
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }
  
  &:only-child {
    border-radius: 12px;
  }
`;

const ErrorText = styled.span<{ $errorColor?: string }>`
  color: ${({ $errorColor }) => $errorColor || AppColors.onInput4};
  font-size: 12px;
  margin-top: 4px;
  margin-left: 4px;
  display: block;
  text-align: left;
  width: 100%;
`;

const DividerWrapper = styled.div`
  display: flex;
  justify-content: center;
  /* padding: 8px 16px; */
`;

const SimpleDivider = styled.div<{ $color?: string }>`
  width: 100%;
  height: 1px;
  background-color: ${({ $color }) => $color || AppColors.onInput1};
`;

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// 다국어 텍스트 객체
const dropdownTexts = {
  ko: {
    defaultPlaceholder: '선택해주세요'
  },
  en: {
    defaultPlaceholder: 'Please select'
  }
};

export interface AppDropdownFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  label?: string;
  errorMessage?: string;
  readOnly?: boolean;
  disabled?: boolean;
  maxHeight?: string;
  language?: 'ko' | 'en'; // 언어 설정
  
  // AppTextField와 동일한 스타일링 props
  radius?: string;
  height?: string;
  padding?: string;
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
  background?: string;
  readOnlyBackground?: string;
}

export const AppDropdownField: React.FC<AppDropdownFieldProps> = ({
  value,
  onChange,
  options,
  placeholder,
  label,
  errorMessage,
  readOnly = false,
  disabled = false,
  maxHeight,
  language = 'ko',
  
  // 스타일링 props - AppTextField와 동일한 기본값
  radius = "12px",
  height = "48px",
  padding = "16px",
  borderColor = AppColors.onInput1,
  focusBorderColor = AppColors.onInput1,
  placeholderColor = AppColors.onInput1,
  labelBackgroundColor = AppColors.input,
  labelTextColor = AppColors.onInput2,
  inputTextColor = AppColors.onInput3,
  errorBorderColor = AppColors.onInput4,
  errorLabelColor = AppColors.onInput4,
  readOnlyBorderColor = AppColors.onInput5,
  readOnlyLabelColor = AppColors.onInput5,
  readOnlyTextColor = AppColors.onInput5,
  background = AppColors.input,
  readOnlyBackground = AppColors.input,
}) => {
  const texts = dropdownTexts[language];
  const finalPlaceholder = placeholder || texts.defaultPlaceholder;
  const device = useDevice();
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption?.label || '';
  const isPlaceholder = !selectedOption;
  
  // 외부 클릭 감지하여 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (readOnly || disabled) return;
    
    setIsOpen(!isOpen);
    setIsFocused(!isOpen); // 열릴 때 focused, 닫힐 때 unfocused
  };

  const handleSelect = (optionValue: string) => {
    if (readOnly || disabled) return;
    
    onChange(optionValue);
    setIsOpen(false);
    setIsFocused(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (readOnly || disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setIsFocused(false);
    }
  };

  return (
    <Container ref={containerRef} $device={device}>
      {label && (
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
        >
          {label}
        </OutlinedLabel>
      )}
      
      <DropdownContainer
        $radius={radius}
        $height={height}
        $borderColor={borderColor}
        $focusBorderColor={errorMessage ? errorBorderColor : focusBorderColor}
        $errorBorderColor={errorBorderColor}
        $readOnlyBorderColor={readOnlyBorderColor}
        $hasError={!!errorMessage}
        $isReadOnly={readOnly}
        $isFocused={isFocused}
        $background={background}
        $readOnlyBackground={readOnlyBackground}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={readOnly || disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <SelectedValue
          $padding={padding}
          $placeholderColor={placeholderColor}
          $inputTextColor={inputTextColor}
          $readOnlyTextColor={readOnlyTextColor}
          $isReadOnly={readOnly}
          $isPlaceholder={isPlaceholder}
        >
          {displayValue || (
            // outlined 라벨이 있고, 라벨이 dropdown 내부에 있을 때는 placeholder 숨김
            label && !value && !isFocused && !errorMessage ? '' : finalPlaceholder
          )}
        </SelectedValue>
        
        <ArrowIcon $isOpen={isOpen} $isReadOnly={readOnly}>
          <KeyboardArrowDown />
        </ArrowIcon>
        
        <DropdownList
          $isOpen={isOpen && !readOnly && !disabled}
          $radius={radius}
          $maxHeight={maxHeight}
          role="listbox"
        >
          {options.map((option, index) => (
            <React.Fragment key={option.value}>
              <DropdownItem
                $isSelected={option.value === value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
              </DropdownItem>
              {/* 마지막 옵션이 아닌 경우에만 Divider 추가 */}
              {index < options.length - 1 && (
                <DividerWrapper>
                  <SimpleDivider $color={AppColors.onInput1} />
                </DividerWrapper>
              )}
            </React.Fragment>
          ))}
        </DropdownList>
      </DropdownContainer>
      
      {errorMessage && (
        <ErrorText $errorColor={errorBorderColor}>
          {errorMessage}
        </ErrorText>
      )}
    </Container>
  );
};
