import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../../styles/colors';

const HolidayOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, ${AppColors.error}20, ${AppColors.error}10);
  border-left: 3px solid ${AppColors.error};
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
`;

const HolidayText = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${AppColors.error};
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
  transform: rotate(-15deg);
`;

interface HolidayIndicatorProps {
  isHoliday: boolean;
  className?: string;
}

const HolidayIndicator: React.FC<HolidayIndicatorProps> = ({ 
  isHoliday, 
  className 
}) => {
  if (!isHoliday) return null;

  return (
    <HolidayOverlay className={className}>
      <HolidayText>휴일</HolidayText>
    </HolidayOverlay>
  );
};

export default HolidayIndicator;