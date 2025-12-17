import React, { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import CMSLayout from "../../../components/CMSLayout";
import { devLog } from "../../../utils/devLogger";
import CustomTiptapEditor from "../../../components/Editor/CustomTiptapEditor";
import { toast } from "react-toastify";
import { dbManager, TermsDocument } from "../../../utils/indexedDB";

type DocumentType = "privacy_policy" | "terms_of_service" | "business_info" | "marketing_consent" | "member_terms" | "contract";

interface DocumentTab {
  type: DocumentType;
  label: string;
  description: string;
}

const DOCUMENT_TABS: DocumentTab[] = [
  { type: "privacy_policy", label: "개인정보 처리방침", description: "개인정보 수집, 이용, 처리에 관한 방침" },
  { type: "terms_of_service", label: "서비스 이용약관", description: "서비스 이용에 관한 약관" },
  { type: "business_info", label: "사업자 정보", description: "사업자 등록 정보 및 연락처" },
  { type: "marketing_consent", label: "마케팅 활용 동의", description: "마케팅 목적의 개인정보 활용 동의서" },
  { type: "member_terms", label: "회원 이용약관", description: "회원가입 및 회원 서비스 이용약관" },
  { type: "contract", label: "계약서", description: "서비스 계약서 템플릿" }
];

const TermsPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<DocumentType>("privacy_policy");
  const [content, setContent] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [currentDocument, setCurrentDocument] = useState<TermsDocument | null>(null);
  const [allDocuments, setAllDocuments] = useState<TermsDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 문서 목록 로딩
  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // IndexedDB 연결 상태 확인
      if (!dbManager.isConnected) {
        devLog("IndexedDB가 연결되지 않음, 재연결 시도 중...");
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        if (!dbManager.isConnected) {
          throw new Error("IndexedDB 연결에 실패했습니다. 페이지를 새로고침해주세요.");
        }
      }
      
      const documents = await dbManager.terms.getAllTermsDocuments();
      setAllDocuments(documents);
      devLog("문서 목록 로딩 완료:", documents);
      devLog("IndexedDB 연결 상태:", dbManager.isConnected);
      devLog("IndexedDB 버전:", dbManager.dbVersion);
    } catch (err: any) {
      devLog("문서 목록 로딩 실패:", err);
      const errorMessage = err.message || "문서 목록을 불러오는데 실패했습니다.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 선택된 탭에 해당하는 문서 로딩
  const loadCurrentDocument = useCallback(async () => {
    try {
      const activeDoc = await dbManager.terms.getActiveTermsDocument(selectedTab);
      if (activeDoc) {
        setCurrentDocument(activeDoc);
        setContent(activeDoc.content);
        setTitle(activeDoc.title);
        devLog("현재 문서 로딩:", activeDoc);
      } else {
        // 해당 타입의 활성 문서가 없으면 기본값 설정
        const currentTabInfo = DOCUMENT_TABS.find(tab => tab.type === selectedTab);
        const defaultTitle = currentTabInfo?.label || "";
        
        setCurrentDocument(null);
        setContent("");
        setTitle(defaultTitle);
        devLog("새 문서 생성 준비:", { selectedTab, defaultTitle });
      }
    } catch (err: any) {
      devLog("현재 문서 로딩 실패:", err);
      toast.error("문서를 불러오는데 실패했습니다.");
    }
  }, [selectedTab]);

  // 문서 저장
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("문서 제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      toast.error("문서 내용을 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      devLog("문서 저장 시작:", { 
        selectedTab, 
        title,
        contentLength: content.length,
        isNewDocument: !currentDocument
      });

      if (currentDocument) {
        // 기존 문서 수정
        const updatedDoc = await dbManager.terms.updateTermsDocument(currentDocument.id, {
          title: title.trim(),
          content: content.trim(),
          isActive: true
        });

        if (updatedDoc) {
          setCurrentDocument(updatedDoc);
          toast.success("문서가 성공적으로 수정되었습니다!");
          devLog("문서 수정 성공:", updatedDoc);
        }
      } else {
        // 새 문서 생성
        const newDoc = await dbManager.terms.addTermsDocument({
          type: selectedTab,
          title: title.trim(),
          content: content.trim(),
          isActive: true
        });

        setCurrentDocument(newDoc);
        toast.success("문서가 성공적으로 저장되었습니다!");
        devLog("새 문서 생성 성공:", newDoc);
      }

      // 문서 목록 새로고침
      await loadDocuments();
      
    } catch (err: any) {
      devLog("문서 저장 실패:", err);
      toast.error(`문서 저장에 실패했습니다: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 문서 삭제
  const handleDelete = async () => {
    if (!currentDocument) {
      toast.error("삭제할 문서가 없습니다.");
      return;
    }

    if (!window.confirm("정말로 이 문서를 삭제하시겠습니까?")) {
      return;
    }

    try {
      setIsLoading(true);
      await dbManager.terms.deleteTermsDocument(currentDocument.id);
      
      toast.success("문서가 성공적으로 삭제되었습니다!");
      devLog("문서 삭제 성공:", currentDocument.id);

      // 상태 초기화
      setCurrentDocument(null);
      setContent("");
      const currentTabInfo = DOCUMENT_TABS.find(tab => tab.type === selectedTab);
      const defaultTitle = currentTabInfo?.label || "";
      setTitle(defaultTitle);

      // 문서 목록 새로고침
      await loadDocuments();
      
    } catch (err: any) {
      devLog("문서 삭제 실패:", err);
      toast.error(`문서 삭제에 실패했습니다: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 새 버전 생성
  const handleCreateNewVersion = async () => {
    if (!currentDocument) {
      toast.error("기반이 될 문서가 없습니다.");
      return;
    }

    try {
      setIsLoading(true);
      
      const newDoc = await dbManager.terms.addTermsDocument({
        type: currentDocument.type,
        title: currentDocument.title,
        content: currentDocument.content,
        isActive: true
      });

      setCurrentDocument(newDoc);
      toast.success(`새 버전 (v${newDoc.version})이 생성되었습니다!`);
      devLog("새 버전 생성 성공:", newDoc);

      // 문서 목록 새로고침
      await loadDocuments();
      
    } catch (err: any) {
      devLog("새 버전 생성 실패:", err);
      toast.error(`새 버전 생성에 실패했습니다: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 탭 클릭 핸들러
  const handleTabClick = (documentType: DocumentType) => {
    setSelectedTab(documentType);
    devLog("탭 변경:", { documentType });
  };

  // 에디터 내용 업데이트 핸들러
  const handleEditorUpdate = (newContent: string) => {
    setContent(newContent);
  };

  // 제목 변경 핸들러
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  // 컴포넌트 마운트 시 문서 목록 로딩
  useEffect(() => {
    const initializeData = async () => {
      devLog("약관 페이지 초기화 시작");
      devLog("IndexedDB 연결 상태:", dbManager.isConnected);
      devLog("IndexedDB 버전:", dbManager.dbVersion);
      
      // IndexedDB가 연결되지 않은 경우 잠시 대기 후 재시도
      if (!dbManager.isConnected) {
        devLog("IndexedDB 연결 대기 중...");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      await loadDocuments();
    };
    
    initializeData();
  }, []);

  // 탭이 변경될 때 현재 문서 로딩
  useEffect(() => {
    loadCurrentDocument();
  }, [selectedTab, loadCurrentDocument]);

  // 현재 탭 정보
  const currentTabInfo = DOCUMENT_TABS.find(tab => tab.type === selectedTab);

  // 현재 선택된 타입의 모든 버전
  const currentTypeDocuments = allDocuments.filter(
    doc => doc.type === selectedTab
  ).sort((a, b) => b.version - a.version);

  return (
    <CMSLayout currentPath="/cms/terms">
      <TermsPageContainer>
        {error && (
          <ErrorMessage>
            <strong>오류 발생:</strong> {error}
            <br />
            <small>
              IndexedDB 연결 상태: {dbManager.isConnected ? '연결됨' : '연결 안됨'} | 
              버전: {dbManager.dbVersion}
            </small>
            <br />
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                marginTop: '8px', 
                padding: '4px 8px', 
                fontSize: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              페이지 새로고침
            </button>
          </ErrorMessage>
        )}
        
        {/* 문서 타입 탭 */}
        <TabContainer>
          {DOCUMENT_TABS.map((tab) => (
            <TabButton 
              key={tab.type}
              $isActive={selectedTab === tab.type} 
              onClick={() => handleTabClick(tab.type)}
              title={tab.description}
            >
              {tab.label}
            </TabButton>
          ))}
        </TabContainer>

        {/* 문서 정보 */}
        <DocumentInfoContainer>
          <DocumentMetaInfo>
            {currentDocument && (
              <>
                <InfoItem>
                  <InfoLabel>버전:</InfoLabel>
                  <InfoValue>v{currentDocument.version}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>생성일:</InfoLabel>
                  <InfoValue>{currentDocument.createdAt.toLocaleDateString('ko-KR')}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>수정일:</InfoLabel>
                  <InfoValue>{currentDocument.updatedAt.toLocaleDateString('ko-KR')}</InfoValue>
                </InfoItem>
                {currentDocument.publishedAt && (
                  <InfoItem>
                    <InfoLabel>발행일:</InfoLabel>
                    <InfoValue>{currentDocument.publishedAt.toLocaleDateString('ko-KR')}</InfoValue>
                  </InfoItem>
                )}
              </>
            )}
          </DocumentMetaInfo>
        </DocumentInfoContainer>

        {/* 제목 입력 */}
        <TitleContainer>
          <TitleLabel>문서 제목:</TitleLabel>
          <TitleInput
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="문서 제목을 입력하세요"
          />
        </TitleContainer>

        {/* 버전 관리 */}
        {currentTypeDocuments.length > 0 && (
          <VersionContainer>
            <VersionLabel>기존 버전:</VersionLabel>
            <VersionList>
              {currentTypeDocuments.map((doc) => (
                <VersionItem 
                  key={doc.id}
                  $isActive={currentDocument?.id === doc.id}
                  onClick={() => {
                    setCurrentDocument(doc);
                    setContent(doc.content);
                    setTitle(doc.title);
                  }}
                >
                  v{doc.version} {doc.isActive && <ActiveBadge>활성</ActiveBadge>}
                  <VersionDate>{doc.updatedAt.toLocaleDateString('ko-KR')}</VersionDate>
                </VersionItem>
              ))}
            </VersionList>
          </VersionContainer>
        )}

        {/* 버튼 컨테이너 */}
        <ButtonContainer>
          <ActionButton 
            onClick={handleSave} 
            disabled={isLoading}
            $variant="save"
          >
            {isLoading ? "저장 중..." : currentDocument ? "수정하기" : "새로 저장"}
          </ActionButton>
          
          {currentDocument && (
            <>
              <ActionButton 
                onClick={handleCreateNewVersion} 
                disabled={isLoading}
                $variant="version"
              >
                새 버전 생성
              </ActionButton>
              
              <ActionButton 
                onClick={handleDelete} 
                disabled={isLoading}
                $variant="delete"
              >
                삭제하기
              </ActionButton>
            </>
          )}
        </ButtonContainer>

        {/* 문서 설명 */}
        <DocumentDescription>
          <DescriptionTitle>{currentTabInfo?.label}</DescriptionTitle>
          <DescriptionText>{currentTabInfo?.description}</DescriptionText>
        </DocumentDescription>

        {/* 에디터 */}
        <EditorContainer>
          {isLoading ? (
            <LoadingMessage>로딩 중...</LoadingMessage>
          ) : (
            <EditorWrapper>
              <CustomTiptapEditor
                enableImageUpload={false}
                key={`${selectedTab}-${currentDocument?.id || 'new'}`}
                initialContent={content}
                onEditorUpdate={handleEditorUpdate}
                height={700}
              />
            </EditorWrapper>
          )}
        </EditorContainer>
      </TermsPageContainer>
    </CMSLayout>
  );
};

const TermsPageContainer = styled.div`
  min-width: 1200px;
  width: 100%;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px;
  border-radius: 8px;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background-color: ${({ $isActive }) => ($isActive ? "#000000" : "#f8f9fa")};
  color: ${({ $isActive }) => ($isActive ? "#ffffff" : "#666666")};
  font-size: 13px;
  font-weight: ${({ $isActive }) => ($isActive ? "bold" : "normal")};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ $isActive }) => ($isActive ? "#000000" : "#e9ecef")};
    color: ${({ $isActive }) => ($isActive ? "#ffffff" : "#333333")};
  }
`;

const DocumentInfoContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
`;

const DocumentMetaInfo = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 12px;
  color: #495057;
  font-weight: 600;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
`;

const TitleLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #495057;
`;

const TitleInput = styled.input`
  padding: 12px 16px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
`;

const VersionContainer = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
`;

const VersionLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 12px;
`;

const VersionList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const VersionItem = styled.button<{ $isActive: boolean }>`
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background-color: ${({ $isActive }) => ($isActive ? "#28a745" : "#ffffff")};
  color: ${({ $isActive }) => ($isActive ? "#ffffff" : "#495057")};
  font-size: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ $isActive }) => ($isActive ? "#28a745" : "#e9ecef")};
  }
`;

const ActiveBadge = styled.span`
  background-color: #dc3545;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
`;

const VersionDate = styled.span`
  font-size: 10px;
  opacity: 0.7;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant: 'save' | 'version' | 'delete' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;

  ${({ $variant }) => {
    switch ($variant) {
      case 'save':
        return `
          background-color: #007bff;
          color: white;
          &:hover { background-color: #0056b3; }
          &:disabled { background-color: #6c757d; cursor: not-allowed; }
        `;
      case 'version':
        return `
          background-color: #28a745;
          color: white;
          &:hover { background-color: #1e7e34; }
          &:disabled { background-color: #6c757d; cursor: not-allowed; }
        `;
      case 'delete':
        return `
          background-color: #dc3545;
          color: white;
          &:hover { background-color: #bd2130; }
          &:disabled { background-color: #6c757d; cursor: not-allowed; }
        `;
      default:
        return `
          background-color: #6c757d;
          color: white;
          &:hover { background-color: #545b62; }
        `;
    }
  }}
`;

const DocumentDescription = styled.div`
  padding: 16px;
  background-color: #e7f3ff;
  border-left: 4px solid #007bff;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const DescriptionTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #007bff;
`;

const DescriptionText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #495057;
  line-height: 1.5;
`;

const EditorContainer = styled.div`
  background-color: transparent;
  border-radius: 8px;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const EditorWrapper = styled.div`
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #6c757d;
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
`;

export default TermsPage;
