'use client';

import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AppTextField } from './AppTextField';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import "react-datepicker/dist/react-datepicker.css";

// 다국어 텍스트 객체
const texts = {
  ko: {
    dateSelect: '날짜 선택',
    timeSelect: '시간 선택',
    cancel: '취소',
    confirm: '확인',
    hour: '시',
    minute: '분',
    ampm: '오전/오후',
    months: [
      '1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'
    ],
    dateFormat: 'yyyy-MM-dd',
    dateTimeFormat: 'yyyy-MM-dd a h:mm',
    datePlaceholder: 'YYYY-MM-DD',
    dateTimePlaceholder: 'YYYY-MM-DD AM/PM H:MM'
  },
  en: {
    dateSelect: 'Select Date',
    timeSelect: 'Select Time',
    cancel: 'Cancel',
    confirm: 'Confirm',
    hour: 'Hour',
    minute: 'Min',
    ampm: 'AM/PM',
    months: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    dateFormat: 'yyyy-MM-dd',
    dateTimeFormat: 'yyyy-MM-dd h:mm a',
    datePlaceholder: 'YYYY-MM-DD',
    dateTimePlaceholder: 'YYYY-MM-DD H:MM AM/PM'
  },
};

// 모달 오버레이
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

// 커스텀 시간 선택기 컴포넌트 - 모달 형태
const CustomDateTimeSelector = styled.div<{ $showTime?: boolean }>`
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid ${AppColors.onInput1};
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 16px;
  min-width: ${props => props.$showTime ? '360px' : '250px'};
  width: fit-content;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
`;

const DateTimeContainer = styled.div<{ $showTime?: boolean }>`
  display: flex;
  gap: ${props => props.$showTime ? '16px' : '0'};
  margin-bottom: ${props => props.$showTime ? '16px' : '0'};
  justify-content: ${props => props.$showTime ? 'flex-start' : 'center'};
`;

const DateSection = styled.div`
  flex: 0 0 240px; /* 고정 너비로 설정 */
  width: 240px;
`;

const TimeSection = styled.div`
  flex: 1; /* 나머지 공간을 모두 차지 */
  border-left: 1px solid ${AppColors.onInput1};
  padding: 0 12px; /* 좌우 패딩으로 여백 조정 */
`;

const SectionTitle = styled.div`
  text-align: center;
  font-weight: 600;
  color: ${AppColors.onInput3};
  margin-bottom: 12px;
  font-size: 14px;
`;

/* 시간 선택용 헤더 - CustomHeader와 동일한 높이와 구조 */
const TimeHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  position: relative;
  min-height: 36px; /* CustomHeader와 동일한 높이 */
  box-sizing: border-box;
  margin-bottom: 0;
`;

const TimePickerContainer = styled.div`
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin-top: 20px; /* 헤더와 스크롤 영역 사이 여백 추가 */
`;

const TimeColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TimeScrollContainer = styled.div`
  height: 280px; /* 달력 영역과 맞춤 */
  width: 45px;
  border: none;
  overflow-y: auto;
  overflow-x: hidden;
  background: transparent;
  position: relative;
  
  /* 모든 브라우저에서 스크롤바 완전히 숨기기 */
  &::-webkit-scrollbar {
    width: 0px;
    height: 0px;
    display: none;
  }
  
  &::-webkit-scrollbar-track {
    display: none;
  }
  
  &::-webkit-scrollbar-thumb {
    display: none;
  }
  
  /* Firefox에서 스크롤바 숨기기 */
  scrollbar-width: none;
  
  /* Internet Explorer, Edge에서 스크롤바 숨기기 */
  -ms-overflow-style: none;
`;

/* AM/PM 전용 컨테이너 - 상단에서 시작 */
const PeriodContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent;
  width: 55px;
  height: 230px; /* 달력 영역과 맞춤 */
  padding-top: 0;
  align-items: flex-start;
  justify-content: flex-start;
`;

const TimeOption = styled.div<{ $selected: boolean }>`
  padding: 8px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$selected ? 'white' : AppColors.onInput3};
  background-color: ${props => props.$selected ? AppColors.primary : 'transparent'};
  font-weight: ${props => props.$selected ? '600' : 'normal'};
  position: relative;
  z-index: 2;
  
  &:hover {
    background-color: ${props => props.$selected ? AppColors.primary : AppColors.onInput1};
  }
`;

