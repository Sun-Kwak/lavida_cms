import React, { useState, ReactNode } from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import Modal from '../components/Modal';

// 스타일 컴포넌트들
const ClickableInputContainer = styled.div`
  position: relative;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
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

const CustomSearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid ${AppColors.onInput1};
  border-radius: 12px;
  max-height: 400px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const ResultsList = styled.div`
  max-height: 350px;
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
  header?: string; // 모달 헤더 제목
  
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
  header = '검색', // 기본값 설정
  
  // Validation 관련
  isValidSelection = true,
  validationErrorMessage,
  showValidationError = false,
}) => {
  const texts = searchDropdownTexts[language];
  
  // 다국어 적용된 기본값들
  const finalPlaceholder = placeholder || texts.defaultPlaceholder;
  const finalEmptyMessage = emptyMessage || texts.noResults;
  const finalValidationErrorMessage = validationErrorMessage || texts.validationError;
  
  // 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

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

  // 모달 열기
  const openModal = () => {
    if (disabled) return;
    setIsModalOpen(true);
    setInternalSearchTerm('');
    setHasSearched(false);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setInternalSearchTerm('');
    setHasSearched(false);
  };

  // 검색어 변경 핸들러
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newSearchTerm = e.target.value;
    setInternalSearchTerm(newSearchTerm);
    setHasSearched(false);
    
    if (onSearchTermChange) {
      onSearchTermChange(newSearchTerm);
    }
  };

  // 검색 실행
  const handleSearch = () => {
    if (internalSearchTerm.trim()) {
      setHasSearched(true);
      onSearch(internalSearchTerm.trim());
    }
  };

  // Enter 키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // 검색 버튼 클릭
  const handleSearchButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSearch();
  };

  // 아이템 선택
  const handleItemSelect = (item: SearchResultItem) => {
    closeModal();
    
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
    <>
      <ClickableInputContainer onClick={openModal}>
        <input
          value={selectedValue}
          onChange={() => {}}
          placeholder={finalPlaceholder}
          readOnly={true}
          disabled={disabled}
          style={{
            width: '100%',
            height: '48px',
            padding: '0 48px 0 16px',
            border: `1px solid ${finalErrorMessage ? '#dc3545' : '#ddd'}`,
            borderRadius: '12px',
            fontSize: '14px',
            boxSizing: 'border-box',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: disabled ? '#f5f5f5' : 'white',
            color: disabled ? '#999' : '#333',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
        />
        {finalErrorMessage && (
          <div style={{ 
            color: '#dc3545', 
            fontSize: '12px', 
            marginTop: '4px',
            marginLeft: '4px'
          }}>
            {finalErrorMessage}
          </div>
        )}
        {selectedValue && !disabled && (
          <ClearButton onClick={handleClear} title={texts.clearButton}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </ClearButton>
        )}
      </ClickableInputContainer>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        header={header}
        body={
          <div onKeyDown={handleKeyDown}>
            <SearchContainer>
              <input
                value={internalSearchTerm}
                onChange={handleSearchTermChange}
                placeholder={finalPlaceholder}
                autoFocus={true}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 48px 0 16px',
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
              <SearchButton
                onClick={handleSearchButtonClick}
                disabled={!internalSearchTerm.trim()}
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
            </SearchContainer>

            {hasSearched && (
              <CustomSearchContainer>
                <ResultsList>
                  {renderResults()}
                </ResultsList>
              </CustomSearchContainer>
            )}
          </div>
        }
        width="500px"
      />
    </>
  );
};
