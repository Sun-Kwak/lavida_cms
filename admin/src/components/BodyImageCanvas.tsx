import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import { BodyImagePoint } from '../utils/db/types';

interface BodyImageCanvasProps {
  imageType: 'front' | 'spine' | 'back';
  imageUrl: string;
  points: BodyImagePoint[];
  onAddPoint: (point: Omit<BodyImagePoint, 'id'>) => void;
  onUpdatePoint: (pointId: string, updates: Partial<Omit<BodyImagePoint, 'id'>>) => void;
  onDeletePoint: (pointId: string) => void;
  readonly?: boolean;
}

const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: 350px;
  border: 2px dashed ${AppColors.borderLight};
  border-radius: 8px;
  overflow: hidden;
  background: #f9f9f9;
  cursor: crosshair;
  
  &.readonly {
    cursor: default;
  }
`;

const BodyImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
`;

const PointMarker = styled.div<{ $x: number; $y: number; $color?: string }>`
  position: absolute;
  left: ${props => props.$x}%;
  top: ${props => props.$y}%;
  width: 8px;
  height: 8px;
  background: ${props => props.$color || '#ff0000'};
  border: 1px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  
  &:hover {
    transform: translate(-50%, -50%) scale(1.3);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
`;

const PointMemo = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  left: ${props => props.$x}%;
  top: ${props => props.$y}%;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 8px;
  font-weight: 600;
  white-space: nowrap;
  transform: translate(-50%, calc(-100% - 6px));
  z-index: 15;
  pointer-events: none;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 2px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.8);
  }
`;

const ImageTitle = styled.div`
  text-align: center;
  font-weight: 600;
  color: ${AppColors.onBackground};
  margin-bottom: 8px;
`;

const CoordinateDisplay = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  left: ${props => props.$x}%;
  top: ${props => props.$y}%;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  transform: translate(-50%, calc(-100% - 10px));
  z-index: 20;
  pointer-events: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.8);
  }
`;

const PointEditModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 300px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const ModalTitle = styled.h3`
  margin: 0 0 15px 0;
  color: ${AppColors.onBackground};
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  margin-bottom: 10px;
  box-sizing: border-box;
`;

const ModalTextarea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  margin-bottom: 15px;
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;
`;

const ModalButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const ModalButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return AppColors.primary;
      case 'danger': return '#dc3545';
      default: return AppColors.borderLight;
    }
  }};
  
  color: ${props => {
    switch (props.$variant) {
      case 'primary':
      case 'danger': return 'white';
      default: return AppColors.onBackground;
    }
  }};
  
  &:hover {
    opacity: 0.9;
  }
`;

const getImageTitle = (imageType: 'front' | 'spine' | 'back'): string => {
  switch (imageType) {
    case 'front': return '정면';
    case 'spine': return '척추';
    case 'back': return '후면';
    default: return '';
  }
};