const PeriodOption = styled.div<{ $selected: boolean }>`
  padding: 8px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$selected ? 'white' : AppColors.onInput3};
  background-color: ${props => props.$selected ? AppColors.primary : 'transparent'};
  font-weight: ${props => props.$selected ? '600' : 'normal'};
  position: relative;
  z-index: 2;
  width: 100%;
  
  &:hover {
    background-color: ${props => props.$selected ? AppColors.primary : AppColors.onInput1};
  }
`;

const TimeButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
`;

const TimeButton = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${AppColors.onInput1};
  border-radius: 6px;
  background: ${props => props.$primary ? AppColors.primary : 'white'};
  color: ${props => props.$primary ? 'white' : AppColors.onInput3};
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: ${props => props.$primary ? AppColors.primary : AppColors.onInput1};
  }
`;

// 커스텀 헤더 스타일
const CustomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0 2px 0;
  background-color: ${AppColors.input};
  border-radius: 12px 12px 0 0;
  position: relative;
  min-height: 36px;
  width: 240px; /* DatePicker와 동일한 고정 너비 */
  box-sizing: border-box;
`;

const NavigationButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  outline: none;
  color: ${AppColors.onInput2};
  font-size: 28px;
  padding: 0;
  border-radius: 6px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: normal;
  line-height: 1;
  
  &:hover {
    color: ${AppColors.onInput3};
    background-color: ${AppColors.onInput1}60;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const YearMonthContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const YearMonthButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  color: ${AppColors.onInput3};
  font-weight: 600;
  font-size: 16px;
  border-radius: 6px;
  
  &:hover {
    background-color: ${AppColors.onInput1}40;
  }
`;

// 년도/월 그리드 컨테이너
const GridContainer = styled.div`
  padding: 16px;
  background: white;
  border-radius: 0 0 12px 12px;
  max-height: 300px;
  overflow-y: auto;
  width: 240px; /* DatePicker와 동일한 고정 너비 */
  box-sizing: border-box;
  
  /* 스크롤바 완전히 숨기기 */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Firefox에서 스크롤바 숨기기 */
  scrollbar-width: none;
  -ms-overflow-style: none;
`;

const YearGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
`;

const MonthGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
`;

const GridItem = styled.button<{ $selected?: boolean }>`
  padding: 12px;
  border: 1px solid ${props => props.$selected ? AppColors.primary : AppColors.onInput1};
  border-radius: 8px;
  background: ${props => props.$selected ? AppColors.primary : 'white'};
  color: ${props => props.$selected ? 'white' : AppColors.onInput3};
  cursor: pointer;
  font-size: 14px;
  font-weight: ${props => props.$selected ? '600' : 'normal'};
  text-align: center;
  box-sizing: border-box;
  width: calc(33.333% - 6px); /* 고정 너비로 3개씩 균등 분할 */
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  
  &:hover {
    background: ${props => props.$selected ? AppColors.primary : AppColors.onInput1};
    border-color: ${props => props.$selected ? AppColors.primary : AppColors.onInput2};
  }
`;

// DatePicker 커스텀 스타일 - 기본 헤더 숨기기
const StyledDatePickerWrapper = styled.div`
  .react-datepicker-wrapper {
    width: 100%;
  }

  .react-datepicker__input-container {
    width: 100%;
  }

  .react-datepicker {
    font-family: inherit;
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding-top: 0;
  }

  /* 기본 헤더에서 년월/네비게이션만 숨기고 요일 헤더는 보이게 */
  .react-datepicker__header {
    background-color: transparent;
    border-bottom: none;
    padding: 0;
    margin-top: 0;
  }

  /* 기본 네비게이션 숨기기 */
  .react-datepicker__navigation {
    display: none;
  }

  /* 기본 년월 표시 숨기기 */
  .react-datepicker__current-month {
    display: none;
  }

  /* 드롭다운 관련 요소들 숨기기 */
  .react-datepicker__header__dropdown,
  .react-datepicker__month-dropdown-container,
  .react-datepicker__year-dropdown-container,
  .react-datepicker__year-read-view,
  .react-datepicker__month-read-view,
  .react-datepicker__year-dropdown,
  .react-datepicker__month-dropdown {
    display: none !important;
  }

  /* 요일 헤더 스타일링 */
  .react-datepicker__day-names {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    margin-top: 0px;
    padding: 2px 0;
    border-bottom: 1px solid ${AppColors.onInput1};
  }

  .react-datepicker__day-name {
    width: 2rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${AppColors.onInput2};
    font-weight: 600;
    font-size: 12px;
  }

  .react-datepicker__week {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2px;
  }

  .react-datepicker__day-name,
  .react-datepicker__day {
    width: 2rem;
    height: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${AppColors.onInput3};
    border-radius: 50%;
    cursor: pointer;
    margin: 1px 0;
  }

  .react-datepicker__day:hover {
    background-color: ${AppColors.onInput1};
  }

  .react-datepicker__day--selected {
    background-color: ${AppColors.primary} !important;
    color: white !important;
  }

  .react-datepicker__day--today {
    background-color: ${AppColors.onInput1};
    font-weight: bold;
  }

  .react-datepicker__day--disabled {
    color: ${AppColors.onInput5};
    cursor: not-allowed;
  }

  .react-datepicker__time-container {
    border-left: 1px solid ${AppColors.onInput1};
  }

  .react-datepicker__time-list-item {
    padding: 8px 12px;
    color: ${AppColors.onInput3};
  }

  .react-datepicker__time-list-item:hover {
    background-color: ${AppColors.onInput1};
  }

  .react-datepicker__time-list-item--selected {
    background-color: ${AppColors.primary} !important;
    color: white !important;
  }
`;

