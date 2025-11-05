import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  inModal?: boolean; // 모달 내부에서 사용되는지 여부
}

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
  /* 모달 내부에서 overflow visible 유지 */
  overflow: visible;
`;

const DropdownButton = styled.button<{ $isOpen: boolean; $hasValue: boolean; $error?: boolean }>`
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  border: 1px solid ${props => props.$error ? AppColors.error : AppColors.borderLight};
  border-radius: 12px;
  background: ${AppColors.surface};
  color: ${props => props.$hasValue ? AppColors.onSurface : AppColors.onInput1};
  font-size: ${AppTextStyles.body1.fontSize};
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:hover {
    border-color: ${props => props.$error ? AppColors.error : AppColors.primary};
    box-shadow: 0 2px 8px rgba(55, 187, 214, 0.1);
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.$error ? AppColors.error : AppColors.primary};
    box-shadow: 0 0 0 3px rgba(55, 187, 214, 0.1);
  }
  
  &:disabled {
    background-color: ${AppColors.background};
    color: ${AppColors.disabled};
    cursor: not-allowed;
    border-color: ${AppColors.borderLight};
  }
`;

const DropdownArrow = styled.div<{ $isOpen: boolean }>`
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid ${AppColors.onInput1};
  transition: transform 0.2s ease;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const DropdownList = styled.div<{ 
  $isOpen: boolean; 
  $inModal?: boolean; 
  $top?: number; 
  $left?: number; 
  $width?: number;
  $openUpward?: boolean;
}>`
  position: fixed; /* Portal을 사용하므로 항상 fixed */
  top: ${props => `${props.$top || 0}px`};
  left: ${props => `${props.$left || 0}px`};
  width: ${props => `${props.$width || 100}px`};
  max-height: 240px;
  overflow-y: auto;
  background: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 10001; /* 모달보다 높은 z-index */
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => {
    if (!props.$isOpen) {
      return props.$openUpward ? 'translateY(8px)' : 'translateY(-8px)';
    }
    return 'translateY(0)';
  }};
  ${props => props.$openUpward && `
    transform-origin: bottom;
  `}
  transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
  
  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

const DropdownItem = styled.div<{ $isSelected: boolean }>`
  padding: 14px 16px;
  color: ${AppColors.onSurface};
  font-size: ${AppTextStyles.body1.fontSize};
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 1px solid ${AppColors.borderLight};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: ${AppColors.primary}08;
    color: ${AppColors.primary};
  }
  
  ${props => props.$isSelected && `
    background-color: ${AppColors.primary}15;
    color: ${AppColors.primary};
    font-weight: 500;
  `}
`;

const OptionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const OptionLabel = styled.div`
  font-weight: 500;
`;

const OptionDescription = styled.div`
  font-size: ${AppTextStyles.label3.fontSize};
  color: ${AppColors.onInput1};
  opacity: 0.8;
`;

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "선택하세요",
  disabled = false,
  error = false,
  required = false,
  inModal = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, openUpward: false });
  const [hasPosition, setHasPosition] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const gap = 4;
      
      // 실제 드롭다운 높이 계산 (각 아이템은 약 52px 높이 + 여백)
      const itemHeight = 52; // padding(14px * 2) + font-size + 여백
      const actualDropdownHeight = Math.min(options.length * itemHeight, 240);
      
      // 화면 공간 계산
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // 공간이 충분한지 확인
      const canOpenBelow = spaceBelow >= (actualDropdownHeight + gap);
      const canOpenAbove = spaceAbove >= (actualDropdownHeight + gap);
      
      // 아래쪽 우선, 공간이 부족하면 위쪽 확인
      const shouldOpenUp = !canOpenBelow && canOpenAbove;
      
      let topPosition;
      if (shouldOpenUp) {
        // 위로 열 때: 버튼 바로 위에서 시작해서 위로 확장
        topPosition = rect.top - actualDropdownHeight - gap;
      } else {
        // 아래로 열 때: 버튼 바로 아래에서 시작
        topPosition = rect.bottom + gap;
      }
      
      setDropdownPosition({
        top: topPosition,
        left: rect.left,
        width: rect.width,
        openUpward: shouldOpenUp
      });
      setHasPosition(true);
    }
  }, [options.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen && hasPosition) {
        updateDropdownPosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen, hasPosition, updateDropdownPosition]);

  useEffect(() => {
    if (isOpen) {
      // 위치 계산을 즉시 실행하고, 그 다음에 표시
      requestAnimationFrame(() => {
        updateDropdownPosition();
      });
    } else {
      setHasPosition(false);
    }
  }, [isOpen, updateDropdownPosition]);

  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const renderDropdownList = () => {
    const dropdownContent = (
      <DropdownList 
        $isOpen={isOpen && hasPosition}
        $inModal={inModal}
        $top={dropdownPosition.top}
        $left={dropdownPosition.left}
        $width={dropdownPosition.width}
        $openUpward={dropdownPosition.openUpward}
        role="listbox"
      >
        {options.map((option) => (
          <DropdownItem
            key={option.value}
            $isSelected={option.value === value}
            onClick={() => handleOptionClick(option.value)}
            role="option"
            aria-selected={option.value === value}
          >
            <OptionContent>
              <OptionLabel>{option.label}</OptionLabel>
              {option.description && (
                <OptionDescription>{option.description}</OptionDescription>
              )}
            </OptionContent>
          </DropdownItem>
        ))}
      </DropdownList>
    );

    // 모달 내부에서는 Portal을 사용해서 body에 렌더링
    if (inModal && typeof window !== 'undefined') {
      return ReactDOM.createPortal(dropdownContent, document.body);
    }

    // 모달 외부에서는 일반적으로 렌더링
    return dropdownContent;
  };

  return (
    <DropdownContainer ref={dropdownRef}>
      <DropdownButton
        ref={buttonRef}
        type="button"
        $isOpen={isOpen}
        $hasValue={!!value}
        $error={error}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
      >
        <span>{displayText}</span>
        <DropdownArrow $isOpen={isOpen} />
      </DropdownButton>
      
      {renderDropdownList()}
    </DropdownContainer>
  );
};

export default CustomDropdown;
