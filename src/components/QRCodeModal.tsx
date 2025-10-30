import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import QRCode from 'qrcode';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberId: string;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: ${AppColors.surface};
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 400px;
  height: 300px; /* 8cm * 37.8px/cm ≈ 302px */
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: ${AppColors.onInput1};
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: ${AppColors.borderLight};
  }
`;

const LeftSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-right: 24px;
`;

const RightSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const QRContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const QRCanvas = styled.canvas`
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
`;

const MemberInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MemberName = styled.h2`
  font-size: ${AppTextStyles.title2.fontSize};
  font-weight: 600;
  color: ${AppColors.onBackground};
  margin: 0;
  word-break: keep-all;
`;

const MemberLabel = styled.span`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onInput1};
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
`;

const ActionButton = styled.button`
  padding: 12px 16px;
  border: 1px solid ${AppColors.primary};
  border-radius: 8px;
  background: ${AppColors.surface};
  color: ${AppColors.primary};
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${AppColors.primary};
    color: ${AppColors.onPrimary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(ActionButton)`
  background: ${AppColors.primary};
  color: ${AppColors.onPrimary};
  
  &:hover {
    background: ${AppColors.primary};
    opacity: 0.9;
  }
`;

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, memberName, memberId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const generateQRCode = useCallback(async () => {
    if (!canvasRef.current) return;
    
    try {
      // QR 코드로 연결될 URL (운동처방 페이지)
      const url = `${window.location.origin}/lavida_cms/exercise-prescription?memberId=${memberId}`;
      
      // QR 코드 생성
      await QRCode.toCanvas(canvasRef.current, url, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // 저장/공유를 위한 데이터 URL 생성
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('QR 코드 생성 실패:', error);
    }
  }, [memberId]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      generateQRCode();
    }
  }, [isOpen, generateQRCode]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR 코드 - ${memberName}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .print-container { 
              width: 8cm; 
              height: 5cm;
              border: 1px solid #ddd;
              display: flex;
              padding: 16px;
              box-sizing: border-box;
            }
            .qr-section {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .info-section {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              font-weight: bold;
            }
            img { 
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="qr-section">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="info-section">
              ${memberName}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleSave = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `qrcode_${memberName}_${memberId}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!qrDataUrl) return;

    try {
      // Web Share API 지원 확인
      if (navigator.share) {
        // Data URL을 Blob으로 변환
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `qrcode_${memberName}.png`, { type: 'image/png' });

        await navigator.share({
          title: `${memberName} QR 코드`,
          text: `${memberName}님의 운동처방 QR 코드입니다.`,
          files: [file]
        });
      } else {
        // Web Share API를 지원하지 않는 경우 클립보드에 복사
        await navigator.clipboard.writeText(`${window.location.origin}/lavida_cms/exercise-prescription?memberId=${memberId}`);
        alert('QR 코드 링크가 클립보드에 복사되었습니다.');
      }
    } catch (error) {
      console.error('공유 실패:', error);
      // 폴백: 링크를 클립보드에 복사
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/lavida_cms/exercise-prescription?memberId=${memberId}`);
        alert('QR 코드 링크가 클립보드에 복사되었습니다.');
      } catch (clipboardError) {
        console.error('클립보드 복사 실패:', clipboardError);
        alert('공유에 실패했습니다.');
      }
    }
  };

  const handleGoToPage = () => {
    const url = `/lavida_cms/exercise-prescription?memberId=${memberId}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <LeftSection>
          <QRContainer>
            <QRCanvas ref={canvasRef} />
          </QRContainer>
        </LeftSection>
        
        <RightSection>
          <MemberInfo>
            <MemberLabel>회원명</MemberLabel>
            <MemberName>{memberName}</MemberName>
          </MemberInfo>
          
          <ButtonGroup>
            <PrimaryButton onClick={handlePrint}>
              코드 인쇄
            </PrimaryButton>
            <ActionButton onClick={handleSave}>
              코드 저장
            </ActionButton>
            <ActionButton onClick={handleShare}>
              코드 공유
            </ActionButton>
            <ActionButton onClick={handleGoToPage}>
              페이지 이동
            </ActionButton>
          </ButtonGroup>
        </RightSection>
      </ModalContent>
    </ModalOverlay>
  );
};

export default QRCodeModal;