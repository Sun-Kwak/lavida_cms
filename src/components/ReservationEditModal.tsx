import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';
import { dbManager } from '../utils/indexedDB';
import { ScheduleEvent } from './Calendar/types';
import Modal from './Modal';

// 스타일 컴포넌트들
const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px;
  min-width: 500px;
  max-width: 600px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  ${AppTextStyles.title3}
  margin: 0;
  color: ${AppColors.onBackground};
  border-bottom: 2px solid ${AppColors.primary};
  padding-bottom: 8px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const InfoLabel = styled.div`
  ${AppTextStyles.body2}
  font-weight: 600;
  color: ${AppColors.onSurface};
  min-width: 100px;
  text-align: left;
`;

const InfoValue = styled.div`
  ${AppTextStyles.body1}
  color: ${AppColors.onBackground};
  flex: 1;
  text-align: left;
`;

const EditInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  font-size: ${AppTextStyles.body1.fontSize};
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
    box-shadow: 0 0 0 2px ${AppColors.primary}20;
  }
`;

const EditSelect = styled.select`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  font-size: ${AppTextStyles.body1.fontSize};
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
    box-shadow: 0 0 0 2px ${AppColors.primary}20;
  }
`;

const ReservationTypeTag = styled.span<{ $type: 'class' | 'consultation' | 'other' }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 600;
  background-color: ${props => {
    switch (props.$type) {
      case 'consultation':
        return '#10b98120';
      case 'other':
        return '#f59e0b20';
      default:
        return '#3b82f620';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'consultation':
        return '#059669';
      case 'other':
        return '#d97706';
      default:
        return '#2563eb';
    }
  }};
`;

const MemoTextArea = styled.textarea<{ $readOnly?: boolean }>`
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  font-size: ${AppTextStyles.body1.fontSize};
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  background-color: ${props => props.$readOnly ? AppColors.background : 'white'};
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
    box-shadow: 0 0 0 2px ${AppColors.primary}20;
  }

  &::placeholder {
    color: ${AppColors.onInput1};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${props => {
    switch (props.$variant) {
      case 'danger':
        return `
          background-color: #ef4444;
          color: white;
          &:hover:not(:disabled) {
            background-color: #dc2626;
          }
        `;
      case 'secondary':
        return `
          background-color: ${AppColors.background};
          color: ${AppColors.onSurface};
          border: 1px solid ${AppColors.borderLight};
          &:hover:not(:disabled) {
            background-color: ${AppColors.borderLight};
          }
        `;
      default:
        return `
          background-color: ${AppColors.primary};
          color: ${AppColors.onPrimary};
          &:hover:not(:disabled) {
            background-color: ${AppColors.primary}dd;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface ReservationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduleEvent;
  onUpdate: (updatedEvent: ScheduleEvent) => void;
  onDelete: (eventId: string) => void;
  currentUser?: {
    id: string;
    role: 'master' | 'coach' | 'admin';
    name?: string;
  };
}

