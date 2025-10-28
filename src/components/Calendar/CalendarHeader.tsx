import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';
import { AppTextStyles } from '../../styles/textStyles';
import { CalendarView } from './types';
import { formatDate } from './utils';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: Date) => void;
}

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid ${AppColors.borderLight};
  margin-bottom: 16px;
`;

const NavigationSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const DateNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  background-color: ${AppColors.surface};
  color: ${AppColors.onSurface};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${AppColors.primary}20;
    border-color: ${AppColors.primary};
    color: ${AppColors.primary};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const DateDisplay = styled.div`
  font-size: ${AppTextStyles.title2.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  min-width: 200px;
  text-align: center;
`;

const TodayButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${AppColors.primary};
  border-radius: 4px;
  background-color: ${AppColors.surface};
  color: ${AppColors.primary};
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${AppColors.primary};
    color: ${AppColors.onPrimary};
  }
`;

const ViewSection = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ViewTab = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.$active ? AppColors.primary : AppColors.borderLight};
  background-color: ${props => props.$active ? AppColors.primary : AppColors.surface};
  color: ${props => props.$active ? AppColors.onPrimary : AppColors.onSurface};
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:first-child {
    border-radius: 4px 0 0 4px;
  }

  &:last-child {
    border-radius: 0 4px 4px 0;
  }

  &:not(:first-child) {
    border-left: none;
  }

  &:hover:not(.active) {
    background-color: ${AppColors.primary}10;
    border-color: ${AppColors.primary}40;
  }
`;

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  onViewChange,
  onDateChange
}) => {
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    onDateChange(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const getDateDisplayText = () => {
    switch (view) {
      case 'day':
        return formatDate(currentDate, 'full');
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${formatDate(weekStart, 'month-year')} ${weekStart.getDate()}일 - ${weekEnd.getDate()}일`;
        } else {
          return `${formatDate(weekStart, 'short')} - ${formatDate(weekEnd, 'short')}`;
        }
      case 'month':
        return formatDate(currentDate, 'month-year');
      default:
        return '';
    }
  };

  const getViewLabel = (viewType: CalendarView) => {
    switch (viewType) {
      case 'day': return '일별';
      case 'week': return '주별';
      case 'month': return '월별';
      default: return '';
    }
  };

  return (
    <HeaderContainer>
      <NavigationSection>
        <DateNavigation>
          <NavButton onClick={goToPrevious}>
            ←
          </NavButton>
          <DateDisplay>
            {getDateDisplayText()}
          </DateDisplay>
          <NavButton onClick={goToNext}>
            →
          </NavButton>
        </DateNavigation>
        <TodayButton onClick={goToToday}>
          오늘
        </TodayButton>
      </NavigationSection>

      <ViewSection>
        {(['day', 'week', 'month'] as CalendarView[]).map((viewType) => (
          <ViewTab
            key={viewType}
            $active={view === viewType}
            onClick={() => onViewChange(viewType)}
          >
            {getViewLabel(viewType)}
          </ViewTab>
        ))}
      </ViewSection>
    </HeaderContainer>
  );
};

export default CalendarHeader;
