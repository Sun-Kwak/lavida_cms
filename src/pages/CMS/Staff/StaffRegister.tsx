import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import CustomDropdown from '../../../components/CustomDropdown';
import CustomDateInput from '../../../components/CustomDateInput';
import { StaffFileUploadField } from '../../../components/StaffFormComponents';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import { dbManager, type Branch } from '../../../utils/indexedDB';
import { POSITIONS, ROLES, EMPLOYMENT_TYPES, PERMISSIONS, SYSTEM_ADMIN_CONFIG, WORK_SHIFTS } from '../../../constants/staffConstants';
import type { DailyScheduleSettings } from '../../../utils/db/types';
import { formatDateToLocal } from '../../../components/Calendar/utils';

// 주간 휴일 설정 타입 정의 (분 단위로 저장)
type DaySchedule = {
  isHoliday: boolean;
  workingHours: {
    start: number; // 분 단위 (예: 540 = 9:00)
    end: number;   // 분 단위
  };
  lunchTime: {
    start: number; // 분 단위
    end: number;
    name: string;  // "기본 휴게시간"
  };
  breakTimes: Array<{
    start: number; // 분 단위
    end: number;
    name: string;
  }>;
};

type WeekSchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

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
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const PasswordToggleIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: ${AppColors.onInput1};
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${AppColors.primary};
  }
`;

const PageContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: ${AppTextStyles.title1.fontSize};
  font-weight: 700;
  color: ${AppColors.onBackground};
  margin: 0 0 8px 0;
`;

const PageDescription = styled.p`
  font-size: ${AppTextStyles.body1.fontSize};
  color: ${AppColors.onInput1};
  margin: 0;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: ${AppColors.surface};
  border-radius: 12px;
  border: 1px solid ${AppColors.borderLight};
`;

const SectionTitle = styled.h2`
  font-size: ${AppTextStyles.title3.fontSize};
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0;
`;

const FieldRow = styled.div`
  display: flex;
  gap: 16px;
`;

const FieldColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: ${AppTextStyles.label1.fontSize};
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ variant = 'primary' }) => variant === 'primary' ? `
    background-color: ${AppColors.primary};
    color: ${AppColors.onPrimary};
    
    &:hover {
      background-color: ${AppColors.buttonPrimaryHover};
    }
  ` : `
    background-color: ${AppColors.surface};
    color: ${AppColors.onSurface};
    border: 1px solid ${AppColors.borderLight};
    
    &:hover {
      background-color: ${AppColors.btnC};
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 타입 정의
interface StaffFormData {
  name: string;
  loginId: string;
  password: string;
  phone: string;
  email: string;
  branchId: string;
  position: string;
  role: string;
  employmentType: string;
  permission: string;
  program: string; // 담당프로그램 필드 추가
  workShift: string; // 근무 시간대 필드 추가 (횟수제 프로그램 전용)
  contractStartDate: string;
  contractEndDate: string;
  contractFile: File | null;
}

interface FormErrors {
  [key: string]: string;
}

const StaffRegister: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    loginId: '',
    password: '',
    phone: '',
    email: '',
    branchId: '',
    position: '',
    role: '',
    employmentType: '',
    permission: '',
    program: '',
    workShift: '',
    contractStartDate: '',
    contractEndDate: '',
    contractFile: null
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [programs, setPrograms] = useState<any[]>([]); // 프로그램 목록 상태 추가
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null); // 현재 로그인한 사용자 정보
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  // 시간을 분으로 변환하는 헬퍼 함수
  const hourMinuteToMinutes = (hour: number, minute: number = 0): number => {
    return hour * 60 + minute;
  };

  // 분을 시와 분으로 분리하는 함수
  const minutesToHourMinute = (minutes: number): { hour: number; minute: number } => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return { hour, minute };
  };

  // 이번주 토요일부터 금요일까지의 날짜 범위 계산 (지난 토요일 ~ 돌아오는 금요일)
  const getThisWeekDateRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // 이번주 토요일 계산
    let daysFromSaturday;
    if (dayOfWeek === 6) {
      daysFromSaturday = 0;
    } else {
      daysFromSaturday = dayOfWeek === 0 ? 1 : dayOfWeek + 1;
    }
    
    const saturday = new Date(today);
    saturday.setDate(today.getDate() - daysFromSaturday);
    
    const friday = new Date(saturday);
    friday.setDate(saturday.getDate() + 6);
    
    const format = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
    return `${format(saturday)} ~ ${format(friday)}`;
  };

  // 특정 요일이 오늘 또는 과거인지 확인 (지난 토요일 기준)
  const isDayInPastOrToday = (day: keyof WeekSchedule): boolean => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    let daysFromSaturday;
    if (dayOfWeek === 6) {
      daysFromSaturday = 0;
    } else {
      daysFromSaturday = dayOfWeek === 0 ? 1 : dayOfWeek + 1;
    }
    
    const saturday = new Date(today);
    saturday.setDate(today.getDate() - daysFromSaturday);
    
    // 요일별 인덱스 (토요일부터 시작)
    const dayOrder = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const dayIndex = dayOrder.indexOf(day);
    
    // 해당 요일의 날짜 계산
    const targetDate = new Date(saturday);
    targetDate.setDate(saturday.getDate() + dayIndex);
    
    // 오늘 또는 과거인지 확인
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate <= today;
  };

  // 특정 요일의 날짜 가져오기 (지난 토요일 기준)
  const getDayDate = (day: keyof WeekSchedule): Date => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    let daysFromSaturday;
    if (dayOfWeek === 6) {
      daysFromSaturday = 0;
    } else {
      daysFromSaturday = dayOfWeek === 0 ? 1 : dayOfWeek + 1;
    }
    
    const saturday = new Date(today);
    saturday.setDate(today.getDate() - daysFromSaturday);
    
    const dayOrder = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const dayIndex = dayOrder.indexOf(day);
    const targetDate = new Date(saturday);
    targetDate.setDate(saturday.getDate() + dayIndex);
    
    return targetDate;
  };

  // 주간 휴일 설정 상태 초기화 함수 (오늘까지는 휴일로 설정)
  const getInitialWeeklyHolidayData = (): WeekSchedule => {
    const days: (keyof WeekSchedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const initialData: any = {};
    
    days.forEach(day => {
      const isPastOrToday = isDayInPastOrToday(day);
      initialData[day] = isPastOrToday ? {
        isHoliday: true,
        workingHours: { start: 0, end: 0 },
        lunchTime: { start: 0, end: 0, name: '기본 휴게시간' },
        breakTimes: []
      } : {
        isHoliday: false,
        workingHours: { start: hourMinuteToMinutes(9), end: hourMinuteToMinutes(21) },
        lunchTime: { start: hourMinuteToMinutes(12), end: hourMinuteToMinutes(13), name: '기본 휴게시간' },
        breakTimes: []
      };
    });
    
    return initialData as WeekSchedule;
  };

  // 주간 휴일 설정 상태 (분 단위로 저장)
  const [weeklyHolidayData, setWeeklyHolidayData] = useState<WeekSchedule>(getInitialWeeklyHolidayData());

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchList = await dbManager.getAllBranches();
        setBranches(branchList);
      } catch (error) {
        console.error('지점 목록 로드 실패:', error);
      }
    };

    const fetchPrograms = async () => {
      try {
        const programList = await dbManager.getAllPrograms();
        // 활성화된 프로그램만 필터링
        const activePrograms = programList.filter(program => program.isActive);
        setPrograms(activePrograms);
      } catch (error) {
        console.error('프로그램 목록 로드 실패:', error);
      }
    };

    const getCurrentUser = async () => {
      const adminId = sessionStorage.getItem('adminId');
      setCurrentUserId(adminId);
      
      if (adminId) {
        try {
          // 현재 로그인한 사용자 정보 가져오기
          const allStaff = await dbManager.getAllStaff();
          const currentUser = allStaff.find(staff => staff.loginId === adminId);
          setCurrentUserInfo(currentUser || null);
          
          // EDITOR 권한이면 지점을 자동으로 설정
          if (currentUser && currentUser.permission === 'EDITOR') {
            setFormData(prev => ({
              ...prev,
              branchId: currentUser.branchId
            }));
          }
        } catch (error) {
          console.error('현재 사용자 정보 로드 실패:', error);
        }
      }
    };

    fetchBranches();
    fetchPrograms();
    getCurrentUser();
  }, []);

  // 현재 사용자 권한 확인
  const checkUserPermission = useCallback(() => {
    if (currentUserInfo && currentUserInfo.permission === 'VIEWER') {
      alert('접근 권한이 없습니다. VIEWER 권한은 조회만 가능합니다.');
      // StaffSearch 페이지로 리다이렉트
      navigate('/cms/staff/search');
      return false;
    }
    return true;
  }, [currentUserInfo, navigate]);

  // 컴포넌트 마운트 시 권한 체크
  useEffect(() => {
    if (currentUserInfo) {
      checkUserPermission();
    }
  }, [currentUserInfo, checkUserPermission]);

  const handleInputChange = (field: keyof StaffFormData, value: string | File | null) => {
    // 전화번호 필드인 경우 자동 포맷팅 적용
    if (field === 'phone' && typeof value === 'string') {
      value = formatPhoneNumber(value);
    }
    
    // 이메일 필드인 경우 한글 입력 방지
    if (field === 'email' && typeof value === 'string') {
      const koreanPattern = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
      if (koreanPattern.test(value)) {
        toast.error('이메일에는 한글을 입력할 수 없습니다.');
        return;
      }
    }

    // 파일 업로드 필드인 경우 검증 수행
    if (field === 'contractFile' && value instanceof File) {
      // 파일 타입 검증 (이미지 또는 PDF만 허용)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(value.type)) {
        setErrors(prev => ({ ...prev, contractFile: '이미지(JPG, PNG) 또는 PDF 파일만 업로드 가능합니다.' }));
        return;
      }
      
      // 파일 크기 검증 (10MB 제한)
      if (value.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, contractFile: '파일 크기는 10MB 이하여야 합니다.' }));
        return;
      }
    }

    // 담당프로그램이 변경된 경우 근무시간대 처리
    if (field === 'program' && typeof value === 'string') {
      // 선택된 프로그램의 타입을 찾아서 횟수제인지 확인
      const selectedProgram = programs.find(program => program.name === value);
      // 횟수제 프로그램이 아닌 경우 근무시간대 초기화
      if (!selectedProgram || selectedProgram.type !== '횟수제') {
        setFormData(prev => ({
          ...prev,
          program: value as string,
          workShift: ''
        }));
      } else {
        // 횟수제인 경우 기본값을 '주간'으로 설정
        setFormData(prev => ({
          ...prev,
          program: value as string,
          workShift: prev.workShift || '주간' // 이미 선택된 값이 없으면 '주간'으로 설정
        }));
      }
    }
    // 근무시간대가 변경된 경우 주간 휴일 설정 업데이트
    else if (field === 'workShift' && typeof value === 'string') {
      setFormData(prev => ({
        ...prev,
        workShift: value as string
      }));
      
      // 근무시간대에 따른 기본 설정 적용 (분 단위)
      const isNightShift = value === '야간';
      const defaultStart = hourMinuteToMinutes(isNightShift ? 15 : 9);   // 야간: 15:00, 주간: 9:00
      const defaultEnd = hourMinuteToMinutes(isNightShift ? 24 : 21);     // 야간: 24:00, 주간: 21:00
      const defaultLunchStart = hourMinuteToMinutes(isNightShift ? 18 : 12);  // 야간: 18:00, 주간: 12:00
      const defaultLunchEnd = hourMinuteToMinutes(isNightShift ? 19 : 13);    // 야간: 19:00, 주간: 13:00
      
      // 모든 근무일에 대해 기본 근무시간과 기본 휴게시간 설정 (과거/오늘은 제외)
      setWeeklyHolidayData(prev => {
        const updated: WeekSchedule = { ...prev };
        (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).forEach(day => {
          const isPastOrToday = isDayInPastOrToday(day);
          if (!isPastOrToday && !updated[day].isHoliday) {
            updated[day] = {
              ...updated[day],
              workingHours: { start: defaultStart, end: defaultEnd },
              lunchTime: { start: defaultLunchStart, end: defaultLunchEnd, name: '기본 휴게시간' },
              breakTimes: [] // breakTimes는 초기화
            };
          }
        });
        return updated;
      });
    }
    // 고용형태가 정규직으로 변경되면 계약종료일 초기화
    else if (field === 'employmentType' && typeof value === 'string' && value === '정규직') {
      setFormData(prev => ({
        ...prev,
        employmentType: value as string,
        contractEndDate: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }) as StaffFormData);
    }

    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 전화번호 자동 포맷팅 함수
  const formatPhoneNumber = (inputValue: string): string => {
    // 숫자만 추출
    const numbers = inputValue.replace(/[^\d]/g, '');
    
    // 11자리를 초과하면 잘라내기
    const truncated = numbers.slice(0, 11);
    
    // 자동 하이픈 추가
    if (truncated.length <= 3) {
      return truncated;
    } else if (truncated.length <= 7) {
      return `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
    } else {
      return `${truncated.slice(0, 3)}-${truncated.slice(3, 7)}-${truncated.slice(7)}`;
    }
  };

  // 비밀번호 토글 함수
  const handlePasswordToggle = () => {
    setIsPasswordVisible(prev => !prev);
  };

  // 근무시간 드롭다운 변경 핸들러 (분 단위)
  const handleTimeDropdownChange = (
    day: keyof WeekSchedule,
    timeType: 'start' | 'end',
    unit: 'hour' | 'minute',
    value: string
  ) => {
    const numValue = parseInt(value);
    const currentTime = timeType === 'start' 
      ? weeklyHolidayData[day].workingHours.start 
      : weeklyHolidayData[day].workingHours.end;
    
    const { hour, minute } = minutesToHourMinute(currentTime);
    const newMinutes = unit === 'hour' 
      ? hourMinuteToMinutes(numValue, minute)
      : hourMinuteToMinutes(hour, numValue);
    
    setWeeklyHolidayData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        workingHours: {
          ...prev[day].workingHours,
          [timeType]: newMinutes
        }
      }
    }));
  };

  // 기본 휴게시간 드롭다운 변경 핸들러 (분 단위)
  const handleLunchTimeDropdownChange = (
    day: keyof WeekSchedule,
    timeType: 'start' | 'end',
    unit: 'hour' | 'minute',
    value: string
  ) => {
    const numValue = parseInt(value);
    const currentTime = timeType === 'start' 
      ? weeklyHolidayData[day].lunchTime.start 
      : weeklyHolidayData[day].lunchTime.end;
    
    const { hour, minute } = minutesToHourMinute(currentTime);
    const newMinutes = unit === 'hour' 
      ? hourMinuteToMinutes(numValue, minute)
      : hourMinuteToMinutes(hour, numValue);
    
    setWeeklyHolidayData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        lunchTime: {
          ...prev[day].lunchTime,
          [timeType]: newMinutes
        }
      }
    }));
  };

  // 휴게시간 30분 슬롯 토글 핸들러
  const handleBreakTimeSlotToggle = (day: keyof WeekSchedule, slotMinutes: number) => {
    const dayData = weeklyHolidayData[day];
    const breakTimes = dayData.breakTimes || [];
    
    // 이미 선택된 슬롯인지 확인
    const existingIndex = breakTimes.findIndex(bt => bt.start === slotMinutes);
    
    if (existingIndex >= 0) {
      // 이미 선택되어 있으면 제거
      setWeeklyHolidayData(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          breakTimes: breakTimes.filter((_, i) => i !== existingIndex)
        }
      }));
    } else {
      // 선택되어 있지 않으면 추가 (30분 슬롯)
      const newBreakTime = {
        start: slotMinutes,
        end: slotMinutes + 30,
        name: `휴게시간 ${minutesToHourMinute(slotMinutes).hour}:${String(minutesToHourMinute(slotMinutes).minute).padStart(2, '0')}`
      };
      
      setWeeklyHolidayData(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          breakTimes: [...breakTimes, newBreakTime].sort((a, b) => a.start - b.start)
        }
      }));
    }
  };

  // 30분 단위 시간 슬롯 생성 함수
  const generateTimeSlots = (startMinutes: number, endMinutes: number): number[] => {
    const slots: number[] = [];
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      slots.push(minutes);
    }
    return slots;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 필수 필드 검증
    if (!formData.name.trim()) newErrors.name = '이름은 필수입니다.';
    if (!formData.loginId.trim()) newErrors.loginId = '로그인 ID는 필수입니다.';
    if (!formData.password.trim()) newErrors.password = '비밀번호는 필수입니다.';
    if (!formData.phone.trim()) newErrors.phone = '연락처는 필수입니다.';
    if (!formData.email.trim()) newErrors.email = '이메일은 필수입니다.';
    if (!formData.branchId) newErrors.branchId = '지점은 필수입니다.';
    if (!formData.position) newErrors.position = '직급은 필수입니다.';
    if (!formData.role) newErrors.role = '직책은 필수입니다.';
    if (!formData.employmentType) newErrors.employmentType = '고용형태는 필수입니다.';
    if (!formData.permission) newErrors.permission = '권한은 필수입니다.';
    if (!formData.contractStartDate) newErrors.contractStartDate = '계약시작일은 필수입니다.';
    
    // 정규직이 아닌 경우에만 계약종료일 필수
    if (formData.employmentType !== '정규직' && !formData.contractEndDate) {
      newErrors.contractEndDate = '계약종료일은 필수입니다.';
    }
    
    // 횟수제 프로그램 선택 시 근무시간대 필수
    if (formData.program) {
      const selectedProgram = programs.find(program => program.name === formData.program);
      if (selectedProgram && selectedProgram.type === '횟수제' && !formData.workShift) {
        newErrors.workShift = '횟수제 프로그램은 근무시간대 선택이 필수입니다.';
      }
      
      // 담당프로그램이 있으면 주간 휴일 설정 검증
      const hasAtLeastOneWorkday = Object.values(weeklyHolidayData).some(day => !day.isHoliday);
      if (!hasAtLeastOneWorkday) {
        newErrors.program = '최소 하나 이상의 근무일을 설정해야 합니다.';
        toast.error('최소 하나 이상의 근무일을 설정해야 합니다.');
      }
    }

    // 로그인 ID 형식 검증 (영문, 숫자만 허용, 4-20자)
    if (formData.loginId && !/^[a-zA-Z0-9]{4,20}$/.test(formData.loginId)) {
      newErrors.loginId = '로그인 ID는 영문, 숫자 4-20자로 입력해주세요.';
    }

    // 비밀번호 형식 검증 (8자 이상, 영문+숫자+특수문자 조합)
    if (formData.password && !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) {
      newErrors.password = '비밀번호는 8자 이상, 영문+숫자+특수문자 조합이어야 합니다.';
    }

    // 전화번호 형식 검증 (010-1234-5678 형태)
    if (formData.phone && !/^010-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다. (010-1234-5678)';
    }

    // 이메일 형식 검증
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    // 날짜 검증 (정규직이 아닌 경우에만)
    if (formData.employmentType !== '정규직' && formData.contractStartDate && formData.contractEndDate) {
      const startDate = new Date(formData.contractStartDate);
      const endDate = new Date(formData.contractEndDate);
      
      if (startDate >= endDate) {
        newErrors.contractEndDate = '계약종료일은 계약시작일보다 늦어야 합니다.';
      }
    }

    setErrors(newErrors);
    
    // validation 에러가 있으면 토스트 메시지로 표시
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 중복 체크 수행
      const duplicateCheck = await dbManager.checkDuplicateStaff(
        formData.loginId.trim(),
        formData.email.trim(),
        formData.phone.trim()
      );

      if (duplicateCheck.isDuplicate) {
        toast.error(duplicateCheck.message || '중복된 정보가 있습니다.');
        setIsSubmitting(false);
        return;
      }

      const staffData = {
        ...formData,
        registrationDate: new Date().toISOString().split('T')[0],
        contractStartDate: new Date(formData.contractStartDate),
        contractEndDate: formData.employmentType === '정규직' ? null : new Date(formData.contractEndDate),
        isActive: true // 신규 등록 직원은 기본적으로 활성 상태
      };

      // 직원 먼저 등록 (ID 생성을 위해)
      const savedStaff = await dbManager.addStaff(staffData);

      // 담당프로그램이 있는 경우 휴일 설정 저장
      if (formData.program) {
        // 이번주 토요일부터 금요일까지 7일치 데이터 생성
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0(일) ~ 6(토)
        
        // 이번주 토요일 계산
        let daysFromSaturday;
        if (dayOfWeek === 6) {
          daysFromSaturday = 0; // 오늘이 토요일
        } else {
          daysFromSaturday = dayOfWeek === 0 ? 1 : dayOfWeek + 1;
        }
        
        const thisSaturday = new Date(today);
        thisSaturday.setDate(today.getDate() - daysFromSaturday);
        
        console.log('일별 스케줄 설정 저장 시도:', {
          today: formatDateToLocal(today),
          thisSaturday: formatDateToLocal(thisSaturday),
          staffId: savedStaff.id,
          weeklyHolidayData
        });
        
        // 7일치 데이터 생성 (토요일 ~ 금요일)
        const dailySchedules: Omit<DailyScheduleSettings, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        const dayKeys = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        
        for (let i = 0; i < 7; i++) {
          const targetDate = new Date(thisSaturday);
          targetDate.setDate(thisSaturday.getDate() + i);
          const dateStr = formatDateToLocal(targetDate);
          const dayKey = dayKeys[i] as keyof typeof weeklyHolidayData;
          const daySettings = weeklyHolidayData[dayKey];
          
          if (daySettings.isHoliday) {
            dailySchedules.push({
              staffId: savedStaff.id,
              date: dateStr,
              isHoliday: true,
              workingHours: { start: 0, end: 0 },
              breakTimes: []
            });
          } else {
            const allBreakTimes = [...daySettings.breakTimes];
            
            // lunchTime이 유효한 경우에만 breakTimes에 추가
            if (daySettings.lunchTime.start > 0 && daySettings.lunchTime.end > 0) {
              allBreakTimes.unshift({
                start: daySettings.lunchTime.start,
                end: daySettings.lunchTime.end,
                name: daySettings.lunchTime.name
              });
            }
            
            dailySchedules.push({
              staffId: savedStaff.id,
              date: dateStr,
              isHoliday: false,
              workingHours: daySettings.workingHours,
              breakTimes: allBreakTimes
            });
          }
        }
        
        try {
          // 일별 스케줄 저장
          await dbManager.dailySchedule.saveDailySchedules(dailySchedules);
          console.log('일별 스케줄 설정 저장 성공:', dailySchedules.length);
        } catch (error) {
          console.error('일별 스케줄 설정 저장 실패:', error);
          toast.error('스케줄 설정 저장에 실패했습니다.');
          // 직원은 이미 등록되었으므로 계속 진행
        }
      }
      
      // 성공 시 폼 초기화
      setFormData({
        name: '',
        loginId: '',
        password: '',
        phone: '',
        email: '',
        branchId: '',
        position: '',
        role: '',
        employmentType: '',
        permission: '',
        program: '',
        workShift: '',
        contractStartDate: '',
        contractEndDate: '',
        contractFile: null
      });
      
      // 주간 휴일 데이터 초기화 (오늘까지는 휴일로 설정)
      setWeeklyHolidayData(getInitialWeeklyHolidayData());
      
      toast.success('직원이 성공적으로 등록되었습니다.');
    } catch (error) {
      console.error('직원 등록 실패:', error);
      toast.error('직원 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      loginId: '',
      password: '',
      phone: '',
      email: '',
      branchId: '',
      position: '',
      role: '',
      employmentType: '',
      permission: '',
      program: '',
      workShift: '',
      contractStartDate: '',
      contractEndDate: '',
      contractFile: null
    });
    
    // 주간 휴일 데이터 초기화 (오늘까지는 휴일로 설정)
    setWeeklyHolidayData(getInitialWeeklyHolidayData());
    
    setErrors({});
  };

  // 옵션 생성 함수들
  const getBranchOptions = () => {
    // 시스템관리자(master01)가 아닌 경우 '전체' 지점 제외
    const isSystemAdmin = currentUserId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
    
    let filteredBranches = isSystemAdmin 
      ? branches 
      : branches.filter(branch => branch.name !== '전체');
    
    // EDITOR 권한이면 본인 지점만 표시
    if (currentUserInfo && currentUserInfo.permission === 'EDITOR') {
      filteredBranches = branches.filter(branch => branch.id === currentUserInfo.branchId);
    }
    
    return filteredBranches.map(branch => ({
      value: branch.id,
      label: branch.name
    }));
  };

  const getPositionOptions = () => {
    return POSITIONS.map(position => ({
      value: position,
      label: position
    }));
  };

  const getRoleOptions = () => {
    return ROLES.map(role => ({
      value: role,
      label: role
    }));
  };

  const getEmploymentTypeOptions = () => {
    return EMPLOYMENT_TYPES.map(type => ({
      value: type,
      label: type
    }));
  };

  const getPermissionOptions = () => {
    // 시스템 관리자인지 확인
    const isSystemAdmin = currentUserId === SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID;
    
    // 시스템 관리자가 아닌 경우 MASTER 권한 제외
    const availablePermissions = isSystemAdmin 
      ? PERMISSIONS 
      : PERMISSIONS.filter(permission => permission.value !== 'MASTER');
    
    return availablePermissions.map(permission => ({
      value: permission.value,
      label: permission.label
    }));
  };

  const getProgramOptions = () => {
    return programs.map(program => ({
      value: program.name,
      label: program.name
    }));
  };

  const getWorkShiftOptions = () => {
    return WORK_SHIFTS.map(shift => ({
      value: shift,
      label: shift
    }));
  };

  // 날짜 제한 함수들
  const getContractStartDateMax = () => {
    if (formData.contractEndDate) {
      const endDate = new Date(formData.contractEndDate);
      endDate.setDate(endDate.getDate() - 1);
      return endDate.toISOString().split('T')[0];
    }
    return '';
  };

  const getContractEndDateMin = () => {
    if (formData.contractStartDate) {
      const startDate = new Date(formData.contractStartDate);
      startDate.setDate(startDate.getDate() + 1);
      return startDate.toISOString().split('T')[0];
    }
    return '';
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>직원 등록</PageTitle>
        <PageDescription>새로운 직원 정보를 등록합니다.</PageDescription>
      </PageHeader>

        <FormContainer>
          {/* 기본 정보 섹션 */}
          <FormSection>
            <SectionTitle>기본 정보</SectionTitle>
            
            {/* 이름 - 전체 너비 */}
            <FieldRow>
              <FieldColumn>
                <Label $required>이름</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="이름을 입력하세요"
                  $error={!!errors.name}
                />
                {errors.name && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.name}</div>}
              </FieldColumn>
            </FieldRow>

            {/* 로그인ID, 비밀번호 */}
            <FieldRow>
              <FieldColumn>
                <Label $required>로그인 ID</Label>
                <Input
                  type="text"
                  value={formData.loginId}
                  onChange={(e) => handleInputChange('loginId', e.target.value)}
                  placeholder="영문, 숫자 4-20자"
                  $error={!!errors.loginId}
                />
                {errors.loginId && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.loginId}</div>}
              </FieldColumn>

              <FieldColumn>
                <Label $required>비밀번호</Label>
                <PasswordInputWrapper>
                  <Input
                    type={isPasswordVisible ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="영문+숫자+특수문자 8자 이상"
                    $error={!!errors.password}
                    style={{ paddingRight: '40px' }}
                  />
                  <PasswordToggleIcon onClick={handlePasswordToggle}>
                    {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                  </PasswordToggleIcon>
                </PasswordInputWrapper>
                {errors.password && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.password}</div>}
              </FieldColumn>
            </FieldRow>

            {/* 이메일, 연락처 */}
            <FieldRow>
              <FieldColumn>
                <Label $required>이메일</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@email.com"
                  $error={!!errors.email}
                />
                {errors.email && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.email}</div>}
              </FieldColumn>

              <FieldColumn>
                <Label $required>연락처</Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="010-1234-5678"
                  $error={!!errors.phone}
                  maxLength={13}
                  autoComplete="tel"
                />
                {errors.phone && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.phone}</div>}
              </FieldColumn>
            </FieldRow>
          </FormSection>

          {/* 조직 정보 섹션 */}
          <FormSection>
            <SectionTitle>조직 정보</SectionTitle>
            
            {/* 지점, 권한 */}
            <FieldRow>
              <FieldColumn>
                <Label $required>지점</Label>
                <CustomDropdown
                  value={formData.branchId}
                  onChange={(value: string) => handleInputChange('branchId', value)}
                  options={getBranchOptions()}
                  placeholder="지점을 선택하세요"
                  error={!!errors.branchId}
                  disabled={currentUserInfo && currentUserInfo.permission === 'EDITOR'} // EDITOR 권한일 때 비활성화
                  required
                />
                {currentUserInfo && currentUserInfo.permission === 'EDITOR' && (
                  <div style={{ 
                    color: AppColors.onInput1, 
                    fontSize: AppTextStyles.label3.fontSize, 
                    marginTop: '4px' 
                  }}>
                    ℹ️ EDITOR 권한은 소속 지점에서만 직원을 등록할 수 있습니다.
                  </div>
                )}
                {errors.branchId && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.branchId}</div>}
              </FieldColumn>

              <FieldColumn>
                <Label $required>권한</Label>
                <CustomDropdown
                  value={formData.permission}
                  onChange={(value: string) => handleInputChange('permission', value)}
                  options={getPermissionOptions()}
                  placeholder="권한을 선택하세요"
                  error={!!errors.permission}
                  required
                />
                {!currentUserId || currentUserId !== SYSTEM_ADMIN_CONFIG.SYSTEM_ADMIN_LOGIN_ID ? (
                  <div style={{ 
                    color: AppColors.onInput1, 
                    fontSize: AppTextStyles.label3.fontSize, 
                    marginTop: '4px' 
                  }}>
                    ℹ️ MASTER 권한은 시스템 관리자만 부여할 수 있습니다.
                  </div>
                ) : null}
                {errors.permission && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.permission}</div>}
              </FieldColumn>
            </FieldRow>

            {/* 직급, 직책 */}
            <FieldRow>
              <FieldColumn>
                <Label $required>직급</Label>
                <CustomDropdown
                  value={formData.position}
                  onChange={(value: string) => handleInputChange('position', value)}
                  options={getPositionOptions()}
                  placeholder="직급을 선택하세요"
                  error={!!errors.position}
                  required
                />
                {errors.position && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.position}</div>}
              </FieldColumn>

              <FieldColumn>
                <Label $required>직책</Label>
                <CustomDropdown
                  value={formData.role}
                  onChange={(value: string) => handleInputChange('role', value)}
                  options={getRoleOptions()}
                  placeholder="직책을 선택하세요"
                  error={!!errors.role}
                  required
                />
                {errors.role && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.role}</div>}
              </FieldColumn>
            </FieldRow>

            {/* 고용형태, 담당프로그램 */}
            <FieldRow>
              <FieldColumn>
                <Label $required>고용형태</Label>
                <CustomDropdown
                  value={formData.employmentType}
                  onChange={(value: string) => handleInputChange('employmentType', value)}
                  options={getEmploymentTypeOptions()}
                  placeholder="고용형태를 선택하세요"
                  error={!!errors.employmentType}
                  required
                />
                {errors.employmentType && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.employmentType}</div>}
              </FieldColumn>

              <FieldColumn>
                <Label>담당프로그램</Label>
                <CustomDropdown
                  value={formData.program}
                  onChange={(value: string) => handleInputChange('program', value)}
                  options={getProgramOptions()}
                  placeholder="담당프로그램을 선택하세요"
                  error={!!errors.program}
                />
                {errors.program && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.program}</div>}
              </FieldColumn>
            </FieldRow>

            {/* 근무시간대 (횟수제 프로그램 선택 시에만 표시) */}
            {(() => {
              const selectedProgram = programs.find(program => program.name === formData.program);
              return selectedProgram && selectedProgram.type === '횟수제';
            })() && (
              <FieldRow>
                <FieldColumn>
                  <Label $required>근무시간대</Label>
                  <CustomDropdown
                    value={formData.workShift}
                    onChange={(value: string) => handleInputChange('workShift', value)}
                    options={getWorkShiftOptions()}
                    placeholder="근무시간대를 선택하세요"
                    error={!!errors.workShift}
                    required
                  />
                  {errors.workShift && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.workShift}</div>}
                </FieldColumn>
                <FieldColumn>
                  {/* 빈 칸 */}
                </FieldColumn>
              </FieldRow>
            )}
            
            {/* 주간 휴일 설정 (담당프로그램이 있을 때만 표시) */}
            {formData.program && (
              <>
                <div style={{ 
                  marginTop: '24px', 
                  padding: '20px', 
                  background: AppColors.surface,
                  borderRadius: '12px',
                  border: `1px solid ${AppColors.borderLight}`
                }}>
                  <div style={{ 
                    fontSize: AppTextStyles.title3.fontSize, 
                    fontWeight: 600,
                    color: AppColors.onSurface,
                    marginBottom: '8px'
                  }}>
                    📅 이번주 휴일 설정 ({getThisWeekDateRange()}) <span style={{ color: AppColors.error }}>*</span>
                  </div>
                  <div style={{ 
                    fontSize: AppTextStyles.body2.fontSize, 
                    color: AppColors.onSurface + '80',
                    marginBottom: '20px'
                  }}>
                    담당프로그램이 있는 직원은 이번주(지난 토요일~돌아오는 금요일) 휴일 및 근무시간을 설정해야 합니다.
                    <br />
                    체크하면 휴일, 체크 해제하면 근무일입니다. (오늘까지는 자동으로 휴일 처리됩니다)
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '12px'
                  }}>
                    {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => {
                      const dayLabels = {
                        monday: '월요일',
                        tuesday: '화요일',
                        wednesday: '수요일',
                        thursday: '목요일',
                        friday: '금요일',
                        saturday: '토요일',
                        sunday: '일요일'
                      };
                      
                      const isWeekend = day === 'saturday' || day === 'sunday';
                      const dayData = weeklyHolidayData[day];
                      const isPastOrToday = isDayInPastOrToday(day);
                      const dayDate = getDayDate(day);
                      
                      return (
                        <div 
                          key={day} 
                          style={{ 
                            backgroundColor: dayData.isHoliday ? AppColors.error + '10' : AppColors.surface,
                            border: `1px solid ${dayData.isHoliday ? AppColors.error + '30' : AppColors.borderLight}`,
                            borderRadius: '8px',
                            padding: '12px',
                            transition: 'all 0.2s ease',
                            opacity: isPastOrToday ? 0.6 : 1
                          }}
                        >
                          <div style={{ 
                            fontSize: AppTextStyles.body1.fontSize,
                            fontWeight: 600,
                            color: dayData.isHoliday ? AppColors.error : (isWeekend ? AppColors.primary : AppColors.onSurface),
                            marginBottom: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>{dayLabels[day]} ({dayDate.getMonth() + 1}/{dayDate.getDate()})</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                id={`holiday-${day}`}
                                checked={dayData.isHoliday}
                                disabled={isPastOrToday}
                                onChange={(e) => {
                                  const isHoliday = e.target.checked;
                                  const isNightShift = formData.workShift === '야간';
                                  setWeeklyHolidayData(prev => ({
                                    ...prev,
                                    [day]: isHoliday ? { isHoliday: true } as any : {
                                      isHoliday: false,
                                      workingHours: { 
                                        start: hourMinuteToMinutes(isNightShift ? 15 : 9), 
                                        end: hourMinuteToMinutes(isNightShift ? 24 : 21) 
                                      },
                                      lunchTime: {
                                        start: hourMinuteToMinutes(isNightShift ? 18 : 12),
                                        end: hourMinuteToMinutes(isNightShift ? 19 : 13),
                                        name: '기본 휴게시간'
                                      },
                                      breakTimes: []
                                    }
                                  }));
                                }}
                                style={{ width: '16px', height: '16px', accentColor: AppColors.error, cursor: isPastOrToday ? 'not-allowed' : 'pointer' }}
                              />
                              <label 
                                htmlFor={`holiday-${day}`}
                                style={{ 
                                  fontSize: AppTextStyles.body2.fontSize,
                                  color: AppColors.onSurface,
                                  cursor: 'pointer',
                                  fontWeight: 500
                                }}
                              >
                                휴일
                              </label>
                            </div>
                          </div>
                          
                          {!dayData.isHoliday && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                              {/* 근무시간 */}
                              <div>
                                <div style={{ 
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                  marginBottom: '8px',
                                  color: '#333',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '12px'
                                }}>
                                  근무 시간
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <select
                                        value={minutesToHourMinute(dayData.workingHours.start).hour}
                                        onChange={(e) => handleTimeDropdownChange(day, 'start', 'hour', e.target.value)}
                                        style={{
                                          padding: '4px 6px',
                                          border: '1px solid #ddd',
                                          borderRadius: '4px',
                                          fontSize: '0.9rem',
                                          fontWeight: 500,
                                          backgroundColor: 'white',
                                          width: '50px'
                                        }}
                                      >
                                        {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                                          <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                                        ))}
                                      </select>
                                      <span>:</span>
                                      <select
                                        value={minutesToHourMinute(dayData.workingHours.start).minute}
                                        onChange={(e) => handleTimeDropdownChange(day, 'start', 'minute', e.target.value)}
                                        style={{
                                          padding: '4px 6px',
                                          border: '1px solid #ddd',
                                          borderRadius: '4px',
                                          fontSize: '0.9rem',
                                          fontWeight: 500,
                                          backgroundColor: 'white',
                                          width: '50px'
                                        }}
                                      >
                                        <option value={0}>00</option>
                                        <option value={30}>30</option>
                                      </select>
                                    </div>
                                    <span style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>~</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <select
                                        value={minutesToHourMinute(dayData.workingHours.end).hour}
                                        onChange={(e) => handleTimeDropdownChange(day, 'end', 'hour', e.target.value)}
                                        style={{
                                          padding: '4px 6px',
                                          border: '1px solid #ddd',
                                          borderRadius: '4px',
                                          fontSize: '0.9rem',
                                          fontWeight: 500,
                                          backgroundColor: 'white',
                                          width: '50px'
                                        }}
                                      >
                                        {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                                          <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                                        ))}
                                      </select>
                                      <span>:</span>
                                      <select
                                        value={minutesToHourMinute(dayData.workingHours.end).minute}
                                        onChange={(e) => handleTimeDropdownChange(day, 'end', 'minute', e.target.value)}
                                        style={{
                                          padding: '4px 6px',
                                          border: '1px solid #ddd',
                                          borderRadius: '4px',
                                          fontSize: '0.9rem',
                                          fontWeight: 500,
                                          backgroundColor: 'white',
                                          width: '50px'
                                        }}
                                      >
                                        <option value={0}>00</option>
                                        <option value={30}>30</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* 기본 휴게시간 */}
                              <div>
                                <div style={{ 
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                  marginBottom: '8px',
                                  color: '#333',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '12px'
                                }}>
                                  {dayData.lunchTime.name}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <select
                                        value={minutesToHourMinute(dayData.lunchTime.start).hour}
                                        onChange={(e) => handleLunchTimeDropdownChange(day, 'start', 'hour', e.target.value)}
                                        style={{
                                          padding: '4px 6px',
                                          border: '1px solid #ddd',
                                          borderRadius: '4px',
                                          fontSize: '0.9rem',
                                          fontWeight: 500,
                                          backgroundColor: 'white',
                                          width: '50px'
                                        }}
                                      >
                                        {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                                          <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                                        ))}
                                      </select>
                                      <span>:</span>
                                      <select
                                        value={minutesToHourMinute(dayData.lunchTime.start).minute}
                                        onChange={(e) => handleLunchTimeDropdownChange(day, 'start', 'minute', e.target.value)}
                                        style={{
                                          padding: '4px 6px',
                                          border: '1px solid #ddd',
                                          borderRadius: '4px',
                                          fontSize: '0.9rem',
                                          fontWeight: 500,
                                          backgroundColor: 'white',
                                          width: '50px'
                                        }}
                                      >
                                        <option value={0}>00</option>
                                        <option value={30}>30</option>
                                      </select>
                                    </div>
                                    <span style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>~</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <select
                                        value={minutesToHourMinute(dayData.lunchTime.end).hour}
                                        onChange={(e) => handleLunchTimeDropdownChange(day, 'end', 'hour', e.target.value)}
                                        style={{
                                          padding: '4px 6px',
                                          border: '1px solid #ddd',
                                          borderRadius: '4px',
                                          fontSize: '0.9rem',
                                          fontWeight: 500,
                                          backgroundColor: 'white',
                                          width: '50px'
                                        }}
                                      >
                                        {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                                          <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                                        ))}
                                      </select>
                                      <span>:</span>
                                      <select
                                        value={minutesToHourMinute(dayData.lunchTime.end).minute}
                                        onChange={(e) => handleLunchTimeDropdownChange(day, 'end', 'minute', e.target.value)}
                                        style={{
                                          padding: '4px 6px',
                                          border: '1px solid #ddd',
                                          borderRadius: '4px',
                                          fontSize: '0.9rem',
                                          fontWeight: 500,
                                          backgroundColor: 'white',
                                          width: '50px'
                                        }}
                                      >
                                        <option value={0}>00</option>
                                        <option value={30}>30</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* 휴게시간 (30분 단위 그리드) */}
                              <div>
                                <div style={{ 
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                  marginBottom: '8px',
                                  color: '#333',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  휴게 시간
                                </div>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                                  gap: '6px',
                                  marginTop: '8px',
                                  padding: '8px',
                                  backgroundColor: AppColors.background,
                                  borderRadius: '6px',
                                  border: `1px solid ${AppColors.borderLight}`
                                }}>
                                  {generateTimeSlots(dayData.workingHours.start, dayData.workingHours.end).map(slotMinutes => {
                                    const { hour, minute } = minutesToHourMinute(slotMinutes);
                                    const isActive = dayData.breakTimes.some(bt => bt.start === slotMinutes);
                                    const isInLunchTime = slotMinutes >= dayData.lunchTime.start && slotMinutes < dayData.lunchTime.end;
                                    
                                    return (
                                      <button
                                        key={slotMinutes}
                                        onClick={() => !isInLunchTime && handleBreakTimeSlotToggle(day, slotMinutes)}
                                        disabled={isInLunchTime}
                                        style={{
                                          padding: '6px 4px',
                                          borderRadius: '4px',
                                          fontSize: '11px',
                                          fontWeight: 500,
                                          cursor: isInLunchTime ? 'not-allowed' : 'pointer',
                                          border: `1px solid ${isInLunchTime ? AppColors.borderLight : isActive ? AppColors.error : AppColors.borderLight}`,
                                          backgroundColor: isInLunchTime ? AppColors.surface + '50' : isActive ? AppColors.error + '20' : AppColors.surface,
                                          color: isInLunchTime ? AppColors.onSurface + '40' : isActive ? AppColors.error : AppColors.onSurface,
                                          transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!isInLunchTime) {
                                            e.currentTarget.style.backgroundColor = isActive ? AppColors.error + '30' : AppColors.primary + '10';
                                            e.currentTarget.style.borderColor = isActive ? AppColors.error : AppColors.primary;
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!isInLunchTime) {
                                            e.currentTarget.style.backgroundColor = isActive ? AppColors.error + '20' : AppColors.surface;
                                            e.currentTarget.style.borderColor = isActive ? AppColors.error : AppColors.borderLight;
                                          }
                                        }}
                                      >
                                        {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </FormSection>

          {/* 계약 정보 섹션 */}
          <FormSection>
            <SectionTitle>계약 정보</SectionTitle>
            
            <FieldRow>
              <FieldColumn>
                <Label $required>계약시작일</Label>
                <CustomDateInput
                  value={formData.contractStartDate}
                  onChange={(value: string) => handleInputChange('contractStartDate', value)}
                  placeholder="계약시작일을 선택하세요"
                  error={!!errors.contractStartDate}
                  max={getContractStartDateMax()}
                  required
                />
                {errors.contractStartDate && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.contractStartDate}</div>}
              </FieldColumn>

              <FieldColumn>
                <Label $required={formData.employmentType !== '정규직'}>계약종료일</Label>
                <CustomDateInput
                  value={formData.contractEndDate}
                  onChange={(value: string) => handleInputChange('contractEndDate', value)}
                  placeholder={formData.employmentType === '정규직' ? "정규직은 입력 불필요" : "계약종료일을 선택하세요"}
                  error={!!errors.contractEndDate}
                  min={getContractEndDateMin()}
                  disabled={formData.employmentType === '정규직'}
                  required={formData.employmentType !== '정규직'}
                />
                {errors.contractEndDate && <div style={{ color: AppColors.error, fontSize: AppTextStyles.label3.fontSize, marginTop: '4px' }}>{errors.contractEndDate}</div>}
              </FieldColumn>
            </FieldRow>

            <FieldRow>
              <FieldColumn>
                <StaffFileUploadField
                  label="계약서 파일"
                  value={formData.contractFile || null}
                  onChange={(file) => handleInputChange('contractFile', file)}
                  placeholder="이미지 또는 PDF 파일 선택 (최대 10MB)"
                  errorMessage={errors.contractFile}
                  fullWidth
                />
              </FieldColumn>
            </FieldRow>
          </FormSection>
        </FormContainer>

        <ButtonContainer>
          <Button variant="secondary" onClick={handleReset}>
            초기화
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '등록 중...' : '등록'}
          </Button>
        </ButtonContainer>
      </PageContainer>
    );
  };

export default StaffRegister;
