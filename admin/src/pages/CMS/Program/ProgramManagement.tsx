import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, Program, Product, Branch } from '../../../utils/indexedDB';
import CustomDropdown from '../../../components/CustomDropdown';
import NumberTextField from '../../../components/NumberTextField';
import { AppTextField } from '../../../customComponents/AppTextField';
import { refreshProgramsInNavigation } from '../../../components/CMSRootLayout';
import { SYSTEM_ADMIN_CONFIG } from '../../../constants/staffConstants';

const Container = styled.div`
  width: 100%;
`;

const LoadingState = styled.div`
  padding: 24px;
  text-align: center;
  color: ${AppColors.onSurface};
  font-size: ${AppTextStyles.body2.fontSize};
`;

const ErrorState = styled.div`
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid ${AppColors.error};
  border-radius: 8px;
  background-color: ${AppColors.error}10;
  color: ${AppColors.error};
  font-size: ${AppTextStyles.body2.fontSize};
`;

const RefreshButton = styled.button`
  padding: 8px 16px;
  margin-left: 8px;
  border: 1px solid ${AppColors.primary};
  border-radius: 4px;
  background-color: transparent;
  color: ${AppColors.primary};
  font-size: ${AppTextStyles.label3.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${AppColors.primary};
    color: white;
  }
`;

const AddButton = styled.button`
  width: 100%;
  padding: 12px;
  margin-bottom: 16px;
  border: 2px dashed ${AppColors.borderLight};
  border-radius: 8px;
  background-color: transparent;
  color: ${AppColors.onSurface};
  font-size: ${AppTextStyles.body2.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${AppColors.primary};
    color: ${AppColors.primary};
    background-color: ${AppColors.primary}05;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Table = styled.div`
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  background-color: ${AppColors.background};
  padding: 12px 16px;
  border-bottom: 1px solid ${AppColors.borderLight};
  font-weight: 600;
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onSurface};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TableStats = styled.span`
  font-size: ${AppTextStyles.label3.fontSize};
  color: ${AppColors.onSurface}80;
  font-weight: normal;
`;

const TableRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid ${AppColors.borderLight};
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onSurface};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${AppColors.background};
  }
`;

const ProgramInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProgramName = styled.span`
  font-weight: 500;
`;

const ProgramDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${AppTextStyles.label3.fontSize};
  color: ${AppColors.onSurface}60;
`;

const DetailLabel = styled.span`
  font-weight: 500;
  min-width: 40px;
  color: ${AppColors.onSurface}80;
`;

const DetailValue = styled.span`
  color: ${AppColors.onSurface}60;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const AddProductButton = styled.button`
  padding: 4px 8px;
  border: 1px solid ${AppColors.secondary};
  border-radius: 4px;
  background-color: transparent;
  color: ${AppColors.secondary};
  font-size: ${AppTextStyles.label3.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${AppColors.secondary};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EditButton = styled.button`
  padding: 4px 8px;
  border: 1px solid ${AppColors.primary};
  border-radius: 4px;
  background-color: transparent;
  color: ${AppColors.primary};
  font-size: ${AppTextStyles.label3.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${AppColors.primary};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  padding: 4px 8px;
  border: 1px solid ${AppColors.error};
  border-radius: 4px;
  background-color: transparent;
  color: ${AppColors.error};
  font-size: ${AppTextStyles.label3.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${AppColors.error};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  padding: 24px;
  text-align: center;
  color: ${AppColors.onSurface};
  font-size: ${AppTextStyles.body2.fontSize};
`;

const AddForm = styled.div`
  padding: 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  margin-bottom: 16px;
  background-color: ${AppColors.background};
`;

const FormRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`;

const FieldColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
`;

const Label = styled.label<{ $required?: boolean }>`
  font-size: ${AppTextStyles.label1.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  
  ${({ $required }) => $required && `
    &::after {
      content: ' *';
      color: ${AppColors.error};
    }
  `}
`;

const Input = styled.input<{ $error?: boolean }>`
  width: 100%;
  min-width: 0;
  height: 48px;
  padding: 14px 16px 14px 16px;
  border: 1px solid ${({ $error }) => $error ? AppColors.error : AppColors.borderLight};
  border-radius: 12px;
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.onSurface};
  background: ${AppColors.surface};
  box-sizing: border-box;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  
  &:hover {
    border-color: ${({ $error }) => $error ? AppColors.error : AppColors.primary};
    box-shadow: 0 2px 8px rgba(55, 187, 214, 0.1);
  }
  
  &:focus {
    outline: none;
    border-color: ${({ $error }) => $error ? AppColors.error : AppColors.primary};
    box-shadow: 0 0 0 3px rgba(55, 187, 214, 0.1);
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
  }

  &:disabled {
    background-color: ${AppColors.background};
    color: ${AppColors.disabled};
    cursor: not-allowed;
    border-color: ${AppColors.borderLight};
    opacity: 1;
  }
`;

const FormButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const SaveButton = styled.button`
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: ${AppColors.primary};
  color: white;
  font-size: ${AppTextStyles.body2.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${AppColors.secondary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 8px 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  background-color: transparent;
  color: ${AppColors.onSurface};
  font-size: ${AppTextStyles.body2.fontSize};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${AppColors.background};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  color: ${AppColors.error};
  font-size: ${AppTextStyles.label3.fontSize};
  margin-top: 4px;
`;

const TextArea = styled.textarea<{ $error?: boolean }>`
  width: 100%;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid ${({ $error }) => $error ? AppColors.error : AppColors.borderLight};
  border-radius: 12px;
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.onSurface};
  background: ${AppColors.surface};
  box-sizing: border-box;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ $error }) => $error ? AppColors.error : AppColors.primary};
    box-shadow: 0 2px 8px rgba(55, 187, 214, 0.1);
  }
  
  &:focus {
    outline: none;
    border-color: ${({ $error }) => $error ? AppColors.error : AppColors.primary};
    box-shadow: 0 0 0 3px rgba(55, 187, 214, 0.1);
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
  }

  &:disabled {
    background-color: ${AppColors.background};
    color: ${AppColors.disabled};
    cursor: not-allowed;
    border-color: ${AppColors.borderLight};
    opacity: 1;
  }
`;

const ProductFormSection = styled.div`
  margin-top: 16px;
  padding: 16px;
  border: 2px solid ${AppColors.secondary};
  border-radius: 8px;
  background-color: ${AppColors.secondary}05;
`;

const ProductFormTitle = styled.div`
  font-size: ${AppTextStyles.body1.fontSize};
  font-weight: 600;
  color: ${AppColors.secondary};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '+';
    font-size: 20px;
    font-weight: bold;
  }
`;

const ProductListSection = styled.div`
  padding: 12px 16px;
  background-color: ${AppColors.background};
  border-top: 1px solid ${AppColors.borderLight};
`;

const ProductListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px 0;
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface}80;
`;

const ProductItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  background-color: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${AppColors.primary};
    box-shadow: 0 2px 4px rgba(55, 187, 214, 0.1);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ProductItemInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProductItemName = styled.div`
  font-size: ${AppTextStyles.body2.fontSize};
  font-weight: 500;
  color: ${AppColors.onSurface};
