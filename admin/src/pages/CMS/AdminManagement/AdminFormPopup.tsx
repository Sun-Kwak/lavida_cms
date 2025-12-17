import React, { useState } from 'react';
import styled from 'styled-components';
import CmsPopup from '../../../components/CmsPopup';
import { CmsPopupBtnType } from '../../../components/CmsPopupBtn';
import CmsPopupBtn from '../../../components/CmsPopupBtn';
import Modal from '../../../components/Modal';
import { AppIdTextField } from '../../../customComponents/AppIdTextField';
import { AppEmailTextField } from '../../../customComponents/AppEmailTextField';
import { AppTextField } from '../../../customComponents/AppTextField';
import { AppGPhoneTextField } from '../../../customComponents/AppGPhoneTextField';
import { AppPwdTextField, PwdFieldType } from '../../../customComponents/AppPwdTextField';

// 관리자 폼 데이터 타입
export interface AdminFormData {
  username: string;
  email: string;
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  memo: string;
}

interface AdminFormPopupProps {
  isOpen: boolean;
  isEditMode: boolean;
  formData: AdminFormData;
  formErrors: Partial<AdminFormData>;
  showPasswordChange: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onInputChange: (field: keyof AdminFormData, value: string) => void;
  onPasswordChangeClick: () => void;
}

// Styled Components
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0;
`;

const PasswordChangeButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
`;

const PasswordChangeButton = styled.button`
  background: none;
  border: none;
  color: #37bbd6; /* 브랜드 컬러 */
  text-decoration: underline;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    color: #2a9bb5; /* 브랜드 컬러 호버 */
  }
`;

const ModalButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  
  & > * {
    flex: 1;
  }
`;

const AdminFormPopup: React.FC<AdminFormPopupProps> = ({
  isOpen,
  isEditMode,
  formData,
  formErrors,
  showPasswordChange,
  onClose,
  onSave,
  onDelete,
  onInputChange,
  onPasswordChangeClick,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 삭제 확인 모달 열기
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  // 삭제 확인
  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    if (onDelete) {
      onDelete();
    }
  };

  // 삭제 취소
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };
  // 전화번호 변경 핸들러 (AppGPhoneTextField용)
  const handlePhoneChange = (value: string, isValid: boolean) => {
    onInputChange('phone', value);
  };

  const renderForm = () => (
    <FormContainer>
      <AppIdTextField
        value={formData.username}
        onChange={(e) => onInputChange('username', e.target.value)}
        label="*아이디"
        errorMessage={formErrors.username}
        readOnly={isEditMode}
        showValidationMessage={false}
      />

      <AppEmailTextField
        value={formData.email}
        onChange={(e) => onInputChange('email', e.target.value)}
        label="*이메일"
        errorMessage={formErrors.email}
        showValidationMessage={false}
      />

      <AppTextField
        value={formData.name}
        onChange={(e) => onInputChange('name', e.target.value)}
        label="*이름"
        placeholder="이름을 입력해주세요"
        errorMessage={formErrors.name}
      />

      <AppGPhoneTextField
        value={formData.phone}
        onChange={handlePhoneChange}
        label="*전화번호"
        errorMessage={formErrors.phone}
      />

      {(!isEditMode || showPasswordChange) && (
        <>
          <AppPwdTextField
            value={formData.password}
            onChange={(e) => onInputChange('password', e.target.value)}
            fieldType={PwdFieldType.PASSWORD}
            label="*비밀번호"
            errorMessage={formErrors.password}
            showValidationMessage={false}
          />

          <AppPwdTextField
            value={formData.confirmPassword}
            onChange={(e) => onInputChange('confirmPassword', e.target.value)}
            fieldType={PwdFieldType.PASSWORD_CONFIRM}
            originalPassword={formData.password}
            label="*비밀번호 확인"
            errorMessage={formErrors.confirmPassword}
            showValidationMessage={false}
          />
        </>
      )}

      <div>
        <AppTextField
          value={formData.memo}
          onChange={(e) => onInputChange('memo', e.target.value)}
          label="비고"
          placeholder="비고를 입력해주세요"
          errorMessage={formErrors.memo}
          multiline
          height="150px"
        />
        
        {isEditMode && !showPasswordChange && (
          <PasswordChangeButtonContainer>
            <PasswordChangeButton onClick={onPasswordChangeClick}>
              비밀번호 변경
            </PasswordChangeButton>
          </PasswordChangeButtonContainer>
        )}
      </div>
    </FormContainer>
  );

  return (
    <CmsPopup
      title={isEditMode ? '관리자 정보 수정' : '관리자 등록'}
      isOpen={isOpen}
      onClose={onClose}
      width="600px"
      showRequiredMark={true}
      leftButtons={[
        ...(isEditMode ? [{
          label: '삭제',
          onClick: handleDeleteClick,
          type: CmsPopupBtnType.PRIMARY,
        }] : [])
      ]}
      rightButtons={[
           {
          label: isEditMode ? '수정' : '등록',
          onClick: onSave,
          type: CmsPopupBtnType.PRIMARY,
        },
        {
          label: '취소',
          onClick: onClose,
          type: CmsPopupBtnType.SECONDARY,
        },
      ]}
    >
      {renderForm()}
      
      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        header="관리자 삭제"
        body={`정말로 "${formData.name}" 관리자를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`}
        bgColor="#ffffff"
        zIndex={10002}
        footer={
          <ModalButtonContainer>
            <CmsPopupBtn
              type={CmsPopupBtnType.SECONDARY}
              onClick={handleDeleteCancel}
            >
              취소
            </CmsPopupBtn>
            <CmsPopupBtn
              type={CmsPopupBtnType.PRIMARY}
              onClick={handleDeleteConfirm}
            >
              삭제
            </CmsPopupBtn>
          </ModalButtonContainer>
        }
      />
    </CmsPopup>
  );
};

export default AdminFormPopup;
