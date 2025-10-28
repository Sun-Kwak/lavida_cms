import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import CustomDropdown from '../../../components/CustomDropdown';
import CustomDateInput from '../../../components/CustomDateInput';
import { StaffFileUploadField } from '../../../components/StaffFormComponents';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, type Branch } from '../../../utils/indexedDB';
import { POSITIONS, ROLES, EMPLOYMENT_TYPES, PERMISSIONS, SYSTEM_ADMIN_CONFIG } from '../../../constants/staffConstants';

const Label = styled.label<{ $required?: boolean }>`
  font-size: ${AppTextStyles.label1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  
  ${({ $required }) => $required && `
    &::after {
      content: ' *';
      color: ${AppColors.error};
    }
  `}
`;

const Input = styled.input<{ $error?: boolean }>`
  width: 100%;
  min-width: 0;
  padding: 12px;
  border: 1px solid ${({ $error }) => $error ? AppColors.error : AppColors.borderLight};
  border-radius: 8px;
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.onSurface};
  background-color: ${AppColors.input};
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
  }
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const PasswordToggleIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: ${AppColors.onInput1};
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${AppColors.primary};
  }
`;

const PageContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: ${AppTextStyles.title1.fontSize};
  font-weight: 700;
  color: ${AppColors.onBackground};
  margin: 0 0 8px 0;
`;

const PageDescription = styled.p`
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.onInput1};
  margin: 0;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: ${AppColors.surface};
  border-radius: 12px;
  border: 1px solid ${AppColors.borderLight};
`;

const SectionTitle = styled.h2`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0;
`;

const FieldRow = styled.div`
  display: flex;
  gap: 16px;
