import React from 'react';
import styled, { keyframes } from 'styled-components';
import { AppColors } from '../../styles/colors';

// 애니메이션
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

// 공통 섹션 스타일
const Section = styled.section`
  padding: 120px 20px;
  background: linear-gradient(135deg, 
    ${AppColors.background} 0%, 
    rgba(55, 187, 214, 0.02) 100%
  );
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 60%;
    height: 200%;
    background: radial-gradient(ellipse, 
      rgba(55, 187, 214, 0.1) 0%, 
      rgba(77, 200, 221, 0.05) 30%, 
      transparent 70%
    );
    transform: rotate(15deg);
    pointer-events: none;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const SectionTitle = styled.h2`
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  color: ${AppColors.onBackground};
  text-align: center;
  margin-bottom: 80px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, 
    ${AppColors.onBackground} 0%, 
    ${AppColors.primary} 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const AboutContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 60px;
  }
`;

const AboutText = styled.div`
  animation: ${slideInLeft} 0.8s ease-out 0.3s both;
  
  h3 {
    font-size: 2.2rem;
    color: ${AppColors.onBackground};
    margin-bottom: 32px;
    font-weight: 700;
    letter-spacing: -0.01em;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 60px;
      height: 4px;
      background: linear-gradient(90deg, 
        ${AppColors.primary}, 
        ${AppColors.tertiary}
      );
      border-radius: 2px;
    }
  }
  
  p {
    color: ${AppColors.onInput2};
    line-height: 1.8;
    margin-bottom: 24px;
    font-size: 1.1rem;
    font-weight: 300;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 40px;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 24px 16px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${AppColors.primary};
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: ${AppColors.onInput2};
  font-weight: 500;
`;

const AboutVisual = styled.div`
  animation: ${slideInRight} 0.8s ease-out 0.5s both;
  position: relative;
`;

const AboutImage = styled.div`
  background: linear-gradient(135deg, 
    ${AppColors.primary} 0%, 
    ${AppColors.secondary} 50%, 
    ${AppColors.tertiary} 100%
  );
  height: 500px;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${AppColors.onPrimary};
  font-size: 1.2rem;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 20px 60px rgba(55, 187, 214, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(255, 255, 255, 0.1) 90deg,
      transparent 180deg,
      rgba(255, 255, 255, 0.1) 270deg,
      transparent 360deg
    );
    animation: ${pulse} 4s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 2px;
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.1) 0%, 
      transparent 50%, 
      rgba(255, 255, 255, 0.05) 100%
    );
    border-radius: 22px;
    pointer-events: none;
  }
`;

const ImageContent = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
`;

const ImageIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.9;
`;

const ImageText = styled.div`
  font-size: 1.3rem;
  font-weight: 600;
  opacity: 0.9;
`;

const About: React.FC = () => {
  return (
    <Section>
      <Container>
        <SectionTitle>회사 소개</SectionTitle>
        <AboutContent>
          <AboutText>
            <h3>라비다의 비전</h3>
            <p>
              우리는 기술을 통해 더 나은 세상을 만들어가는 것을 목표로 합니다. 
              고객의 성공이 곧 우리의 성공이라는 믿음으로 혁신적인 솔루션을 제공합니다.
            </p>
            <p>
              10년 이상의 풍부한 경험을 바탕으로 다양한 산업 분야에서 
              검증된 고품질 솔루션을 지속적으로 제공하고 있습니다.
            </p>
            <p>
              지속적인 혁신과 발전을 통해 고객과 함께 성장하는 
              신뢰할 수 있는 기술 파트너가 되겠습니다.
            </p>
            <StatsContainer>
              <StatCard>
                <StatNumber>10+</StatNumber>
                <StatLabel>년의 경험</StatLabel>
              </StatCard>
              <StatCard>
                <StatNumber>100+</StatNumber>
                <StatLabel>성공 프로젝트</StatLabel>
              </StatCard>
              <StatCard>
                <StatNumber>50+</StatNumber>
                <StatLabel>만족한 고객</StatLabel>
              </StatCard>
              <StatCard>
                <StatNumber>24/7</StatNumber>
                <StatLabel>기술 지원</StatLabel>
              </StatCard>
            </StatsContainer>
          </AboutText>
          <AboutVisual>
            <AboutImage>
              <ImageContent>
                <ImageIcon>🏢</ImageIcon>
                <ImageText>혁신적인 기술로<br />더 나은 미래를 만들어갑니다</ImageText>
              </ImageContent>
            </AboutImage>
          </AboutVisual>
        </AboutContent>
      </Container>
    </Section>
  );
};

export default About;
