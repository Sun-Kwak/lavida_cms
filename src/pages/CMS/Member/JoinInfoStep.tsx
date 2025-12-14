import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { StepContent, StepTitle, FormGrid, FormField, Label, CheckboxLabel, Checkbox } from './StyledComponents';
import { JoinInfo, StepProps } from './types';
import CustomDropdown from '../../../components/CustomDropdown';
import { AppTableSearchModal, TableSearchItem } from '../../../customComponents/AppTableSearchModal';
import { AppIdTextField } from '../../../customComponents/AppIdTextField';
import { AppPwdTextField, PwdFieldType } from '../../../customComponents/AppPwdTextField';
import { dbManager, type Branch, type Staff, type Member } from '../../../utils/indexedDB';

const JoinInfoStep: React.FC<StepProps> = ({ formData, onUpdate }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [staffItems, setStaffItems] = useState<TableSearchItem[]>([]);
  const [memberItems, setMemberItems] = useState<TableSearchItem[]>([]);
  const [newMemberPoints, setNewMemberPoints] = useState(0); // 신규 회원이 받을 포인트
  const [referrerPoints, setReferrerPoints] = useState(0); // 추천인이 받을 포인트
  const joinPaths = ['지인추천', '당근마켓', '네이버 플레이스', '전화', '워크인', '현수막', '인스타', '광고지', '기타'];

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadBranches();
    loadStaff();
    loadMembers();
  }, []);

  // 지점 선택 시 신규 회원 포인트 로드
  useEffect(() => {
    const loadNewMemberPoints = async () => {
      if (formData.joinInfo.branchId) {
        try {
          const points = await dbManager.referralPoint.getReferralPoints(formData.joinInfo.branchId);
          setNewMemberPoints(points.referredPoints);
        } catch (error) {
          console.error('신규 회원 포인트 로드 실패:', error);
          setNewMemberPoints(0);
        }
      } else {
        setNewMemberPoints(0);
      }
    };
    loadNewMemberPoints();
  }, [formData.joinInfo.branchId]);

  // 추천인 선택 시 추천인 포인트 로드
  useEffect(() => {
    const loadReferrerPoints = async () => {
      if (formData.joinInfo.referrerId && formData.joinInfo.joinPath === '지인추천') {
        try {
          // 추천인 정보 조회
          const referrer = members.find(m => m.id === formData.joinInfo.referrerId);
          if (referrer && referrer.branchId) {
            const points = await dbManager.referralPoint.getReferralPoints(referrer.branchId);
            setReferrerPoints(points.referrerPoints);
          } else {
            setReferrerPoints(0);
          }
        } catch (error) {
          console.error('추천인 포인트 로드 실패:', error);
          setReferrerPoints(0);
        }
      } else {
        setReferrerPoints(0);
      }
    };
    loadReferrerPoints();
  }, [formData.joinInfo.referrerId, formData.joinInfo.joinPath, members]);

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
      
      // TableSearchItem 형태로 변환
      const staffTableItems: TableSearchItem[] = activeStaff.map(employee => ({
        id: employee.id,
        title: employee.name,
        subtitle: `${employee.position} | ${employee.role}`,
        description: `연락처: ${employee.phone} | 권한: ${employee.permission}`,
        data: employee
      }));
      setStaffItems(staffTableItems);
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
      
      // TableSearchItem 형태로 변환
      const memberTableItems: TableSearchItem[] = activeMembers.map(member => ({
        id: member.id,
        title: member.name,
        subtitle: `${member.phone} | ${member.branchName || '지점정보없음'}`,
        description: `이메일: ${member.email || '없음'} | 등록일: ${new Date(member.registrationDate).toLocaleDateString()}`,
        data: member
      }));
      setMemberItems(memberTableItems);
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
  const handleStaffSearch = (searchTerm: string): TableSearchItem[] => {
    if (!searchTerm.trim() || !formData.joinInfo.branchId) {
      return [];
    }

    console.log('직원 검색 실행:', searchTerm);
    console.log('선택된 지점 ID:', formData.joinInfo.branchId);

    // 선택된 지점에 속한 직원만 먼저 필터링
    const branchStaff = staff.filter(employee => 
      employee.branchId === formData.joinInfo.branchId
    );

    // 그 다음 검색어로 필터링
    const filteredStaff = branchStaff.filter(employee => 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.loginId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filteredStaff.map(employee => ({
      id: employee.id,
      title: employee.name,
      subtitle: `${employee.position} | ${employee.role}`,
      description: `연락처: ${employee.phone} | 권한: ${employee.permission}`,
      data: employee
    }));
  };

  // 직원 선택 함수
  const handleStaffSelect = (item: TableSearchItem) => {
    const selectedEmployee = item.data as Staff;
    handleInputChange('coach', selectedEmployee.id);
  };

  // 직원 선택 해제 함수
  const handleStaffClear = () => {
    handleInputChange('coach', '');
  };

  // 지인추천인 검색 함수
  const handleReferrerSearch = (searchTerm: string): TableSearchItem[] => {
    if (!searchTerm.trim()) {
      return [];
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

    return filteredMembers.map(member => ({
      id: member.id,
      title: member.name,
      subtitle: `${member.phone} | ${member.branchName || '지점정보없음'}`,
      description: `이메일: ${member.email || '없음'} | 등록일: ${new Date(member.registrationDate).toLocaleDateString()}`,
      data: member
    }));
  };

  // 지인추천인 선택 함수
  const handleReferrerSelect = (item: TableSearchItem) => {
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
  };

  // 지인추천인 선택 해제 함수
  const handleReferrerClear = () => {
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
            onChange={(value: string) => {
              // 지점이 변경되면 선택된 직원 정보 초기화
              const updatedJoinInfo = {
                ...formData.joinInfo,
                branchId: value,
                coach: '' // 직원 선택 초기화
              };
              
              onUpdate({
                joinInfo: updatedJoinInfo
              });
            }}
            options={getBranchOptions()}
            placeholder="지점을 선택하세요"
            required
          />
        </FormField>

        <FormField>
          <Label>담당 직원 *</Label>
          <AppTableSearchModal
            selectedValue={getSelectedStaffName()}
            onSelectItem={handleStaffSelect}
            onClear={handleStaffClear}
            items={formData.joinInfo.branchId ? staffItems.filter(item => 
              (item.data as Staff).branchId === formData.joinInfo.branchId
            ) : []}
            onSearch={handleStaffSearch}
            placeholder={
              formData.joinInfo.branchId 
                ? "직원 이름, 전화번호, 로그인ID, 직급, 직책으로 검색하세요" 
                : "먼저 지점을 선택해주세요"
            }
            header="직원 선택"
            tableHeader="담당 직원 목록"
            disabled={!formData.joinInfo.branchId}
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

        {/* 포인트 정보 표시 */}
        {formData.joinInfo.branchId && formData.joinInfo.joinPath === '지인추천' && (
          <FormField $fullWidth>
            <div style={{
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ marginBottom: '12px', fontWeight: 600, color: '#495057' }}>
                📊 예상 적립 포인트
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                    신규 회원 적립 예정
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#28a745' }}>
                    {newMemberPoints.toLocaleString()}P
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                    (선택한 지점 기준)
                  </div>
                </div>
                {formData.joinInfo.referrerId && (
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                      추천인 적립 예정
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#007bff' }}>
                      {referrerPoints.toLocaleString()}P
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                      (추천인 지점 기준)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </FormField>
        )}

        {/* 지인추천일 때만 지인추천인 검색 필드 표시 */}
        {formData.joinInfo.joinPath === '지인추천' && (
          <FormField>
            <Label>지인추천인 *</Label>
            <AppTableSearchModal
              selectedValue={getSelectedReferrerName()}
              onSelectItem={handleReferrerSelect}
              onClear={handleReferrerClear}
              items={memberItems}
              onSearch={handleReferrerSearch}
              placeholder="추천인 이름, 연락처, 이메일, 로그인ID로 검색하세요"
              header="지인추천인 선택"
              tableHeader="지인추천인 목록"
            />
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
              <Label>로그인 아이디 *</Label>
              <AppIdTextField
                value={formData.joinInfo.loginId}
                onChange={(e) => handleInputChange('loginId', e.target.value)}
              />
            </FormField>

            <FormField>
              <Label>로그인 비밀번호 *</Label>
              <AppPwdTextField
                value={formData.joinInfo.loginPassword || ''} // null인 경우 빈 문자열로 변환
                onChange={(e) => handleInputChange('loginPassword', e.target.value)}
                fieldType={PwdFieldType.PASSWORD}
              />
            </FormField>
          </>
        )}
      </FormGrid>
    </StepContent>
  );
};

export default JoinInfoStep;
