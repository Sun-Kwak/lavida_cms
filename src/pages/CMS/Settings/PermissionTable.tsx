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

const PermissionInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PermissionName = styled.span`
  font-weight: 500;
`;

const PermissionDescription = styled.span`
  font-size: ${AppTextStyles.label3.fontSize};
  color: ${AppColors.onSurface}80;
`;

const permissions = [
  {
    name: 'MASTER',
    description: '모든 기능 접근 및 수정 가능'
  },
  {
    name: 'EDITOR',
    description: '소속 지점 데이터 편집 및 조회 가능'
  },
  {
    name: 'VIEWER',
    description: '소속 지점 데이터 조회만 가능'
  }
];

const PermissionTable: React.FC = () => {
  return (
    <Table>
      <TableHeader>권한 목록</TableHeader>
      {permissions.map((permission, index) => (
        <TableRow key={index}>
          <PermissionInfo>
            <PermissionName>{permission.name}</PermissionName>
            <PermissionDescription>{permission.description}</PermissionDescription>
          </PermissionInfo>
        </TableRow>
      ))}
    </Table>
  );
};

export default PermissionTable;
