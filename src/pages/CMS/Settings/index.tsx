import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import BranchManagement from './BranchManagement';
import PositionTable from './PositionTable';
import RoleTable from './RoleTable';
import EmploymentTypeTable from './EmploymentTypeTable';
import PermissionTable from './PermissionTable';

const Container = styled.div`
  width: 100%;
`;

const TablesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  max-width: 1400px;
`;

const TableSection = styled.div`
  background-color: ${AppColors.surface};
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid ${AppColors.borderLight};
`;

const SectionTitle = styled.h2`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0 0 16px 0;
`;

const SettingsPage: React.FC = () => {
  return (
    <Container>
      <TablesGrid>
        {/* 지점 등록 */}
        <TableSection>
          <SectionTitle>지점 등록</SectionTitle>
          <BranchManagement />
        </TableSection>

        {/* 직급 */}
        <TableSection>
          <SectionTitle>직급</SectionTitle>
          <PositionTable />
        </TableSection>

        {/* 직책 */}
        <TableSection>
          <SectionTitle>직책</SectionTitle>
          <RoleTable />
        </TableSection>

        {/* 고용형태 */}
        <TableSection>
          <SectionTitle>고용형태</SectionTitle>
          <EmploymentTypeTable />
        </TableSection>

        {/* 권한 */}
        <TableSection>
          <SectionTitle>권한</SectionTitle>
          <PermissionTable />
        </TableSection>
      </TablesGrid>
    </Container>
  );
};

export default SettingsPage;
