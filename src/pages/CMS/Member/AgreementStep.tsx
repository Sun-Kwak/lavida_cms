import React, { useState, useEffect, useMemo } from 'react';
import { 
  StepContent, 
  StepTitle, 
  AgreementSection,
  AgreementItem,
  AgreementHeader,
  AgreementTitle,
  AgreementContent,
  CheckboxLabel,
  Checkbox,
  SignatureSection,
  SignatureRow,
  SignatureBox,
  Button
} from './StyledComponents';
import { StepProps } from './types';
import { dbManager } from '../../../utils/indexedDB';
import CustomTiptapEditor from '../../../components/Editor/CustomTiptapEditor';
import SignatureCanvas from '../../../components/SignatureCanvas';
import { openPreviewWindow } from './PreviewDocument';

const AgreementStep: React.FC<StepProps> = ({ formData, onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // 약관 타입별 매핑
  const agreementTypeMap = useMemo(() => ({
    'terms': 'member_terms',
    'privacy': 'privacy_policy', 
    'service': 'terms_of_service',
    'marketing': 'marketing_consent',
    'contract': 'contract' // 계약서 추가
  } as { [key: string]: string }), []);

  // 약관 문서 로드 및 초기화
  useEffect(() => {
    const loadTermsDocuments = async () => {
      if (isInitialized) return; // 이미 초기화되었으면 중복 실행 방지
      
      setLoading(true);
      try {
        console.log('약관 로딩 시작...');
        const documents = await dbManager.terms.getAllTermsDocuments();
        console.log('DB에서 가져온 약관 수:', documents.length);
        console.log('모든 약관:', documents);
        
        // 활성 문서만 필터링
        const activeDocuments = documents.filter(doc => doc.isActive);
        console.log('활성 약관 수:', activeDocuments.length);
        
        if (activeDocuments.length === 0) {
          console.log('활성 약관이 없음 - 기본 약관으로 처리');
        }
        
        // DB 약관으로 agreements 생성
        const dbAgreements: Array<{
          id: string;
          title: string;
          content: string;
          required: boolean;
          agreed: boolean;
        }> = [];
        
        // 먼저 DB에서 가져온 활성 약관들을 처리
        activeDocuments
          .filter(doc => doc.type !== 'business_info' && doc.type !== 'contract') // 사업자정보, 계약서 제외
          .forEach(doc => {
            const agreementId = Object.keys(agreementTypeMap).find(key => agreementTypeMap[key] === doc.type);
            console.log(`약관 처리: ${doc.type} (${doc.title}) -> ID: ${agreementId || doc.type}`);
            
            if (agreementId) { // 매핑된 ID가 있는 경우만 추가
              dbAgreements.push({
                id: agreementId,
                title: doc.title,
                content: doc.content,
                required: ['privacy_policy', 'terms_of_service', 'member_terms'].includes(doc.type),
                agreed: false
              });
            }
          });

        // 필수 약관 중 누락된 것들을 기본값으로 추가
        const requiredTypes = ['member_terms', 'privacy_policy', 'terms_of_service'];
        requiredTypes.forEach(type => {
          const hasType = activeDocuments.some(doc => doc.type === type);
          
          if (!hasType) {
            const defaultTitle = {
              'member_terms': '회원 이용약관',
              'privacy_policy': '개인정보 처리방침',
              'terms_of_service': '서비스 이용약관'
            }[type] || '';
            
            const agreementId = Object.keys(agreementTypeMap).find(key => agreementTypeMap[key] === type);
            console.log(`기본 약관 추가: ${type} -> ${agreementId} (${defaultTitle})`);
            
            if (agreementId) {
              dbAgreements.push({
                id: agreementId,
                title: defaultTitle,
                content: '<p>약관 내용이 등록되지 않았습니다. 관리자에게 문의하세요.</p>',
                required: true,
                agreed: false
              });
            }
          }
        });

        // 회원약관을 맨 앞으로 정렬
        dbAgreements.sort((a, b) => {
          const order = ['terms', 'privacy', 'service', 'marketing'];
          const aIndex = order.indexOf(a.id);
          const bIndex = order.indexOf(b.id);
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });

        console.log('최종 약관 목록:', dbAgreements);

        // 처음 로딩이거나 약관이 비어있을 때만 업데이트
        if (!isInitialized || formData.agreementInfo.agreements.length === 0) {
          console.log('약관 정보 업데이트 실행');
          onUpdate({
            agreementInfo: {
              ...formData.agreementInfo,
              agreements: dbAgreements
            }
          });
        } else {
          console.log('이미 초기화됨 - 업데이트 스킵');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('약관 문서 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTermsDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 컴포넌트 마운트 시에만 실행

  const handleAgreementChange = (agreementId: string, agreed: boolean) => {
    const updatedAgreements = formData.agreementInfo.agreements.map(agreement =>
      agreement.id === agreementId ? { ...agreement, agreed } : agreement
    );
    
    onUpdate({
      agreementInfo: {
        ...formData.agreementInfo,
        agreements: updatedAgreements
      }
    });
  };

  const handleSignatureChange = (type: 'customer' | 'staff', signature: string) => {
    onUpdate({
      agreementInfo: {
        ...formData.agreementInfo,
        [type === 'customer' ? 'customerSignature' : 'staffSignature']: signature
      }
    });
  };

  return (
    <StepContent>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <StepTitle>동의 및 서명</StepTitle>
        <Button 
          variant="outline" 
          onClick={async () => await openPreviewWindow(formData)}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          전체 미리보기
        </Button>
      </div>
      
      {loading ? (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: '#666'
        }}>
          약관을 불러오는 중...
        </div>
      ) : (
        <AgreementSection>
          {formData.agreementInfo.agreements.map(agreement => (
            <AgreementItem key={agreement.id}>
              <AgreementHeader>
                <AgreementTitle>
                  {agreement.title} {agreement.required && '*'}
                </AgreementTitle>
                <CheckboxLabel>
                  <Checkbox
                    checked={agreement.agreed}
                    onChange={(e) => handleAgreementChange(agreement.id, e.target.checked)}
                  />
                  동의합니다
                </CheckboxLabel>
              </AgreementHeader>
              <AgreementContent>
                <div 
                  className="agreement-editor-wrapper"
                  style={{ 
                    minHeight: 'auto',
                    height: 'auto'
                  }}
                >
                  <style>{`
                    .agreement-editor-wrapper .editor-container {
                      min-height: auto !important;
                      height: auto !important;
                    }
                    .agreement-editor-wrapper .tiptap-editor-content {
                      min-height: auto !important;
                      height: auto !important;
                    }
                    .agreement-editor-wrapper .ProseMirror {
                      min-height: auto !important;
                      height: auto !important;
                    }
                  `}</style>
                  <CustomTiptapEditor
                    content={agreement.content}
                    readOnly={true}
                    showMenuBar={false}
                    placeholder=""
                    onChange={() => {}} // 읽기 전용이므로 빈 함수
                    height="auto"
                    hideBorder={true}
                  />
                </div>
              </AgreementContent>
            </AgreementItem>
          ))}
        </AgreementSection>
      )}

      <SignatureSection>
        <h3>서명</h3>
        <p>아래 서명란에 고객과 직원이 각각 서명해주세요.</p>
        <SignatureRow>
          <SignatureBox>
            <h4>고객 서명</h4>
            <SignatureCanvas
              width={300}
              height={150}
              onSignatureChange={(signature) => handleSignatureChange('customer', signature)}
              initialSignature={formData.agreementInfo.customerSignature}
            />
            <small>위 약관에 동의하며 서명합니다.</small>
          </SignatureBox>

          <SignatureBox>
            <h4>직원 서명</h4>
            <SignatureCanvas
              width={300}
              height={150}
              onSignatureChange={(signature) => handleSignatureChange('staff', signature)}
              initialSignature={formData.agreementInfo.staffSignature}
            />
            <small>약관 설명 및 확인 완료</small>
          </SignatureBox>
        </SignatureRow>
      </SignatureSection>
    </StepContent>
  );
};

export default AgreementStep;