`;

const FieldColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: ${AppTextStyles.label1.fontSize};
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ variant = 'primary' }) => variant === 'primary' ? `
    background-color: ${AppColors.primary};
    color: ${AppColors.onPrimary};
    
    &:hover {
      background-color: ${AppColors.buttonPrimaryHover};
    }
  ` : `
    background-color: ${AppColors.surface};
    color: ${AppColors.onSurface};
    border: 1px solid ${AppColors.borderLight};
    
    &:hover {
      background-color: ${AppColors.btnC};
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 타입 정의
interface StaffFormData {
  name: string;
  loginId: string;
  password: string;
  phone: string;
  email: string;
  branchId: string;
  position: string;
  role: string;
  employmentType: string;
  permission: string;
  program: string; // 담당프로그램 필드 추가
  contractStartDate: string;
  contractEndDate: string;
  contractFile: File | null;
}

interface FormErrors {
  [key: string]: string;
}

const StaffRegister: React.FC = () => {
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    loginId: '',
    password: '',
    phone: '',
    email: '',
    branchId: '',
    position: '',
    role: '',
    employmentType: '',
    permission: '',
    program: '',
    contractStartDate: '',
    contractEndDate: '',
    contractFile: null
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [programs, setPrograms] = useState<any[]>([]); // 프로그램 목록 상태 추가
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null); // 현재 로그인한 사용자 정보
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchList = await dbManager.getAllBranches();
        setBranches(branchList);
      } catch (error) {
        console.error('지점 목록 로드 실패:', error);
      }
    };

    const fetchPrograms = async () => {
      try {
        const programList = await dbManager.getAllPrograms();
        // 활성화된 프로그램만 필터링
        const activePrograms = programList.filter(program => program.isActive);
        setPrograms(activePrograms);
      } catch (error) {
        console.error('프로그램 목록 로드 실패:', error);
      }
    };

    const getCurrentUser = async () => {
      const adminId = sessionStorage.getItem('adminId');
      setCurrentUserId(adminId);
      
      if (adminId) {
        try {
          // 현재 로그인한 사용자 정보 가져오기
          const allStaff = await dbManager.getAllStaff();
          const currentUser = allStaff.find(staff => staff.loginId === adminId);
          setCurrentUserInfo(currentUser || null);
          
          // EDITOR 권한이면 지점을 자동으로 설정
          if (currentUser && currentUser.permission === 'EDITOR') {
            setFormData(prev => ({
              ...prev,
              branchId: currentUser.branchId
            }));
          }
        } catch (error) {
          console.error('현재 사용자 정보 로드 실패:', error);
        }
      }
    };

    fetchBranches();
    fetchPrograms();
    getCurrentUser();
  }, []);

  // 현재 사용자 권한 확인
  const checkUserPermission = useCallback(() => {
    if (currentUserInfo && currentUserInfo.permission === 'VIEWER') {
      alert('접근 권한이 없습니다. VIEWER 권한은 조회만 가능합니다.');
      // StaffSearch 페이지로 리다이렉트
      window.location.href = '/cms/staff/search';
      return false;
    }
    return true;
  }, [currentUserInfo]);

  // 컴포넌트 마운트 시 권한 체크
  useEffect(() => {
    if (currentUserInfo) {
      checkUserPermission();
    }
  }, [currentUserInfo, checkUserPermission]);

  const handleInputChange = (field: keyof StaffFormData, value: string | File | null) => {
    // 전화번호 필드인 경우 자동 포맷팅 적용
    if (field === 'phone' && typeof value === 'string') {
      value = formatPhoneNumber(value);
    }

    // 파일 업로드 필드인 경우 검증 수행
    if (field === 'contractFile' && value instanceof File) {
      // 파일 타입 검증 (이미지 또는 PDF만 허용)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(value.type)) {
        setErrors(prev => ({ ...prev, contractFile: '이미지(JPG, PNG) 또는 PDF 파일만 업로드 가능합니다.' }));
        return;
      }
      
      // 파일 크기 검증 (10MB 제한)
      if (value.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, contractFile: '파일 크기는 10MB 이하여야 합니다.' }));
        return;
      }
    }

    // 직책이 변경되고 코치가 아닌 경우 담당프로그램 초기화
    if (field === 'role' && typeof value === 'string' && value !== '코치') {
      setFormData(prev => ({
        ...prev,
        role: value as string,
        program: ''
      }));
    } 
    // 고용형태가 정규직으로 변경되면 계약종료일 초기화
    else if (field === 'employmentType' && typeof value === 'string' && value === '정규직') {
      setFormData(prev => ({
        ...prev,
        employmentType: value as string,
        contractEndDate: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }) as StaffFormData);
    }

    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 전화번호 자동 포맷팅 함수
  const formatPhoneNumber = (inputValue: string): string => {
    // 숫자만 추출
    const numbers = inputValue.replace(/[^\d]/g, '');
    
    // 11자리를 초과하면 잘라내기
    const truncated = numbers.slice(0, 11);
    
    // 자동 하이픈 추가
    if (truncated.length <= 3) {
      return truncated;
    } else if (truncated.length <= 7) {
      return `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
    } else {
      return `${truncated.slice(0, 3)}-${truncated.slice(3, 7)}-${truncated.slice(7)}`;
    }
  };

  // 비밀번호 토글 함수
  const handlePasswordToggle = () => {
    setIsPasswordVisible(prev => !prev);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 필수 필드 검증
    if (!formData.name.trim()) newErrors.name = '이름은 필수입니다.';
    if (!formData.loginId.trim()) newErrors.loginId = '로그인 ID는 필수입니다.';
    if (!formData.password.trim()) newErrors.password = '비밀번호는 필수입니다.';
    if (!formData.phone.trim()) newErrors.phone = '연락처는 필수입니다.';
    if (!formData.email.trim()) newErrors.email = '이메일은 필수입니다.';
    if (!formData.branchId) newErrors.branchId = '지점은 필수입니다.';
    if (!formData.position) newErrors.position = '직급은 필수입니다.';
    if (!formData.role) newErrors.role = '직책은 필수입니다.';
    if (!formData.employmentType) newErrors.employmentType = '고용형태는 필수입니다.';
    if (!formData.permission) newErrors.permission = '권한은 필수입니다.';
    if (!formData.contractStartDate) newErrors.contractStartDate = '계약시작일은 필수입니다.';
    
    // 정규직이 아닌 경우에만 계약종료일 필수
    if (formData.employmentType !== '정규직' && !formData.contractEndDate) {
      newErrors.contractEndDate = '계약종료일은 필수입니다.';
    }
    
    // 코치일 경우 담당프로그램 필수
    if (formData.role === '코치' && !formData.program) {
      newErrors.program = '코치는 담당프로그램 선택이 필수입니다.';
    }

    // 로그인 ID 형식 검증 (영문, 숫자만 허용, 4-20자)
    if (formData.loginId && !/^[a-zA-Z0-9]{4,20}$/.test(formData.loginId)) {
      newErrors.loginId = '로그인 ID는 영문, 숫자 4-20자로 입력해주세요.';
    }

    // 비밀번호 형식 검증 (8자 이상, 영문+숫자+특수문자 조합)
    if (formData.password && !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) {
      newErrors.password = '비밀번호는 8자 이상, 영문+숫자+특수문자 조합이어야 합니다.';
    }

    // 전화번호 형식 검증 (010-1234-5678 형태)
    if (formData.phone && !/^010-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다. (010-1234-5678)';
    }

    // 이메일 형식 검증
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    // 날짜 검증 (정규직이 아닌 경우에만)
    if (formData.employmentType !== '정규직' && formData.contractStartDate && formData.contractEndDate) {
      const startDate = new Date(formData.contractStartDate);
      const endDate = new Date(formData.contractEndDate);
      
      if (startDate >= endDate) {
        newErrors.contractEndDate = '계약종료일은 계약시작일보다 늦어야 합니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 중복 체크 수행
      const duplicateCheck = await dbManager.checkDuplicateStaff(
        formData.loginId.trim(),
        formData.email.trim(),
        formData.phone.trim()
      );

      if (duplicateCheck.isDuplicate) {
        toast.error(duplicateCheck.message || '중복된 정보가 있습니다.');
        setIsSubmitting(false);
        return;
      }

      const staffData = {
        ...formData,
        id: Date.now().toString(),
        registrationDate: new Date().toISOString().split('T')[0],
        contractStartDate: new Date(formData.contractStartDate),
        contractEndDate: formData.employmentType === '정규직' ? null : new Date(formData.contractEndDate),
        isActive: true // 신규 등록 직원은 기본적으로 활성 상태
      };

      await dbManager.addStaff(staffData);
      
      // 성공 시 폼 초기화
      setFormData({
        name: '',
        loginId: '',
        password: '',
        phone: '',
        email: '',
        branchId: '',
        position: '',
        role: '',
        employmentType: '',
        permission: '',
        program: '',
        contractStartDate: '',
        contractEndDate: '',
        contractFile: null
      });
      
      toast.success('직원이 성공적으로 등록되었습니다.');
    } catch (error) {
      console.error('직원 등록 실패:', error);
      toast.error('직원 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      loginId: '',
      password: '',
      phone: '',
      email: '',
      branchId: '',
      position: '',
      role: '',
      employmentType: '',
      permission: '',
      program: '',
      contractStartDate: '',
      contractEndDate: '',
      contractFile: null
    });
    setErrors({});
  };

  // 옵션 생성 함수들
  const getBranchOptions = () => {
    // 시스템관리자(master01)가 아닌 경우 '전체' 지점 제외
    const isSystemAdmin = currentUserId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
    
    let filteredBranches = isSystemAdmin 
      ? branches 
      : branches.filter(branch => branch.name !== '전체');
    
    // EDITOR 권한이면 본인 지점만 표시
    if (currentUserInfo && currentUserInfo.permission === 'EDITOR') {
      filteredBranches = branches.filter(branch => branch.id === currentUserInfo.branchId);
    }
    
    return filteredBranches.map(branch => ({
      value: branch.id,
      label: branch.name
    }));
  };

  const getPositionOptions = () => {
    return POSITIONS.map(position => ({
      value: position,
      label: position
    }));
  };

  const getRoleOptions = () => {
    return ROLES.map(role => ({
      value: role,
      label: role
    }));
  };

  const getEmploymentTypeOptions = () => {
    return EMPLOYMENT_TYPES.map(type => ({
      value: type,
      label: type
    }));
  };

  const getPermissionOptions = () => {
    // 시스템 관리자인지 확인
    const isSystemAdmin = currentUserId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
    
    // 시스템 관리자가 아닌 경우 MASTER 권한 제외
    const availablePermissions = isSystemAdmin 
      ? PERMISSIONS 
      : PERMISSIONS.filter(permission => permission.value !== 'MASTER');
    
    return availablePermissions.map(permission => ({
      value: permission.value,
      label: permission.label
    }));
  };

  const getProgramOptions = () => {
    return programs.map(program => ({
      value: program.name,
      label: program.name
    }));
  };

  // 날짜 제한 함수들
  const getContractStartDateMax = () => {
    if (formData.contractEndDate) {
      const endDate = new Date(formData.contractEndDate);
      endDate.setDate(endDate.getDate() - 1);
      return endDate.toISOString().split('T')[0];
    }
    return '';
  };

  const getContractEndDateMin = () => {
    if (formData.contractStartDate) {
      const startDate = new Date(formData.contractStartDate);
      startDate.setDate(startDate.getDate() + 1);
      return startDate.toISOString().split('T')[0];
    }
    return '';
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>직원 등록</PageTitle>
        <PageDescription>새로운 직원 정보를 등록합니다.</PageDescription>
      </PageHeader>

        <FormContainer>
          {/* 기본 정보 섹션 */}
          <FormSection>
            <SectionTitle>기본 정보</SectionTitle>
            
            {/* 이름 - 전체 너비 */}
            <FieldRow>
              <FieldColumn>
                <Label $required>이름</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="이름을 입력하세요"
                  $error={!!errors.name}
                />
                {errors.name && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.name}</div>}
              </FieldColumn>
            </FieldRow>

            {/* 로그인ID, 비밀번호 */}
            <FieldRow>
              <FieldColumn>
                <Label $required>로그인 ID</Label>
                <Input
                  type="text"
                  value={formData.loginId}
                  onChange={(e) => handleInputChange('loginId', e.target.value)}
                  placeholder="영문, 숫자 4-20자"
                  $error={!!errors.loginId}
                />
                {errors.loginId && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.loginId}</div>}
              </FieldColumn>

              <FieldColumn>
                <Label $required>비밀번호</Label>
                <PasswordInputWrapper>
                  <Input
                    type={isPasswordVisible ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="영문+숫자+특수문자 8자 이상"
                    $error={!!errors.password}
                    style={{ paddingRight: '40px' }}
                  />
                  <PasswordToggleIcon onClick={handlePasswordToggle}>
                    {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                  </PasswordToggleIcon>
                </PasswordInputWrapper>
                {errors.password && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.password}</div>}
              </FieldColumn>
            </FieldRow>

            {/* 이메일, 연락처 */}
            <FieldRow>
              <FieldColumn>
                <Label $required>이메일</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@email.com"
                  $error={!!errors.email}
                />
                {errors.email && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.email}</div>}
              </FieldColumn>

              <FieldColumn>
                <Label $required>연락처</Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="010-1234-5678"
                  $error={!!errors.phone}
                  maxLength={13}
                  autoComplete="tel"
                />
                {errors.phone && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.phone}</div>}
              </FieldColumn>
            </FieldRow>
          </FormSection>

          {/* 조직 정보 섹션 */}
          <FormSection>
            <SectionTitle>조직 정보</SectionTitle>
            
            {/* 지점, 권한 */}
            <FieldRow>
              <FieldColumn>
                <Label $required>지점</Label>
                <CustomDropdown
                  value={formData.branchId}
                  onChange={(value: string) => handleInputChange('branchId', value)}
                  options={getBranchOptions()}
                  placeholder="지점을 선택하세요"
                  error={!!errors.branchId}
                  disabled={currentUserInfo && currentUserInfo.permission === 'EDITOR'} // EDITOR 권한일 때 비활성화
                  required
                />
                {currentUserInfo && currentUserInfo.permission === 'EDITOR' && (
                  <div style={{ 
                    color: AppColors.onInput1, 
                    fontSize: AppTextStyles.label3.fontSize, 
                    marginTop: '4px' 
                  }}>
                    ℹ️ EDITOR 권한은 소속 지점에서만 직원을 등록할 수 있습니다.
                  </div>
                )}
                {errors.branchId && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.branchId}</div>}
              </FieldColumn>

              <FieldColumn>
                <Label $required>권한</Label>
                <CustomDropdown
                  value={formData.permission}
                  onChange={(value: string) => handleInputChange('permission', value)}
                  options={getPermissionOptions()}
                  placeholder="권한을 선택하세요"
                  error={!!errors.permission}
                  required
                />
                {!currentUserId || currentUserId !== SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID ? (
                  <div style={{ 
                    color: AppColors.onInput1, 
                    fontSize: AppTextStyles.label3.fontSize, 
                    marginTop: '4px' 
                  }}>
                    ℹ️ MASTER 권한은 시스템 관리자만 부여할 수 있습니다.
                  </div>
                ) : null}
                {errors.permission && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.permission}</div>}
              </FieldColumn>
            </FieldRow>

            {/* 직급, 직책 */}
            <FieldRow>
              <FieldColumn>
                <Label $required>직급</Label>
                <CustomDropdown
                  value={formData.position}
                  onChange={(value: string) => handleInputChange('position', value)}
                  options={getPositionOptions()}
                  placeholder="직급을 선택하세요"
                  error={!!errors.position}
                  required
                />
                {errors.position && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.position}</div>}
              </FieldColumn>

              <FieldColumn>
                <Label $required>직책</Label>
                <CustomDropdown
                  value={formData.role}
                  onChange={(value: string) => handleInputChange('role', value)}
                  options={getRoleOptions()}
                  placeholder="직책을 선택하세요"
                  error={!!errors.role}
                  required
                />
                {errors.role && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.role}</div>}
              </FieldColumn>
            </FieldRow>

            {/* 고용형태, 담당프로그램 */}
            <FieldRow>
              <FieldColumn>
                <Label $required>고용형태</Label>
                <CustomDropdown
                  value={formData.employmentType}
                  onChange={(value: string) => handleInputChange('employmentType', value)}
                  options={getEmploymentTypeOptions()}
                  placeholder="고용형태를 선택하세요"
                  error={!!errors.employmentType}
                  required
                />
                {errors.employmentType && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.employmentType}</div>}
              </FieldColumn>

              <FieldColumn>
                <Label>담당프로그램</Label>
                <CustomDropdown
                  value={formData.program}
                  onChange={(value: string) => handleInputChange('program', value)}
                  options={getProgramOptions()}
                  placeholder={formData.role === '코치' ? "담당프로그램을 선택하세요" : "코치만 선택 가능"}
                  error={!!errors.program}
                  disabled={formData.role !== '코치'}
                />
                {errors.program && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.program}</div>}
              </FieldColumn>
            </FieldRow>
          </FormSection>

          {/* 계약 정보 섹션 */}
          <FormSection>
            <SectionTitle>계약 정보</SectionTitle>
            
            <FieldRow>
              <FieldColumn>
                <Label $required>계약시작일</Label>
                <CustomDateInput
                  value={formData.contractStartDate}
                  onChange={(value: string) => handleInputChange('contractStartDate', value)}
                  placeholder="계약시작일을 선택하세요"
                  error={!!errors.contractStartDate}
                  max={getContractStartDateMax()}
                  required
                />
                {errors.contractStartDate && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.contractStartDate}</div>}
              </FieldColumn>

              <FieldColumn>
                <Label $required={formData.employmentType !== '정규직'}>계약종료일</Label>
                <CustomDateInput
                  value={formData.contractEndDate}
                  onChange={(value: string) => handleInputChange('contractEndDate', value)}
                  placeholder={formData.employmentType === '정규직' ? "정규직은 입력 불필요" : "계약종료일을 선택하세요"}
                  error={!!errors.contractEndDate}
                  min={getContractEndDateMin()}
                  disabled={formData.employmentType === '정규직'}
                  required={formData.employmentType !== '정규직'}
                />
                {errors.contractEndDate && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.contractEndDate}</div>}
              </FieldColumn>
            </FieldRow>

            <FieldRow>
              <FieldColumn>
                <StaffFileUploadField
                  label="계약서 파일"
                  value={formData.contractFile || null}
                  onChange={(file) => handleInputChange('contractFile', file)}
                  placeholder="이미지 또는 PDF 파일 선택 (최대 10MB)"
                  errorMessage={errors.contractFile}
                  fullWidth
                />
              </FieldColumn>
            </FieldRow>
          </FormSection>
        </FormContainer>

        <ButtonContainer>
          <Button variant="secondary" onClick={handleReset}>
            초기화
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '등록 중...' : '등록'}
          </Button>
        </ButtonContainer>
      </PageContainer>
    );
  };

export default StaffRegister;
