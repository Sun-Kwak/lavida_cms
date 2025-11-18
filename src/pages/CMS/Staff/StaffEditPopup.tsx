import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from '../../../components/Modal';
import CustomDropdown from '../../../components/CustomDropdown';
import CustomDateInput from '../../../components/CustomDateInput';
import { StaffFileUploadField } from '../../../components/StaffFormComponents';
import { AppPwdTextField, PwdFieldType } from '../../../customComponents/AppPwdTextField';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, type Staff, type Branch } from '../../../utils/indexedDB';
import { POSITIONS, ROLES, EMPLOYMENT_TYPES, PERMISSIONS, SYSTEM_ADMIN_CONFIG, WORK_SHIFTS } from '../../../constants/staffConstants';

const FormContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  text-align: left; // 모달 기본 center 정렬 재정의
  
  /* 스크롤바 숨김 - Webkit 브라우저 (Chrome, Safari, Edge) */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* 스크롤바 숨김 - Firefox */
  scrollbar-width: none;
  
  /* 스크롤바 숨김 - IE/Edge Legacy */
  -ms-overflow-style: none;
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

const SectionTitle = styled.h3`
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

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: space-between;
  width: 100%;
  align-items: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
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
  ` : variant === 'danger' ? `
    background-color: ${AppColors.error};
    color: ${AppColors.onPrimary};
    
    &:hover {
      opacity: 0.9;
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

interface StaffEditPopupProps {
  isOpen: boolean;
  staff: Staff | null;
  onClose: () => void;
  onUpdate: () => void; // 업데이트 후 부모 컴포넌트에서 데이터 새로고침
}

interface StaffFormData {
  name: string;
  loginId: string;
  phone: string;
  email: string;
  branchId: string;
  position: string;
  role: string;
  employmentType: string;
  permission: string;
  program: string; // 담당프로그램 필드 추가
  workShift: string; // 근무 시간대 필드 추가 (횟수제 프로그램 전용)
  contractStartDate: string;
  contractEndDate: string;
  contractFile: File | null;
  isActive: boolean; // 활성/비활성 상태
}

const StaffEditPopup: React.FC<StaffEditPopupProps> = ({
  isOpen,
  staff,
  onClose,
  onUpdate
}) => {
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    loginId: '',
    phone: '',
    email: '',
    branchId: '',
    position: '',
    role: '',
    employmentType: '',
    permission: '',
    program: '',
    workShift: '',
    contractStartDate: '',
    contractEndDate: '',
    contractFile: null,
    isActive: true
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [programs, setPrograms] = useState<any[]>([]); // 프로그램 목록 상태 추가
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null); // 현재 로그인한 사용자 정보

  // 시스템 관리자인지 확인하는 함수
  const isSystemAdmin = (staff: Staff | null): boolean => {
    return staff?.loginId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
  };

  // 현재 사용자가 VIEWER 권한인지 확인
  const isViewer = (): boolean => {
    return currentUserInfo?.permission === 'VIEWER';
  };

  // 현재 사용자가 EDITOR 권한이면서 다른 지점 직원을 보고 있는지 확인
  const isEditorViewingOtherBranch = (targetStaff: Staff | null): boolean => {
    if (!currentUserInfo || !targetStaff) return false;
    return currentUserInfo.permission === 'EDITOR' && 
           currentUserInfo.branchId !== targetStaff.branchId;
  };

  // EDITOR 권한이 MASTER 권한 직원의 권한을 수정하려는지 확인
  const isEditorTryingToEditMasterPermission = (targetStaff: Staff | null): boolean => {
    if (!currentUserInfo || !targetStaff) return false;
    return currentUserInfo.permission === 'EDITOR' && 
           targetStaff.permission === 'MASTER';
  };

  // 직원 데이터가 변경될 때 폼 데이터 초기화
  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        loginId: staff.loginId,
        phone: staff.phone,
        email: staff.email,
        branchId: staff.branchId,
        position: staff.position,
        role: staff.role,
        employmentType: staff.employmentType,
        permission: staff.permission,
        program: (staff as any).program || '', // 담당프로그램 필드 추가
        workShift: (staff as any).workShift || '', // 근무시간대 필드 추가
        contractStartDate: staff.contractStartDate ? formatDateForInput(staff.contractStartDate) : '',
        contractEndDate: staff.contractEndDate ? formatDateForInput(staff.contractEndDate) : '',
        contractFile: null,
        isActive: staff.isActive !== undefined ? staff.isActive : true, // 기본값 true
      });
    }
  }, [staff]);

  // 지점 데이터 로드
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const branchData = await dbManager.getAllBranches();
        setBranches(branchData);
      } catch (error) {
        console.error('지점 데이터 로드 실패:', error);
      }
    };

    const loadPrograms = async () => {
      try {
        const programData = await dbManager.getAllPrograms();
        // 활성화된 프로그램만 필터링
        const activePrograms = programData.filter(program => program.isActive);
        setPrograms(activePrograms);
      } catch (error) {
        console.error('프로그램 데이터 로드 실패:', error);
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
        } catch (error) {
          console.error('현재 사용자 정보 로드 실패:', error);
        }
      }
    };

    if (isOpen) {
      loadBranches();
      loadPrograms();
      getCurrentUser();
    }
  }, [isOpen]);

  // 드롭다운 옵션 변환 함수들
  const getBranchOptions = () => {
    // 시스템관리자(master01)가 아닌 경우 '전체' 지점 제외
    const isCurrentUserSystemAdmin = currentUserId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
    
    const filteredBranches = isCurrentUserSystemAdmin 
      ? branches 
      : branches.filter(branch => branch.name !== '전체');
    
    return filteredBranches.map(branch => ({
      value: branch.id,
      label: branch.name,
      description: branch.address
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
    return PERMISSIONS.map(permission => ({
      value: permission.value,
      label: permission.label,
      description: permission.description
    }));
  };

  const getProgramOptions = () => {
    return programs.map(program => ({
      value: program.name,
      label: program.name
    }));
  };

  const getWorkShiftOptions = () => {
    return WORK_SHIFTS.map(shift => ({
      value: shift,
      label: shift
    }));
  };

  // 날짜 범위 계산 함수들
  const getContractStartDateMax = (): string | undefined => {
    if (formData.contractEndDate) {
      try {
        const endDate = new Date(formData.contractEndDate);
        if (isNaN(endDate.getTime())) return undefined;
        
        endDate.setDate(endDate.getDate() - 1);
        return endDate.toISOString().split('T')[0];
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const getContractEndDateMin = (): string | undefined => {
    if (formData.contractStartDate) {
      try {
        const startDate = new Date(formData.contractStartDate);
        if (isNaN(startDate.getTime())) return undefined;
        
        startDate.setDate(startDate.getDate() + 1);
        return startDate.toISOString().split('T')[0];
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = '전화번호를 입력해주세요.';
    } else if (!/^010-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다. (010-1234-5678)';
    }

    if (!formData.email?.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!formData.branchId) {
      newErrors.branchId = '지점을 선택해주세요.';
    }

    if (!formData.position?.trim()) {
      newErrors.position = '직급을 입력해주세요.';
    }

    if (!formData.role?.trim()) {
      newErrors.role = '직책을 입력해주세요.';
    }

    if (!formData.employmentType) {
      newErrors.employmentType = '고용형태를 선택해주세요.';
    }

    if (!formData.permission) {
      newErrors.permission = '권한을 선택해주세요.';
    }

    if (!formData.contractStartDate) {
      newErrors.contractStartDate = '계약 시작일을 선택해주세요.';
    }
    
    // 횟수제 프로그램 선택 시 근무시간대 필수
    if (formData.program) {
      const selectedProgram = programs.find(program => program.name === formData.program);
      if (selectedProgram && selectedProgram.type === '횟수제' && !formData.workShift) {
        newErrors.workShift = '횟수제 프로그램은 근무시간대 선택이 필수입니다.';
      }
    }

    // 날짜 검증
    if (formData.contractStartDate && formData.contractEndDate) {
      if (new Date(formData.contractStartDate) >= new Date(formData.contractEndDate)) {
        newErrors.contractEndDate = '계약 종료일은 시작일보다 늦어야 합니다.';
      }
    }

    setErrors(newErrors);
    
    // validation 에러가 있으면 토스트 메시지로 표시
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof StaffFormData,
    value: string | File | null
  ) => {
    // 전화번호 필드인 경우 자동 포맷팅 적용
    if (field === 'phone' && typeof value === 'string') {
      value = formatPhoneNumber(value);
    }
    
    // 이메일 필드인 경우 한글 입력 방지
    if (field === 'email' && typeof value === 'string') {
      const koreanPattern = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
      if (koreanPattern.test(value)) {
        toast.error('이메일에는 한글을 입력할 수 없습니다.');
        return;
      }
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

    // 담당프로그램이 변경된 경우 근무시간대 처리
    if (field === 'program' && typeof value === 'string') {
      // 선택된 프로그램의 타입을 찾아서 횟수제인지 확인
      const selectedProgram = programs.find(program => program.name === value);
      // 횟수제 프로그램이 아닌 경우 근무시간대 초기화
      if (!selectedProgram || selectedProgram.type !== '횟수제') {
        setFormData(prev => ({
          ...prev,
          program: value as string,
          workShift: ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          program: value as string
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }) as StaffFormData);
    }

    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
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

  const handleUpdate = async () => {
    if (!staff || !validateForm()) return;

    // 권한 검증
    if (isViewer()) {
      alert('수정 권한이 없습니다. VIEWER 권한은 조회만 가능합니다.');
      return;
    }

    if (isEditorViewingOtherBranch(staff)) {
      alert('수정 권한이 없습니다. EDITOR 권한은 본인이 속한 지점의 직원만 수정할 수 있습니다.');
      return;
    }

    // EDITOR가 MASTER 권한을 변경하려는 경우 체크
    if (currentUserInfo?.permission === 'EDITOR' && 
        staff.permission === 'MASTER' && 
        formData.permission !== staff.permission) {
      alert('권한 변경이 거부되었습니다. EDITOR 권한은 MASTER 권한을 변경할 수 없습니다.');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        contractStartDate: formData.contractStartDate ? new Date(formData.contractStartDate) : new Date(),
        contractEndDate: formData.contractEndDate ? new Date(formData.contractEndDate) : null,
      };
      
      await dbManager.updateStaff(staff.id, updateData);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('직원 수정 실패:', error);
      if (error instanceof Error) {
        if (error.message.includes('이메일')) {
          setErrors({ email: '이미 사용 중인 이메일입니다.' });
        } else if (error.message.includes('시스템 관리자') && error.message.includes('권한')) {
          alert('시스템 관리자 계정의 권한은 변경할 수 없습니다.');
        } else {
          alert(`수정 실패: ${error.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleDelete = async () => {
    if (!staff) return;

    // 권한 검증
    if (isViewer()) {
      alert('삭제 권한이 없습니다. VIEWER 권한은 조회만 가능합니다.');
      return;
    }

    if (isEditorViewingOtherBranch(staff)) {
      alert('삭제 권한이 없습니다. EDITOR 권한은 본인이 속한 지점의 직원만 삭제할 수 있습니다.');
      return;
    }

    setLoading(true);
    try {
      await dbManager.deleteStaff(staff.id);
      onUpdate();
      onClose();
      closeDeleteModal();
    } catch (error) {
      console.error('직원 삭제 실패:', error);
      if (error instanceof Error && error.message.includes('시스템 관리자')) {
        alert('시스템 관리자 계정은 삭제할 수 없습니다.');
      } else {
        alert('직원 삭제에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date: Date | string): string => {
    if (!date) return '';
    
    try {
      const d = new Date(date);
      
      // Invalid Date 체크
      if (isNaN(d.getTime())) return '';
      
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // 비밀번호 변경 관련 함수들
  const handlePasswordChange = async () => {
    if (!staff || !isNewPasswordValid || !isConfirmPasswordValid) return;

    // 권한 검증
    if (isViewer()) {
      alert('수정 권한이 없습니다. VIEWER 권한은 조회만 가능합니다.');
      return;
    }

    if (isEditorViewingOtherBranch(staff)) {
      alert('수정 권한이 없습니다. EDITOR 권한은 본인이 속한 지점의 직원만 수정할 수 있습니다.');
      return;
    }

    setLoading(true);
    try {
      await dbManager.updateStaff(staff.id, { password: newPassword });
      alert('비밀번호가 성공적으로 변경되었습니다.');
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      alert('비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const modalBody = (
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
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="이름을 입력하세요"
              $error={!!errors.name}
              readOnly={isViewer() || isEditorViewingOtherBranch(staff)}
              style={isViewer() || isEditorViewingOtherBranch(staff) ? {
                backgroundColor: AppColors.background,
                color: AppColors.onInput1,
                cursor: 'not-allowed'
              } : {}}
            />
            {errors.name && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.name}</div>}
          </FieldColumn>
        </FieldRow>

        {/* 로그인ID (readonly), 비밀번호 변경 */}
        <FieldRow>
          <FieldColumn>
            <Label>로그인 ID</Label>
            <Input
              type="text"
              value={formData.loginId || ''}
              readOnly
              style={{ backgroundColor: AppColors.background, color: AppColors.onInput1, cursor: 'not-allowed' }}
              placeholder="로그인 ID"
            />
          </FieldColumn>

          <FieldColumn>
            <Label>비밀번호</Label>
            <Button 
              variant="primary" 
              onClick={() => setIsPasswordModalOpen(true)}
              disabled={isViewer() || isEditorViewingOtherBranch(staff)}
              style={{ 
                width: '100%', 
                textAlign: 'center', 
                padding: '12px',
                opacity: isViewer() || isEditorViewingOtherBranch(staff) ? 0.5 : 1,
                cursor: isViewer() || isEditorViewingOtherBranch(staff) ? 'not-allowed' : 'pointer'
              }}
              title={isViewer() || isEditorViewingOtherBranch(staff) ? '수정 권한이 없습니다.' : ''}
            >
              비밀번호 변경
            </Button>
          </FieldColumn>
        </FieldRow>

        {/* 이메일, 연락처 */}
        <FieldRow>
          <FieldColumn>
            <Label $required>이메일</Label>
            <Input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="example@email.com"
              $error={!!errors.email}
              readOnly={isViewer() || isEditorViewingOtherBranch(staff)}
              style={isViewer() || isEditorViewingOtherBranch(staff) ? {
                backgroundColor: AppColors.background,
                color: AppColors.onInput1,
                cursor: 'not-allowed'
              } : {}}
            />
            {errors.email && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.email}</div>}
          </FieldColumn>

          <FieldColumn>
            <Label $required>연락처</Label>
            <Input
              type="tel"
              inputMode="numeric"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="010-1234-5678"
              $error={!!errors.phone}
              maxLength={13}
              autoComplete="tel"
              readOnly={isViewer() || isEditorViewingOtherBranch(staff)}
              style={isViewer() || isEditorViewingOtherBranch(staff) ? {
                backgroundColor: AppColors.background,
                color: AppColors.onInput1,
                cursor: 'not-allowed'
              } : {}}
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
              value={formData.branchId || ''}
              onChange={(value: string) => handleInputChange('branchId', value)}
              options={getBranchOptions()}
              placeholder="지점을 선택하세요"
              error={!!errors.branchId}
              disabled={isViewer() || isEditorViewingOtherBranch(staff)}
              required
              inModal={true}
            />
            {(isViewer() || isEditorViewingOtherBranch(staff)) && (
              <div style={{ 
                color: AppColors.onInput1, 
                fontSize: AppTextStyles.label3.fontSize, 
                marginTop: '4px' 
              }}>
                ℹ️ 수정 권한이 없습니다.
              </div>
            )}
            {errors.branchId && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.branchId}</div>}
          </FieldColumn>

          <FieldColumn>
            <Label $required>권한</Label>
            <CustomDropdown
              value={formData.permission || ''}
              onChange={(value: string) => handleInputChange('permission', value)}
              options={getPermissionOptions()}
              placeholder={
                isSystemAdmin(staff) ? "시스템 관리자 (변경 불가)" : 
                isEditorTryingToEditMasterPermission(staff) ? "MASTER 권한 (변경 불가)" :
                "권한을 선택하세요"
              }
              error={!!errors.permission}
              disabled={
                isSystemAdmin(staff) || 
                isViewer() || 
                isEditorViewingOtherBranch(staff) || 
                isEditorTryingToEditMasterPermission(staff)
              }
              required
              inModal={true}
            />
            {isSystemAdmin(staff) && (
              <div style={{ 
                color: AppColors.primary, 
                fontSize: AppTextStyles.label3.fontSize, 
                marginTop: '4px' 
              }}>
                🔒 시스템 관리자 권한은 변경할 수 없습니다.
              </div>
            )}
            {isEditorTryingToEditMasterPermission(staff) && !isSystemAdmin(staff) && (
              <div style={{ 
                color: AppColors.primary, 
                fontSize: AppTextStyles.label3.fontSize, 
                marginTop: '4px' 
              }}>
                🔒 EDITOR 권한은 MASTER 권한을 변경할 수 없습니다.
              </div>
            )}
            {(isViewer() || isEditorViewingOtherBranch(staff)) && !isSystemAdmin(staff) && !isEditorTryingToEditMasterPermission(staff) && (
              <div style={{ 
                color: AppColors.onInput1, 
                fontSize: AppTextStyles.label3.fontSize, 
                marginTop: '4px' 
              }}>
                ℹ️ 수정 권한이 없습니다.
              </div>
            )}
            {errors.permission && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.permission}</div>}
          </FieldColumn>
        </FieldRow>

        {/* 직급, 직책 */}
        <FieldRow>
          <FieldColumn>
            <Label $required>직급</Label>
            <CustomDropdown
              value={formData.position || ''}
              onChange={(value: string) => handleInputChange('position', value)}
              options={getPositionOptions()}
              placeholder="직급을 선택하세요"
              error={!!errors.position}
              disabled={isViewer() || isEditorViewingOtherBranch(staff)}
              required
              inModal={true}
            />
            {errors.position && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.position}</div>}
          </FieldColumn>

          <FieldColumn>
            <Label $required>직책</Label>
            <CustomDropdown
              value={formData.role || ''}
              onChange={(value: string) => handleInputChange('role', value)}
              options={getRoleOptions()}
              placeholder="직책을 선택하세요"
              error={!!errors.role}
              disabled={isViewer() || isEditorViewingOtherBranch(staff)}
              required
              inModal={true}
            />
            {errors.role && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.role}</div>}
          </FieldColumn>
        </FieldRow>

        {/* 고용형태, 담당프로그램 */}
        <FieldRow>
          <FieldColumn>
            <Label $required>고용형태</Label>
            <CustomDropdown
              value={formData.employmentType || ''}
              onChange={(value: string) => handleInputChange('employmentType', value)}
              options={getEmploymentTypeOptions()}
              placeholder="고용형태를 선택하세요"
              error={!!errors.employmentType}
              disabled={isViewer() || isEditorViewingOtherBranch(staff)}
              required
              inModal={true}
            />
            {errors.employmentType && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.employmentType}</div>}
          </FieldColumn>

          <FieldColumn>
            <Label>담당프로그램</Label>
            <CustomDropdown
              value={formData.program || ''}
              onChange={(value: string) => handleInputChange('program', value)}
              options={getProgramOptions()}
              placeholder="담당프로그램을 선택하세요"
              error={!!errors.program}
              disabled={isViewer() || isEditorViewingOtherBranch(staff)}
              inModal={true}
            />
            {errors.program && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.program}</div>}
          </FieldColumn>
        </FieldRow>

        {/* 근무시간대 (횟수제 프로그램 선택 시에만 표시) */}
        {(() => {
          const selectedProgram = programs.find(program => program.name === formData.program);
          return selectedProgram && selectedProgram.type === '횟수제';
        })() && (
          <FieldRow>
            <FieldColumn>
              <Label $required>근무시간대</Label>
              <CustomDropdown
                value={formData.workShift || ''}
                onChange={(value: string) => handleInputChange('workShift', value)}
                options={getWorkShiftOptions()}
                placeholder="근무시간대를 선택하세요"
                error={!!errors.workShift}
                disabled={isViewer() || isEditorViewingOtherBranch(staff)}
                required
                inModal={true}
              />
              {errors.workShift && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.workShift}</div>}
            </FieldColumn>
            <FieldColumn>
              {/* 빈 칸 */}
            </FieldColumn>
          </FieldRow>
        )}
      </FormSection>

      {/* 계약 정보 섹션 */}
      <FormSection>
        <SectionTitle>계약 정보</SectionTitle>
        
        <FieldRow>
          <FieldColumn>
            <Label $required>계약시작일</Label>
            <CustomDateInput
              value={formData.contractStartDate || ''}
              onChange={(value: string) => handleInputChange('contractStartDate', value)}
              placeholder="계약시작일을 선택하세요"
              error={!!errors.contractStartDate}
              max={getContractStartDateMax()}
              disabled={isViewer() || isEditorViewingOtherBranch(staff)}
              required
            />
            {errors.contractStartDate && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.contractStartDate}</div>}
          </FieldColumn>

          <FieldColumn>
            <Label>계약종료일</Label>
            <CustomDateInput
              value={formData.contractEndDate || ''}
              onChange={(value: string) => handleInputChange('contractEndDate', value)}
              placeholder="계약종료일을 선택하세요"
              error={!!errors.contractEndDate}
              min={getContractEndDateMin()}
              disabled={isViewer() || isEditorViewingOtherBranch(staff)}
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
              placeholder={isViewer() || isEditorViewingOtherBranch(staff) ? "수정 권한이 없습니다" : "이미지 또는 PDF 파일 선택 (최대 10MB)"}
              errorMessage={errors.contractFile}
              disabled={isViewer() || isEditorViewingOtherBranch(staff)}
              fullWidth
            />
            {staff?.contractFileName && !formData.contractFile && (
              <div style={{ 
                fontSize: AppTextStyles.body2.fontSize, 
                color: AppColors.onInput1, 
                marginTop: '4px' 
              }}>
                현재 파일: {staff.contractFileName}
              </div>
            )}
          </FieldColumn>
        </FieldRow>
      </FormSection>

    </FormContainer>
  );

  const modalFooter = (
    <ButtonContainer>
      <Button 
        variant="danger" 
        onClick={openDeleteModal} 
        disabled={loading || isSystemAdmin(staff) || isViewer() || isEditorViewingOtherBranch(staff)}
        title={
          isSystemAdmin(staff) ? "시스템 관리자 계정은 삭제할 수 없습니다." :
          (isViewer() || isEditorViewingOtherBranch(staff)) ? "수정 권한이 없습니다." : ""
        }
      >
        {isSystemAdmin(staff) ? "🔒 삭제 불가" : 
         (isViewer() || isEditorViewingOtherBranch(staff)) ? "🔒 삭제 불가" : "삭제"}
      </Button>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {isViewer() || isEditorViewingOtherBranch(staff) ? "닫기" : "취소"}
        </Button>
        <Button 
          variant="primary" 
          onClick={handleUpdate} 
          disabled={loading || isViewer() || isEditorViewingOtherBranch(staff)}
          title={isViewer() || isEditorViewingOtherBranch(staff) ? "수정 권한이 없습니다." : ""}
        >
          {loading ? '처리 중...' : 
           (isViewer() || isEditorViewingOtherBranch(staff)) ? '🔒 수정 불가' : '수정'}
        </Button>
      </div>
    </ButtonContainer>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        width="1000px"
        height="90vh"
        header="직원 정보 수정"
        body={modalBody}
        footer={modalFooter}
        disableOutsideClick={true}
      />

      {/* 비밀번호 변경 모달 */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={closePasswordModal}
        width="400px"
        height="auto"
        header="비밀번호 변경"
        body={
          <div style={{ 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            textAlign: 'left' // 중앙정렬 재정의
          }}>
            <AppPwdTextField
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fieldType={PwdFieldType.PASSWORD}
              onValidationChange={setIsNewPasswordValid}
              language="ko"
            />
            
            <AppPwdTextField
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fieldType={PwdFieldType.PASSWORD_CONFIRM}
              originalPassword={newPassword}
              onValidationChange={setIsConfirmPasswordValid}
              language="ko"
            />
          </div>
        }
        footer={
          <ButtonContainer>
            <Button variant="secondary" onClick={closePasswordModal} disabled={loading}>
              취소
            </Button>
            <Button 
              variant="primary" 
              onClick={handlePasswordChange} 
              disabled={loading || !isNewPasswordValid || !isConfirmPasswordValid}
            >
              {loading ? '변경 중...' : '변경'}
            </Button>
          </ButtonContainer>
        }
        disableOutsideClick={true}
      />

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        width="400px"
        height="auto"
        header="직원 삭제 확인"
        body={
          <div style={{ 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            textAlign: 'left'
          }}>
            <div style={{ 
              fontSize: '16px', 
              lineHeight: '1.5',
              color: '#333'
            }}>
              정말로 <strong>{staff?.name}</strong> 직원을 삭제하시겠습니까?
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#666',
              backgroundColor: '#fff3cd',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #ffeaa7'
            }}>
              ⚠️ 삭제된 데이터는 복구할 수 없습니다.
            </div>
          </div>
        }
        footer={
          <ButtonContainer>
            <Button variant="secondary" onClick={closeDeleteModal} disabled={loading}>
              취소
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              {loading ? '삭제 중...' : '삭제'}
            </Button>
          </ButtonContainer>
        }
        disableOutsideClick={true}
      />
    </>
  );
};

export default StaffEditPopup;
