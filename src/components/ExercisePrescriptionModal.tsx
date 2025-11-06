import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  width: 1000px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${AppColors.borderLight};
  background: ${AppColors.background};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${AppColors.onSurface};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const VersionBadge = styled.span`
  background: ${AppColors.primary};
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${AppColors.onInput1};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background: ${AppColors.borderLight};
    color: ${AppColors.onSurface};
  }
`;

const ModalBody = styled.div`
  padding: 0;
  max-height: calc(90vh - 80px);
  overflow-y: auto;
`;

interface ExercisePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  version?: number;
}

const ExercisePrescriptionModal: React.FC<ExercisePrescriptionModalProps> = ({
  isOpen,
  onClose,
  children,
  version
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            운동처방 상세보기
            {version && <VersionBadge>v{version}</VersionBadge>}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            ×
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          {children}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ExercisePrescriptionModal;