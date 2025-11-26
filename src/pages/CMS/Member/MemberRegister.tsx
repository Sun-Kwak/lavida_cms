import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { 
  PageContainer, 
  PageHeader, 
  PageTitle, 
  PageDescription,
  StepContainer,
  StepWrapper,
  StepItem,
  StepCircle,
  StepLabel,
  StepLine,
  Card,
  ButtonGroup,
  Button
} from './StyledComponents';
import { MemberFormData } from './types';
import BasicInfoStep from './BasicInfoStep';
import JoinInfoStep from './JoinInfoStep';
import PaymentInfoStep from './PaymentInfoStep';
import AgreementStep from './AgreementStep';
import { saveDocumentAsFile } from './PreviewDocument';
import { dbManager } from '../../../utils/indexedDB';

const MemberRegister: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const [stepErrors, setStepErrors] = useState<{ [stepNumber: number]: { [key: string]: string } }>({});
  const [formData, setFormData] = useState<MemberFormData>({
    basicInfo: {
      name: '',
      phone: '',
      email: '',
      birth: '',
      gender: '',
      addressInfo: {
        address: '',
        sigunguCode: '',
        dong: '',
        roadAddress: '',
        jibunAddress: '',
      },
    },
    joinInfo: {
      branchId: '',
      coach: '',
      joinPath: '',
      referrerId: '',
      referrerName: '',
      loginId: '',
      loginPassword: '',
      enableLogin: false,
    },
    paymentInfo: {
      selectedProducts: [],
      paymentMethod: 'card',
      receivedAmount: undefined,
      pointPayment: 0,
    },
    agreementInfo: {
      agreements: [
        {
          id: 'terms',
          title: '회원이용약관',
          content: '회원이용약관 내용입니다...',
          required: true,
          agreed: false,
        },
        {
          id: 'privacy',
          title: '개인정보처리방침',
          content: '개인정보처리방침 내용입니다...',
          required: true,
          agreed: false,
        },
        {
          id: 'service',
          title: '서비스이용약관',
          content: '서비스이용약관 내용입니다...',
          required: true,
          agreed: false,
        },
        {
          id: 'marketing',
          title: '마케팅활용 동의',
          content: '마케팅활용 동의 내용입니다...',
          required: false,
          agreed: false,
        },
      ],
      customerSignature: '',
      staffSignature: '',
    },
  });

  const steps = [
    { number: 1, label: '기본정보' },
    { number: 2, label: '가입정보' },
    { number: 3, label: '결제정보' },
    { number: 4, label: '동의서명' },
  ];

  const handleFormUpdate = (updatedData: Partial<MemberFormData>) => {
    setFormData(prev => ({ ...prev, ...updatedData }));
  };

  const validateCurrentStep = (): boolean => {
    const currentStepErrors = stepErrors[currentStep] || {};
    const hasErrors = Object.keys(currentStepErrors).length > 0;
    
    switch (currentStep) {
      case 1:
        return !!(
          formData.basicInfo.name && 
          formData.basicInfo.phone && 
          formData.basicInfo.birth && 
          formData.basicInfo.gender && 
          formData.basicInfo.addressInfo.address
        ) && !hasErrors;
      case 2:
        // 기본 필수 필드 검증
        const hasBasicFields = !!(formData.joinInfo.coach && formData.joinInfo.joinPath);
        
        // 지인추천일 때만 추가 검증
        const isReferrerValid = formData.joinInfo.joinPath !== '지인추천' || 
          !!(formData.joinInfo.referrerId && formData.joinInfo.referrerName);
        
        const isValidStep2 = hasBasicFields && isReferrerValid && !hasErrors;
        
        console.log('=== 2단계 검증 ===');
        console.log('coach:', formData.joinInfo.coach);
        console.log('joinPath:', formData.joinInfo.joinPath);
        console.log('referrerId:', formData.joinInfo.referrerId);
        console.log('referrerName:', formData.joinInfo.referrerName);
        console.log('hasErrors:', hasErrors);
        console.log('hasBasicFields:', hasBasicFields);
        console.log('isReferrerValid:', isReferrerValid);
        console.log('최종 검증 결과:', isValidStep2);
        
        return isValidStep2;
      case 3:
        return true; // 결제정보는 선택사항
      case 4:
        const requiredAgreements = formData.agreementInfo.agreements.filter(a => a.required);
        const allRequiredAgreed = requiredAgreements.every(a => a.agreed);
        const hasCustomerSignature = !!formData.agreementInfo.customerSignature;
        const hasStaffSignature = !!formData.agreementInfo.staffSignature;
        
        console.log('=== 4단계 검증 ===');
        console.log('필수 약관 수:', requiredAgreements.length);
        console.log('필수 약관 모두 동의:', allRequiredAgreed);
        console.log('고객 서명 존재:', hasCustomerSignature);
        console.log('직원 서명 존재:', hasStaffSignature);
        console.log('전체 검증 결과:', allRequiredAgreed && hasCustomerSignature && hasStaffSignature);
        
        return allRequiredAgreed && hasCustomerSignature && hasStaffSignature;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleValidateAndNext = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    try {
      setIsValidating(true);

      // 1단계(기본정보)에서는 연락처와 이메일 중복 체크 수행
      if (currentStep === 1) {
        const { phone, email } = formData.basicInfo;
        
        // 연락처는 필수이므로 항상 체크
        if (!phone) {
          toast.error('연락처를 입력해주세요.');
          return;
        }

        // 중복 체크 수행
        const duplicateCheck = await dbManager.checkMemberDuplicate(phone, email);
        
        if (duplicateCheck.isDuplicate) {
          toast.error(duplicateCheck.message || '중복된 정보가 있습니다.');
          return;
        }
      }
      
      // 2단계(가입정보)에서는 로그인 ID 중복 체크 수행 (로그인 기능 사용 시에만)
      else if (currentStep === 2) {
        const { enableLogin, loginId } = formData.joinInfo;
        
        if (enableLogin && loginId) {
          // 로그인 ID 중복 체크 수행
          const duplicateCheck = await dbManager.checkLoginIdDuplicate(loginId);
          
          if (duplicateCheck.isDuplicate) {
            toast.error(duplicateCheck.message || '이미 사용 중인 로그인 ID입니다.');
            return;
          }
        }
      }

      // 중복이 없으면 다음 단계로
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('중복 체크 실패:', error);
      toast.error('중복 체크 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsValidating(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipPayment = () => {
    setCurrentStep(4);
  };

  const handleSubmit = async () => {
    try {
      console.log('=== 회원 등록 시작 ===');
      console.log('폼 데이터:', formData);
      
      // 0. IndexedDB 연결 상태 확인
      console.log('IndexedDB 상태 확인 중...');
      try {
        // 데이터베이스 테이블 존재 여부 확인
        console.log('데이터베이스 객체:', dbManager);
        
        const testBranches = await dbManager.getAllBranches();
        console.log('IndexedDB 연결 성공, 지점 수:', testBranches.length);
        
        // members 테이블 접근 테스트
        console.log('회원 테이블 접근 테스트 중...');
        const existingMembers = await dbManager.getAllMembers();
        console.log('기존 회원 수:', existingMembers.length);
        console.log('기존 회원 목록:', existingMembers);
        
      } catch (dbError) {
        console.error('IndexedDB 연결 실패:', dbError);
        throw new Error('데이터베이스 연결에 실패했습니다.');
      }
      
      // 1. 지점명과 코치명 가져오기
      console.log('=== 1단계: 지점과 직원 정보 조회 ===');
      const branches = await dbManager.getAllBranches();
      const staff = await dbManager.getAllStaff();
      console.log('전체 지점 수:', branches.length);
      console.log('전체 직원 수:', staff.length);
      
      const branch = branches.find(b => b.id === formData.joinInfo.branchId);
      const coach = staff.find(s => s.id === formData.joinInfo.coach);
      
      console.log('선택된 지점 ID:', formData.joinInfo.branchId);
      console.log('찾은 지점 정보:', branch);
      console.log('선택된 코치 ID:', formData.joinInfo.coach);
      console.log('찾은 코치 정보:', coach);
      
      // 2. 회원 정보 저장 (기본정보 + 가입정보만)
      console.log('=== 2단계: 회원 정보 저장 ===');
      const memberData = {
        name: formData.basicInfo.name,
        phone: formData.basicInfo.phone,
        email: formData.basicInfo.email,
        birth: formData.basicInfo.birth,
        gender: formData.basicInfo.gender as 'male' | 'female' | '',
        address: formData.basicInfo.addressInfo.address,
        sigunguCode: formData.basicInfo.addressInfo.sigunguCode,
        dong: formData.basicInfo.addressInfo.dong,
        roadAddress: formData.basicInfo.addressInfo.roadAddress,
        jibunAddress: formData.basicInfo.addressInfo.jibunAddress,
        branchId: formData.joinInfo.branchId,
        branchName: branch?.name || '',
        coach: formData.joinInfo.coach,
        coachName: coach?.name || '',
        joinPath: formData.joinInfo.joinPath,
        referrerId: formData.joinInfo.referrerId || null, // 지인추천인 ID
        referrerName: formData.joinInfo.referrerName || null, // 지인추천인 이름
        loginId: formData.joinInfo.loginId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 공란일 때는 임시 고유값 생성
        loginPassword: formData.joinInfo.loginPassword || null, // 공란일 때는 null로 저장
        enableLogin: formData.joinInfo.enableLogin,
        agreementInfo: formData.agreementInfo,
        isActive: true,
        registrationDate: new Date().toISOString(),
        remarks: '' // 비고는 빈 문자열로 초기화
      };
      
      console.log('저장할 회원 데이터:', memberData);
      console.log('데이터 타입 검증:');
      console.log('- name 타입:', typeof memberData.name, '값:', memberData.name);
      console.log('- phone 타입:', typeof memberData.phone, '값:', memberData.phone);
      console.log('- email 타입:', typeof memberData.email, '값:', memberData.email);
      
      console.log('dbManager.addMember 함수 호출 전...');
      let memberId: string;
      try {
        memberId = await dbManager.addMember(memberData);
        console.log('dbManager.addMember 함수 호출 후 - 반환값:', memberId);
        console.log('반환값 타입:', typeof memberId);
      } catch (addMemberError) {
        console.error('❌ addMember 함수에서 에러 발생:', addMemberError);
        console.error('에러 타입:', typeof addMemberError);
        console.error('에러 메시지:', addMemberError instanceof Error ? addMemberError.message : addMemberError);
        console.error('에러 스택:', addMemberError instanceof Error ? addMemberError.stack : '스택 없음');
        throw new Error(`회원 저장 중 오류: ${addMemberError instanceof Error ? addMemberError.message : '알 수 없는 오류'}`);
      }
      
      if (!memberId) {
        throw new Error('회원 저장에 실패했습니다 - 반환값 없음');
      }
      
      // 즉시 저장 확인
      console.log('=== 저장 확인 테스트 ===');
      try {
        const allMembers = await dbManager.getAllMembers();
        console.log('저장 후 전체 회원 수:', allMembers.length);
        console.log('저장된 모든 회원:', allMembers);
        
        const foundMember = allMembers.find(m => m.id === memberId);
        if (foundMember) {
          console.log('✅ 방금 저장한 회원을 데이터베이스에서 찾았습니다:', foundMember);
        } else {
          console.error('❌ 방금 저장한 회원을 데이터베이스에서 찾을 수 없습니다');
        }
      } catch (verifyError) {
        console.error('저장 확인 중 오류:', verifyError);
      }
      
      // 3. 결제 정보 및 수강 정보 저장 (상품이 선택된 경우에만) - 개선된 통합 주문 처리
      let orderId: string | null = null;
      
      if (formData.paymentInfo.selectedProducts.length > 0) {
        console.log('=== 3단계: 개선된 통합 주문 처리 ===');
        
        const totalAmount = formData.paymentInfo.selectedProducts.reduce((sum, product) => {
          return sum + (product.appliedPrice || product.price);
        }, 0);
        const receivedAmount = formData.paymentInfo.receivedAmount || totalAmount;
        const pointPayment = formData.paymentInfo.pointPayment || 0; // 포인트 결제 지원
        const cashPayment = receivedAmount - pointPayment;
        
        console.log(`총 결제금액: ${totalAmount.toLocaleString()}원`);
        console.log(`포인트 결제: ${pointPayment.toLocaleString()}원`);
        console.log(`현금/카드 결제: ${cashPayment.toLocaleString()}원`);
        
        try {
          // 상품 정보 조회 및 준비
          const orderProducts = [];
          for (const product of formData.paymentInfo.selectedProducts) {
            const productDetails = await dbManager.getProductById(product.id);
            if (!productDetails) {
              throw new Error(`상품 정보를 찾을 수 없습니다: ${product.name}`);
            }
            
            // 기간제/횟수제 상품의 경우 추가 정보 포함
            const orderProduct: any = {
              id: product.id,
              name: product.name,
              price: product.appliedPrice || product.price, // 적용된 가격 사용
              programId: productDetails.programId,
              programName: productDetails.programName,
              programType: productDetails.programType,
              originalPrice: product.price, // 계산된 정확한 상품 가격
              appliedPrice: product.appliedPrice // 사용자가 조정한 적용 가격
            };

            // 기간제 상품의 경우 기간 정보 추가
            if (product.programType === '기간제' && product.startDate && product.endDate) {
              orderProduct.startDate = product.startDate;
              orderProduct.endDate = product.endDate;
              orderProduct.duration = product.duration;
            }

            // 횟수제 상품의 경우 횟수 및 유효기간 정보 추가
            if (product.programType === '횟수제') {
              if (product.sessions) {
                orderProduct.sessions = product.sessions;
              }
              if (product.startDate) {
                orderProduct.startDate = product.startDate;
              }
              if (product.endDate) {
                orderProduct.endDate = product.endDate;
              }
            }
            
            orderProducts.push(orderProduct);
          }

          // 통합 주문 처리 실행
          orderId = await dbManager.processOrderWithPayments({
            memberInfo: {
              id: memberId,
              name: formData.basicInfo.name,
              branchId: formData.joinInfo.branchId,
              branchName: branch?.name || '',
              coach: formData.joinInfo.coach,
              coachName: coach?.name || ''
            },
            products: orderProducts,
            payments: {
              cash: formData.paymentInfo.paymentMethod === 'cash' ? cashPayment : 0,
              card: formData.paymentInfo.paymentMethod === 'card' ? cashPayment : 0,
              transfer: formData.paymentInfo.paymentMethod === 'transfer' ? cashPayment : 0,
              points: pointPayment,
              bonusPointsEnabled: formData.paymentInfo.bonusPointsEnabled
            },
            orderType: 'registration'
          });

          console.log(`통합 주문 처리 완료 - 주문 ID: ${orderId}`);

        } catch (orderError) {
          console.error('통합 주문 처리 실패:', orderError);
          throw orderError;
        }
      }
      
      // 3.5. 지인추천 포인트 적립 처리
      if (formData.joinInfo.joinPath === '지인추천' && formData.joinInfo.referrerId) {
        console.log('=== 지인추천 포인트 적립 처리 ===');
        
        try {
          // 해당 지점의 추천 포인트 설정 조회 (없으면 "전체" 지점 설정 사용)
          const referralPoints = await dbManager.referralPoint.getReferralPoints(formData.joinInfo.branchId);
          console.log('추천 포인트 설정:', referralPoints);
          
          // 추천인(기존 회원)에게 포인트 적립
          const referrerMember = await dbManager.getMemberById(formData.joinInfo.referrerId);
          const referrerName = referrerMember?.name || formData.joinInfo.referrerName || 'Unknown';
          
          if (referralPoints.referrerPoints > 0) {
            await dbManager.point.addPointTransaction({
              memberId: formData.joinInfo.referrerId,
              memberName: referrerName,
              amount: referralPoints.referrerPoints,
              transactionType: 'earn',
              source: '지인추천 보상',
              description: `${formData.basicInfo.name} 님 추천으로 적립`,
              earnedDate: new Date(),
              isExpired: false
            });
            console.log(`추천인(${referrerName})에게 ${referralPoints.referrerPoints.toLocaleString()} 포인트 적립 완료`);
          }
          
          // 신규 회원에게 포인트 적립
          if (referralPoints.referredPoints > 0) {
            await dbManager.point.addPointTransaction({
              memberId: memberId,
              memberName: formData.basicInfo.name,
              amount: referralPoints.referredPoints,
              transactionType: 'earn',
              source: '지인추천 가입 혜택',
              description: `${referrerName} 님 추천으로 가입`,
              earnedDate: new Date(),
              isExpired: false
            });
            console.log(`신규 회원(${formData.basicInfo.name})에게 ${referralPoints.referredPoints.toLocaleString()} 포인트 적립 완료`);
          }
          
        } catch (pointError) {
          console.error('지인추천 포인트 적립 실패:', pointError);
          // 포인트 적립 실패는 경고만 표시하고 계속 진행
        }
      }
      
      // 4. 회원 등록 문서를 HTML 파일로 저장
      console.log('=== 4단계: 문서 생성 ===');
      const fileName = await saveDocumentAsFile(formData);
      console.log('문서 저장 완료:', fileName);
      
      // 결과 메시지 생성
      let successMessage = `회원이 성공적으로 등록되었습니다!\n회원 ID: ${memberId}\n등록 문서: ${fileName}`;
      
      // 지인추천 포인트 적립 정보 추가
      if (formData.joinInfo.joinPath === '지인추천' && formData.joinInfo.referrerId) {
        const referrerPoints = await dbManager.referralPoint.getReferralPoints(formData.joinInfo.branchId);
        const referrerStaff = staff.find(s => s.id === formData.joinInfo.referrerId);
        const referrerName = referrerStaff?.name || formData.joinInfo.referrerName || 'Unknown';
        
        if (referrerPoints.referrerPoints > 0 || referrerPoints.referredPoints > 0) {
          successMessage += `\n\n🎁 지인추천 혜택`;
          if (referrerPoints.referrerPoints > 0) {
            successMessage += `\n👨‍💼 추천인(${referrerName}): ${referrerPoints.referrerPoints.toLocaleString()} 포인트 적립`;
          }
          if (referrerPoints.referredPoints > 0) {
            successMessage += `\n🙋‍♀️ 신규회원: ${referrerPoints.referredPoints.toLocaleString()} 포인트 적립`;
          }
        }
      }
      
      if (formData.paymentInfo.selectedProducts.length > 0 && orderId) {
        const totalAmount = formData.paymentInfo.selectedProducts.reduce((sum, product) => {
          return sum + (product.appliedPrice || product.price);
        }, 0);
        const receivedAmount = formData.paymentInfo.receivedAmount || totalAmount;
        const pointPayment = formData.paymentInfo.pointPayment || 0;
        const totalPaid = (receivedAmount - pointPayment) + pointPayment;
        
        // 주문 정보 표시
        successMessage += `\n\n📋 주문 ID: ${orderId.slice(-8)}`;
        successMessage += `\n📚 수강 상품: ${formData.paymentInfo.selectedProducts.length}개`;
        
        // 기간제 상품 기간 정보 표시
        const periodProducts = formData.paymentInfo.selectedProducts.filter(p => p.programType === '기간제' && p.startDate && p.endDate);
        if (periodProducts.length > 0) {
          successMessage += `\n📅 수강 기간:`;
          periodProducts.forEach(product => {
            successMessage += `\n   • ${product.name}: ${product.startDate?.toLocaleDateString()} ~ ${product.endDate?.toLocaleDateString()} (${product.duration}일)`;
          });
        }
        
        // 결제 정보 표시
        if (pointPayment > 0) {
          successMessage += `\n🪙 포인트 결제: ${pointPayment.toLocaleString()}원`;
        }
        if (receivedAmount - pointPayment > 0) {
          successMessage += `\n💳 현금/카드 결제: ${(receivedAmount - pointPayment).toLocaleString()}원`;
        }
        
        // 상태 표시
        if (totalPaid > totalAmount) {
          const excessAmount = totalPaid - totalAmount;
          successMessage += `\n💰 초과금 ${excessAmount.toLocaleString()}원이 포인트로 적립되었습니다.`;
          
          // 보너스 포인트 계산 및 표시
          if (excessAmount >= 1000000) {
            const millionUnits = Math.floor(excessAmount / 1000000);
            const bonusPoints = millionUnits * 100000;
            successMessage += `\n🎁 보너스 포인트 ${bonusPoints.toLocaleString()}원 추가 적립! (${millionUnits}개 100만원 단위)`;
          }
        } else if (totalPaid < totalAmount) {
          const unpaidAmount = totalAmount - totalPaid;
          successMessage += `\n⚠️ 미수금 ${unpaidAmount.toLocaleString()}원이 있습니다.`;
        } else {
          successMessage += `\n✅ 모든 상품의 결제가 완료되었습니다.`;
        }
      }
      
      toast.success(successMessage, {
        autoClose: 7000
      });
      
      // 등록 완료 후 초기화
      setCurrentStep(1);
      setFormData({
        basicInfo: {
          name: '',
          phone: '',
          email: '',
          birth: '',
          gender: '',
          addressInfo: {
            address: '',
            sigunguCode: '',
            dong: '',
            roadAddress: '',
            jibunAddress: '',
          },
        },
        joinInfo: {
          branchId: '',
          coach: '',
          joinPath: '',
          referrerId: '',
          referrerName: '',
          loginId: '',
          loginPassword: '',
          enableLogin: false,
        },
        paymentInfo: {
          selectedProducts: [],
          paymentMethod: 'card',
          receivedAmount: undefined,
          pointPayment: 0,
        },
        agreementInfo: {
          agreements: [
            {
              id: 'terms',
              title: '회원이용약관',
              content: '회원이용약관 내용입니다...',
              required: true,
              agreed: false,
            },
            {
              id: 'privacy',
              title: '개인정보처리방침',
              content: '개인정보처리방침 내용입니다...',
              required: true,
              agreed: false,
            },
            {
              id: 'service',
              title: '서비스이용약관',
              content: '서비스이용약관 내용입니다...',
              required: true,
              agreed: false,
            },
            {
              id: 'marketing',
              title: '마케팅활용 동의',
              content: '마케팅활용 동의 내용입니다...',
              required: false,
              agreed: false,
            },
          ],
          customerSignature: '',
          staffSignature: '',
        },
      });
    } catch (error) {
      console.error('회원 등록 처리 중 오류:', error);
      toast.error(`회원 등록 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const renderStepContent = () => {
    const handleErrorsChange = (errors: { [key: string]: string }) => {
      setStepErrors(prev => ({
        ...prev,
        [currentStep]: errors
      }));
    };

    const stepProps = {
      formData,
      onUpdate: handleFormUpdate,
      onNext: handleNext,
      onPrev: handlePrev,
      isValid: validateCurrentStep(),
      onValidateAndNext: handleValidateAndNext,
      onErrorsChange: handleErrorsChange,
    };

    switch (currentStep) {
      case 1:
        return <BasicInfoStep {...stepProps} />;
      case 2:
        return <JoinInfoStep {...stepProps} />;
      case 3:
        return <PaymentInfoStep {...stepProps} />;
      case 4:
        return <AgreementStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>신규 회원 등록</PageTitle>
        <PageDescription>새로운 회원의 정보를 단계별로 입력하여 등록합니다.</PageDescription>
      </PageHeader>

      <StepContainer>
        <StepWrapper>
          {steps.map((step, index) => (
            <StepItem
              key={step.number}
              $active={currentStep === step.number}
              $completed={currentStep > step.number}
            >
              <StepCircle
                $active={currentStep === step.number}
                $completed={currentStep > step.number}
              >
                {currentStep > step.number ? '✓' : step.number}
              </StepCircle>
              <StepLabel
                $active={currentStep === step.number}
                $completed={currentStep > step.number}
              >
                {step.label}
              </StepLabel>
              {index < steps.length - 1 && (
                <StepLine $completed={currentStep > step.number} />
              )}
            </StepItem>
          ))}
        </StepWrapper>
      </StepContainer>

      <Card>
        {renderStepContent()}

        <ButtonGroup>
          <div>
            {currentStep > 1 && (
              <Button variant="secondary" onClick={handlePrev}>
                이전
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {currentStep === 3 && (
              <Button variant="outline" onClick={handleSkipPayment}>
                건너뛰기
              </Button>
            )}
            
            {currentStep < 4 ? (
              <Button 
                onClick={(currentStep === 1 || currentStep === 2) ? handleValidateAndNext : handleNext} 
                disabled={!validateCurrentStep() || ((currentStep === 1 || currentStep === 2) && isValidating)}
              >
                {((currentStep === 1 || currentStep === 2) && isValidating) ? '중복 확인 중...' : '다음'}
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!validateCurrentStep()}
              >
                회원등록 완료
              </Button>
            )}
          </div>
        </ButtonGroup>
      </Card>
    </PageContainer>
  );
};

export default MemberRegister;
