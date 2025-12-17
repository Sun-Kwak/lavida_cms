import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, type Branch, type Member } from '../../../utils/indexedDB';
import CustomDropdown from '../../../components/CustomDropdown';
import NumberTextField from '../../../components/NumberTextField';
import Modal from '../../../components/Modal';
import { SYSTEM_ADMIN_CONFIG } from '../../../constants/staffConstants';

// 신발 색상과 사이즈 상수
const SHOE_COLORS = ['화이트', '아이보리', '블랙'] as const;
const SHOE_SIZES = ['35', '36', '37', '38', '39', '40'] as const;

type ShoeColor = typeof SHOE_COLORS[number];
type ShoeSize = typeof SHOE_SIZES[number];

// 신발 재고 타입
interface ShoesInventory {
  id: string;
  branchId: string;
  color: ShoeColor;
  size: ShoeSize;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

// 신발 입출고 거래 타입
interface ShoesTransaction {
  id: string;
  branchId: string;
  color: ShoeColor;
  size: ShoeSize;
  type: 'in' | 'out'; // 입고 또는 출고
  quantity: number;
  memberId?: string; // 출고 시 고객 ID
  memberName?: string; // 출고 시 고객명
  memo?: string; // 비고
  price?: number; // 출고 시 대여료
  createdAt: Date;
  createdBy: string; // 처리한 직원 ID
}

// 신발 금액 설정 타입
interface ShoesPrice {
  branchId: string;
  price: number;
  updatedAt: Date;
  updatedBy: string;
}

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

// 상단 컨트롤 섹션
const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 24px;
`;

const BranchSelection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background-color: ${AppColors.primary};
  color: ${AppColors.onPrimary};
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;

  &:hover {
    background-color: ${AppColors.secondary};
    transform: translateY(-1px);
  }

  &:disabled {
    background-color: ${AppColors.borderLight};
    color: ${AppColors.onInput2};
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled(ActionButton)`
  background-color: ${AppColors.surface};
  color: ${AppColors.primary};
  border: 1px solid ${AppColors.primary};

  &:hover {
    background-color: ${AppColors.primary}15;
  }
`;

// 재고 요약 섹션
const InventorySummary = styled.div`
  margin-bottom: 32px;
`;

const SummaryTitle = styled.h2`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin-bottom: 24px;
`;

const ColorRowContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 32px;
`;

const ColorColumn = styled.div`
  flex: 1;
  background-color: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 12px;
  padding: 20px;
`;

const ColorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${AppColors.borderLight};
`;

const ColorTitle = styled.h3`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0;
`;

const ColorTotalStock = styled.span`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onInput1};
  font-weight: 500;
  margin-left: auto;
`;

const SizeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SizeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
`;

const SizeLabel = styled.div`
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 500;
  color: ${AppColors.onSurface};
`;

const SizeQuantity = styled.div<{ $hasStock: boolean }>`
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 600;
  color: ${props => props.$hasStock ? AppColors.primary : AppColors.onInput2};
  min-width: 30px;
  text-align: right;
`;

const ColorDot = styled.div<{ $color: ShoeColor }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.$color) {
      case '화이트': return '#FFFFFF';
      case '아이보리': return '#F5F5DC';
      case '블랙': return '#000000';
      default: return AppColors.borderLight;
    }
  }};
  border: 1px solid ${AppColors.borderLight};
`;

// 거래 내역 테이블
const TransactionHistory = styled.div`
  margin-top: 32px;
`;

const TableContainer = styled.div`
  background-color: ${AppColors.surface};
  border-radius: 12px;
  border: 1px solid ${AppColors.borderLight};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  background-color: ${AppColors.primary}10;
  padding: 16px 20px;
  text-align: left;
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  border-bottom: 1px solid ${AppColors.borderLight};
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: ${AppColors.background};
  }

  &:hover {
    background-color: ${AppColors.primary}05;
  }
`;

const TableCell = styled.td`
  padding: 16px 20px;
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onSurface};
  border-bottom: 1px solid ${AppColors.borderLight};
`;

const TransactionType = styled.span<{ $type: 'in' | 'out' }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 600;
  background-color: ${props => props.$type === 'in' ? AppColors.success : AppColors.error}15;
  color: ${props => props.$type === 'in' ? AppColors.success : AppColors.error};
`;

// 모달 관련 스타일
const ModalContent = styled.div`
  padding: 8px 0;
`;

const OutModalContent = styled.div`
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

const FieldRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
`;

const FieldColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

const FieldLabel = styled.label`
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
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
  max-height: 300px;
  min-height: 200px;
  
  /* 스크롤바 숨기기 */
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
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
`;

const MemberInfo = styled.div`
  font-size: ${AppTextStyles.label2.fontSize};
  opacity: 0.8;
  margin-top: 4px;
`;

const ProductDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  font-size: ${AppTextStyles.body2.fontSize};
  resize: vertical;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
    box-shadow: 0 0 0 2px ${AppColors.primary}20;
  }
