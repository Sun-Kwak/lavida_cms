import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';
import { dbManager } from '../utils/indexedDB';
import { Member, ExercisePrescription, ExercisePrescriptionMedicalHistory, BodyImagePoint } from '../utils/db/types';
import BodyImageCanvas from '../components/BodyImageCanvas';
import SignatureCanvas from '../components/SignatureCanvas';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: ${AppColors.background};
  
  @media print {
    display: block;
    background: white;
  }
`;

const SearchPanel = styled.div<{ $hidden?: boolean }>`
  width: 300px;
  background: ${AppColors.surface};
  border-right: 1px solid ${AppColors.borderLight};
  padding: 20px;
  overflow-y: auto;
  display: ${props => props.$hidden ? 'none' : 'block'};
  
  @media print {
    display: none;
  }
`;

const ButtonPanel = styled.div<{ $hidden?: boolean }>`
  width: 80px;
  background: ${AppColors.surface};
  border-right: 1px solid ${AppColors.borderLight};
  padding: 20px 10px;
  display: ${props => props.$hidden ? 'none' : 'flex'};
  flex-direction: column;
  gap: 15px;
  align-items: center;
  
  @media print {
    display: none;
  }
`;

const ActionButton = styled.button<{ disabled?: boolean }>`
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 12px;
  background: ${props => props.disabled ? AppColors.buttonDisabled : AppColors.primary};
  color: ${props => props.disabled ? AppColors.disabled : AppColors.onPrimary};
  font-size: ${AppTextStyles.label2.fontSize};
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.disabled ? AppColors.buttonDisabled : AppColors.primary + 'dd'};
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
  }
  
  &:active {
    transform: ${props => props.disabled ? 'none' : 'translateY(0)'};
  }
`;

const ButtonIcon = styled.div`
  font-size: 20px;
  line-height: 1;
`;

const ButtonText = styled.div`
  font-size: 10px;
  line-height: 1;
`;

const SearchTitle = styled.h2`
  font-size: ${AppTextStyles.title2.fontSize};
  font-weight: 600;
  color: ${AppColors.onBackground};
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  font-size: ${AppTextStyles.body2.fontSize};
  margin-bottom: 16px;
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
`;

const MemberList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const MemberItem = styled.div<{ selected?: boolean }>`
  padding: 12px;
  border: 1px solid ${props => props.selected ? AppColors.primary : AppColors.borderLight};
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  background: ${props => props.selected ? AppColors.primary + '10' : AppColors.surface};
  
  &:hover {
    background: ${AppColors.primary}20;
  }
`;

const MemberName = styled.div`
  font-weight: 600;
  color: ${AppColors.onBackground};
  margin-bottom: 4px;
`;

const MemberInfo = styled.div`
  font-size: ${AppTextStyles.body3.fontSize};
  color: ${AppColors.onInput1};
`;

const PrescriptionPanel = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  
  @media print {
    padding: 0;
    overflow: visible;
  }
`;

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

const FormInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 6px;
  font-size: ${AppTextStyles.body2.fontSize};
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 6px;
  font-size: ${AppTextStyles.body2.fontSize};
  resize: vertical;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: ${AppTextStyles.body2.fontSize};
`;

const Checkbox = styled.input`
  margin: 0;
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

const ExercisePrescriptionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentPrescription, setCurrentPrescription] = useState<ExercisePrescription | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false); // 읽기 전용 모드 상태
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    footSize: '',
    medications: '',
    medicalHistory: {
      musculoskeletal: false,
      cardiovascular: false,
      diabetes: false,
      osteoporosis: false,
      thyroid: false,
      varicose: false,
      arthritis: false,
    } as ExercisePrescriptionMedicalHistory,
    painHistory: '',
    bodyImages: {
      front: [] as BodyImagePoint[],
      spine: [] as BodyImagePoint[],
      back: [] as BodyImagePoint[],
    },
    signatureData: '', // 서명 데이터
  });

  // 컴포넌트 마운트 시 회원 데이터 로드
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const allMembers = await dbManager.getAllMembers();
        // 활성 회원만 필터링
        const activeMembers = allMembers.filter(member => member.isActive);
        setMembers(activeMembers);
      } catch (error) {
        console.error('회원 데이터 로드 실패:', error);
      }
    };

    loadMembers();
  }, []);

  // 선택된 회원이 변경될 때 운동처방서 로드
  useEffect(() => {
    const loadPrescription = async () => {
      if (!selectedMember) {
        // 회원이 선택되지 않았으면 초기화
        setCurrentPrescription(null);
        setFormData({
          height: '',
          weight: '',
          footSize: '',
          medications: '',
          medicalHistory: {
            musculoskeletal: false,
            cardiovascular: false,
            diabetes: false,
            osteoporosis: false,
            thyroid: false,
            varicose: false,
            arthritis: false,
          },
          painHistory: '',
          bodyImages: {
            front: [],
            spine: [],
            back: [],
          },
          signatureData: '',
        });
        return;
      }

      try {
        // 해당 회원의 최신 운동처방서 조회
        const prescription = await dbManager.exercisePrescription.getExercisePrescriptionByMember(selectedMember.id);
        
        if (prescription) {
          // 최신 운동처방서가 있으면 로드
          setCurrentPrescription(prescription);
          setFormData({
            height: prescription.height,
            weight: prescription.weight,
            footSize: prescription.footSize,
            medications: prescription.medications,
            medicalHistory: prescription.medicalHistory,
            painHistory: prescription.painHistory,
            bodyImages: prescription.bodyImages,
            signatureData: prescription.signatureData || '',
          });
          console.log('최신 운동처방서 로드:', prescription);
        } else {
          // 기존 운동처방서가 없으면 빈 템플릿 사용
          setCurrentPrescription(null);
          setFormData({
            height: '',
            weight: '',
            footSize: '',
            medications: '',
            medicalHistory: {
              musculoskeletal: false,
              cardiovascular: false,
              diabetes: false,
              osteoporosis: false,
              thyroid: false,
              varicose: false,
              arthritis: false,
            },
            painHistory: '',
            bodyImages: {
              front: [],
              spine: [],
              back: [],
            },
            signatureData: '', // 서명 데이터 초기화
          });
          console.log('새 운동처방서 템플릿 생성 - 서명 데이터 초기화됨');
        }
      } catch (error) {
        console.error('운동처방서 로드 실패:', error);
        alert('운동처방서 로드에 실패했습니다.');
      }
    };

    loadPrescription();
  }, [selectedMember]);

  const filteredMembers = members.filter(member =>
    member.name.includes(searchTerm) || member.phone.includes(searchTerm)
  );

  // 특정 처방서 ID로 직접 로드하는 함수 (히스토리 상세보기용)
  const loadSpecificPrescription = useCallback(async (prescriptionId: string) => {
    try {
      const prescription = await dbManager.exercisePrescription.getExercisePrescriptionById(prescriptionId);
      if (prescription) {
        // 처방서에 해당하는 회원 정보도 찾기
        const member = members.find(m => m.id === prescription.memberId);
        if (member) {
          setSelectedMember(member);
        }
        
        setCurrentPrescription(prescription);
        setIsReadOnly(true); // 히스토리 보기는 읽기 전용
        setFormData({
          height: prescription.height,
          weight: prescription.weight,
          footSize: prescription.footSize,
          medications: prescription.medications,
          medicalHistory: prescription.medicalHistory,
          painHistory: prescription.painHistory,
          bodyImages: prescription.bodyImages,
          signatureData: prescription.signatureData || '',
        });
        console.log('특정 운동처방서 로드 (읽기 전용):', prescription);
      }
    } catch (error) {
      console.error('특정 운동처방서 로드 실패:', error);
    }
  }, [members]);

  useEffect(() => {
    // URL 파라미터에서 userid, memberId, prescriptionId 확인
    const userIdParam = searchParams.get('userid') || searchParams.get('memberId');
    const prescriptionIdParam = searchParams.get('prescriptionId');
    
    if (prescriptionIdParam) {
      // prescriptionId가 있으면 해당 처방서를 직접 로드 (히스토리 상세보기용)
      loadSpecificPrescription(prescriptionIdParam);
    } else if (userIdParam && members.length > 0) {
      // memberId만 있으면 해당 회원의 최신 처방서 로드
      const member = members.find(m => m.id === userIdParam);
      if (member) {
        setSelectedMember(member);
      }
    }
  }, [searchParams, members, loadSpecificPrescription]);

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [field]: checked,
      },
    }));
  };

  // 서명 변경 핸들러
  const handleSignatureChange = (dataUrl: string) => {
    setFormData(prev => ({
      ...prev,
      signatureData: dataUrl,
    }));
  };

  // 서명이 있는지 확인하는 함수
  const hasSignature = () => {
    return formData.signatureData && formData.signatureData.trim() !== '';
  };

  // 기존 서명이 있는지 확인하는 함수 (DB에 저장된 서명)
  const hasExistingSignature = (): boolean => {
    return !!(currentPrescription?.signedAt && currentPrescription?.signatureData && currentPrescription.signatureData.trim() !== '');
  };

  // 신체 이미지 포인트 관리 함수들
  const handleAddBodyImagePoint = (imageType: 'front' | 'spine' | 'back', point: Omit<BodyImagePoint, 'id'>) => {
    const newPoint: BodyImagePoint = {
      ...point,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 임시 ID 생성
    };

    setFormData(prev => ({
      ...prev,
      bodyImages: {
        ...prev.bodyImages,
        [imageType]: [...prev.bodyImages[imageType], newPoint],
      },
    }));
  };

  const handleUpdateBodyImagePoint = (imageType: 'front' | 'spine' | 'back', pointId: string, updates: Partial<Omit<BodyImagePoint, 'id'>>) => {
    setFormData(prev => ({
      ...prev,
      bodyImages: {
        ...prev.bodyImages,
        [imageType]: prev.bodyImages[imageType].map(point =>
          point.id === pointId ? { ...point, ...updates } : point
        ),
      },
    }));
  };

  const handleDeleteBodyImagePoint = (imageType: 'front' | 'spine' | 'back', pointId: string) => {
    setFormData(prev => ({
      ...prev,
      bodyImages: {
        ...prev.bodyImages,
        [imageType]: prev.bodyImages[imageType].filter(point => point.id !== pointId),
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedMember) {
      alert('회원을 선택해주세요.');
      return;
    }

    // 서명 검증: 새 처방서는 서명 필수, 기존 처방서는 기존 서명이 있으면 OK
    if (!currentPrescription && !hasSignature()) {
      alert('서명이 필요합니다. 서명을 완료해주세요.');
      return;
    }
    
    if (currentPrescription && !hasExistingSignature() && !hasSignature()) {
      alert('서명이 필요합니다. 서명을 완료해주세요.');
      return;
    }
    
    try {
      // 서명 데이터 결정: 기존 서명이 있으면 그것을 유지, 없으면 현재 서명 사용
      const finalSignatureData = hasExistingSignature() 
        ? currentPrescription!.signatureData 
        : formData.signatureData;
      
      const prescriptionData = {
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        height: formData.height,
        weight: formData.weight,
        footSize: formData.footSize,
        medications: formData.medications,
        medicalHistory: formData.medicalHistory,
        painHistory: formData.painHistory,
        bodyImages: formData.bodyImages,
        signatureData: finalSignatureData,
        signedAt: currentPrescription?.signedAt || new Date(), // 기존에 서명 날짜가 있으면 유지, 없으면 현재 시각
        isActive: true,
        prescriptionDate: new Date(),
        version: 1, // 기본값 (서비스에서 자동 계산됨)
        isLatest: true, // 기본값 (서비스에서 자동 설정됨)
      };

      if (currentPrescription) {
        // 기존 운동처방서가 있으면 새 버전으로 저장 (업데이트가 아닌 신규 버전 생성)
        const prescriptionId = await dbManager.exercisePrescription.saveExercisePrescription(prescriptionData);
        console.log('새 버전 운동처방서 생성 완료:', prescriptionId);
        
        // 생성된 최신 처방서 정보 로드
        const savedPrescription = await dbManager.exercisePrescription.getExercisePrescriptionById(prescriptionId);
        setCurrentPrescription(savedPrescription);
      } else {
        // 새 운동처방서 생성
        const prescriptionId = await dbManager.exercisePrescription.saveExercisePrescription(prescriptionData);
        console.log('새 운동처방서 생성 완료:', prescriptionId);
        
        // 생성된 처방서 정보 업데이트
        const savedPrescription = await dbManager.exercisePrescription.getExercisePrescriptionById(prescriptionId);
        setCurrentPrescription(savedPrescription);
      }
      
      alert('운동처방서가 저장되었습니다.');
    } catch (error) {
      console.error('운동처방서 저장 실패:', error);
      alert(error instanceof Error ? error.message : '운동처방서 저장에 실패했습니다.');
    }
  };

  const generatePrescriptionHTML = () => {
    if (!selectedMember) return '';

    // 신체 이미지 SVG 생성 함수
    const generateBodyImageSVG = (imageType: 'front' | 'spine' | 'back', title: string) => {
      const points = formData.bodyImages[imageType];
      
      if (points.length === 0) {
        return `
          <div class="image-box">
            <div class="image-header"><strong>${title}</strong></div>
            <div class="image-content">
              <div class="no-points">등록된 포인트 없음</div>
            </div>
          </div>
        `;
      }

      // SVG로 포인트들 생성
      const svgPoints = points.map(point => {
        const x = (point.x / 100) * 200; // 200px 기준
        const y = (point.y / 100) * 200; // 200px 기준
        
        return `
          <circle cx="${x}" cy="${y}" r="3" fill="${point.color || '#ff0000'}" stroke="#000" stroke-width="1"/>
          ${point.memo ? `<text x="${x}" y="${y - 8}" font-family="Arial" font-size="8" text-anchor="middle" fill="#000">${point.memo}</text>` : ''}
        `;
      }).join('');

      const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#f8f9fa" stroke="#ddd" stroke-width="1"/>
          ${svgPoints}
        </svg>
      `)}`;

      return `
        <div class="image-box">
          <div class="image-header"><strong>${title}</strong></div>
          <img src="${svgDataUrl}" style="width: 100%; height: 200px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px;" />
        </div>
      `;
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>운동처방서 - ${selectedMember.name}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none !important; }
            /* PDF 출력 최적화 */
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .point-marker {
              background: var(--point-color) !important;
              border: 1px solid #000 !important;
              width: 4px !important;
              height: 4px !important;
            }
            .point-memo {
              background: #000 !important;
              color: #fff !important;
              font-size: 6px !important;
            }
          }
          body { font-family: Arial, sans-serif; margin: 20px; }
          .prescription-container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 30px; }
          .form-row { display: flex; gap: 15px; margin-bottom: 20px; }
          .form-group { flex: 1; }
          .form-label { display: block; font-weight: 600; margin-bottom: 8px; }
          .form-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
          .checkbox-group { display: flex; flex-wrap: nowrap; gap: 8px; overflow: hidden; }
          .checkbox-item { display: flex; align-items: center; gap: 3px; white-space: nowrap; flex-shrink: 0; font-size: 12px; }
          .image-section { display: flex; gap: 10px; margin-bottom: 20px; }
          .image-box { 
            flex: 1; 
            border: 2px solid #ddd; 
            border-radius: 8px; 
            padding: 10px;
            background: white;
          }
          .image-header {
            text-align: center;
            font-weight: bold;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
          }
          .image-content {
            position: relative;
            height: 200px;
            border: 1px solid #ddd;
            background: #f8f9fa;
            margin: 5px 0;
            border-radius: 4px;
          }
          .no-points {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #999;
            font-size: 12px;
          }
          .point-marker {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }
          .point-memo {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }
          .consent-section { margin-top: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; }
          .signature-box { width: 200px; height: 80px; border: 1px solid #ddd; border-radius: 6px; background: white; }
          .date-area { text-align: right; }
          textarea { resize: vertical; height: 100px; }
          .print-button { margin: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin: 20px; padding: 15px; background: #f0f8ff; border: 1px solid #007bff; border-radius: 5px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <button class="print-button" onclick="window.print()" style="margin: 0;">인쇄하기</button>
            <div style="font-size: 12px; color: #666;">
              <strong>PDF 출력 시 색상이 안 보이는 경우:</strong><br>
              인쇄 옵션에서 "기타 설정" → "배경 그래픽" 체크 또는<br>
              Chrome: "더보기" → "배경 그래픽" 활성화
            </div>
          </div>
        </div>
        <div class="prescription-container">
          <h1 class="title">운동처방서</h1>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">성명</label>
              <input class="form-input" value="${selectedMember.name}" readonly>
            </div>
            <div class="form-group">
              <label class="form-label">생년월일</label>
              <input class="form-input" value="${selectedMember.birth}" readonly>
            </div>
            <div class="form-group">
              <label class="form-label">키</label>
              <input class="form-input" value="${formData.height}" readonly>
            </div>
            <div class="form-group">
              <label class="form-label">체중</label>
              <input class="form-input" value="${formData.weight}" readonly>
            </div>
            <div class="form-group">
              <label class="form-label">발사이즈</label>
              <input class="form-input" value="${formData.footSize}" readonly>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="display: flex; align-items: center; gap: 15px;">
              <label class="form-label" style="margin-bottom: 0; min-width: 120px; flex-shrink: 0;">복용중인 약</label>
              <input class="form-input" value="${formData.medications}" readonly style="flex: 1;">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="display: flex; align-items: center; gap: 15px;">
              <label class="form-label" style="margin-bottom: 0; min-width: 120px; flex-shrink: 0;">병력사항</label>
              <div style="flex: 1; display: flex; flex-wrap: nowrap; gap: 8px; overflow: hidden;">
                ${Object.entries(formData.medicalHistory).map(([key, value]) => {
                  const labels: { [key: string]: string } = {
                    musculoskeletal: '근골격계질환',
                    cardiovascular: '심혈관계질환',
                    diabetes: '당뇨',
                    osteoporosis: '골다공증',
                    thyroid: '갑상선',
                    varicose: '정맥류',
                    arthritis: '관절염'
                  };
                  return `<label style="display: flex; align-items: center; gap: 3px; white-space: nowrap; flex-shrink: 0; font-size: 12px;"><input type="checkbox" ${value ? 'checked' : ''} disabled style="margin: 0;"> ${labels[key]}</label>`;
                }).join('')}
              </div>
            </div>
          </div>

          <div class="image-section">
            ${generateBodyImageSVG('front', '정면')}
            ${generateBodyImageSVG('spine', '척추')}
            ${generateBodyImageSVG('back', '후면')}
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">시술, 수술 등 통증 히스토리 및 코멘트/운동목적</label>
              <textarea class="form-input" readonly>${formData.painHistory}</textarea>
            </div>
          </div>

          <div class="consent-section">
            <p>라비다 스포츠메디컬에서 제공하는 WBM 프로그램을 효과적으로 이용하기 위해 회원님 사전 건강 정보 작성에 동의하며, 
            본 상담지에 명시되지 않은 병력 및 기타 원인으로 발생되는 문제에 대해서는 당사는 일체의 책임이 없음을 알려 드립니다.</p>
            
            <div style="display: flex; gap: 20px; align-items: flex-start;">
              <div style="flex: 0 0 auto; min-width: 300px;">
                <div style="margin-bottom: 10px; text-align: center;">
                  <div style="font-size: 12px; color: ${hasExistingSignature() ? '#28a745' : '#666'};">
                    ${hasExistingSignature() ? '✓ 서명이 완료되었습니다 (수정 불가)' : '서명 후 저장하시면 수정할 수 없습니다'}
                  </div>
                </div>
                <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #ddd;">
                  <div style="display: flex; justify-content: space-between;">
                    <div style="text-align: center;">
                      <div style="font-size: 12px; color: #666; font-weight: 600; margin-bottom: 5px;">서명 날짜</div>
                      <div style="font-size: 14px; color: #000;">
                        ${currentPrescription?.signedAt 
                          ? new Date(currentPrescription.signedAt).toLocaleDateString('ko-KR')
                          : hasSignature() 
                            ? new Date().toLocaleDateString('ko-KR') 
                            : '서명 후 표시됩니다'
                        }
                      </div>
                    </div>
                    <div style="text-align: center;">
                      <div style="font-size: 12px; color: #666; font-weight: 600; margin-bottom: 5px;">최근 업데이트</div>
                      <div style="font-size: 14px; color: #000;">
                        ${currentPrescription?.updatedAt 
                          ? new Date(currentPrescription.updatedAt).toLocaleDateString('ko-KR')
                          : new Date().toLocaleDateString('ko-KR')
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                ${formData.signatureData ? `<img src="${formData.signatureData}" style="max-width: 250px; max-height: 100px; border: 1px solid #ddd; border-radius: 6px;">` : '<div style="width: 250px; height: 100px; border: 1px solid #ddd; border-radius: 6px; background: white; display: flex; align-items: center; justify-content: center; color: #999;">서명 없음</div>'}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleShare = () => {
    if (!selectedMember) {
      alert('회원을 선택해주세요.');
      return;
    }

    // 운동처방서만 표시하는 새 창 생성
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(generatePrescriptionHTML());
      printWindow.document.close();
      
      // 네이티브 공유 API 사용 또는 링크 복사
      if (navigator.share) {
        navigator.share({
          title: '운동처방서',
          text: `${selectedMember.name}님의 운동처방서`,
          url: printWindow.location.href,
        });
      } else {
        alert('새 창에서 운동처방서를 확인하고 URL을 복사하여 공유하세요.');
      }
    }
  };

  const handlePrint = () => {
    if (!selectedMember) {
      alert('회원을 선택해주세요.');
      return;
    }

    // 운동처방서만 출력하기 위한 새 창 생성
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(generatePrescriptionHTML());
      printWindow.document.close();
      
      // 자동으로 인쇄 대화상자 열기
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  return (
    <PageContainer>
      <SearchPanel>
        <SearchTitle>회원 검색</SearchTitle>
        <SearchInput
          type="text"
          placeholder="이름 또는 전화번호로 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <MemberList>
          {filteredMembers.map(member => (
            <MemberItem
              key={member.id}
              selected={selectedMember?.id === member.id}
              onClick={() => handleMemberSelect(member)}
            >
              <MemberName>{member.name}</MemberName>
              <MemberInfo>{member.birth}</MemberInfo>
              <MemberInfo>{member.phone}</MemberInfo>
            </MemberItem>
          ))}
        </MemberList>
      </SearchPanel>

      <ButtonPanel>
        <ActionButton 
          onClick={handleSave} 
          title="저장"
          disabled={isReadOnly || (!hasSignature() && !hasExistingSignature())} // 읽기 전용이거나 서명이 없으면 비활성화
        >
          <ButtonIcon>💾</ButtonIcon>
          <ButtonText>저장</ButtonText>
        </ActionButton>
        
        <ActionButton onClick={handleShare} title="공유">
          <ButtonIcon>📤</ButtonIcon>
          <ButtonText>공유</ButtonText>
        </ActionButton>
        
        <ActionButton onClick={handlePrint} title="출력">
          <ButtonIcon>🖨️</ButtonIcon>
          <ButtonText>출력</ButtonText>
        </ActionButton>
      </ButtonPanel>

      <PrescriptionPanel>
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
                onChange={(e) => handleInputChange('height', e.target.value)}
                readOnly={isReadOnly}
                style={{ background: isReadOnly ? '#f5f5f5' : 'white' }}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>체중</FormLabel>
              <FormInput
                type="text"
                placeholder="체중(kg)"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                readOnly={isReadOnly}
                style={{ background: isReadOnly ? '#f5f5f5' : 'white' }}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>발사이즈</FormLabel>
              <FormInput
                type="text"
                placeholder="발사이즈"
                value={formData.footSize}
                onChange={(e) => handleInputChange('footSize', e.target.value)}
                readOnly={isReadOnly}
                style={{ background: isReadOnly ? '#f5f5f5' : 'white' }}
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
                onChange={(e) => handleInputChange('medications', e.target.value)}
                style={{ flex: 1, background: isReadOnly ? '#f5f5f5' : 'white' }}
                readOnly={isReadOnly}
              />
            </FormGroup>
          </FormRow>

          {/* 병력사항 - 라벨과 체크박스를 같은 행에 배치 */}
          <FormRow>
            <FormGroup style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <FormLabel style={{ marginBottom: '0', minWidth: '120px', flexShrink: 0 }}>병력사항</FormLabel>
              <CheckboxGroup style={{ flex: 1 }}>
                <CheckboxItem>
                  <Checkbox
                    type="checkbox"
                    checked={formData.medicalHistory.musculoskeletal}
                    onChange={(e) => handleCheckboxChange('musculoskeletal', e.target.checked)}
                    disabled={isReadOnly}
                  />
                  근골격계질환
                </CheckboxItem>
                <CheckboxItem>
                  <Checkbox
                    type="checkbox"
                    checked={formData.medicalHistory.cardiovascular}
                    onChange={(e) => handleCheckboxChange('cardiovascular', e.target.checked)}
                    disabled={isReadOnly}
                  />
                  심혈관계질환
                </CheckboxItem>
                <CheckboxItem>
                  <Checkbox
                    type="checkbox"
                    checked={formData.medicalHistory.diabetes}
                    onChange={(e) => handleCheckboxChange('diabetes', e.target.checked)}
                    disabled={isReadOnly}
                  />
                  당뇨
                </CheckboxItem>
                <CheckboxItem>
                  <Checkbox
                    type="checkbox"
                    checked={formData.medicalHistory.osteoporosis}
                    onChange={(e) => handleCheckboxChange('osteoporosis', e.target.checked)}
                    disabled={isReadOnly}
                  />
                  골다공증
                </CheckboxItem>
                <CheckboxItem>
                  <Checkbox
                    type="checkbox"
                    checked={formData.medicalHistory.thyroid}
                    onChange={(e) => handleCheckboxChange('thyroid', e.target.checked)}
                    disabled={isReadOnly}
                  />
                  갑상선
                </CheckboxItem>
                <CheckboxItem>
                  <Checkbox
                    type="checkbox"
                    checked={formData.medicalHistory.varicose}
                    onChange={(e) => handleCheckboxChange('varicose', e.target.checked)}
                    disabled={isReadOnly}
                  />
                  정맥류
                </CheckboxItem>
                <CheckboxItem>
                  <Checkbox
                    type="checkbox"
                    checked={formData.medicalHistory.arthritis}
                    onChange={(e) => handleCheckboxChange('arthritis', e.target.checked)}
                    disabled={isReadOnly}
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
                onAddPoint={(point) => handleAddBodyImagePoint('front', point)}
                onUpdatePoint={(pointId, updates) => handleUpdateBodyImagePoint('front', pointId, updates)}
                onDeletePoint={(pointId) => handleDeleteBodyImagePoint('front', pointId)}
              />
            </div>
            <div data-image-type="spine">
              <BodyImageCanvas
                imageType="spine"
                imageUrl=""
                points={formData.bodyImages.spine}
                onAddPoint={(point) => handleAddBodyImagePoint('spine', point)}
                onUpdatePoint={(pointId, updates) => handleUpdateBodyImagePoint('spine', pointId, updates)}
                onDeletePoint={(pointId) => handleDeleteBodyImagePoint('spine', pointId)}
              />
            </div>
            <div data-image-type="back">
              <BodyImageCanvas
                imageType="back"
                imageUrl=""
                points={formData.bodyImages.back}
                onAddPoint={(point) => handleAddBodyImagePoint('back', point)}
                onUpdatePoint={(pointId, updates) => handleUpdateBodyImagePoint('back', pointId, updates)}
                onDeletePoint={(pointId) => handleDeleteBodyImagePoint('back', pointId)}
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
                onChange={(e) => handleInputChange('painHistory', e.target.value)}
                readOnly={isReadOnly}
                style={{ background: isReadOnly ? '#f5f5f5' : 'white' }}
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
                      ✓ 서명이 완료되었습니다 (수정 불가)
                    </SignatureNote>
                  )}
                  {!hasExistingSignature() && (
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
                      {currentPrescription?.signedAt 
                        ? new Date(currentPrescription.signedAt).toLocaleDateString('ko-KR')
                        : hasSignature() 
                          ? new Date().toLocaleDateString('ko-KR') 
                          : '서명 후 표시됩니다'
                      }
                    </DateValue>
                  </DateItem>
                  <DateItem>
                    <DateLabel>최근 업데이트</DateLabel>
                    <DateValue>
                      {currentPrescription?.updatedAt 
                        ? new Date(currentPrescription.updatedAt).toLocaleDateString('ko-KR')
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
                  onSignatureChange={handleSignatureChange}
                  initialSignature={formData.signatureData}
                  readonly={hasExistingSignature()}
                />
              </div>
            </div>
          </ConsentSection>
        </PrescriptionContainer>
      </PrescriptionPanel>
    </PageContainer>
  );
};

export default ExercisePrescriptionPage;