const ReservationEditModal: React.FC<ReservationEditModalProps> = ({
  isOpen,
  onClose,
  event,
  onUpdate,
  onDelete,
  currentUser
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [memo, setMemo] = useState(event.reservationMemo || '');
  const [loading, setLoading] = useState(false);
  const [memoSaving, setMemoSaving] = useState(false);
  
  // 수정 가능한 필드들
  const [editedType, setEditedType] = useState<'class' | 'consultation' | 'other'>(
    event.type as 'class' | 'consultation' | 'other'
  );
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // 현재 시간보다 지났는지 확인
  const now = new Date();
  const eventStartTime = new Date(event.startTime);
  const isPast = now >= eventStartTime;
  
  // 편집 가능 여부 (지나지 않은 예약만 편집 가능)
  const canEdit = !isPast;

  // 예약 유형에 따른 소요시간 계산 (분 단위)
  const getDuration = () => {
    if (editedType === 'consultation' || editedType === 'other') {
      return 30; // 상담/기타는 30분
    }
    // 일반 예약은 기존 소요시간 사용
    const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60);
    return duration;
  };

  // 종료 시간 자동 계산
  const calculateEndTime = (startDateStr: string, startTimeStr: string) => {
    if (!startDateStr || !startTimeStr) return '';
    
    const [hours, minutes] = startTimeStr.split(':');
    const startDateTime = new Date(startDateStr);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const duration = getDuration();
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);
    
    return endDateTime;
  };

  useEffect(() => {
    setMemo(event.reservationMemo || '');
    setEditedType(event.type as 'class' | 'consultation' | 'other');
    
    const startDate = new Date(event.startTime);
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const hours = String(startDate.getHours()).padStart(2, '0');
    const minutes = String(startDate.getMinutes()).padStart(2, '0');
    
    setSelectedDate(`${year}-${month}-${day}`);
    setSelectedTime(`${hours}:${minutes}`);
  }, [event]);

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  };

  const getReservationTypeText = (type: string) => {
    switch (type) {
      case 'consultation':
        return '상담';
      case 'other':
        return '기타';
      default:
        return '예약';
    }
  };

  // 30분 단위 시간 옵션 생성 (6:00 ~ 22:00)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const displayTime = `${hour}:${String(minute).padStart(2, '0')}`;
        options.push({ value: timeValue, label: displayTime });
        
        // 22시는 00분만 추가하고 30분은 제외
        if (hour === 22) break;
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // 메모 개별 저장
  const handleMemoSave = async () => {
    if (memo === event.reservationMemo) {
      toast.info('변경된 내용이 없습니다.');
      return;
    }

    setMemoSaving(true);
    try {
      // DB 업데이트
      await dbManager.updateScheduleEvent(event.id, {
        reservationMemo: memo || undefined
      });

      // 업데이트된 이벤트 생성
      const updatedEvent: ScheduleEvent = {
        ...event,
        reservationMemo: memo || undefined
      };

      toast.success('메모가 저장되었습니다.');
      onUpdate(updatedEvent);
    } catch (error) {
      console.error('메모 저장 실패:', error);
      toast.error('메모 저장에 실패했습니다.');
    } finally {
      setMemoSaving(false);
    }
  };

  // 예약 정보 수정
  const handleSaveEdit = async () => {
    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }

    setLoading(true);
    try {
      // 시작 시간 생성
      const [hours, minutes] = selectedTime.split(':');
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // 종료 시간 자동 계산
      const endTime = calculateEndTime(selectedDate, selectedTime);

      if (!endTime) {
        toast.error('시간 정보가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      // 제목 업데이트
      let newTitle = '';
      switch (editedType) {
        case 'consultation':
          newTitle = `[상담] ${event.memberName}`;
          break;
        case 'other':
          newTitle = `[기타] ${event.memberName}`;
          break;
        default:
          newTitle = `[예약] ${event.memberName}`;
          break;
      }

      // DB 업데이트
      await dbManager.updateScheduleEvent(event.id, {
        type: editedType,
        startTime,
        endTime,
        title: newTitle
      });

      // 업데이트된 이벤트 생성
      const updatedEvent: ScheduleEvent = {
        ...event,
        type: editedType,
        startTime,
        endTime,
        title: newTitle
      };

      toast.success('예약이 수정되었습니다.');
      onUpdate(updatedEvent);
      setIsEditMode(false);
    } catch (error) {
      console.error('예약 수정 실패:', error);
      toast.error('예약 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedType(event.type as 'class' | 'consultation' | 'other');
    
    const startDate = new Date(event.startTime);
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const hours = String(startDate.getHours()).padStart(2, '0');
    const minutes = String(startDate.getMinutes()).padStart(2, '0');
    
    setSelectedDate(`${year}-${month}-${day}`);
    setSelectedTime(`${hours}:${minutes}`);
  };

  const handleDelete = async () => {
    if (!canEdit) {
      toast.error('지난 예약은 삭제할 수 없습니다.');
      return;
    }

    if (!window.confirm('이 예약을 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      await dbManager.deleteScheduleEvent(event.id);
      toast.success('예약이 삭제되었습니다.');
      onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('예약 삭제 실패:', error);
      toast.error('예약 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header="예약 상세"
      width="600px"
      body={
      <ModalContent>
        <Section>
          <SectionTitle>예약 정보</SectionTitle>
          
          <InfoRow>
            <InfoLabel>예약 유형:</InfoLabel>
            {isEditMode ? (
              <EditSelect
                value={editedType}
                onChange={(e) => setEditedType(e.target.value as 'class' | 'consultation' | 'other')}
              >
                <option value="class">예약</option>
                <option value="consultation">상담</option>
                <option value="other">기타</option>
              </EditSelect>
            ) : (
              <InfoValue>
                <ReservationTypeTag $type={event.type as 'class' | 'consultation' | 'other'}>
                  {getReservationTypeText(event.type)}
                </ReservationTypeTag>
              </InfoValue>
            )}
          </InfoRow>

          <InfoRow>
            <InfoLabel>회원명:</InfoLabel>
            <InfoValue>{event.memberName || '-'}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>담당 코치:</InfoLabel>
            <InfoValue>{event.staffName}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>프로그램:</InfoLabel>
            <InfoValue>{event.programName || '-'}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>지점:</InfoLabel>
            <InfoValue>{event.branchName || '-'}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>시작 시간:</InfoLabel>
            {isEditMode ? (
              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                <EditInput
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ flex: 1 }}
                />
                <EditSelect
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">시간 선택</option>
                  {timeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </EditSelect>
              </div>
            ) : (
              <InfoValue>{formatDateTime(event.startTime)}</InfoValue>
            )}
          </InfoRow>

          <InfoRow>
            <InfoLabel>종료 시간:</InfoLabel>
            <InfoValue>
              {isEditMode && selectedDate && selectedTime
                ? formatDateTime(calculateEndTime(selectedDate, selectedTime) || event.endTime)
                : formatDateTime(event.endTime)}
            </InfoValue>
          </InfoRow>
        </Section>

        <Section>
          <SectionTitle>메모</SectionTitle>
          <MemoTextArea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예약 관련 메모를 입력하세요..."
            disabled={memoSaving}
          />
          <ButtonGroup style={{ marginTop: '12px', justifyContent: 'flex-end' }}>
            <Button
              $variant="primary"
              onClick={handleMemoSave}
              disabled={memoSaving || memo === event.reservationMemo}
            >
              {memoSaving ? '저장 중...' : '메모 저장'}
            </Button>
          </ButtonGroup>
        </Section>

        <ButtonGroup>
          {canEdit && (
            <>
              {isEditMode ? (
                <>
                  <Button
                    $variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    취소
                  </Button>
                  <Button
                    $variant="primary"
                    onClick={handleSaveEdit}
                    disabled={loading}
                  >
                    {loading ? '저장 중...' : '저장'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    $variant="danger"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    삭제
                  </Button>
                  <Button
                    $variant="primary"
                    onClick={handleSaveEdit}
                    disabled={loading}
                  >
                    수정
                  </Button>
                </>
              )}
            </>
          )}
          {!isEditMode && (
            <Button
              $variant="secondary"
              onClick={onClose}
              disabled={loading || memoSaving}
            >
              닫기
            </Button>
          )}
        </ButtonGroup>
      </ModalContent>
      }
    />
  );
};

export default ReservationEditModal;
