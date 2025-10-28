import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import CMSLayout from '../../../components/CMSLayout';
import GenericListUI, { FetchParams, FetchResult } from '../../../components/CustomList/GenericListUI';
import { ColumnDefinition } from '../../../components/CustomList/GenericDataTable';
import AdminFormPopup, { AdminFormData } from './AdminFormPopup';
import PasswordPopup from './PasswordPopup';
import { dbManager, Staff } from '../../../utils/indexedDB';
import { isSystemInInitialState } from '../../../utils/systemInit';
import { SYSTEM_ADMIN_CONFIG } from '../../../constants/staffConstants';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import dayjs from 'dayjs';

const SystemAdminNotice = styled.div`
  background-color: ${AppColors.warning}10;
  border: 1px solid ${AppColors.warning};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const NoticeIcon = styled.span`
  font-size: 20px;
`;

const NoticeContent = styled.div`
  flex: 1;
`;

const NoticeTitle = styled.div`
  font-weight: 600;
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.warning};
  margin-bottom: 4px;
`;

const NoticeMessage = styled.div`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onSurface};
  line-height: 1.4;
`;

// 관리자 데이터 타입 정의
interface AdminData {
  id?: number; // id를 optional로 변경
  no?: number; // no도 optional로 변경
  adminId: string; // API 응답의 adminId 필드
  name: string;
  email: string;
  cellphone?: string; // API 응답의 cellphone 필드
  memo?: string;
  createAt?: string; // API 응답의 createAt 필드
  lastLoginTime?: string; // API 응답의 lastLoginTime 필드
  // 기존 필드들은 하위 호환성을 위해 유지
  joinDate?: string;
  lastAccess?: string;
  username?: string;
  phone?: string;
}

// 더미 데이터
const dummyAdminData: AdminData[] = [
  {
    id: 1,
    no: 1,
    adminId: 'lavida01',
    name: '관리자',
    email: 'admin@lavida.com',
    cellphone: '010-1234-5678',
    memo: '최고 관리자',
    createAt: '2024-01-01T09:00:00Z',
    lastLoginTime: '2024-03-15T14:30:00Z',
    username: 'lavida01',
    phone: '010-1234-5678',
    joinDate: '2024-01-01T09:00:00Z',
    lastAccess: '2024-03-15T14:30:00Z',
  },
  {
    id: 2,
    no: 2,
    adminId: 'admin02',
    name: '김관리',
    email: 'kim@lavida.com',
    cellphone: '010-2345-6789',
    memo: '일반 관리자',
    createAt: '2024-02-01T10:00:00Z',
    lastLoginTime: '2024-03-14T16:20:00Z',
    username: 'admin02',
    phone: '010-2345-6789',
    joinDate: '2024-02-01T10:00:00Z',
    lastAccess: '2024-03-14T16:20:00Z',
  },
  {
    id: 3,
    no: 3,
    adminId: 'admin03',
    name: '이운영',
    email: 'lee@lavida.com',
    cellphone: '010-3456-7890',
    memo: '운영 관리자',
    createAt: '2024-02-15T11:00:00Z',
    lastLoginTime: '2024-03-13T09:15:00Z',
    username: 'admin03',
    phone: '010-3456-7890',
    joinDate: '2024-02-15T11:00:00Z',
    lastAccess: '2024-03-13T09:15:00Z',
  },
];

// 더미 API 함수들
const getAdminList = async (params?: any): Promise<any> => {
  // 실제 API 호출 시뮬레이션을 위한 delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    data: {
      statusCode: 200,
      message: "success",
      data: dummyAdminData,
      metadata: {
        totalCnt: dummyAdminData.length,
        allCnt: dummyAdminData.length,
      }
    }
  };
};

const createAdmin = async (data: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 새로운 관리자 데이터를 더미 데이터에 추가
  const newAdmin: AdminData = {
    id: dummyAdminData.length + 1,
    no: dummyAdminData.length + 1,
    adminId: data.adminId,
    name: data.name,
    email: data.email,
    cellphone: data.cellphone,
    memo: data.memo,
    createAt: new Date().toISOString(),
    lastLoginTime: undefined,
    username: data.adminId,
    phone: data.cellphone,
    joinDate: new Date().toISOString(),
    lastAccess: undefined,
  };
  
  dummyAdminData.push(newAdmin);
  
  return {
    data: {
      statusCode: 200,
      message: "success",
      data: newAdmin
    }
  };
};

const updateAdmin = async (adminId: string, data: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const adminIndex = dummyAdminData.findIndex(admin => admin.adminId === adminId);
  if (adminIndex !== -1) {
    dummyAdminData[adminIndex] = {
      ...dummyAdminData[adminIndex],
      ...data,
      // 업데이트 시간 갱신
      updateAt: new Date().toISOString(),
    };
  }
  
  return {
    data: {
      statusCode: 200,
      message: "success",
      data: dummyAdminData[adminIndex]
    }
  };
};

const deleteAdmin = async (adminId: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const adminIndex = dummyAdminData.findIndex(admin => admin.adminId === adminId);
  if (adminIndex !== -1) {
    dummyAdminData.splice(adminIndex, 1);
  }
  
  return {
    data: {
      statusCode: 200,
      message: "success"
    }
  };
};

const AdminManagementPage: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const listRef = useRef<{ refetch: () => void }>(null);
  
  // 팝업 상태
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminData | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [isPasswordPopupOpen, setIsPasswordPopupOpen] = useState(false);
  
  // 폼 데이터
  const [formData, setFormData] = useState<AdminFormData>({
    username: '',
    email: '',
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    memo: '',
  });
  
  // 폼 에러
  const [formErrors, setFormErrors] = useState<Partial<AdminFormData>>({});

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      name: '',
      phone: '',
      password: '',
      confirmPassword: '',
      memo: '',
    });
    setFormErrors({});
    setShowPasswordChange(false);
  };

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const errors: Partial<AdminFormData> = {};

    // 아이디 검증 (AppIdTextField가 내부적으로 검증)
    if (!formData.username.trim()) {
      errors.username = '아이디를 입력해주세요.';
    } else {
      // 영문자와 숫자를 포함한 6~20자 검증
      const idPattern = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{6,20}$/;
      if (!idPattern.test(formData.username)) {
        errors.username = '아이디는 영문자와 숫자를 포함한 6~20자여야 합니다.';
      }
    }

    // 이메일 검증 (AppEmailTextField가 내부적으로 검증)
    if (!formData.email.trim()) {
      errors.email = '이메일을 입력해주세요.';
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email)) {
        errors.email = '올바른 이메일 형식을 입력해주세요.';
      }
    }

    // 이름 검증
    if (!formData.name.trim()) {
      errors.name = '이름을 입력해주세요.';
    }

    // 전화번호 검증 (AppGPhoneTextField가 내부적으로 검증)
    if (!formData.phone.trim()) {
      errors.phone = '전화번호를 입력해주세요.';
    } else if (formData.phone.length < 8 || formData.phone.length > 15) {
      errors.phone = '연락처는 8자리에서 15자리까지 입력해주세요.';
    }

    // 신규 등록 시 또는 비밀번호 변경 모드일 때만 비밀번호 검증
    if (!isEditMode || showPasswordChange) {
      // 비밀번호 검증 (AppPwdTextField가 내부적으로 검증)
      if (!formData.password.trim()) {
        errors.password = '비밀번호를 입력해주세요.';
      } else {
        const pwdPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!pwdPattern.test(formData.password)) {
          errors.password = '비밀번호는 영문자, 숫자, 특수문자를 포함하여 8자리 이상이어야 합니다.';
        }
      }

      // 비밀번호 확인 검증
      if (!formData.confirmPassword.trim()) {
        errors.confirmPassword = '비밀번호 확인을 입력해주세요.';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 폼 데이터 변경 핸들러
  const handleInputChange = (field: keyof AdminFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 해당 필드의 에러 제거
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 팝업 열기 (신규 등록)
  const openAddPopup = () => {
    setIsEditMode(false);
    setSelectedAdmin(null);
    resetForm();
    setIsPopupOpen(true);
  };

  // 팝업 열기 (수정)
  const openEditPopup = (admin: AdminData) => {
    setIsEditMode(true);
    setSelectedAdmin(admin);
    setFormData({
      username: admin.adminId || admin.username || '', // adminId를 username 폼 필드에 매핑
      email: admin.email,
      name: admin.name,
      phone: admin.cellphone || admin.phone || '', // cellphone을 phone 폼 필드에 매핑
      password: '',
      confirmPassword: '',
      memo: admin.memo || '',
    });
    setFormErrors({});
    setShowPasswordChange(false);
    setIsPopupOpen(true);
  };

  // 팝업 닫기
  const closePopup = () => {
    setIsPopupOpen(false);
    resetForm();
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!selectedAdmin?.adminId) {
      toast.error('관리자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await deleteAdmin(selectedAdmin.adminId);
      
      // API 응답 구조 확인: statusCode가 200이고 message가 "success"일 때만 성공
      if (response?.data?.statusCode === 200 && response?.data?.message === "success") {
        toast.success('관리자가 삭제되었습니다.');
        closePopup();
        setRefreshTrigger(prev => prev + 1);
      } else {
        // statusCode가 200이 아니거나 message가 "success"가 아닌 경우
        const errorMessage = response?.data?.error?.customMessage || 
                            response?.data?.message || 
                            '삭제 처리 중 오류가 발생했습니다.';
        toast.error(`관리자 삭제에 실패했습니다. (${errorMessage})`);
      }
    } catch (error: any) {
      console.error('관리자 삭제 에러:', error);
      
      // callApi에서 던진 에러 처리
      const errorMessage = error?.data?.error?.customMessage || 
                          error?.data?.message ||
                          error?.response?.data?.error?.customMessage || 
                          error?.response?.data?.message || 
                          error?.message || 
                          '네트워크 오류가 발생했습니다.';
      
      toast.error(`관리자 삭제에 실패했습니다. (${errorMessage})`);
    }
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode) {
        // 수정 모드
        if (!selectedAdmin?.adminId) {
          toast.error('관리자 정보를 찾을 수 없습니다.');
          return;
        }

        const updateData: any = {
          email: formData.email,
          name: formData.name,
          cellphone: formData.phone,
          memo: formData.memo, // 비고 추가
        };

        // 비밀번호 변경이 있는 경우에만 포함
        if (showPasswordChange && formData.password) {
          updateData.password = formData.password;
        }

        console.log('수정할 관리자 ID:', selectedAdmin.adminId);
        console.log('수정 데이터:', updateData);

        const response = await updateAdmin(selectedAdmin.adminId, updateData);
        
        // API 응답 구조 확인: statusCode가 200이고 message가 "success"일 때만 성공
        if (response?.data?.statusCode === 200 && response?.data?.message === "success") {
          toast.success('관리자 정보가 수정되었습니다.');
          closePopup();
          setRefreshTrigger(prev => prev + 1);
        } else {
          // statusCode가 200이 아니거나 message가 "success"가 아닌 경우
          const errorMessage = response?.data?.error?.customMessage || 
                              response?.data?.message || 
                              '수정 처리 중 오류가 발생했습니다.';
          toast.error(`관리자 정보 수정에 실패했습니다. (${errorMessage})`);
        }
      } else {
        // 생성 모드
        const createData = {
          adminId: formData.username,
          password: formData.password,
          name: formData.name,
          email: formData.email,
          cellphone: formData.phone,
          memo: formData.memo, // 비고 추가
        };

        const response = await createAdmin(createData);
        
        // API 응답 구조 확인: statusCode가 200이고 message가 "success"일 때만 성공
        if (response?.data?.statusCode === 200 && response?.data?.message === "success") {
          toast.success('새 관리자가 등록되었습니다.');
          closePopup();
          setRefreshTrigger(prev => prev + 1);
        } else {
          // statusCode가 200이 아니거나 message가 "success"가 아닌 경우
          const errorMessage = response?.data?.error?.customMessage || 
                              response?.data?.message || 
                              '등록 처리 중 오류가 발생했습니다.';
          toast.error(`관리자 등록에 실패했습니다. (${errorMessage})`);
        }
      }
      
    } catch (error: any) {
      console.error('관리자 저장 에러:', error);
      
      // callApi에서 던진 에러 처리
      const errorMessage = error?.data?.error?.customMessage || 
                          error?.data?.message ||
                          error?.response?.data?.error?.customMessage || 
                          error?.response?.data?.message || 
                          error?.message || 
                          '네트워크 오류가 발생했습니다.';
      
      if (isEditMode) {
        toast.error(`관리자 정보 수정에 실패했습니다. (${errorMessage})`);
      } else {
        toast.error(`관리자 등록에 실패했습니다. (${errorMessage})`);
      }
      // 실패 시에는 팝업을 닫지 않음
    }
  };

  // 비밀번호 변경 버튼 클릭
  const handlePasswordChangeClick = () => {
    setIsPasswordPopupOpen(true);
  };

  // 비밀번호 팝업 닫기
  const closePasswordPopup = () => {
    setIsPasswordPopupOpen(false);
  };

  // 컬럼 정의
  const columns: ColumnDefinition<AdminData>[] = [
    {
      header: 'No',
      accessor: 'no',
      formatter: (value) => value?.toString() || '',
    },
    {
      header: '가입일',
      accessor: 'createAt' as keyof AdminData,
      formatter: (value) => {
        if (!value) return '';
        return dayjs(value).format('YYYY.MM.DD');
      },
    },
    {
      header: '최근접속',
      accessor: 'lastLoginTime' as keyof AdminData,
      formatter: (value) => {
        if (!value) return '';
        return dayjs(value).format('MM.DD HH:mm');
      },
    },
    {
      header: '이름',
      accessor: 'name',
      formatter: (value) => value || '',
    },
    {
      header: '아이디',
      accessor: 'adminId' as keyof AdminData,
      formatter: (value) => value || '',
    },
    {
      header: '이메일',
      accessor: 'email',
      formatter: (value) => value || '',
    },
    {
      header: '전화번호',
      accessor: 'cellphone' as keyof AdminData,
      formatter: (value) => value || '',
    },
    {
      header: '비고',
      accessor: 'memo',
      formatter: (value) => value || '',
    },
  ];

  // 실제 API 함수
  const fetchAdminData = async (params: FetchParams): Promise<FetchResult<AdminData>> => {
    try {
      console.log('fetchAdminData API 호출:', params);
      
      // 더미 API 호출
      const response = await getAdminList(params);
      
      // 실제 API 응답 구조에 맞게 처리
      // response.data = { statusCode, message, data: [...], metadata: {...} }
      let responseData = response.data?.data || response.data;
      
      // 배열이 아닌 경우 배열로 변환
      if (!Array.isArray(responseData)) {
        if (responseData?.items && Array.isArray(responseData.items)) {
          responseData = responseData.items;
        } else if (responseData && typeof responseData === 'object') {
          responseData = [responseData];
        } else {
          responseData = [];
        }
      }
      
      // 각 아이템에 id가 없는 경우 생성하고 no 필드도 추가
      responseData = responseData.map((item: any, index: number) => ({
        ...item,
        id: item.id || index + 1, // id가 없으면 index 기반으로 생성
        no: item.no || index + 1,  // no가 없으면 index 기반으로 생성
        // 하위 호환성을 위한 필드 매핑
        username: item.adminId || item.username,
        phone: item.cellphone || item.phone,
        joinDate: item.createAt || item.joinDate,
        lastAccess: item.lastLoginTime || item.lastAccess,
      }));
      
      // API 응답을 FetchResult 형태로 변환
      const result: FetchResult<AdminData> = {
        data: responseData,
        totalItems: response.data?.metadata?.totalCnt || responseData.length,
        allItems: response.data?.metadata?.allCnt || responseData.length,
      };
      
      return result;
      
    } catch (error) {
      
      // 에러 시 빈 결과 반환
      return {
        data: [],
        totalItems: 0,
        allItems: 0,
      };
    }
  };

  // 관리자 추가 핸들러
  const handleAddAdmin = () => {
    openAddPopup();
  };

  // 행 클릭 핸들러
  const handleRowClick = (item: AdminData, index: number) => {
    openEditPopup(item);
  };

  return (
    <CMSLayout currentPath="/cms/admin">
      <GenericListUI<AdminData>
        ref={listRef}
        title="관리자 회원관리"
        columns={columns}
        fetchData={fetchAdminData}
        excelFileName="AdminList"
        keyExtractor={(item, index) => {
          // id는 이제 항상 존재하지만 안전하게 처리
          return item.id ? item.id.toString() : `admin-${index}`;
        }}
        enableSearch={true}
        searchPlaceholder="이름, 아이디, 이메일, 전화번호 검색"
        enableDateFilter={false}
        dateRangeOptions={['금월', '지난달', '1년', '지정']}
        itemsPerPageOptions={[10, 20, 50, 100]}
        themeMode="light"
        onRowClick={handleRowClick}
        refreshTrigger={refreshTrigger}
        addButton={{
          label: '관리자 추가',
          onClick: handleAddAdmin,
        }}
      />

      <AdminFormPopup
        isOpen={isPopupOpen}
        isEditMode={isEditMode}
        formData={formData}
        formErrors={formErrors}
        showPasswordChange={showPasswordChange}
        onClose={closePopup}
        onSave={handleSave}
        onDelete={handleDelete}
        onInputChange={handleInputChange}
        onPasswordChangeClick={handlePasswordChangeClick}
      />

      <PasswordPopup
        adminId={selectedAdmin?.adminId || ''}
        isOpen={isPasswordPopupOpen}
        onClose={closePasswordPopup}
        onPasswordChanged={() => setRefreshTrigger(prev => prev + 1)}
      />
    </CMSLayout>
  );
};

export default AdminManagementPage;
