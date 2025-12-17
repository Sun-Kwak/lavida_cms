import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styled from "styled-components";
import CmsPopup from "../../../components/CmsPopup";
import { CmsPopupBtnType } from "../../../components/CmsPopupBtn";
import { AppPwdTextField, PwdFieldType } from "../../../customComponents/AppPwdTextField";
import { AppColors } from "../../../styles/colors";

// 더미 API 함수
const updateAdmin = async (adminId: string, data: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    data: {
      statusCode: 200,
      message: "success"
    }
  };
};

interface PasswordPopupProps {
  adminId: string;
  isOpen: boolean;
  onClose: () => void;
  onPasswordChanged?: () => void; // 비밀번호 변경 성공 시 호출될 콜백
}

const PasswordPopup: React.FC<PasswordPopupProps> = ({ adminId, isOpen, onClose, onPasswordChanged }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [confirmPwdError, setConfirmPwdError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setConfirmPassword("");
      setPwdError(null);
      setConfirmPwdError(null);
    }
  }, [isOpen]);

  const validatePassword = (pwd: string) => {
    // 영문, 숫자, 특수문자 각각 1개 이상 포함, 8자 이상
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(pwd);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (newPassword) {
      if (!validatePassword(newPassword)) {
        setPwdError("비밀번호는 영문자, 숫자, 특수문자를 포함하여 8자리 이상이어야 합니다");
      } else {
        setPwdError(null);
      }
    } else {
      setPwdError(null);
    }

    // 비밀번호 확인 필드 검증 업데이트
    if (confirmPassword) {
      if (newPassword !== confirmPassword) {
        setConfirmPwdError("비밀번호가 일치하지 않습니다");
      } else {
        setConfirmPwdError(null);
      }
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);

    if (newConfirmPassword) {
      if (password !== newConfirmPassword) {
        setConfirmPwdError("비밀번호가 일치하지 않습니다");
      } else {
        setConfirmPwdError(null);
      }
    } else {
      setConfirmPwdError(null);
    }
  };

  const handleSubmit = async () => {
    let valid = true;

    if (!password || !validatePassword(password)) {
      setPwdError("비밀번호는 영문자, 숫자, 특수문자를 포함하여 8자리 이상이어야 합니다");
      valid = false;
    } else {
      setPwdError(null);
    }

    if (password !== confirmPassword) {
      setConfirmPwdError("비밀번호가 일치하지 않습니다");
      valid = false;
    } else {
      setConfirmPwdError(null);
    }

    if (!valid) return;

    try {
      await updateAdmin(adminId, {
        password: password,
      });

      toast.success("비밀번호가 성공적으로 변경되었습니다.");
      onClose();
      onPasswordChanged?.(); // 비밀번호 변경 성공 시 콜백 호출
    } catch (error) {
      console.error("비밀번호 변경 에러:", error);
      toast.error("비밀번호 변경 중 오류가 발생했습니다.");
    }
  };

  return (
    <CmsPopup 
      title="비밀번호 변경" 
      isOpen={isOpen} 
      onClose={onClose} 
      backgroundColor="#fff" 
      isWide={false}
      height={"300px"}
      showRequiredMark={true}
      rightButtons={[
          {
          label: '변경',
          onClick: handleSubmit,
          type: CmsPopupBtnType.PRIMARY,
        },
        {
          label: '취소',
          onClick: onClose,
          type: CmsPopupBtnType.SECONDARY,
        },
      
      ]}
    >
      <FormWrapper>
        <DescriptionText>
          새 비밀번호를 입력해 주세요. <br />
          계정 보안을 위해 정기적인 변경을 권장합니다.
        </DescriptionText>

        <AppPwdTextField
          value={password}
          onChange={handlePasswordChange}
          fieldType={PwdFieldType.PASSWORD}
          label="*새 비밀번호"
          errorMessage={pwdError ?? undefined}
          showValidationMessage={false}
        />

        <AppPwdTextField
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          fieldType={PwdFieldType.PASSWORD_CONFIRM}
          originalPassword={password}
          label="*새 비밀번호 확인"
          errorMessage={confirmPwdError ?? undefined}
          showValidationMessage={false}
        />
      </FormWrapper>
    </CmsPopup>
  );
};

export default PasswordPopup;

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0;
`;

const DescriptionText = styled.p`
  font-size: 16px;
  color: ${AppColors.onInput3};
  margin: 0;
  line-height: 1.5;
  text-align: left;
`;