`;

const ProductItemDetails = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ProductItemDetail = styled.span`
  font-size: ${AppTextStyles.label3.fontSize};
  color: ${AppColors.onSurface}60;
`;

const ToggleIcon = styled.span<{ $expanded: boolean }>`
  display: inline-block;
  margin-right: 8px;
  transition: transform 0.2s ease;
  transform: ${({ $expanded }) => $expanded ? 'rotate(90deg)' : 'rotate(0deg)'};
  cursor: pointer;
  user-select: none;
`;

const ExpandableRow = styled.div`
  cursor: pointer;
  user-select: none;
`;

const EmptyProductList = styled.div`
  padding: 16px;
  text-align: center;
  color: ${AppColors.onSurface}60;
  font-size: ${AppTextStyles.label3.fontSize};
  font-style: italic;
`;

const ProgramManagement: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 프로그램 추가/수정 폼 상태
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramType, setNewProgramType] = useState('');
  const [editProgramName, setEditProgramName] = useState('');
  const [editProgramType, setEditProgramType] = useState('');
  
  // 상품 추가 폼 상태
  const [addingProductForProgramId, setAddingProductForProgramId] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newBranchId, setNewBranchId] = useState('');
  const [newSessions, setNewSessions] = useState<number | ''>('');
  const [newMonths, setNewMonths] = useState<number | ''>('');
  const [newDuration, setNewDuration] = useState<number>(30);
  const [newValidityMonths, setNewValidityMonths] = useState<number | ''>('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newDescription, setNewDescription] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasPermission, setHasPermission] = useState(false);
  const [programUsageCount, setProgramUsageCount] = useState<{ [key: string]: number }>({});
  const [userPermission, setUserPermission] = useState<string>('');
  const [userBranchId, setUserBranchId] = useState<string>('');
  const [expandedProgramIds, setExpandedProgramIds] = useState<Set<string>>(new Set());
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  // 상품 수정 폼 상태
  const [editProductProgramId, setEditProductProgramId] = useState<string>('');
  const [editProductName, setEditProductName] = useState('');
  const [editProductBranchId, setEditProductBranchId] = useState('');
  const [editProductSessions, setEditProductSessions] = useState<number | ''>('');
  const [editProductMonths, setEditProductMonths] = useState<number | ''>('');
  const [editProductDuration, setEditProductDuration] = useState<number>(30);
  const [editProductValidityMonths, setEditProductValidityMonths] = useState<number | ''>('');
  const [editProductPrice, setEditProductPrice] = useState<number | ''>('');
  const [editProductDescription, setEditProductDescription] = useState('');

  // 프로그램 종류 옵션
  const programTypeOptions = useMemo(() => [
    { value: '횟수제', label: '횟수제' },
    { value: '기간제', label: '기간제' }
  ], []);

  // 소요시간 옵션
  const durationOptions = useMemo(() => [
    { value: 30, label: '30분' },
    { value: 50, label: '50분' }
  ], []);

  // 지점 옵션 (전체 지점 제외)
  const branchOptions = useMemo(() => 
    branches
      .filter(branch => branch.name !== '전체')
      .map(branch => ({ value: branch.id, label: branch.name })),
    [branches]
  );

  // EDITOR인 경우 본인 지점만 표시
  const availableBranchOptions = useMemo(() => 
    userPermission === 'EDITOR' 
      ? branchOptions.filter(option => option.value === userBranchId)
      : branchOptions,
    [userPermission, userBranchId, branchOptions]
  );

  // 선택된 프로그램 정보
  const selectedProgram = useMemo(() => 
    programs.find(p => p.id === addingProductForProgramId),
    [programs, addingProductForProgramId]
  );

  // 상품명 자동 생성 함수
  const generateProductName = useCallback((programName: string, sessions?: number | '', months?: number | '') => {
    if (!programName) return '';
    
    if (sessions && typeof sessions === 'number') {
      return `${programName} ${sessions}회`;
    }
    
    if (months && typeof months === 'number') {
      return `${programName} ${months}개월`;
    }
    
    return programName;
  }, []);

  // 프로그램 선택 시 상품명 자동 업데이트
  useEffect(() => {
    if (selectedProgram) {
      const autoName = generateProductName(
        selectedProgram.name, 
        selectedProgram.type === '횟수제' ? newSessions : undefined,
        selectedProgram.type === '기간제' ? newMonths : undefined
      );
      setNewProductName(autoName);
    }
  }, [selectedProgram, newSessions, newMonths, generateProductName]);

  // 컴포넌트 마운트 시 권한 체크 및 데이터 로드
  const checkPermissionAndLoadData = useCallback(async () => {
    try {
      const adminId = sessionStorage.getItem('adminId');
      
      if (adminId) {
        // 현재 로그인한 사용자 정보 가져오기
        const allStaff = await dbManager.getAllStaff();
        const currentUser = allStaff.find(staff => staff.loginId === adminId);
        
        if (currentUser) {
          setUserPermission(currentUser.permission);
          setUserBranchId(currentUser.branchId);
          
          // MASTER 권한, 시스템 관리자 또는 EDITOR 편집 가능
          const isMaster = currentUser.permission === 'MASTER';
          const isSystemAdmin = adminId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
          const isEditor = currentUser.permission === 'EDITOR';
          
          setHasPermission(isMaster || isSystemAdmin || isEditor);
          
          // EDITOR인 경우 본인 지점으로 자동 설정
          if (isEditor) {
            setNewBranchId(currentUser.branchId);
          }
        } else {
          setHasPermission(false);
        }
      } else {
        setHasPermission(false);
      }
      
      // 프로그램, 지점, 상품 목록 로드
      try {
        setLoading(true);
        setError(null);
        
        const [programData, branchData, productData] = await Promise.all([
          dbManager.getAllPrograms(),
          dbManager.getAllBranches(),
          dbManager.getAllProducts()
        ]);
        
        // 오래된 등록 순서로 정렬 (createdAt 오름차순)
        const sortedPrograms = programData.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setPrograms(sortedPrograms);
        setBranches(branchData.filter(branch => branch.isActive));
        setProducts(productData);
        
        // 각 프로그램의 사용량 확인
        const usageCount: { [key: string]: number } = {};
        for (const program of sortedPrograms) {
          const relatedProducts = await dbManager.getProductsByProgram(program.id);
          usageCount[program.id] = relatedProducts.length;
        }
        setProgramUsageCount(usageCount);
      } catch (err) {
        console.error('프로그램 데이터 로드 실패:', err);
        setError('프로그램 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('권한 체크 실패:', error);
      setHasPermission(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermissionAndLoadData();
  }, [checkPermissionAndLoadData]);

  const loadProgramUsageCount = useCallback(async (programList: Program[]) => {
    try {
      const usageCount: { [key: string]: number } = {};
      
      for (const program of programList) {
        const relatedProducts = await dbManager.getProductsByProgram(program.id);
        usageCount[program.id] = relatedProducts.length;
      }
      
      setProgramUsageCount(usageCount);
    } catch (err) {
      console.error('프로그램 사용량 확인 실패:', err);
    }
  }, []);

  const loadPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const programData = await dbManager.getAllPrograms();
      // 오래된 등록 순서로 정렬 (createdAt 오름차순)
      const sortedPrograms = programData.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setPrograms(sortedPrograms);
      
      // 각 프로그램의 사용량 확인
      await loadProgramUsageCount(sortedPrograms);
    } catch (err) {
      console.error('프로그램 데이터 로드 실패:', err);
      setError('프로그램 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [loadProgramUsageCount]);

  const validateForm = useCallback((name: string, type: string): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = '프로그램명을 입력해주세요.';
    }

    if (!type) {
      newErrors.type = '프로그램 종류를 선택해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const validateProductForm = useCallback((name: string, branchId: string, price: number | '', sessions?: number | '', months?: number | '', validityMonths?: number | ''): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.productName = '상품명을 입력해주세요.';
    }

    if (!branchId) {
      newErrors.branchId = '지점을 선택해주세요.';
    }

    if (!price || price <= 0) {
      newErrors.price = '가격을 입력해주세요.';
    }

    if (selectedProgram) {
      if (selectedProgram.type === '횟수제') {
        if (!sessions || sessions <= 0) {
          newErrors.sessions = '횟수를 입력해주세요.';
        }
        if (!validityMonths || validityMonths <= 0) {
          newErrors.validityMonths = '유효기간을 입력해주세요.';
        }
      } else if (selectedProgram.type === '기간제') {
        if (!months || months <= 0) {
          newErrors.months = '개월수를 입력해주세요.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedProgram]);

  const handleAddProgram = useCallback(async () => {
    if (!validateForm(newProgramName, newProgramType)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const newProgram = await dbManager.addProgram({
        name: newProgramName.trim(),
        type: newProgramType,
        isActive: true,
      });
      
      // 새로운 프로그램 추가 후 정렬 유지
      setPrograms(prev => {
        const updated = [...prev, newProgram];
        const sorted = updated.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        // 사용량 정보도 업데이트
        loadProgramUsageCount(sorted);
        
        return sorted;
      });
      setNewProgramName('');
      setNewProgramType('');
      setIsAdding(false);
      setEditingId(null); // 수정 모드 해제
      setErrors({});
      
      // 네비게이션 메뉴 새로고침
      await refreshProgramsInNavigation();
      
      console.log('새 프로그램 추가됨:', newProgram);
    } catch (err) {
      console.error('프로그램 추가 실패:', err);
      setError('프로그램 추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }, [newProgramName, newProgramType, validateForm, loadProgramUsageCount]);

  const handleAddProduct = useCallback(async () => {
    if (!selectedProgram || !validateProductForm(newProductName, newBranchId, newPrice, newSessions, newMonths, newValidityMonths)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const selectedBranch = branches.find(b => b.id === newBranchId);
      
      if (!selectedBranch) {
        throw new Error('선택된 지점 정보를 찾을 수 없습니다.');
      }

      const newProduct = await dbManager.addProduct({
        name: newProductName.trim(),
        branchId: newBranchId,
        programId: selectedProgram.id,
        programName: selectedProgram.name,
        programType: selectedProgram.type,
        sessions: selectedProgram.type === '횟수제' ? Number(newSessions) : undefined,
        months: selectedProgram.type === '기간제' ? Number(newMonths) : undefined,
        duration: selectedProgram.type === '횟수제' ? newDuration : undefined,
        validityMonths: selectedProgram.type === '횟수제' && newValidityMonths ? Number(newValidityMonths) : undefined,
        price: newPrice ? Number(newPrice) : undefined,
        description: newDescription.trim() || undefined,
        isActive: true,
      });
      
      // 상품 목록 업데이트
      setProducts(prev => [newProduct, ...prev]);
      
      // 프로그램 사용량 업데이트
      setProgramUsageCount(prev => ({
        ...prev,
        [selectedProgram.id]: (prev[selectedProgram.id] || 0) + 1
      }));
      
      // 폼 초기화
      handleCancelProductForm();
      
      console.log('새 상품 추가됨:', newProduct);
    } catch (err) {
      console.error('상품 추가 실패:', err);
      setError('상품 추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }, [selectedProgram, newProductName, newBranchId, newSessions, newMonths, newDuration, newValidityMonths, newPrice, newDescription, branches, validateProductForm]);

  const handleDeleteProgram = async (id: string) => {
    try {
      setError(null);
      
      // 먼저 해당 프로그램이 상품에서 사용되고 있는지 확인
      const relatedProducts = await dbManager.getProductsByProgram(id);
      
      if (relatedProducts.length > 0) {
        const programName = programs.find(p => p.id === id)?.name || '해당 프로그램';
        setError(`${programName}은(는) 현재 ${relatedProducts.length}개의 상품에서 사용 중이므로 삭제할 수 없습니다.\n먼저 관련 상품들을 삭제하거나 다른 프로그램으로 변경해주세요.`);
        return;
      }
      
      if (!window.confirm('정말로 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) {
        return;
      }

      const success = await dbManager.deleteProgram(id);
      
      if (success) {
        setPrograms(prev => prev.filter(program => program.id !== id));
        
        // 네비게이션 메뉴 새로고침
        await refreshProgramsInNavigation();
        
        // 프로그램 사용량 다시 로드
        const updatedPrograms = programs.filter(program => program.id !== id);
        await loadProgramUsageCount(updatedPrograms);
        
        console.log('프로그램 삭제됨:', id);
      } else {
        throw new Error('삭제 실패');
      }
    } catch (err) {
      console.error('프로그램 삭제 실패:', err);
      setError('프로그램 삭제에 실패했습니다.');
    }
  };

  const handleEditProgram = (program: Program) => {
    setEditingId(program.id);
    setEditProgramName(program.name);
    setEditProgramType(program.type);
    setIsAdding(false);
    setErrors({});
  };

  const handleUpdateProgram = async () => {
    if (!validateForm(editProgramName, editProgramType)) {
      return;
    }

    if (!editingId) return;

    try {
      setSaving(true);
      setError(null);
      
      const updatedProgram = await dbManager.updateProgram(editingId, {
        name: editProgramName.trim(),
        type: editProgramType,
      });
      
      if (updatedProgram) {
        setPrograms(prev => {
          const updated = prev.map(program => 
            program.id === editingId ? updatedProgram : program
          );
          
          // 사용량 정보도 업데이트
          loadProgramUsageCount(updated);
          
          return updated;
        });
        
        // 네비게이션 메뉴 새로고침
        await refreshProgramsInNavigation();
        
        handleCancelEdit();
        console.log('프로그램 수정됨:', updatedProgram);
      } else {
        throw new Error('수정 실패');
      }
    } catch (err) {
      console.error('프로그램 수정 실패:', err);
      setError('프로그램 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditProgramName('');
    setEditProgramType('');
    setError(null);
    setErrors({});
  };

  const handleCancel = () => {
    setNewProgramName('');
    setNewProgramType('');
    setIsAdding(false);
    setEditingId(null);
    setEditProgramName('');
    setEditProgramType('');
    setError(null);
    setErrors({});
  };

  const handleCancelProductForm = () => {
    setAddingProductForProgramId(null);
    setNewProductName('');
    setNewBranchId(userPermission === 'EDITOR' ? userBranchId : '');
    setNewSessions('');
    setNewMonths('');
    setNewDuration(30);
    setNewValidityMonths('');
    setNewPrice('');
    setNewDescription('');
    setErrors({});
  };

  const handleStartAddingProduct = (programId: string) => {
    setAddingProductForProgramId(programId);
    setIsAdding(false);
    setEditingId(null);
    setErrors({});
  };

  const toggleProgramExpand = (programId: string) => {
    setExpandedProgramIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  const checkProductUsage = async (productId: string): Promise<number> => {
    try {
      const allEnrollments = await dbManager.getAllCourseEnrollments();
      const productEnrollments = allEnrollments.filter(
        enrollment => enrollment.productId === productId && 
        ['active', 'hold', 'unpaid'].includes(enrollment.enrollmentStatus)
      );
      return productEnrollments.length;
    } catch (err) {
      console.error('상품 사용 체크 실패:', err);
      return 0;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      setError(null);
      
      // 상품 사용 중인 회원 체크
      const usageCount = await checkProductUsage(productId);
      const product = products.find(p => p.id === productId);
      
      if (usageCount > 0) {
        setError(`${product?.name || '해당 상품'}은(는) 현재 ${usageCount}명의 회원이 사용 중이므로 삭제할 수 없습니다.\n사용 중인 회원의 수강을 먼저 종료하거나 다른 상품으로 변경해주세요.`);
        return;
      }
      
      if (!window.confirm('정말로 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) {
        return;
      }

      const success = await dbManager.deleteProduct(productId);
      
      if (success) {
        const deletedProduct = products.find(p => p.id === productId);
        setProducts(prev => prev.filter(product => product.id !== productId));
        
        // 프로그램 사용량 업데이트
        if (deletedProduct) {
          setProgramUsageCount(prev => ({
            ...prev,
            [deletedProduct.programId]: Math.max(0, (prev[deletedProduct.programId] || 0) - 1)
          }));
        }
        
        console.log('상품 삭제됨:', productId);
      } else {
        throw new Error('삭제 실패');
      }
    } catch (err) {
      console.error('상품 삭제 실패:', err);
      setError('상품 삭제에 실패했습니다.');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setEditProductProgramId(product.programId);
    setEditProductName(product.name);
    setEditProductBranchId(product.branchId);
    setEditProductSessions(product.sessions || '');
    setEditProductMonths(product.months || '');
    setEditProductDuration(product.duration || 30);
    setEditProductValidityMonths(product.validityMonths || '');
    setEditProductPrice(product.price || '');
    setEditProductDescription(product.description || '');
  };

  const handleUpdateProduct = async () => {
    if (!editingProductId) return;

    try {
      setSaving(true);
      setError(null);
      
      const selectedBranch = branches.find(b => b.id === editProductBranchId);
      const selectedProgram = programs.find(p => p.id === editProductProgramId);
      
      if (!selectedBranch || !selectedProgram) {
        throw new Error('선택된 지점 또는 프로그램 정보를 찾을 수 없습니다.');
      }

      // 지점과 소요시간은 변경하지 않음 (원본 유지)
      const updatedProduct = await dbManager.updateProduct(editingProductId, {
        name: editProductName.trim(),
        // branchId는 변경하지 않음
        // duration은 변경하지 않음
        sessions: selectedProgram.type === '횟수제' ? Number(editProductSessions) : undefined,
        months: selectedProgram.type === '기간제' ? Number(editProductMonths) : undefined,
        validityMonths: selectedProgram.type === '횟수제' && editProductValidityMonths ? Number(editProductValidityMonths) : undefined,
        price: editProductPrice ? Number(editProductPrice) : undefined,
        description: editProductDescription.trim() || undefined,
      });
      
      if (updatedProduct) {
        setProducts(prev => prev.map(product => 
          product.id === editingProductId ? updatedProduct : product
        ));
        
        handleCancelEditProduct();
        console.log('상품 수정됨:', updatedProduct);
      } else {
        throw new Error('수정 실패');
      }
    } catch (err) {
      console.error('상품 수정 실패:', err);
      setError('상품 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    setEditProductProgramId('');
    setEditProductName('');
    setEditProductBranchId('');
    setEditProductSessions('');
    setEditProductMonths('');
    setEditProductDuration(30);
    setEditProductValidityMonths('');
    setEditProductPrice('');
    setEditProductDescription('');
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : '알 수 없는 지점';
  };

  const getProgramProducts = (programId: string) => {
    return products.filter(product => product.programId === programId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving) {
      handleAddProgram();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving) {
      handleUpdateProgram();
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>프로그램 데이터를 불러오는 중...</LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      {error && (
        <ErrorState>
          {error}
          <RefreshButton onClick={loadPrograms}>
            다시 시도
          </RefreshButton>
        </ErrorState>
      )}

        {hasPermission && isAdding && (
          <AddForm>
            <FormRow>
              <FieldColumn>
                <Label $required>프로그램명</Label>
                <Input
                  type="text"
                  placeholder="프로그램명을 입력하세요"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={saving}
                  $error={!!errors.name}
                  autoFocus
                />
                {errors.name && <ErrorText>{errors.name}</ErrorText>}
              </FieldColumn>
              <FieldColumn>
                <Label $required>프로그램 종류</Label>
                <CustomDropdown
                  value={newProgramType}
                  onChange={(value: string) => setNewProgramType(value)}
                  options={programTypeOptions}
                  placeholder="프로그램 종류를 선택하세요"
                  error={!!errors.type}
                  disabled={saving}
                  required
                />
                {errors.type && <ErrorText>{errors.type}</ErrorText>}
              </FieldColumn>
            </FormRow>
            <FormButtons>
              <SaveButton onClick={handleAddProgram} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </SaveButton>
              <CancelButton onClick={handleCancel} disabled={saving}>
                취소
              </CancelButton>
            </FormButtons>
          </AddForm>
        )}

        {hasPermission && !isAdding && (
          <AddButton onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setEditProgramName('');
            setEditProgramType('');
            setErrors({});
          }} disabled={loading || editingId !== null}>
            + 새 프로그램 추가
          </AddButton>
        )}

        {!hasPermission && (
          <ErrorState style={{ marginBottom: '16px', backgroundColor: `${AppColors.primary}10`, borderColor: AppColors.primary, color: AppColors.primary }}>
            ℹ️ 프로그램 목록 조회만 가능합니다. 추가/수정/삭제는 MASTER 권한이 필요합니다.
          </ErrorState>
        )}

        <Table>
          <TableHeader>
            프로그램 목록
            <TableStats>총 {programs.length}개 프로그램</TableStats>
          </TableHeader>
          {programs.length === 0 ? (
            <EmptyState>등록된 프로그램이 없습니다.</EmptyState>
          ) : (
            programs.map((program) => (
              <React.Fragment key={program.id}>
                <TableRow 
                  style={editingId === program.id ? {
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    padding: '16px',
                    backgroundColor: `${AppColors.primary}05`
                  } : {}}
                >
                {editingId === program.id ? (
                  // 수정 모드
                  <div style={{ 
                    width: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    padding: '8px 0'
                  }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <FieldColumn>
                        <Label $required>프로그램명</Label>
                        <Input
                          type="text"
                          value={editProgramName}
                          onChange={(e) => setEditProgramName(e.target.value)}
                          onKeyPress={handleEditKeyPress}
                          disabled={saving}
                          $error={!!errors.name}
                          placeholder="프로그램명을 입력하세요"
                          autoFocus
                        />
                        {errors.name && <ErrorText>{errors.name}</ErrorText>}
                      </FieldColumn>
                      <FieldColumn>
                        <Label $required>프로그램 종류</Label>
                        <CustomDropdown
                          value={editProgramType}
                          onChange={(value: string) => setEditProgramType(value)}
                          options={programTypeOptions}
                          placeholder="프로그램 종류를 선택하세요"
                          error={!!errors.type}
                          disabled={saving}
                          required
                        />
                        {errors.type && <ErrorText>{errors.type}</ErrorText>}
                      </FieldColumn>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      justifyContent: 'flex-end',
                      marginTop: '4px'
                    }}>
                      <SaveButton 
                        onClick={handleUpdateProgram} 
                        disabled={saving}
                        style={{ 
                          padding: '6px 16px', 
                          fontSize: '13px',
                          minWidth: '60px'
                        }}
                      >
                        {saving ? '저장 중...' : '저장'}
                      </SaveButton>
                      <CancelButton 
                        onClick={handleCancelEdit} 
                        disabled={saving}
                        style={{ 
                          padding: '6px 16px', 
                          fontSize: '13px',
                          minWidth: '60px'
                        }}
                      >
                        취소
                      </CancelButton>
                    </div>
                  </div>
                ) : (
                  // 보기 모드
                  <>
                    <ExpandableRow onClick={() => toggleProgramExpand(program.id)} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <ToggleIcon $expanded={expandedProgramIds.has(program.id)}>
                        ▶
                      </ToggleIcon>
                      <ProgramInfo>
                        <ProgramName>{program.name}</ProgramName>
                        <ProgramDetails>
                          <DetailItem>
                            <DetailLabel>종류:</DetailLabel>
                            <DetailValue>{program.type}</DetailValue>
                          </DetailItem>
                          <DetailItem>
                            <DetailLabel>사용중:</DetailLabel>
                            <DetailValue>
                              {programUsageCount[program.id] || 0}개 상품
                              {programUsageCount[program.id] > 0 && (
                                <span style={{ 
                                  color: AppColors.error, 
                                  marginLeft: '4px',
                                  fontSize: '11px'
                                }}>
                                  (삭제 불가)
                                </span>
                              )}
                            </DetailValue>
                          </DetailItem>
                        </ProgramDetails>
                      </ProgramInfo>
                    </ExpandableRow>
                    {hasPermission && (
                      <ActionButtons onClick={(e) => e.stopPropagation()}>
                        <AddProductButton 
                          onClick={() => handleStartAddingProduct(program.id)}
                          disabled={saving || editingId !== null || addingProductForProgramId !== null}
                        >
                          + 상품
                        </AddProductButton>
                        <EditButton 
                          onClick={() => handleEditProgram(program)}
                          disabled={saving || editingId !== null}
                        >
                          수정
                        </EditButton>
                        <DeleteButton 
                          onClick={() => handleDeleteProgram(program.id)}
                          disabled={saving || editingId !== null || (programUsageCount[program.id] || 0) > 0}
                          title={(programUsageCount[program.id] || 0) > 0 ? '상품에서 사용 중인 프로그램은 삭제할 수 없습니다.' : '삭제'}
                        >
                          삭제
                        </DeleteButton>
                      </ActionButtons>
                    )}
                  </>
                )}
              </TableRow>
              
              {/* 상품 목록 */}
              {expandedProgramIds.has(program.id) && editingId !== program.id && (
                <TableRow style={{ 
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  padding: '0',
                  backgroundColor: AppColors.background,
                  border: 'none'
                }}>
                  <ProductListSection>
                    <ProductListHeader>
                      <span>등록된 상품</span>
                      <span>{getProgramProducts(program.id).length}개</span>
                    </ProductListHeader>
                    {getProgramProducts(program.id).length === 0 ? (
                      <EmptyProductList>등록된 상품이 없습니다.</EmptyProductList>
                    ) : (
                      getProgramProducts(program.id).map((product) => (
                        editingProductId === product.id ? (
                          // 상품 수정 모드
                          <ProductItem key={product.id} style={{ 
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            gap: '12px',
                            padding: '16px',
                            backgroundColor: `${AppColors.primary}05`,
                            border: `2px solid ${AppColors.primary}`
                          }}>
                            <FormRow>
                              <FieldColumn>
                                <Label>지점 (수정불가)</Label>
                                <Input
                                  type="text"
                                  value={getBranchName(editProductBranchId)}
                                  disabled
                                  style={{ backgroundColor: AppColors.background, cursor: 'not-allowed' }}
                                />
                              </FieldColumn>
                              <FieldColumn>
                                <Label>상품명</Label>
                                <Input
                                  type="text"
                                  placeholder="상품명을 입력하세요"
                                  value={editProductName}
                                  onChange={(e) => setEditProductName(e.target.value)}
                                  disabled={saving}
                                />
                              </FieldColumn>
                            </FormRow>
                            
                            {/* 횟수제 전용 필드 */}
                            {program.type === '횟수제' && (
                              <>
                                <FormRow>
                                  <FieldColumn>
                                    <Label $required>횟수</Label>
                                    <NumberTextField
                                      value={editProductSessions}
                                      onChange={(value) => setEditProductSessions(value || '')}
                                      placeholder="횟수를 입력하세요"
                                      disabled={saving}
                                      allowEmpty
                                    />
                                  </FieldColumn>
                                  <FieldColumn>
                                    <Label>소요시간 (수정불가)</Label>
                                    <Input
                                      type="text"
                                      value={`${editProductDuration}분`}
                                      disabled
                                      style={{ backgroundColor: AppColors.background, cursor: 'not-allowed' }}
                                    />
                                  </FieldColumn>
                                </FormRow>
                                
                                <FormRow>
                                  <FieldColumn>
                                    <Label $required>유효기간 (개월)</Label>
                                    <NumberTextField
                                      value={editProductValidityMonths}
                                      onChange={(value) => setEditProductValidityMonths(value || '')}
                                      placeholder="유효기간을 입력하세요"
                                      disabled={saving}
                                      allowEmpty
                                    />
                                  </FieldColumn>
                                  <FieldColumn>
                                    <Label $required>가격</Label>
                                    <NumberTextField
                                      value={editProductPrice}
                                      onChange={(value) => setEditProductPrice(value || '')}
                                      placeholder="가격을 입력하세요 (원)"
                                      disabled={saving}
                                      allowEmpty
                                    />
                                  </FieldColumn>
                                </FormRow>
                              </>
                            )}
                            
                            {/* 기간제 전용 필드 */}
                            {program.type === '기간제' && (
                              <FormRow>
                                <FieldColumn>
                                  <Label $required>개월수</Label>
                                  <NumberTextField
                                    value={editProductMonths}
                                    onChange={(value) => setEditProductMonths(value || '')}
                                    placeholder="개월수를 입력하세요"
                                    disabled={saving}
                                    allowEmpty
                                  />
                                </FieldColumn>
                                <FieldColumn>
                                  <Label $required>가격</Label>
                                  <NumberTextField
                                    value={editProductPrice}
                                    onChange={(value) => setEditProductPrice(value || '')}
                                    placeholder="가격을 입력하세요 (원)"
                                    disabled={saving}
                                    allowEmpty
                                  />
                                </FieldColumn>
                              </FormRow>
                            )}
                            
                            <FormRow>
                              <FieldColumn>
                                <Label>상품소개</Label>
                                <TextArea
                                  placeholder="상품에 대한 설명을 입력하세요"
                                  value={editProductDescription}
                                  onChange={(e) => setEditProductDescription(e.target.value)}
                                  disabled={saving}
                                />
                              </FieldColumn>
                            </FormRow>
                            
                            <FormButtons>
                              <SaveButton onClick={handleUpdateProduct} disabled={saving}>
                                {saving ? '저장 중...' : '저장'}
                              </SaveButton>
                              <CancelButton onClick={handleCancelEditProduct} disabled={saving}>
                                취소
                              </CancelButton>
                            </FormButtons>
                          </ProductItem>
                        ) : (
                          // 상품 보기 모드
                          <ProductItem key={product.id}>
                            <ProductItemInfo>
                              <ProductItemName>{product.name}</ProductItemName>
                              <ProductItemDetails>
                                <ProductItemDetail>지점: {getBranchName(product.branchId)}</ProductItemDetail>
                                {product.sessions && (
                                  <ProductItemDetail>횟수: {product.sessions}회</ProductItemDetail>
                                )}
                                {product.months && (
                                  <ProductItemDetail>개월: {product.months}개월</ProductItemDetail>
                                )}
                                {product.duration && (
                                  <ProductItemDetail>소요시간: {product.duration}분</ProductItemDetail>
                                )}
                                {product.validityMonths && (
                                  <ProductItemDetail>유효기간: {product.validityMonths}개월</ProductItemDetail>
                                )}
                                {product.price && (
                                  <ProductItemDetail>가격: {product.price.toLocaleString()}원</ProductItemDetail>
                                )}
                              </ProductItemDetails>
                            </ProductItemInfo>
                            {hasPermission && (
                              <ActionButtons>
                                <EditButton 
                                  onClick={() => handleEditProduct(product)}
                                  disabled={saving || editingProductId !== null}
                                >
                                  수정
                                </EditButton>
                                <DeleteButton 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  disabled={saving || editingProductId !== null}
                                >
                                  삭제
                                </DeleteButton>
                              </ActionButtons>
                            )}
                          </ProductItem>
                        )
                      ))
                    )}
                  </ProductListSection>
                </TableRow>
              )}
              
              {/* 상품 추가 폼 */}
              {addingProductForProgramId === program.id && (
                <TableRow style={{ 
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  padding: '0',
                  backgroundColor: 'transparent',
                  border: 'none'
                }}>
                  <ProductFormSection>
                    <ProductFormTitle>
                      {program.name} 상품 추가
                    </ProductFormTitle>
                    
                    <FormRow>
                      <FieldColumn>
                        <Label $required>지점</Label>
                        <CustomDropdown
                          value={newBranchId}
                          onChange={(value: string) => setNewBranchId(value)}
                          options={availableBranchOptions}
                          placeholder="지점을 선택하세요"
                          error={!!errors.branchId}
                          disabled={saving || userPermission === 'EDITOR'}
                          required
                        />
                        {errors.branchId && <ErrorText>{errors.branchId}</ErrorText>}
                      </FieldColumn>
                      <FieldColumn>
                        <Label $required>상품명</Label>
                        <Input
                          type="text"
                          placeholder="상품명을 입력하세요"
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          disabled={saving}
                          style={{ borderColor: errors.productName ? AppColors.error : undefined }}
                        />
                        {errors.productName && <ErrorText>{errors.productName}</ErrorText>}
                      </FieldColumn>
                    </FormRow>
                    
                    {/* 횟수제 전용 필드 */}
                    {program.type === '횟수제' && (
                      <>
                        <FormRow>
                          <FieldColumn>
                            <Label $required>횟수</Label>
                            <NumberTextField
                              value={newSessions}
                              onChange={(value) => setNewSessions(value || '')}
                              placeholder="횟수를 입력하세요"
                              disabled={saving}
                              error={!!errors.sessions}
                              allowEmpty
                            />
                            {errors.sessions && <ErrorText>{errors.sessions}</ErrorText>}
                          </FieldColumn>
                          <FieldColumn>
                            <Label $required>소요시간</Label>
                            <CustomDropdown
                              value={newDuration.toString()}
                              onChange={(value: string) => setNewDuration(Number(value))}
                              options={durationOptions.map(option => ({ value: option.value.toString(), label: option.label }))}
                              placeholder="소요시간을 선택하세요"
                              disabled={saving}
                              required
                            />
                          </FieldColumn>
                        </FormRow>
                        
                        <FormRow>
                          <FieldColumn>
                            <Label $required>유효기간 (개월)</Label>
                            <NumberTextField
                              value={newValidityMonths}
                              onChange={(value) => setNewValidityMonths(value || '')}
                              placeholder="유효기간을 입력하세요"
                              disabled={saving}
                              error={!!errors.validityMonths}
                              allowEmpty
                            />
                            {errors.validityMonths && <ErrorText>{errors.validityMonths}</ErrorText>}
                          </FieldColumn>
                          <FieldColumn>
                            <Label $required>가격</Label>
                            <NumberTextField
                              value={newPrice}
                              onChange={(value) => setNewPrice(value || '')}
                              placeholder="가격을 입력하세요 (원)"
                              disabled={saving}
                              error={!!errors.price}
                              allowEmpty
                            />
                            {errors.price && <ErrorText>{errors.price}</ErrorText>}
                          </FieldColumn>
                        </FormRow>
                      </>
                    )}
                    
                    {/* 기간제 전용 필드 */}
                    {program.type === '기간제' && (
                      <FormRow>
                        <FieldColumn>
                          <Label $required>개월수</Label>
                          <NumberTextField
                            value={newMonths}
                            onChange={(value) => setNewMonths(value || '')}
                            placeholder="개월수를 입력하세요"
                            disabled={saving}
                            error={!!errors.months}
                            allowEmpty
                          />
                          {errors.months && <ErrorText>{errors.months}</ErrorText>}
                        </FieldColumn>
                        <FieldColumn>
                          <Label $required>가격</Label>
                          <NumberTextField
                            value={newPrice}
                            onChange={(value) => setNewPrice(value || '')}
                            placeholder="가격을 입력하세요 (원)"
                            disabled={saving}
                            error={!!errors.price}
                            allowEmpty
                          />
                          {errors.price && <ErrorText>{errors.price}</ErrorText>}
                        </FieldColumn>
                      </FormRow>
                    )}
                    
                    <FormRow>
                      <FieldColumn>
                        <Label>상품소개</Label>
                        <TextArea
                          placeholder="상품에 대한 설명을 입력하세요 (선택사항)"
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          disabled={saving}
                        />
                      </FieldColumn>
                    </FormRow>
                    
                    <FormButtons>
                      <SaveButton onClick={handleAddProduct} disabled={saving}>
                        {saving ? '저장 중...' : '상품 저장'}
                      </SaveButton>
                      <CancelButton onClick={handleCancelProductForm} disabled={saving}>
                        취소
                      </CancelButton>
                    </FormButtons>
                  </ProductFormSection>
                </TableRow>
              )}
              </React.Fragment>
            ))
          )}
        </Table>
      </Container>
    );
  };

export default ProgramManagement;
