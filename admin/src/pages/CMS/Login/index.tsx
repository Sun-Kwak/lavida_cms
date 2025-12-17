import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { FormTitle } from '../../../customComponents/FormTitle';
import { AppIdTextField } from '../../../customComponents/AppIdTextField';
import { AppPwdTextField, PwdFieldType } from '../../../customComponents/AppPwdTextField';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import PrimaryButton from '../../../components/PrimaryButton';
import { dbManager } from '../../../utils/indexedDB';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${AppColors.background};
  padding: 20px;
`;

const LoginFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  max-width: 400px;
  gap: 24px;
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 16px;
`;

const Logo = styled.img`
  width: 200px;
  height: auto;
`;

const FormWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ButtonWrapper = styled.div`
  width: 100%;
  margin-top: 8px;
`;

const HelpText = styled.p`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onInput2};
  text-align: center;
  line-height: 1.5;
  margin: 0;
`;

const CMSLogin: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [idError, setIdError] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isLoggedIn, ready } = useAdminAuth();

  useEffect(() => {
    // Context가 완전히 초기화되고, 이미 로그인되어 있고, 현재 로그인 시도 중이 아닐 때만 리다이렉트
    if (ready && isLoggedIn && !isLoading) {
      console.log('이미 로그인되어 있음, CMS 페이지로 이동');
      navigate('/cms/member/search');
    }
  }, [ready, isLoggedIn, isLoading, navigate]);

  const handleLogin = async () => {
    if (isLoading) return; // 이미 로딩 중이면 중복 실행 방지

    setIdError(null);
    setPwdError(null);

    let hasError = false;

    if (!userId) {
      setIdError("아이디를 입력해주세요.");
      hasError = true;
    }

    if (!password) {
      setPwdError("비밀번호를 입력해주세요.");
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      // 데이터베이스에서 직원 정보 조회
      const staff = await dbManager.getStaffByLoginId(userId);
      
      if (!staff) {
        toast.error("존재하지 않는 계정입니다.", {
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
        setIsLoading(false);
        return;
      }

      // 비밀번호 확인
      if (staff.password !== password) {
        toast.error("비밀번호가 일치하지 않습니다.", {
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
        setIsLoading(false);
        return;
      }

      // 계정 활성 상태 확인
      if (!staff.isActive) {
        toast.error("비활성화된 계정입니다. 관리자에게 문의하세요.", {
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
        setIsLoading(false);
        return;
      }

      // 권한 확인 (MASTER, EDITOR, VIEWER 모두 로그인 허용)
      if (!['MASTER', 'EDITOR', 'VIEWER'].includes(staff.permission)) {
        toast.error("CMS 접근 권한이 없습니다.", {
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
        setIsLoading(false);
        return;
      }

      // 로그인 성공
      const accessToken = `staff_${staff.id}_${Date.now()}`;
      login(userId, accessToken);
      toast.success("로그인되었습니다.");
      navigate('/cms/member/search');

    } catch (error) {
      console.error('로그인 처리 중 오류:', error);
      toast.error("로그인 처리 중 오류가 발생했습니다.", {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Container className="cms-layout">
      <LoginFormContainer>
        <LogoContainer>
          <Logo src={`${process.env.PUBLIC_URL}/logo.png`} alt="Lavida Logo" />
        </LogoContainer>
        
        <FormTitle>로그인</FormTitle>
        
        <FormWrapper onKeyDown={handleKeyPress}>
          <div>
            <AppIdTextField
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              showValidationMessage={false}
              errorMessage={idError || undefined}
            />
          </div>
          
          <div>
            <AppPwdTextField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fieldType={PwdFieldType.PASSWORD}
              showValidationMessage={false}
              errorMessage={pwdError || undefined}
            />
          </div>
        </FormWrapper>
        
        <ButtonWrapper>
          <PrimaryButton
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </PrimaryButton>
        </ButtonWrapper>
        
        <HelpText>
          시스템 계정이 없다면, 관리자에게 문의 바랍니다.
        </HelpText>
      </LoginFormContainer>
    </Container>
  );
};

export default CMSLogin;
