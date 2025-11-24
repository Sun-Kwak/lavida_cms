import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';
import { dbManager } from '../utils/indexedDB';
import { ScheduleEvent } from './Calendar/types';
import type { DailyScheduleSettings } from '../utils/db/types';
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

const TimeSlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  padding: 12px;
  background-color: ${AppColors.background};
  border-radius: 8px;
  border: 1px solid ${AppColors.borderLight};
  max-height: 200px;
  overflow-y: auto;
`;

const TimeSlotButton = styled.button<{ $isSelected: boolean; $isDisabled: boolean }>`
  padding: 8px 4px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
  border: 1px solid ${props => {
    if (props.$isDisabled) return AppColors.borderLight;
    if (props.$isSelected) return AppColors.primary;
    return AppColors.borderLight;
  }};
  background-color: ${props => {
    if (props.$isDisabled) return AppColors.surface + '50';
    if (props.$isSelected) return AppColors.primary;
    return AppColors.surface;
  }};
  color: ${props => {
    if (props.$isDisabled) return AppColors.onSurface + '40';
    if (props.$isSelected) return AppColors.onPrimary;
    return AppColors.onSurface;
  }};
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    ${props => !props.$isDisabled && `
      background-color: ${props.$isSelected ? AppColors.primary + 'dd' : AppColors.primary + '20'};
      border-color: ${AppColors.primary};
    `}
  }
`;

const TimeSelectionLabel = styled.div`
  ${AppTextStyles.body2}
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin-bottom: 8px;
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
  dailyScheduleSettings?: DailyScheduleSettings[]; // 일별 스케줄 설정 (근무시간, 휴게시간)
}

const ReservationEditModal: React.FC<ReservationEditModalProps> = ({
  isOpen,
  onClose,
  event,
  onUpdate,
  onDelete,
  currentUser,
  dailyScheduleSettings = []
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
  const [selectedTimeMinutes, setSelectedTimeMinutes] = useState<number>(0); // 분 단위로 변경

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
  const calculateEndTime = (startDateStr: string, startMinutes: number) => {
    if (!startDateStr || startMinutes < 0) return null;
    
    const startDateTime = new Date(startDateStr);
    const hours = Math.floor(startMinutes / 60);
    const minutes = startMinutes % 60;
    startDateTime.setHours(hours, minutes, 0, 0);
    
    const duration = getDuration();
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);
    
    return endDateTime;
  };

  // 30분 단위 타임슬롯 생성 함수
  const generateTimeSlots = (startMinutes: number, endMinutes: number): number[] => {
    const slots: number[] = [];
    for (let time = startMinutes; time < endMinutes; time += 30) {
      slots.push(time);
    }
    return slots;
  };

  // 분을 시간 문자열로 변환 (예: 540 -> "9:00")
  const minutesToTimeString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${String(mins).padStart(2, '0')}`;
  };

  // 특정 타임슬롯이 휴게시간에 포함되는지 확인
  const isTimeSlotInBreak = (slotStart: number): boolean => {
    if (!selectedDate || !event.staffId) return false;
    
    const daySettings = dailyScheduleSettings.find(
      s => s.staffId === event.staffId && s.date === selectedDate
    );
    
    if (!daySettings) return false;
    
    const slotEnd = slotStart + 30;
    
    // 기본 휴게시간 확인
    if (daySettings.lunchTime && daySettings.lunchTime.start > 0 && daySettings.lunchTime.end > 0) {
      if (slotStart >= daySettings.lunchTime.start && slotEnd <= daySettings.lunchTime.end) {
        return true;
      }
    }
    
    // 추가 휴게시간들 확인
    if (daySettings.breakTimes && daySettings.breakTimes.length > 0) {
      for (const breakTime of daySettings.breakTimes) {
        if (breakTime.start > 0 && breakTime.end > 0) {
          if (slotStart >= breakTime.start && slotEnd <= breakTime.end) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  // 근무 가능한 시간 범위 가져오기
  const getWorkingHours = (): { start: number; end: number } => {
    if (!selectedDate || !event.staffId) {
      return { start: 6 * 60, end: 22 * 60 }; // 기본값: 6:00 ~ 22:00
    }
    
    const daySettings = dailyScheduleSettings.find(
      s => s.staffId === event.staffId && s.date === selectedDate
    );
    
    if (!daySettings || !daySettings.workingHours) {
      return { start: 6 * 60, end: 22 * 60 }; // 기본값
    }
    
    return {
      start: daySettings.workingHours.start,
      end: daySettings.workingHours.end
    };
  };

  useEffect(() => {
    setMemo(event.reservationMemo || '');
    setEditedType(event.type as 'class' | 'consultation' | 'other');
    
    const startDate = new Date(event.startTime);
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const hours = startDate.getHours();
    const minutes = startDate.getMinutes();
    
    setSelectedDate(`${year}-${month}-${day}`);
    setSelectedTimeMinutes(hours * 60 + minutes); // 분 단위로 저장
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
      const hours = Math.floor(selectedTimeMinutes / 60);
      const minutes = selectedTimeMinutes % 60;
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      // 종료 시간 자동 계산
      const endTime = calculateEndTime(selectedDate, selectedTimeMinutes);

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
    const hours = startDate.getHours();
    const minutes = startDate.getMinutes();
    
    setSelectedDate(`${year}-${month}-${day}`);
    setSelectedTimeMinutes(hours * 60 + minutes);
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
      // 이벤트 소싱 방식: 상태만 변경 (물리적 삭제 안함)
      // status를 'cancelled'로 변경하여 히스토리 유지
      await dbManager.updateScheduleEvent(event.id, {
        status: 'cancelled',
        updatedAt: new Date()
      });
      
      console.log(`예약 취소 (이벤트 소싱): ${event.id}, status: active → cancelled`);
      
      toast.success('예약이 취소되었습니다.');
      onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('예약 취소 실패:', error);
      toast.error('예약 취소에 실패했습니다.');
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <EditInput
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <div>
                  <TimeSelectionLabel>시간 선택 (30분 단위)</TimeSelectionLabel>
                  <TimeSlotGrid>
                    {(() => {
                      const workingHours = getWorkingHours();
                      const slots = generateTimeSlots(workingHours.start, workingHours.end);
                      
                      return slots.map(slotStart => {
                        const isInBreak = isTimeSlotInBreak(slotStart);
                        const isSelected = selectedTimeMinutes === slotStart;
                        
                        return (
                          <TimeSlotButton
                            key={slotStart}
                            type="button"
                            $isSelected={isSelected}
                            $isDisabled={isInBreak}
                            onClick={() => !isInBreak && setSelectedTimeMinutes(slotStart)}
                            title={isInBreak ? '휴게시간' : undefined}
                          >
                            {minutesToTimeString(slotStart)}
                          </TimeSlotButton>
                        );
                      });
                    })()}
                  </TimeSlotGrid>
                </div>
              </div>
            ) : (
              <InfoValue>{formatDateTime(event.startTime)}</InfoValue>
            )}
          </InfoRow>

          <InfoRow>
            <InfoLabel>종료 시간:</InfoLabel>
            <InfoValue>
              {isEditMode && selectedDate && selectedTimeMinutes >= 0
                ? formatDateTime(calculateEndTime(selectedDate, selectedTimeMinutes) || event.endTime)
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
