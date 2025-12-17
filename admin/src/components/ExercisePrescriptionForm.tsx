import React from 'react';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';
import { Member, ExercisePrescription, ExercisePrescriptionMedicalHistory, BodyImagePoint } from '../utils/db/types';
import BodyImageCanvas from './BodyImageCanvas';
import SignatureCanvas from './SignatureCanvas';

const PrescriptionContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 40px);
  
  @media print {
    box-shadow: none;
    padding: 20px;
    margin: 0;
    max-width: none;
    min-height: auto;
  }
`;

const PrescriptionTitle = styled.h1`
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 30px;
  color: ${AppColors.onBackground};
`;

const FormRow = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: flex-start;
`;

const FormGroup = styled.div`
  flex: 1;
`;

const FormLabel = styled.label`
  display: block;
  font-size: ${AppTextStyles.label1.fontSize};
  font-weight: 600;
  color: ${AppColors.onBackground};
  margin-bottom: 8px;
`;

const FormInput = styled.input<{ readOnly?: boolean }>`
  width: 100%;
  padding: 10px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 6px;
  font-size: ${AppTextStyles.body2.fontSize};
  box-sizing: border-box;
  background: ${props => props.readOnly ? '#f5f5f5' : 'white'};
  
  &:focus {
    outline: none;
    border-color: ${props => props.readOnly ? AppColors.borderLight : AppColors.primary};
  }
`;

const FormTextarea = styled.textarea<{ readOnly?: boolean }>`
  width: 100%;
  padding: 10px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 6px;
  font-size: ${AppTextStyles.body2.fontSize};
  resize: vertical;
  box-sizing: border-box;
  background: ${props => props.readOnly ? '#f5f5f5' : 'white'};
  
  &:focus {
    outline: none;
    border-color: ${props => props.readOnly ? AppColors.borderLight : AppColors.primary};
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const CheckboxItem = styled.label<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  font-size: ${AppTextStyles.body2.fontSize};
  opacity: ${props => props.disabled ? 0.7 : 1};
`;

const Checkbox = styled.input<{ disabled?: boolean }>`
  margin: 0;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
`;

const ImageSection = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const ConsentSection = styled.div`
  margin-top: 20px;
  padding: 20px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  background: #f9f9f9;
`;

const ConsentText = styled.p`
  font-size: ${AppTextStyles.body2.fontSize};
  line-height: 1.6;
  color: ${AppColors.onBackground};
  margin-bottom: 20px;
`;

const DateRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid ${AppColors.borderLight};
`;

const DateItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

const DateLabel = styled.div`
  font-size: ${AppTextStyles.body3.fontSize};
  color: ${AppColors.onInput1};
  font-weight: 600;
`;

const DateValue = styled.div`
  font-size: ${AppTextStyles.body2.fontSize};
  color: ${AppColors.onBackground};
`;

const SignatureNote = styled.div`
  margin-top: 8px;
  font-size: ${AppTextStyles.body3.fontSize};
  color: ${AppColors.onInput1};
  text-align: center;
  font-style: italic;
