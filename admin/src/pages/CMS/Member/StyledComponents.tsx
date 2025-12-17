import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';

// 컨테이너 스타일
export const PageContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

export const PageHeader = styled.div`
  margin-bottom: 24px;
`;

export const PageTitle = styled.h1`
  font-size: ${AppTextStyles.title1.fontSize};
  font-weight: 700;
  color: ${AppColors.onBackground};
  margin: 0 0 8px 0;
`;

export const PageDescription = styled.p`
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.onInput1};
  margin: 0;
`;

// 단계 진행 표시 컴포넌트
export const StepContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
`;

export const StepWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 600px;
`;

export const StepItem = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
`;

export const StepCircle = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  background: ${props => 
    props.$completed ? AppColors.primary : 
    props.$active ? AppColors.primary : AppColors.borderLight
  };
  color: ${props => 
    props.$completed ? AppColors.onPrimary : 
    props.$active ? AppColors.onPrimary : AppColors.onInput1
  };
  margin-bottom: 8px;
`;

export const StepLabel = styled.span<{ $active: boolean; $completed: boolean }>`
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${props => 
    props.$completed ? AppColors.primary : 
    props.$active ? AppColors.primary : AppColors.onInput1
  };
  text-align: center;
`;

export const StepLine = styled.div<{ $completed: boolean }>`
  position: absolute;
  top: 20px;
  left: 50%;
  right: -50%;
  height: 2px;
  background: ${props => props.$completed ? AppColors.primary : AppColors.borderLight};
  z-index: -1;
`;

// 카드 및 콘텐츠 스타일
export const Card = styled.div`
  background: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  min-height: 400px;
`;

export const StepContent = styled.div`
  margin-bottom: 24px;
`;

export const StepTitle = styled.h2`
  font-size: ${AppTextStyles.title2.fontSize};
  font-weight: 600;
  color: ${AppColors.onBackground};
  margin: 0 0 16px 0;
`;

// 폼 스타일
export const FormGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const FormField = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  grid-column: ${props => props.$fullWidth ? '1 / -1' : 'auto'};
`;

export const Label = styled.label`
  font-size: ${AppTextStyles.label1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
`;

export const Input = styled.input`
  height: 48px;
  padding: 0 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 12px;
  font-size: ${AppTextStyles.body1.fontSize};
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: ${AppColors.primary};
    box-shadow: 0 0 0 3px rgba(55, 187, 214, 0.1);
  }
  
  &:hover {
    border-color: ${AppColors.primary};
    box-shadow: 0 2px 8px rgba(55, 187, 214, 0.1);
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
  }
`;

export const Select = styled.select`
  padding: 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  font-size: ${AppTextStyles.body1.fontSize};
  outline: none;
  background-color: ${AppColors.surface};
  
  &:focus {
    border-color: ${AppColors.primary};
  }
`;

export const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${AppTextStyles.body2.fontSize};
  cursor: pointer;
`;

export const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  accent-color: ${AppColors.primary};
`;

// 버튼 스타일
export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-top: 24px;
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'outline' }>`
  padding: 12px 24px;
  border: ${props => 
    props.variant === 'secondary' ? `1px solid ${AppColors.borderLight}` :
    props.variant === 'outline' ? `1px solid ${AppColors.primary}` : 'none'
  };
  border-radius: 8px;
  background: ${props => 
    props.variant === 'secondary' ? AppColors.surface : 
    props.variant === 'outline' ? AppColors.surface : AppColors.primary
  };
  color: ${props => 
    props.variant === 'secondary' ? AppColors.onSurface : 
    props.variant === 'outline' ? AppColors.primary : AppColors.onPrimary
  };
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 결제 정보 관련 스타일
export const ProductItem = styled.div`
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ProductInfo = styled.div`
  flex: 1;
`;

export const ProductName = styled.div`
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin-bottom: 4px;
`;

export const ProductPrice = styled.div`
  color: ${AppColors.primary};
  font-weight: 600;
`;

export const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${AppColors.error};
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
`;

export const SkipMessage = styled.div`
  text-align: center;
  padding: 32px;
  color: ${AppColors.onInput1};
  font-size: ${AppTextStyles.body1.fontSize};
`;

// 동의서 관련 스타일
export const AgreementSection = styled.div`
  margin-bottom: 24px;
`;

export const AgreementItem = styled.div`
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  margin-bottom: 16px;
`;

export const AgreementHeader = styled.div`
  padding: 16px;
  background: ${AppColors.btnC};
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const AgreementTitle = styled.span`
  font-weight: 600;
  color: ${AppColors.onSurface};
`;

export const AgreementContent = styled.div`
  padding: 16px;
  max-height: 150px;
  overflow-y: auto;
  font-size: ${AppTextStyles.body2.fontSize};
  line-height: 1.5;
  color: ${AppColors.onInput1};
`;

export const SignatureSection = styled.div`
  margin-top: 32px;
  padding: 24px;
  background: ${AppColors.btnC};
  border-radius: 8px;
`;

export const SignatureRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 16px;
`;

export const SignatureBox = styled.div`
  text-align: center;
`;

export const SignatureArea = styled.div`
  border: 2px dashed ${AppColors.borderLight};
  border-radius: 8px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: ${AppColors.onInput1};
  cursor: pointer;
  
  &:hover {
    border-color: ${AppColors.primary};
  }
`;
