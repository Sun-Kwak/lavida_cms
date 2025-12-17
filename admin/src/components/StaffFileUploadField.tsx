import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';

const FormField = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  grid-column: ${props => props.$fullWidth ? '1 / -1' : 'auto'};
`;

const Label = styled.label<{ $required?: boolean }>`
  font-size: ${AppTextStyles.label1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  
  &::after {
    content: ${props => props.$required ? '" *"' : '""'};
    color: ${AppColors.error};
  }
`;

const FileUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FileUploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 14px 16px;
  border: 2px dashed ${AppColors.borderLight};
  border-radius: 12px;
  background-color: ${AppColors.surface};
  color: ${AppColors.onSurface};
  font-size: ${AppTextStyles.body1.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${AppColors.primary};
    background-color: ${AppColors.primary}08;
    color: ${AppColors.primary};
    box-shadow: 0 2px 8px rgba(55, 187, 214, 0.1);
  }
`;

const HiddenFileInput = styled.input.attrs({ type: 'file' })`
  display: none;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 14px 16px;
  background-color: ${AppColors.background};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 12px;
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.onSurface};
`;

const FileRemoveButton = styled.button`
  background: none;
  border: none;
  color: ${AppColors.error};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background-color: ${AppColors.error}10;
  }
`;

const ErrorMessage = styled.div`
  color: ${AppColors.error};
  font-size: ${AppTextStyles.label3.fontSize};
  margin-top: 4px;
`;

export interface StaffFileUploadFieldProps {
  label?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  placeholder?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accept?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export const StaffFileUploadField: React.FC<StaffFileUploadFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = '파일을 선택하세요',
  errorMessage,
  required = false,
  disabled = false,
  fullWidth = true,
  accept = 'image/*,application/pdf',
  maxSizeMB = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // 파일 타입 검증
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        // 에러 처리는 부모 컴포넌트에서 처리하도록 일단 파일을 전달
        onChange(null);
        return;
      }
      
      // 파일 크기 검증
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        // 에러 처리는 부모 컴포넌트에서 처리하도록 일단 파일을 전달
        onChange(null);
        return;
      }
    }
    
    onChange(file);
    
    // input을 초기화하여 같은 파일을 다시 선택할 수 있도록 함
    e.target.value = '';
  };

  const removeFile = () => {
    onChange(null);
  };

  const getFileIcon = (file: File): string => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type === 'application/pdf') return '📄';
    return '📎';
  };

  return (
    <FormField $fullWidth={fullWidth}>
      {label && (
        <Label $required={required}>
          {label}
        </Label>
      )}
      <FileUploadContainer>
        {!value ? (
          <FileUploadButton>
            <HiddenFileInput
              accept={accept}
              onChange={handleFileChange}
              disabled={disabled}
            />
            📎 {placeholder}
          </FileUploadButton>
        ) : (
          <FileInfo>
            <span>{getFileIcon(value)} {value.name}</span>
            <FileRemoveButton type="button" onClick={removeFile} disabled={disabled}>
              ✕
            </FileRemoveButton>
          </FileInfo>
        )}
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </FileUploadContainer>
    </FormField>
  );
};
