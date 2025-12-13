import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';

const SignatureContainer = styled.div<{ readonly?: boolean }>`
  position: relative;
  border: 2px solid ${props => props.readonly ? '#ccc' : '#ddd'};
  border-radius: 8px;
  background: ${props => props.readonly ? '#f8f9fa' : 'white'};
  ${props => props.readonly && `
    &::after {
      content: '서명 완료';
      position: absolute;
      top: 8px;
      left: 8px;
      background: #28a745;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      z-index: 10;
    }
  `}
`;

const Canvas = styled.canvas<{ readonly?: boolean }>`
  display: block;
  cursor: ${props => props.readonly ? 'default' : 'crosshair'};
  
  &:hover {
    border-color: ${props => props.readonly ? '#ccc' : '#007bff'};
  }
`;

const ClearButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #dc3545;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  opacity: 0.7;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

interface SignatureCanvasProps {
  width?: number;
  height?: number;
  onSignatureChange: (dataUrl: string) => void;
  initialSignature?: string;
  readonly?: boolean; // 읽기 전용 모드
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  width = 300,
  height = 150,
  onSignatureChange,
  initialSignature,
  readonly = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 설정
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 초기 서명이 있다면 로드
    if (initialSignature && initialSignature.trim() !== '') {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
      };
      img.onerror = () => {
        console.error('서명 이미지 로드 실패');
        setIsEmpty(true);
      };
      img.src = initialSignature;
    } else {
      // 초기 서명이 없으면 빈 상태로 설정
      setIsEmpty(true);
    }
  }, [initialSignature]); // initialSignature가 변경될 때마다 실행

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readonly) return; // 읽기 전용 모드에서는 그리기 불가
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readonly) return; // 읽기 전용 모드에서는 그리기 불가
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    if (!isDrawing || readonly) return; // 읽기 전용 모드에서는 그리기 불가
    
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 서명 데이터를 base64로 변환하여 콜백 호출
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  const clearSignature = () => {
    if (readonly) return; // 읽기 전용 모드에서는 삭제 불가
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onSignatureChange('');
  };

  return (
    <SignatureContainer readonly={readonly}>
      <Canvas
        ref={canvasRef}
        width={width}
        height={height}
        readonly={readonly}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {!isEmpty && !readonly && (
        <ClearButton onClick={clearSignature} title="지우기">
          ×
        </ClearButton>
      )}
    </SignatureContainer>
  );
};

export default SignatureCanvas;
