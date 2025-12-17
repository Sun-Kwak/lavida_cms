import React, { useEffect } from "react";
import styled from "styled-components";
import { AppColors } from "../styles/colors";
import CmsPopupBtn, { CmsPopupBtnType } from "./CmsPopupBtn";

type CmsPopupProps = {
  title?: string;
  titleComponent?: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  isWide?: boolean;
  showRequiredMark?: boolean;
  height?: string | null;
  width?: string | null;
  backgroundColor?: string;
  closeOnOutsideClick?: boolean; // 외부 클릭 시 닫기 여부 (기본값: false)
  leftButtons?: Array<{
    label: string;
    onClick: () => void;
    type?: CmsPopupBtnType;
  }>;
  rightButtons?: Array<{
    label: string;
    onClick: () => void;
    type?: CmsPopupBtnType;
  }>;
  // 기존 버튼 props는 하위 호환을 위해 유지
  leftButton?: {
    label: string;
    onClick: () => void;
  };
  rightButton?: {
    label: string;
    onClick: () => void;
  };
  centerButton?: {
    label: string;
    onClick: () => void;
  };
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10001;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: flex-start; /* 왼쪽 정렬로 스크롤 시 왼쪽부터 보임 */
  padding: 20px;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  
  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

const PopupContainer = styled.div<{
  $isWide?: boolean;
  $hasBottomFloating?: boolean;
  $customHeight?: string | null;
  $customWidth?: string | null;
  $backgroundColor?: string;
}>`
  position: relative;
  width: ${({ $customWidth, $isWide }) => $customWidth ?? ($isWide ? "1100px" : "800px")};
  min-width: ${({ $customWidth, $isWide }) => $customWidth ?? ($isWide ? "1100px" : "800px")};
  max-width: none; /* 스크롤을 위해 max-width 제거 */
  height: ${({ $customHeight }) => $customHeight ?? "80vh"};
  max-height: calc(100vh - 40px);
  background: ${({ $backgroundColor }) => $backgroundColor ?? "#ffffff"};
  border-radius: 8px;
  padding-bottom: ${({ $hasBottomFloating }) => ($hasBottomFloating ? "100px" : "0")};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  
  /* 화면이 충분히 클 때는 가운데 정렬 */
  margin-left: max(0px, calc((100vw - ${({ $customWidth, $isWide }) => $customWidth ?? ($isWide ? "1100px" : "800px")} - 40px) / 2));
  margin-right: auto;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  /* background-color: rgba(251, 249, 242, 0.98); */
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  /* min-height: 60px; */
`;

const CloseButton = styled.button`
  font-size: 24px;
  border: none;
  background: transparent;
  color: #000000;
  cursor: pointer;
  z-index: 10;

  &:hover {
    color: #000;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 50%;
  }
`;

const RequiredMark = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${AppColors.error};
  margin-left: 8px;
`;

const PopupContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  padding-top: 0;
  background-color: #fff;

  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const BottomFloatingWrapper = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 20;
  background: #fff;
  padding: 16px 24px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LeftButtonSection = styled.div`
  display: flex;
  gap: 12px;
`;

const RightButtonSection = styled.div`
  display: flex;
  gap: 12px;
`;

const CmsPopup: React.FC<CmsPopupProps> = ({
  title,
  titleComponent,
  children,
  isOpen,
  onClose,
  isWide,
  showRequiredMark = false,
  height,
  width,
  backgroundColor,
  closeOnOutsideClick = false, // 기본값: 외부 클릭으로 닫히지 않음
  leftButtons,
  rightButtons,
  // 기존 버튼 props (하위 호환)
  leftButton,
  rightButton,
  centerButton,
}) => {
  // ESC 키로 팝업 닫기
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 새로운 버튼 구조 사용 여부 확인
  const useNewButtonStructure = leftButtons || rightButtons;
  
  // 기존 버튼들을 새로운 구조로 변환 (하위 호환)
  const finalLeftButtons = leftButtons || (leftButton ? [leftButton] : []);
  const finalRightButtons = rightButtons || (rightButton ? [rightButton] : []);
  
  // center button이 있을 경우 right에 추가
  if (centerButton && !useNewButtonStructure) {
    finalRightButtons.push(centerButton);
  }

  const hasButtons = finalLeftButtons.length > 0 || finalRightButtons.length > 0;

  return (
    <Overlay 
      onClick={(e) => {
        // closeOnOutsideClick이 true일 때만 외부 클릭으로 모달 닫기
        if (closeOnOutsideClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <PopupContainer
        data-popup-container="true"
        $isWide={isWide}
        $hasBottomFloating={hasButtons}
        $customHeight={height ?? null}
        $customWidth={width ?? null}
        $backgroundColor={backgroundColor}
      >
        {(title || titleComponent) && (
          <HeaderRow>
            {title ? (
              <span>
                {title}
                {showRequiredMark && <RequiredMark>*필수값</RequiredMark>}
              </span>
            ) : (
              titleComponent
            )}
            <CloseButton onClick={onClose} aria-label="닫기">
              ×
            </CloseButton>
          </HeaderRow>
        )}

        <PopupContent>{children}</PopupContent>
        
        {hasButtons && (
          <BottomFloatingWrapper>
            <LeftButtonSection>
              {finalLeftButtons.map((button, index) => {
                const buttonType = ('type' in button ? button.type : 
                  (button.label === '삭제' ? CmsPopupBtnType.SECONDARY : CmsPopupBtnType.PRIMARY)) as CmsPopupBtnType;
                return (
                  <CmsPopupBtn
                    key={index}
                    type={buttonType}
                    onClick={button.onClick}
                  >
                    {button.label}
                  </CmsPopupBtn>
                );
              })}
            </LeftButtonSection>
            
            <RightButtonSection>
              {finalRightButtons.map((button, index) => {
                const buttonType = ('type' in button ? button.type : 
                  (button.label === '닫기' || button.label === '취소' ? CmsPopupBtnType.SECONDARY : CmsPopupBtnType.PRIMARY)) as CmsPopupBtnType;
                return (
                  <CmsPopupBtn
                    key={index}
                    type={buttonType}
                    onClick={button.onClick}
                  >
                    {button.label}
                  </CmsPopupBtn>
                );
              })}
            </RightButtonSection>
          </BottomFloatingWrapper>
        )}
      </PopupContainer>
    </Overlay>
  );
};

export default CmsPopup;
