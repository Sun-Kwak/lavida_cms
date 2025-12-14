import React, { useState, useEffect, ReactNode } from 'react';
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
  margin-bottom: 20px;
  padding: 4px;
  background: linear-gradient(135deg, rgba(55, 187, 214, 0.1) 0%, rgba(42, 155, 181, 0.1) 100%);
  border-radius: 16px;
`;

const SearchButton = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #37bbd6 0%, #2a9bb5 100%);
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-50%) scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    transform: translateY(-50%);
  }
`;

const TableContainer = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  height: calc(100vh - 250px);
  max-height: 600px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.div`
  background: linear-gradient(135deg, #37bbd6 0%, #2a9bb5 100%);
  padding: 16px 24px;
  font-weight: 600;
  font-size: 16px;
  color: white;
  border-bottom: none;
  border-radius: 16px 16px 0 0;
  text-align: center;
  letter-spacing: 0.5px;
`;

const TableWrapper = styled.div`
  height: calc(100% - 56px);
  overflow: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f8f9fa;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #dee2e6;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #adb5bd;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const TableHeaderRow = styled.tr`
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-right: 1px solid #e9ecef;
  
  &:last-child {
    border-right: none;
  }
`;

const TableRow = styled.tr`
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f1f3f4;
  
  &:hover {
    background: linear-gradient(135deg, rgba(55, 187, 214, 0.05) 0%, rgba(42, 155, 181, 0.05) 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 16px;
  border-right: 1px solid #f1f3f4;
  vertical-align: top;
  
  &:last-child {
    border-right: none;
  }
`;

const NameCell = styled.div`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const SubtitleCell = styled.div`
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 2px;
`;

const DescriptionCell = styled.div`
  font-size: 11px;
  color: #868e96;
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

export interface TableSearchItem {
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
  data?: any;
}

export interface AppTableSearchModalProps {
  selectedValue?: string;
  onSelectItem?: (item: TableSearchItem) => void;
  onClear?: () => void;
  items: TableSearchItem[]; // 기본 아이템 목록
  onSearch?: (searchTerm: string) => TableSearchItem[] | Promise<TableSearchItem[]>; // 검색 함수
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  autoFocus?: boolean;
  header?: string; // 모달 헤더 제목
  tableHeader?: string; // 테이블 헤더 제목
  maxDisplayItems?: number; // 기본 표시 아이템 수 (기본값: 10)
}

export const AppTableSearchModal: React.FC<AppTableSearchModalProps> = ({
  selectedValue = '',
  onSelectItem,
  onClear,
  items = [],
  onSearch,
  placeholder = '검색어를 입력하세요',
  errorMessage,
  disabled = false,
  loading = false,
  emptyMessage = '항목이 없습니다',
  header = '선택',
  tableHeader = '목록',
  maxDisplayItems = 10,
}) => {
  // 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<TableSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 초기 아이템 설정
  useEffect(() => {
    setFilteredItems(items.slice(0, maxDisplayItems));
  }, [items, maxDisplayItems]);

  // 모달 열기
  const openModal = () => {
    if (disabled) return;
    setIsModalOpen(true);
    setSearchTerm('');
    setFilteredItems(items.slice(0, maxDisplayItems));
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSearchTerm('');
    setFilteredItems(items.slice(0, maxDisplayItems));
  };

  // 검색어 변경 핸들러
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);

    // 검색어가 비어있으면 기본 아이템 표시
    if (!newSearchTerm.trim()) {
      setFilteredItems(items.slice(0, maxDisplayItems));
      return;
    }

    // 로컬 검색 또는 외부 검색 함수 사용
    if (onSearch) {
      handleSearch(newSearchTerm.trim());
    } else {
      // 기본 로컬 검색
      const filtered = items.filter(item =>
        item.title.toLowerCase().includes(newSearchTerm.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(newSearchTerm.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(newSearchTerm.toLowerCase()))
      );
      setFilteredItems(filtered);
    }
  };

  // 검색 실행
  const handleSearch = async (searchTerm: string) => {
    if (!onSearch) return;

    setIsSearching(true);
    try {
      const results = await onSearch(searchTerm);
      setFilteredItems(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
      setFilteredItems([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Enter 키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim() && onSearch) {
      e.preventDefault();
      handleSearch(searchTerm.trim());
    }
  };

  // 검색 버튼 클릭
  const handleSearchButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (searchTerm.trim() && onSearch) {
      handleSearch(searchTerm.trim());
    }
  };

  // 아이템 선택
  const handleItemSelect = (item: TableSearchItem) => {
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

  // 테이블 형식으로 렌더링하므로 별도의 렌더링 함수 불필요

  // 결과 상태 렌더링
  const renderTableContent = () => {
    if (loading || isSearching) {
      return (
        <LoadingState>
          <LoadingSpinner />
          검색 중...
        </LoadingState>
      );
    }

    if (filteredItems.length === 0) {
      return <EmptyState>{emptyMessage}</EmptyState>;
    }

    return (
      <Table>
        <thead>
          <TableHeaderRow>
            <TableHeaderCell style={{width: '20%'}}>이름</TableHeaderCell>
            <TableHeaderCell style={{width: '30%'}}>정보</TableHeaderCell>
            <TableHeaderCell style={{width: '50%'}}>상세정보</TableHeaderCell>
          </TableHeaderRow>
        </thead>
        <tbody>
          {filteredItems.map((item, index) => (
            <TableRow
              key={`${item.id}-${index}`}
              onClick={() => handleItemSelect(item)}
            >
              <TableCell>
                <NameCell>{item.title}</NameCell>
              </TableCell>
              <TableCell>
                <SubtitleCell>{item.subtitle}</SubtitleCell>
              </TableCell>
              <TableCell>
                <DescriptionCell>{item.description}</DescriptionCell>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <>
      <ClickableInputContainer onClick={openModal}>
        <input
          value={selectedValue}
          onChange={() => {}}
          placeholder={placeholder}
          readOnly={true}
          disabled={disabled}
          style={{
            width: '100%',
            height: '48px',
            padding: '0 48px 0 16px',
            border: `1px solid ${errorMessage ? '#dc3545' : '#ddd'}`,
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
        {errorMessage && (
          <div style={{ 
            color: '#dc3545', 
            fontSize: '12px', 
            marginTop: '4px',
            marginLeft: '4px'
          }}>
            {errorMessage}
          </div>
        )}
        {selectedValue && !disabled && (
          <ClearButton onClick={handleClear} title="지우기">
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
                value={searchTerm}
                onChange={handleSearchTermChange}
                placeholder={placeholder}
                autoFocus={true}
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 60px 0 20px',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  background: 'white',
                  fontWeight: '500'
                }}
              />
              {onSearch && (
                <SearchButton
                  onClick={handleSearchButtonClick}
                  disabled={!searchTerm.trim()}
                  title="검색"
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
              )}
            </SearchContainer>

            <TableContainer>
              <TableHeader>{tableHeader}</TableHeader>
              <TableWrapper>
                {renderTableContent()}
              </TableWrapper>
            </TableContainer>
          </div>
        }
        width="80%"
        height="85%"
      />
    </>
  );
};

export default AppTableSearchModal;