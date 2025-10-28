import React from 'react';
import styled, { keyframes } from 'styled-components';
import { AppColors } from '../../styles/colors';

// 애니메이션
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(55, 187, 214, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(55, 187, 214, 0.8);
  }
`;

// Footer
const FooterContainer = styled.footer`
  background: linear-gradient(135deg, 
    ${AppColors.secondary} 0%, 
    #1e7a8a  50%, 
    ${AppColors.primary} 100%
  );
  color: ${AppColors.onPrimary};
  padding: 80px 20px 0;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(ellipse at top center, 
      rgba(255, 255, 255, 0.1) 0%, 
      transparent 50%
    );
    pointer-events: none;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const FooterContent = styled.div`
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr);
  gap: 60px;
  margin-bottom: 60px;

  @media (max-width: 968px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 40px;
  }

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const BrandSection = styled.div`
  animation: ${fadeInUp} 0.8s ease-out;
`;

const Logo = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 20px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 1) 0%, 
    rgba(255, 255, 255, 0.8) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const BrandDescription = styled.p`
  font-size: 1.1rem;
  line-height: 1.7;
  opacity: 0.9;
  margin-bottom: 32px;
  font-weight: 300;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: ${AppColors.onPrimary};
  text-decoration: none;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    animation: ${glow} 2s infinite;
  }
`;

const FooterSection = styled.div<{ index: number }>`
  animation: ${fadeInUp} 0.8s ease-out ${props => props.index * 0.1}s both;
  
  h4 {
    font-size: 1.4rem;
    margin-bottom: 24px;
    font-weight: 700;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 30px;
      height: 3px;
      background: linear-gradient(90deg, 
        rgba(255, 255, 255, 0.8), 
        transparent
      );
      border-radius: 2px;
    }
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  li {
    margin-bottom: 12px;
  }
  
  a {
    color: ${AppColors.onPrimary};
    opacity: 0.8;
    text-decoration: none;
    font-size: 1rem;
    font-weight: 300;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    position: relative;
    
    &:hover {
      opacity: 1;
      transform: translateX(5px);
      
      &::before {
        content: '→';
        position: absolute;
        left: -15px;
        opacity: 0.8;
      }
    }
  }
  
  p {
    color: ${AppColors.onPrimary};
    opacity: 0.8;
    line-height: 1.6;
    margin-bottom: 8px;
    font-weight: 300;
  }
`;

const Newsletter = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 40px;
`;

const NewsletterTitle = styled.h5`
  font-size: 1.2rem;
  margin-bottom: 12px;
  font-weight: 600;
`;

const NewsletterText = styled.p`
  font-size: 0.95rem;
  opacity: 0.8;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const NewsletterForm = styled.form`
  display: flex;
  gap: 12px;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const NewsletterInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: ${AppColors.onPrimary};
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const NewsletterButton = styled.button`
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: ${AppColors.onPrimary};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: 32px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: ${AppColors.onPrimary};
  opacity: 0.7;
  font-size: 0.9rem;
  margin: 0;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 24px;
  
  @media (max-width: 576px) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
  }
`;

const FooterLink = styled.a`
  color: ${AppColors.onPrimary};
  opacity: 0.7;
  text-decoration: none;
  font-size: 0.9rem;
  transition: opacity 0.3s ease;
  
  &:hover {
    opacity: 1;
  }
`;

interface FooterItem {
  text: string;
  href?: string;
  isLink: boolean;
}

interface FooterSectionData {
  title: string;
  items: FooterItem[];
}

const Footer: React.FC = () => {
  const footerSections: FooterSectionData[] = [
    {
      title: "서비스",
      items: [
        { text: "웹 애플리케이션 개발", href: "#service1", isLink: true },
        { text: "모바일 앱 개발", href: "#service2", isLink: true },
        { text: "클라우드 솔루션", href: "#service3", isLink: true },
        { text: "기술 컨설팅", href: "#service4", isLink: true },
        { text: "UI/UX 디자인", href: "#service5", isLink: true }
      ]
    },
    {
      title: "회사 정보",
      items: [
        { text: "회사 소개", href: "#about", isLink: true },
        { text: "팀 소개", href: "#team", isLink: true },
        { text: "채용 정보", href: "#careers", isLink: true },
        { text: "뉴스 & 블로그", href: "#news", isLink: true },
        { text: "파트너십", href: "#partners", isLink: true }
      ]
    },
    {
      title: "고객 지원",
      items: [
        { text: "자주 묻는 질문", href: "#faq", isLink: true },
        { text: "기술 지원", href: "#support", isLink: true },
        { text: "문서 & 가이드", href: "#docs", isLink: true },
        { text: "연락처", href: "#contact", isLink: true },
        { text: "개발자 API", href: "#api", isLink: true }
      ]
    }
  ];

  return (
    <FooterContainer>
      <Container>
        <FooterContent>
          <BrandSection>
            <Logo>LAVIDA</Logo>
            <BrandDescription>
              혁신적인 기술과 창의적인 솔루션으로 고객의 성공을 만들어가는 
              신뢰할 수 있는 기술 파트너입니다.
            </BrandDescription>
            <SocialLinks>
              <SocialLink href="#" aria-label="Facebook">📘</SocialLink>
              <SocialLink href="#" aria-label="Twitter">🐦</SocialLink>
              <SocialLink href="#" aria-label="LinkedIn">💼</SocialLink>
              <SocialLink href="#" aria-label="Instagram">📷</SocialLink>
            </SocialLinks>
            <Newsletter>
              <NewsletterTitle>뉴스레터 구독</NewsletterTitle>
              <NewsletterText>최신 소식과 기술 트렌드를 받아보세요</NewsletterText>
              <NewsletterForm>
                <NewsletterInput 
                  type="email" 
                  placeholder="이메일 주소" 
                />
                <NewsletterButton type="submit">구독</NewsletterButton>
              </NewsletterForm>
            </Newsletter>
          </BrandSection>
          
          {footerSections.map((section, index) => (
            <FooterSection key={index} index={index + 1}>
              <h4>{section.title}</h4>
              <ul>
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    {item.isLink ? (
                      <a href={item.href}>{item.text}</a>
                    ) : (
                      <p>{item.text}</p>
                    )}
                  </li>
                ))}
              </ul>
            </FooterSection>
          ))}
        </FooterContent>
        
        <FooterBottom>
          <Copyright>
            &copy; 2024 라비다(LAVIDA). All rights reserved.
          </Copyright>
          <FooterLinks>
            <FooterLink href="#privacy">개인정보처리방침</FooterLink>
            <FooterLink href="#terms">이용약관</FooterLink>
            <FooterLink href="#cookies">쿠키 정책</FooterLink>
          </FooterLinks>
        </FooterBottom>
      </Container>
    </FooterContainer>
  );
};

export default Footer;
