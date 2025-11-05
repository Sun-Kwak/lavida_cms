import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';
import { dbManager, Member, CourseEnrollment, Program } from '../utils/indexedDB';
import { ScheduleEvent } from './Calendar/types';
import Modal from './Modal';
import CustomDropdown from './CustomDropdown';

// 스타일 컴포넌트들
const ModalContainer = styled.div`
  display: flex;
  /* gap: 24px; */
  height: 600px;
  min-width: 900px;
  width: 100%;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  flex: 1;
  border-right: 1px solid ${AppColors.borderLight};
  padding-right: 24px;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const RightPanel = styled.div`
  flex: 1;
  padding-left: 24px;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 12px 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  font-size: ${AppTextStyles.body1.fontSize};
  margin-bottom: 16px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
    box-shadow: 0 0 0 2px ${AppColors.primary}20;
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
  }
`;

const SearchSection = styled.div`
  /* margin-bottom 제거하여 MemberSearchPanel과 동일하게 */
`;

const PanelTitle = styled.h3`
  ${AppTextStyles.title3}
  margin-bottom: 16px;
  color: ${AppColors.onBackground};
  border-bottom: 2px solid ${AppColors.primary};
  padding-bottom: 8px;
`;

const MemberList = styled.div`
  flex: 1;
  overflow-y: auto;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
  min-height: 0;
`;

const MemberItem = styled.div<{ selected?: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid ${AppColors.borderLight};
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.selected ? AppColors.primary : 'transparent'};
  color: ${props => props.selected ? AppColors.onPrimary : AppColors.onSurface};

  &:hover {
    background: ${props => props.selected ? AppColors.primary : `${AppColors.primary}10`};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const MemberInfo = styled.div`
  font-size: ${AppTextStyles.body3.fontSize};
  opacity: 0.8;
  line-height: 1.4;
`;

const MemberName = styled.div`
  font-weight: 600;
  font-size: ${AppTextStyles.body1.fontSize};
  margin-bottom: 4px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${AppColors.onInput1};
  font-size: ${AppTextStyles.body2.fontSize};
`;

const NoResults = styled.div`
  text-align: center;
  padding: 20px;
  color: ${AppColors.onInput1};
  font-size: ${AppTextStyles.body2.fontSize};
`;

const MemoSection = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 500;
  color: ${AppColors.onSurface};
  margin-bottom: 8px;
  text-align: left;
`;

const TimeDisplay = styled.div`
  margin-top: 8px;
  font-size: ${AppTextStyles.body3.fontSize};
  color: ${AppColors.onInput1};
  text-align: left;
`;

const MemoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const MemoContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const MemoButton = styled.button`
  padding: 8px 16px;
  height: auto;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  background: ${AppColors.surface};
  color: ${AppColors.onSurface};
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const MemoTextArea = styled.textarea`
  width: 100%;
  flex: 1;
  min-height: 300px;
  /* max-height: 200px; */
  padding: 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.onSurface};
  background-color: ${AppColors.surface};
  resize: vertical;
  box-sizing: border-box;
  text-align: left;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border: ${props => props.variant === 'secondary' ? `1px solid ${AppColors.borderLight}` : 'none'};
  border-radius: 8px;
  background: ${props => props.variant === 'secondary' ? AppColors.surface : AppColors.primary};
  color: ${props => props.variant === 'secondary' ? AppColors.onSurface : AppColors.onPrimary};
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const WarningText = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  margin: 16px 0;
  color: #856404;
  font-size: 14px;
  text-align: left;
