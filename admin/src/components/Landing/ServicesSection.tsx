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

const float = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-5px) rotate(2deg);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

// 공통 섹션 스타일
const Section = styled.section`
  padding: 120px 20px;
  background: linear-gradient(135deg, 
    ${AppColors.background} 0%, 
    ${AppColors.btnCEmphasis} 50%, 
    ${AppColors.background} 100%
  );
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, 
      rgba(55, 187, 214, 0.1) 0%, 
      transparent 50%),
      radial-gradient(circle at 80% 20%, 
      rgba(77, 200, 221, 0.1) 0%, 
      transparent 50%);
    pointer-events: none;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 80px;
`;

const SectionTitle = styled.h2`
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  color: ${AppColors.onBackground};
  margin-bottom: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, 
    ${AppColors.onBackground} 0%, 
    ${AppColors.primary} 50%, 
    ${AppColors.secondary} 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SectionDescription = styled.p`
  font-size: 1.3rem;
  color: ${AppColors.onInput2};
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
  font-weight: 300;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 40px;
  margin-top: 60px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }
`;

const ServiceCard = styled.div<{ index: number }>`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 50px 40px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  animation: ${fadeInUp} 0.6s ease-out ${props => props.index * 0.2}s both;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(255, 255, 255, 0.2), 
      transparent
    );
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(55, 187, 214, 0.2);
    
    &::before {
      left: 100%;
    }
  }

  @media (max-width: 768px) {
    padding: 40px 30px;
  }
`;

const ServiceIcon = styled.div`
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, 
    ${AppColors.primary} 0%, 
    ${AppColors.tertiary} 50%, 
    ${AppColors.secondary} 100%
  );
  border-radius: 24px;
  margin: 0 auto 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  box-shadow: 
    0 10px 30px rgba(55, 187, 214, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  animation: ${float} 6s ease-in-out infinite;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 120%;
    height: 120%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translate(-50%, -50%) rotate(45deg);
    animation: ${shimmer} 3s ease-in-out infinite;
  }
`;

const ServiceTitle = styled.h3`
  font-size: 1.8rem;
  color: ${AppColors.onBackground};
  margin-bottom: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const ServiceText = styled.p`
  color: ${AppColors.onInput2};
  line-height: 1.7;
  font-size: 1.1rem;
  font-weight: 300;
`;

const Services: React.FC = () => {
  const services = [
    {
      icon: "🚀",
      title: "빠른 배포",
      description: "최신 기술 스택과 CI/CD 파이프라인을 활용하여 신속하고 안정적인 서비스 배포를 제공합니다."
    },
    {
      icon: "💡",
      title: "혁신적 솔루션",
      description: "창의적이고 혁신적인 아이디어로 고객의 복잡한 비즈니스 문제를 우아하게 해결합니다."
    },
    {
      icon: "🔒",
      title: "보안 강화",
      description: "최고 수준의 보안 시스템과 최신 암호화 기술로 고객의 데이터와 프라이버시를 완벽히 보호합니다."
    }
  ];

  return (
    <Section>
      <Container>
        <SectionHeader>
          <SectionTitle>우리의 서비스</SectionTitle>
          <SectionDescription>
            고객의 성공을 위해 최고의 기술과 혁신적인 서비스를 제공합니다
          </SectionDescription>
        </SectionHeader>
        <ServicesGrid>
          {services.map((service, index) => (
            <ServiceCard key={index} index={index}>
              <ServiceIcon>{service.icon}</ServiceIcon>
              <ServiceTitle>{service.title}</ServiceTitle>
              <ServiceText>{service.description}</ServiceText>
            </ServiceCard>
          ))}
        </ServicesGrid>
      </Container>
    </Section>
  );
};

export default Services;