const BodyImageCanvas: React.FC<BodyImageCanvasProps> = ({
  imageType,
  imageUrl,
  points,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  readonly = false,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [editingPoint, setEditingPoint] = useState<BodyImagePoint | null>(null);
  const [pointMemo, setPointMemo] = useState('');
  const [pointColor, setPointColor] = useState('#ff0000');
  const [currentCoords, setCurrentCoords] = useState<{ x: number; y: number } | null>(null);
  const [showCoords, setShowCoords] = useState(false);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (readonly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setCurrentCoords({
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100
    });
    setShowCoords(true);
  }, [readonly]);

  const handleMouseLeave = useCallback(() => {
    setShowCoords(false);
    setCurrentCoords(null);
  }, []);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (readonly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // 새 포인트 추가를 위한 모달 열기
    setPointMemo('');
    setPointColor('#ff0000');
    setEditingPoint({
      id: 'new',
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      memo: '',
      color: '#ff0000'
    });
  }, [readonly]);

  const handlePointClick = useCallback((point: BodyImagePoint, event: React.MouseEvent) => {
    if (readonly) return;
    
    event.stopPropagation();
    setEditingPoint(point);
    setPointMemo(point.memo);
    setPointColor(point.color || '#ff0000');
  }, [readonly]);

  const handleSavePoint = useCallback(() => {
    if (!editingPoint) return;

    if (editingPoint.id === 'new') {
      // 새 포인트 추가
      onAddPoint({
        x: editingPoint.x,
        y: editingPoint.y,
        memo: pointMemo,
        color: pointColor,
      });
    } else {
      // 기존 포인트 업데이트
      onUpdatePoint(editingPoint.id, {
        memo: pointMemo,
        color: pointColor,
      });
    }

    setEditingPoint(null);
    setPointMemo('');
    setPointColor('#ff0000');
  }, [editingPoint, pointMemo, pointColor, onAddPoint, onUpdatePoint]);

  const handleDeletePoint = useCallback(() => {
    if (!editingPoint || editingPoint.id === 'new') return;

    onDeletePoint(editingPoint.id);
    setEditingPoint(null);
    setPointMemo('');
    setPointColor('#ff0000');
  }, [editingPoint, onDeletePoint]);

  const handleCloseModal = useCallback(() => {
    setEditingPoint(null);
    setPointMemo('');
    setPointColor('#ff0000');
  }, []);

  return (
    <>
      <div>
        <ImageTitle>{getImageTitle(imageType)}</ImageTitle>
        <CanvasContainer
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={readonly ? 'readonly' : ''}
        >
          {imageUrl ? (
            <BodyImage src={imageUrl} alt={getImageTitle(imageType)} />
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: AppColors.onInput1 
            }}>
              {readonly ? '이미지 없음' : '이미지를 업로드하거나 클릭하여 포인트를 추가하세요'}
            </div>
          )}
          
          {/* 포인트들 렌더링 */}
          {points.map((point) => (
            <React.Fragment key={point.id}>
              <PointMarker
                $x={point.x}
                $y={point.y}
                $color={point.color}
                onClick={(e) => handlePointClick(point, e)}
              />
              
              {/* 메모 항상 표시 */}
              {point.memo && (
                <PointMemo $x={point.x} $y={point.y}>
                  {point.memo}
                </PointMemo>
              )}
            </React.Fragment>
          ))}
          
          {/* 현재 마우스 좌표 표시 */}
          {showCoords && currentCoords && !readonly && (
            <CoordinateDisplay $x={currentCoords.x} $y={currentCoords.y}>
              x: {currentCoords.x.toFixed(1)}%, y: {currentCoords.y.toFixed(1)}%
            </CoordinateDisplay>
          )}
        </CanvasContainer>
      </div>

      {/* 포인트 편집 모달 */}
      {editingPoint && (
        <>
          <ModalOverlay onClick={handleCloseModal} />
          <PointEditModal>
            <ModalTitle>
              {editingPoint.id === 'new' ? '새 포인트 추가' : '포인트 편집'}
            </ModalTitle>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                위치: ({editingPoint.x.toFixed(1)}%, {editingPoint.y.toFixed(1)}%)
              </label>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                색상:
              </label>
              <ModalInput
                type="color"
                value={pointColor}
                onChange={(e) => setPointColor(e.target.value)}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                메모:
              </label>
              <ModalTextarea
                value={pointMemo}
                onChange={(e) => setPointMemo(e.target.value)}
                placeholder="이 포인트에 대한 설명을 입력하세요..."
              />
            </div>
            
            <ModalButtonGroup>
              <ModalButton onClick={handleCloseModal}>
                취소
              </ModalButton>
              
              {editingPoint.id !== 'new' && (
                <ModalButton $variant="danger" onClick={handleDeletePoint}>
                  삭제
                </ModalButton>
              )}
              
              <ModalButton $variant="primary" onClick={handleSavePoint}>
                {editingPoint.id === 'new' ? '추가' : '저장'}
              </ModalButton>
            </ModalButtonGroup>
          </PointEditModal>
        </>
      )}
    </>
  );
};

export default BodyImageCanvas;