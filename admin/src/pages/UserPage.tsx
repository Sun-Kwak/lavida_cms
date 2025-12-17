import React from 'react';
import styled from 'styled-components';
import {
  HeroSection,
  ServicesSection,
  AboutSection,
  ContactSection,
  Footer
} from '../components/Landing';

// 전체 컨테이너
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

// 메인 콘텐츠 영역
const MainContent = styled.main`
  flex: 1;
`;

const UserPage: React.FC = () => {
  return (
    <PageContainer>
      <MainContent>
        <HeroSection />
        <ServicesSection />
        <AboutSection />
        <ContactSection />
      </MainContent>
      <Footer />
    </PageContainer>
  );
};

export default UserPage;
