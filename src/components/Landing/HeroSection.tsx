import React from 'react';
import styled, { keyframes } from 'styled-components';
import { AppColors } from '../../styles/colors';

// 애니메이션 정의
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
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const gradient = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// 히어로 섹션 - 현대적인 그라디언트와 패턴
const HeroSection = styled.section`
  position: relative;
  background: linear-gradient(-45deg, 
    ${AppColors.primary}, 
    ${AppColors.secondary}, 
    ${AppColors.tertiary}, 
    #1e7a8a
  );
  background-size: 400% 400%;
  animation: ${gradient} 15s ease infinite;
  color: ${AppColors.onPrimary};
  padding: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(ellipse at center, 
      rgba(255,255,255,0.1) 0%, 
      transparent 50%),
      linear-gradient(45deg, 
        rgba(255,255,255,0.05) 25%, 
        transparent 25%, 
        transparent 75%, 
        rgba(255,255,255,0.05) 75%);
    background-size: 60px 60px, 120px 120px;
    animation: float 6s ease-in-out infinite;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 900px;
  padding: 0 20px;
`;

const HeroTitle = styled.h1`
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 800;
  margin-bottom: 24px;
  letter-spacing: -0.03em;
  line-height: 1.1;
  animation: ${fadeInUp} 1s ease-out;
  background: linear-gradient(135deg, 
    rgba(255,255,255,1) 0%, 
    rgba(255,255,255,0.8) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(0,0,0,0.3);
  
  @media (max-width: 768px) {
    font-size: clamp(2.5rem, 10vw, 3.5rem);
  }
`;

const HeroSubtitle = styled.p`
  font-size: clamp(1.2rem, 3vw, 1.8rem);
  margin-bottom: 48px;
  opacity: 0.95;
  line-height: 1.6;
  font-weight: 300;
  animation: ${fadeInUp} 1s ease-out 0.2s both;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
`;

const CTAButtonGroup = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
  animation: ${fadeInUp} 1s ease-out 0.4s both;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
  }
`;

const CTAButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'secondary' 
    ? 'rgba(255, 255, 255, 0.2)' 
    : 'rgba(255, 255, 255, 0.9)'};
  color: ${props => props.variant === 'secondary' 
    ? AppColors.onPrimary 
    : AppColors.primary};
  border: ${props => props.variant === 'secondary' 
    ? '2px solid rgba(255, 255, 255, 0.3)' 
    : 'none'};
  padding: 18px 36px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;

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
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    
    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px) scale(0.98);
  }

  @media (max-width: 480px) {
    width: 200px;
  }
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${float} 3s ease-in-out infinite;
  cursor: pointer;
  
  &::before {
    content: '';
    width: 2px;
    height: 30px;
    background: rgba(255, 255, 255, 0.6);
    margin-bottom: 10px;
    border-radius: 2px;
  }
  
  &::after {
    content: '↓';
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.2rem;
  }
`;

const Hero: React.FC = () => {
  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <HeroSection>
      <HeroContent>
        <HeroTitle>라비다에 오신 것을 환영합니다</HeroTitle>
        <HeroSubtitle>
          혁신적인 기술과 창의적인 솔루션으로<br />
          여러분의 비즈니스를 다음 단계로 이끌어갑니다
        </HeroSubtitle>
        <CTAButtonGroup>
          <CTAButton variant="primary">지금 시작하기</CTAButton>
          <CTAButton variant="secondary">더 알아보기</CTAButton>
        </CTAButtonGroup>
      </HeroContent>
      <ScrollIndicator onClick={handleScrollDown} />
    </HeroSection>
  );
};

export default Hero;
