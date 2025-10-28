import React, { useState, useEffect } from 'react';
import { StepContent, StepTitle, FormGrid, FormField, Label, CheckboxLabel, Checkbox } from './StyledComponents';
import { JoinInfo, StepProps } from './types';
import CustomDropdown from '../../../components/CustomDropdown';
import { AppSearchDropdown, SearchResultItem } from '../../../customComponents/AppSearchDropdown';
import { AppIdTextField } from '../../../customComponents/AppIdTextField';
import { AppPwdTextField, PwdFieldType } from '../../../customComponents/AppPwdTextField';
import { dbManager, type Branch, type Staff, type Member } from '../../../utils/indexedDB';

const JoinInfoStep: React.FC<StepProps> = ({ formData, onUpdate }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [staffSearchResults, setStaffSearchResults] = useState<SearchResultItem[]>([]);
  const [referrerSearchTerm, setReferrerSearchTerm] = useState('');
  const [referrerSearchResults, setReferrerSearchResults] = useState<SearchResultItem[]>([]);
  const joinPaths = ['지인추천', '당근마켓', '네이버 플레이스', '전화', '워크인', '현수막', '인스타', '광고지', '기타'];

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadBranches();
    loadStaff();
    loadMembers();
  }, []);

  // 지점 데이터 로드
  const loadBranches = async () => {
    try {
      const branchData = await dbManager.getAllBranches();
      // 활성 지점만 필터링하고 '전체' 지점 제외 (마스터 권한용이므로)
      const activeBranches = branchData.filter(branch => 
        branch.isActive && branch.name !== '전체'
      );
      setBranches(activeBranches);
    } catch (error) {
      console.error('지점 데이터 로드 실패:', error);
    }
  };

  // 직원 데이터 로드
  const loadStaff = async () => {
    try {
      const staffData = await dbManager.getAllStaff();
      console.log('전체 직원 목록:', staffData);
      
      // 활성 직원만 필터링 (isActive가 undefined인 경우 true로 간주)
      const activeStaff = staffData.filter(employee => 
        employee.isActive === true || employee.isActive === undefined
      );
      console.log('활성 직원 목록:', activeStaff);
      
      setStaff(activeStaff);
    } catch (error) {
      console.error('직원 데이터 로드 실패:', error);
    }
  };

  // 회원 데이터 로드
  const loadMembers = async () => {
    try {
      const memberData = await dbManager.getAllMembers();
      console.log('전체 회원 목록:', memberData);
      
      // 활성 회원만 필터링
      const activeMembers = memberData.filter(member => 
        member.isActive === true || member.isActive === undefined
      );
      console.log('활성 회원 목록:', activeMembers);
      
      setMembers(activeMembers);
    } catch (error) {
      console.error('회원 데이터 로드 실패:', error);
    }
  };

  // 지점 옵션 생성
  const getBranchOptions = () => 
    branches.map(branch => ({ value: branch.id, label: branch.name }));

  // 가입경로 옵션 생성
  const getJoinPathOptions = () => 
    joinPaths.map(path => ({ value: path, label: path }));

  // 직원 검색 함수
  const handleStaffSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setStaffSearchResults([]);
      return;
    }

    console.log('직원 검색 실행:', searchTerm);
    console.log('검색 대상 직원 수:', staff.length);

    const filteredStaff = staff.filter(employee => 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.loginId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log('검색 결과:', filteredStaff);

    const searchResults: SearchResultItem[] = filteredStaff.map(employee => ({
      id: employee.id,
      title: employee.name,
      subtitle: `${employee.position} | ${employee.role}`,
      description: `연락처: ${employee.phone} | 권한: ${employee.permission}`,
      data: employee
    }));

    setStaffSearchResults(searchResults);
  };

  // 직원 선택 함수
  const handleStaffSelect = (item: SearchResultItem) => {
    if (typeof item === 'object' && 'data' in item) {
      const selectedEmployee = item.data as Staff;
      handleInputChange('coach', selectedEmployee.id);
    }
  };

  // 직원 선택 해제 함수
  const handleStaffClear = () => {
    setStaffSearchTerm('');
    setStaffSearchResults([]);
    handleInputChange('coach', '');
  };

  // 지인추천인 검색 함수
  const handleReferrerSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setReferrerSearchResults([]);
      return;
    }

    console.log('지인추천인 검색 실행:', searchTerm);
    console.log('검색 대상 회원 수:', members.length);

    const filteredMembers = members.filter(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.loginId && member.loginId.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    console.log('지인추천인 검색 결과:', filteredMembers);

    const searchResults: SearchResultItem[] = filteredMembers.map(member => ({
      id: member.id,
      title: member.name,
      subtitle: `${member.phone} | ${member.branchName || '지점정보없음'}`,
      description: `이메일: ${member.email || '없음'} | 등록일: ${new Date(member.registrationDate).toLocaleDateString()}`,
      data: member
    }));

    setReferrerSearchResults(searchResults);
  };

  // 지인추천인 선택 함수
  const handleReferrerSelect = (item: SearchResultItem) => {
    if (typeof item === 'object' && 'data' in item) {
      const selectedMember = item.data as Member;
      console.log('지인추천인 선택됨:', selectedMember);
      console.log('선택된 회원 ID:', selectedMember.id);
      console.log('선택된 회원 이름:', selectedMember.name);
      
      // 한 번에 두 필드를 모두 업데이트
      const updatedJoinInfo = {
        ...formData.joinInfo,
        referrerId: selectedMember.id,
        referrerName: selectedMember.name
      };
      
      console.log('한번에 업데이트할 joinInfo:', updatedJoinInfo);
      
      onUpdate({
        joinInfo: updatedJoinInfo
      });
    }
  };

  // 지인추천인 선택 해제 함수
  const handleReferrerClear = () => {
    setReferrerSearchTerm('');
    setReferrerSearchResults([]);
    
    // 한 번에 두 필드를 모두 해제
    const updatedJoinInfo = {
      ...formData.joinInfo,
      referrerId: '',
      referrerName: ''
    };
    
    onUpdate({
      joinInfo: updatedJoinInfo
    });
  };

  // 선택된 지인추천인 정보 가져오기
  const getSelectedReferrerName = () => {
    console.log('getSelectedReferrerName 호출됨');
    console.log('formData.joinInfo.referrerId:', formData.joinInfo.referrerId);
    console.log('formData.joinInfo.referrerName:', formData.joinInfo.referrerName);
    
    if (formData.joinInfo.referrerId && formData.joinInfo.referrerName) {
      console.log('선택된 추천인 이름 반환:', formData.joinInfo.referrerName);
      return formData.joinInfo.referrerName;
    }
    console.log('선택된 추천인 없음, 빈 문자열 반환');
    return '';
  };

  // 선택된 직원 정보 가져오기
  const getSelectedStaffName = () => {
    if (formData.joinInfo.coach) {
      const selectedEmployee = staff.find(emp => emp.id === formData.joinInfo.coach);
      return selectedEmployee ? selectedEmployee.name : '';
    }
    return '';
  };

  const handleInputChange = (field: keyof JoinInfo, value: string | boolean) => {
    console.log(`handleInputChange 호출됨: ${field} = ${value}`);
    const updatedJoinInfo = { ...formData.joinInfo, [field]: value };
    console.log('업데이트된 joinInfo:', updatedJoinInfo);
    
    onUpdate({
      joinInfo: updatedJoinInfo
    });
  };

  return (
    <StepContent>
      <StepTitle>가입정보</StepTitle>
      <FormGrid>
        <FormField>
          <Label>지점 *</Label>
          <CustomDropdown
            value={formData.joinInfo.branchId}
            onChange={(value: string) => handleInputChange('branchId', value)}
            options={getBranchOptions()}
            placeholder="지점을 선택하세요"
            required
          />
        </FormField>

        <FormField>
          <Label>담당 직원 *</Label>
          <AppSearchDropdown
            selectedValue={getSelectedStaffName()}
            searchTerm={staffSearchTerm}
            onSearchTermChange={setStaffSearchTerm}
            onSearch={handleStaffSearch}
            onSelectItem={handleStaffSelect}
            onClear={handleStaffClear}
            results={staffSearchResults}
            label="담당 직원"
            placeholder="직원 이름, 로그인ID, 직급, 직책으로 검색하세요"
          />
        </FormField>

        <FormField>
          <Label>가입경로 *</Label>
          <CustomDropdown
            value={formData.joinInfo.joinPath}
            onChange={(value: string) => {
              if (value !== '지인추천') {
                // 가입경로가 지인추천이 아닐 때는 지인추천인 정보 초기화
                const updatedJoinInfo = {
                  ...formData.joinInfo,
                  joinPath: value,
                  referrerId: '',
                  referrerName: ''
                };
                onUpdate({
                  joinInfo: updatedJoinInfo
                });
              } else {
                handleInputChange('joinPath', value);
              }
            }}
            options={getJoinPathOptions()}
            placeholder="가입경로를 선택하세요"
            required
          />
        </FormField>

        {/* 지인추천일 때만 지인추천인 검색 필드 표시 */}
        {formData.joinInfo.joinPath === '지인추천' && (
          <FormField>
            <Label>지인추천인 *</Label>
            {formData.joinInfo.referrerName ? (
              <div style={{
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{formData.joinInfo.referrerName}</span>
                <button
                  type="button"
                  onClick={handleReferrerClear}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#dc3545',
                    fontSize: '16px'
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <AppSearchDropdown
                selectedValue={getSelectedReferrerName()}
                searchTerm={referrerSearchTerm}
                onSearchTermChange={setReferrerSearchTerm}
                onSearch={handleReferrerSearch}
                onSelectItem={handleReferrerSelect}
                onClear={handleReferrerClear}
                results={referrerSearchResults}
                label="지인추천인"
                placeholder="추천인 이름, 연락처, 이메일, 로그인ID로 검색하세요"
              />
            )}
          </FormField>
        )}

        <FormField $fullWidth>
          <CheckboxLabel>
            <Checkbox
              checked={formData.joinInfo.enableLogin}
              onChange={(e) => handleInputChange('enableLogin', e.target.checked)}
            />
            로그인 기능 사용 (선택사항)
          </CheckboxLabel>
        </FormField>

        {formData.joinInfo.enableLogin && (
          <>
            <FormField>
              <AppIdTextField
                value={formData.joinInfo.loginId}
                onChange={(e) => handleInputChange('loginId', e.target.value)}
                label="로그인 아이디"
              />
            </FormField>

            <FormField>
              <AppPwdTextField
                value={formData.joinInfo.loginPassword || ''} // null인 경우 빈 문자열로 변환
                onChange={(e) => handleInputChange('loginPassword', e.target.value)}
                fieldType={PwdFieldType.PASSWORD}
                label="로그인 비밀번호"
              />
            </FormField>
          </>
        )}
      </FormGrid>
    </StepContent>
  );
};

export default JoinInfoStep;
