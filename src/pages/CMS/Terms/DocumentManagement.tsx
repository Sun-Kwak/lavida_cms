import React, { useState } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';

const Container = styled.div`
  padding: 24px;
  background-color: ${AppColors.surface};
  min-height: 100vh;
`;

const Title = styled.h1`
  font-size: ${AppTextStyles.title1.fontSize};
  font-weight: 700;
  color: ${AppColors.onSurface};
  margin-bottom: 24px;
`;

const Content = styled.div`
  background-color: ${AppColors.background};
  padding: 32px;
  border-radius: 12px;
  border: 1px solid ${AppColors.borderLight};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const Button = styled.button<{ $isActive?: boolean }>`
  padding: 10px 20px;
  border: 1px solid ${props => props.$isActive ? AppColors.primary : AppColors.borderLight};
  border-radius: 8px;
  background-color: ${props => props.$isActive ? AppColors.primary : 'transparent'};
  color: ${props => props.$isActive ? AppColors.onPrimary : AppColors.onSurface};
  font-size: ${AppTextStyles.body2.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.$isActive ? AppColors.primary : AppColors.primary + '10'};
    color: ${props => props.$isActive ? AppColors.onPrimary : AppColors.primary};
  }
`;

const DocumentList = styled.div`
  display: grid;
  gap: 16px;
`;

const DocumentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  background-color: ${AppColors.surface};
`;

const DocumentInfo = styled.div`
  flex: 1;
`;

const DocumentName = styled.div`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 500;
  color: ${AppColors.onSurface};
  margin-bottom: 4px;
`;

const DocumentMeta = styled.div`
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${AppColors.onInput2};
`;

const DocumentActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 6px;
  background-color: transparent;
  color: ${AppColors.onSurface};
  font-size: ${AppTextStyles.label2.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${AppColors.primary}10;
    border-color: ${AppColors.primary};
    color: ${AppColors.primary};
  }
`;

const DocumentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'terms' | 'forms' | 'notices'>('terms');

  const termsDocuments = [
    { name: '개인정보 처리방침', version: 'v2.1', updatedAt: '2024.10.01', status: '활성' },
    { name: '서비스 이용약관', version: 'v1.3', updatedAt: '2024.09.15', status: '활성' },
    { name: '회원 이용약관', version: 'v1.1', updatedAt: '2024.08.20', status: '활성' },
  ];

  const formDocuments = [
    { name: '회원가입 신청서', version: 'v1.0', updatedAt: '2024.07.10', status: '활성' },
    { name: '건강 상태 체크리스트', version: 'v1.2', updatedAt: '2024.09.05', status: '활성' },
    { name: '트레이닝 동의서', version: 'v1.0', updatedAt: '2024.06.30', status: '활성' },
  ];

  const noticeDocuments = [
    { name: '시설 이용 안내', version: 'v1.4', updatedAt: '2024.10.05', status: '활성' },
    { name: '코로나19 방역 수칙', version: 'v2.0', updatedAt: '2024.08.15', status: '활성' },
    { name: '회원 혜택 안내', version: 'v1.1', updatedAt: '2024.09.20', status: '활성' },
  ];

  const getCurrentDocuments = () => {
    switch (activeTab) {
      case 'terms':
        return termsDocuments;
      case 'forms':
        return formDocuments;
      case 'notices':
        return noticeDocuments;
      default:
        return termsDocuments;
    }
  };

  return (
    <Container>
      <Title>문서 관리</Title>
      <Content>
        <ButtonGroup>
          <Button
            $isActive={activeTab === 'terms'}
            onClick={() => setActiveTab('terms')}
          >
            약관/정책
          </Button>
          <Button
            $isActive={activeTab === 'forms'}
            onClick={() => setActiveTab('forms')}
          >
            신청서/동의서
          </Button>
          <Button
            $isActive={activeTab === 'notices'}
            onClick={() => setActiveTab('notices')}
          >
            공지/안내
          </Button>
        </ButtonGroup>

        <DocumentList>
          {getCurrentDocuments().map((doc, index) => (
            <DocumentItem key={index}>
              <DocumentInfo>
                <DocumentName>{doc.name}</DocumentName>
                <DocumentMeta>
                  {doc.version} • {doc.updatedAt} • {doc.status}
                </DocumentMeta>
              </DocumentInfo>
              <DocumentActions>
                <ActionButton>편집</ActionButton>
                <ActionButton>미리보기</ActionButton>
                <ActionButton>다운로드</ActionButton>
              </DocumentActions>
            </DocumentItem>
          ))}
        </DocumentList>
      </Content>
    </Container>
  );
};

export default DocumentManagement;