`;

// 인터페이스 정의
interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  startTime: Date;
  endTime: Date;
  staffId: string;
  staffName: string;
  programId: string;
  programName: string;
  program: Program;
  branchId: string;
  branchName: string;
  currentUser?: { 
    id: string; 
    role: 'master' | 'coach' | 'admin';
    name?: string;
  };
  existingEvents: ScheduleEvent[];
  onReservationCreate: (reservation: ScheduleEvent) => void;
}

interface MemberWithCourse extends Member {
  courseEnrollment?: CourseEnrollment;
  availableSessions?: number;
  allEnrollments?: CourseEnrollmentWithDuration[];
}

interface CourseEnrollmentWithDuration extends CourseEnrollment {
  duration?: number; // 상품의 소요시간 (분 단위)
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  startTime,
  endTime,
  staffId,
  staffName,
  programId,
  programName,
  program,
  branchId,
  branchName,
  currentUser,
  existingEvents,
  onReservationCreate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableMembers, setAvailableMembers] = useState<MemberWithCourse[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberWithCourse | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<CourseEnrollmentWithDuration | null>(null);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeConflict, setTimeConflict] = useState<string>('');
  const [savingMemo, setSavingMemo] = useState(false);

  // 선택된 상품의 소요시간에 따른 종료시간 계산
  const calculateEndTime = useCallback((enrollment: CourseEnrollmentWithDuration | null): Date => {
    if (!enrollment?.duration) {
      // 상품이 선택되지 않은 경우 원래 endTime 사용
      return endTime;
    }
    
    // 상품의 duration이 50분인 경우 1시간(60분)으로 설정 (쉬는시간 포함)
    const actualDuration = enrollment.duration === 50 ? 60 : enrollment.duration;
    return new Date(startTime.getTime() + actualDuration * 60 * 1000);
  }, [startTime, endTime]);

  // 실제 사용할 종료시간 계산
  const actualEndTime = useMemo(() => {
    return calculateEndTime(selectedEnrollment);
  }, [selectedEnrollment, calculateEndTime]);

  // 권한 체크
  const hasPermission = useMemo(() => {
    if (!currentUser) return false;
    
    // 마스터는 모든 권한
    if (currentUser.role === 'master') return true;
    
    // 담당 코치만 해당 코치의 스케줄에 예약 가능
    if (currentUser.role === 'coach') {
      return currentUser.id === staffId;
    }
    
    return false;
  }, [currentUser, staffId]);

  // 시간 포맷팅
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 시간 겹침 체크 - 상품이 선택된 경우에만 실행
  const checkTimeConflict = useMemo(() => {
    // 상품이 선택되지 않은 경우 충돌 검사 안함
    if (!selectedEnrollment) return '';
    
    const conflictingEvents = existingEvents.filter(event => {
      // 같은 스태프의 이벤트만 체크
      if (event.staffId !== staffId) return false;
      
      // 시간 겹침 체크 - actualEndTime 사용
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      return (
        (startTime >= eventStart && startTime < eventEnd) ||
        (actualEndTime > eventStart && actualEndTime <= eventEnd) ||
        (startTime <= eventStart && actualEndTime >= eventEnd)
      );
    });

    if (conflictingEvents.length > 0) {
      const conflictInfo = conflictingEvents.map(event => 
        `${formatTime(new Date(event.startTime))} - ${formatTime(new Date(event.endTime))} (${event.title})`
      ).join(', ');
      return `선택한 시간대에 다른 일정이 있습니다: ${conflictInfo}`;
    }

    return '';
  }, [existingEvents, staffId, startTime, actualEndTime, selectedEnrollment]);

  // 예약 가능한 회원 로드
  const loadAvailableMembers = useCallback(async () => {
    if (!isOpen || !searchQuery.trim()) {
      setAvailableMembers([]);
      return;
    }
    
    setLoading(true);
    try {
      // 해당 지점의 활성 회원 조회
      const allMembers = await dbManager.getAllMembers();
      const branchMembers = allMembers.filter(member => 
        member.branchId === branchId && 
        member.isActive &&
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // 활성 횟수제 수강권을 가진 회원들만 필터링
      const allEnrollments = await dbManager.getAllCourseEnrollments();
      const allProducts = await dbManager.getAllProducts(); // Product 정보 가져오기
      const membersWithCourse: MemberWithCourse[] = [];

      for (const member of branchMembers) {
        // 해당 회원의 모든 활성 횟수제 수강권 찾기
        const memberEnrollments = allEnrollments.filter(enrollment =>
          enrollment.memberId === member.id &&
          enrollment.programType === '횟수제' &&
          enrollment.enrollmentStatus === 'active' &&
          (enrollment.completedSessions || 0) < (enrollment.sessionCount || 0)
        );

        if (memberEnrollments.length > 0) {
          // 수강권에 상품의 duration 정보 추가
          const enrollmentsWithDuration: CourseEnrollmentWithDuration[] = memberEnrollments.map(enrollment => {
            const product = allProducts.find(p => p.id === enrollment.productId);
            return {
              ...enrollment,
              duration: product?.duration || 30 // 기본값 30분
            };
          });

          // 첫 번째 수강권 정보를 기본으로 저장 (표시용)
          const primaryEnrollment = enrollmentsWithDuration[0];
          const availableSessions = (primaryEnrollment.sessionCount || 0) - (primaryEnrollment.completedSessions || 0);
          
          membersWithCourse.push({
            ...member,
            courseEnrollment: primaryEnrollment,
            availableSessions,
            allEnrollments: enrollmentsWithDuration // 모든 수강권 정보 저장
          });
        }
      }

      setAvailableMembers(membersWithCourse);
    } catch (error) {
      console.error('회원 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [isOpen, branchId, searchQuery]);

  // 메모만 저장하는 함수
  const handleSaveMemo = async () => {
    if (!selectedMember) return;

    setSavingMemo(true);
    try {
      const updatedMember = {
        ...selectedMember,
        remarks: memo,
        updatedAt: new Date()
      };
      
      await dbManager.updateMember(updatedMember.id, updatedMember);
      
      // 로컬 상태 업데이트
      setSelectedMember(prev => prev ? { ...prev, remarks: memo } : null);
      
      toast.success('비고가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('비고 저장 실패:', error);
      toast.error('비고 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingMemo(false);
    }
  };

  // 예약 생성
  const handleCreateReservation = async () => {
    if (!selectedMember || !selectedEnrollment || !hasPermission) return;

    // 시간 겹침 체크
    if (timeConflict) {
      toast.error('시간이 겹치는 다른 일정이 있어 예약할 수 없습니다.');
      return;
    }

    setLoading(true);
    try {
      // 새 예약 이벤트 생성 (데이터베이스용 타입으로)
      const newReservationForDB: Omit<import('../utils/db/types').ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'> = {
        title: `${selectedMember.name} (${selectedEnrollment.productName})`,
        startTime,
        endTime: actualEndTime, // 계산된 종료시간 사용
        staffId,
        staffName,
        programId: selectedEnrollment.programId || programId,
        programName: selectedEnrollment.programName || programName,
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        type: 'class',
        color: '#3b82f6', // 파란색으로 수업 표시
        description: memo || `${selectedMember.name} 회원의 ${selectedEnrollment.productName} 수업`,
        branchId,
        branchName,
        sourceType: 'booking',
        sourceId: selectedMember.id
      };

      // 예약 저장
      const savedEvents = await dbManager.saveScheduleEvents([newReservationForDB]);
      const savedDBEvent = savedEvents[0];

      // Calendar 컴포넌트용 이벤트 객체로 변환
      const calendarEvent: ScheduleEvent = {
        id: savedDBEvent.id,
        title: savedDBEvent.title,
        startTime: savedDBEvent.startTime,
        endTime: savedDBEvent.endTime,
        staffId: savedDBEvent.staffId,
        staffName: savedDBEvent.staffName,
        programId: savedDBEvent.programId,
        programName: savedDBEvent.programName,
        memberId: savedDBEvent.memberId,
        memberName: savedDBEvent.memberName,
        type: savedDBEvent.type,
        color: savedDBEvent.color,
        description: savedDBEvent.description,
        branchId: savedDBEvent.branchId,
        branchName: savedDBEvent.branchName,
        sourceType: savedDBEvent.sourceType,
        sourceId: savedDBEvent.sourceId,
        createdAt: savedDBEvent.createdAt,
        updatedAt: savedDBEvent.updatedAt
      };

      // 선택된 상품의 수강권 세션 수 업데이트
      const updatedEnrollment = {
        ...selectedEnrollment,
        completedSessions: (selectedEnrollment.completedSessions || 0) + 1,
        updatedAt: new Date()
      };

      await dbManager.updateCourseEnrollment(updatedEnrollment.id, updatedEnrollment);

      // 회원 비고 업데이트 (메모가 있는 경우)
      if (memo.trim() && memo !== selectedMember.remarks) {
        const updatedMember = {
          ...selectedMember,
          remarks: memo,
          updatedAt: new Date()
        };
        
        await dbManager.updateMember(updatedMember.id, updatedMember);
      }

      // 부모 컴포넌트에 새 예약 알림
      onReservationCreate(calendarEvent);

      toast.success('예약이 성공적으로 등록되었습니다.');
      handleClose();
    } catch (error) {
      console.error('예약 생성 실패:', error);
      toast.error('예약 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setSearchQuery('');
    setSelectedMember(null);
    setSelectedEnrollment(null);
    setMemo('');
    setTimeConflict('');
    onClose();
  };

  // 검색어 변경 시 회원 목록 새로고침
  useEffect(() => {
    if (isOpen) {
      loadAvailableMembers();
    }
  }, [isOpen, loadAvailableMembers]);

  // 시간 겹침 체크
  useEffect(() => {
    setTimeConflict(checkTimeConflict);
  }, [checkTimeConflict]);

  // 권한 없음 처리
  if (isOpen && !hasPermission) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose}
        disableOutsideClick={true}
        body={
          <div>
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: AppTextStyles.body1.fontSize, color: AppColors.error, marginBottom: '16px' }}>
                예약 등록 권한이 없습니다.
              </div>
              <div style={{ fontSize: AppTextStyles.body2.fontSize, color: AppColors.onSurface + '80' }}>
                마스터 또는 담당 코치만 예약을 등록할 수 있습니다.
              </div>
            </div>
          </div>
        }
        footer={
          <Button variant="secondary" onClick={handleClose}>
            확인
          </Button>
        }
        width="500px"
      />
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      width="min(95vw, 1000px)"
      header="회원 예약 등록"
      disableOutsideClick={true}
      body={
        <ModalContainer>
          <LeftPanel>
            {/* 회원 검색 */}
            <SearchSection>
              <PanelTitle>수업 참여 회원 선택</PanelTitle>
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="회원명, 전화번호, 이메일로 검색..."
              />
            </SearchSection>

              {/* 회원 목록 */}
              <MemberList>
                {!searchQuery.trim() ? (
                  <EmptyState>
                    위에서 회원을 검색해주세요.<br />
                    이름, 전화번호, 이메일로 검색할 수 있습니다.
                  </EmptyState>
                ) : loading ? (
                  <EmptyState>검색 중...</EmptyState>
                ) : availableMembers.length === 0 ? (
                  <NoResults>
                    검색 결과가 없습니다.<br />
                    다른 검색어를 입력해보세요.
                  </NoResults>
                ) : (
                  availableMembers.map(member => (
                    <MemberItem
                      key={member.id}
                      selected={selectedMember?.id === member.id}
                      onClick={() => {
                        setSelectedMember(member);
                        setSelectedEnrollment(member.allEnrollments?.[0] || null);
                        setMemo(member.remarks || '');
                      }}
                    >
                      <MemberName>{member.name}</MemberName>
                      <MemberInfo>
                        {member.phone} • {member.email || '이메일 없음'}<br />
                        {member.branchName} • {member.coachName}<br />
                        가입일: {new Date(member.registrationDate).toLocaleDateString('ko-KR')}
                      </MemberInfo>
                    </MemberItem>
                  ))
                )}
              </MemberList>
          </LeftPanel>

          {/* 오른쪽 패널 - 선택된 회원 정보 및 상품 선택 */}
          <RightPanel>
            <PanelTitle>예약 정보</PanelTitle>
            {selectedMember ? (
              <MemoSection>
                <FormGroup>
                  <FormLabel>수강 상품 선택</FormLabel>
                  <CustomDropdown
                    value={selectedEnrollment?.id || ''}
                    onChange={(value) => {
                      const enrollment = selectedMember.allEnrollments?.find(e => e.id === value);
                      setSelectedEnrollment(enrollment || null);
                    }}
                    options={selectedMember.allEnrollments?.map(enrollment => {
                      const availableSessions = (enrollment.sessionCount || 0) - (enrollment.completedSessions || 0);
                      const durationText = enrollment.duration ? `${enrollment.duration}분` : '시간미정';
                      return {
                        value: enrollment.id,
                        label: `${enrollment.productName} (잔여 ${availableSessions}회 • ${durationText})`
                      };
                    }) || []}
                    placeholder="상품을 선택하세요"
                    inModal={true}
                  />
                  <TimeDisplay>
                    {selectedEnrollment ? (
                      <>
                        {formatTime(startTime)} - {formatTime(actualEndTime)} • {selectedEnrollment.duration ? `${selectedEnrollment.duration}분` : '30분'} 수업
                        {selectedEnrollment.duration === 50 && (
                          <div style={{ fontSize: '12px', color: AppColors.onInput1, marginTop: '4px' }}>
                            * 50분 수업은 쉬는시간 포함하여 1시간 예약됩니다
                          </div>
                        )}
                        {/* 시간 겹침 경고 */}
                        {timeConflict && (
                          <div style={{ 
                            background: '#fff3cd',
                            border: '1px solid #ffeaa7',
                            borderRadius: '4px',
                            padding: '8px',
                            marginTop: '8px',
                            color: '#856404',
                            fontSize: '12px'
                          }}>
                            {timeConflict}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ color: AppColors.onInput1, fontSize: '14px' }}>
                        상품을 선택하면 예약 시간이 표시됩니다
                      </div>
                    )}
                  </TimeDisplay>
                </FormGroup>
                
                <MemoContainer>
                  <MemoRow>
                    <FormLabel style={{ marginBottom: 0 }}>비고</FormLabel>
                    <MemoButton 
                      onClick={handleSaveMemo}
                      disabled={savingMemo}
                    >
                      {savingMemo ? '저장 중...' : '저장'}
                    </MemoButton>
                  </MemoRow>
                  <MemoTextArea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="회원에 대한 비고사항을 입력하세요"
                  />
                </MemoContainer>
                </MemoSection>
              ) : (
                <WarningText>
                  먼저 왼쪽에서 회원을 선택해주세요.
                </WarningText>
              )}
          </RightPanel>
        </ModalContainer>
      }
      footer={
        <ButtonGroup>
          <Button variant="secondary" onClick={handleClose}>
            취소
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateReservation}
            disabled={!selectedMember || !selectedEnrollment || !!timeConflict || loading}
          >
            {loading ? '등록 중...' : '예약 등록'}
          </Button>
        </ButtonGroup>
      }
    />
  );
};

export default ReservationModal;