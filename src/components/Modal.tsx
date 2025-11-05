"use client";

import { useEffect } from "react";
import ReactDOM from "react-dom";
import { keyframes, styled } from "styled-components";
/**
 * 주석 이름 / Section: Modal (공통 모달 컴포넌트)
 * 코드 목적 / Purpose: 다양한 상황(알림, 확인, 폼 등)에 재사용 가능한 범용 모달 UI를 제공합니다.
 * 산출물 / Output: header/body/footer 구조의 중앙 고정 모달, showCloseButton 등 옵션 지원 (optional)
 *
 * 시나리오(알고리즘) / Scenario (Algorithm Flow): (optional)
 *   1. isOpen이 true일 때만 Portal로 모달을 렌더링합니다.
 *   2. Overlay 클릭 시 onClose 호출(외부 닫힘 허용), 내부 콘텐츠 클릭은 이벤트 전파 방지 필요.
 *   3. header/body/footer props로 다양한 UI를 커스터마이즈할 수 있습니다.
 *
 * 관련 모듈/클래스 / Related Modules/Classes: BtnElement, AppColors, AppTextStyles 등 (optional)
 * 입력 값 / Input Values: isOpen, onClose, showCloseButton, header, body, footer, 스타일 props 등 (optional)
 * 예외 처리 / Exception Handling: isOpen=false 또는 window 미존재 시 렌더링하지 않음 (optional)
 */




const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Overlay = styled.div<{ $zIndex?: number }>`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: ${({ $zIndex }) => ($zIndex ? $zIndex - 1 : 9997)};
  animation: ${fadeIn} 0.2s ease-out;
  pointer-events: auto;
`;

type ModalProps = {
  $bgColor?: string;
  $padding?: string;
  $borderRadius?: string;
  $width?: string;
  $height?: string;
  $zIndex?: number;
};

const ModalWrapper = styled.div<ModalProps>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  background-color: ${({ $bgColor }) => $bgColor || "#FFFFFF"};
  padding: 0; // 패딩을 제거하고 각 섹션에서 개별 관리
  border-radius: ${({ $borderRadius }) => $borderRadius || "14px"};
  width: ${({ $width }) => $width || "300px"};
  max-width: calc(100vw - 32px); // 좌우 16px씩 여백 확보
  min-width: 280px; // 최소 너비 설정
  height: ${({ $height }) => $height || "auto"};
  max-height: calc(100vh - 32px); // 상하 16px씩 여백 확보
  z-index: ${({ $zIndex }) => $zIndex || 9998};

  display: flex;
  flex-direction: column;
  overflow: hidden; // 내부 스크롤 처리를 위해
`;

const ModalHeader = styled.div`
  padding: 24px 24px 16px 24px;
  text-align: center;
  font-size: 16px;
  font-weight: 760;
  color: #000000;
  white-space: pre-line; // Respect newlines in header content
  flex-shrink: 0; // 헤더 크기 고정
`;

const ModalBody = styled.div`
  padding: 0 24px;
  font-size: 16px;
  line-height: 1.5;
  color: #000000;
  text-align: center;
  flex-grow: 1; // Allow body to take available space
  white-space: pre-line; // Respect newlines in body content
  overflow-y: auto; // 스크롤 처리
  min-height: 0; // flexbox에서 스크롤이 동작하도록
  
  /* 스크롤바 숨김 - Webkit 브라우저 (Chrome, Safari, Edge) */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* 스크롤바 숨김 - Firefox */
  scrollbar-width: none;
  
  /* 스크롤바 숨김 - IE/Edge Legacy */
  -ms-overflow-style: none;
`;

const ModalFooter = styled.div`
  padding: 16px 24px 24px 24px;
  display: flex;
  gap: 12px;
  flex-shrink: 0; // 푸터 크기 고정
  border-top: 1px solid #f0f0f0; // 구분선 추가
`;

type ModalComponentProps = {
  isOpen: boolean;
  onClose?: () => void;
  bgColor?: string;
  padding?: string;
  borderRadius?: string;
  width?: string;
  height?: string;
  zIndex?: number;
  disableOutsideClick?: boolean;

  header?: string;
  body?: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Modal({
  isOpen,
  onClose,
  bgColor,
  padding,
  borderRadius,
  width,
  height,
  zIndex,
  disableOutsideClick = false,
  header,
  body,
  footer,
}: ModalComponentProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC 키 처리
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const modal = (
    <Overlay onClick={disableOutsideClick ? undefined : onClose} $zIndex={zIndex}>
      <ModalWrapper
        $bgColor={bgColor}
        $padding={padding}
        $borderRadius={borderRadius}
        $width={width}
        $height={height}
        $zIndex={zIndex}
        onClick={(e) => e.stopPropagation()} // Prevent overlay close when clicking inside modal
      >
        {header && <ModalHeader>{header}</ModalHeader>}
        <ModalBody>{body}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalWrapper>
    </Overlay>
  );

  if (!isOpen || typeof window === "undefined") return null;

  return ReactDOM.createPortal(modal, document.body);
}
