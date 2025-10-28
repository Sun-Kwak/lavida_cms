'use client';

import React, {
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import GenericDataTable, { ColumnDefinition } from './GenericDataTable'; // 경로 확인
import GenericDateRangePicker from './GenericDateRangePicker'; // 경로 확인
import DropdownCustom from './DropdownCustom';
import { devError, devWarn } from '../../utils/devLogger';
import { THEME_COLORS, ThemeMode } from '../../styles/theme_colors';
import ActionButton from '../ActionButton';

interface ButtonProp {
  label: string;
  onClick: () => void;
}

// Helper: getPropertyValue (기존 유지, UserListPage 버전 개선 적용)
const getPropertyValue = <T extends object>(obj: T, path: keyof T | string): any => {
  if (!obj) return undefined;
  if (typeof path === 'string' && path in obj) {
    return obj[path as keyof T];
  }
  if (typeof path === 'number' || typeof path === 'symbol') {
    return obj[path as keyof T];
  }
  if (typeof path === 'string' && path.includes('.')) {
    const keys = path.split('.');
    let value: any = obj;
    for (const key of keys) {
      if (value === null || typeof value !== 'object' || !(key in value)) {
        return undefined;
      }
      value = value[key];
    }
    return value;
  }
  return undefined;
};

// --- Component Props ---
interface BaseRecord {
  id?: string | number; // 기본 ID 필드 가정 (keyExtractor 대체용)
  index?: number; // index 필드도 고려
  [key: string]: any; // 다른 필드 허용
}

// API Fetch 함수 타입 정의 (수정: 페이지/정렬 파라미터 제거)
export interface FetchParams {
  fromDate?: string; // Optional
  toDate?: string; // Optional
  keyword?: string; // Optional
  status?: string; // 상태 필터 값 추가
}

export interface FetchResult<T> {
  data: T[];
  totalItems: number; // 필터링된 총 아이템 수
  allItems?: number; // 필터링 전 전체 아이템 수 (Optional)
}

// 초기 상태 타입
interface InitialState {
  page?: number;
  size?: number;
  sortKey?: string | null;
  sortOrder?: 'asc' | 'desc';
  fromDate?: string;
  toDate?: string;
  keyword?: string;
}

// GenericListUI Props 정의 (수정)
interface GenericListUIProps<T extends BaseRecord> {
  title: React.ReactNode;
  columns: ColumnDefinition<T>[];
  fetchData: (params: FetchParams) => Promise<FetchResult<T>>;
  excelFileName?: string;
  customLeftContent?: React.ReactNode; // 총정산액 대신 사용할 커스텀 컨텐츠
  totalAmountLabel?: string; // 총액 레이블 (예: "총정산액")
  totalAmount?: string; // 총액 값 (예: "4억 567만원")
  // 두 개의 금액을 표시하기 위한 새로운 props
  dualAmounts?: {
    first: { label: string; value: string };
    second: { label: string; value: string };
  };

  // 상태 필터 관련 props 추가
  statusFilter?: {
    options: { label: string; value: string }[];
    defaultValue?: string;
  };

  // 새로 변경된 props
  addButton?: ButtonProp;
  deleteButton?: ButtonProp;
  customButtons?: ButtonProp[]; // 커스텀 버튼들 배열 추가
  excelTemplateButton?: ButtonProp;
  excelUploadButton?: ButtonProp;

  initialState?: InitialState;
  hasUrlParams?: boolean; // URL 파라미터 존재 여부를 확인하는 prop 추가
  keyExtractor?: (item: T, index: number) => string | number;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  enableDateFilter?: boolean;
  dateRangeOptions?: ('금월' | '지난달' | '3개월' | '6개월' | '1년' | '2년' | '지정')[];
  itemsPerPageOptions?: number[];
  themeMode?: ThemeMode;
  onRowClick?: (item: T, rowIndex: number) => void;
  renderTabs?: () => React.ReactNode;
  refreshTrigger?: number; // 목록 새로고침을 위한 트리거
}

// 등록, 템플릿 버튼 (밝은 톤)
const PrimaryButton = styled(ActionButton)<{ $themeMode: ThemeMode }>`
  width: 110px;
  height: 40px;
  background: #214a72;
  color: #ffffff;
  border: none;
  &:hover:not(:disabled) {
    background-color: ${({ $themeMode }) => ($themeMode === 'light' ? '#1a3c5e' : '#1a3c5e')};
  }
`;

// 삭제, 업로드 버튼 (어두운 톤)
const SecondaryButton = styled(ActionButton)<{ $themeMode: ThemeMode }>`
  width: 110px;
  height: 40px;
  background: ${({ $themeMode }) => ($themeMode === 'light' ? '#eeeeee' : '#333333')};
  color: ${({ $themeMode }) => ($themeMode === 'light' ? '#333333' : '#eeeeee')};
  border: none;
  &:hover:not(:disabled) {
    background-color: ${({ $themeMode }) => ($themeMode === 'light' ? '#dddddd' : '#555555')};
  }
`;

// 다운로드 버튼 (특정 색)
const DownloadButton = styled(ActionButton)`
  width: 110px;
  height: 40px;
  background: #51815a;
  color: #ffffff;
  border: none;
  &:hover:not(:disabled) {
    background-color: #446b4c;
    color: #ffffff;
  }
`;

// 상태별 색상 정의 추가
const STATUS_COLORS = {
  '': '#887e67', // 전체
  ONGOING: '#4CAF50', // 진행중 - 초록색
  ENDED: '#2196F3', // 종료 - 파란색
  WAITING: '#FF9800', // 대기중 - 주황색
  CANCELED: '#F44336', // 취소 - 빨간색
};

// --- The Component --- (상태 및 로직 대폭 수정)
const GenericListUIInner = <T extends BaseRecord>(
  {
    title,
    columns,
    fetchData,
    excelFileName = 'DataExport',
    totalAmountLabel,
    totalAmount,
    dualAmounts,
    initialState = {},
    hasUrlParams = false, // 기본값 false
    keyExtractor,
    enableSearch = true,
    searchPlaceholder = '검색어를 입력해주세요',
    enableDateFilter = true,
    dateRangeOptions = ['금월', '지난달', '1년', '지정'],
    itemsPerPageOptions = [12, 30, 50, 100],
    themeMode = 'light',
    onRowClick,
    renderTabs,
    addButton,
    deleteButton,
    customButtons = [], // 기본값을 빈 배열로 설정
    excelTemplateButton,
    excelUploadButton,
    refreshTrigger,
    statusFilter,
    customLeftContent,
  }: GenericListUIProps<T>,
  ref: React.Ref<{ refetch: () => void }>
) => {
  // --- 내부 상태 --- (데이터 상태 추가, API 호출 관련 상태 제거)
  const [allData, setAllData] = useState<T[]>([]); // API로부터 받은 전체 데이터
  const [totalItems, setTotalItems] = useState(0); // 필터링된 아이템 수 (API 메타데이터 기준)
  const [allItems, setAllItems] = useState<number | undefined>(undefined); // 전체 아이템 수 (API 메타데이터 기준)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 초기 날짜 설정 함수
  const getInitialDates = useCallback(() => {
    // initialState에 날짜가 있으면 그 값을 사용
    if (initialState.fromDate && initialState.toDate) {
      return {
        fromDate: initialState.fromDate,
        toDate: initialState.toDate,
      };
    }
    // 없으면 첫번째 옵션으로 계산
    const today = dayjs();
    const firstOption = dateRangeOptions[0];

    switch (firstOption) {
      case '금월':
        return {
          fromDate: today.startOf('month').format('YYYY-MM-DD'),
          toDate: today.format('YYYY-MM-DD'),
        };
      case '6개월':
        return {
          fromDate: today.subtract(6, 'month').format('YYYY-MM-DD'),
          toDate: today.format('YYYY-MM-DD'),
        };
      case '1년':
        return {
          fromDate: today.subtract(1, 'year').format('YYYY-MM-DD'),
          toDate: today.format('YYYY-MM-DD'),
        };
      case '2년':
        return {
          fromDate: today.subtract(2, 'year').format('YYYY-MM-DD'),
          toDate: today.format('YYYY-MM-DD'),
        };
      default:
        // "지정" 또는 기타의 경우, 기본값(금월)으로 설정
        return {
          fromDate: today.startOf('month').format('YYYY-MM-DD'),
          toDate: today.format('YYYY-MM-DD'),
        };
    }
  }, [dateRangeOptions, initialState.fromDate, initialState.toDate]);

  const initialDates = useMemo(() => getInitialDates(), [getInitialDates]);

  // UI 제어 상태 (페이지네이션, 정렬, 필터)
  const [currentPage, setCurrentPage] = useState(initialState.page ?? 1);
  const [itemsPerPage, setItemsPerPage] = useState(
    initialState.size ?? itemsPerPageOptions[0] ?? 12
  );
  const [sortKey, setSortKey] = useState<string | null>(initialState.sortKey ?? null); // 기본 정렬 없음
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialState.sortOrder ?? 'asc');
  const [fromDate, setFromDate] = useState(initialDates.fromDate);
  const [toDate, setToDate] = useState(initialDates.toDate);
  const [searchTermInput, setSearchTermInput] = useState(initialState.keyword ?? ''); // 검색 "입력" 상태
  const [searchKeyword, setSearchKeyword] = useState(initialState.keyword ?? ''); // 실제 "적용된" 검색어

  // 상태 필터 state 추가
  const [selectedStatus, setSelectedStatus] = useState(statusFilter?.defaultValue || '');

  // 필터링된 데이터를 계산하는 useMemo 추가
  const filteredData = useMemo(() => {
    if (!selectedStatus) return allData;
    return allData.filter((item: any) => {
      // signupStatus나 status 필드에서 상태값 확인
      const itemStatus = item.signupStatus || item.status;
      return itemStatus === selectedStatus;
    });
  }, [allData, selectedStatus]);

  // --- 데이터 로딩 콜백 --- (API 호출 시점 변경)
  const executeFetch = (fetchParams: FetchParams) => {
    setIsLoading(true);
    setError(null);
    fetchData(fetchParams)
      .then(result => {
        setAllData(result.data);
        setTotalItems(result.totalItems);
        setAllItems(result.allItems);
        setCurrentPage(1);
      })
      .catch(error => {
        devError('Error fetching data:', error);
        setError(error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
        setAllData([]);
        setTotalItems(0);
        setAllItems(undefined);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // fetchDataCallback을 useRef로 변경하여 의존성 순환 문제 해결
  const fetchDataCallbackRef = useRef<(() => void) | null>(null);
  
  fetchDataCallbackRef.current = () => {
    const params: FetchParams = {
      keyword: searchKeyword || undefined,
    };
    if (enableDateFilter) {
      params.fromDate = fromDate;
      params.toDate = toDate;
    }
    executeFetch(params);
  };

  const fetchDataCallback = useCallback(() => {
    fetchDataCallbackRef.current?.();
  }, []);

  useImperativeHandle(ref, () => ({
    refetch: () => {
      fetchDataCallback(); // 내부 API 호출
    },
  }));

  // 초기 로딩 및 데이터 fetch 통합 관리
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  
  // enableDateFilter={false}인 경우 초기 API 호출
  useEffect(() => {
    if (!enableDateFilter && !hasInitialLoaded) {
      const params: FetchParams = {
        keyword: searchKeyword,
      };
      executeFetch(params);
      setHasInitialLoaded(true);
    }
  }, [enableDateFilter, hasInitialLoaded, searchKeyword]);
  
  // GenericDateRangePicker에서 onDateChange가 호출되면 초기 로딩 완료로 처리
  const handleDateChangeInternal = (newFrom: string, newTo: string) => {
    // 상태 업데이트
    setFromDate(newFrom);
    setToDate(newTo);
    setHasInitialLoaded(true); // 첫 번째 onDateChange 호출 시 초기 로딩 완료

    // 새로운 값으로 직접 API 호출
    const params: FetchParams = {
      fromDate: newFrom,
      toDate: newTo,
      keyword: searchKeyword,
    };
    if (selectedStatus) {
      params.status = selectedStatus;
    }
    executeFetch(params);
  };

  // refreshTrigger가 변경될 때만 목록 새로고침 (초기 로딩과 분리)
  useEffect(() => {
    if (refreshTrigger !== undefined && hasInitialLoaded) {
      fetchDataCallback();
    }
  }, [refreshTrigger]); // hasInitialLoaded, fetchDataCallback 의존성 제거

  // 상태 변경 핸들러 추가
  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setCurrentPage(1); // 상태 변경시 1페이지로 이동
  };

  // --- 클라이언트 측 데이터 처리 --- (정렬, 페이지네이션)
  // sortedData의 기반 데이터를 allData에서 filteredData로 변경
  const sortedData = useMemo(() => {
    const sortableData = [...filteredData]; // allData 대신 filteredData 사용
    if (sortKey) {
      sortableData.sort((a, b) => {
        const valA = getPropertyValue(a, sortKey);
        const valB = getPropertyValue(b, sortKey);
        let comparison = 0;
        if (valA === null || valA === undefined) comparison = -1;
        else if (valB === null || valB === undefined) comparison = 1;
        else if (dayjs.isDayjs(valA) && dayjs.isDayjs(valB))
          comparison = valA.valueOf() - valB.valueOf();
        else if (typeof valA === 'string' && typeof valB === 'string')
          comparison = valA.localeCompare(valB);
        else if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
        else comparison = String(valA).localeCompare(String(valB));
        return sortOrder === 'asc' ? comparison : comparison * -1;
      });
    }
    return sortableData;
  }, [filteredData, sortKey, sortOrder]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  // --- 파생 상태 (페이지네이션) ---
  // totalItems는 API 결과의 메타데이터 사용 (필터링된 개수)
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const displayTotalItems = totalItems;
  const displayAllItems = allItems ?? totalItems;

  // totalItems 계산 로직 수정
  useEffect(() => {
    setTotalItems(filteredData.length);
  }, [filteredData]);

  // --- 이벤트 핸들러 (수정) ---
  // 페이지 변경: 상태만 업데이트
  const handlePageNumChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };
  // 페이지 크기 변경: 상태만 업데이트
  const handleItemsPerPageChange = (newSize: number) => {
    if (newSize !== itemsPerPage) {
      setItemsPerPage(newSize);
      setCurrentPage(1);
    }
  };
  // 정렬 변경: 상태만 업데이트
  const handleHeaderClick = (accessor: keyof T | string) => {
    const newSortOrder = sortKey === accessor && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortKey(accessor as string);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // 정렬 시 1페이지로
  };

  // 검색어 입력: 입력 상태만 업데이트 (API 호출 없음)
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermInput(e.target.value);
  };
  // 조회 버튼 클릭: 적용된 검색어 업데이트 + API 호출
  const handleImmediateSearch = () => {
    const newKeyword = searchTermInput.trim();
    setSearchKeyword(newKeyword);
    const params: FetchParams = {
      keyword: newKeyword,
    };
    if (enableDateFilter) {
      params.fromDate = fromDate;
      params.toDate = toDate;
    }
    if (selectedStatus) {
      params.status = selectedStatus;
    }
    executeFetch(params);
  };

  // 엑셀 다운로드 핸들러 (수정: 클라이언트 데이터 사용)
  const handleDownloadClick = () => {
    setIsLoading(true); // 로딩 표시 (데이터 준비 중)
    try {
      // 정렬된 전체 데이터 사용 (페이지네이션 전)
      const dataToDownload = sortedData;

      if (!dataToDownload || dataToDownload.length === 0) {
        devWarn('다운로드할 데이터가 없습니다.');
        alert('다운로드할 데이터가 없습니다.'); // 임시
        return;
      }

      // 컬럼 정보를 사용하여 데이터 포맷팅 (showColumn이 false인 컬럼은 제외)
      const formattedData = dataToDownload.map(item => {
        const row: { [key: string]: any } = {};
        columns.forEach(col => {
          // showColumn이 false인 경우 엑셀에서 제외 (기본값은 true)
          if (col.showColumn === false) {
            return;
          }
          
          if (col.accessor) {
            let value = getPropertyValue(item, col.accessor);
            
            // Excel 전용 포맷터가 있는 경우 사용
            if (col.excelFormatter && typeof col.excelFormatter === 'function') {
              value = col.excelFormatter(value, item);
            }
            // Excel 전용 포맷터가 없는 경우, 원본 값 사용 (기본 포맷팅만 적용)
            else {
              // 기본 데이터 타입 포맷팅만 적용
              if (value instanceof Date) value = dayjs(value).format('YYYY-MM-DD HH:mm:ss');
              else if (typeof value === 'boolean') value = value ? 'Y' : 'N';
              else if (value === null || value === undefined) value = '';
              // formatter가 있어도 Excel에서는 원본 값 사용
            }
            
            const headerName =
              typeof col.header === 'string'
                ? col.header.replace(/\n/g, ' ')
                : String(col.accessor);
            
            // URL 패턴을 감지하여 하이퍼링크로 변환
            if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
              row[headerName] = { t: 's', v: value, l: { Target: value } };
            } else {
              row[headerName] = value;
            }
          }
        });
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, `${excelFileName}_${dayjs().format('YYYYMMDD')}.xlsx`);
      alert('엑셀이 다운로드되었습니다.'); // 임시
    } catch (err) {
      devError('Excel download failed:', err);
      alert('엑셀 다운로드 중 오류가 발생했습니다.'); // 임시
    } finally {
      setIsLoading(false);
    }
  };

  // --- 행 클릭 핸들러 (기존 유지) ---
  const handleRowClickInternal = useCallback(
    (item: T, index: number) => {
      if (onRowClick) {
        onRowClick(item, index); // 부모 컴포넌트의 onRowClick 함수 호출
      }
    },
    [onRowClick]
  );

  // --- 키 추출기 (기존 유지) ---
  const internalKeyExtractor = useMemo(() => {
    if (keyExtractor) return keyExtractor;
    // 기본 keyExtractor: item.id 또는 item.index 사용 시도
    return (item: T, index: number) => item.id ?? item.index ?? `row-${index}`;
  }, [keyExtractor]);

  return (
    <Container $themeMode={themeMode}>
      <ControlHeader>
        <APIControls>
          <LeftFilterControls>
            {enableDateFilter && (
              <DateRangePickerContainer>
                <GenericDateRangePicker
                  initialFromDate={fromDate}
                  initialToDate={toDate}
                  onDateChange={handleDateChangeInternal}
                  themeMode={themeMode}
                  rangeOptions={dateRangeOptions}
                  hasUrlParams={hasUrlParams}
                />
              </DateRangePickerContainer>
            )}
          </LeftFilterControls>
          
          <RightFilterControls>
            {statusFilter && (
              <StatusFilterContainer>
                <StatusSelect
                  value={selectedStatus}
                  onChange={e => handleStatusChange(e.target.value)}
                  $themeMode={themeMode}
                  style={{
                    color:
                      STATUS_COLORS[selectedStatus as keyof typeof STATUS_COLORS] ||
                      STATUS_COLORS[''],
                  }}
                >
                  {statusFilter.options.map(option => (
                    <option
                      key={option.value}
                      value={option.value}
                      style={{
                        color:
                          STATUS_COLORS[option.value as keyof typeof STATUS_COLORS] ||
                          STATUS_COLORS[''],
                      }}
                    >
                      {option.label}
                    </option>
                  ))}
                </StatusSelect>
              </StatusFilterContainer>
            )}
            {enableSearch && (
              <SearchContainer>
                <SearchInput
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTermInput}
                  onChange={handleSearchInputChange}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleImmediateSearch();
                  }}
                  $themeMode={themeMode}
                />
                <SearchButton onClick={handleImmediateSearch} $themeMode={themeMode}>
                  조회
                </SearchButton>
              </SearchContainer>
            )}
          </RightFilterControls>
        </APIControls>

        <EventControls>
          <LeftControls>
            {customLeftContent ? (
              <>
                {customLeftContent}
                {addButton && (
                  <div style={{ marginLeft: '20px' }}>
                    <PrimaryButton $themeMode={themeMode} onClick={addButton.onClick}>
                      {addButton.label}
                    </PrimaryButton>
                  </div>
                )}
              </>
            ) : dualAmounts ? (
              <DualAmountsContainer>
                <TotalAmount>
                  <TotalAmountLabel>{dualAmounts.first.label}</TotalAmountLabel>
                  <TotalAmountValue>{dualAmounts.first.value}</TotalAmountValue>
                </TotalAmount>
                <TotalAmount>
                  <TotalAmountLabel>{dualAmounts.second.label}</TotalAmountLabel>
                  <TotalAmountValue>{dualAmounts.second.value}</TotalAmountValue>
                </TotalAmount>
              </DualAmountsContainer>
            ) : totalAmountLabel && totalAmount ? (
              <TotalAmount>
                <TotalAmountLabel>{totalAmountLabel}</TotalAmountLabel>
                <TotalAmountValue>{totalAmount}</TotalAmountValue>
              </TotalAmount>
            ) : null}

            {!customLeftContent && !totalAmount && !dualAmounts && addButton && (
              <PrimaryButton $themeMode={themeMode} onClick={addButton.onClick}>
                {addButton.label}
              </PrimaryButton>
            )}

            {deleteButton && (
              <SecondaryButton $themeMode={themeMode} onClick={deleteButton.onClick}>
                {deleteButton.label}
              </SecondaryButton>
            )}
          </LeftControls>

          <RightControls>
            {/* totalAmount 또는 dualAmounts가 있을 때는 addButton을 여기에 표시 */}
            {(totalAmount || dualAmounts) && addButton && (
              <PrimaryButton $themeMode={themeMode} onClick={addButton.onClick}>
                {addButton.label}
              </PrimaryButton>
            )}
            {/* 커스텀 버튼들 렌더링 */}
            {customButtons.map((button, index) => (
              <PrimaryButton key={index} $themeMode={themeMode} onClick={button.onClick}>
                {button.label}
              </PrimaryButton>
            ))}
            {excelTemplateButton && (
              <PrimaryButton $themeMode={themeMode} onClick={excelTemplateButton.onClick}>
                {excelTemplateButton.label}
              </PrimaryButton>
            )}
            {excelUploadButton && (
              <SecondaryButton $themeMode={themeMode} onClick={excelUploadButton.onClick}>
                {excelUploadButton.label}
              </SecondaryButton>
            )}

            <DownloadButton
              onClick={handleDownloadClick}
              $themeMode={themeMode}
              disabled={isLoading}
            >
              {isLoading ? '다운로드 중...' : '엑셀 다운로드'}
            </DownloadButton>

            <PaginationControls>
              <InfoText $themeMode={themeMode} style={{ marginRight: '16px' }}>
                총 {displayAllItems.toLocaleString()}개 중 {displayTotalItems.toLocaleString()}개
              </InfoText>
              <NavButton
                onClick={() => handlePageNumChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                $themeMode={themeMode}
              >
                &lt;
              </NavButton>
              <PageBox $themeMode={themeMode}>
                {currentPage} / {totalPages > 0 ? totalPages : 1}
              </PageBox>
              <NavButton
                onClick={() => handlePageNumChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                $themeMode={themeMode}
              >
                &gt;
              </NavButton>
              <DropdownCustom
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                options={itemsPerPageOptions}
                themeMode={themeMode}
              />
              <InfoText $themeMode={themeMode} style={{ marginLeft: '5px' }}>
                개씩 보기
              </InfoText>
            </PaginationControls>
          </RightControls>
        </EventControls>
      </ControlHeader>

      <TableContainer $themeMode={themeMode}>
        <GenericDataTable
          data={paginatedData}
          columns={columns}
          isLoading={isLoading}
          // error={error}
          onRowClick={handleRowClickInternal}
          onHeaderClick={handleHeaderClick}
          sortKey={sortKey}
          sortOrder={sortOrder}
          keyExtractor={internalKeyExtractor}
          themeMode={themeMode}
        />
      </TableContainer>
      {/* )} */}
    </Container>
  );
};

const GenericListUI = forwardRef(GenericListUIInner) as <T extends BaseRecord>(
  props: GenericListUIProps<T> & { ref?: React.Ref<{ refetch: () => void }> }
) => React.ReactElement;

export default GenericListUI;

// --- 스타일 컴포넌트 (레이아웃 관련 수정) ---

const Container = styled.div<{ $themeMode: ThemeMode }>`
  min-width: 1200px;
  width: 100%;
  min-height: calc(100vh - 140px);
  box-sizing: border-box;
  padding: 0px 20px 20px 20px;
  overflow: visible; /* 드롭다운이 컨테이너를 벗어나서 보이도록 */
  color: ${({ $themeMode }) =>
    $themeMode === 'light' ? THEME_COLORS.light.text : THEME_COLORS.dark.text};
`;

const TopHeader = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  gap: 15px;
`;

const TitleContainer = styled.div`
  /* 제목 영역 스타일 (필요시 추가) */
`;

const ControlHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* background-color: #f0ede6; */
  margin: 20px 0;
  gap: 20px;
  overflow: visible; /* 드롭다운이 보이도록 */
  position: relative; /* 상대 위치 설정 */
`;

const APIControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* background-color: #756b55; */
  flex-wrap: wrap;
  /* padding: 10px; */
  border-radius: 8px;
  gap: 15px;
`;

const LeftFilterControls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const RightFilterControls = styled.div`
  display: flex;
  align-items: center;
  /* gap: 15px; */
`;

const EventControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 20px;
  min-width: min-content;
  overflow-x: auto;
  overflow-y: visible; /* 수직 overflow를 visible로 설정 */
  position: relative; /* 상대 위치 설정 */

  /* 스크롤바 숨기기 */
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
`;

const LeftControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  flex-shrink: 0;
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: nowrap;
  flex-shrink: 0;
  overflow: visible; /* 드롭다운이 보이도록 설정 */
  position: relative; /* 상대 위치 설정 */
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input<{ $themeMode: ThemeMode }>`
  width: 250px;
  height: 40px;
  border: 1px solid
    ${({ $themeMode }) =>
      $themeMode === 'light' ? THEME_COLORS.light.borderColor : THEME_COLORS.dark.borderColor};
  border-right: none;
  border-radius: 4px 0 0 4px;

  color: ${({ $themeMode }) =>
    $themeMode === 'light' ? THEME_COLORS.light.inputText : THEME_COLORS.dark.inputText};
  padding-left: 15px;
  padding-right: 35px;
  background-color: #ffffff;

  // background-image: url("/icon_search.png");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px 16px;

  &::placeholder {
    color: #c4c5c9
  }

  &:focus {
    outline: none;
    /* border-color: ${({ $themeMode }) =>
      $themeMode === 'light' ? THEME_COLORS.light.primary : THEME_COLORS.dark.accent}; */
    // background-image: url("/icon_search.png");
  }
`;

const SearchButton = styled.button<{ $themeMode: ThemeMode }>`
  width: 60px;
  height: 40px;
  background: #214a72;
  border: none;
  border-radius: 0;
  color: #fff;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const ListInfo = styled.div<{ $themeMode: ThemeMode }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-right: 10px;
  color: ${({ $themeMode }) =>
    $themeMode === 'light' ? THEME_COLORS.light.text : THEME_COLORS.dark.text};
  font-size: 14px;
`;

const ExcelButton = styled(ActionButton)`
  background: ${({ $themeMode }) =>
    $themeMode === 'light' ? '#f8f8f8' : THEME_COLORS.dark.primary};
  color: ${({ $themeMode }) =>
    $themeMode === 'light' ? THEME_COLORS.light.primary : THEME_COLORS.dark.buttonText};
  border: none;
  &:hover:not(:disabled) {
    background-color: ${({ $themeMode }) => ($themeMode === 'light' ? '#e8e8e8' : '#424451')};
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: visible; /* 드롭다운이 보이도록 설정 */
  position: relative; /* 상대 위치 설정 */
`;

const Cnt = styled.div<{ $themeMode: ThemeMode }>`
  font-size: 14px;
  color: ${({ $themeMode }) => ($themeMode === 'light' ? '#555555' : THEME_COLORS.dark.text)};
  white-space: nowrap;
`;

const PageBox = styled.div<{ $themeMode: ThemeMode }>`
  margin: 0 5px;
  font-size: 14px;
  color: #887e67;
  white-space: nowrap;
`;

const TotalCountInfo = styled.p<{ $themeMode: ThemeMode }>`
  margin: 0;
  margin-right: 16px;
  font-size: 14px;
  color: #887e67;
  white-space: nowrap;
`;

const ItemsPerPageText = styled.p<{ $themeMode: ThemeMode }>`
  margin: 0;
  margin-left: 5px;
  font-size: 14px;
  color: #887e67;
  white-space: nowrap;
`;

const InfoText = styled.p<{ $themeMode: ThemeMode }>`
  margin: 0;
  font-size: 14px;
  color: #887e67;
  white-space: nowrap;
`;

const TableContainer = styled.div<{ $themeMode: ThemeMode }>`
  width: 100%;
  min-width: 1000px;
  max-width: 100%; /* 컨테이너를 벗어나지 않도록 최대 너비 제한 */
  border: 1px solid
    ${({ $themeMode }) =>
      $themeMode === 'light' ? THEME_COLORS.light.borderColor : THEME_COLORS.dark.borderColor};
  border-radius: 4px;
  background: ${({ $themeMode }) =>
    $themeMode === 'light'
      ? THEME_COLORS.light.tableBackground
      : THEME_COLORS.dark.tableBackground};
  overflow: hidden; /* 테이블이 컨테이너를 벗어나지 않도록 */
  table-layout: fixed; /* 테이블 레이아웃을 고정하여 컬럼 너비 제어 */

  /* 내부 테이블 요소들도 너비 제한 */
  table {
    width: 100%;
    table-layout: fixed;
  }

  @media (max-width: 1400px) {
    min-width: 1000px;
  }
`;

const LoadingContainer = styled.div<{ $themeMode: ThemeMode }>`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  width: 100%;
  background-color: ${({ $themeMode }) =>
    $themeMode === 'light'
      ? THEME_COLORS.light.tableBackground
      : THEME_COLORS.dark.tableBackground};
`;

const LoadingSpinner = styled.div<{ $themeMode: ThemeMode }>`
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid
    ${({ $themeMode }) =>
      $themeMode === 'light' ? THEME_COLORS.light.primary : THEME_COLORS.dark.accent};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ErrorContainer = styled.div<{ $themeMode: ThemeMode }>`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  width: 100%;
  background-color: ${({ $themeMode }) =>
    $themeMode === 'light'
      ? THEME_COLORS.light.tableBackground
      : THEME_COLORS.dark.tableBackground};
`;

const ErrorMessage = styled.p<{ $themeMode: ThemeMode }>`
  color: #d32f2f;
  font-size: 16px;
  text-align: center;
`;

const DateRangePickerContainer = styled.div`
  /* 특별한 스타일 불필요 */
`;

const TabsWrapper = styled.div`
  margin-top: 15px;
`;

const CMSTitle = styled.h1<{ $themeMode: ThemeMode }>`
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  margin-bottom: 0;
  color: ${({ $themeMode }) =>
    $themeMode === 'light' ? THEME_COLORS.light.titleColor : THEME_COLORS.dark.titleColor};
`;

const NavButton = styled.button<{ $themeMode: ThemeMode }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
  border: 1px solid
    ${({ $themeMode }) =>
      $themeMode === 'light' ? THEME_COLORS.light.borderColor : THEME_COLORS.dark.borderColor};
  background-color: #ddd8c7;
  color: ${({ $themeMode }) =>
    $themeMode === 'light' ? THEME_COLORS.light.text : THEME_COLORS.dark.text};
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
  transition:
    background-color 0.2s,
    border-color 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.8;
    border-color: ${({ $themeMode }) => ($themeMode === 'light' ? '#999' : '#AAAAAA')};
    background-color: ${({ $themeMode }) => ($themeMode === 'light' ? '#f8f8f8' : '#424451')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: ${({ $themeMode }) => ($themeMode === 'light' ? '#EEEEEE' : '#555555')};
    color: ${({ $themeMode }) => ($themeMode === 'light' ? '#AAAAAA' : '#777777')};
  }
`;

const DualAmountsContainer = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
`;

const TotalAmount = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #97601a;
  font-weight: 500;
`;

const TotalAmountLabel = styled.span`
  font-size: 24px;
  color: black;
  font-weight: 600;
  margin-right: 10px;
`;

const TotalAmountValue = styled.span`
  font-size: 24px;
  color: #db6220;
  font-weight: 600;
`;

// 스타일 컴포넌트 추가
const StatusFilterContainer = styled.div`
  margin: 0 10px;
  position: relative;
  display: flex;
  align-items: center;

  &::after {
    content: '';
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 16px;
    background-image: url('/icon_burger.png');
    background-size: contain;
    background-repeat: no-repeat;
    transform: translateY(-50%) rotate(270deg);
    pointer-events: none;
  }
`;

const StatusSelect = styled.select<{ $themeMode: ThemeMode }>`
  width: 150px;
  height: 40px;
  padding: 11px 14px;
  padding-right: 30px; // 아이콘을 위한 여백
  border: 1px solid #e0e0e0;
  border-radius: 0px;
  background-color: #fbf9f2;
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  &:focus {
    outline: none;
    border-color: #97601a;
  }

  option {
    padding: 8px;
    background-color: white;

    &[value=''] {
      color: #887e67;
    }
    &[value='ONGOING'] {
      color: #4caf50;
    }
    &[value='ENDED'] {
      color: #2196f3;
    }
    &[value='WAITING'] {
      color: #ff9800;
    }
    &[value='CANCELED'] {
      color: #f44336;
    }
  }
`;
