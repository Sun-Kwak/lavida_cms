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

const EmploymentTypeName = styled.span`
  flex: 1;
`;

const employmentTypes = [
  '정규직',
  '계약직',
  '프리랜서'
];

const EmploymentTypeTable: React.FC = () => {
  return (
    <Table>
      <TableHeader>고용형태 목록</TableHeader>
      {employmentTypes.map((type, index) => (
        <TableRow key={index}>
          <EmploymentTypeName>{type}</EmploymentTypeName>
        </TableRow>
      ))}
    </Table>
  );
};

export default EmploymentTypeTable;
