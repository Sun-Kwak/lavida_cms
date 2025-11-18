import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { StepContent, StepTitle, FormGrid, FormField, Label, Input } from './StyledComponents';
import { BasicInfo, StepProps, AddressInfo } from './types';
import DaumAddressSearch from '../../../components/DaumAddressSearch';
import CustomDateInput from '../../../components/CustomDateInput';
import CustomDropdown from '../../../components/CustomDropdown';

const BasicInfoStep: React.FC<StepProps> = ({ formData, onUpdate, onErrorsChange }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const prevErrorsRef = useRef<{ [key: string]: string }>({});
  const lastPhoneToastRef = useRef<boolean>(false);
  const lastEmailToastRef = useRef<boolean>(false);

  // 에러 상태가 변경될 때마다 상위 컴포넌트에 전달 (이전 값과 비교해서 변경된 경우에만)
  useEffect(() => {
    const errorsString = JSON.stringify(errors);
    const prevErrorsString = JSON.stringify(prevErrorsRef.current);
    
    if (errorsString !== prevErrorsString) {
      onErrorsChange?.(errors);
      prevErrorsRef.current = errors;
    }
  }, [errors, onErrorsChange]);

  // 초기 필수 필드 체크
  useEffect(() => {
    const newErrors: { [key: string]: string } = {};
    
    // 페이지 로드 시 빈 필드들에 대해 에러 표시하지 않음 (사용자가 입력을 시작한 후에만 검증)
    // 대신 validateCurrentStep에서 필수 필드 체크를 수행
    
    setErrors(newErrors);
  }, []); // 초기 마운트시에만 실행

  // 컴포넌트 마운트 시 성별 기본값 설정
  useEffect(() => {
    if (!formData.basicInfo.gender) {
      onUpdate({
        basicInfo: { ...formData.basicInfo, gender: 'female' }
      });
    }
  }, [formData.basicInfo, onUpdate]);

  // 성별 옵션
  const getGenderOptions = () => [
    { value: 'female', label: '여성' },
    { value: 'male', label: '남성' }
  ];

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

  const handleInputChange = (field: keyof BasicInfo, value: string) => {
    let processedValue = value;
    const newErrors = { ...errors };

    // 전화번호 필드인 경우 자동 포맷팅 적용
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
      
      // 전화번호 validation
      if (processedValue && !/^010-\d{4}-\d{4}$/.test(processedValue)) {
        newErrors.phone = '올바른 전화번호 형식이 아닙니다. (010-1234-5678)';
        if (processedValue.length >= 13 && !lastPhoneToastRef.current) {
          toast.error('올바른 전화번호 형식이 아닙니다. (010-1234-5678)');
          lastPhoneToastRef.current = true;
        }
      } else {
        delete newErrors.phone;
        lastPhoneToastRef.current = false;
      }
    }

    // 이메일 필드인 경우 validation
    if (field === 'email') {
      // 한글 입력 방지
      const koreanPattern = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
      if (processedValue && koreanPattern.test(processedValue)) {
        newErrors.email = '이메일에는 한글을 입력할 수 없습니다.';
        toast.error('이메일에는 한글을 입력할 수 없습니다.');
        return; // 한글이 포함된 경우 업데이트하지 않음
      }
      
      // 이메일 형식 validation
      if (processedValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(processedValue)) {
        newErrors.email = '올바른 이메일 형식이 아닙니다.';
        if (processedValue.includes('@') && processedValue.length > 5 && !lastEmailToastRef.current) {
          toast.error('올바른 이메일 형식이 아닙니다.');
          lastEmailToastRef.current = true;
        }
      } else {
        delete newErrors.email;
        lastEmailToastRef.current = false;
      }
    }

    // 이름 필드 validation
    if (field === 'name') {
      if (!processedValue.trim()) {
        newErrors.name = '이름을 입력해주세요.';
      } else {
        delete newErrors.name;
      }
    }

    // 생년월일 필드 validation
    if (field === 'birth') {
      if (!processedValue.trim()) {
        newErrors.birth = '생년월일을 선택해주세요.';
      } else {
        delete newErrors.birth;
      }
    }

    // 성별 필드 validation
    if (field === 'gender') {
      if (!processedValue.trim()) {
        newErrors.gender = '성별을 선택해주세요.';
      } else {
        delete newErrors.gender;
      }
    }

    setErrors(newErrors);

    onUpdate({
      basicInfo: { ...formData.basicInfo, [field]: processedValue }
    });
  };

  const handleAddressSelect = (addressInfo: AddressInfo) => {
    // 주소가 선택되면 주소 관련 에러 제거
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.address;
      return newErrors;
    });
    
    onUpdate({
      basicInfo: { ...formData.basicInfo, addressInfo }
    });
  };

  return (
    <StepContent>
      <StepTitle>기본정보</StepTitle>
      <FormGrid>
        <FormField>
          <Label>이름 *</Label>
          <Input
            value={formData.basicInfo.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="홍길동"
            required
          />
          {errors.name && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>{errors.name}</div>}
        </FormField>

        <FormField>
          <Label>연락처 *</Label>
          <Input
            type="tel"
            inputMode="numeric"
            value={formData.basicInfo.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="010-1234-5678"
            maxLength={13}
            autoComplete="tel"
            required
          />
          {errors.phone && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</div>}
        </FormField>

        <FormField>
          <Label>이메일</Label>
          <Input
            type="email"
            value={formData.basicInfo.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="example@email.com"
          />
          {errors.email && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>{errors.email}</div>}
        </FormField>

        <FormField>
          <Label>생년월일 *</Label>
          <CustomDateInput
            value={formData.basicInfo.birth}
            onChange={(value: string) => handleInputChange('birth', value)}
            placeholder="생년월일을 선택하세요"
            error={!!errors.birth}
            required
            max={new Date().toISOString().split('T')[0]}
            defaultViewDate="1970-01-01"
          />
          {errors.birth && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>{errors.birth}</div>}
        </FormField>

        <FormField>
          <Label>성별 *</Label>
          <CustomDropdown
            value={formData.basicInfo.gender || 'female'}
            onChange={(value: string) => handleInputChange('gender', value)}
            options={getGenderOptions()}
            error={!!errors.gender}
            required
          />
          {errors.gender && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>{errors.gender}</div>}
        </FormField>

        <FormField $fullWidth>
          <Label>주소 *</Label>
          <DaumAddressSearch
            onAddressSelect={handleAddressSelect}
            placeholder="클릭하여 주소를 검색하세요"
            value={formData.basicInfo.addressInfo.address}
          />
          {errors.address && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>{errors.address}</div>}
        </FormField>
      </FormGrid>
    </StepContent>
  );
};

export default BasicInfoStep;
