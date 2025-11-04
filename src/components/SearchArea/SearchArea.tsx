import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';

// 기간 옵션 타입
export type PeriodOption = '1month' | '3month' | '6month' | 'custom';

// Props 타입 정의
interface SearchAreaProps {
  // 기간 선택 관련
  selectedPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomStartDateChange?: (date: string) => void;
  onCustomEndDateChange?: (date: string) => void;
  dateRangeDisplay: string;
  
  // 검색 관련
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  searchPlaceholder?: string;
  
  // 자동 검색 옵션
  autoSearchOnDateChange?: boolean;
  
  // 좌측 추가 컨텐츠 (미수 필터 등)
  leftContent?: React.ReactNode;
}

const SearchContainer = styled.div`
  background: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
`;

const MainRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
`;

const LeftSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const PeriodSection = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const PeriodDisplay = styled.div<{ $clickable?: boolean }>`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onInput1};
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${AppColors.borderLight};
  min-width: 200px;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  position: relative;
  height: 43px; /* 검색 input과 동일한 전체 높이 */
  box-sizing: border-box;
  display: flex;
  align-items: center;
  
  &:hover {
    ${props => props.$clickable && `
      border-color: ${AppColors.primary};
      background: rgba(0, 123, 255, 0.05);
    `}
  }
`;

const DatePickerModal = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  background: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 20px;
  margin-top: 4px;
  min-width: 350px;
  display: ${props => props.$visible ? 'block' : 'none'};
`;

const DatePickerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const DatePickerTitle = styled.h4`
  margin: 0;
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: ${AppColors.onInput1};
  padding: 4px;
  line-height: 1;
  
  &:hover {
    color: ${AppColors.onSurface};
  }
`;

const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DateSelectionInfo = styled.div`
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onInput1};
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  text-align: center;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const MonthNavButton = styled.button`
  background: none;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: ${AppTextStyles.body2.fontSize};
  
  &:hover {
    background: ${AppColors.primary};
    color: ${AppColors.onPrimary};
    border-color: ${AppColors.primary};
  }
`;

const MonthTitle = styled.div<{ $clickable?: boolean }>`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  padding: 6px 12px;
  border-radius: 4px;
  
  &:hover {
    ${props => props.$clickable && `
      background: rgba(0, 123, 255, 0.1);
    `}
  }
`;

const YearMonthSelector = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  background: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  display: ${props => props.$visible ? 'block' : 'none'};
  min-width: 200px;
`;

const YearMonthGrid = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
`;

const YearMonthLabel = styled.label`
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 500;
  color: ${AppColors.onSurface};
  min-width: 30px;
`;

const YearMonthSelect = styled.select`
  flex: 1;
  padding: 6px 8px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  font-size: ${AppTextStyles.body2.fontSize};
  outline: none;
  
  &:focus {
    border-color: ${AppColors.primary};
  }
`;

const YearMonthApplyButton = styled.button`
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 4px;
  background: ${AppColors.primary};
  color: ${AppColors.onPrimary};
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const DayHeader = styled.div`
  padding: 8px 4px;
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 500;
  color: ${AppColors.onInput1};
`;

const DayCell = styled.button<{ 
  $isSelected?: boolean; 
  $isInRange?: boolean; 
  $isToday?: boolean;
  $isDisabled?: boolean;
}>`
  padding: 8px 4px;
  border: none;
  background: ${props => {
    if (props.$isSelected) return AppColors.primary;
    if (props.$isInRange) return 'rgba(0, 123, 255, 0.1)';
    return 'transparent';
  }};
  color: ${props => {
    if (props.$isDisabled) return AppColors.onInput1;
    if (props.$isSelected) return AppColors.onPrimary;
    if (props.$isToday) return AppColors.primary;
    return AppColors.onSurface;
  }};
  border-radius: 4px;
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
  font-size: ${AppTextStyles.body2.fontSize};
  opacity: ${props => props.$isDisabled ? 0.5 : 1};
  
  &:hover {
    ${props => !props.$isDisabled && !props.$isSelected && `
      background: rgba(0, 123, 255, 0.1);
    `}
  }
`;

const ApplyButton = styled.button`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  background: ${AppColors.primary};
  color: ${AppColors.onPrimary};
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PeriodButton = styled.button<{ $active: boolean }>`
  padding: 12px 16px;
  border: 1px solid ${props => props.$active ? AppColors.primary : AppColors.borderLight};
  border-radius: 8px;
  background: ${props => props.$active ? AppColors.primary : AppColors.surface};
  color: ${props => props.$active ? AppColors.onPrimary : AppColors.onSurface};
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  height: 43px; /* 검색 input과 동일한 전체 높이 */
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: ${AppColors.primary};
    background: ${props => props.$active ? AppColors.primary : 'rgba(0, 123, 255, 0.1)'};
  }
