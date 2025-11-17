import React, { useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, type Branch, type Member, type Locker } from '../../../utils/indexedDB';
import CustomDropdown from '../../../components/CustomDropdown';
import CustomDateInput from '../../../components/CustomDateInput';
import NumberTextField from '../../../components/NumberTextField';
import { SYSTEM_ADMIN_CONFIG } from '../../../constants/staffConstants';
import Modal from '../../../components/Modal';

const Container = styled.div`
  padding: 24px;
  background-color: ${AppColors.surface};
  min-height: 100vh;
`;

const Title = styled.h1`
  font-size: ${AppTextStyles.title1.fontSize};
  font-weight: 700;
  color: ${AppColors.onSurface};
  margin-bottom: 24px;
`;

const Content = styled.div`
  background-color: ${AppColors.background};
  padding: 32px;
  border-radius: 12px;
  border: 1px solid ${AppColors.borderLight};
`;

const ActionSection = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border: 1px solid ${AppColors.primary};
  border-radius: 6px;
  background-color: ${AppColors.primary};
  color: ${AppColors.onPrimary};
  font-size: ${AppTextStyles.body2.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${AppColors.secondary};
  }

  &:disabled {
    background-color: ${AppColors.borderLight};
    color: ${AppColors.onInput2};
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(ActionButton)`
  background-color: ${AppColors.surface};
  color: ${AppColors.primary};

  &:hover {
    background-color: ${AppColors.primary + '10'};
  }
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${AppColors.background};
  border-radius: 12px;
  border: 1px solid ${AppColors.borderLight};
  min-width: 300px;
  padding: 24px;
`;

const ModalTitle = styled.h3`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin-bottom: 16px;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
`;

const LegendColor = styled.div<{ $color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background-color: ${props => props.$color};
`;

const FilterLabel = styled.label`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onSurface};
  font-weight: 500;
`;

const LockerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, 140px);
  gap: 16px;
  margin-bottom: 32px;
  justify-content: start;
`;

const LockerItem = styled.div<{ $status: 'available' | 'occupied' | 'maintenance' | 'pending' }>`
  width: 140px;
  height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid ${props => {
    switch (props.$status) {
      case 'available':
        return AppColors.success;
      case 'occupied':
        return AppColors.error;
      case 'maintenance':
        return AppColors.warning;
      case 'pending':
        return AppColors.info;
      default:
        return AppColors.borderLight;
    }
  }};
  border-radius: 8px;
  background-color: ${props => {
    switch (props.$status) {
      case 'available':
        return AppColors.success + '10';
      case 'occupied':
        return AppColors.error + '10';
      case 'maintenance':
        return AppColors.warning + '10';
      case 'pending':
        return AppColors.info + '10';
      default:
        return AppColors.surface;
    }
  }};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  padding: 8px;
  box-sizing: border-box;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const LockerNumber = styled.div`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin-bottom: 4px;
`;

const LockerStatus = styled.div<{ $status: 'available' | 'occupied' | 'maintenance' | 'pending' }>`
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${props => {
    switch (props.$status) {
      case 'available':
        return AppColors.success;
      case 'occupied':
        return AppColors.error;
      case 'maintenance':
        return AppColors.warning;
      case 'pending':
        return AppColors.info;
      default:
        return AppColors.onInput2;
    }
  }};
  font-weight: 500;
`;

const LockerPrice = styled.div`
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${AppColors.primary};
  font-weight: 600;
  margin-top: 2px;
`;

const LockerUserInfo = styled.div`
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${AppColors.onSurface};
  text-align: center;
  margin-top: 4px;
  line-height: 1.2;
`;

const LockerUserName = styled.div`
  font-weight: 600;
  color: ${AppColors.error};
  font-size: ${AppTextStyles.label1.fontSize};
`;

const LockerPeriod = styled.div`
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${AppColors.onInput1};
  margin-top: 2px;
`;

const PermissionNotice = styled.div`
  background-color: ${AppColors.warning + '15'};
  border: 1px solid ${AppColors.warning};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  color: ${AppColors.warning};
  font-size: ${AppTextStyles.body2.fontSize};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PriceInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
`;

const StatNumber = styled.span`
  color: ${AppColors.primary};
  font-weight: 600;
`;

const StatusStats = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
  background-color: ${AppColors.surface};
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${AppColors.borderLight};
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 500;
`;

// 라커 배정 모달 스타일
const AssignmentModalContainer = styled.div`
  display: flex;
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
  text-align: left;
  overflow-y: auto;
  max-height: 600px;
  
  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

const PanelTitle = styled.h3`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 600;
  margin-bottom: 16px;
  color: ${AppColors.onBackground};
  border-bottom: 2px solid ${AppColors.primary};
  padding-bottom: 8px;
`;

const SearchInput = styled.input`
  width: 100%;
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
`;

const SearchResults = styled.div`
  flex: 1;
  overflow-y: auto;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
  min-height: 0;
  
  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

const MemberItem = styled.div<{ $selected: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid ${AppColors.borderLight};
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$selected ? AppColors.primary : 'transparent'};
  color: ${props => props.$selected ? AppColors.onPrimary : AppColors.onSurface};
  
  &:hover {
    background: ${props => props.$selected ? AppColors.primary : `${AppColors.primary}10`};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const MemberName = styled.div`
  font-weight: 600;
  font-size: ${AppTextStyles.body1.fontSize};
  margin-bottom: 4px;
`;

const MemberInfo = styled.div`
  font-size: ${AppTextStyles.body3.fontSize};
  opacity: 0.8;
  line-height: 1.4;
`;

const SelectedMemberCard = styled.div`
  background: ${AppColors.surface};
  border: 2px solid ${AppColors.primary};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
`;

const SelectedMemberName = styled.div`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 700;
  color: ${AppColors.primary};
  margin-bottom: 8px;
`;

const SelectedMemberDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: ${AppTextStyles.body3.fontSize};
  color: ${AppColors.onInput1};
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
`;

const AmountDisplay = styled.div`
  background: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  padding: 12px;
  margin: 16px 0;
  text-align: left;
`;

const AmountText = styled.div`
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.onSurface};
  margin-bottom: 4px;
`;

const AmountValue = styled.div`
  font-size: ${AppTextStyles.title2.fontSize};
  font-weight: 600;
  color: ${AppColors.primary};
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

const LockerInfoRow = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
`;

const LockerInfoItem = styled.div`
  flex: 1;
  text-align: left;
  
  strong {
    font-weight: 600;
    color: ${AppColors.onSurface};
    margin-right: 8px;
  }
  
  span {
    color: ${AppColors.onInput1};
  }
`;

const FieldRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const FieldColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
`;

const InfoText = styled.div`
  font-size: ${AppTextStyles.body3.fontSize};
  color: ${AppColors.onInput1};
  margin-top: 8px;
  line-height: 1.4;
`;

// 사용자 정보 타입
interface UserInfo {
  id: string;
  name: string;
  permission: string;
  branchId: string;
  loginId: string;
}

const LockerManagement: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addCount, setAddCount] = useState<number | undefined>(1);
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [isPriceSettingModalOpen, setIsPriceSettingModalOpen] = useState(false);
  const [tempPrice, setTempPrice] = useState<number | undefined>(0); // 임시 가격 상태 - undefined 허용
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // 라커 수정 관련 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editMonths, setEditMonths] = useState(1);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editSearchResults, setEditSearchResults] = useState<Member[]>([]);
  const [editMemo, setEditMemo] = useState('');

  // 라커 배정 관련 상태
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedLockerForAssignment, setSelectedLockerForAssignment] = useState<Locker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberPointBalance, setMemberPointBalance] = useState<number>(0);
  const [pointPayment, setPointPayment] = useState<number>(0);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  });

  // 현재 선택된 지점의 라커 가격을 동기화하여 가져오기
  const getCurrentBranchLockerPrice = (): number => {
    if (!selectedBranch) return 5000;
    const branch = branches.find(b => b.id === selectedBranch);
    return branch?.lockerPrice || 5000;
  };

  // 권한 확인 함수
  const checkPermission = async () => {
    try {
      const adminId = sessionStorage.getItem('adminId');
      if (!adminId) {
        setHasPermission(false);
        return;
      }

      const allStaff = await dbManager.getAllStaff();
      const user = allStaff.find(staff => staff.loginId === adminId);
      
      if (!user) {
        setHasPermission(false);
        return;
      }

      setCurrentUserInfo(user);

      // MASTER 권한 또는 시스템 관리자, 또는 EDITOR 권한만 라커 관리 가능
      const isMaster = user.permission === 'MASTER';
      const isSystemAdmin = adminId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
      const isEditor = user.permission === 'EDITOR';
      
      setHasPermission(isMaster || isSystemAdmin || isEditor);

      // EDITOR인 경우 본인 지점으로 자동 설정
      if (isEditor && !isMaster && !isSystemAdmin) {
        setSelectedBranch(user.branchId);
      }
    } catch (error) {
      console.error('권한 확인 실패:', error);
      setHasPermission(false);
    }
  };

  // 현재 사용자가 선택된 지점에 대한 편집 권한이 있는지 확인
  const canEditBranch = (branchId: string): boolean => {
    if (!currentUserInfo) return false;
    
    const isMaster = currentUserInfo.permission === 'MASTER';
    const isSystemAdmin = currentUserInfo.loginId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
    const isEditorOfBranch = currentUserInfo.permission === 'EDITOR' && currentUserInfo.branchId === branchId;
    
    return isMaster || isSystemAdmin || isEditorOfBranch;
  };

  // 지점 데이터 로드
  const loadBranches = async () => {
    try {
      const branchData = await dbManager.getAllBranches();
      // '전체' 지점 제외하고 실제 지점만 사용
      const filteredBranches = branchData.filter(branch => branch.name !== '전체');
      setBranches(filteredBranches);
      
      // EDITOR 권한이 아닌 경우 첫 번째 지점을 기본 선택
      if (filteredBranches.length > 0 && !selectedBranch) {
        if (!currentUserInfo || currentUserInfo.permission !== 'EDITOR') {
          setSelectedBranch(filteredBranches[0].id);
        }
      }
    } catch (error) {
      console.error('지점 데이터 로드 실패:', error);
    }
  };

  // 라커 데이터 로드
  const loadLockers = async () => {
    try {
      if (!selectedBranch) {
        setLockers([]);
        return;
      }
      
      console.log('라커 데이터 로딩 시작:', selectedBranch);
      const branchLockers = await dbManager.getLockersByBranch(selectedBranch);
      console.log('로드된 라커 데이터:', branchLockers);
      setLockers(branchLockers);
    } catch (error) {
      console.error('라커 데이터 로드 실패:', error);
      setLockers([]);
    }
  };

  // ESC 키 처리
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isPriceSettingModalOpen) {
          setIsPriceSettingModalOpen(false);
        } else if (isAddModalOpen) {
          setIsAddModalOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isPriceSettingModalOpen, isAddModalOpen]);

  // 컴포넌트 마운트 시 데이터 로드
  React.useEffect(() => {
    const initData = async () => {
      await checkPermission();
      await loadBranches();
      await loadLockers();
    };
    
    initData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 지점 변경 시 라커 데이터 다시 로드
  React.useEffect(() => {
    if (selectedBranch) {
      loadLockers();
    }
  }, [selectedBranch]); // eslint-disable-line react-hooks/exhaustive-deps

  // 지점 옵션 변환 함수
  const getBranchOptions = () => {
    return branches.map(branch => ({
      value: branch.id,
      label: branch.name,
      description: branch.address
    }));
  };

  const currentBranchLockers = lockers
    .filter(locker => locker.branchId === selectedBranch)
    .sort((a, b) => parseInt(a.number) - parseInt(b.number));

  // 상태별 통계 계산
  const getLockerStats = () => {
    const total = currentBranchLockers.length;
    const available = currentBranchLockers.filter(l => l.status === 'available').length;
    const occupied = currentBranchLockers.filter(l => l.status === 'occupied').length;
    const maintenance = currentBranchLockers.filter(l => l.status === 'maintenance').length;
    const pending = currentBranchLockers.filter(l => l.status === 'pending').length;
    
    return { total, available, occupied, maintenance, pending };
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '사용가능';
      case 'occupied':
        return '사용중';
      case 'maintenance':
        return '점검중';
      case 'pending':
        return '승인요청';
      default:
        return '알 수 없음';
    }
  };

  const handleAddLockers = async () => {
    // 권한 확인
    if (!canEditBranch(selectedBranch)) {
      toast.error('라커 추가 권한이 없습니다.');
      return;
    }

    // Validation 체크
    if (!addCount || addCount < 1 || addCount > 50) {
      toast.error('라커 개수를 올바르게 입력해주세요. (1개 ~ 50개)');
      return;
    }

    try {
      const selectedBranchData = branches.find(b => b.id === selectedBranch);
      if (!selectedBranchData) {
        toast.error('지점 정보를 찾을 수 없습니다.');
        return;
      }

      const maxNumber = Math.max(...currentBranchLockers.map(l => parseInt(l.number)), 0);
      const newLockersData: Omit<Locker, 'id' | 'createdAt' | 'updatedAt'>[] = [];
      
      for (let i = 1; i <= addCount; i++) {
        const newNumber = (maxNumber + i).toString();
        newLockersData.push({
          number: newNumber,
          status: 'available',
          branchId: selectedBranch,
          branchName: selectedBranchData.name,
          isActive: true
        });
      }
      
      console.log('라커 추가 시작:', newLockersData);
      const addedLockers = await dbManager.addMultipleLockers(newLockersData);
      console.log('라커 추가 완료:', addedLockers);
      
      // 라커 목록 새로고침
      await loadLockers();
      
      setIsAddModalOpen(false);
      setAddCount(1);
      
      toast.success(`${addCount}개의 라커가 성공적으로 추가되었습니다.`);
    } catch (error) {
      console.error('라커 추가 실패:', error);
      toast.error('라커 추가 중 오류가 발생했습니다.');
    }
  };

  const handleToggleMaintenance = async (locker: Locker) => {
    // 권한 확인
    if (!canEditBranch(locker.branchId)) {
      toast.error('라커 상태 변경 권한이 없습니다.');
      return;
    }

    try {
      const newStatus = locker.status === 'maintenance' ? 'available' : 'maintenance';
      await dbManager.updateLocker(locker.id, { status: newStatus });
      
      // 라커 목록 새로고침
      await loadLockers();
      
      toast.success(`라커 ${locker.number}번이 ${newStatus === 'maintenance' ? '점검중' : '사용가능'} 상태로 변경되었습니다.`);
    } catch (error) {
      console.error('라커 상태 변경 실패:', error);
      toast.error('라커 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteLocker = async (locker: Locker) => {
    // 권한 확인
    if (!canEditBranch(locker.branchId)) {
      toast.error('라커 삭제 권한이 없습니다.');
      return;
    }

    if (window.confirm(`라커 ${locker.number}번을 삭제하시겠습니까?`)) {
      try {
        await dbManager.deleteLocker(locker.id);
        
        // 라커 목록 새로고침
        await loadLockers();
        
        toast.success(`라커 ${locker.number}번이 삭제되었습니다.`);
      } catch (error) {
        console.error('라커 삭제 실패:', error);
        toast.error('라커 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleUnassignLocker = async (locker: Locker) => {
    // 권한 확인
    if (!canEditBranch(locker.branchId)) {
      toast.error('라커 해제 권한이 없습니다.');
      return;
    }

    if (window.confirm(`라커 ${locker.number}번의 배정을 해제하시겠습니까?`)) {
      try {
        // 해제 이력 추가
        const changeDate = new Date().toLocaleString('ko-KR');
        const changedBy = currentUserInfo?.name || 'Unknown';
        const unassignMemo = `[${changeDate}] ${changedBy} - 라커 해제\n` +
          `해제 전: ${locker.userName || '없음'} (${locker.startDate || '없음'} ~ ${locker.endDate || '없음'})`;

        const existingHistory = locker.changeHistory || [];
        const updatedHistory = [...existingHistory, unassignMemo];

        await dbManager.updateLocker(locker.id, {
          status: 'available',
          userId: undefined,
          userName: undefined,
          startDate: undefined,
          endDate: undefined,
          months: undefined,
          paymentId: undefined,
          changeHistory: updatedHistory
        });
        
        // 라커 목록 새로고침
        await loadLockers();
        
        toast.success(`라커 ${locker.number}번의 배정이 해제되었습니다.`);
      } catch (error) {
        console.error('라커 해제 실패:', error);
        toast.error('라커 해제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleLockerClick = (locker: Locker) => {
    // 사용 가능한 라커인 경우 배정 모달 열기
    if (locker.status === 'available' && hasPermission && canEditBranch(locker.branchId)) {
      setSelectedLockerForAssignment(locker);
      setIsAssignmentModalOpen(true);
      setSelectedMember(null);
      setMemberPointBalance(0);
      setPointPayment(0);
      setReceivedAmount(0);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedMonths(1);
      setPaymentMethod('card');
      // 시작일과 종료일 초기화
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      const defaultEndDate = new Date();
      defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
      setEndDate(defaultEndDate.toISOString().split('T')[0]);
    } else {
      // 기존 상세 모달 열기
      setSelectedLocker(locker);
    }
  };

  // 회원 검색 함수
  const handleMemberSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const members = await dbManager.getAllMembers();
      const filtered = members.filter(member => 
        member.isActive &&
        member.branchId === selectedBranch && // 선택된 지점의 회원만
        (
          member.name.toLowerCase().includes(query.toLowerCase()) ||
          member.phone?.includes(query) ||
          member.email?.toLowerCase().includes(query.toLowerCase())
        )
      );
      setSearchResults(filtered.slice(0, 10)); // 최대 10개만 표시
    } catch (error) {
      console.error('회원 검색 실패:', error);
      setSearchResults([]);
    }
  };

  // 회원 선택 함수
  const handleMemberSelect = async (member: Member) => {
    setSelectedMember(member);
    setSearchQuery(member.name);
    setSearchResults([]);
    
    // 포인트 잔액 로드
    try {
      const pointBalance = await dbManager.getMemberPointBalance(member.id);
      setMemberPointBalance(pointBalance);
    } catch (error) {
      console.error('포인트 잔액 조회 실패:', error);
      setMemberPointBalance(0);
    }
    
    // 포인트 및 받은금액 초기화
    setPointPayment(0);
    const monthlyPrice = getCurrentBranchLockerPrice();
    const totalAmount = monthlyPrice * selectedMonths;
    setReceivedAmount(totalAmount);
  };

  // 개월 수 변경 시 종료일 자동 계산
  const handleMonthsChange = (months: number) => {
    setSelectedMonths(months);
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    setEndDate(end.toISOString().split('T')[0]);
    
    // 받은 금액 재계산
    const monthlyPrice = getCurrentBranchLockerPrice();
    const totalAmount = monthlyPrice * months;
    setReceivedAmount(Math.max(0, totalAmount - pointPayment));
  };

  // 시작일 변경 시 종료일 자동 계산
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    const start = new Date(date);
    const end = new Date(start);
    end.setMonth(end.getMonth() + selectedMonths);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // 포인트 결제 금액 변경
  const handlePointPaymentChange = (value: number) => {
    const totalAmount = getTotalAmount();
    const maxPoint = Math.min(memberPointBalance, totalAmount);
    const newPointPayment = Math.max(0, Math.min(value, maxPoint));
    
    setPointPayment(newPointPayment);
    setReceivedAmount(Math.max(0, totalAmount - newPointPayment));
  };

  // 전체 포인트 사용
  const handleUseAllPoints = () => {
    const totalAmount = getTotalAmount();
    const maxUsablePoint = Math.min(memberPointBalance, totalAmount);
    
    setPointPayment(maxUsablePoint);
    setReceivedAmount(Math.max(0, totalAmount - maxUsablePoint));
  };

  // 라커 배정 처리 함수
  const handleAssignLocker = async () => {
    if (!selectedMember || !selectedLockerForAssignment) {
      toast.warning('회원과 라커를 선택해주세요.');
      return;
    }

    // 포인트 결제가 잔액을 초과하는지 확인
    if (pointPayment > memberPointBalance) {
      toast.error(`포인트 잔액이 부족합니다. (잔액: ${memberPointBalance.toLocaleString()}원)`);
      return;
    }

    try {
      const monthlyPrice = getCurrentBranchLockerPrice();
      const totalAmount = monthlyPrice * selectedMonths;
      const cashPayment = receivedAmount || 0;
      const totalReceived = pointPayment + cashPayment;
      
      // 초과 금액 확인 및 보너스 포인트 계산
      if (totalReceived > totalAmount) {
        const excessAmount = totalReceived - totalAmount;
        let confirmMessage = `총 받은 금액이 결제 금액보다 ${excessAmount.toLocaleString()}원 많습니다.\n초과 금액은 포인트로 적립됩니다.`;
        
        if (excessAmount >= 1000000) {
          const millionUnits = Math.floor(excessAmount / 1000000);
          const bonusPoints = millionUnits * 100000;
          confirmMessage += `\n\n🎁 보너스 혜택: 추가 ${bonusPoints.toLocaleString()}원 더 적립됩니다!`;
          confirmMessage += `\n(${millionUnits}개 100만원 단위 × 10만원 보너스)`;
        }
        
        confirmMessage += `\n\n계속 진행하시겠습니까?`;
        
        const confirmed = window.confirm(confirmMessage);
        if (!confirmed) return;
      }
      
      // 통합 주문 처리를 통한 라커 배정
      const orderId = await dbManager.processOrderWithPayments({
        memberInfo: {
          id: selectedMember.id,
          name: selectedMember.name,
          branchId: selectedLockerForAssignment.branchId,
          branchName: selectedLockerForAssignment.branchName,
          coach: selectedMember.coach,
          coachName: selectedMember.coachName
        },
        products: [{
          id: `locker_${selectedLockerForAssignment.id}`,
          name: `라커 ${selectedLockerForAssignment.number}번 (${selectedMonths}개월)`,
          price: totalAmount,
          programId: 'locker',
          programName: '라커',
          programType: 'locker'
        }],
        payments: {
          cash: paymentMethod === 'cash' ? cashPayment : 0,
          card: paymentMethod === 'card' ? cashPayment : 0,
          transfer: paymentMethod === 'transfer' ? cashPayment : 0,
          points: pointPayment
        },
        orderType: 'asset_assignment' // 라커 배정용 타입
      });

      console.log('라커 배정 주문 처리 완료:', orderId);

      // 라커 배정 (사용자 정의 시작일/종료일 사용)
      await dbManager.assignLockerToUserWithDates(
        selectedLockerForAssignment.id,
        selectedMember.id,
        selectedMember.name,
        selectedMonths,
        startDate,
        endDate,
        orderId
      );

      // 배정 이력 추가
      const changeDate = new Date().toLocaleString('ko-KR');
      const changedBy = currentUserInfo?.name || 'Unknown';
      const assignMemo = `[${changeDate}] ${changedBy} - 라커 최초 배정\n` +
        `배정: ${selectedMember.name} (${startDate} ~ ${endDate}, ${selectedMonths}개월)`;

      // 라커에 이력 추가
      const currentLocker = await dbManager.getLockerById(selectedLockerForAssignment.id);
      const existingHistory = currentLocker?.changeHistory || [];
      const updatedHistory = [...existingHistory, assignMemo];

      await dbManager.updateLocker(selectedLockerForAssignment.id, {
        changeHistory: updatedHistory
      });

      // 라커 목록 새로고침
      await loadLockers();

      setIsAssignmentModalOpen(false);
      setSelectedLockerForAssignment(null);
      setSelectedMember(null);
      setMemberPointBalance(0);
      setPointPayment(0);
      setReceivedAmount(0);
      
      toast.success(`라커 ${selectedLockerForAssignment.number}번이 ${selectedMember.name}님에게 배정되었습니다.`);
    } catch (error) {
      console.error('라커 배정 실패:', error);
      toast.error('라커 배정 중 오류가 발생했습니다.');
    }
  };

  // 라커 정보 수정을 위한 헬퍼 함수들
  const initializeEditData = async (locker: Locker) => {
    if (locker.userId) {
      try {
        const members = await dbManager.getAllMembers();
        const member = members.find(m => m.id === locker.userId);
        if (member) {
          setEditMember(member);
          setEditSearchQuery(member.name);
        }
      } catch (error) {
        console.error('회원 정보 로드 실패:', error);
      }
    }
    
    setEditStartDate(locker.startDate || '');
    setEditEndDate(locker.endDate || '');
    setEditMonths(locker.months || 1);
    setEditMemo('');
    setEditSearchResults([]);
  };

  // 수정용 회원 검색
  const handleEditMemberSearch = async (query: string) => {
    setEditSearchQuery(query);
    
    if (!query.trim()) {
      setEditSearchResults([]);
      return;
    }

    try {
      const members = await dbManager.getAllMembers();
      const filtered = members.filter(member => 
        member.isActive &&
        member.branchId === selectedBranch && // 선택된 지점의 회원만
        (
          member.name.toLowerCase().includes(query.toLowerCase()) ||
          member.phone?.includes(query) ||
          member.email?.toLowerCase().includes(query.toLowerCase())
        )
      );
      setEditSearchResults(filtered.slice(0, 10));
    } catch (error) {
      console.error('회원 검색 실패:', error);
      setEditSearchResults([]);
    }
  };

  // 수정용 회원 선택
  const handleEditMemberSelect = (member: Member) => {
    setEditMember(member);
    setEditSearchQuery(member.name);
    setEditSearchResults([]);
  };

  // 수정용 개월 수 변경 시 종료일 자동 계산
  const handleEditMonthsChange = (months: number) => {
    setEditMonths(months);
    if (editStartDate) {
      const start = new Date(editStartDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      setEditEndDate(end.toISOString().split('T')[0]);
    }
  };

  // 수정용 시작일 변경 시 종료일 자동 계산
  const handleEditStartDateChange = (date: string) => {
    setEditStartDate(date);
    const start = new Date(date);
    const end = new Date(start);
    end.setMonth(end.getMonth() + editMonths);
    setEditEndDate(end.toISOString().split('T')[0]);
  };

  // 라커 정보 수정 처리
  const handleUpdateLocker = async () => {
    if (!selectedLocker || !editMember) {
      toast.warning('필수 정보를 입력해주세요.');
      return;
    }

    if (!editMemo.trim()) {
      toast.warning('수정 사유를 입력해주세요.');
      return;
    }

    try {
      const oldData = {
        userId: selectedLocker.userId,
        userName: selectedLocker.userName,
        startDate: selectedLocker.startDate,
        endDate: selectedLocker.endDate,
        months: selectedLocker.months
      };

      const newData = {
        userId: editMember.id,
        userName: editMember.name,
        startDate: editStartDate,
        endDate: editEndDate,
        months: editMonths
      };

      // 수정 이력 메모 생성
      const changeDate = new Date().toLocaleString('ko-KR');
      const changedBy = currentUserInfo?.name || 'Unknown';
      
      const historyMemo = `[${changeDate}] ${changedBy} - ${editMemo.trim()}\n` +
        `변경 전: ${oldData.userName || '없음'} (${oldData.startDate || '없음'} ~ ${oldData.endDate || '없음'})\n` +
        `변경 후: ${newData.userName} (${newData.startDate} ~ ${newData.endDate})`;

      // 기존 이력에 새 이력 추가
      const existingHistory = selectedLocker.changeHistory || [];
      const updatedHistory = [...existingHistory, historyMemo];

      // 라커 정보 업데이트 (이력 포함)
      await dbManager.updateLocker(selectedLocker.id, {
        ...newData,
        changeHistory: updatedHistory
      });

      // 라커 목록 새로고침
      await loadLockers();

      // 모달 닫기 및 상태 초기화
      setSelectedLocker(null);
      setIsEditMode(false);
      setEditMember(null);
      setEditSearchQuery('');
      setEditMemo('');
      
      toast.success(`라커 ${selectedLocker.number}번 정보가 수정되었습니다.`);
    } catch (error) {
      console.error('라커 정보 수정 실패:', error);
      toast.error('라커 정보 수정 중 오류가 발생했습니다.');
    }
  };

  // 총 금액 계산
  const getTotalAmount = () => {
    return getCurrentBranchLockerPrice() * selectedMonths;
  };

  const handlePriceSettingOpen = () => {
    // 권한 확인
    if (!canEditBranch(selectedBranch)) {
      toast.error('라커 가격 설정 권한이 없습니다.');
      return;
    }
    setTempPrice(getCurrentBranchLockerPrice()); // 현재 가격으로 초기화
    setIsPriceSettingModalOpen(true);
  };

  const handleAddModalOpen = () => {
    // 권한 확인
    if (!canEditBranch(selectedBranch)) {
      toast.error('라커 추가 권한이 없습니다.');
      return;
    }
    setAddCount(1); // 모달 열 때 수량 초기화
    setIsAddModalOpen(true);
  };

  const handlePriceSettingUpdate = async (newPrice: number | undefined) => {
    // Validation 체크
    if (!newPrice || newPrice <= 0) {
      toast.error('가격을 올바르게 입력해주세요. (1원 이상)');
      return;
    }

    try {
      const success = await dbManager.updateLockerPrice(selectedBranch, newPrice);
      if (success) {
        // 지점 데이터를 다시 로드하여 UI 업데이트
        await loadBranches();
        setIsPriceSettingModalOpen(false);
        toast.success('라커 가격이 성공적으로 설정되었습니다.');
      } else {
        toast.error('라커 가격 설정에 실패했습니다.');
      }
    } catch (error) {
      console.error('라커 가격 설정 실패:', error);
      toast.error('라커 가격 설정 중 오류가 발생했습니다.');
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  return (
    <Container>
      <Title>라커 관리</Title>
      <Content>
        {!hasPermission && (
          <PermissionNotice>
            ⚠️ 라커 관리 권한이 없습니다. MASTER 또는 EDITOR 권한이 필요합니다.
          </PermissionNotice>
        )}

        {currentUserInfo && currentUserInfo.permission === 'EDITOR' && (
          <PermissionNotice>
            ℹ️ EDITOR 권한으로 소속 지점({branches.find(b => b.id === currentUserInfo.branchId)?.name})의 라커만 관리할 수 있습니다.
          </PermissionNotice>
        )}

        <FilterSection>
          <FilterLabel>지점:</FilterLabel>
          <div style={{ minWidth: '200px' }}>
            <CustomDropdown
              value={selectedBranch}
              onChange={(value: string) => setSelectedBranch(value)}
              options={getBranchOptions()}
              placeholder={branches.length === 0 ? "지점 로딩 중..." : "지점을 선택하세요"}
              disabled={branches.length === 0 || (currentUserInfo?.permission === 'EDITOR')}
              inModal={false}
            />
          </div>

          {/* 상태별 통계 표시 */}
          {selectedBranch && (
            <StatusStats>
              <StatItem>
                <span>총 라커:</span>
                <StatNumber>{getLockerStats().total}개</StatNumber>
              </StatItem>
              <StatItem>
                <LegendColor $color={AppColors.success} />
                <span>사용가능:</span>
                <StatNumber>{getLockerStats().available}개</StatNumber>
              </StatItem>
              <StatItem>
                <LegendColor $color={AppColors.error} />
                <span>사용중:</span>
                <StatNumber>{getLockerStats().occupied}개</StatNumber>
              </StatItem>
              <StatItem>
                <LegendColor $color={AppColors.warning} />
                <span>점검중:</span>
                <StatNumber>{getLockerStats().maintenance}개</StatNumber>
              </StatItem>
              <StatItem>
                <LegendColor $color={AppColors.info} />
                <span>승인요청:</span>
                <StatNumber>{getLockerStats().pending}개</StatNumber>
              </StatItem>
            </StatusStats>
          )}
        </FilterSection>

        {hasPermission && canEditBranch(selectedBranch) && (
          <ActionSection>
            <ActionButton onClick={handlePriceSettingOpen}>
              금액 설정
            </ActionButton>
            <ActionButton onClick={handleAddModalOpen}>
              라커 추가
            </ActionButton>
            <span style={{ fontSize: AppTextStyles.body2.fontSize, color: AppColors.onSurface }}>
              현재 라커 가격: {formatPrice(getCurrentBranchLockerPrice())}
            </span>
          </ActionSection>
        )}

        <LockerGrid>
          {currentBranchLockers.map((locker) => (
            <LockerItem
              key={locker.id}
              $status={locker.status}
              onClick={() => handleLockerClick(locker)}
            >
              <LockerNumber>{locker.number}</LockerNumber>
              <LockerStatus $status={locker.status}>
                {getStatusText(locker.status)}
              </LockerStatus>
              {locker.status === 'occupied' && locker.userName ? (
                <LockerUserInfo>
                  <LockerUserName>{locker.userName}</LockerUserName>
                  {locker.endDate && (
                    <LockerPeriod>
                      ~{new Date(locker.endDate).toLocaleDateString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </LockerPeriod>
                  )}
                </LockerUserInfo>
              ) : (
                <LockerPrice>
                  {formatPrice(getCurrentBranchLockerPrice())}
                </LockerPrice>
              )}
            </LockerItem>
          ))}
        </LockerGrid>

        {/* 지점별 라커 가격 설정 모달 */}
        <ModalOverlay $isOpen={isPriceSettingModalOpen}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {branches.find(b => b.id === selectedBranch)?.name} 라커 가격 설정
            </ModalTitle>
            <PriceInputGroup>
              <label>라커 가격:</label>
              <NumberTextField
                value={tempPrice ?? ''}
                onChange={(value) => setTempPrice(value)}
                step={1000}
                placeholder="가격을 입력하세요"
                width="100%"
                allowEmpty={true}
              />
              <span style={{ fontSize: AppTextStyles.label2.fontSize, color: AppColors.onInput1 }}>
                현재 가격: {formatPrice(getCurrentBranchLockerPrice())}
              </span>
            </PriceInputGroup>
            <ModalButtons>
              <SecondaryButton onClick={() => setIsPriceSettingModalOpen(false)}>
                취소
              </SecondaryButton>
              <ActionButton 
                onClick={() => {
                  handlePriceSettingUpdate(tempPrice);
                }}
              >
                설정
              </ActionButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>

        {/* 라커 추가 모달 */}
        <ModalOverlay $isOpen={isAddModalOpen}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>라커 추가</ModalTitle>
            <PriceInputGroup>
              <label>추가할 라커 개수:</label>
              <NumberTextField
                value={addCount ?? ''}
                onChange={(value) => setAddCount(value)}
                placeholder="추가할 개수를 입력하세요"
                width="100%"
                allowEmpty={true}
              />
            </PriceInputGroup>
            <p>번호: {Math.max(...currentBranchLockers.map(l => parseInt(l.number)), 0) + 1}번부터 {Math.max(...currentBranchLockers.map(l => parseInt(l.number)), 0) + (addCount || 1)}번까지</p>
            <p>라커 가격: {formatPrice(getCurrentBranchLockerPrice())}</p>
            <ModalButtons>
              <SecondaryButton onClick={() => {
                setIsAddModalOpen(false);
                setAddCount(1);
              }}>
                취소
              </SecondaryButton>
              <ActionButton onClick={handleAddLockers}>
                {addCount || 1}개 추가
              </ActionButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>

        {/* 라커 배정 모달 */}
        <Modal
          isOpen={isAssignmentModalOpen}
          onClose={() => {
            setIsAssignmentModalOpen(false);
            setSelectedLockerForAssignment(null);
            setSelectedMember(null);
            setMemberPointBalance(0);
            setPointPayment(0);
            setReceivedAmount(0);
            setSearchQuery('');
            setSearchResults([]);
          }}
          width="min(95vw, 1000px)"
          header={`라커 ${selectedLockerForAssignment?.number}번 배정`}
          disableOutsideClick={true}
          body={
            <AssignmentModalContainer>
              <LeftPanel>
                <PanelTitle>회원 검색 및 선택</PanelTitle>
                
                {!selectedMember ? (
                  <>
                    <SearchInput
                      type="text"
                      placeholder="회원명, 전화번호, 이메일로 검색..."
                      value={searchQuery}
                      onChange={(e) => handleMemberSearch(e.target.value)}
                    />
                    
                    <SearchResults>
                      {searchResults.map((member) => (
                        <MemberItem
                          key={member.id}
                          $selected={false}
                          onClick={() => handleMemberSelect(member)}
                        >
                          <MemberName>{member.name}</MemberName>
                          <MemberInfo>
                            {member.phone && <div>전화: {member.phone}</div>}
                            {member.email && <div>이메일: {member.email}</div>}
                            {member.birth && <div>생년월일: {member.birth}</div>}
                          </MemberInfo>
                        </MemberItem>
                      ))}
                      
                      {searchQuery && searchResults.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: AppColors.onInput1 }}>
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </SearchResults>
                  </>
                ) : (
                  <SelectedMemberCard>
                    <SelectedMemberName>
                      {selectedMember.name}
                      <button 
                        onClick={() => {
                          setSelectedMember(null);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        style={{ 
                          float: 'right', 
                          background: 'none', 
                          border: 'none', 
                          fontSize: '14px', 
                          cursor: 'pointer',
                          color: AppColors.primary
                        }}
                      >
                        변경
                      </button>
                    </SelectedMemberName>
                    <SelectedMemberDetails>
                      {selectedMember.phone && <div>전화: {selectedMember.phone}</div>}
                      {selectedMember.email && <div>이메일: {selectedMember.email}</div>}
                      {selectedMember.birth && <div>생년월일: {selectedMember.birth}</div>}
                      {selectedMember.address && <div>주소: {selectedMember.address}</div>}
                    </SelectedMemberDetails>
                  </SelectedMemberCard>
                )}
              </LeftPanel>
              
              <RightPanel>
                <PanelTitle>라커 배정 정보</PanelTitle>
                
                {!selectedMember ? (
                  <WarningText>
                    먼저 왼쪽에서 회원을 선택해주세요.
                  </WarningText>
                ) : (
                  <>

                    <FormGroup>
                      <FormLabel>이용 기간</FormLabel>
                      <CustomDropdown
                        value={selectedMonths.toString()}
                        onChange={(value: string) => handleMonthsChange(parseInt(value))}
                        options={[
                          { value: '1', label: '1개월' },
                          { value: '2', label: '2개월' },
                          { value: '3', label: '3개월' },
                          { value: '4', label: '4개월' },
                          { value: '5', label: '5개월' },
                          { value: '6', label: '6개월' },
                          { value: '12', label: '12개월' }
                        ]}
                        inModal={true}
                      />
                    </FormGroup>

                    <FieldRow>
                      <FieldColumn>
                        <FormLabel>시작일</FormLabel>
                        <CustomDateInput
                          value={startDate}
                          onChange={handleStartDateChange}
                          placeholder="시작일을 선택하세요"
                        />
                      </FieldColumn>

                      <FieldColumn>
                        <FormLabel>종료일</FormLabel>
                        <CustomDateInput
                          value={endDate}
                          onChange={(value: string) => setEndDate(value)}
                          placeholder="종료일을 선택하세요"
                          min={startDate}
                        />
                      </FieldColumn>
                    </FieldRow>

                    <FormGroup>
                      <FormLabel>결제 방법</FormLabel>
                      <CustomDropdown
                        value={paymentMethod}
                        onChange={(value: string) => setPaymentMethod(value)}
                        options={[
                          { value: 'card', label: '카드' },
                          { value: 'cash', label: '현금' },
                          { value: 'transfer', label: '계좌이체' }
                        ]}
                        inModal={true}
                      />
                    </FormGroup>

                    <AmountDisplay>
                      <AmountText>총 결제 금액</AmountText>
                      <AmountValue>{formatPrice(getTotalAmount())}</AmountValue>
                      <div style={{ fontSize: AppTextStyles.label2.fontSize, color: AppColors.onInput1, marginTop: '8px' }}>
                        월 {formatPrice(getCurrentBranchLockerPrice())} × {selectedMonths}개월
                      </div>
                    </AmountDisplay>

                    {/* 포인트 결제 섹션 */}
                    <div style={{
                      background: `${AppColors.primary}10`,
                      border: `1px solid ${AppColors.primary}30`,
                      borderRadius: '8px',
                      padding: '16px',
                      margin: '16px 0'
                    }}>
                      <FormLabel>포인트 결제</FormLabel>
                      <InfoText>
                        사용 가능한 포인트: {memberPointBalance.toLocaleString()}원
                      </InfoText>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                        <NumberTextField
                          value={pointPayment || 0}
                          onChange={(value) => handlePointPaymentChange(value || 0)}
                          placeholder="포인트 사용 금액"
                          width="100%"
                          allowEmpty={true}
                        />
                        <button
                          onClick={handleUseAllPoints}
                          style={{
                            background: AppColors.primary,
                            color: AppColors.onPrimary,
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: AppTextStyles.body3.fontSize,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          전액 사용
                        </button>
                      </div>
                      {pointPayment > memberPointBalance && (
                        <InfoText style={{ color: '#d32f2f' }}>
                          포인트 잔액을 초과할 수 없습니다.
                        </InfoText>
                      )}
                    </div>

                    {/* 받은 금액 */}
                    <FormGroup>
                      <FormLabel>받은금액 (현금/카드)</FormLabel>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <NumberTextField
                          value={receivedAmount !== undefined ? receivedAmount : Math.max(0, getTotalAmount() - pointPayment)}
                          onChange={(value) => setReceivedAmount(value || 0)}
                          placeholder="받은 금액을 입력하세요"
                          width="100%"
                          allowEmpty={true}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cashAmount = Math.max(0, getTotalAmount() - pointPayment);
                            setReceivedAmount(cashAmount);
                          }}
                          style={{
                            minHeight: '48px',
                            padding: '14px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '12px',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#37bbd6';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(55, 187, 214, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#ddd';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          필요 금액으로 설정
                        </button>
                      </div>
                      {receivedAmount !== getTotalAmount() - pointPayment && (
                        <InfoText>
                          {receivedAmount > getTotalAmount() - pointPayment
                            ? (() => {
                                const excessAmount = receivedAmount - (getTotalAmount() - pointPayment);
                                let message = `초과금액: ${excessAmount.toLocaleString()}원 (포인트로 적립 예정)`;
                                
                                if (excessAmount >= 1000000) {
                                  const millionUnits = Math.floor(excessAmount / 1000000);
                                  const bonusPoints = millionUnits * 100000;
                                  message += ` + 보너스 ${bonusPoints.toLocaleString()}원`;
                                }
                                
                                return message;
                              })()
                            : `부족금액: ${((getTotalAmount() - pointPayment) - receivedAmount).toLocaleString()}원 (미수금으로 처리 예정)`
                          }
                        </InfoText>
                      )}
                    </FormGroup>

                    <div style={{ fontSize: AppTextStyles.body3.fontSize, color: AppColors.onInput1, textAlign: 'left' }}>
                      <div>시작일: {new Date(startDate).toLocaleDateString('ko-KR')}</div>
                      <div>종료일: {new Date(endDate).toLocaleDateString('ko-KR')}</div>
                      <div style={{ marginTop: '8px', color: AppColors.onInput2 }}>
                        총 이용 기간: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))}일
                      </div>
                    </div>
                  </>
                )}
              </RightPanel>
            </AssignmentModalContainer>
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <SecondaryButton onClick={() => {
                setIsAssignmentModalOpen(false);
                setSelectedLockerForAssignment(null);
                setSelectedMember(null);
                setMemberPointBalance(0);
                setPointPayment(0);
                setReceivedAmount(0);
                setSearchQuery('');
                setSearchResults([]);
                setStartDate(new Date().toISOString().split('T')[0]);
                const defaultEndDate = new Date();
                defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
                setEndDate(defaultEndDate.toISOString().split('T')[0]);
              }}>
                취소
              </SecondaryButton>
              <ActionButton 
                onClick={handleAssignLocker}
                disabled={!selectedMember}
              >
                라커 배정
              </ActionButton>
            </div>
          }
        />

        {/* 라커 상세/수정 모달 */}
        <Modal
          isOpen={!!selectedLocker}
          onClose={() => {
            setSelectedLocker(null);
            setIsEditMode(false);
            setEditMember(null);
            setEditSearchQuery('');
            setEditSearchResults([]);
            setEditMemo('');
          }}
          width="min(95vw, 600px)"
          header={`라커 ${selectedLocker?.number}번 ${isEditMode ? '수정' : '정보'}`}
          disableOutsideClick={true}
          body={
            selectedLocker && (
              <div style={{ padding: '8px 0' }}>
                {!isEditMode ? (
                  // 정보 표시 모드
                  <div>
                    <LockerInfoRow>
                      <LockerInfoItem>
                        <strong>상태:</strong>
                        <span>{selectedLocker ? getStatusText(selectedLocker.status) : ''}</span>
                      </LockerInfoItem>
                      <LockerInfoItem>
                        <strong>가격:</strong>
                        <span>{formatPrice(getCurrentBranchLockerPrice())}</span>
                      </LockerInfoItem>
                    </LockerInfoRow>
                    
                    {selectedLocker.userName && (
                      <>
                        <LockerInfoRow>
                          <LockerInfoItem>
                            <strong>사용자:</strong>
                            <span>{selectedLocker.userName}</span>
                          </LockerInfoItem>
                          <LockerInfoItem>
                            <strong>이용기간:</strong>
                            <span>{selectedLocker.months}개월</span>
                          </LockerInfoItem>
                        </LockerInfoRow>
                        
                        {selectedLocker.startDate && selectedLocker.endDate && (
                          <LockerInfoRow>
                            <LockerInfoItem>
                              <strong>시작일:</strong>
                              <span>{new Date(selectedLocker.startDate).toLocaleDateString('ko-KR')}</span>
                            </LockerInfoItem>
                            <LockerInfoItem>
                              <strong>종료일:</strong>
                              <span>{new Date(selectedLocker.endDate).toLocaleDateString('ko-KR')}</span>
                            </LockerInfoItem>
                          </LockerInfoRow>
                        )}
                      </>
                    )}
                    
                    {selectedLocker.changeHistory && selectedLocker.changeHistory.length > 0 && (
                      <div style={{ marginTop: '20px', textAlign: 'left' }}>
                        <strong>수정 이력:</strong>
                        <div style={{ 
                          marginTop: '8px',
                          padding: '12px',
                          backgroundColor: AppColors.surface,
                          borderRadius: '6px',
                          border: `1px solid ${AppColors.borderLight}`,
                          maxHeight: '200px',
                          overflowY: 'auto',
                          textAlign: 'left'
                        }}>
                          {selectedLocker.changeHistory.map((history, index) => (
                            <div 
                              key={index} 
                              style={{ 
                                fontSize: AppTextStyles.body3.fontSize,
                                color: AppColors.onInput1,
                                marginBottom: index < selectedLocker.changeHistory!.length - 1 ? '12px' : '0',
                                paddingBottom: index < selectedLocker.changeHistory!.length - 1 ? '12px' : '0',
                                borderBottom: index < selectedLocker.changeHistory!.length - 1 ? `1px solid ${AppColors.borderLight}` : 'none',
                                whiteSpace: 'pre-line',
                                textAlign: 'left'
                              }}
                            >
                              {history}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // 수정 모드
                  <div>
                    <FormGroup>
                      <FormLabel>사용자 변경</FormLabel>
                      {!editMember ? (
                        <>
                          <SearchInput
                            type="text"
                            placeholder="회원명, 전화번호, 이메일로 검색..."
                            value={editSearchQuery}
                            onChange={(e) => handleEditMemberSearch(e.target.value)}
                          />
                          
                          {editSearchResults.length > 0 && (
                            <SearchResults style={{ maxHeight: '150px' }}>
                              {editSearchResults.map((member) => (
                                <MemberItem
                                  key={member.id}
                                  $selected={false}
                                  onClick={() => handleEditMemberSelect(member)}
                                >
                                  <MemberName>{member.name}</MemberName>
                                  <MemberInfo>
                                    {member.phone && <div>전화: {member.phone}</div>}
                                    {member.email && <div>이메일: {member.email}</div>}
                                  </MemberInfo>
                                </MemberItem>
                              ))}
                            </SearchResults>
                          )}
                        </>
                      ) : (
                        <SelectedMemberCard>
                          <SelectedMemberName>
                            {editMember.name}
                            <button 
                              onClick={() => {
                                setEditMember(null);
                                setEditSearchQuery('');
                                setEditSearchResults([]);
                              }}
                              style={{ 
                                float: 'right', 
                                background: 'none', 
                                border: 'none', 
                                fontSize: '14px', 
                                cursor: 'pointer',
                                color: AppColors.primary
                              }}
                            >
                              변경
                            </button>
                          </SelectedMemberName>
                          <SelectedMemberDetails>
                            {editMember.phone && <div>전화: {editMember.phone}</div>}
                            {editMember.email && <div>이메일: {editMember.email}</div>}
                          </SelectedMemberDetails>
                        </SelectedMemberCard>
                      )}
                    </FormGroup>

                    <FormGroup>
                      <FormLabel>이용 기간</FormLabel>
                      <CustomDropdown
                        value={editMonths.toString()}
                        onChange={(value: string) => handleEditMonthsChange(parseInt(value))}
                        options={[
                          { value: '1', label: '1개월' },
                          { value: '2', label: '2개월' },
                          { value: '3', label: '3개월' },
                          { value: '4', label: '4개월' },
                          { value: '5', label: '5개월' },
                          { value: '6', label: '6개월' },
                          { value: '12', label: '12개월' }
                        ]}
                        inModal={true}
                      />
                    </FormGroup>

                    <FieldRow>
                      <FieldColumn>
                        <FormLabel>시작일</FormLabel>
                        <CustomDateInput
                          value={editStartDate}
                          onChange={handleEditStartDateChange}
                          placeholder="시작일을 선택하세요"
                        />
                      </FieldColumn>

                      <FieldColumn>
                        <FormLabel>종료일</FormLabel>
                        <CustomDateInput
                          value={editEndDate}
                          onChange={(value: string) => setEditEndDate(value)}
                          placeholder="종료일을 선택하세요"
                          min={editStartDate}
                        />
                      </FieldColumn>
                    </FieldRow>

                    <FormGroup>
                      <FormLabel>수정 사유 (필수)</FormLabel>
                      <textarea
                        value={editMemo}
                        onChange={(e) => setEditMemo(e.target.value)}
                        placeholder="수정 사유를 입력해주세요"
                        style={{
                          width: '100%',
                          height: '80px',
                          padding: '8px 12px',
                          border: `1px solid ${AppColors.borderLight}`,
                          borderRadius: '6px',
                          backgroundColor: AppColors.surface,
                          color: AppColors.onSurface,
                          fontSize: AppTextStyles.body2.fontSize,
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      />
                    </FormGroup>

                    {editMember && editStartDate && editEndDate && (
                      <AmountDisplay>
                        <AmountText>수정 후 정보</AmountText>
                        <div style={{ fontSize: AppTextStyles.body2.fontSize, color: AppColors.onSurface }}>
                          <div>사용자: {editMember.name}</div>
                          <div>기간: {new Date(editStartDate).toLocaleDateString('ko-KR')} ~ {new Date(editEndDate).toLocaleDateString('ko-KR')}</div>
                          <div>이용기간: {editMonths}개월</div>
                        </div>
                      </AmountDisplay>
                    )}
                  </div>
                )}
              </div>
            )
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <SecondaryButton onClick={() => {
                if (isEditMode) {
                  setIsEditMode(false);
                  setEditMember(null);
                  setEditSearchQuery('');
                  setEditSearchResults([]);
                  setEditMemo('');
                } else {
                  setSelectedLocker(null);
                }
              }}>
                {isEditMode ? '취소' : '닫기'}
              </SecondaryButton>
              
              {selectedLocker && hasPermission && canEditBranch(selectedLocker.branchId) && selectedLocker.status === 'occupied' && !isEditMode && (
                <>
                  <ActionButton 
                    onClick={async () => {
                      setIsEditMode(true);
                      await initializeEditData(selectedLocker);
                    }}
                  >
                    수정
                  </ActionButton>
                  <ActionButton 
                    onClick={() => {
                      handleUnassignLocker(selectedLocker);
                      setSelectedLocker(null);
                    }}
                    style={{ backgroundColor: AppColors.warning }}
                  >
                    라커 해제
                  </ActionButton>
                </>
              )}
              
              {selectedLocker && hasPermission && canEditBranch(selectedLocker.branchId) && selectedLocker.status !== 'occupied' && !isEditMode && (
                <>
                  <ActionButton 
                    onClick={() => {
                      handleToggleMaintenance(selectedLocker);
                      setSelectedLocker(null);
                    }}
                  >
                    {selectedLocker.status === 'maintenance' ? '점검 완료' : '점검중으로 변경'}
                  </ActionButton>
                  {selectedLocker.status === 'available' && (
                    <ActionButton 
                      onClick={() => {
                        handleDeleteLocker(selectedLocker);
                        setSelectedLocker(null);
                      }}
                      style={{ backgroundColor: AppColors.error }}
                    >
                      삭제
                    </ActionButton>
                  )}
                </>
              )}
              
              {isEditMode && (
                <ActionButton 
                  onClick={handleUpdateLocker}
                  disabled={!editMember || !editMemo.trim()}
                >
                  수정 완료
                </ActionButton>
              )}
            </div>
          }
        />
      </Content>
    </Container>
  );
};

export default LockerManagement;
