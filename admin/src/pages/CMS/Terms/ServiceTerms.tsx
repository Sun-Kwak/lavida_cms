import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import CustomTiptapEditor from '../../../components/Editor/CustomTiptapEditor';
import { toast } from 'react-toastify';
import { dbManager, TermsDocument } from '../../../utils/indexedDB';
import { devLog } from '../../../utils/devLogger';

const Container = styled.div`
  padding: 24px;
  background-color: ${AppColors.surface};
  min-height: 100vh;
`;

const Title = styled.h1`
  font-size: ${AppTextStyles.title1.fontSize};
  font-weight: 700;
  color: ${AppColors.onSurface};
  margin: 0 0 24px 0;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const SaveButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  transition: all 0.2s ease;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const EditorContainer = styled.div`
  background-color: transparent;
  border-radius: 8px;
  min-height: 600px;
  border: 1px solid #ddd;
  padding: 20px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #6c757d;
  font-size: 16px;
`;

const ServiceTerms: React.FC = () => {
  const [content, setContent] = useState<string>("");
  const [currentDocument, setCurrentDocument] = useState<TermsDocument | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 문서 로딩
  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      const activeDoc = await dbManager.terms.getActiveTermsDocument('terms_of_service');
      if (activeDoc) {
        setCurrentDocument(activeDoc);
        setContent(activeDoc.content);
        devLog("서비스 이용약관 문서 로딩:", activeDoc);
      } else {
        setCurrentDocument(null);
        setContent("");
        devLog("새 서비스 이용약관 문서 생성 준비");
      }
    } catch (err: any) {
      devLog("서비스 이용약관 문서 로딩 실패:", err);
      toast.error("문서를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 문서 저장
  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("문서 내용을 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      
      if (currentDocument) {
        // 기존 문서 수정
        const updatedDoc = await dbManager.terms.updateTermsDocument(currentDocument.id, {
          title: "서비스 이용약관",
          content: content.trim(),
          isActive: true
        });

        if (updatedDoc) {
          setCurrentDocument(updatedDoc);
          toast.success("서비스 이용약관이 성공적으로 수정되었습니다!");
        }
      } else {
        // 새 문서 생성
        const newDoc = await dbManager.terms.addTermsDocument({
          type: 'terms_of_service',
          title: "서비스 이용약관",
          content: content.trim(),
          isActive: true
        });

        setCurrentDocument(newDoc);
        toast.success("서비스 이용약관이 성공적으로 저장되었습니다!");
      }

      await loadDocument();
    } catch (err: any) {
      devLog("서비스 이용약관 저장 실패:", err);
      toast.error(`문서 저장에 실패했습니다: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 에디터 내용 업데이트
  const handleEditorUpdate = (newContent: string) => {
    setContent(newContent);
  };

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  return (
    <Container>
      <Title>서비스 이용약관</Title>

      {/* 저장 버튼 */}
      <ButtonContainer>
        <SaveButton 
          onClick={handleSave} 
          disabled={isLoading}
        >
          {isLoading ? "저장 중..." : "저장하기"}
        </SaveButton>
      </ButtonContainer>

      {/* 에디터 */}
      <EditorContainer>
        {isLoading ? (
          <LoadingMessage>로딩 중...</LoadingMessage>
        ) : (
          <CustomTiptapEditor
            enableImageUpload={false}
            key={`service-terms-${currentDocument?.id || 'new'}`}
            initialContent={content}
            onEditorUpdate={handleEditorUpdate}
            height={600}
          />
        )}
      </EditorContainer>
    </Container>
  );
};

export default ServiceTerms;
