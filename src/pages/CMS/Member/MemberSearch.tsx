import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, type Member as DBMember } from '../../../utils/indexedDB';
import { getCompletedSessions } from '../../../utils/db/ReservationHelper';
import { openPreviewWindow } from './PreviewDocument';
import { MemberFormData } from './types';
import Modal from '../../../components/Modal';
import CustomDateInput from '../../../components/CustomDateInput';
import CustomDropdown from '../../../components/CustomDropdown';
import DaumAddressSearch from '../../../components/DaumAddressSearch';
import { AppIdTextField } from '../../../customComponents/AppIdTextField';
import { AppPwdTextField, PwdFieldType } from '../../../customComponents/AppPwdTextField';
import { SearchArea, type PeriodOption } from '../../../components/SearchArea';
import UnpaidFilter from '../../../components/SearchArea/UnpaidFilterButton';
import DataTable, { type TableColumn } from '../../../components/DataTable';
import CourseRegistrationModal from './CourseRegistrationModal';
import PaymentRegistrationModal from './PaymentRegistrationModal';
import QRCodeModal from '../../../components/QRCodeModal';
import CourseHistory from './CourseHistory';

// 회원 검색 결과에서 사용할 확장된 회원 정보 타입
interface MemberWithStats extends DBMember {
  pointBalance: number;
  unpaidTotal: number;
  currentCourses: Array<{
    productName: string;
    programType: string;
    progressInfo: string;
  }>;
}

const PageContainer = styled.div`
  width: 100%;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 18px;
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

const StatusBadge = styled.span<{ $status: 'active' | 'inactive' }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.$status === 'active' ? '#e7f5e7' : '#fff2f2'};
  color: ${props => props.$status === 'active' ? '#2d5a2d' : '#8b1538'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ActionButton = styled.button`
  padding: 4px 8px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  background: ${AppColors.surface};
  color: ${AppColors.primary};
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover {
    background: ${AppColors.primary};
    color: ${AppColors.onPrimary};
  }
`;

const PointInfo = styled.div`
  color: ${AppColors.primary};
  font-weight: 600;
`;

const UnpaidInfo = styled.div<{ $hasUnpaid: boolean; $clickable?: boolean }>`
  color: ${props => props.$hasUnpaid ? '#d32f2f' : AppColors.onInput1};
  font-size: 12px;
  margin-top: 2px;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  padding: ${props => props.$clickable ? '4px 8px' : '0'};
  border-radius: ${props => props.$clickable ? '4px' : '0'};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.$clickable ? 'rgba(211, 47, 47, 0.1)' : 'transparent'};
  }
`;

const CourseItem = styled.div`
  font-size: 12px;
  color: ${AppColors.onInput1};
  margin-bottom: 4px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CourseName = styled.span`
  color: ${AppColors.onBackground};
  font-weight: 500;
`;

const ProgressText = styled.span`
  color: ${AppColors.primary};
  margin-left: 4px;
`;

// 폼 관련 스타일
const FormSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 600;
  color: ${AppColors.onBackground};
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid ${AppColors.borderLight};
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const FormRowVertical = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormGroup = styled.div`
  flex: 1;
`;

const FormLabel = styled.label`
  display: block;
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 500;
  color: ${AppColors.onBackground};
  margin-bottom: 6px;
`;

const FormInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 12px;
  font-size: ${AppTextStyles.body2.fontSize};
  height: 48px;
  outline: none;
  box-sizing: border-box;
  
  &:focus {
    border-color: ${AppColors.primary};
  }
  
  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  max-width: 100%;
  padding: 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 12px;
  font-size: ${AppTextStyles.body2.fontSize};
  min-height: 80px;
  outline: none;
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    border-color: ${AppColors.primary};
  }
  
  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const FormCheckbox = styled.input`
  margin-right: 8px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onBackground};
  cursor: pointer;
`;

const MemberSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberWithStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 기간 선택 관련 상태
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('1month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // 미수 필터 관련 상태
  const [showUnpaidOnly, setShowUnpaidOnly] = useState<boolean>(false);
  const [unpaidMetaInfo, setUnpaidMetaInfo] = useState<{ unpaidMemberCount: number; totalUnpaidAmount: number }>({
    unpaidMemberCount: 0,
    totalUnpaidAmount: 0
  });
  
  // 세션 정보 캐시 (enrollmentId -> progressInfo)
  const [enrollmentSessions, setEnrollmentSessions] = useState<Map<string, string>>(new Map());
  
  // 모달 관련 상태
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<DBMember | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<DBMember>>({});
  const [branches, setBranches] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [hasActiveCourses, setHasActiveCourses] = useState<boolean>(false);

  // 새로운 모달 상태
  const [showCourseRegistrationModal, setShowCourseRegistrationModal] = useState<boolean>(false);
  const [showPaymentRegistrationModal, setShowPaymentRegistrationModal] = useState<boolean>(false);
  const [selectedMemberForModal, setSelectedMemberForModal] = useState<DBMember | null>(null);

  // QR 모달 관련 상태
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [selectedMemberForQR, setSelectedMemberForQR] = useState<DBMember | null>(null);

  // 미수 처리 모달 관련 상태
  const [showUnpaidModal, setShowUnpaidModal] = useState<boolean>(false);
  const [selectedMemberForUnpaid, setSelectedMemberForUnpaid] = useState<MemberWithStats | null>(null);

  // 진행상황 계산 함수
  const getProgressInfo = useCallback(async (enrollment: any): Promise<string> => {
    let progressText = '';
    let isExpired = false;
    
    if (enrollment.programType === '횟수제' && enrollment.sessionCount) {
      // 이벤트 소싱: 실시간 완료 횟수 계산
      const completedSessions = await getCompletedSessions(enrollment.id);
      const remaining = enrollment.sessionCount - completedSessions;
      progressText = `${remaining}/${enrollment.sessionCount}회 남음`;
      
      // 횟수제도 유효기간 체크
      if (enrollment.endDate) {
        const today = new Date();
        const endDate = new Date(enrollment.endDate);
        today.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        if (endDate < today) {
          isExpired = true;
        }
      }
    } else if (enrollment.programType === '기간제' && enrollment.endDate) {
      const today = new Date();
      const endDate = new Date(enrollment.endDate);
      const timeDiff = endDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysDiff > 0) {
        progressText = `${daysDiff}일 남음`;
      } else if (daysDiff === 0) {
        progressText = '오늘 종료';
        isExpired = true;
      } else {
        progressText = `${Math.abs(daysDiff)}일 경과`;
        isExpired = true;
      }
    } else {
      progressText = '진행률 미설정';
    }
    
    // 기간만료 시 추가 표시
    if (isExpired) {
      progressText += ' [기간만료]';
    }
    
    return progressText;
  }, []);

  // 미수 메타정보 로드
  const loadUnpaidMetaInfo = useCallback(async () => {
    try {
      const metaInfo = await dbManager.getUnpaidMetaInfo();
      setUnpaidMetaInfo(metaInfo);
    } catch (error) {
      console.error('미수 메타정보 로드 실패:', error);
    }
  }, []);

  // 기간별 검색 범위 계산
  const getDateRange = useCallback(() => {
    const today = new Date();
    const startDate = new Date();
    
    switch (selectedPeriod) {
      case '1month':
        startDate.setMonth(today.getMonth() - 1);
        return { start: startDate, end: today };
      case '3month':
        startDate.setMonth(today.getMonth() - 3);
        return { start: startDate, end: today };
      case '6month':
        startDate.setMonth(today.getMonth() - 6);
        return { start: startDate, end: today };
      case 'custom':
        if (customStartDate && customEndDate) {
          return { 
            start: new Date(customStartDate), 
            end: new Date(customEndDate) 
          };
        }
        // 커스텀 날짜가 설정되지 않은 경우 기본 1개월
        startDate.setMonth(today.getMonth() - 1);
        return { start: startDate, end: today };
      default:
        startDate.setMonth(today.getMonth() - 1);
        return { start: startDate, end: today };
    }
  }, [selectedPeriod, customStartDate, customEndDate]);

  // 날짜 범위 표시 문자열 생성
  const getDateRangeDisplay = useCallback(() => {
    const range = getDateRange();
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    return `${formatDate(range.start)} ~ ${formatDate(range.end)}`;
  }, [getDateRange]);

  const loadMembers = useCallback(async (period?: PeriodOption, startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      console.log('회원 데이터 로딩 시작...');
      
      // 미수 메타정보 로드
      await loadUnpaidMetaInfo();
      
      const allMembers = await dbManager.getAllMembers();
      console.log('전체 회원 수:', allMembers.length);
      
      // 기간별 필터링 (가입일 기준) - 매개변수가 있으면 사용, 없으면 현재 상태 사용
      const currentPeriod = period ?? selectedPeriod;
      const currentStartDate = startDate ?? customStartDate;
      const currentEndDate = endDate ?? customEndDate;
      
      let dateRange: { start: Date; end: Date };
      const today = new Date();
      const rangeStartDate = new Date();
      
      switch (currentPeriod) {
        case '1month':
          rangeStartDate.setMonth(today.getMonth() - 1);
          dateRange = { start: rangeStartDate, end: today };
          break;
        case '3month':
          rangeStartDate.setMonth(today.getMonth() - 3);
          dateRange = { start: rangeStartDate, end: today };
          break;
        case '6month':
          rangeStartDate.setMonth(today.getMonth() - 6);
          dateRange = { start: rangeStartDate, end: today };
          break;
        case 'custom':
          if (currentStartDate && currentEndDate) {
            dateRange = { 
              start: new Date(currentStartDate), 
              end: new Date(currentEndDate) 
            };
          } else {
            // 커스텀 날짜가 설정되지 않은 경우 기본 1개월
            rangeStartDate.setMonth(today.getMonth() - 1);
            dateRange = { start: rangeStartDate, end: today };
          }
          break;
        default:
          rangeStartDate.setMonth(today.getMonth() - 1);
          dateRange = { start: rangeStartDate, end: today };
      }
      
      const filteredByDate = allMembers.filter(member => {
        const joinDate = new Date(member.createdAt);
        return joinDate >= dateRange.start && joinDate <= dateRange.end;
      });
      
      console.log(`${currentPeriod} 기간 내 가입 회원 수:`, filteredByDate.length);
      
      // 각 회원의 포인트와 수강정보를 조회하여 확장된 데이터 생성
      const membersWithStats: MemberWithStats[] = await Promise.all(
        filteredByDate.map(async (member) => {
          try {
            // 포인트 잔액 조회
            const pointBalance = await dbManager.getMemberPointBalance(member.id);
            
            // 미수 총액 조회
            const unpaidTotal = await dbManager.getMemberUnpaidTotal(member.id);
            
            // 현재 수강중인 과정 조회 (활성 상태인 것들)
            const allEnrollments = await dbManager.getCourseEnrollmentsByMember(member.id);
            const activeEnrollments = allEnrollments.filter(e => 
              e.enrollmentStatus === 'active' || 
              e.enrollmentStatus === 'unpaid' ||
              e.enrollmentStatus === 'hold'
            );
            
            const currentCourses = await Promise.all(
              activeEnrollments.map(async (enrollment) => ({
                productName: enrollment.productName,
                programType: enrollment.programType,
                progressInfo: await getProgressInfo(enrollment)
              }))
            );
            
            return {
              ...member,
              pointBalance,
              unpaidTotal,
              currentCourses
            };
          } catch (error) {
            console.error(`회원 ${member.name}의 추가 정보 로드 실패:`, error);
            return {
              ...member,
              pointBalance: 0,
              unpaidTotal: 0,
              currentCourses: []
            };
          }
        })
      );

      // 최근 등록순으로 정렬 (createdAt 내림차순)
      const sortedMembersWithStats = membersWithStats.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log('=== MemberSearch 최종 데이터 설정 ===');
      console.log('sortedMembersWithStats 개수:', sortedMembersWithStats.length);
      console.log('첫 번째 회원 데이터:', sortedMembersWithStats[0]);
      
      setMembers(sortedMembersWithStats);
      setFilteredMembers(sortedMembersWithStats);
      
      console.log('상태 업데이트 완료 - members와 filteredMembers 설정됨');
    } catch (error) {
      console.error('회원 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [loadUnpaidMetaInfo, selectedPeriod, customStartDate, customEndDate, getProgressInfo]);

  // 지점과 직원 데이터 로드
  const loadBranchesAndStaff = useCallback(async () => {
    try {
      const [branchData, staffData] = await Promise.all([
        dbManager.getAllBranches(),
        dbManager.getAllStaff()
      ]);
      setBranches(branchData);
      setStaffList(staffData);
    } catch (error) {
      console.error('지점/직원 데이터 로드 실패:', error);
    }
  }, []);

  // 컴포넌트 마운트 시 초기 데이터 로드 (1개월 기준)
  useEffect(() => {
    const initializeData = async () => {
      await loadMembers();
      await loadBranchesAndStaff();
    };
    initializeData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async () => {
    // 현재 선택된 조건으로 데이터를 불러옵니다
    await loadMembers(selectedPeriod, customStartDate, customEndDate);
    
    let filtered = members;
    
    // 미수 필터 적용
    if (showUnpaidOnly) {
      filtered = filtered.filter(member => member.unpaidTotal > 0);
    }
    
    // 텍스트 검색
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(query) ||
        member.phone.includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.coachName.toLowerCase().includes(query) ||
        member.loginId.toLowerCase().includes(query) ||
        member.dong.toLowerCase().includes(query)
      );
    }
    
    setFilteredMembers(filtered);
  };

  const handlePreviewDocument = async (member: DBMember) => {
    try {
      // 회원 데이터를 MemberFormData 형식으로 변환
      const payments = await dbManager.getPaymentsByMember(member.id);
      const products = payments.flatMap(payment => payment.products);
      
      const formData: MemberFormData = {
        basicInfo: {
          name: member.name,
          phone: member.phone,
          email: member.email,
          birth: member.birth,
          gender: member.gender,
          addressInfo: {
            address: member.address,
            sigunguCode: member.sigunguCode,
            dong: member.dong,
            roadAddress: member.roadAddress,
            jibunAddress: member.jibunAddress,
          },
        },
        joinInfo: {
          branchId: member.branchId,
          coach: member.coach,
          joinPath: member.joinPath,
          loginId: member.loginId,
          loginPassword: member.loginPassword || '', // null인 경우 빈 문자열로 변환
          enableLogin: member.enableLogin,
        },
        paymentInfo: {
          selectedProducts: products,
          paymentMethod: 'card', // 기본값으로 카드 설정
        },
        agreementInfo: member.agreementInfo,
      };
      
      await openPreviewWindow(formData);
    } catch (error) {
      console.error('문서 미리보기 실패:', error);
      toast.error('문서 미리보기 중 오류가 발생했습니다.');
    }
  };

  // 활성 수강 정보 확인
  const checkActiveCourses = async (memberId: string): Promise<boolean> => {
    try {
      console.log('=== 활성 수강 확인 시작 ===');
      console.log('회원 ID:', memberId);
      
      const enrollments = await dbManager.getCourseEnrollmentsByMember(memberId);
      console.log('전체 수강 정보:', enrollments);
      
      // 결제 상태와 관계없이 수강 등록된 모든 과정 확인
      const activeCourses = enrollments.filter(enrollment => {
        console.log('수강 정보 확인:', {
          productName: enrollment.productName,
          enrollmentStatus: enrollment.enrollmentStatus,
          startDate: enrollment.startDate,
          endDate: enrollment.endDate,
          sessionCount: enrollment.sessionCount,
          completedSessions: enrollment.completedSessions || 0,
          unpaidAmount: enrollment.unpaidAmount || 0
        });
        
        // 수강 등록 상태가 활성, 완료 또는 미수인 경우
        if (!['active', 'completed', 'unpaid'].includes(enrollment.enrollmentStatus)) {
          console.log('- 비활성 수강 등록 상태로 제외');
          return false;
        }
        
        // 시작일이 없는 경우 (아직 시작 안함 - 수강 예정)
        if (!enrollment.startDate) {
          console.log('- 시작일 없음 → 수강 예정으로 활성 수강 판정');
          return true;
        }
        
        // 기간제: 종료일이 없거나 종료일이 미래인 경우 (진행 중)
        if (!enrollment.endDate || new Date(enrollment.endDate) > new Date()) {
          console.log('- 종료일 없거나 미래 → 기간제 진행 중으로 활성 수강 판정');
          return true;
        }
        
        // 횟수제: 남은 횟수가 있는 경우 (이벤트 소싱 필요)
        if (enrollment.sessionCount) {
          // TODO: 이벤트 소싱으로 실제 완료 횟수 계산 필요
          // 현재는 임시로 활성으로 간주
          console.log(`- 횟수제 수강권 존재 → 활성 수강 판정 (이벤트 소싱 필요)`);
          return true;
        }
        
        console.log('- 수강 완료로 비활성 수강 판정');
        return false;
      });
      
      console.log('활성 수강 목록:', activeCourses);
      console.log('활성 수강 개수:', activeCourses.length);
      console.log('=== 활성 수강 확인 종료 ===');
      
      return activeCourses.length > 0;
    } catch (error) {
      console.error('활성 수강 정보 확인 실패:', error);
      return false;
    }
  };

  // 테이블 컬럼 정의
  const columns: TableColumn<MemberWithStats>[] = [
    {
      key: 'name',
      title: '이름',
      width: '140px',
      render: (value, record) => (
        <div>
          <div>{record.name}</div>
          <div style={{ fontSize: '12px', color: AppColors.onInput1 }}>
            {record.email || '-'}
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      title: '연락처',
      width: '130px'
    },
    {
      key: 'branchName',
      title: '지점',
      width: '100px',
      render: (value, record) => record.branchName || '-'
    },
    {
      key: 'coachName',
      title: '담당직원',
      width: '100px',
      render: (value, record) => record.coachName || '-'
    },
    {
      key: 'lockerInfo',
      title: '라커',
      width: '100px',
      render: (value, record) => record.lockerInfo ? (
        <div>
          <div style={{ fontWeight: '600', color: AppColors.primary, fontSize: '14px' }}>
            {record.lockerInfo.lockerNumber}번
          </div>
          <div style={{ fontSize: '11px', color: AppColors.onInput1 }}>
            ~{new Date(record.lockerInfo.endDate).toLocaleDateString('ko-KR', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        </div>
      ) : (
        <span style={{ color: AppColors.onInput1, fontSize: '12px' }}>미사용</span>
      )
    },
    {
      key: 'pointBalance',
      title: '포인트',
      width: '100px',
      align: 'right' as const,
      render: (value, record) => (
        <PointInfo>
          {record.pointBalance > 0 
            ? `${record.pointBalance.toLocaleString()}P` 
            : '-'
          }
        </PointInfo>
      )
    },
    {
      key: 'unpaidTotal',
      title: '미수금',
      width: '100px',
      align: 'right' as const,
      render: (value, record) => (
        <UnpaidInfo 
          $hasUnpaid={record.unpaidTotal > 0}
          $clickable={record.unpaidTotal > 0}
          onClick={(e) => {
            e.stopPropagation(); // row 클릭 이벤트 차단
            handleUnpaidClick(record);
          }}
          title={record.unpaidTotal > 0 ? '클릭하여 미수 처리' : ''}
        >
          {record.unpaidTotal > 0 
            ? `${record.unpaidTotal.toLocaleString()}원` 
            : '-'
          }
        </UnpaidInfo>
      )
    },
    {
      key: 'currentCourses',
      title: '현재 수강',
      width: '200px',
      render: (value, record) => (
        record.currentCourses.length > 0 ? (
          record.currentCourses.map((course, index) => (
            <CourseItem key={index}>
              <CourseName>{course.productName}</CourseName>
              <ProgressText>({course.progressInfo})</ProgressText>
            </CourseItem>
          ))
        ) : (
          <div style={{ color: AppColors.onInput1, fontSize: '12px' }}>
            수강중인 과정 없음
          </div>
        )
      )
    },
    {
      key: 'isActive',
      title: '상태',
      width: '80px',
      align: 'center' as const,
      render: (value, record) => (
        <StatusBadge $status={record.isActive ? 'active' : 'inactive'}>
          {record.isActive ? '활성' : '비활성'}
        </StatusBadge>
      )
    },
    {
      key: 'qr',
      title: 'QR',
      width: '60px',
      align: 'center' as const,
      render: (value, record) => (
        <ActionButton 
          onClick={(e) => {
            e.stopPropagation();
            handleQRCode(record);
          }}
          style={{ backgroundColor: '#f3e5f5', color: '#7b1fa2', borderColor: '#9c27b0', fontSize: '12px', padding: '4px 8px' }}
        >
          QR
        </ActionButton>
      )
    },
    {
      key: 'actions',
      title: '액션',
      width: '200px',
      align: 'center' as const,
      render: (value, record) => (
        <ActionButtons>
          <ActionButton 
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCourseRegistration(record);
            }}
            style={{ backgroundColor: '#e8f5e8', color: '#2e7d32', borderColor: '#4caf50' }}
          >
            수강등록
          </ActionButton>
          <ActionButton 
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPaymentRegistration(record);
            }}
            style={{ backgroundColor: '#e3f2fd', color: '#1976d2', borderColor: '#2196f3' }}
          >
            결제등록
          </ActionButton>
          <ActionButton 
            onClick={(e) => {
              e.stopPropagation();
              handlePreviewDocument(record);
            }}
          >
            문서보기
          </ActionButton>
        </ActionButtons>
      )
    }
  ];

  // 결과 카운트 정보 컴포넌트
  const resultCountInfo = (
    <>
      {showUnpaidOnly ? '미수 고객: ' : ''}{filteredMembers.length}명 
      (활성: {filteredMembers.filter(m => m.isActive).length}명, 
      비활성: {filteredMembers.filter(m => !m.isActive).length}명)
      <br />
      <span style={{ fontSize: '12px', color: AppColors.onInput1 }}>
        기간: {getDateRangeDisplay()} | 전체: {members.length}명
      </span>
    </>
  );

  // 회원 수정 모달 열기
  const handleEditMember = async (member: DBMember) => {
    console.log('=== 회원 수정 모달 열기 ===');
    console.log('회원 정보:', {
      id: member.id,
      name: member.name,
      phone: member.phone,
      isActive: member.isActive
    });
    
    setEditingMember(member);
    
    // 활성 수강 정보 확인
    const hasActive = await checkActiveCourses(member.id);
    console.log('활성 수강 있음:', hasActive);
    setHasActiveCourses(hasActive);
    
    // 기존 로그인 정보가 있는지 확인
    const hasExistingLogin = member.enableLogin && 
                            member.loginId && 
                            !member.loginId.startsWith('temp_');
    
    setEditFormData({
      name: member.name,
      phone: member.phone,
      email: member.email,
      birth: member.birth,
      gender: member.gender,
      address: member.address,
      branchId: member.branchId,
      coach: member.coach,
      joinPath: member.joinPath,
      // 기존 로그인 정보가 있는 경우 수정 불가하므로 폼에서 제외
      loginId: hasExistingLogin ? '' : (member.loginId || ''),
      loginPassword: hasExistingLogin ? '' : (member.loginPassword || ''),
      enableLogin: member.enableLogin,
      remarks: member.remarks || ''
    });
    setShowEditModal(true);
  };

  // 회원 정보 수정 저장
  const handleSaveMember = async () => {
    if (!editingMember || !editFormData) return;

    try {
      // 입력 검증
      if (!editFormData.name?.trim()) {
        toast.error('이름을 입력해주세요.');
        return;
      }
      if (!editFormData.phone?.trim()) {
        toast.error('연락처를 입력해주세요.');
        return;
      }
      
      // 전화번호 형식 검증
      if (editFormData.phone && !/^010-\d{4}-\d{4}$/.test(editFormData.phone)) {
        toast.error('올바른 전화번호 형식이 아닙니다. (010-1234-5678)');
        return;
      }
      
      // 이메일 형식 검증 (이메일이 있는 경우만)
      if (editFormData.email && editFormData.email.trim() !== '') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
          toast.error('올바른 이메일 형식이 아닙니다.');
          return;
        }
      }

      // 현재 회원을 제외한 다른 회원들의 연락처와 이메일 중복 체크
      const allMembers = await dbManager.getAllMembers();
      const otherMembers = allMembers.filter(m => m.id !== editingMember.id);
      
      // 연락처 중복 체크
      const phoneExists = otherMembers.some(m => m.phone === editFormData.phone);
      if (phoneExists) {
        toast.error(`연락처 ${editFormData.phone}는(은) 이미 등록된 회원입니다.`);
        return;
      }

      // 이메일 중복 체크 (이메일이 있는 경우만)
      if (editFormData.email && editFormData.email.trim() !== '') {
        const emailExists = otherMembers.some(m => m.email === editFormData.email);
        if (emailExists) {
          toast.error(`이메일 ${editFormData.email}는(은) 이미 등록된 회원입니다.`);
          return;
        }
      }

      // 로그인 ID 중복 체크 (로그인 기능 사용 시에만, 그리고 기존 로그인 정보가 없는 경우에만)
      if (editFormData.enableLogin && editFormData.loginId) {
        // 기존에 로그인 정보가 있는 경우 중복 체크 스킵
        const hasExistingLogin = editingMember.enableLogin && 
                                editingMember.loginId && 
                                !editingMember.loginId.startsWith('temp_');
        
        if (!hasExistingLogin) {
          // 직원과 다른 회원들의 로그인 ID 중복 체크
          const [allStaff, loginIdExists] = await Promise.all([
            dbManager.getAllStaff(),
            Promise.resolve(otherMembers.some(m => m.loginId === editFormData.loginId))
          ]);

          const staffLoginIdExists = allStaff.some(s => s.loginId === editFormData.loginId);
          
          if (staffLoginIdExists) {
            toast.error(`로그인 ID ${editFormData.loginId}는(은) 이미 직원으로 등록되어 있습니다.`);
            return;
          }
          
          if (loginIdExists) {
            toast.error(`로그인 ID ${editFormData.loginId}는(은) 이미 다른 회원이 사용하고 있습니다.`);
            return;
          }
        }
      }

      // 지점명과 코치명 가져오기
      const selectedBranch = branches.find(b => b.id === editFormData.branchId);
      const selectedCoach = staffList.find(s => s.id === editFormData.coach);

      // 기존 로그인 정보가 있는지 확인
      const hasExistingLogin = editingMember.enableLogin && 
                              editingMember.loginId && 
                              !editingMember.loginId.startsWith('temp_');

      // 회원 정보 업데이트
      const updatedMember: DBMember = {
        ...editingMember,
        ...editFormData,
        branchName: selectedBranch?.name || editingMember.branchName,
        coachName: selectedCoach?.name || editingMember.coachName,
        // 기존 로그인 정보가 있는 경우 보존, 없는 경우만 새로 설정
        loginId: hasExistingLogin ? editingMember.loginId : (editFormData.loginId || editingMember.loginId),
        loginPassword: hasExistingLogin ? editingMember.loginPassword : (editFormData.loginPassword || null),
        enableLogin: editFormData.enableLogin || false,
      };

      await dbManager.updateMember(editingMember.id, updatedMember);

      toast.success('회원 정보가 성공적으로 수정되었습니다.');
      setShowEditModal(false);
      setEditingMember(null);
      setEditFormData({});
      
      // 회원 목록 새로고침
      await loadMembers();
    } catch (error) {
      console.error('회원 정보 수정 실패:', error);
      toast.error('회원 정보 수정 중 오류가 발생했습니다.');
    }
  };

  // 회원 상태 변경 (활성/비활성)
  const handleToggleMemberStatus = async () => {
    if (!editingMember) return;

    try {
      const newStatus = !editingMember.isActive;
      const statusText = newStatus ? '활성' : '비활성';
      
      // 비활성화하려는데 활성 수강이 있는 경우 차단
      if (!newStatus && hasActiveCourses) {
        toast.error('수강 중인 과정이 있는 회원은 비활성화할 수 없습니다.');
        return;
      }
      
      // 상태 변경 확인
      const confirmed = window.confirm(
        `정말로 이 회원을 '${statusText}' 상태로 변경하시겠습니까?\n\n` +
        `회원명: ${editingMember.name}\n` +
        `연락처: ${editingMember.phone}`
      );

      if (!confirmed) return;

      // 회원 상태 업데이트
      const updatedMember: DBMember = {
        ...editingMember,
        isActive: newStatus
      };

      await dbManager.updateMember(editingMember.id, updatedMember);

      // 로컬 상태 업데이트
      setEditingMember(updatedMember);
      
      toast.success(`회원이 '${statusText}' 상태로 변경되었습니다.`);
      
      // 회원 목록 새로고침
      await loadMembers();
      
      // 현재 검색 조건으로 다시 필터링
      if (searchQuery.trim() || showUnpaidOnly) {
        // 기존 검색 조건 유지하면서 새로고침
        setTimeout(() => {
          handleSearch();
        }, 100);
      }
    } catch (error) {
      console.error('회원 상태 변경 실패:', error);
      toast.error('회원 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingMember(null);
    setEditFormData({});
    setHasActiveCourses(false);
  };

  // 수강 등록 모달 열기
  const handleOpenCourseRegistration = (member: DBMember) => {
    setSelectedMemberForModal(member);
    setShowCourseRegistrationModal(true);
  };

  // 결제 등록 모달 열기
  const handleOpenPaymentRegistration = (member: DBMember) => {
    setSelectedMemberForModal(member);
    setShowPaymentRegistrationModal(true);
  };

  // 수강 등록 성공 처리
  const handleCourseRegistrationSuccess = () => {
    loadMembers(); // 회원 목록 새로고침
  };

  // 결제 등록 성공 처리
  const handlePaymentRegistrationSuccess = () => {
    loadMembers(); // 회원 목록 새로고침
  };

  // QR 코드 관련 핸들러
  const handleQRCode = (member: DBMember) => {
    setSelectedMemberForQR(member);
    setQrModalOpen(true);
  };

  const handleQRModalClose = () => {
    setQrModalOpen(false);
    setSelectedMemberForQR(null);
  };

  // 미수 처리 관련 핸들러
  const handleUnpaidClick = (member: MemberWithStats) => {
    if (member.unpaidTotal > 0) {
      setSelectedMemberForUnpaid(member);
      setShowUnpaidModal(true);
    }
  };

  const handleUnpaidModalClose = () => {
    setShowUnpaidModal(false);
    setSelectedMemberForUnpaid(null);
  };

  const handleUnpaidComplete = () => {
    // 미수 완료 후 데이터 새로고침
    loadMembers();
    handleUnpaidModalClose();
  };

  if (loading) {
    return (
      <PageContainer>
        <DataTable
          title="검색 결과"
          columns={columns}
          data={[]}
          loading={true}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 새로운 SearchArea 컴포넌트 사용 */}
      <SearchArea
        leftContent={
          <UnpaidFilter
            active={showUnpaidOnly}
            unpaidCount={unpaidMetaInfo.unpaidMemberCount}
            totalAmount={unpaidMetaInfo.totalUnpaidAmount}
            onClick={() => {
              setShowUnpaidOnly(!showUnpaidOnly);
              // 상태 변경 후 자동으로 검색 실행
              setTimeout(() => {
                handleSearch();
              }, 100);
            }}
          />
        }
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartDateChange={setCustomStartDate}
        onCustomEndDateChange={setCustomEndDate}
        dateRangeDisplay={getDateRangeDisplay()}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        searchPlaceholder="회원명, 전화번호, 이메일, 코치명, 로그인ID, 주소(동)로 검색..."
        autoSearchOnDateChange={false}
      />

      <DataTable
        title="검색 결과"
        columns={columns}
        data={filteredMembers}
        loading={loading}
        emptyText="검색 결과가 없습니다"
        emptyDescription="다른 검색어를 입력하거나 필터를 조정해보세요."
        resultCount={resultCountInfo}
        onRowClick={handleEditMember}
        customRowStyle={(member) => ({
          cursor: 'pointer',
          opacity: member.isActive === false ? 0.6 : 1,
          backgroundColor: member.isActive === false ? '#f8f9fa' : 'transparent'
        })}
        pagination={{
          enabled: true,
          pageSize: 15,
          pageSizeOptions: [15, 30, 100],
          showTotal: true
        }}
      />

      {/* 회원 수정 모달 */}
      {showEditModal && editingMember && (
        <Modal 
          isOpen={showEditModal}
          onClose={handleCloseModal}
          width="min(95vw, 1000px)"
          header="회원 정보 수정"
          disableOutsideClick={true}
          body={
            <div style={{ textAlign: 'left' }}>
              <FormSection>
                <SectionTitle>기본 정보</SectionTitle>
                <FormRow>
                  <FormGroup>
                    <FormLabel>이름 *</FormLabel>
                    <FormInput
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="이름을 입력하세요"
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>성별</FormLabel>
                    <CustomDropdown
                      value={editFormData.gender || ''}
                      onChange={(value) => setEditFormData(prev => ({ ...prev, gender: value as 'male' | 'female' | '' }))}
                      options={[
                        { value: 'female', label: '여성' },
                        { value: 'male', label: '남성' }
                      ]}
                      placeholder="성별을 선택하세요"
                    />
                  </FormGroup>
                </FormRow>
                
                <FormRow>
                  <FormGroup>
                    <FormLabel>연락처 *</FormLabel>
                    <FormInput
                      value={editFormData.phone || ''}
                      onChange={(e) => {
                        // 숫자만 추출
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        // 휴대폰 번호 형식으로 자동 포맷팅
                        let formatted = value;
                        if (value.length >= 3) {
                          if (value.length >= 7) {
                            formatted = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
                          } else {
                            formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
                          }
                        }
                        setEditFormData(prev => ({ ...prev, phone: formatted }));
                      }}
                      placeholder="연락처를 입력하세요"
                      maxLength={13}
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>생년월일</FormLabel>
                    <CustomDateInput
                      value={editFormData.birth || ''}
                      onChange={(value) => setEditFormData(prev => ({ ...prev, birth: value }))}
                      placeholder="생년월일을 선택하세요"
                    />
                  </FormGroup>
                </FormRow>
                
                <FormRowVertical>
                  <FormGroup>
                    <FormLabel>이메일</FormLabel>
                    <FormInput
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // 한글 입력 방지
                        const koreanPattern = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
                        if (koreanPattern.test(value)) {
                          toast.error('이메일에는 한글을 입력할 수 없습니다.');
                          return;
                        }
                        setEditFormData(prev => ({ ...prev, email: value }));
                      }}
                      placeholder="이메일을 입력하세요"
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>주소</FormLabel>
                    <DaumAddressSearch
                      value={editFormData.address || ''}
                      onAddressSelect={(addressInfo) => setEditFormData(prev => ({ 
                        ...prev, 
                        address: addressInfo.address,
                        // 추가 주소 정보들도 저장 (필요시)
                      }))}
                      placeholder="주소를 검색하세요"
                    />
                  </FormGroup>
                </FormRowVertical>
              </FormSection>

              <FormSection>
                <SectionTitle>가입 정보</SectionTitle>
                <FormRow>
                  <FormGroup>
                    <FormLabel>지점</FormLabel>
                    <CustomDropdown
                      value={editFormData.branchId || ''}
                      onChange={(value) => setEditFormData(prev => ({ ...prev, branchId: value }))}
                      options={branches.map(branch => ({ 
                        value: branch.id, 
                        label: branch.name 
                      }))}
                      placeholder="지점을 선택하세요"
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>담당 직원</FormLabel>
                    <CustomDropdown
                      value={editFormData.coach || ''}
                      onChange={(value) => setEditFormData(prev => ({ ...prev, coach: value }))}
                      options={staffList
                        .filter(staff => !editFormData.branchId || staff.branchId === editFormData.branchId)
                        .map(staff => ({ 
                          value: staff.id, 
                          label: `${staff.name} (${staff.position})` 
                        }))}
                      placeholder="코치를 선택하세요"
                    />
                  </FormGroup>
                </FormRow>
                
                <FormRowVertical>
                  <FormGroup>
                    <FormLabel>가입 경로</FormLabel>
                    <CustomDropdown
                      value={editFormData.joinPath || ''}
                      onChange={(value) => setEditFormData(prev => ({ ...prev, joinPath: value }))}
                      options={[
                        { value: '지인소개', label: '지인소개' },
                        { value: '당근마켓', label: '당근마켓' },
                        { value: '네이버 플레이스', label: '네이버 플레이스' },
                        { value: '전화', label: '전화' },
                        { value: '워크인', label: '워크인' },
                        { value: '현수막', label: '현수막' },
                        { value: '인스타', label: '인스타' },
                        { value: '광고지', label: '광고지' },
                        { value: '기타', label: '기타' }
                      ]}
                      placeholder="가입 경로를 선택하세요"
                    />
                  </FormGroup>
                </FormRowVertical>
              </FormSection>

              <FormSection>
                <SectionTitle>로그인 정보</SectionTitle>
                <FormRowVertical>
                  <FormGroup>
                    <CheckboxLabel>
                      <FormCheckbox
                        type="checkbox"
                        checked={editFormData.enableLogin || false}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, enableLogin: e.target.checked }))}
                        disabled={!!(editingMember?.enableLogin && editingMember?.loginId && !editingMember?.loginId.startsWith('temp_'))}
                      />
                      로그인 기능 사용
                      {editingMember?.enableLogin && editingMember?.loginId && !editingMember?.loginId.startsWith('temp_') && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: AppColors.onInput1 }}>
                          (기존 로그인 정보가 있어 수정 불가)
                        </span>
                      )}
                    </CheckboxLabel>
                  </FormGroup>
                </FormRowVertical>
                
                {editFormData.enableLogin && (
                  <FormRow>
                    <FormGroup>
                      <FormLabel>로그인 ID</FormLabel>
                      {editingMember?.enableLogin && editingMember?.loginId && !editingMember?.loginId.startsWith('temp_') ? (
                        // 기존 로그인 ID가 있는 경우 - 읽기 전용으로 표시
                        <FormInput
                          value={editingMember.loginId}
                          disabled
                          style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                        />
                      ) : (
                        // 로그인 기능이 없었거나 임시 ID인 경우 - 새로 입력 가능
                        <AppIdTextField
                          value={editFormData.loginId || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, loginId: e.target.value }))}
                          placeholder="로그인 ID를 입력하세요"
                        />
                      )}
                    </FormGroup>
                    <FormGroup>
                      <FormLabel>비밀번호</FormLabel>
                      {editingMember?.enableLogin && editingMember?.loginId && !editingMember?.loginId.startsWith('temp_') ? (
                        // 기존 로그인 정보가 있는 경우 - 비밀번호 확인 불가
                        <FormInput
                          value="••••••••"
                          disabled
                          style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                          placeholder="보안상 확인 불가"
                        />
                      ) : (
                        // 로그인 기능이 없었거나 임시 ID인 경우 - 새로 입력 가능
                        <AppPwdTextField
                          value={editFormData.loginPassword || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, loginPassword: e.target.value }))}
                          placeholder="비밀번호를 입력하세요"
                          fieldType={PwdFieldType.PASSWORD}
                        />
                      )}
                    </FormGroup>
                  </FormRow>
                )}
                
                {editingMember?.enableLogin && editingMember?.loginId && !editingMember?.loginId.startsWith('temp_') && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#fff3cd', 
                    border: '1px solid #ffeaa7', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#856404',
                    marginTop: '8px'
                  }}>
                    ⚠️ 보안상 기존 로그인 ID와 비밀번호는 수정할 수 없습니다.
                  </div>
                )}
              </FormSection>

              <FormSection>
                <SectionTitle>기타</SectionTitle>
                <FormRowVertical>
                  <FormGroup>
                    <FormLabel>비고</FormLabel>
                    <FormTextarea
                      value={editFormData.remarks || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="기타 메모사항을 입력하세요"
                    />
                  </FormGroup>
                </FormRowVertical>
              </FormSection>
            </div>
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <Button 
                  variant="secondary" 
                  onClick={handleToggleMemberStatus}
                  disabled={editingMember?.isActive && hasActiveCourses}
                  style={{
                    backgroundColor: editingMember?.isActive ? '#fef2f2' : '#f0f9ff',
                    borderColor: editingMember?.isActive ? '#fca5a5' : '#93c5fd',
                    color: editingMember?.isActive ? '#dc2626' : '#2563eb',
                    opacity: (editingMember?.isActive && hasActiveCourses) ? 0.5 : 1,
                    cursor: (editingMember?.isActive && hasActiveCourses) ? 'not-allowed' : 'pointer'
                  }}
                  title={
                    editingMember?.isActive && hasActiveCourses 
                      ? '수강 중인 과정이 있어 비활성화할 수 없습니다' 
                      : ''
                  }
                >
                  {editingMember?.isActive ? '비활성화' : '활성화'}
                </Button>
                {editingMember?.isActive && hasActiveCourses && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#dc2626', 
                    marginTop: '4px',
                    maxWidth: '120px' 
                  }}>
                    ⚠️ 수강 중인 과정이 있어 비활성화 불가
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="secondary" onClick={handleCloseModal}>
                  취소
                </Button>
                <Button onClick={handleSaveMember}>
                  저장
                </Button>
              </div>
            </div>
          }
        />
      )}

      {/* 수강 등록 모달 */}
      {showCourseRegistrationModal && (
        <CourseRegistrationModal
          isOpen={showCourseRegistrationModal}
          onClose={() => {
            setShowCourseRegistrationModal(false);
            setSelectedMemberForModal(null);
          }}
          onSuccess={handleCourseRegistrationSuccess}
          preselectedMember={selectedMemberForModal}
        />
      )}

      {/* 결제 등록 모달 */}
      {showPaymentRegistrationModal && (
        <PaymentRegistrationModal
          isOpen={showPaymentRegistrationModal}
          onClose={() => {
            setShowPaymentRegistrationModal(false);
            setSelectedMemberForModal(null);
          }}
          onSuccess={handlePaymentRegistrationSuccess}
          preselectedMember={selectedMemberForModal}
        />
      )}

      {/* QR 코드 모달 */}
      {selectedMemberForQR && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={handleQRModalClose}
          memberName={selectedMemberForQR.name}
          memberId={selectedMemberForQR.id}
        />
      )}

      {/* 미수 처리 모달 */}
      {showUnpaidModal && selectedMemberForUnpaid && (
        <Modal
          isOpen={showUnpaidModal}
          onClose={handleUnpaidModalClose}
          width="min(90vw, 1200px)"
          header={`${selectedMemberForUnpaid.name}님의 미수 처리`}
          disableOutsideClick={true}
          body={
            <div style={{ height: '70vh', overflow: 'hidden' }}>
              <CourseHistory
                preselectedMemberId={selectedMemberForUnpaid.id}
                showUnpaidOnly={true}
                onUnpaidComplete={handleUnpaidComplete}
                isModal={true}
              />
            </div>
          }
        />
      )}
    </PageContainer>
  );
};

export default MemberSearch;
