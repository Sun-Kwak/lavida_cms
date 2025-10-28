import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, Program } from '../../../utils/indexedDB';
import CustomDropdown from '../../../components/CustomDropdown';
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

const ProgramManagement: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramType, setNewProgramType] = useState('');
  const [editProgramName, setEditProgramName] = useState('');
  const [editProgramType, setEditProgramType] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasPermission, setHasPermission] = useState(false);
  const [programUsageCount, setProgramUsageCount] = useState<{ [key: string]: number }>({});

  // 프로그램 종류 옵션
  const programTypeOptions = useMemo(() => [
    { value: '횟수제', label: '횟수제' },
    { value: '기간제', label: '기간제' }
  ], []);

  // 컴포넌트 마운트 시 권한 체크 및 데이터 로드
  const checkPermissionAndLoadData = useCallback(async () => {
    try {
      const adminId = sessionStorage.getItem('adminId');
      
      if (adminId) {
        // 현재 로그인한 사용자 정보 가져오기
        const allStaff = await dbManager.getAllStaff();
        const currentUser = allStaff.find(staff => staff.loginId === adminId);
        
        // MASTER 권한 또는 시스템 관리자만 편집 가능
        const isMaster = currentUser && currentUser.permission === 'MASTER';
        const isSystemAdmin = adminId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
        
        setHasPermission(isMaster || isSystemAdmin);
      } else {
        setHasPermission(false);
      }
      
      // 프로그램 목록 로드
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
              <TableRow 
                key={program.id}
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
                    {hasPermission && (
                      <ActionButtons>
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
            ))
          )}
        </Table>
      </Container>
    );
  };

export default ProgramManagement;