`;

// 라디오 버튼 스타일
const ColorRadioGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${AppColors.primary}10;
  }
`;

const RadioInput = styled.input`
  width: 16px;
  height: 16px;
  accent-color: ${AppColors.primary};
  cursor: pointer;
`;

const RadioLabel = styled.span`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onSurface};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SizeDropdownContainer = styled.div`
  margin-bottom: 16px;
`;

const StockInfo = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background-color: ${AppColors.primary}10;
  border-radius: 6px;
  font-size: ${AppTextStyles.label2.fontSize};
  color: ${AppColors.primary};
  font-weight: 600;
`;

// 금액 설정 버튼
const PriceSettingButton = styled.button`
  padding: 8px 12px;
  border: 1px solid ${AppColors.primary};
  border-radius: 6px;
  background-color: ${AppColors.surface};
  color: ${AppColors.primary};
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 12px;

  &:hover {
    background-color: ${AppColors.primary}10;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PriceDisplay = styled.span`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onSurface};
  font-weight: 500;
`;

const ShoesManagement: React.FC = () => {
  // 상태 관리
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [inventory, setInventory] = useState<ShoesInventory[]>([]);
  const [transactions, setTransactions] = useState<ShoesTransaction[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);

  // 입고 모달 상태
  const [showInModal, setShowInModal] = useState(false);
  const [inModalData, setInModalData] = useState({
    color: undefined as ShoeColor | undefined,
    size: undefined as ShoeSize | undefined,
    quantity: undefined as number | undefined
  });

  // 출고 모달 상태
  const [showOutModal, setShowOutModal] = useState(false);
  const [outModalData, setOutModalData] = useState({
    selectedColor: undefined as ShoeColor | undefined,
    selectedSize: undefined as ShoeSize | undefined,
    quantity: undefined as number | undefined,
    selectedProduct: null as { color: ShoeColor; size: ShoeSize; quantity: number } | null,
    selectedMember: null as Member | null,
    memo: ''
  });

  // 결제 관련 상태
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [memberPointBalance, setMemberPointBalance] = useState(0);
  const [pointPayment, setPointPayment] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState<number | undefined>(undefined);

  // 고객 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);

  // 금액 설정 상태
  const [shoesPrices, setShoesPrices] = useState<ShoesPrice[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<number | undefined>(35000);

  // 출고 모달 초기화 함수
  const resetOutModal = () => {
    setShowOutModal(false);
    setOutModalData({ 
      selectedColor: undefined,
      selectedSize: undefined,
      quantity: undefined, // 초기화 시에는 undefined
      selectedProduct: null, 
      selectedMember: null, 
      memo: '' 
    });
    setSearchQuery('');
    setSearchResults([]);
    setPaymentMethod('card');
    setMemberPointBalance(0);
    setPointPayment(0);
    setReceivedAmount(undefined);
  };

  // 데이터 로딩
  useEffect(() => {
    loadBranches();
    checkPermission();
    loadShoesPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadInventory();
      loadTransactions();
      // 현재 지점의 금액으로 설정
      setEditingPrice(getCurrentBranchPrice());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, shoesPrices]);

  // 권한 확인
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

      // MASTER 권한 또는 시스템 관리자, 또는 EDITOR 권한만 신발 관리 가능
      const isMaster = user.permission === 'MASTER';
      const isSystemAdmin = adminId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
      const isEditor = user.permission === 'EDITOR';
      
      setHasPermission(isMaster || isSystemAdmin || isEditor);

      // EDITOR인 경우 본인 지점으로 자동 설정
      if (isEditor && user.branchId) {
        setSelectedBranchId(user.branchId);
      }
    } catch (error) {
      console.error('권한 확인 실패:', error);
      setHasPermission(false);
    }
  };

  // 지점 데이터 로딩
  const loadBranches = async () => {
    try {
      const branchData = await dbManager.getAllBranches();
      setBranches(branchData);
      
      if (branchData.length > 0 && !selectedBranchId) {
        setSelectedBranchId(branchData[0].id);
      }
    } catch (error) {
      console.error('지점 데이터 로딩 실패:', error);
      toast.error('지점 데이터를 불러오는데 실패했습니다.');
    }
  };

  // 재고 데이터 로딩 (임시로 로컬 스토리지 사용)
  const loadInventory = () => {
    try {
      const storedInventory = localStorage.getItem('shoesInventory');
      const inventoryData: ShoesInventory[] = storedInventory ? JSON.parse(storedInventory) : [];
      setInventory(inventoryData.filter(item => item.branchId === selectedBranchId));
    } catch (error) {
      console.error('재고 데이터 로딩 실패:', error);
      setInventory([]);
    }
  };

  // 거래 내역 로딩 (임시로 로컬 스토리지 사용)
  const loadTransactions = () => {
    try {
      const storedTransactions = localStorage.getItem('shoesTransactions');
      const transactionData: ShoesTransaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
      setTransactions(transactionData.filter(item => item.branchId === selectedBranchId));
    } catch (error) {
      console.error('거래 내역 로딩 실패:', error);
      setTransactions([]);
    }
  };

  // 색상별 재고 데이터 생성
  const getInventoryByColor = () => {
    return SHOE_COLORS.map(color => {
      const sizes = SHOE_SIZES.map(size => {
        const item = inventory.find(inv => inv.color === color && inv.size === size);
        return {
          size,
          quantity: item?.quantity || 0
        };
      });
      
      const totalStock = sizes.reduce((sum, size) => sum + size.quantity, 0);
      
      return {
        color,
        sizes,
        totalStock
      };
    });
  };

  // 선택된 색상의 사이즈 옵션 가져오기 (재고가 있는 것만)
  const getAvailableSizeOptions = (selectedColor: ShoeColor) => {
    if (!selectedColor) return [];
    
    return SHOE_SIZES
      .map(size => {
        const item = inventory.find(inv => inv.color === selectedColor && inv.size === size);
        return {
          value: size,
          label: `${size} (재고: ${item?.quantity || 0}개)`,
          quantity: item?.quantity || 0
        };
      })
      .filter(option => option.quantity > 0);
  };

  // 선택된 상품의 재고 수량 가져오기
  const getSelectedProductQuantity = () => {
    if (!outModalData.selectedColor || !outModalData.selectedSize) return 0;
    
    const item = inventory.find(
      inv => inv.color === outModalData.selectedColor && 
             inv.size === outModalData.selectedSize
    );
    return item?.quantity || 0;
  };

  // 금액 데이터 로딩
  const loadShoesPrices = () => {
    try {
      const storedPrices = localStorage.getItem('shoesPrices');
      const pricesData: ShoesPrice[] = storedPrices ? JSON.parse(storedPrices) : [];
      setShoesPrices(pricesData);
    } catch (error) {
      console.error('금액 데이터 로딩 실패:', error);
      setShoesPrices([]);
    }
  };

  // 현재 지점의 금액 가져오기
  const getCurrentBranchPrice = () => {
    if (!selectedBranchId) return 35000;
    
    const branchPrice = shoesPrices.find(price => price.branchId === selectedBranchId);
    return branchPrice?.price || 35000;
  };

  // 금액 저장
  const saveShoesPrice = async () => {
    try {
      if (!editingPrice || editingPrice <= 0) {
        toast.error('올바른 금액을 입력해주세요.');
        return;
      }

      const adminId = sessionStorage.getItem('adminId') || '';
      const now = new Date();
      
      const storedPrices = localStorage.getItem('shoesPrices');
      const pricesData: ShoesPrice[] = storedPrices ? JSON.parse(storedPrices) : [];
      
      const existingIndex = pricesData.findIndex(price => price.branchId === selectedBranchId);
      
      if (existingIndex >= 0) {
        pricesData[existingIndex] = {
          branchId: selectedBranchId,
          price: editingPrice,
          updatedAt: now,
          updatedBy: adminId
        };
      } else {
        pricesData.push({
          branchId: selectedBranchId,
          price: editingPrice,
          updatedAt: now,
          updatedBy: adminId
        });
      }
      
      localStorage.setItem('shoesPrices', JSON.stringify(pricesData));
      setShoesPrices(pricesData);
      setShowPriceModal(false);
      
      toast.success('금액이 저장되었습니다.');
    } catch (error) {
      console.error('금액 저장 실패:', error);
      toast.error('금액 저장에 실패했습니다.');
    }
  };

  // 회원 포인트 잔액 조회
  const loadMemberPointBalance = async (memberId: string) => {
    try {
      const balance = await dbManager.getMemberPointBalance(memberId);
      setMemberPointBalance(balance);
    } catch (error) {
      console.error('포인트 잔액 조회 실패:', error);
      setMemberPointBalance(0);
    }
  };

  // 총 결제 금액 계산
  const getTotalSaleAmount = () => {
    if (!outModalData.selectedProduct) return 0;
    const currentPrice = shoesPrices.find(price => price.branchId === selectedBranchId)?.price || 35000;
    return currentPrice * (outModalData.quantity || 1);
  };

  // 포인트 사용 금액 변경 처리
  const handlePointPaymentChange = (value: number) => {
    const maxUsable = Math.min(memberPointBalance, getTotalSaleAmount());
    const finalValue = Math.min(value, maxUsable);
    setPointPayment(finalValue);
  };

  // 전체 포인트 사용
  const handleUseAllPoints = () => {
    const maxUsable = Math.min(memberPointBalance, getTotalSaleAmount());
    setPointPayment(maxUsable);
  };

  // 고객 검색 (선택된 지점의 회원만)
  const searchMembers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const members = await dbManager.getAllMembers();
      const filtered = members.filter(member =>
        member.isActive &&
        member.branchId === selectedBranchId && // 선택된 지점의 회원만
        (
          member.name.toLowerCase().includes(query.toLowerCase()) ||
          member.phone?.includes(query) ||
          member.email?.toLowerCase().includes(query.toLowerCase())
        )
      );
      setSearchResults(filtered.slice(0, 10));
    } catch (error) {
      console.error('고객 검색 실패:', error);
      setSearchResults([]);
    }
  };

  // 입고 처리
  const handleStockIn = async () => {
    try {
      if (!inModalData.color || !inModalData.size || !inModalData.quantity || inModalData.quantity <= 0) {
        toast.error('모든 필드를 올바르게 입력해주세요.');
        return;
      }

      const adminId = sessionStorage.getItem('adminId') || '';
      const now = new Date();

      // 거래 기록 추가
      const transaction: ShoesTransaction = {
        id: Date.now().toString(),
        branchId: selectedBranchId, // 페이지에서 선택된 지점 사용
        color: inModalData.color,
        size: inModalData.size,
        type: 'in',
        quantity: inModalData.quantity,
        createdAt: now,
        createdBy: adminId
      };

      // 재고 업데이트
      const storedInventory = localStorage.getItem('shoesInventory');
      const inventoryData: ShoesInventory[] = storedInventory ? JSON.parse(storedInventory) : [];
      
      const existingIndex = inventoryData.findIndex(
        item => item.branchId === selectedBranchId && 
                item.color === inModalData.color && 
                item.size === inModalData.size
      );

      if (existingIndex >= 0) {
        inventoryData[existingIndex].quantity += inModalData.quantity;
        inventoryData[existingIndex].updatedAt = now;
      } else {
        inventoryData.push({
          id: Date.now().toString(),
          branchId: selectedBranchId, // 페이지에서 선택된 지점 사용
          color: inModalData.color,
          size: inModalData.size,
          quantity: inModalData.quantity,
          createdAt: now,
          updatedAt: now
        });
      }

      // 거래 기록 저장
      const storedTransactions = localStorage.getItem('shoesTransactions');
      const transactionData: ShoesTransaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
      transactionData.unshift(transaction);

      localStorage.setItem('shoesInventory', JSON.stringify(inventoryData));
      localStorage.setItem('shoesTransactions', JSON.stringify(transactionData));

      toast.success('입고 처리가 완료되었습니다.');
      setShowInModal(false);
      setInModalData({ color: undefined, size: undefined, quantity: undefined });
      loadInventory();
      loadTransactions();
    } catch (error) {
      console.error('입고 처리 실패:', error);
      toast.error('입고 처리 중 오류가 발생했습니다.');
    }
  };

  // 출고 처리
  const handleStockOut = async () => {
    try {
      if (!outModalData.selectedProduct || !outModalData.selectedMember) {
        toast.error('상품과 고객을 모두 선택해주세요.');
        return;
      }

      const { selectedProduct, selectedMember } = outModalData;
      const outQuantity = outModalData.quantity || 1; // 출고 수량
      
      if (selectedProduct.quantity < outQuantity) {
        toast.error(`재고가 부족합니다. (현재 재고: ${selectedProduct.quantity}개)`);
        return;
      }

      const adminId = sessionStorage.getItem('adminId') || '';
      const now = new Date();

      // 현재 지점의 신발 가격 가져오기 (설정되지 않은 경우 35000원 기본값 사용)
      const currentPrice = shoesPrices.find(price => price.branchId === selectedBranchId)?.price || 35000;
      const totalPrice = currentPrice * outQuantity;

      // 거래 기록 추가
      const transaction: ShoesTransaction = {
        id: Date.now().toString(),
        branchId: selectedBranchId, // 페이지에서 선택된 지점 사용
        color: selectedProduct.color,
        size: selectedProduct.size,
        type: 'out',
        quantity: outQuantity,
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        memo: outModalData.memo,
        price: totalPrice, // 총 금액 저장
        createdAt: now,
        createdBy: adminId
      };

      // 재고 업데이트
      const storedInventory = localStorage.getItem('shoesInventory');
      const inventoryData: ShoesInventory[] = storedInventory ? JSON.parse(storedInventory) : [];
      
      const existingIndex = inventoryData.findIndex(
        item => item.branchId === selectedBranchId && 
                item.color === selectedProduct.color && 
                item.size === selectedProduct.size
      );

      if (existingIndex >= 0) {
        inventoryData[existingIndex].quantity -= outQuantity;
        inventoryData[existingIndex].updatedAt = now;
      }

      // 거래 기록 저장
      const storedTransactions = localStorage.getItem('shoesTransactions');
      const transactionData: ShoesTransaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
      transactionData.unshift(transaction);

      localStorage.setItem('shoesInventory', JSON.stringify(inventoryData));
      localStorage.setItem('shoesTransactions', JSON.stringify(transactionData));

      // 결제 이력 DB에 저장
      if (totalPrice > 0) {
        try {
          // 결제 정보 설정
          const actualReceivedAmount = receivedAmount !== undefined ? receivedAmount : Math.max(0, getTotalSaleAmount() - pointPayment);
          const payments = {
            cash: paymentMethod === 'cash' ? actualReceivedAmount : 0,
            card: paymentMethod === 'card' ? actualReceivedAmount : 0,
            transfer: paymentMethod === 'transfer' ? actualReceivedAmount : 0,
            points: pointPayment
          };

          await dbManager.processOrderWithPayments({
            memberInfo: {
              id: selectedMember.id,
              name: selectedMember.name,
              branchId: selectedBranchId,
              branchName: branches.find(b => b.id === selectedBranchId)?.name || '',
              coach: selectedMember.coach || '',
              coachName: selectedMember.coachName || ''
            },
            products: [{
              id: `shoes_${selectedProduct.color}_${selectedProduct.size}`,
              name: `신발 ${selectedProduct.color} ${selectedProduct.size} (${outQuantity}개)`,
              price: totalPrice,
              programId: 'shoes',
              programName: '신발 판매',
              programType: 'product'
            }],
            payments,
            orderType: 'asset_assignment'
          });
        } catch (paymentError) {
          console.error('결제 이력 저장 실패:', paymentError);
          // 결제 이력 저장 실패해도 출고 처리는 완료된 것으로 처리
        }
      }

      toast.success('출고 처리가 완료되었습니다.');
      setShowOutModal(false);
      setOutModalData({ 
        selectedColor: undefined, 
        selectedSize: undefined, 
        quantity: undefined, 
        selectedProduct: null, 
        selectedMember: null, 
        memo: '' 
      });
      setSearchQuery('');
      setSearchResults([]);
      loadInventory();
      loadTransactions();
    } catch (error) {
      console.error('출고 처리 실패:', error);
      toast.error('출고 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <Container>
      <Title>신발 관리</Title>
      <Content>
        {/* 상단 컨트롤 */}
        <TopSection>
          <BranchSelection>
            <FieldLabel>지점 선택:</FieldLabel>
            <CustomDropdown
              placeholder="지점을 선택하세요"
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              options={branches
                .filter(branch => branch.name !== '전체') // '전체' 옵션 제외
                .map(branch => ({
                  value: branch.id,
                  label: branch.name
                }))}
              width="200px"
            />
            {selectedBranchId && (
              <>
                <PriceDisplay>
                  금액: {getCurrentBranchPrice().toLocaleString()}원
                </PriceDisplay>
                {hasPermission && (
                  <PriceSettingButton onClick={() => {
                    setEditingPrice(getCurrentBranchPrice());
                    setShowPriceModal(true);
                  }}>
                    금액설정
                  </PriceSettingButton>
                )}
              </>
            )}
          </BranchSelection>
          
          {hasPermission && (
            <ActionButtons>
              <ActionButton onClick={() => {
                setShowInModal(true);
              }}>
                + 입고
              </ActionButton>
              <ActionButton onClick={() => {
                setOutModalData({ 
                  ...outModalData, 
                  quantity: 1 // 모달 열 때 기본값 1로 설정
                });
                setShowOutModal(true);
              }}>
                - 출고
              </ActionButton>
            </ActionButtons>
          )}
        </TopSection>

        {/* 재고 요약 */}
        <InventorySummary>
          <SummaryTitle>재고 현황</SummaryTitle>
          <ColorRowContainer>
            {getInventoryByColor().map(colorGroup => (
              <ColorColumn key={colorGroup.color}>
                <ColorHeader>
                  <ColorDot $color={colorGroup.color} />
                  <ColorTitle>{colorGroup.color}</ColorTitle>
                  <ColorTotalStock>총 {colorGroup.totalStock}개</ColorTotalStock>
                </ColorHeader>
                
                <SizeList>
                  {colorGroup.sizes.map(sizeData => (
                    <SizeRow key={sizeData.size}>
                      <SizeLabel>{sizeData.size}</SizeLabel>
                      <SizeQuantity $hasStock={sizeData.quantity > 0}>
                        {sizeData.quantity}개
                      </SizeQuantity>
                    </SizeRow>
                  ))}
                </SizeList>
              </ColorColumn>
            ))}
          </ColorRowContainer>
        </InventorySummary>

        {/* 입출고 내역 */}
        <TransactionHistory>
          <SummaryTitle>입출고 내역</SummaryTitle>
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <TableHeader>일시</TableHeader>
                  <TableHeader>구분</TableHeader>
                  <TableHeader>색상/사이즈</TableHeader>
                  <TableHeader>수량</TableHeader>
                  <TableHeader>고객명</TableHeader>
                  <TableHeader>금액</TableHeader>
                  <TableHeader>비고</TableHeader>
                  <TableHeader>처리자</TableHeader>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleDateString('ko-KR')} {' '}
                      {new Date(transaction.createdAt).toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </TableCell>
                    <TableCell>
                      <TransactionType $type={transaction.type}>
                        {transaction.type === 'in' ? '입고' : '출고'}
                      </TransactionType>
                    </TableCell>
                    <TableCell>
                      <ProductDetails>
                        <ColorDot $color={transaction.color} />
                        {transaction.color} {transaction.size}
                      </ProductDetails>
                    </TableCell>
                    <TableCell>{transaction.quantity}개</TableCell>
                    <TableCell>{transaction.memberName || '-'}</TableCell>
                    <TableCell>
                      {transaction.type === 'out' && transaction.price !== undefined
                        ? `${transaction.price.toLocaleString()}원` 
                        : transaction.type === 'out' 
                          ? '0원 (가격 미설정)'
                          : '-'
                      }
                    </TableCell>
                    <TableCell>{transaction.memo || '-'}</TableCell>
                    <TableCell>{transaction.createdBy}</TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                      입출고 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </TableContainer>
        </TransactionHistory>

        {/* 입고 모달 */}
        <Modal
          isOpen={showInModal}
          onClose={() => {
            setShowInModal(false);
            setInModalData({ color: undefined, size: undefined, quantity: undefined });
          }}
          width="500px"
          header={`신발 입고 (${branches.find(b => b.id === selectedBranchId)?.name})`}
          disableOutsideClick={true}
          body={
            <ModalContent>
              <FieldRow>
                <FieldColumn>
                  <FieldLabel>색상</FieldLabel>
                  <CustomDropdown
                    placeholder="색상을 선택하세요"
                    value={inModalData.color || ''}
                    onChange={(value) => setInModalData({ ...inModalData, color: value as ShoeColor })}
                    options={SHOE_COLORS.map(color => ({
                      value: color,
                      label: color
                    }))}
                    width="100%"
                    inModal={true}
                  />
                </FieldColumn>
                <FieldColumn>
                  <FieldLabel>사이즈</FieldLabel>
                  <CustomDropdown
                    placeholder="사이즈를 선택하세요"
                    value={inModalData.size || ''}
                    onChange={(value) => setInModalData({ ...inModalData, size: value as ShoeSize })}
                    options={SHOE_SIZES.map(size => ({
                      value: size,
                      label: size
                    }))}
                    width="100%"
                    inModal={true}
                  />
                </FieldColumn>
              </FieldRow>
              
              <FieldRow>
                <FieldColumn>
                  <FieldLabel>수량</FieldLabel>
                  <NumberTextField
                    value={inModalData.quantity}
                    onChange={(value) => setInModalData({ ...inModalData, quantity: value })}
                    placeholder="입고 수량을 입력하세요"
                    width="100%"
                    allowEmpty={true}
                  />
                </FieldColumn>
              </FieldRow>
            </ModalContent>
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <SecondaryButton onClick={() => {
                setShowInModal(false);
                setInModalData({ color: undefined, size: undefined, quantity: undefined });
              }}>
                취소
              </SecondaryButton>
              <ActionButton onClick={handleStockIn}>
                입고 처리
              </ActionButton>
            </div>
          }
        />

        {/* 출고 모달 */}
        <Modal
          isOpen={showOutModal}
          onClose={() => {
            setShowOutModal(false);
            setOutModalData({ 
              selectedColor: undefined, 
              selectedSize: undefined, 
              quantity: undefined, 
              selectedProduct: null, 
              selectedMember: null, 
              memo: '' 
            });
            setSearchQuery('');
            setSearchResults([]);
          }}
          width="min(95vw, 1000px)"
          header="신발 출고"
          disableOutsideClick={true}
          body={
            <OutModalContent>
              <LeftPanel>
                <PanelTitle>고객 검색</PanelTitle>
                <SearchInput
                  type="text"
                  placeholder="고객명, 전화번호, 이메일로 검색"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchMembers(e.target.value);
                  }}
                />
                <SearchResults>
                  {searchResults.map(member => (
                    <MemberItem
                      key={member.id}
                      $selected={outModalData.selectedMember?.id === member.id}
                      onClick={() => {
                        setOutModalData({ ...outModalData, selectedMember: member });
                        loadMemberPointBalance(member.id);
                        setPointPayment(0);
                        // 회원 선택 시 받은금액을 undefined로 설정하여 자동 계산되도록 함
                        setReceivedAmount(undefined as any);
                      }}
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
              </LeftPanel>

              <RightPanel>
                <PanelTitle>출고 등록 ({branches.find(b => b.id === selectedBranchId)?.name})</PanelTitle>
                
                <FieldRow>
                  <FieldColumn>
                    <FieldLabel>색상 선택</FieldLabel>
                    <ColorRadioGroup>
                      {SHOE_COLORS.map(color => {
                        const hasStock = inventory.some(inv => inv.color === color && inv.quantity > 0);
                        return (
                          <RadioOption key={color}>
                            <RadioInput
                              type="radio"
                              name="shoeColor"
                              value={color}
                              checked={outModalData.selectedColor === color}
                              disabled={!hasStock}
                              onChange={(e) => {
                                setOutModalData({
                                  ...outModalData,
                                  selectedColor: e.target.value as ShoeColor,
                                  selectedSize: undefined,
                                  selectedProduct: null
                                });
                              }}
                            />
                            <RadioLabel>
                              <ColorDot $color={color} />
                              {color}
                              {!hasStock && ' (품절)'}
                            </RadioLabel>
                          </RadioOption>
                        );
                      })}
                    </ColorRadioGroup>
                  </FieldColumn>
                </FieldRow>

                {outModalData.selectedColor && (
                  <FieldRow>
                    <FieldColumn>
                      <FieldLabel>사이즈 선택</FieldLabel>
                      <SizeDropdownContainer>
                        <CustomDropdown
                          placeholder="사이즈를 선택하세요"
                          value={outModalData.selectedSize || ''}
                          onChange={(value) => {
                            const selectedSize = value as ShoeSize;
                            // 선택된 색상과 사이즈로 재고 직접 계산
                            const quantity = inventory.find(
                              inv => inv.color === outModalData.selectedColor && 
                                     inv.size === selectedSize
                            )?.quantity || 0;
                            
                            setOutModalData({
                              ...outModalData,
                              selectedSize,
                              selectedProduct: selectedSize ? {
                                color: outModalData.selectedColor!,
                                size: selectedSize,
                                quantity
                              } : null
                            });
                          }}
                          options={getAvailableSizeOptions(outModalData.selectedColor).map(option => ({
                            value: option.value,
                            label: option.label
                          }))}
                          width="100%"
                          inModal={true}
                        />
                        {outModalData.selectedSize && (
                          <StockInfo>
                            선택한 상품: {outModalData.selectedColor} {outModalData.selectedSize} - 재고 {getSelectedProductQuantity()}개
                          </StockInfo>
                        )}
                      </SizeDropdownContainer>
                    </FieldColumn>
                  </FieldRow>
                )}

                {outModalData.selectedSize && (
                  <FieldRow>
                    <FieldColumn>
                      <FieldLabel>출고 수량</FieldLabel>
                      <NumberTextField
                        placeholder="수량을 입력하세요 (기본값: 1)"
                        value={outModalData.quantity}
                        onChange={(value) => {
                          const maxQuantity = inventory.find(
                            inv => inv.color === outModalData.selectedColor && 
                                   inv.size === outModalData.selectedSize
                          )?.quantity || 0;
                          
                          setOutModalData({
                            ...outModalData,
                            quantity: value,
                            selectedProduct: {
                              color: outModalData.selectedColor!,
                              size: outModalData.selectedSize!,
                              quantity: maxQuantity
                            }
                          });
                        }}
                        width="100%"
                        allowEmpty={true}
                      />
                      <div style={{
                        fontSize: AppTextStyles.label2.fontSize,
                        color: AppColors.onInput2,
                        marginTop: '4px'
                      }}>
                        최대 출고 가능: {getSelectedProductQuantity()}개
                      </div>
                      {outModalData.selectedColor && getAvailableSizeOptions(outModalData.selectedColor).length === 0 && (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '20px', 
                          color: AppColors.onInput2,
                          border: `1px solid ${AppColors.borderLight}`,
                          borderRadius: '8px',
                          fontSize: AppTextStyles.label2.fontSize
                        }}>
                          선택한 색상에 출고 가능한 재고가 없습니다.
                        </div>
                      )}
                    </FieldColumn>
                  </FieldRow>
                )}

                <FieldRow>
                  <FieldColumn>
                    <FieldLabel>비고 (선택사항)</FieldLabel>
                    <TextArea
                      placeholder="비고 사항을 입력하세요"
                      value={outModalData.memo}
                      onChange={(e) => setOutModalData({ ...outModalData, memo: e.target.value })}
                    />
                  </FieldColumn>
                </FieldRow>

                {/* 결제 정보 */}
                {outModalData.selectedMember && (
                  <>
                    <FieldRow>
                      <FieldColumn>
                        <FieldLabel>결제 방법</FieldLabel>
                        <CustomDropdown
                          value={paymentMethod}
                          onChange={(value: string) => setPaymentMethod(value)}
                          options={[
                            { value: 'card', label: '카드' },
                            { value: 'cash', label: '현금' },
                            { value: 'transfer', label: '계좌이체' }
                          ]}
                          width="100%"
                          inModal={true}
                        />
                      </FieldColumn>
                    </FieldRow>

                    <FieldRow>
                      <FieldColumn>
                        <FieldLabel>총 판매 금액</FieldLabel>
                        <div style={{
                          padding: '12px 16px',
                          backgroundColor: AppColors.primary + '10',
                          borderRadius: '8px',
                          fontSize: AppTextStyles.body1.fontSize,
                          fontWeight: '600',
                          color: AppColors.primary
                        }}>
                          {getTotalSaleAmount().toLocaleString()}원
                        </div>
                      </FieldColumn>
                    </FieldRow>

                    <FieldRow>
                      <FieldColumn>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <FieldLabel style={{ lineHeight: '1', margin: 0 }}>포인트 결제</FieldLabel>
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#666',
                            lineHeight: '1',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            (가용 포인트: {memberPointBalance.toLocaleString()}원)
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                              borderRadius: '12px',
                              padding: '14px 16px',
                              fontSize: AppTextStyles.body3.fontSize,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              minHeight: '48px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            전액 사용
                          </button>
                        </div>
                        {pointPayment > memberPointBalance && (
                          <div style={{ 
                            color: '#d32f2f', 
                            fontSize: '12px', 
                            marginTop: '4px' 
                          }}>
                            포인트 잔액을 초과할 수 없습니다.
                          </div>
                        )}
                      </FieldColumn>
                    </FieldRow>

                    <FieldRow>
                      <FieldColumn>
                        <FieldLabel>받은금액 ({paymentMethod === 'card' ? '카드' : paymentMethod === 'cash' ? '현금' : '계좌이체'})</FieldLabel>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <NumberTextField
                            value={receivedAmount !== undefined ? receivedAmount : Math.max(0, getTotalSaleAmount() - pointPayment)}
                            onChange={(value) => setReceivedAmount(value || 0)}
                            placeholder="받은 금액을 입력하세요"
                            width="100%"
                            allowEmpty={true}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cashAmount = Math.max(0, getTotalSaleAmount() - pointPayment);
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
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
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
                            필요 금액
                          </button>
                        </div>
                        {(receivedAmount !== undefined ? receivedAmount : Math.max(0, getTotalSaleAmount() - pointPayment)) !== getTotalSaleAmount() - pointPayment && (
                          <div style={{ 
                            fontSize: '12px', 
                            marginTop: '4px',
                            color: AppColors.onInput1
                          }}>
                            {(receivedAmount !== undefined ? receivedAmount : Math.max(0, getTotalSaleAmount() - pointPayment)) > getTotalSaleAmount() - pointPayment
                              ? (() => {
                                  const actualReceived = receivedAmount !== undefined ? receivedAmount : Math.max(0, getTotalSaleAmount() - pointPayment);
                                  const excessAmount = actualReceived - (getTotalSaleAmount() - pointPayment);
                                  let message = `초과금액: ${excessAmount.toLocaleString()}원 (포인트로 적립 예정)`;
                                  
                                  if (excessAmount >= 1000000) {
                                    const millionUnits = Math.floor(excessAmount / 1000000);
                                    const bonusPoints = millionUnits * 100000;
                                    message += ` + 보너스 ${bonusPoints.toLocaleString()}원`;
                                  }
                                  
                                  return message;
                                })()
                              : `부족금액: ${((getTotalSaleAmount() - pointPayment) - (receivedAmount !== undefined ? receivedAmount : Math.max(0, getTotalSaleAmount() - pointPayment))).toLocaleString()}원 (미수금으로 처리 예정)`
                            }
                          </div>
                        )}
                      </FieldColumn>
                    </FieldRow>
                  </>
                )}
              </RightPanel>
            </OutModalContent>
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <SecondaryButton onClick={resetOutModal}>
                취소
              </SecondaryButton>
              <ActionButton 
                onClick={handleStockOut}
                disabled={!outModalData.selectedProduct || !outModalData.selectedMember}
              >
                출고 처리
              </ActionButton>
            </div>
          }
        />

        {/* 금액 설정 모달 */}
        <Modal
          isOpen={showPriceModal}
          onClose={() => setShowPriceModal(false)}
          width="400px"
          header="금액 설정"
          disableOutsideClick={true}
          body={
            <ModalContent>
              <FieldRow>
                <FieldColumn>
                  <FieldLabel>금액 (원)</FieldLabel>
                  <NumberTextField
                    placeholder="금액을 입력하세요"
                    value={editingPrice}
                    onChange={(value) => setEditingPrice(value)}
                    width="100%"
                    allowEmpty={true}
                  />
                  <div style={{
                    fontSize: AppTextStyles.label2.fontSize,
                    color: AppColors.onInput2,
                    marginTop: '4px'
                  }}>
                    기본값: 35,000원
                  </div>
                </FieldColumn>
              </FieldRow>
            </ModalContent>
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <SecondaryButton onClick={() => setShowPriceModal(false)}>
                취소
              </SecondaryButton>
              <ActionButton 
                onClick={saveShoesPrice}
                disabled={!editingPrice || editingPrice <= 0}
              >
                저장
              </ActionButton>
            </div>
          }
        />
      </Content>
    </Container>
  );
};

export default ShoesManagement;