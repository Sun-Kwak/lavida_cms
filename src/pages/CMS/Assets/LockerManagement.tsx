import React, { useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, type Branch, type Member, type Locker } from '../../../utils/indexedDB';
import CustomDropdown from '../../../components/CustomDropdown';
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
  padding: 24px;
  border-radius: 12px;
  border: 1px solid ${AppColors.borderLight};
  min-width: 300px;
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
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const LockerItem = styled.div<{ $status: 'available' | 'occupied' | 'maintenance' | 'pending' }>`
  aspect-ratio: 1;
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

const PriceInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 6px;
  background-color: ${AppColors.surface};
  color: ${AppColors.onSurface};
  font-size: ${AppTextStyles.body2.fontSize};

  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
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
  gap: 24px;
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
  const [addCount, setAddCount] = useState<number>(1);
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [isPriceSettingModalOpen, setIsPriceSettingModalOpen] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // 라커 배정 관련 상태
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedLockerForAssignment, setSelectedLockerForAssignment] = useState<Locker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');

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
        await dbManager.unassignLocker(locker.id);
        
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
      setSearchQuery('');
      setSearchResults([]);
      setSelectedMonths(1);
      setPaymentMethod('card');
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
        member.isActive && (
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
  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setSearchQuery(member.name);
    setSearchResults([]);
  };

  // 라커 배정 처리 함수
  const handleAssignLocker = async () => {
    if (!selectedMember || !selectedLockerForAssignment) {
      toast.warning('회원과 라커를 선택해주세요.');
      return;
    }

    try {
      const monthlyPrice = getCurrentBranchLockerPrice();
      const totalAmount = monthlyPrice * selectedMonths;
      
      // 결제 정보를 결제 이력에 추가
      const paymentData = {
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        branchId: selectedLockerForAssignment.branchId,
        branchName: selectedLockerForAssignment.branchName,
        coach: selectedMember.coach,
        coachName: selectedMember.coachName,
        products: [{
          id: `locker_${selectedLockerForAssignment.id}`,
          name: `라커 ${selectedLockerForAssignment.number}번 (${selectedMonths}개월)`,
          price: totalAmount,
          quantity: 1,
          description: `라커 ${selectedLockerForAssignment.number}번 ${selectedMonths}개월 이용`
        }],
        totalAmount: totalAmount,
        paidAmount: totalAmount,
        unpaidAmount: 0,
        paymentStatus: 'completed' as const,
        paymentMethod: paymentMethod,
        paymentDate: new Date(),
        paymentType: 'asset' as const,
        memo: `라커 ${selectedLockerForAssignment.number}번 배정`
      };

      // 결제 정보 저장
      const paymentId = await dbManager.addPayment(paymentData);
      console.log('결제 정보 저장 완료:', paymentId);

      // 라커 배정
      await dbManager.assignLockerToUser(
        selectedLockerForAssignment.id,
        selectedMember.id,
        selectedMember.name,
        selectedMonths,
        paymentId
      );

      // 라커 목록 새로고침
      await loadLockers();

      setIsAssignmentModalOpen(false);
      setSelectedLockerForAssignment(null);
      setSelectedMember(null);
      
      toast.success(`라커 ${selectedLockerForAssignment.number}번이 ${selectedMember.name}님에게 배정되었습니다.`);
    } catch (error) {
      console.error('라커 배정 실패:', error);
      toast.error('라커 배정 중 오류가 발생했습니다.');
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

  const handlePriceSettingUpdate = async (newPrice: number) => {
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
              <LockerPrice>
                {formatPrice(getCurrentBranchLockerPrice())}
              </LockerPrice>
            </LockerItem>
          ))}
        </LockerGrid>

        {/* 지점별 라커 가격 설정 모달 */}
        <ModalOverlay $isOpen={isPriceSettingModalOpen}>
          <ModalContent>
            <ModalTitle>
              {branches.find(b => b.id === selectedBranch)?.name} 라커 가격 설정
            </ModalTitle>
            <PriceInputGroup>
              <label>라커 가격:</label>
              <PriceInput
                type="number"
                min="0"
                step="1000"
                defaultValue={getCurrentBranchLockerPrice()}
                placeholder="가격을 입력하세요"
                id="branchPriceInput"
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
                  const input = document.getElementById('branchPriceInput') as HTMLInputElement;
                  const newPrice = parseInt(input.value) || 0;
                  handlePriceSettingUpdate(newPrice);
                }}
              >
                설정
              </ActionButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>

        {/* 라커 추가 모달 */}
        <ModalOverlay $isOpen={isAddModalOpen}>
          <ModalContent>
            <ModalTitle>라커 추가</ModalTitle>
            <PriceInputGroup>
              <label>추가할 라커 개수:</label>
              <PriceInput
                type="number"
                min="1"
                max="50"
                value={addCount}
                onChange={(e) => setAddCount(parseInt(e.target.value) || 1)}
                placeholder="추가할 개수를 입력하세요"
              />
            </PriceInputGroup>
            <p>번호: {Math.max(...currentBranchLockers.map(l => parseInt(l.number)), 0) + 1}번부터 {Math.max(...currentBranchLockers.map(l => parseInt(l.number)), 0) + addCount}번까지</p>
            <p>라커 가격: {formatPrice(getCurrentBranchLockerPrice())}</p>
            <ModalButtons>
              <SecondaryButton onClick={() => {
                setIsAddModalOpen(false);
                setAddCount(1);
              }}>
                취소
              </SecondaryButton>
              <ActionButton onClick={handleAddLockers}>
                {addCount}개 추가
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
            setSearchQuery('');
            setSearchResults([]);
          }}
          width="min(95vw, 1000px)"
          header={`라커 ${selectedLockerForAssignment?.number}번 배정`}
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
                      <FormLabel>라커 번호</FormLabel>
                      <PriceInput
                        type="text"
                        value={selectedLockerForAssignment?.number || ''}
                        readOnly
                        style={{ backgroundColor: AppColors.borderLight }}
                      />
                    </FormGroup>

                    <FormGroup>
                      <FormLabel>이용 기간</FormLabel>
                      <CustomDropdown
                        value={selectedMonths.toString()}
                        onChange={(value: string) => setSelectedMonths(parseInt(value))}
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

                    <div style={{ fontSize: AppTextStyles.body3.fontSize, color: AppColors.onInput1, textAlign: 'left' }}>
                      <div>시작일: {new Date().toLocaleDateString('ko-KR')}</div>
                      <div>종료일: {new Date(Date.now() + selectedMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}</div>
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
                setSearchQuery('');
                setSearchResults([]);
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

        {/* 라커 상세 모달 */}
        <ModalOverlay $isOpen={!!selectedLocker}>
          <ModalContent>
            <ModalTitle>라커 {selectedLocker?.number}번</ModalTitle>
            <p>상태: {selectedLocker ? getStatusText(selectedLocker.status) : ''}</p>
            <p>가격: {formatPrice(getCurrentBranchLockerPrice())}</p>
            {selectedLocker?.userName && (
              <>
                <p>사용자: {selectedLocker.userName}</p>
                {selectedLocker.startDate && <p>시작일: {selectedLocker.startDate}</p>}
                {selectedLocker.endDate && <p>종료일: {selectedLocker.endDate}</p>}
                {selectedLocker.months && <p>이용기간: {selectedLocker.months}개월</p>}
              </>
            )}
            <ModalButtons>
              <SecondaryButton onClick={() => setSelectedLocker(null)}>
                닫기
              </SecondaryButton>
              {selectedLocker && hasPermission && canEditBranch(selectedLocker.branchId) && selectedLocker.status === 'occupied' && (
                <ActionButton 
                  onClick={() => {
                    handleUnassignLocker(selectedLocker);
                    setSelectedLocker(null);
                  }}
                  style={{ backgroundColor: AppColors.warning }}
                >
                  라커 해제
                </ActionButton>
              )}
              {selectedLocker && hasPermission && canEditBranch(selectedLocker.branchId) && selectedLocker.status !== 'occupied' && (
                <ActionButton 
                  onClick={() => {
                    handleToggleMaintenance(selectedLocker);
                    setSelectedLocker(null);
                  }}
                >
                  {selectedLocker.status === 'maintenance' ? '점검 완료' : '점검중으로 변경'}
                </ActionButton>
              )}
              {selectedLocker && hasPermission && canEditBranch(selectedLocker.branchId) && selectedLocker.status === 'available' && (
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
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      </Content>
    </Container>
  );
};

export default LockerManagement;
