import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AppColors } from '../styles/colors';
import { AppTextStyles } from '../styles/textStyles';
import { dbManager } from '../utils/indexedDB';
import { Member, ExercisePrescription, ExercisePrescriptionMedicalHistory } from '../utils/db/types';
import { 
  frontMuscles, 
  backMuscles, 
  MusclePoint,
  isPointInPolygon,
  setMusclePoint,
  findMuscleAtPosition 
} from '../constants/muscleCoordinates';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: ${AppColors.background};
  
  @media print {
    display: block;
    background: white;
  }
`;

const SearchPanel = styled.div<{ $collapsed?: boolean }>`
  width: ${props => props.$collapsed ? '0px' : '300px'};
  background: ${AppColors.surface};
  border-right: 1px solid ${AppColors.borderLight};
  padding: ${props => props.$collapsed ? '0' : '20px'};
  overflow: ${props => props.$collapsed ? 'hidden' : 'auto'};
  transition: all 0.3s ease;
  
  @media print {
    display: none;
  }
`;

const ButtonPanel = styled.div<{ $hidden?: boolean }>`
  width: 55px;
  background: ${AppColors.surface};
  border-right: 1px solid ${AppColors.borderLight};
  padding: 10px 2px;
  display: ${props => props.$hidden ? 'none' : 'flex'};
  flex-direction: column;
  gap: 6px;
  align-items: stretch;
  
  @media print {
    display: none;
  }
`;

const ActionButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: ${props => props.disabled ? AppColors.buttonDisabled : AppColors.primary};
  color: ${props => props.disabled ? AppColors.disabled : AppColors.onPrimary};
  font-size: 16px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.disabled ? AppColors.buttonDisabled : AppColors.primary + 'dd'};
  }
`;

const PageButton = styled.button<{ active?: boolean }>`
  width: 100%;
  height: 32px;
  border: 1px solid ${props => props.active ? AppColors.primary : AppColors.borderLight};
  border-radius: 4px;
  background: ${props => props.active ? AppColors.primary : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  font-size: 14px;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? AppColors.primary : '#f8f9fa'};
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${AppColors.borderLight};
  margin: 10px 0;
`;

const ToggleButton = styled.button<{ $collapsed?: boolean }>`
  width: 100%;
  height: 32px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 4px;
  background: ${props => props.$collapsed ? AppColors.primary : AppColors.surface};
  color: ${props => props.$collapsed ? AppColors.onPrimary : AppColors.onBackground};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${AppColors.primary};
    color: ${AppColors.onPrimary};
  }
  
  @media print {
    display: none;
  }
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
  box-sizing: border-box;
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
  width: 210mm;
  height: 297mm;
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  overflow: hidden;
  
  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
  
  @media print {
    box-shadow: none;
    padding: 20mm;
    margin: 0;
    max-width: none;
    width: 210mm;
    height: 297mm;
    overflow: visible;
  }
  
  @media screen and (max-width: 900px) {
    width: 100%;
    height: auto;
    min-height: calc(100vh - 40px);
  }
`;





const CoordinateEditor = styled.div<{ $open?: boolean }>`
  position: fixed;
  left: ${props => props.$open ? '320px' : '-400px'};
  top: 20px;
  width: 350px;
  height: calc(100vh - 40px);
  background: white;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  padding: 20px;
  overflow-y: auto;
  transition: left 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
`;



const InputGroup = styled.div`
  margin-bottom: 15px;
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: bold;
  color: ${AppColors.onSurface};
`;

const CoordinateInput = styled.input`
  width: 60px;
  padding: 4px 6px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 3px;
  font-size: 12px;
  margin-right: 5px;
`;



const ExercisePrescriptionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentPrescription, setCurrentPrescription] = useState<ExercisePrescription | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false); // 읽기 전용 모드 상태
  const [currentPage, setCurrentPage] = useState<number>(1); // 현재 페이지 상태 추가 (1페이지로 시작)
  const [isSearchPanelCollapsed, setIsSearchPanelCollapsed] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<Set<string>>(new Set()); // 선택된 포인트들
  const [isCoordinateEditorOpen, setIsCoordinateEditorOpen] = useState(false); // 좌표 편집기 열림 상태 // 검색 패널 접기 상태
  const [currentCoords, setCurrentCoords] = useState<{ x: number; y: number } | null>(null);
  const [showCoords, setShowCoords] = useState(false);
  const prescriptionRef = useRef<HTMLDivElement>(null); // PDF 생성을 위한 ref
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
    painHistory: ''
  });

  // 입력값 변경 핸들러
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 체크박스 변경 핸들러
  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [field]: checked
      }
    }));
  };

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

  // 페이지 2, 3용 마우스 이벤트 핸들러 (컨테이너 기준 퍼센트)
  const handleMouseMove = (event: React.MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // 컨테이너 기준으로 퍼센트 좌표 계산
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setCurrentCoords({
      x: Math.round(x * 10) / 10, // 소수점 1자리까지
      y: Math.round(y * 10) / 10  // 소수점 1자리까지
    });
    setShowCoords(true);
  };

  const handleMouseLeave = () => {
    setShowCoords(false);
    setCurrentCoords(null);
  };

  // 포인트 클릭 핸들러
  const handlePointClick = (pointId: string) => {
    setSelectedPoints(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(pointId)) {
        newSelected.delete(pointId);
      } else {
        newSelected.add(pointId);
      }
      return newSelected;
    });
  };

  // 페이지별 근육 포인트 관리
  const [pagePoints, setPagePoints] = useState<{
    [pageNum: number]: {
      [pointId: string]: MusclePoint
    }
  }>({
    2: frontMuscles,   // 전면 근육들
    3: backMuscles     // 후면 근육들
  });

  // 새로운 포인트 추가용 임시 데이터
  const [newPoint, setNewPoint] = useState({
    name: '',
    pointX: 0,
    pointY: 0,
    linePoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }], // 최소 2점
    areaPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], // 최소 3점
    textBoxX: 0,
    textBoxY: 0,
    textBoxWidth: 10,
    textBoxHeight: 4
  });

  // SVG 클릭 이벤트 핸들러 (동적 포인트 기능)
  const handleSvgClick = (event: React.MouseEvent<SVGElement>) => {
    if (currentPage !== 2 && currentPage !== 3) return; // 근육 페이지에서만 작동
    
    const svgElement = event.currentTarget;
    const rect = svgElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    const currentMuscles = pagePoints[currentPage];
    if (!currentMuscles) return;
    
    // 클릭된 위치에 있는 근육 찾기
    const clickedMuscleId = findMuscleAtPosition({ x, y }, currentMuscles);
    
    if (clickedMuscleId) {
      const clickedMuscle = currentMuscles[clickedMuscleId];
      
      // 동적 근육인 경우에만 포인트 변경
      if (clickedMuscle.isDynamic) {
        const updatedMuscles = setMusclePoint(clickedMuscleId, { x, y }, currentMuscles);
        
        if (updatedMuscles) {
          setPagePoints({
            ...pagePoints,
            [currentPage]: updatedMuscles
          });
          
          // 해당 근육을 선택 상태로 설정
          setSelectedPoints(new Set([clickedMuscleId]));
        }
      } else {
        // 정적 근육인 경우 단순히 선택만 변경
        setSelectedPoints(new Set([clickedMuscleId]));
      }
    }
  };

  // 동적 근육 포인트 리셋 기능
  const resetDynamicMuscle = (muscleId: string) => {
    const currentMuscles = pagePoints[currentPage];
    if (!currentMuscles) return;
    
    const muscle = currentMuscles[muscleId];
    if (!muscle || !muscle.isDynamic) return;
    
    // 원본 데이터에서 기본값 가져오기
    const originalMuscles = currentPage === 2 ? frontMuscles : backMuscles;
    const originalMuscle = originalMuscles[muscleId];
    
    if (originalMuscle) {
      setPagePoints({
        ...pagePoints,
        [currentPage]: {
          ...currentMuscles,
          [muscleId]: {
            ...muscle,
            point: originalMuscle.point,
            linePoints: [...originalMuscle.linePoints],
            isSelected: false
          }
        }
      });
      
      // 선택 해제
      setSelectedPoints(prev => {
        const newSet = new Set(prev);
        newSet.delete(muscleId);
        return newSet;
      });
    }
  };

  const handleSave = async () => {
    if (!selectedMember) {
      alert('회원을 선택해주세요.');
      return;
    }

    try {
      const prescriptionData = {
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        height: formData.height,
        weight: formData.weight,
        footSize: formData.footSize,
        medications: formData.medications,
        medicalHistory: formData.medicalHistory,
        painHistory: formData.painHistory,
        bodyImages: { front: [], spine: [], back: [] },
        signatureData: '',
        signedAt: null,
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




  const handleShare = async () => {
    if (!selectedMember) {
      alert('회원을 선택해주세요.');
      return;
    }

    // 현재 페이지의 URL 생성
    const currentUrl = `${window.location.origin}${window.location.pathname}?userid=${selectedMember.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: '운동처방서',
          text: `${selectedMember.name}님의 운동처방서`,
          url: currentUrl,
        });
      } else {
        // 네이티브 공유가 지원되지 않으면 URL 복사
        await navigator.clipboard.writeText(currentUrl);
        alert('링크가 클립보드에 복사되었습니다.');
      }
    } catch (error) {
      console.log('공유 취소 또는 오류:', error);
      // 대체 방법: URL 복사
      try {
        await navigator.clipboard.writeText(currentUrl);
        alert('링크가 클립보드에 복사되었습니다.');
      } catch {
        alert(`공유 링크: ${currentUrl}`);
      }
    }
  };

  const handlePrint = async () => {
    if (!selectedMember) {
      alert('회원을 선택해주세요.');
      return;
    }

    try {
      // PDF 생성
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // 현재 페이지 저장
      const originalPage = currentPage;
      
      for (let page = 1; page <= 3; page++) {
        if (page > 1) {
          pdf.addPage();
        }

        // 페이지 변경
        setCurrentPage(page);
        
        // DOM 업데이트를 위해 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 현재 보이는 페이지 캡처
        if (!prescriptionRef.current) continue;
        
        const canvas = await html2canvas(prescriptionRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }

      // 원래 페이지로 복원
      setCurrentPage(originalPage);

      // PDF를 Blob으로 생성하여 새 창에서 열기
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // 새 창에서 PDF 열고 자동 인쇄
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        };
      }
    } catch (error) {
      console.error('인쇄용 PDF 생성 중 오류 발생:', error);
      alert('인쇄 중 오류가 발생했습니다.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedMember) {
      alert('회원을 선택해주세요.');
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // 각 페이지를 순차적으로 캐튲하여 PDF에 추가
      for (let page = 2; page <= 3; page++) {
        // 임시로 페이지 변경
        const originalPage = currentPage;
        setCurrentPage(page);
        
        // DOM 업데이트 대기
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!prescriptionRef.current) continue;
        
        // 현재 페이지 캐튳
        const canvas = await html2canvas(prescriptionRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 너비 (mm)
        const imgHeight = 297; // A4 높이 (mm)
        
        // 첫 번째 PDF 페이지가 아니면 새 페이지 추가
        if (page > 2) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // 원래 페이지로 복구
        setCurrentPage(originalPage);
      }
      
      // PDF 다운로드
      const fileName = `운동처방서_${selectedMember.name}_전체_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성에 실패했습니다.');
    }
  };

  return (
    <PageContainer>
      {/* 좌표 편집기 */}
      <CoordinateEditor $open={isCoordinateEditorOpen}>
        <h3>페이지 {currentPage} - 근육 포인트 추가</h3>
        
        <InputGroup>
          <InputLabel>근육 이름</InputLabel>
          <CoordinateInput 
            type="text" 
            placeholder="예: 삼각근" 
            value={newPoint.name}
            onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
            style={{ width: '100%' }}
          />
        </InputGroup>

        <InputGroup>
          <InputLabel>포인터 좌표 (노란색 원)</InputLabel>
          <CoordinateInput 
            type="number" 
            placeholder="X" 
            value={newPoint.pointX}
            onChange={(e) => setNewPoint({ ...newPoint, pointX: Number(e.target.value) })}
          />
          <CoordinateInput 
            type="number" 
            placeholder="Y" 
            value={newPoint.pointY}
            onChange={(e) => setNewPoint({ ...newPoint, pointY: Number(e.target.value) })}
          />
        </InputGroup>

        <InputGroup>
          <InputLabel>선 좌표들 (꺾은선 - 포인터에서 텍스트까지)</InputLabel>
          {newPoint.linePoints.map((point, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', marginRight: '5px' }}>점 {index + 1}:</span>
              <CoordinateInput 
                type="number" 
                placeholder="X" 
                value={point.x}
                onChange={(e) => {
                  const newLinePoints = [...newPoint.linePoints];
                  newLinePoints[index].x = Number(e.target.value);
                  setNewPoint({ ...newPoint, linePoints: newLinePoints });
                }}
              />
              <CoordinateInput 
                type="number" 
                placeholder="Y" 
                value={point.y}
                onChange={(e) => {
                  const newLinePoints = [...newPoint.linePoints];
                  newLinePoints[index].y = Number(e.target.value);
                  setNewPoint({ ...newPoint, linePoints: newLinePoints });
                }}
              />
              {index >= 2 && (
                <button 
                  onClick={() => {
                    const newLinePoints = newPoint.linePoints.filter((_, i) => i !== index);
                    setNewPoint({ ...newPoint, linePoints: newLinePoints });
                  }}
                  style={{ marginLeft: '5px', fontSize: '10px', padding: '2px 5px' }}
                >
                  삭제
                </button>
              )}
            </div>
          ))}
          <button 
            onClick={() => {
              setNewPoint({ 
                ...newPoint, 
                linePoints: [...newPoint.linePoints, { x: 0, y: 0 }] 
              });
            }}
            style={{ fontSize: '12px', padding: '4px 8px', marginTop: '5px' }}
          >
            선 점 추가
          </button>
        </InputGroup>

        <InputGroup>
          <InputLabel>면 좌표들 (클릭 범위 - 다각형)</InputLabel>
          {newPoint.areaPoints.map((point, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', marginRight: '5px' }}>점 {index + 1}:</span>
              <CoordinateInput 
                type="number" 
                placeholder="X" 
                value={point.x}
                onChange={(e) => {
                  const newAreaPoints = [...newPoint.areaPoints];
                  newAreaPoints[index].x = Number(e.target.value);
                  setNewPoint({ ...newPoint, areaPoints: newAreaPoints });
                }}
              />
              <CoordinateInput 
                type="number" 
                placeholder="Y" 
                value={point.y}
                onChange={(e) => {
                  const newAreaPoints = [...newPoint.areaPoints];
                  newAreaPoints[index].y = Number(e.target.value);
                  setNewPoint({ ...newPoint, areaPoints: newAreaPoints });
                }}
              />
              {index >= 3 && (
                <button 
                  onClick={() => {
                    const newAreaPoints = newPoint.areaPoints.filter((_, i) => i !== index);
                    setNewPoint({ ...newPoint, areaPoints: newAreaPoints });
                  }}
                  style={{ marginLeft: '5px', fontSize: '10px', padding: '2px 5px' }}
                >
                  삭제
                </button>
              )}
            </div>
          ))}
          <button 
            onClick={() => {
              setNewPoint({ 
                ...newPoint, 
                areaPoints: [...newPoint.areaPoints, { x: 0, y: 0 }] 
              });
            }}
            style={{ fontSize: '12px', padding: '4px 8px', marginTop: '5px' }}
          >
            면 점 추가
          </button>
        </InputGroup>

        <InputGroup>
          <InputLabel>텍스트 박스</InputLabel>
          <div>
            <span style={{ fontSize: '11px' }}>X: </span>
            <CoordinateInput 
              type="number" 
              value={newPoint.textBoxX}
              onChange={(e) => setNewPoint({ ...newPoint, textBoxX: Number(e.target.value) })}
            />
            <span style={{ fontSize: '11px' }}>Y: </span>
            <CoordinateInput 
              type="number" 
              value={newPoint.textBoxY}
              onChange={(e) => setNewPoint({ ...newPoint, textBoxY: Number(e.target.value) })}
            />
          </div>
          <div style={{ marginTop: '5px' }}>
            <span style={{ fontSize: '11px' }}>W: </span>
            <CoordinateInput 
              type="number" 
              value={newPoint.textBoxWidth}
              onChange={(e) => setNewPoint({ ...newPoint, textBoxWidth: Number(e.target.value) })}
            />
            <span style={{ fontSize: '11px' }}>H: </span>
            <CoordinateInput 
              type="number" 
              value={newPoint.textBoxHeight}
              onChange={(e) => setNewPoint({ ...newPoint, textBoxHeight: Number(e.target.value) })}
            />
          </div>
        </InputGroup>

        <button 
          onClick={() => {
            if (newPoint.name.trim()) {
              const newId = `muscle_${Date.now()}`;
              const newPagePoints = { ...pagePoints };
              
              newPagePoints[currentPage] = {
                ...newPagePoints[currentPage],
                [newId]: {
                  id: newId,
                  name: newPoint.name,
                  point: { x: newPoint.pointX, y: newPoint.pointY },
                  linePoints: newPoint.linePoints,
                  areaPoints: newPoint.areaPoints,
                  textBox: { 
                    x: newPoint.textBoxX, 
                    y: newPoint.textBoxY, 
                    width: newPoint.textBoxWidth, 
                    height: newPoint.textBoxHeight 
                  },
                  text: { 
                    x: newPoint.textBoxX + newPoint.textBoxWidth / 2, 
                    y: newPoint.textBoxY + newPoint.textBoxHeight / 2 
                  }
                }
              };
              
              setPagePoints(newPagePoints);
              
              // 입력 폼 초기화
              setNewPoint({
                name: '',
                pointX: 0,
                pointY: 0,
                linePoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
                areaPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
                textBoxX: 0,
                textBoxY: 0,
                textBoxWidth: 10,
                textBoxHeight: 4
              });
            } else {
              alert('근육 이름을 입력해주세요.');
            }
          }}
          style={{
            width: '100%',
            padding: '10px',
            background: AppColors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '15px'
          }}
        >
          근육 포인트 추가
        </button>

        <button 
          onClick={() => {
            console.log('현재 페이지 포인트 데이터:', JSON.stringify(pagePoints[currentPage], null, 2));
          }}
          style={{
            width: '100%',
            padding: '8px',
            background: AppColors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          콘솔에 현재 페이지 데이터 출력
        </button>
      </CoordinateEditor>

      <SearchPanel $collapsed={isSearchPanelCollapsed}>
        {!isSearchPanelCollapsed && (
          <>
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
          </>
        )}
      </SearchPanel>      <ButtonPanel>
        <ToggleButton 
          $collapsed={isSearchPanelCollapsed}
          onClick={() => setIsSearchPanelCollapsed(!isSearchPanelCollapsed)}
          title={isSearchPanelCollapsed ? '회원검색 펼치기' : '회원검색 접기'}
        >
          {isSearchPanelCollapsed ? '▶' : '◀'}
        </ToggleButton>
        
        <ActionButton 
          onClick={handleSave} 
          title="저장"
          disabled={isReadOnly}
        >
          💾
        </ActionButton>
        
        <ActionButton onClick={handleShare} title="공유">
          📤
        </ActionButton>
        
        <ActionButton onClick={handlePrint} title="인쇄">
          🖨️
        </ActionButton>
        
        <ActionButton onClick={handleDownloadPDF} title="PDF 다운로드">
          📁
        </ActionButton>
        
        <Divider />
        
        <PageButton 
          active={currentPage === 1}
          onClick={() => setCurrentPage(1)}
        >
          1
        </PageButton>
        
        <PageButton 
          active={currentPage === 2}
          onClick={() => setCurrentPage(2)}
        >
          2
        </PageButton>
        
        <PageButton 
          active={currentPage === 3}
          onClick={() => setCurrentPage(3)}
        >
          3
        </PageButton>
      </ButtonPanel>

      <PrescriptionPanel>
        <PrescriptionContainer ref={prescriptionRef}>
          {/* 페이지 1: SPINE Mapping Chart */}
          {currentPage === 1 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* 상단 이름만 */}
              <div style={{ 
                textAlign: 'left', 
                marginBottom: '40px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {selectedMember?.name || ''}
              </div>

              {/* 중앙 타이틀 */}
              <div style={{
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '30px',
                color: '#333'
              }}>SPINE Mapping Chart</div>
              
              {/* 척추 이미지 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                flex: 1,
                margin: '20px 0'
              }}>
                <img 
                  src={`${process.env.PUBLIC_URL}/cms/bone.svg`} 
                  alt="척추 이미지" 
                  style={{ 
                    maxHeight: '100%',
                    maxWidth: '300px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }} 
                />
              </div>

              {/* 주요 호소 증상 */}
              <div style={{
                marginTop: '30px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '10px'
                }}>주요 호소 증상 (Chief Complaint)</div>
                
                <textarea
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    fontSize: '12px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="주요 호소 증상을 입력하세요..."
                />
              </div>
            </div>
          )}
          
          {/* 페이지 2: Target Muscles (Front) */}
          {currentPage === 2 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* 상단 이름만 */}
              <div style={{ 
                textAlign: 'left', 
                marginBottom: '40px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {selectedMember?.name || ''}
              </div>

              {/* 중앙 타이틀 */}
              <div style={{
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '30px',
                color: '#333'
              }}>Target Muscles List</div>
              
              {/* 전면 근육 이미지 with 포인트 */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  flex: 1,
                  position: 'relative'
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img 
                  src={`${process.env.PUBLIC_URL}/cms/front.png`} 
                  alt="인체 전면 근육도" 
                  style={{ 
                    maxHeight: '100%', 
                    maxWidth: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }} 
                />
                
                {/* 동적으로 생성된 근육 포인트들 */}
                <svg 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'auto',
                    cursor: currentPage === 2 || currentPage === 3 ? 'crosshair' : 'default'
                  }}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onClick={handleSvgClick}
                >
                  {/* 현재 마우스 좌표 표시 */}
                  {showCoords && currentCoords && currentPage === 2 && (
                    <g>
                      <rect 
                        x={currentCoords.x - 8} 
                        y={currentCoords.y - 4} 
                        width="16" 
                        height="3" 
                        fill="rgba(0, 0, 0, 0.8)" 
                        rx="0.5"
                      />
                      <text 
                        x={currentCoords.x} 
                        y={currentCoords.y - 1} 
                        textAnchor="middle" 
                        fontSize="1.2" 
                        fill="white" 
                        fontWeight="bold"
                      >
                        x: {currentCoords.x.toFixed(1)}%, y: {currentCoords.y.toFixed(1)}%
                      </text>
                    </g>
                  )}
                  
                  {/* 동적으로 생성된 근육 포인트들 */}
                  {pagePoints[currentPage] && Object.values(pagePoints[currentPage]).map((muscle) => (
                    <g key={muscle.id} onClick={() => handlePointClick(muscle.id)} style={{ cursor: 'pointer' }}>
                      {/* 클릭 범위 (면) - 반투명 다각형 */}
                      <polygon 
                        points={muscle.areaPoints.map(p => `${p.x},${p.y}`).join(' ')}
                        fill={selectedPoints.has(muscle.id) ? "rgba(255, 165, 0, 0.3)" : "rgba(255, 255, 0, 0.2)"}
                        stroke={selectedPoints.has(muscle.id) ? "orange" : "#0066ff"}
                        strokeWidth={selectedPoints.has(muscle.id) ? "0.1" : "0.3"}
                        strokeDasharray={muscle.isDynamic ? "1,1" : "none"}
                        style={{ cursor: muscle.isDynamic ? 'crosshair' : 'pointer' }}
                      />
                      
                      {/* 포인터 */}
                      <circle 
                        cx={muscle.point.x} 
                        cy={muscle.point.y} 
                        r={selectedPoints.has(muscle.id) ? "0.8" : "0.6"} 
                        fill={
                          selectedPoints.has(muscle.id) 
                            ? "orange" 
                            : muscle.isDynamic 
                              ? "#00aaff" 
                              : "yellow"
                        }
                        stroke={
                          selectedPoints.has(muscle.id) 
                            ? "red" 
                            : muscle.isDynamic 
                              ? "#0088ff" 
                              : "none"
                        }
                        strokeWidth={selectedPoints.has(muscle.id) ? "0.1" : muscle.isDynamic ? "0.05" : "0"}
                      />
                      
                      {/* 선택시 노란색 테두리 선 */}
                      {selectedPoints.has(muscle.id) && (
                        <polyline 
                          points={muscle.linePoints.map(p => `${p.x},${p.y}`).join(' ')} 
                          stroke="yellow" 
                          strokeWidth="0.4" 
                          fill="none"
                        />
                      )}
                      
                      {/* 메인 꺾은선 */}
                      <polyline 
                        points={muscle.linePoints.map(p => `${p.x},${p.y}`).join(' ')} 
                        stroke="black" 
                        strokeWidth="0.15" 
                        fill="none"
                      />
                      
                      {/* 텍스트 배경 박스 */}
                      <rect 
                        x={muscle.textBox.x} 
                        y={muscle.textBox.y} 
                        width={muscle.textBox.width} 
                        height={muscle.textBox.height} 
                        fill={selectedPoints.has(muscle.id) ? "rgba(255,255,0,0.3)" : "transparent"}
                        stroke={selectedPoints.has(muscle.id) ? "orange" : "none"}
                        strokeWidth="0.05"
                      />
                      
                      {/* 텍스트 */}
                      <text 
                        x={muscle.text.x} 
                        y={muscle.text.y} 
                        fontSize="1.2" 
                        fill="black"
                        fontWeight={selectedPoints.has(muscle.id) ? "900" : "bold"}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {muscle.name}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          )}

          {/* 페이지 3: Target Muscles (Back) */}
          {currentPage === 3 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* 상단 이름만 */}
              <div style={{ 
                textAlign: 'left', 
                marginBottom: '40px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {selectedMember?.name || ''}
              </div>

              {/* 중앙 타이틀 */}
              <div style={{
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '30px',
                color: '#333'
              }}>Target Muscles List (Back)</div>
              
              {/* 후면 근육 이미지 with 포인트 */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  flex: 1,
                  position: 'relative'
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img 
                  src={`${process.env.PUBLIC_URL}/cms/back.png`} 
                  alt="인체 후면 근육도" 
                  style={{ 
                    maxHeight: '100%', 
                    maxWidth: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }} 
                />
                
                {/* 동적으로 생성된 근육 포인트들 */}
                <svg 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'auto',
                    cursor: currentPage === 2 || currentPage === 3 ? 'crosshair' : 'default'
                  }}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onClick={handleSvgClick}
                >
                  {/* 현재 마우스 좌표 표시 */}
                  {showCoords && currentCoords && currentPage === 3 && (
                    <g>
                      <rect 
                        x={currentCoords.x - 8} 
                        y={currentCoords.y - 4} 
                        width="16" 
                        height="3" 
                        fill="rgba(0, 0, 0, 0.8)" 
                        rx="0.5"
                      />
                      <text 
                        x={currentCoords.x} 
                        y={currentCoords.y - 1} 
                        textAnchor="middle" 
                        fontSize="1.2" 
                        fill="white" 
                        fontWeight="bold"
                      >
                        x: {currentCoords.x.toFixed(1)}%, y: {currentCoords.y.toFixed(1)}%
                      </text>
                    </g>
                  )}
                  
                  {/* 동적으로 생성된 근육 포인트들 */}
                  {pagePoints[currentPage] && Object.values(pagePoints[currentPage]).map((muscle) => (
                    <g key={muscle.id} onClick={() => handlePointClick(muscle.id)} style={{ cursor: 'pointer' }}>
                      {/* 클릭 범위 (면) - 반투명 다각형 */}
                      <polygon 
                        points={muscle.areaPoints.map(p => `${p.x},${p.y}`).join(' ')}
                        fill={selectedPoints.has(muscle.id) ? "rgba(255, 165, 0, 0.3)" : "rgba(255, 255, 0, 0.2)"}
                        stroke={selectedPoints.has(muscle.id) ? "orange" : "#0066ff"}
                        strokeWidth={selectedPoints.has(muscle.id) ? "0.1" : "0.3"}
                        strokeDasharray={muscle.isDynamic ? "1,1" : "none"}
                        style={{ cursor: muscle.isDynamic ? 'crosshair' : 'pointer' }}
                      />
                      
                      {/* 포인터 */}
                      <circle 
                        cx={muscle.point.x} 
                        cy={muscle.point.y} 
                        r={selectedPoints.has(muscle.id) ? "0.8" : "0.6"} 
                        fill={
                          selectedPoints.has(muscle.id) 
                            ? "orange" 
                            : muscle.isDynamic 
                              ? "#00aaff" 
                              : "yellow"
                        }
                        stroke={
                          selectedPoints.has(muscle.id) 
                            ? "red" 
                            : muscle.isDynamic 
                              ? "#0088ff" 
                              : "none"
                        }
                        strokeWidth={selectedPoints.has(muscle.id) ? "0.1" : muscle.isDynamic ? "0.05" : "0"}
                      />
                      
                      {/* 선택시 노란색 테두리 선 */}
                      {selectedPoints.has(muscle.id) && (
                        <polyline 
                          points={muscle.linePoints.map(p => `${p.x},${p.y}`).join(' ')} 
                          stroke="yellow" 
                          strokeWidth="0.4" 
                          fill="none"
                        />
                      )}
                      
                      {/* 메인 꺾은선 */}
                      <polyline 
                        points={muscle.linePoints.map(p => `${p.x},${p.y}`).join(' ')} 
                        stroke="black" 
                        strokeWidth="0.15" 
                        fill="none"
                      />
                      
                      {/* 텍스트 배경 박스 */}
                      <rect 
                        x={muscle.textBox.x} 
                        y={muscle.textBox.y} 
                        width={muscle.textBox.width} 
                        height={muscle.textBox.height} 
                        fill={selectedPoints.has(muscle.id) ? "rgba(255,255,0,0.3)" : "transparent"}
                        stroke={selectedPoints.has(muscle.id) ? "orange" : "none"}
                        strokeWidth="0.05"
                      />
                      
                      {/* 텍스트 */}
                      <text 
                        x={muscle.text.x} 
                        y={muscle.text.y} 
                        fontSize="1.2" 
                        fill="black"
                        fontWeight={selectedPoints.has(muscle.id) ? "900" : "bold"}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {muscle.name}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          )}

        </PrescriptionContainer>
      </PrescriptionPanel>
    </PageContainer>
  );
};

export default ExercisePrescriptionPage;