import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { ThemeMode } from "../../styles/theme_colors";
import { devLog } from "../../utils/devLogger";

type DropdownProps = {
  value: number;
  onChange: (value: number) => void;
  options: number[];
  setCurrentPage?: React.Dispatch<React.SetStateAction<number>>;
  themeMode?: ThemeMode;
  triggerIcon?: React.ReactNode | null; // ✅ 아이콘 추가
  closeOnResize?: boolean; // 리사이즈 시 닫을지 여부 (기본: true)
  updatePositionOnResize?: boolean; // 리사이즈 시 위치 업데이트 여부 (기본: false)
};

const DropdownCustom: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  setCurrentPage,
  themeMode = "dark",
  triggerIcon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // 디버깅을 위한 콘솔 출력
  devLog('DropdownCustom - value:', value, 'options:', options, 'isOpen:', isOpen);

  const updateDropdownPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  // 클릭 외부 감지 및 윈도우 리사이즈 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      // 화면 크기가 변경되면 드롭다운을 닫음
      setIsOpen(false);
    };

    const handleScroll = () => {
      // 스크롤 시 위치를 업데이트
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleResize);
      // 모든 스크롤 가능한 요소에서 스크롤 이벤트 감지
      document.addEventListener('scroll', handleScroll, true); // true로 캡쳐 단계에서도 감지
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  return (
    <>
      <DropdownContainer ref={containerRef}>
        <DropdownHeader onClick={handleToggle} $themeMode={themeMode}>
          {triggerIcon ?? value}
          <MarginTop>
            ▼
          </MarginTop>
        </DropdownHeader>
      </DropdownContainer>

      {isOpen && (
        <DropdownList 
          ref={dropdownRef}
          $themeMode={themeMode}
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          {options.map((option) => (
            <DropdownItem
              key={option}
              onClick={() => {
                devLog('Option clicked:', option); // 디버깅 로그
                onChange(option);
                setIsOpen(false);
                if (setCurrentPage) setCurrentPage(1);
              }}
              $themeMode={themeMode}
            >
              {option}
            </DropdownItem>
          ))}
        </DropdownList>
      )}
    </>
  );
};

export default DropdownCustom;

// 스타일 그대로 사용
const DropdownContainer = styled.div`
  position: relative;
  width: 70px; /* 너비를 60px에서 70px로 증가 */
  font-family: "Pretendard Variable", sans-serif;
  z-index: 9999; /* z-index를 매우 높게 설정 */
`;

const MarginTop = styled.div`
  margin-top: 8px;
`;

const DropdownHeader = styled.div<{ $themeMode: ThemeMode }>`
  width: 100%;
  height: 28px;
  padding: 5px;
  border: none;
  background-color: #ffffff;
  color: ${({ $themeMode }) => ($themeMode === "light" ? "#000000" : "#FFFFFF")};
  font-size: 16px;
  text-align: center;
  cursor: pointer;
  border-radius: 0;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;

  &:hover {
    background-color: ${({ $themeMode }) => ($themeMode === "light" ? "#f0f0f0" : "#424451")};
  }
`;

const DropdownList = styled.ul<{ $themeMode: ThemeMode }>`
  position: fixed; /* absolute에서 fixed로 변경하여 viewport 기준으로 위치 */
  width: 70px; /* 부모와 같은 너비 */
  background-color: ${({ $themeMode }) => ($themeMode === "light" ? "white" : "#333544")};
  border: 1px solid ${({ $themeMode }) => ($themeMode === "light" ? "#ccc" : "#424451")};
  border-bottom: none; /* 아래쪽 경계선 제거 */
  list-style: none;
  padding: 0;
  margin: 0;
  z-index: 99999; /* z-index 값을 매우 높게 설정 */
  max-height: 200px; /* 최대 높이 설정 */
  overflow-y: auto; /* 스크롤 가능하도록 */
  box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1); /* 위쪽 그림자 추가 */
`;

const DropdownItem = styled.li<{ $themeMode: ThemeMode }>`
  padding: 8px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 0;
  color: ${({ $themeMode }) => ($themeMode === "light" ? "#000000" : "#FFFFFF")};

  &:hover {
    background-color: ${({ $themeMode }) => ($themeMode === "light" ? "#e0e0e0" : "#424451")};
  }
`;