`;

interface ExercisePrescriptionFormProps {
  selectedMember: Member | null;
  prescription: ExercisePrescription | null;
  formData: {
    height: string;
    weight: string;
    footSize: string;
    medications: string;
    medicalHistory: ExercisePrescriptionMedicalHistory;
    painHistory: string;
    bodyImages: {
      front: BodyImagePoint[];
      spine: BodyImagePoint[];
      back: BodyImagePoint[];
    };
    signatureData: string;
  };
  readOnly?: boolean;
  onInputChange?: (field: string, value: string) => void;
  onCheckboxChange?: (field: string, checked: boolean) => void;
  onSignatureChange?: (dataUrl: string) => void;
  onAddBodyImagePoint?: (imageType: 'front' | 'spine' | 'back', point: Omit<BodyImagePoint, 'id'>) => void;
  onUpdateBodyImagePoint?: (imageType: 'front' | 'spine' | 'back', pointId: string, updates: Partial<Omit<BodyImagePoint, 'id'>>) => void;
  onDeleteBodyImagePoint?: (imageType: 'front' | 'spine' | 'back', pointId: string) => void;
}

const ExercisePrescriptionForm: React.FC<ExercisePrescriptionFormProps> = ({
  selectedMember,
  prescription,
  formData,
  readOnly = false,
  onInputChange,
  onCheckboxChange,
  onSignatureChange,
  onAddBodyImagePoint,
  onUpdateBodyImagePoint,
  onDeleteBodyImagePoint
}) => {
  const hasExistingSignature = (): boolean => {
    return !!(prescription?.signedAt && prescription?.signatureData && prescription.signatureData.trim() !== '');
  };

  return (
    <PrescriptionContainer>
      <PrescriptionTitle>운동처방서</PrescriptionTitle>
      
      {/* 기본 정보 */}
      <FormRow>
        <FormGroup>
          <FormLabel>성명</FormLabel>
          <FormInput
            type="text"
            value={selectedMember?.name || ''}
            readOnly
            style={{ background: '#f5f5f5' }}
          />
        </FormGroup>
        <FormGroup>
          <FormLabel>생년월일</FormLabel>
          <FormInput
            type="text"
            value={selectedMember?.birth || ''}
            readOnly
            style={{ background: '#f5f5f5' }}
          />
        </FormGroup>
        <FormGroup>
          <FormLabel>키</FormLabel>
          <FormInput
            type="text"
            placeholder="키(cm)"
            value={formData.height}
            readOnly={readOnly}
            onChange={!readOnly && onInputChange ? (e) => onInputChange('height', e.target.value) : undefined}
          />
        </FormGroup>
        <FormGroup>
          <FormLabel>체중</FormLabel>
          <FormInput
            type="text"
            placeholder="체중(kg)"
            value={formData.weight}
            readOnly={readOnly}
            onChange={!readOnly && onInputChange ? (e) => onInputChange('weight', e.target.value) : undefined}
          />
        </FormGroup>
        <FormGroup>
          <FormLabel>발사이즈</FormLabel>
          <FormInput
            type="text"
            placeholder="발사이즈"
            value={formData.footSize}
            readOnly={readOnly}
            onChange={!readOnly && onInputChange ? (e) => onInputChange('footSize', e.target.value) : undefined}
          />
        </FormGroup>
      </FormRow>

      {/* 복용중인 약 - 라벨과 입력란을 같은 행에 배치 */}
      <FormRow>
        <FormGroup style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <FormLabel style={{ marginBottom: '0', minWidth: '120px', flexShrink: 0 }}>복용중인 약</FormLabel>
          <FormInput
            type="text"
            placeholder="복용중인 약물을 입력하세요"
            value={formData.medications}
            readOnly={readOnly}
            onChange={!readOnly && onInputChange ? (e) => onInputChange('medications', e.target.value) : undefined}
            style={{ flex: 1 }}
          />
        </FormGroup>
      </FormRow>

      {/* 병력사항 - 라벨과 체크박스를 같은 행에 배치 */}
      <FormRow>
        <FormGroup style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <FormLabel style={{ marginBottom: '0', minWidth: '120px', flexShrink: 0 }}>병력사항</FormLabel>
          <CheckboxGroup style={{ flex: 1 }}>
            <CheckboxItem disabled={readOnly}>
              <Checkbox
                type="checkbox"
                checked={formData.medicalHistory.musculoskeletal}
                disabled={readOnly}
                onChange={!readOnly && onCheckboxChange ? (e) => onCheckboxChange('musculoskeletal', e.target.checked) : undefined}
              />
              근골격계질환
            </CheckboxItem>
            <CheckboxItem disabled={readOnly}>
              <Checkbox
                type="checkbox"
                checked={formData.medicalHistory.cardiovascular}
                disabled={readOnly}
                onChange={!readOnly && onCheckboxChange ? (e) => onCheckboxChange('cardiovascular', e.target.checked) : undefined}
              />
              심혈관계질환
            </CheckboxItem>
            <CheckboxItem disabled={readOnly}>
              <Checkbox
                type="checkbox"
                checked={formData.medicalHistory.diabetes}
                disabled={readOnly}
                onChange={!readOnly && onCheckboxChange ? (e) => onCheckboxChange('diabetes', e.target.checked) : undefined}
              />
              당뇨
            </CheckboxItem>
            <CheckboxItem disabled={readOnly}>
              <Checkbox
                type="checkbox"
                checked={formData.medicalHistory.osteoporosis}
                disabled={readOnly}
                onChange={!readOnly && onCheckboxChange ? (e) => onCheckboxChange('osteoporosis', e.target.checked) : undefined}
              />
              골다공증
            </CheckboxItem>
            <CheckboxItem disabled={readOnly}>
              <Checkbox
                type="checkbox"
                checked={formData.medicalHistory.thyroid}
                disabled={readOnly}
                onChange={!readOnly && onCheckboxChange ? (e) => onCheckboxChange('thyroid', e.target.checked) : undefined}
              />
              갑상선
            </CheckboxItem>
            <CheckboxItem disabled={readOnly}>
              <Checkbox
                type="checkbox"
                checked={formData.medicalHistory.varicose}
                disabled={readOnly}
                onChange={!readOnly && onCheckboxChange ? (e) => onCheckboxChange('varicose', e.target.checked) : undefined}
              />
              정맥류
            </CheckboxItem>
            <CheckboxItem disabled={readOnly}>
              <Checkbox
                type="checkbox"
                checked={formData.medicalHistory.arthritis}
                disabled={readOnly}
                onChange={!readOnly && onCheckboxChange ? (e) => onCheckboxChange('arthritis', e.target.checked) : undefined}
              />
              관절염
            </CheckboxItem>
          </CheckboxGroup>
        </FormGroup>
      </FormRow>

      {/* 이미지 영역 */}
      <ImageSection>
        <div data-image-type="front">
          <BodyImageCanvas
            imageType="front"
            imageUrl=""
            points={formData.bodyImages.front}
            readonly={readOnly}
            onAddPoint={readOnly ? () => {} : onAddBodyImagePoint ? (point) => onAddBodyImagePoint('front', point) : () => {}}
            onUpdatePoint={readOnly ? () => {} : onUpdateBodyImagePoint ? (pointId, updates) => onUpdateBodyImagePoint('front', pointId, updates) : () => {}}
            onDeletePoint={readOnly ? () => {} : onDeleteBodyImagePoint ? (pointId) => onDeleteBodyImagePoint('front', pointId) : () => {}}
          />
        </div>
        <div data-image-type="spine">
          <BodyImageCanvas
            imageType="spine"
            imageUrl=""
            points={formData.bodyImages.spine}
            readonly={readOnly}
            onAddPoint={readOnly ? () => {} : onAddBodyImagePoint ? (point) => onAddBodyImagePoint('spine', point) : () => {}}
            onUpdatePoint={readOnly ? () => {} : onUpdateBodyImagePoint ? (pointId, updates) => onUpdateBodyImagePoint('spine', pointId, updates) : () => {}}
            onDeletePoint={readOnly ? () => {} : onDeleteBodyImagePoint ? (pointId) => onDeleteBodyImagePoint('spine', pointId) : () => {}}
          />
        </div>
        <div data-image-type="back">
          <BodyImageCanvas
            imageType="back"
            imageUrl=""
            points={formData.bodyImages.back}
            readonly={readOnly}
            onAddPoint={readOnly ? () => {} : onAddBodyImagePoint ? (point) => onAddBodyImagePoint('back', point) : () => {}}
            onUpdatePoint={readOnly ? () => {} : onUpdateBodyImagePoint ? (pointId, updates) => onUpdateBodyImagePoint('back', pointId, updates) : () => {}}
            onDeletePoint={readOnly ? () => {} : onDeleteBodyImagePoint ? (pointId) => onDeleteBodyImagePoint('back', pointId) : () => {}}
          />
        </div>
      </ImageSection>

      {/* 통증 히스토리 및 운동목적 */}
      <FormRow>
        <FormGroup>
          <FormLabel>시술, 수술 등 통증 히스토리 및 코멘트/운동목적</FormLabel>
          <FormTextarea
            rows={6}
            placeholder="통증 히스토리, 수술 이력, 운동 목적 등을 상세히 기입해주세요"
            value={formData.painHistory}
            readOnly={readOnly}
            onChange={!readOnly && onInputChange ? (e) => onInputChange('painHistory', e.target.value) : undefined}
          />
        </FormGroup>
      </FormRow>

      {/* 동의서 */}
      <ConsentSection>
        <ConsentText>
          라비다 스포츠메디컬에서 제공하는 WBM 프로그램을 효과적으로 이용하기 위해 회원님 사전 건강 정보 작성에 동의하며, 
          본 상담지에 명시되지 않은 병력 및 기타 원인으로 발생되는 문제에 대해서는 당사는 일체의 책임이 없음을 알려 드립니다.
        </ConsentText>
        
        {/* 서명 영역과 날짜 정보를 하나의 행으로 배치 */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {/* 날짜 정보 카드 - 왼쪽 */}
          <div style={{ flex: '0 0 auto', minWidth: '300px' }}>
            {/* 서명 안내 텍스트 */}
            <div style={{ marginBottom: '10px', textAlign: 'center' }}>
              {hasExistingSignature() && (
                <SignatureNote style={{ margin: '0', fontSize: '12px', color: '#28a745' }}>
                  ✓ 서명이 완료되었습니다{readOnly ? '' : ' (수정 불가)'}
                </SignatureNote>
              )}
              {!hasExistingSignature() && !readOnly && (
                <SignatureNote style={{ margin: '0', fontSize: '12px' }}>
                  서명 후 저장하시면 수정할 수 없습니다
                </SignatureNote>
              )}
            </div>
            {/* 날짜 카드 */}
            <DateRow style={{ margin: '0' }}>
              <DateItem>
                <DateLabel>서명 날짜</DateLabel>
                <DateValue>
                  {prescription?.signedAt 
                    ? new Date(prescription.signedAt).toLocaleDateString('ko-KR')
                    : readOnly
                      ? '-'
                      : '서명 후 표시됩니다'
                  }
                </DateValue>
              </DateItem>
              <DateItem>
                <DateLabel>최근 업데이트</DateLabel>
                <DateValue>
                  {prescription?.updatedAt 
                    ? new Date(prescription.updatedAt).toLocaleDateString('ko-KR')
                    : readOnly
                      ? '-'
                      : '저장 후 표시됩니다'
                  }
                </DateValue>
              </DateItem>
            </DateRow>
          </div>

          {/* 서명 영역 - 오른쪽 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <SignatureCanvas
              key={selectedMember?.id || 'no-member'}
              width={250}
              height={100}
              onSignatureChange={readOnly ? () => {} : onSignatureChange || (() => {})}
              initialSignature={formData.signatureData}
              readonly={readOnly || hasExistingSignature()}
            />
          </div>
        </div>
      </ConsentSection>
    </PrescriptionContainer>
  );
};

export default ExercisePrescriptionForm;