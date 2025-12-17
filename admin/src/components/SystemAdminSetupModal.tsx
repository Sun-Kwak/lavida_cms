import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';
import { AppTextField } from '../customComponents/AppTextField';
import { AppEmailTextField } from '../customComponents/AppEmailTextField';
import { AppPhoneTextField } from '../customComponents/AppPhoneTextField';
import PrimaryButton from './PrimaryButton';
import { dbManager } from '../utils/indexedDB';
import { SYSTEM_ADMIN_CONFIG } from '../constants/staffConstants';
import { isSystemInInitialState, markSystemInitialized } from '../utils/systemInit';

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const Content = styled.div`
  background: ${AppColors.surface};
  border-radius: 16px;
  padding: 32px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const Title = styled.h2`
  font-size: ${AppTextStyles.title2.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0 0 8px 0;
  text-align: center;
`;

const Description = styled.p`
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.onSurface};
  margin: 0 0 24px 0;
  text-align: center;
  line-height: 1.5;
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const SecondaryButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  background: ${AppColors.surface};
  color: ${AppColors.onSurface};
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${AppColors.background};
  }
`;

interface SystemAdminSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
}

const SystemAdminSetupModal: React.FC<SystemAdminSetupModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentData();
    }
  }, [isOpen]);

  const loadCurrentData = async () => {
    try {
      const systemAdmin = await dbManager.getStaffByLoginId(SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID);
      if (systemAdmin) {
        setFormData({
          name: systemAdmin.name,
          email: systemAdmin.email,
          phone: systemAdmin.phone
        });
      }
    } catch (error) {
      console.error('시스템 관리자 정보 로드 실패:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // 필수 필드 검증
    if (!formData.name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('이메일을 입력해주세요.');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('전화번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const systemAdmin = await dbManager.getStaffByLoginId(SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID);
      if (systemAdmin) {
        await dbManager.updateStaff(systemAdmin.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          updatedAt: new Date()
        });

        await markSystemInitialized();
        toast.success('시스템 관리자 정보가 업데이트되었습니다.');
        onComplete();
      }
    } catch (error) {
      console.error('정보 업데이트 실패:', error);
      toast.error('정보 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Container>
      <Content>
        <Title>🎉 시스템 관리자 정보 설정</Title>
        <Description>
          시스템이 처음 설정되었습니다.<br/>
          시스템 관리자의 기본 정보를 입력해주세요.
        </Description>

        <Form>
          <AppTextField
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            label="이름"
            placeholder="관리자 이름을 입력하세요"
          />

          <AppEmailTextField
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            label="이메일"
            placeholder="관리자 이메일을 입력하세요"
          />

          <AppPhoneTextField
            value={formData.phone}
            onChange={(value) => handleInputChange('phone', value)}
            label="전화번호"
            placeholder="전화번호를 입력하세요"
          />
        </Form>

        <ButtonGroup>
          <SecondaryButton onClick={handleSkip} disabled={loading}>
            나중에 설정
          </SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={loading}>
            {loading ? '저장 중...' : '정보 저장'}
          </PrimaryButton>
        </ButtonGroup>
      </Content>
    </Container>
  );
};

// 시스템 초기 설정 상태를 확인하고 모달을 표시하는 훅
export const useSystemSetupCheck = () => {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkSystemSetup();
  }, []);

  const checkSystemSetup = async () => {
    try {
      const isInitial = await isSystemInInitialState();
      setShowSetupModal(isInitial);
    } catch (error) {
      console.error('시스템 설정 상태 확인 실패:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSetupComplete = () => {
    setShowSetupModal(false);
  };

  const handleSetupSkip = () => {
    setShowSetupModal(false);
  };

  return {
    showSetupModal,
    isChecking,
    handleSetupComplete,
    handleSetupSkip,
    SystemAdminSetupModal: (props: Omit<SystemAdminSetupModalProps, 'isOpen' | 'onClose' | 'onComplete'>) => (
      <SystemAdminSetupModal
        {...props}
        isOpen={showSetupModal}
        onClose={handleSetupSkip}
        onComplete={handleSetupComplete}
      />
    )
  };
};

export default SystemAdminSetupModal;
