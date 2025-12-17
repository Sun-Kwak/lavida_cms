import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';

export interface TableColumn<T = any> {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T = any> {
  title?: React.ReactNode;
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  emptyDescription?: string;
  resultCount?: React.ReactNode;
  onRowClick?: (record: T, index: number) => void;
  className?: string;
  customRowStyle?: (record: T, index: number) => React.CSSProperties;
  // 페이지네이션 관련
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
    showTotal?: boolean;
  };
}

const ResultsSection = styled.div`
  background: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${AppColors.borderLight};
`;

const ResultsTitle = styled.h2`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 600;
  color: ${AppColors.onBackground};
  margin: 0;
`;

const ResultsCount = styled.div`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onInput1};
  text-align: right;
  line-height: 1.4;
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f8f9fa;
`;

const TableRow = styled.tr<{ $clickable?: boolean }>`
  border-bottom: 1px solid ${AppColors.borderLight};
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  
  &:hover {
    background: #f8f9fa;
  }
`;

const TableHeaderCell = styled.th<{ $width?: string; $align?: 'left' | 'center' | 'right' }>`
  padding: 12px 16px;
  text-align: ${props => props.$align || 'left'};
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 600;
  color: ${AppColors.onInput1};
  border-bottom: 1px solid ${AppColors.borderLight};
  width: ${props => props.$width || 'auto'};
`;

const TableCell = styled.td<{ $align?: 'left' | 'center' | 'right' }>`
  padding: 12px 16px;
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onBackground};
  vertical-align: middle;
  text-align: ${props => props.$align || 'left'};
`;

const EmptyState = styled.div`
  padding: 60px 24px;
  text-align: center;
  color: ${AppColors.onInput1};
`;

const LoadingState = styled.div`
  padding: 60px 24px;
  text-align: center;
  color: ${AppColors.onInput1};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid ${AppColors.borderLight};
  background: ${AppColors.surface};
`;

const PaginationInfo = styled.div`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onInput1};
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PageSizeSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onInput1};
`;

const PageSizeSelect = styled.select`
  padding: 4px 8px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  font-size: ${AppTextStyles.body2.fontSize};
  background: ${AppColors.surface};
  color: ${AppColors.onSurface};
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
`;

const PageNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PageButton = styled.button<{ $disabled?: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  background: ${props => props.$disabled ? AppColors.background : AppColors.surface};
  color: ${props => props.$disabled ? AppColors.onInput1 : AppColors.onSurface};
  font-size: ${AppTextStyles.body2.fontSize};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$disabled ? AppColors.background : AppColors.primary + '10'};
    border-color: ${props => props.$disabled ? AppColors.borderLight : AppColors.primary};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const PageInfo = styled.span`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onInput1};
  min-width: 80px;
  text-align: center;
`;

function DataTable<T = any>({
  title,
  columns,
  data,
  loading = false,
  emptyText = "데이터가 없습니다",
  emptyDescription = "새로운 데이터를 추가해보세요.",
  resultCount,
  onRowClick,
  className,
  customRowStyle,
  pagination
}: DataTableProps<T>) {
  
  // 페이지네이션 state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(
    pagination?.pageSize || 5
  );
  
  // 페이지네이션 설정
  const paginationEnabled = pagination?.enabled || false;
  const pageSizeOptions = pagination?.pageSizeOptions || [5, 15, 30];
  const showTotal = pagination?.showTotal !== false;
  
  // 페이지네이션 계산
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = paginationEnabled ? data.slice(startIndex, endIndex) : data;
  
  // 디버깅 로그 추가
  console.log('=== DataTable 렌더링 정보 ===');
  console.log('전체 데이터 개수:', data.length);
  console.log('페이지네이션 활성:', paginationEnabled);
  console.log('현재 페이지 데이터 개수:', currentData.length);
  if (data.length > 0) {
    console.log('첫 번째 데이터:', data[0]);
  }
  
  // 페이지 변경 시 첫 페이지로 리셋
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length, pageSize]);
  
  const renderCell = (column: TableColumn<T>, record: T, index: number) => {
    const value = (record as any)[column.key];
    
    if (column.render) {
      return column.render(value, record, index);
    }
    
    return value;
  };

  if (loading) {
    return (
      <ResultsSection className={className}>
        <LoadingState>
          <h3>데이터를 불러오는 중...</h3>
        </LoadingState>
      </ResultsSection>
    );
  }

  return (
    <ResultsSection className={className}>
      {(title || resultCount) && (
        <ResultsHeader>
          {title && <ResultsTitle>{title}</ResultsTitle>}
          {resultCount && <ResultsCount>{resultCount}</ResultsCount>}
        </ResultsHeader>
      )}

      {paginationEnabled && (
        <PaginationContainer>
          <PaginationInfo>
            {showTotal && (
              <span>
                총 {totalItems.toLocaleString()}개 중 {(startIndex + 1).toLocaleString()}-{Math.min(endIndex, totalItems).toLocaleString()}개 표시
              </span>
            )}
          </PaginationInfo>
          
          <PaginationControls>
            <PageSizeSelector>
              <span>페이지당</span>
              <PageSizeSelect 
                value={pageSize} 
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}개</option>
                ))}
              </PageSizeSelect>
            </PageSizeSelector>
            
            <PageNavigation>
              <PageButton 
                $disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                이전
              </PageButton>
              
              <PageInfo>
                {currentPage} / {totalPages}
              </PageInfo>
              
              <PageButton 
                $disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                다음
              </PageButton>
            </PageNavigation>
          </PaginationControls>
        </PaginationContainer>
      )}

      {data.length > 0 ? (
        <>
          
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHeaderCell 
                      key={column.key || index}
                      $width={column.width}
                      $align={column.align}
                    >
                      {column.title}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              </TableHeader>
              <tbody>
                {currentData.map((record, index) => (
                  <TableRow 
                    key={index}
                    $clickable={!!onRowClick}
                    onClick={() => onRowClick?.(record, index)}
                    style={customRowStyle?.(record, index)}
                  >
                    {columns.map((column, colIndex) => (
                      <TableCell 
                        key={column.key || colIndex}
                        $align={column.align}
                      >
                        {renderCell(column, record, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <EmptyState>
          <h3>{emptyText}</h3>
          <p>{emptyDescription}</p>
        </EmptyState>
      )}
    </ResultsSection>
  );
}

export default DataTable;