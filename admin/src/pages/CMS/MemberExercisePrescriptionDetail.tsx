import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ExercisePrescription } from '../../utils/db/types';
import { ExercisePrescriptionService } from '../../utils/db/ExercisePrescriptionService';
import ExercisePrescriptionForm from '../../components/ExercisePrescriptionForm';
import { AppColors } from '../../styles/colors';

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${AppColors.borderLight};
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin: 0;
`;

const BackButton = styled.button`
  padding: 8px 16px;
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  background: white;
  color: ${AppColors.onSurface};
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: ${AppColors.background};
  }
`;

const VersionBadge = styled.span`
  background: ${AppColors.primary};
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 12px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 16px;
  color: ${AppColors.onInput2};
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 16px;
  color: ${AppColors.error};
  text-align: center;
`;

interface MemberExercisePrescriptionDetailProps {
}

const MemberExercisePrescriptionDetail: React.FC<MemberExercisePrescriptionDetailProps> = () => {
  const { prescriptionId } = useParams<{ prescriptionId: string }>();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<ExercisePrescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrescription = async () => {
      if (!prescriptionId) {
        setError('운동처방 ID가 제공되지 않았습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const service = new ExercisePrescriptionService();
        const data = await service.getExercisePrescriptionById(prescriptionId);
        if (data) {
          setPrescription(data);
        } else {
          setError('운동처방을 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('운동처방 로드 중 오류:', err);
        setError('운동처방을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadPrescription();
  }, [prescriptionId]);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          운동처방을 불러오는 중...
        </LoadingContainer>
      </Container>
    );
  }

  if (error || !prescription) {
    return (
      <Container>
        <ErrorContainer>
          <div>
            <div>{error || '운동처방을 찾을 수 없습니다.'}</div>
            <BackButton onClick={handleGoBack} style={{ marginTop: '16px' }}>
              돌아가기
            </BackButton>
          </div>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title>운동처방 상세보기</Title>
          <VersionBadge>v{prescription.version}</VersionBadge>
        </div>
        <BackButton onClick={handleGoBack}>
          목록으로 돌아가기
        </BackButton>
      </Header>

      <ExercisePrescriptionForm
        selectedMember={{
          id: prescription.memberId,
          name: prescription.memberName,
          phone: '',
          email: '',
          birth: '',
          gender: 'male',
          address: '',
          sigunguCode: '',
          dong: '',
          roadAddress: '',
          jibunAddress: '',
          branchId: '',
          branchName: '',
          coach: '',
          coachName: '',
          joinPath: '',
          loginId: '',
          loginPassword: null,
          enableLogin: false,
          agreementInfo: {
            agreements: [],
            customerSignature: '',
            staffSignature: ''
          },
          isActive: true,
          registrationDate: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }}
        prescription={prescription}
        formData={{
          height: prescription.height,
          weight: prescription.weight,
          footSize: prescription.footSize,
          medications: prescription.medications,
          medicalHistory: prescription.medicalHistory,
          painHistory: prescription.painHistory,
          bodyImages: prescription.bodyImages,
          signatureData: prescription.signatureData
        }}
        readOnly={true}
      />
    </Container>
  );
};

export default MemberExercisePrescriptionDetail;