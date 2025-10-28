import React, { useState, useRef, useEffect, ReactNode } from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import { AppTextField } from './AppTextField';

// 스타일 컴포넌트들
const CustomSearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid ${AppColors.onInput1};
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 4px;
  width: 100%;
  max-height: 300px;
  overflow: hidden;
`;

const ResultsList = styled.div`
  max-height: 280px;
  overflow-y: auto;
  padding: 8px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${AppColors.onInput1};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${AppColors.onInput2};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${AppColors.onInput3};
  }
`;

const ResultItem = styled.div`
  padding: 12px;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  
  &:hover {
    background-color: ${AppColors.onInput1};
    border-color: ${AppColors.onInput2};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const StringItem = styled.div`
  color: ${AppColors.onInput3};
  font-size: 14px;
  line-height: 1.4;
`;

const CardItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
`;

const CardTitle = styled.div`
  font-weight: 600;
  color: ${AppColors.onInput3};
  font-size: 14px;
  text-align: left;
`;

const CardSubtitle = styled.div`
  font-size: 12px;
  color: ${AppColors.onInput2};
  text-align: left;
`;

const CardDescription = styled.div`
  font-size: 12px;
  color: ${AppColors.onInput2};
  line-height: 1.3;
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: ${AppColors.onInput2};
  font-size: 14px;
`;

const LoadingState = styled.div`
  padding: 20px;
  text-align: center;
  color: ${AppColors.onInput2};
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${AppColors.onInput1};
  border-top: 2px solid ${AppColors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SearchInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${AppColors.onInput2};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${AppColors.primary};
    background-color: ${AppColors.onInput1};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${AppColors.onInput2};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${AppColors.primary};
    background-color: ${AppColors.onInput1};
  }
`;

export interface SearchCardItem {
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
  data?: any;
}

export interface SearchStringItem {
  id: string | number;
  label: string;
  data?: any;
}

export type SearchResultItem = SearchCardItem | SearchStringItem | string;

// 다국어 텍스트 객체
const searchDropdownTexts = {
  ko: {
    defaultLabel: '검색',
    defaultPlaceholder: '검색어를 입력하세요',
    noResults: '검색 결과가 없습니다.',
    searching: '검색 중...',
    validationError: '유효한 검색 결과를 선택해주세요.',
    searchButton: '검색',
    clearButton: '지우기',
    selectItem: '항목 선택'
  },
  en: {
    defaultLabel: 'Search',
    defaultPlaceholder: 'Enter search term',
    noResults: 'No search results found.',
    searching: 'Searching...',
    validationError: 'Please select a valid search result.',
    searchButton: 'Search',
    clearButton: 'Clear',
    selectItem: 'Select item'
  }
};

export interface AppSearchDropdownProps {
  selectedValue?: string;
  searchTerm?: string;
  onSearchTermChange?: (searchTerm: string) => void;
  onSearch: (searchTerm: string) => void | Promise<void>;
  onSelectItem?: (item: SearchResultItem) => void;
  onClear?: () => void;
  results: SearchResultItem[];
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  renderItem?: (item: SearchResultItem, index: number) => ReactNode;
  getItemLabel?: (item: SearchResultItem) => string;
  getItemId?: (item: SearchResultItem) => string | number;
  autoFocus?: boolean;
  language?: 'ko' | 'en';
  
  // Validation 관련
  isValidSelection?: boolean; // 현재 선택된 값이 유효한지 여부
  validationErrorMessage?: string; // validation 실패 시 에러 메시지
  showValidationError?: boolean; // validation 에러를 표시할지 여부
}

export const AppSearchDropdown: React.FC<AppSearchDropdownProps> = ({
  selectedValue = '',
  searchTerm = '',
  onSearchTermChange,
  onSearch,
  onSelectItem,
  onClear,
  results = [],
  label,
  placeholder,
  errorMessage,
  disabled = false,
  loading = false,
  emptyMessage,
  renderItem,
  getItemLabel,
  getItemId,
  autoFocus = false,
  language = 'ko',
  
  // Validation 관련
  isValidSelection = true,
  validationErrorMessage,
  showValidationError = false,
}) => {
  const texts = searchDropdownTexts[language];
  
  // 다국어 적용된 기본값들
  const finalLabel = label || texts.defaultLabel;
  const finalPlaceholder = placeholder || texts.defaultPlaceholder;
  const finalEmptyMessage = emptyMessage || texts.noResults;
  const finalValidationErrorMessage = validationErrorMessage || texts.validationError;
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [popupPosition, setPopupPosition] = useState<'left' | 'right'>('left');
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  // 기본 함수들
  const defaultGetItemId = (item: SearchResultItem): string | number => {
    if (typeof item === 'string') return item;
    if ('id' in item) return item.id;
    return String(item);
  };

  const finalGetItemId = getItemId || defaultGetItemId;

  // 최종 에러 메시지 결정
  const finalErrorMessage = showValidationError && !isValidSelection 
    ? finalValidationErrorMessage
    : errorMessage;

  // 드롭다운 표시 조건
  const shouldShowDropdown = isFocused && isSearchMode && hasSearched && (results.length > 0 || loading || (!loading && results.length === 0));

  // 화면 크기 변경 시 팝업 위치 재계산
  useEffect(() => {
    const handleResize = () => {
      if (shouldShowDropdown && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        const popupWidth = 400;
        const viewportWidth = window.innerWidth;
        const rightSpace = viewportWidth - rect.right;
        
        if (rightSpace < popupWidth && rect.left > popupWidth) {
          setPopupPosition('right');
        } else {
          setPopupPosition('left');
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [shouldShowDropdown]);

  // 검색 모드 진입
  const enterSearchMode = () => {
    if (disabled) return;
    setIsSearchMode(true);
    setHasSearched(false);
  };

  // 검색 모드 종료
  const exitSearchMode = () => {
    setIsSearchMode(false);
    setHasSearched(false);
    setIsFocused(false);
  };

  // 검색어 변경 핸들러
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newSearchTerm = e.target.value;
    if (onSearchTermChange) {
      onSearchTermChange(newSearchTerm);
    }
    setHasSearched(false);
  };

  // 검색 실행
  const handleSearch = () => {
    if (searchTerm.trim()) {
      setHasSearched(true);
      onSearch(searchTerm.trim());
    }
  };

  // Enter 키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      exitSearchMode();
    }
  };

  // 검색 버튼 클릭
  const handleSearchButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSearch();
  };

  // 포커스 핸들러
  const handleFocus = () => {
    setIsFocused(true);
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const popupWidth = 400;
      const viewportWidth = window.innerWidth;
      const rightSpace = viewportWidth - rect.right;
      
      if (rightSpace < popupWidth && rect.left > popupWidth) {
        setPopupPosition('right');
      } else {
        setPopupPosition('left');
      }
    }
  };

  // 블러 핸들러
  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
    }, 150);
  };

  // 아이템 선택
  const handleItemSelect = (item: SearchResultItem) => {
    exitSearchMode();
    
    if (onSelectItem) {
      onSelectItem(item);
    }
  };

  // 선택 해제
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    }
    exitSearchMode();
  };

  // 기본 아이템 렌더링
  const defaultRenderItem = (item: SearchResultItem, index: number) => {
    if (typeof item === 'string') {
      return <StringItem>{item}</StringItem>;
    }
    
    if ('title' in item) {
      return (
        <CardItem>
          <CardTitle>{item.title}</CardTitle>
          {item.subtitle && <CardSubtitle>{item.subtitle}</CardSubtitle>}
          {item.description && <CardDescription>{item.description}</CardDescription>}
        </CardItem>
      );
    }
    
    if ('label' in item) {
      return <StringItem>{item.label}</StringItem>;
    }
    
    return <StringItem>{String(item)}</StringItem>;
  };

  const finalRenderItem = renderItem || defaultRenderItem;

  // 결과 상태 렌더링
  const renderResults = () => {
    if (loading) {
      return (
        <LoadingState>
          <LoadingSpinner />
          {texts.searching}
        </LoadingState>
      );
    }

    if (results.length === 0) {
      return <EmptyState>{finalEmptyMessage}</EmptyState>;
    }

    return results.map((item, index) => {
      const itemId = finalGetItemId(item);
      
      return (
        <ResultItem
          key={`${itemId}-${index}`}
          onClick={() => handleItemSelect(item)}
        >
          {finalRenderItem(item, index)}
        </ResultItem>
      );
    });
  };

  return (
    <div ref={inputRef} style={{ position: 'relative' }}>
      {!isSearchMode ? (
        // 선택된 값 표시 모드
        <div onClick={enterSearchMode} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
          <AppTextField
            value={selectedValue}
            onChange={() => {}}
            label={finalLabel}
            placeholder={finalPlaceholder || texts.selectItem}
            errorMessage={finalErrorMessage}
            readOnly={true}
            autoFocus={false}
          />
          {selectedValue && !disabled && (
            <ClearButton onClick={handleClear} title={texts.clearButton}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </ClearButton>
          )}
        </div>
      ) : (
        // 검색 모드
        <SearchInputContainer
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        >
          <AppTextField
            value={searchTerm}
            onChange={handleSearchTermChange}
            label={finalLabel}
            placeholder={finalPlaceholder}
            errorMessage={finalErrorMessage}
            autoFocus={autoFocus}
          />
          <SearchButton
            onClick={handleSearchButtonClick}
            disabled={disabled || !searchTerm.trim()}
            title={texts.searchButton}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </SearchButton>
        </SearchInputContainer>
      )}
      
      {shouldShowDropdown && (
        <CustomSearchContainer
          style={{ 
            position: 'absolute', 
            top: '100%', 
            ...(popupPosition === 'right' ? { right: 0 } : { left: 0 }),
            zIndex: 1000 
          }}
        >
          <ResultsList>
            {renderResults()}
          </ResultsList>
        </CustomSearchContainer>
      )}
    </div>
  );
};
