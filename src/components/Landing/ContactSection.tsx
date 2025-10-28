import React, { useState } from 'react';
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

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-3px);
  }
`;

// 공통 섹션 스타일
const Section = styled.section`
  padding: 120px 20px;
  background: linear-gradient(135deg, 
    ${AppColors.btnCEmphasis} 0%, 
    ${AppColors.background} 50%, 
    rgba(55, 187, 214, 0.03) 100%
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
    background: radial-gradient(ellipse at center bottom, 
      rgba(55, 187, 214, 0.1) 0%, 
      transparent 60%
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
    ${AppColors.primary} 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const SectionDescription = styled.p`
  font-size: 1.3rem;
  color: ${AppColors.onInput2};
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
  font-weight: 300;
`;

const ContactContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: start;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 60px;
  }
`;

const ContactInfo = styled.div`
  animation: ${slideIn} 0.8s ease-out 0.3s both;
`;

const ContactGrid = styled.div`
  display: grid;
  gap: 32px;
`;

const ContactCard = styled.div<{ index: number }>`
  display: flex;
  align-items: center;
  padding: 32px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.6s ease-out ${props => props.index * 0.15}s both;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 48px rgba(55, 187, 214, 0.2);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }
`;

const ContactIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, 
    ${AppColors.primary} 0%, 
    ${AppColors.tertiary} 100%
  );
  border-radius: 20px;
  margin-right: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${AppColors.onPrimary};
  font-size: 2rem;
  box-shadow: 0 8px 24px rgba(55, 187, 214, 0.3);
  animation: ${float} 4s ease-in-out infinite;
  flex-shrink: 0;

  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 16px;
  }
`;

const ContactDetails = styled.div`
  flex: 1;
`;

const ContactTitle = styled.h4`
  font-size: 1.4rem;
  color: ${AppColors.onBackground};
  margin-bottom: 8px;
  font-weight: 700;
`;

const ContactText = styled.p`
  color: ${AppColors.onInput2};
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0;
`;

const ContactForm = styled.div`
  animation: ${slideIn} 0.8s ease-out 0.5s both;
`;

const FormContainer = styled.form`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h3`
  font-size: 1.8rem;
  color: ${AppColors.onBackground};
  margin-bottom: 32px;
  font-weight: 700;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const FormLabel = styled.label`
  display: block;
  color: ${AppColors.onBackground};
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 1rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 16px 20px;
  border: 2px solid rgba(55, 187, 214, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 0 0 4px rgba(55, 187, 214, 0.1);
  }

  &::placeholder {
    color: ${AppColors.onInput2};
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 16px 20px;
  border: 2px solid rgba(55, 187, 214, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 0 0 4px rgba(55, 187, 214, 0.1);
  }

  &::placeholder {
    color: ${AppColors.onInput2};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, 
    ${AppColors.primary} 0%, 
    ${AppColors.tertiary} 100%
  );
  color: ${AppColors.onPrimary};
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(55, 187, 214, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(55, 187, 214, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const contactInfo = [
    {
      icon: "📧",
      title: "이메일",
      text: "contact@lavida.com\nbusiness@lavida.com"
    },
    {
      icon: "📞",
      title: "전화번호",
      text: "02-1234-5678\n010-9876-5432"
    },
    {
      icon: "📍",
      title: "주소",
      text: "서울시 강남구 테헤란로 123\n라비다 빌딩 15층"
    },
    {
      icon: "🕒",
      title: "운영시간",
      text: "평일 9:00 - 18:00\n토요일 10:00 - 15:00"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic here
    console.log('Form submitted:', formData);
  };

  return (
    <Section>
      <Container>
        <SectionHeader>
          <SectionTitle>연락처</SectionTitle>
          <SectionDescription>
            궁금한 점이 있으시거나 상담이 필요하시면 언제든 연락주세요
          </SectionDescription>
        </SectionHeader>
        
        <ContactContent>
          <ContactInfo>
            <ContactGrid>
              {contactInfo.map((contact, index) => (
                <ContactCard key={index} index={index}>
                  <ContactIcon>{contact.icon}</ContactIcon>
                  <ContactDetails>
                    <ContactTitle>{contact.title}</ContactTitle>
                    <ContactText>{contact.text}</ContactText>
                  </ContactDetails>
                </ContactCard>
              ))}
            </ContactGrid>
          </ContactInfo>

          <ContactForm>
            <FormContainer onSubmit={handleSubmit}>
              <FormTitle>문의하기</FormTitle>
              
              <FormGroup>
                <FormLabel htmlFor="name">이름</FormLabel>
                <FormInput
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="이름을 입력해주세요"
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="email">이메일</FormLabel>
                <FormInput
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="이메일을 입력해주세요"
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="message">메시지</FormLabel>
                <FormTextarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="문의 내용을 입력해주세요"
                  required
                />
              </FormGroup>

              <SubmitButton type="submit">
                메시지 보내기
              </SubmitButton>
            </FormContainer>
          </ContactForm>
        </ContactContent>
      </Container>
    </Section>
  );
};

export default Contact;