`;

const SearchSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
  min-width: 300px;
  
  @media (max-width: 768px) {
    min-width: auto;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  font-size: ${AppTextStyles.body1.fontSize};
  outline: none;
  
  &:focus {
    border-color: ${AppColors.primary};
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
  }
`;

const SearchButton = styled.button`
  padding: 12px 18px;
  border: none;
  border-radius: 8px;
  background: ${AppColors.primary};
  color: ${AppColors.onPrimary};
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  height: 43px; /* 검색 input과 동일한 전체 높이 */
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SearchArea: React.FC<SearchAreaProps> = ({
  leftContent,
  selectedPeriod,
  onPeriodChange,
  customStartDate = '',
  customEndDate = '',
  onCustomStartDateChange,
  onCustomEndDateChange,
  dateRangeDisplay,
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = "검색어를 입력하세요...",
  autoSearchOnDateChange = false
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showYearMonthSelector, setShowYearMonthSelector] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [selectingStart, setSelectingStart] = useState(true);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const datePickerRef = useRef<HTMLDivElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  // 외부 클릭 감지해서 달력 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
        setShowYearMonthSelector(false);
        resetTempDates();
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  const resetTempDates = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setSelectingStart(true);
  };

  const handleDateRangeClick = () => {
    if (selectedPeriod === 'custom') {
      setShowDatePicker(!showDatePicker);
    } else {
      onPeriodChange('custom');
      setShowDatePicker(true);
    }
    resetTempDates();
    setShowYearMonthSelector(false);
  };

  const handleMonthTitleClick = () => {
    setTempYear(currentMonth.getFullYear());
    setTempMonth(currentMonth.getMonth());
    setShowYearMonthSelector(!showYearMonthSelector);
  };

  const handleYearMonthApply = () => {
    setCurrentMonth(new Date(tempYear, tempMonth, 1));
    setShowYearMonthSelector(false);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const handleDateClick = (date: Date) => {
    if (selectingStart) {
      setTempStartDate(date);
      setTempEndDate(null);
      setSelectingStart(false);
    } else {
      if (tempStartDate && date < tempStartDate) {
        // 종료일이 시작일보다 앞서면 시작일을 다시 설정
        setTempStartDate(date);
        setTempEndDate(null);
        setSelectingStart(false);
      } else {
        setTempEndDate(date);
      }
    }
  };

  const handleApplyDates = () => {
    if (tempStartDate && tempEndDate) {
      const startDateStr = tempStartDate.toISOString().split('T')[0];
      const endDateStr = tempEndDate.toISOString().split('T')[0];
      onCustomStartDateChange?.(startDateStr);
      onCustomEndDateChange?.(endDateStr);
      setShowDatePicker(false);
      resetTempDates();
      
      // 자동 검색 옵션이 켜져있으면 적용과 동시에 검색 실행
      if (autoSearchOnDateChange) {
        setTimeout(() => {
          onSearch();
        }, 100); // 약간의 지연을 줘서 상태 업데이트 완료 후 검색
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isDateInRange = (date: Date) => {
    if (!tempStartDate || !tempEndDate) return false;
    return date >= tempStartDate && date <= tempEndDate;
  };

  const isDateSelected = (date: Date) => {
    if (!tempStartDate) return false;
    if (tempEndDate) {
      return date.getTime() === tempStartDate.getTime() || date.getTime() === tempEndDate.getTime();
    }
    return date.getTime() === tempStartDate.getTime();
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    
    // 요일 헤더
    const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
    dayHeaders.forEach(day => {
      days.push(
        <DayHeader key={`header-${day}`}>
          {day}
        </DayHeader>
      );
    });

    // 날짜 셀들
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = isDateSelected(date);
      const isInRange = isDateInRange(date);
      
      days.push(
        <DayCell
          key={date.toISOString()}
          $isSelected={isSelected}
          $isInRange={isInRange}
          $isToday={isToday}
          $isDisabled={!isCurrentMonth}
          onClick={() => isCurrentMonth && handleDateClick(date)}
        >
          {date.getDate()}
        </DayCell>
      );
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  return (
    <SearchContainer>
      {/* 메인 검색 영역 */}
      <MainRow>
        {/* 좌측 컨텐츠 영역 (미수 필터 등) */}
        {leftContent && (
          <LeftSection>
            {leftContent}
          </LeftSection>
        )}

        {/* 기간 선택 영역 */}
        <PeriodSection>
          <div style={{ position: 'relative' }} ref={datePickerRef}>
            <PeriodDisplay 
              $clickable={true}
              onClick={handleDateRangeClick}
            >
              {dateRangeDisplay}
            </PeriodDisplay>
            
            {/* 달력 모달 */}
            <DatePickerModal $visible={showDatePicker}>
              <DatePickerHeader>
                <DatePickerTitle>기간 선택</DatePickerTitle>
                <CloseButton onClick={() => {
                  setShowDatePicker(false);
                  setShowYearMonthSelector(false);
                  resetTempDates();
                }}>
                  ×
                </CloseButton>
              </DatePickerHeader>
              
              <CalendarContainer>
                {/* 선택 상태 정보 */}
                <DateSelectionInfo>
                  {tempStartDate && !tempEndDate && "종료일을 선택하세요"}
                  {tempStartDate && tempEndDate && 
                    `${formatDate(tempStartDate)} ~ ${formatDate(tempEndDate)}`
                  }
                  {!tempStartDate && "시작일을 선택하세요"}
                </DateSelectionInfo>
                
                {/* 월 네비게이션 */}
                <CalendarHeader style={{ position: 'relative' }}>
                  <MonthNavButton onClick={() => navigateMonth('prev')}>
                    ‹
                  </MonthNavButton>
                  <MonthTitle 
                    $clickable={true}
                    onClick={handleMonthTitleClick}
                  >
                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                  </MonthTitle>
                  <MonthNavButton onClick={() => navigateMonth('next')}>
                    ›
                  </MonthNavButton>
                  
                  {/* 년/월 선택 드롭다운 */}
                  <YearMonthSelector $visible={showYearMonthSelector}>
                    <YearMonthGrid>
                      <YearMonthLabel>년:</YearMonthLabel>
                      <YearMonthSelect
                        value={tempYear}
                        onChange={(e) => setTempYear(Number(e.target.value))}
                      >
                        {generateYearOptions().map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </YearMonthSelect>
                    </YearMonthGrid>
                    
                    <YearMonthGrid>
                      <YearMonthLabel>월:</YearMonthLabel>
                      <YearMonthSelect
                        value={tempMonth}
                        onChange={(e) => setTempMonth(Number(e.target.value))}
                      >
                        {monthNames.map((month, index) => (
                          <option key={index} value={index}>
                            {month}
                          </option>
                        ))}
                      </YearMonthSelect>
                    </YearMonthGrid>
                    
                    <YearMonthApplyButton onClick={handleYearMonthApply}>
                      적용
                    </YearMonthApplyButton>
                  </YearMonthSelector>
                </CalendarHeader>
                
                {/* 달력 그리드 */}
                <CalendarGrid>
                  {renderCalendar()}
                </CalendarGrid>
                
                {/* 적용 버튼 */}
                <ApplyButton 
                  onClick={handleApplyDates}
                  disabled={!tempStartDate || !tempEndDate}
                >
                  적용
                </ApplyButton>
              </CalendarContainer>
            </DatePickerModal>
          </div>
          
          <PeriodButton 
            $active={selectedPeriod === '1month'}
            onClick={() => {
              onPeriodChange('1month');
              setShowDatePicker(false);
              if (autoSearchOnDateChange) {
                setTimeout(() => onSearch(), 100);
              }
            }}
          >
            1개월
          </PeriodButton>
          
          <PeriodButton 
            $active={selectedPeriod === '3month'}
            onClick={() => {
              onPeriodChange('3month');
              setShowDatePicker(false);
              if (autoSearchOnDateChange) {
                setTimeout(() => onSearch(), 100);
              }
            }}
          >
            3개월
          </PeriodButton>
          
          <PeriodButton 
            $active={selectedPeriod === '6month'}
            onClick={() => {
              onPeriodChange('6month');
              setShowDatePicker(false);
              if (autoSearchOnDateChange) {
                setTimeout(() => onSearch(), 100);
              }
            }}
          >
            6개월
          </PeriodButton>
          
          <PeriodButton 
            $active={selectedPeriod === 'custom'}
            onClick={() => {
              onPeriodChange('custom');
              setShowDatePicker(true);
              // custom은 날짜 선택 후 적용 버튼에서 자동 검색 처리
            }}
          >
            지정
          </PeriodButton>
        </PeriodSection>

        {/* 검색 영역 */}
        <SearchSection>
          <SearchInput
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={searchPlaceholder}
          />
          <SearchButton onClick={onSearch}>
            조회
          </SearchButton>
        </SearchSection>
      </MainRow>
    </SearchContainer>
  );
};

export default SearchArea;
