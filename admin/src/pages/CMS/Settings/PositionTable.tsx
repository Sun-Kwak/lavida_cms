import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';

const Table = styled.div`
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  background-color: ${AppColors.background};
  padding: 12px 16px;
  border-bottom: 1px solid ${AppColors.borderLight};
  font-weight: 600;
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onSurface};
`;

const TableRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid ${AppColors.borderLight};
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onSurface};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${AppColors.background};
  }
`;

const PositionName = styled.span`
  flex: 1;
`;

const positions = [
  '대표',
  '이사',
  '부장',
  '차장',
  '과장',
  '대리',
  '사원',
  '인턴'
];

const PositionTable: React.FC = () => {
  return (
    <Table>
      <TableHeader>직급 목록</TableHeader>
      {positions.map((position, index) => (
        <TableRow key={index}>
          <PositionName>{position}</PositionName>
        </TableRow>
      ))}
    </Table>
  );
};

export default PositionTable;
