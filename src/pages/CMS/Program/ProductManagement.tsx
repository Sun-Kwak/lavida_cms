import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, Product, Branch, Program } from '../../../utils/indexedDB';
import CustomDropdown from '../../../components/CustomDropdown';
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

const ProductInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProductName = styled.span`
  font-weight: 500;
`;

const ProductDetails = styled.div`
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
  min-width: 60px;
  color: ${AppColors.onSurface}80;
`;

const DetailValue = styled.span`
  color: ${AppColors.onSurface}60;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
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
  padding: 12px;
  border: 1px solid ${({ $error }) => $error ? AppColors.error : AppColors.borderLight};
  border-radius: 8px;
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.onSurface};
  background-color: ${AppColors.input};
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
  }

  &:disabled {
    background-color: ${AppColors.background};
    opacity: 0.5;
  }
`;

const TextArea = styled.textarea<{ $error?: boolean }>`
  width: 100%;
  min-width: 0;
  padding: 12px;
  border: 1px solid ${({ $error }) => $error ? AppColors.error : AppColors.borderLight};
  border-radius: 8px;
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.onSurface};
  background-color: ${AppColors.input};
  box-sizing: border-box;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
  
  &::placeholder {
    color: ${AppColors.onInput1};
  }

  &:disabled {
    background-color: ${AppColors.background};
    opacity: 0.5;
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

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 새 상품 추가 폼 상태
  const [newProductName, setNewProductName] = useState('');
  const [newBranchId, setNewBranchId] = useState('');
  const [newProgramId, setNewProgramId] = useState('');
  const [newSessions, setNewSessions] = useState<number | ''>('');
  const [newMonths, setNewMonths] = useState<number | ''>(''); // 기간제용 개월수
  const [newDuration, setNewDuration] = useState<number>(30); // 기본 30분
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newDescription, setNewDescription] = useState('');
  
  // 수정 폼 상태
  const [editProductName, setEditProductName] = useState('');
  const [editBranchId, setEditBranchId] = useState('');
  const [editProgramId, setEditProgramId] = useState('');
  const [editSessions, setEditSessions] = useState<number | ''>('');
  const [editMonths, setEditMonths] = useState<number | ''>(''); // 기간제용 개월수
  const [editDuration, setEditDuration] = useState<number>(30); // 기본 30분
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editDescription, setEditDescription] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasPermission, setHasPermission] = useState(false);
  const [userPermission, setUserPermission] = useState<string>('');
  const [userBranchId, setUserBranchId] = useState<string>('');

  // 선택된 프로그램 정보
  const selectedProgram = programs.find(p => p.id === newProgramId);
  const editSelectedProgram = programs.find(p => p.id === editProgramId);

  // 드롭다운 옵션 생성 ('전체' 지점 제외)
  const branchOptions = branches
    .filter(branch => branch.name !== '전체')
    .map(branch => ({
      value: branch.id,
      label: branch.name
    }));

  // EDITOR인 경우 본인 지점만 표시
  const availableBranchOptions = userPermission === 'EDITOR' 
    ? branchOptions.filter(option => option.value === userBranchId)
    : branchOptions;

  const programOptions = programs.map(program => ({
    value: program.id,
    label: `${program.name} (${program.type})`
  }));

  // 소요시간 옵션 (횟수제인 경우에만 사용)
  const durationOptions = [
    { value: 30, label: '30분' },
    { value: 50, label: '50분' }
  ];

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

  useEffect(() => {
    if (editSelectedProgram) {
      const autoName = generateProductName(
        editSelectedProgram.name, 
        editSelectedProgram.type === '횟수제' ? editSessions : undefined,
        editSelectedProgram.type === '기간제' ? editMonths : undefined
      );
      setEditProductName(autoName);
    }
  }, [editSelectedProgram, editSessions, editMonths, generateProductName]);

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
          
          // 권한별 접근 설정
          const isMaster = currentUser.permission === 'MASTER';
          const isSystemAdmin = adminId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
          const isEditor = currentUser.permission === 'EDITOR';
          
          // MASTER와 시스템 관리자, EDITOR는 편집 가능, VIEW는 조회만
          setHasPermission(isMaster || isSystemAdmin || isEditor);
          
          // EDITOR인 경우 본인 지점으로 자동 설정
          if (isEditor) {
            setNewBranchId(currentUser.branchId);
            setEditBranchId(currentUser.branchId);
          }
        }
        
        loadData();
      } else {
        setHasPermission(false);
        setUserPermission('');
        setUserBranchId('');
        loadData(); // 로그인하지 않아도 목록은 볼 수 있음
      }
    } catch (error) {
      console.error('권한 체크 실패:', error);
      setHasPermission(false);
      setUserPermission('');
      setUserBranchId('');
      loadData(); // 에러가 있어도 목록은 표시
    }
  }, []);

  useEffect(() => {
    checkPermissionAndLoadData();
  }, [checkPermissionAndLoadData]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 병렬로 데이터 로드
      const [productData, branchData, programData] = await Promise.all([
        dbManager.getAllProducts(),
        dbManager.getAllBranches(),
        dbManager.getAllPrograms()
      ]);
      
      // 최신 등록 순서로 정렬 (createdAt 내림차순)
      const sortedProducts = productData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setProducts(sortedProducts);
      setBranches(branchData.filter(branch => branch.isActive));
      setPrograms(programData.filter(program => program.isActive));
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (name: string, branchId: string, programId: string, sessions?: number | '', months?: number | ''): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = '상품명을 입력해주세요.';
    }

    if (!branchId) {
      newErrors.branchId = '지점을 선택해주세요.';
    }

    if (!programId) {
      newErrors.programId = '프로그램을 선택해주세요.';
    }

    // 프로그램 타입에 따른 검증
    const program = programs.find(p => p.id === programId);
    if (program) {
      if (program.type === '횟수제') {
        if (!sessions || sessions <= 0) {
          newErrors.sessions = '횟수를 입력해주세요.';
        }
      } else if (program.type === '기간제') {
        if (!months || months <= 0) {
          newErrors.months = '개월수를 입력해주세요.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddProduct = async () => {
    if (!validateForm(newProductName, newBranchId, newProgramId, newSessions, newMonths)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const selectedBranch = branches.find(b => b.id === newBranchId);
      const selectedProgram = programs.find(p => p.id === newProgramId);
      
      if (!selectedBranch || !selectedProgram) {
        throw new Error('선택된 지점 또는 프로그램 정보를 찾을 수 없습니다.');
      }

      const newProduct = await dbManager.addProduct({
        name: newProductName.trim(),
        branchId: newBranchId,
        programId: newProgramId,
        programName: selectedProgram.name,
        programType: selectedProgram.type,
        sessions: selectedProgram.type === '횟수제' ? Number(newSessions) : undefined,
        months: selectedProgram.type === '기간제' ? Number(newMonths) : undefined,
        duration: selectedProgram.type === '횟수제' ? newDuration : undefined,
        price: newPrice ? Number(newPrice) : undefined,
        description: newDescription.trim() || undefined,
        isActive: true,
      });
      
      // 새로운 상품 추가 후 정렬 유지
      setProducts(prev => {
        const updated = [newProduct, ...prev];
        return updated.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      
      // 폼 초기화
      setNewProductName('');
      setNewBranchId('');
      setNewProgramId('');
      setNewSessions('');
      setNewMonths('');
      setNewDuration(30);
      setNewPrice('');
      setNewDescription('');
      setIsAdding(false);
      setEditingId(null);
      setErrors({});
      
      console.log('새 상품 추가됨:', newProduct);
    } catch (err) {
      console.error('상품 추가 실패:', err);
      setError('상품 추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    // EDITOR인 경우 본인 지점 상품만 삭제 가능
    const product = products.find(p => p.id === id);
    if (userPermission === 'EDITOR' && product && product.branchId !== userBranchId) {
      setError('본인 지점의 상품만 삭제할 수 있습니다.');
      return;
    }
    
    if (!window.confirm('정말로 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) {
      return;
    }

    try {
      setError(null);
      const success = await dbManager.deleteProduct(id);
      
      if (success) {
        setProducts(prev => prev.filter(product => product.id !== id));
        console.log('상품 삭제됨:', id);
      } else {
        throw new Error('삭제 실패');
      }
    } catch (err) {
      console.error('상품 삭제 실패:', err);
      setError('상품 삭제에 실패했습니다.');
    }
  };

  const handleEditProduct = (product: Product) => {
    // EDITOR인 경우 본인 지점 상품만 수정 가능
    if (userPermission === 'EDITOR' && product.branchId !== userBranchId) {
      setError('본인 지점의 상품만 수정할 수 있습니다.');
      return;
    }
    
    setEditingId(product.id);
    setEditProductName(product.name);
    setEditBranchId(product.branchId);
    setEditProgramId(product.programId);
    setEditSessions(product.sessions || '');
    setEditMonths(product.months || '');
    setEditDuration(product.duration || 30);
    setEditPrice(product.price || '');
    setEditDescription(product.description || '');
    setIsAdding(false);
    setErrors({});
  };

  const handleUpdateProduct = async () => {
    if (!validateForm(editProductName, editBranchId, editProgramId, editSessions, editMonths)) {
      return;
    }

    if (!editingId) return;

    try {
      setSaving(true);
      setError(null);
      
      const selectedBranch = branches.find(b => b.id === editBranchId);
      const selectedProgram = programs.find(p => p.id === editProgramId);
      
      if (!selectedBranch || !selectedProgram) {
        throw new Error('선택된 지점 또는 프로그램 정보를 찾을 수 없습니다.');
      }

      const updatedProduct = await dbManager.updateProduct(editingId, {
        name: editProductName.trim(),
        branchId: editBranchId,
        programId: editProgramId,
        programName: selectedProgram.name,
        programType: selectedProgram.type,
        sessions: selectedProgram.type === '횟수제' ? Number(editSessions) : undefined,
        months: selectedProgram.type === '기간제' ? Number(editMonths) : undefined,
        duration: selectedProgram.type === '횟수제' ? editDuration : undefined,
        price: editPrice ? Number(editPrice) : undefined,
        description: editDescription.trim() || undefined,
      });
      
      if (updatedProduct) {
        setProducts(prev => prev.map(product => 
          product.id === editingId ? updatedProduct : product
        ));
        
        handleCancelEdit();
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

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditProductName('');
    setEditBranchId('');
    setEditProgramId('');
    setEditSessions('');
    setEditMonths('');
    setEditDuration(30);
    setEditPrice('');
    setEditDescription('');
    setError(null);
    setErrors({});
  };

  const handleCancel = () => {
    setNewProductName('');
    setNewBranchId('');
    setNewProgramId('');
    setNewSessions('');
    setNewMonths('');
    setNewDuration(30);
    setNewPrice('');
    setNewDescription('');
    setIsAdding(false);
    setEditingId(null);
    setEditProductName('');
    setEditBranchId('');
    setEditProgramId('');
    setEditSessions('');
    setEditMonths('');
    setEditDuration(30);
    setEditPrice('');
    setEditDescription('');
    setError(null);
    setErrors({});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving) {
      handleAddProduct();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving) {
      handleUpdateProduct();
    }
  };

  // 지점명과 프로그램명 가져오는 헬퍼 함수
  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : '알 수 없는 지점';
  };

  if (loading) {
    return (
      
        <Container>
          <LoadingState>상품 데이터를 불러오는 중...</LoadingState>
        </Container>
      
    );
  }

  return (
    
      <Container>
        {error && (
          <ErrorState>
            {error}
            <RefreshButton onClick={loadData}>
              다시 시도
            </RefreshButton>
          </ErrorState>
        )}

        {hasPermission && isAdding && (
          <AddForm>
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
                <Label $required>프로그램</Label>
                <CustomDropdown
                  value={newProgramId}
                  onChange={(value: string) => setNewProgramId(value)}
                  options={programOptions}
                  placeholder="프로그램을 선택하세요"
                  error={!!errors.programId}
                  disabled={saving}
                  required
                />
                {errors.programId && <ErrorText>{errors.programId}</ErrorText>}
              </FieldColumn>
            </FormRow>
            
            <FormRow>
              <FieldColumn>
                <Label $required={selectedProgram?.type === '횟수제'}>횟수</Label>
                <Input
                  type="number"
                  placeholder={selectedProgram?.type === '횟수제' ? "횟수를 입력하세요" : "기간제는 횟수 불필요"}
                  value={newSessions}
                  onChange={(e) => setNewSessions(e.target.value ? Number(e.target.value) : '')}
                  onKeyPress={handleKeyPress}
                  disabled={saving || !selectedProgram || selectedProgram.type === '기간제'}
                  $error={!!errors.sessions}
                  min={1}
                />
                {errors.sessions && <ErrorText>{errors.sessions}</ErrorText>}
              </FieldColumn>
              <FieldColumn>
                <Label $required={selectedProgram?.type === '기간제'}>개월수</Label>
                <Input
                  type="number"
                  placeholder={selectedProgram?.type === '기간제' ? "개월수를 입력하세요" : "횟수제는 개월수 불필요"}
                  value={newMonths}
                  onChange={(e) => setNewMonths(e.target.value ? Number(e.target.value) : '')}
                  onKeyPress={handleKeyPress}
                  disabled={saving || !selectedProgram || selectedProgram.type === '횟수제'}
                  $error={!!errors.months}
                  min={1}
                />
                {errors.months && <ErrorText>{errors.months}</ErrorText>}
              </FieldColumn>
            </FormRow>
            
            <FormRow>
              <FieldColumn>
                <Label $required={selectedProgram?.type === '횟수제'}>소요시간</Label>
                <CustomDropdown
                  value={newDuration.toString()}
                  onChange={(value: string) => setNewDuration(Number(value))}
                  options={durationOptions.map(option => ({ value: option.value.toString(), label: option.label }))}
                  placeholder={selectedProgram?.type === '횟수제' ? "소요시간을 선택하세요" : "기간제는 소요시간 불필요"}
                  disabled={saving || !selectedProgram || selectedProgram.type === '기간제'}
                  required={selectedProgram?.type === '횟수제'}
                />
              </FieldColumn>
            </FormRow>
            
            <FormRow>
              <FieldColumn>
                <Label>가격</Label>
                <Input
                  type="number"
                  placeholder="가격을 입력하세요 (원)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value ? Number(e.target.value) : '')}
                  onKeyPress={handleKeyPress}
                  disabled={saving}
                  min={0}
                />
              </FieldColumn>
            </FormRow>
            
            <FormRow>
              <FieldColumn>
                <Label $required>상품명</Label>
                <Input
                  type="text"
                  placeholder="상품명을 입력하세요"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={saving}
                  $error={!!errors.name}
                />
                {errors.name && <ErrorText>{errors.name}</ErrorText>}
              </FieldColumn>
            </FormRow>
            
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
            setEditProductName('');
            setEditBranchId('');
            setEditProgramId('');
            setEditSessions('');
            setEditMonths('');
            setEditDuration(30);
            setEditPrice('');
            setEditDescription('');
            setErrors({});
          }} disabled={loading || editingId !== null}>
            + 새 상품 추가
          </AddButton>
        )}

        {!hasPermission && (
          <ErrorState style={{ marginBottom: '16px', backgroundColor: `${AppColors.primary}10`, borderColor: AppColors.primary, color: AppColors.primary }}>
            ℹ️ 상품 목록 조회만 가능합니다. 추가/수정/삭제는 MASTER 또는 EDITOR 권한이 필요합니다.
          </ErrorState>
        )}

        {hasPermission && userPermission === 'EDITOR' && (
          <ErrorState style={{ marginBottom: '16px', backgroundColor: `${AppColors.secondary}10`, borderColor: AppColors.secondary, color: AppColors.secondary }}>
            ℹ️ EDITOR 권한으로 본인 지점({getBranchName(userBranchId)})의 상품만 관리할 수 있습니다.
          </ErrorState>
        )}

        <Table>
          <TableHeader>
            상품 목록
            <TableStats>총 {products.length}개 상품</TableStats>
          </TableHeader>
          {products.length === 0 ? (
            <EmptyState>등록된 상품이 없습니다.</EmptyState>
          ) : (
            products.map((product) => (
              <TableRow 
                key={product.id}
                style={editingId === product.id ? {
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  padding: '16px',
                  backgroundColor: `${AppColors.primary}05`
                } : {}}
              >
                {editingId === product.id ? (
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
                        <Label $required>지점</Label>
                        <CustomDropdown
                          value={editBranchId}
                          onChange={(value: string) => setEditBranchId(value)}
                          options={availableBranchOptions}
                          placeholder="지점을 선택하세요"
                          error={!!errors.branchId}
                          disabled={saving || userPermission === 'EDITOR'}
                          required
                        />
                        {errors.branchId && <ErrorText>{errors.branchId}</ErrorText>}
                      </FieldColumn>
                      <FieldColumn>
                        <Label $required>프로그램</Label>
                        <CustomDropdown
                          value={editProgramId}
                          onChange={(value: string) => setEditProgramId(value)}
                          options={programOptions}
                          placeholder="프로그램을 선택하세요"
                          error={!!errors.programId}
                          disabled={saving}
                          required
                        />
                        {errors.programId && <ErrorText>{errors.programId}</ErrorText>}
                      </FieldColumn>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <FieldColumn>
                        <Label $required={editSelectedProgram?.type === '횟수제'}>횟수</Label>
                        <Input
                          type="number"
                          placeholder={editSelectedProgram?.type === '횟수제' ? "횟수를 입력하세요" : "기간제는 횟수 불필요"}
                          value={editSessions}
                          onChange={(e) => setEditSessions(e.target.value ? Number(e.target.value) : '')}
                          onKeyPress={handleEditKeyPress}
                          disabled={saving || !editSelectedProgram || editSelectedProgram.type === '기간제'}
                          $error={!!errors.sessions}
                          min={1}
                        />
                        {errors.sessions && <ErrorText>{errors.sessions}</ErrorText>}
                      </FieldColumn>
                      <FieldColumn>
                        <Label $required={editSelectedProgram?.type === '기간제'}>개월수</Label>
                        <Input
                          type="number"
                          placeholder={editSelectedProgram?.type === '기간제' ? "개월수를 입력하세요" : "횟수제는 개월수 불필요"}
                          value={editMonths}
                          onChange={(e) => setEditMonths(e.target.value ? Number(e.target.value) : '')}
                          onKeyPress={handleEditKeyPress}
                          disabled={saving || !editSelectedProgram || editSelectedProgram.type === '횟수제'}
                          $error={!!errors.months}
                          min={1}
                        />
                        {errors.months && <ErrorText>{errors.months}</ErrorText>}
                      </FieldColumn>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <FieldColumn>
                        <Label $required={editSelectedProgram?.type === '횟수제'}>소요시간</Label>
                        <CustomDropdown
                          value={editDuration.toString()}
                          onChange={(value: string) => setEditDuration(Number(value))}
                          options={durationOptions.map(option => ({ value: option.value.toString(), label: option.label }))}
                          placeholder={editSelectedProgram?.type === '횟수제' ? "소요시간을 선택하세요" : "기간제는 소요시간 불필요"}
                          disabled={saving || !editSelectedProgram || editSelectedProgram.type === '기간제'}
                          required={editSelectedProgram?.type === '횟수제'}
                        />
                      </FieldColumn>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <FieldColumn>
                        <Label>가격</Label>
                        <Input
                          type="number"
                          placeholder="가격을 입력하세요 (원)"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value ? Number(e.target.value) : '')}
                          onKeyPress={handleEditKeyPress}
                          disabled={saving}
                          min={0}
                        />
                      </FieldColumn>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <FieldColumn>
                        <Label $required>상품명</Label>
                        <Input
                          type="text"
                          placeholder="상품명을 입력하세요"
                          value={editProductName}
                          onChange={(e) => setEditProductName(e.target.value)}
                          onKeyPress={handleEditKeyPress}
                          disabled={saving}
                          $error={!!errors.name}
                        />
                        {errors.name && <ErrorText>{errors.name}</ErrorText>}
                      </FieldColumn>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <FieldColumn>
                        <Label>상품소개</Label>
                        <TextArea
                          placeholder="상품에 대한 설명을 입력하세요 (선택사항)"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          disabled={saving}
                        />
                      </FieldColumn>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      justifyContent: 'flex-end',
                      marginTop: '4px'
                    }}>
                      <SaveButton 
                        onClick={handleUpdateProduct} 
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
                    <ProductInfo>
                      <ProductName>{product.name}</ProductName>
                      <ProductDetails>
                        <DetailItem>
                          <DetailLabel>지점:</DetailLabel>
                          <DetailValue>{getBranchName(product.branchId)}</DetailValue>
                        </DetailItem>
                        <DetailItem>
                          <DetailLabel>프로그램:</DetailLabel>
                          <DetailValue>{product.programName} ({product.programType})</DetailValue>
                        </DetailItem>
                        {product.sessions && (
                          <DetailItem>
                            <DetailLabel>횟수:</DetailLabel>
                            <DetailValue>{product.sessions}회</DetailValue>
                          </DetailItem>
                        )}
                        {product.months && (
                          <DetailItem>
                            <DetailLabel>개월수:</DetailLabel>
                            <DetailValue>{product.months}개월</DetailValue>
                          </DetailItem>
                        )}
                        {product.duration && (
                          <DetailItem>
                            <DetailLabel>소요시간:</DetailLabel>
                            <DetailValue>{product.duration}분</DetailValue>
                          </DetailItem>
                        )}
                        {product.price && (
                          <DetailItem>
                            <DetailLabel>가격:</DetailLabel>
                            <DetailValue>{product.price.toLocaleString()}원</DetailValue>
                          </DetailItem>
                        )}
                        {product.description && (
                          <DetailItem>
                            <DetailLabel>소개:</DetailLabel>
                            <DetailValue style={{ 
                              maxWidth: '400px', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap' 
                            }}>
                              {product.description}
                            </DetailValue>
                          </DetailItem>
                        )}
                      </ProductDetails>
                    </ProductInfo>
                    {hasPermission && (
                      <ActionButtons>
                        <EditButton 
                          onClick={() => handleEditProduct(product)}
                          disabled={saving || editingId !== null || (userPermission === 'EDITOR' && product.branchId !== userBranchId)}
                        >
                          수정
                        </EditButton>
                        <DeleteButton 
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={saving || editingId !== null || (userPermission === 'EDITOR' && product.branchId !== userBranchId)}
                        >
                          삭제
                        </DeleteButton>
                      </ActionButtons>
                    )}
                  </>
                )}
              </TableRow>
            ))
          )}
        </Table>
      </Container>
    
  );
};

export default ProductManagement;
