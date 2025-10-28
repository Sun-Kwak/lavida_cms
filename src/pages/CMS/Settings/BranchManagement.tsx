import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, Branch } from '../../../utils/indexedDB';

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

const BranchInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const BranchName = styled.span`
  font-weight: 500;
`;

const BranchDetails = styled.div`
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

const Input = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  font-size: ${AppTextStyles.body2.fontSize};
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
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

const BranchManagement: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchAddress, setEditBranchAddress] = useState('');
  const [editBranchPhone, setEditBranchPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const branchData = await dbManager.getAllBranches();
      // 오래된 등록 순서로 정렬 (createdAt 오름차순)
      const sortedBranches = branchData.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setBranches(sortedBranches);
    } catch (err) {
      console.error('지점 데이터 로드 실패:', err);
      setError('지점 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async () => {
    if (!newBranchName.trim()) {
      alert('지점명을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const newBranch = await dbManager.addBranch({
        name: newBranchName.trim(),
        address: newBranchAddress.trim() || undefined,
        phone: newBranchPhone.trim() || undefined,
        isActive: true,
      });
      
      // 새로운 지점 추가 후 정렬 유지
      setBranches(prev => {
        const updated = [...prev, newBranch];
        return updated.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      setNewBranchName('');
      setNewBranchAddress('');
      setNewBranchPhone('');
      setIsAdding(false);
      setEditingId(null); // 수정 모드 해제
      
      console.log('새 지점 추가됨:', newBranch);
    } catch (err) {
      console.error('지점 추가 실패:', err);
      setError('지점 추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!window.confirm('정말로 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) {
      return;
    }

    try {
      setError(null);
      const success = await dbManager.deleteBranch(id);
      
      if (success) {
        setBranches(prev => prev.filter(branch => branch.id !== id));
        console.log('지점 삭제됨:', id);
      } else {
        throw new Error('삭제 실패');
      }
    } catch (err) {
      console.error('지점 삭제 실패:', err);
      setError('지점 삭제에 실패했습니다.');
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingId(branch.id);
    setEditBranchName(branch.name);
    setEditBranchAddress(branch.address || '');
    setEditBranchPhone(branch.phone || '');
    setIsAdding(false);
  };

  const handleUpdateBranch = async () => {
    if (!editBranchName.trim()) {
      alert('지점명을 입력해주세요.');
      return;
    }

    if (!editingId) return;

    try {
      setSaving(true);
      setError(null);
      
      const updatedBranch = await dbManager.updateBranch(editingId, {
        name: editBranchName.trim(),
        address: editBranchAddress.trim() || undefined,
        phone: editBranchPhone.trim() || undefined,
      });
      
      if (updatedBranch) {
        setBranches(prev => prev.map(branch => 
          branch.id === editingId ? updatedBranch : branch
        ));
        
        handleCancelEdit();
        console.log('지점 수정됨:', updatedBranch);
      } else {
        throw new Error('수정 실패');
      }
    } catch (err) {
      console.error('지점 수정 실패:', err);
      setError('지점 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditBranchName('');
    setEditBranchAddress('');
    setEditBranchPhone('');
    setError(null);
  };

  const handleCancel = () => {
    setNewBranchName('');
    setNewBranchAddress('');
    setNewBranchPhone('');
    setIsAdding(false);
    setEditingId(null);
    setEditBranchName('');
    setEditBranchAddress('');
    setEditBranchPhone('');
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving) {
      handleAddBranch();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving) {
      handleUpdateBranch();
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>지점 데이터를 불러오는 중...</LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      {error && (
        <ErrorState>
          {error}
          <RefreshButton onClick={loadBranches}>
            다시 시도
          </RefreshButton>
        </ErrorState>
      )}

      {isAdding && (
        <AddForm>
          <FormRow>
            <Input
              type="text"
              placeholder="지점명 (필수)"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={saving}
              autoFocus
            />
          </FormRow>
          <FormRow>
            <Input
              type="text"
              placeholder="주소 (선택)"
              value={newBranchAddress}
              onChange={(e) => setNewBranchAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={saving}
            />
          </FormRow>
          <FormRow>
            <Input
              type="text"
              placeholder="전화번호 (선택)"
              value={newBranchPhone}
              onChange={(e) => setNewBranchPhone(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={saving}
            />
          </FormRow>
          <FormButtons>
            <SaveButton onClick={handleAddBranch} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </SaveButton>
            <CancelButton onClick={handleCancel} disabled={saving}>
              취소
            </CancelButton>
          </FormButtons>
        </AddForm>
      )}

      {!isAdding && (
        <AddButton onClick={() => {
          setIsAdding(true);
          setEditingId(null);
          setEditBranchName('');
          setEditBranchAddress('');
          setEditBranchPhone('');
        }} disabled={loading || editingId !== null}>
          + 새 지점 추가
        </AddButton>
      )}

      <Table>
        <TableHeader>
          지점 목록
          <TableStats>총 {branches.length}개 지점</TableStats>
        </TableHeader>
        {branches.length === 0 ? (
          <EmptyState>등록된 지점이 없습니다.</EmptyState>
        ) : (
          branches.map((branch) => (
            <TableRow 
              key={branch.id}
              style={editingId === branch.id ? {
                flexDirection: 'column',
                alignItems: 'stretch',
                padding: '16px',
                backgroundColor: `${AppColors.primary}05`
              } : {}}
            >
              {editingId === branch.id ? (
                // 수정 모드
                <div style={{ 
                  width: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  padding: '8px 0'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Input
                      type="text"
                      value={editBranchName}
                      onChange={(e) => setEditBranchName(e.target.value)}
                      onKeyPress={handleEditKeyPress}
                      disabled={saving}
                      placeholder="지점명 (필수)"
                      autoFocus
                    />
                    <Input
                      type="text"
                      value={editBranchAddress}
                      onChange={(e) => setEditBranchAddress(e.target.value)}
                      onKeyPress={handleEditKeyPress}
                      disabled={saving}
                      placeholder="주소 (선택)"
                    />
                    <Input
                      type="text"
                      value={editBranchPhone}
                      onChange={(e) => setEditBranchPhone(e.target.value)}
                      onKeyPress={handleEditKeyPress}
                      disabled={saving}
                      placeholder="전화번호 (선택)"
                    />
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    justifyContent: 'flex-end',
                    marginTop: '4px'
                  }}>
                    <SaveButton 
                      onClick={handleUpdateBranch} 
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
                  <BranchInfo>
                    <BranchName>{branch.name}</BranchName>
                    <BranchDetails>
                      {branch.address && (
                        <DetailItem>
                          <DetailLabel>주소:</DetailLabel>
                          <DetailValue>{branch.address}</DetailValue>
                        </DetailItem>
                      )}
                      {branch.phone && (
                        <DetailItem>
                          <DetailLabel>전화:</DetailLabel>
                          <DetailValue>{branch.phone}</DetailValue>
                        </DetailItem>
                      )}
                    </BranchDetails>
                  </BranchInfo>
                  <ActionButtons>
                    <EditButton 
                      onClick={() => handleEditBranch(branch)}
                      disabled={saving || editingId !== null}
                    >
                      수정
                    </EditButton>
                    <DeleteButton 
                      onClick={() => handleDeleteBranch(branch.id)}
                      disabled={saving || editingId !== null}
                    >
                      삭제
                    </DeleteButton>
                  </ActionButtons>
                </>
              )}
            </TableRow>
          ))
        )}
      </Table>
    </Container>
  );
};

export default BranchManagement;