export interface AppDateTimePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  readOnly?: boolean;
  
  // 날짜/시간 선택 옵션
  showTime?: boolean;
  dateFormat?: string;
  timeFormat?: string;
  
  // 날짜 제한
  minDate?: Date;
  maxDate?: Date;
  
  // 기타 옵션
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  
  // 언어 설정
  language?: 'ko' | 'en';
}

export const AppDateTimePicker: React.FC<AppDateTimePickerProps> = ({
  value,
  onChange,
  label,
  placeholder,
  errorMessage,
  readOnly = false,
  showTime = false,
  dateFormat,
  timeFormat = 'HH:mm',
  minDate,
  maxDate,
  autoComplete = 'off',
  autoFocus = false,
  disabled = false,
  language = 'ko',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState(1);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [viewMode, setViewMode] = useState<'calendar' | 'year' | 'month'>('calendar');
  const inputRef = useRef<HTMLInputElement>(null);

  const t = texts[language];

  // 년도/월 관련 state
  const currentDate = tempDate || new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // 년도/월 리스트 생성
  const minYear = minDate ? minDate.getFullYear() : new Date().getFullYear() - 10;
  const maxYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear() + 10;
  const yearList = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  const monthNames = t.months;

  // 기본 포맷 설정
  const defaultDateFormat = showTime ? t.dateTimeFormat : t.dateFormat;
  const finalDateFormat = dateFormat || defaultDateFormat;
  const finalPlaceholder = placeholder || (showTime ? t.dateTimePlaceholder : t.datePlaceholder);
  const finalLabel = label || t.dateSelect;

  // 표시할 값 포맷팅
  const displayValue = value ? format(value, finalDateFormat, { locale: ko }) : '';

  // 시간 값들 초기화
  useEffect(() => {
    if (value) {
      const hours = value.getHours();
      const minutes = value.getMinutes();
      
      if (hours === 0) {
        setSelectedHour(12);
        setSelectedPeriod('AM');
      } else if (hours <= 12) {
        setSelectedHour(hours === 12 ? 12 : hours);
        setSelectedPeriod(hours === 12 ? 'PM' : 'AM');
      } else {
        setSelectedHour(hours - 12);
        setSelectedPeriod('PM');
      }
      
      setSelectedMinute(minutes);
      setTempDate(new Date(value));
    } else {
      setTempDate(null);
    }
  }, [value]);

  // 컴포넌트 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      if (value) {
        setTempDate(new Date(value));
      } else {
        // value가 없을 때 minDate가 있으면 minDate로, 없으면 오늘로 설정
        const defaultDate = minDate ? new Date(minDate) : new Date();
        setTempDate(defaultDate);
      }
    }
  }, [isOpen, value, minDate]);

  // TextField 클릭 시 DatePicker 열기
  const handleTextFieldClick = () => {
    if (!readOnly && !disabled) {
      setIsOpen(true);
    }
  };

  // DatePicker에서 날짜 선택 시
  const handleDateChange = (date: Date | null) => {
    // date가 null인 경우 (이미 선택된 날짜를 다시 클릭한 경우) tempDate를 유지
    if (date === null && tempDate) {
      return;
    }
    
    setTempDate(date);
  };

  // DatePicker에서 날짜 선택 시 (onSelect 이벤트)
  const handleDateSelect = (date: Date) => {
    setTempDate(date);
  };

  // 확인 버튼 - 날짜와 시간 모두 적용
  const handleConfirm = () => {
    if (tempDate) {
      const newDate = new Date(tempDate);
      
      if (showTime) {
        let hour24 = selectedHour;
        
        if (selectedPeriod === 'PM' && selectedHour !== 12) {
          hour24 += 12;
        } else if (selectedPeriod === 'AM' && selectedHour === 12) {
          hour24 = 0;
        }
        
        newDate.setHours(hour24, selectedMinute, 0, 0);
      }
      
      onChange(newDate);
    } else {
      onChange(null);
    }
    setIsOpen(false);
  };

  // 취소 버튼 - 변경사항 취소
  const handleCancel = () => {
    setIsOpen(false);
  };

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 시간/분/AM-PM 옵션 생성
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'] as const;

  // 시간 선택 핸들러들 (스크롤 이동 제거)
  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour);
  };

  const handleMinuteSelect = (minute: number) => {
    setSelectedMinute(minute);
  };

  const handlePeriodSelect = (period: 'AM' | 'PM') => {
    setSelectedPeriod(period);
  };

  // 년도/월 네비게이션 핸들러들
  const handlePrevMonth = () => {
    if (tempDate) {
      const newDate = new Date(tempDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setTempDate(newDate);
    }
  };

  const handleNextMonth = () => {
    if (tempDate) {
      const newDate = new Date(tempDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setTempDate(newDate);
    }
  };

  // 년도 선택 모드로 전환
  const handleYearClick = () => {
    setViewMode('year');
  };

  // 월 선택 모드로 전환
  const handleMonthClick = () => {
    setViewMode('month');
  };

  // 년도 선택 핸들러
  const handleYearSelect = (year: number) => {
    if (tempDate) {
      const newDate = new Date(tempDate);
      newDate.setFullYear(year);
      setTempDate(newDate);
    }
    setViewMode('calendar');
  };

  // 월 선택 핸들러
  const handleMonthSelect = (monthIndex: number) => {
    if (tempDate) {
      const newDate = new Date(tempDate);
      newDate.setMonth(monthIndex);
      setTempDate(newDate);
    }
    setViewMode('calendar');
  };

  return (
    <StyledDatePickerWrapper>
      <div ref={inputRef} style={{ position: 'relative' }}>
        <div onClick={handleTextFieldClick} style={{ cursor: readOnly || disabled ? 'not-allowed' : 'pointer', position: 'relative' }}>
          <AppTextField
            value={displayValue}
            onChange={() => {}} // DatePicker에서만 값 변경
            label={finalLabel}
            placeholder={finalPlaceholder}
            errorMessage={errorMessage}
            readOnly={true} // 항상 readOnly로 설정하여 직접 타이핑 방지
            autoComplete={autoComplete}
            autoFocus={autoFocus}
          />
          {/* 달력 아이콘을 input 내부 오른쪽에 배치 - input 높이에만 맞춰 중앙정렬 */}
          <div style={{ 
            position: 'absolute',
            right: '16px',
            top: '6px', // label이 있는 경우를 고려한 input 위치
            height: '48px', // input 높이와 동일
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: AppColors.onInput2,
            cursor: readOnly || disabled ? 'not-allowed' : 'pointer',
            zIndex: 2,
            pointerEvents: 'none' // 클릭 이벤트는 상위 div가 처리
          }}>
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
        </div>
        
        {isOpen && (
          <ModalOverlay onClick={(e) => e.target === e.currentTarget && handleCancel()}>
            <CustomDateTimeSelector 
              $showTime={showTime}
              onClick={(e) => e.stopPropagation()}
            >
              <DateTimeContainer $showTime={showTime}>
                {/* 날짜 선택 영역 */}
                <DateSection>
                  <SectionTitle>{t.dateSelect}</SectionTitle>
                  
                  {/* 커스텀 헤더 */}
                  <CustomHeader>
                    <NavigationButton 
                      onClick={handlePrevMonth}
                      disabled={viewMode !== 'calendar'}
                      style={{ position: 'absolute', left: '0px', top: '50%', transform: 'translateY(-50%)' }}
                    >
                      ‹
                    </NavigationButton>
                    
                    <YearMonthContainer style={{ flex: 1, justifyContent: 'center' }}>
                      <YearMonthButton onClick={handleYearClick}>
                        {language === 'ko' ? `${currentYear}년` : currentYear}
                      </YearMonthButton>
                      <YearMonthButton onClick={handleMonthClick}>
                        {monthNames[currentMonth]}
                      </YearMonthButton>
                    </YearMonthContainer>
                    
                    <NavigationButton 
                      onClick={handleNextMonth}
                      disabled={viewMode !== 'calendar'}
                      style={{ position: 'absolute', right: '0px', top: '50%', transform: 'translateY(-50%)' }}
                    >
                      ›
                    </NavigationButton>
                  </CustomHeader>

                  {/* viewMode에 따른 컨텐츠 렌더링 */}
                  {viewMode === 'calendar' && (
                    <DatePicker
                      selected={tempDate}
                      onChange={handleDateChange}
                      onSelect={handleDateSelect}
                      showTimeSelect={false}
                      dateFormat="yyyy-MM-dd"
                      locale={ko}
                      inline
                      minDate={minDate}
                      maxDate={maxDate}
                      showMonthDropdown={false}
                      showYearDropdown={false}
                    />
                  )}

                  {viewMode === 'year' && (
                    <GridContainer>
                      <YearGrid>
                        {yearList.map(year => (
                          <GridItem
                            key={year}
                            $selected={year === currentYear}
                            onClick={() => handleYearSelect(year)}
                          >
                            {year}
                          </GridItem>
                        ))}
                      </YearGrid>
                    </GridContainer>
                  )}

                  {viewMode === 'month' && (
                    <GridContainer>
                      <MonthGrid>
                        {monthNames.map((month, index) => (
                          <GridItem
                            key={index}
                            $selected={index === currentMonth}
                            onClick={() => handleMonthSelect(index)}
                          >
                            {month}
                          </GridItem>
                        ))}
                      </MonthGrid>
                    </GridContainer>
                  )}
                </DateSection>

                {/* 시간 선택 영역 (showTime이 true일 때만 표시) */}
                {showTime && (
                  <TimeSection>
                    <SectionTitle>{t.timeSelect}</SectionTitle>
                    
                    {/* 시간 선택용 헤더 - 날짜 선택 헤더와 같은 라인 */}
                    <TimeHeader>
                      <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'space-between' }}>
                        <div style={{ width: '45px', textAlign: 'center', fontSize: '12px', color: AppColors.onInput2, fontWeight: '500' }}>{t.hour}</div>
                        <div style={{ width: '45px', textAlign: 'center', fontSize: '12px', color: AppColors.onInput2, fontWeight: '500' }}>{t.minute}</div>
                        <div style={{ width: '55px', textAlign: 'center', fontSize: '12px', color: AppColors.onInput2, fontWeight: '500' }}>{t.ampm}</div>
                      </div>
                    </TimeHeader>
                    
                    <TimePickerContainer>
                      {/* 시간 선택 */}
                      <TimeColumn>
                        <TimeScrollContainer className="hour-scroll">
                          {hours.map(hour => (
                            <TimeOption
                              key={hour}
                              $selected={selectedHour === hour}
                              onClick={() => handleHourSelect(hour)}
                            >
                              {hour}
                            </TimeOption>
                          ))}
                        </TimeScrollContainer>
                      </TimeColumn>

                      {/* 분 선택 */}
                      <TimeColumn>
                        <TimeScrollContainer className="minute-scroll">
                          {minutes.map(minute => (
                            <TimeOption
                              key={minute}
                              $selected={selectedMinute === minute}
                              onClick={() => handleMinuteSelect(minute)}
                            >
                              {minute.toString().padStart(2, '0')}
                            </TimeOption>
                          ))}
                        </TimeScrollContainer>
                      </TimeColumn>

                      {/* AM/PM 선택 */}
                      <TimeColumn>
                        <PeriodContainer>
                          {periods.map(period => (
                            <PeriodOption
                              key={period}
                              $selected={selectedPeriod === period}
                              onClick={() => handlePeriodSelect(period)}
                            >
                              {period}
                            </PeriodOption>
                          ))}
                        </PeriodContainer>
                      </TimeColumn>
                    </TimePickerContainer>
                  </TimeSection>
                )}
              </DateTimeContainer>

              <TimeButtonContainer>
                <TimeButton onClick={handleCancel}>{t.cancel}</TimeButton>
                <TimeButton $primary onClick={handleConfirm}>{t.confirm}</TimeButton>
              </TimeButtonContainer>
            </CustomDateTimeSelector>
          </ModalOverlay>
        )}
      </div>
    </StyledDatePickerWrapper>
  );
};
