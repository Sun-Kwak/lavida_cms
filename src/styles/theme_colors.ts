export type ThemeMode = "dark" | "light";

// 색상 테마 객체 정의
export const THEME_COLORS = {
  dark: {
    background: "#4a4d59",
    text: "#FFFFFF",
    primary: "#333544",
    secondary: "#4b4d59",
    accent: "#4EFF63",
    tableBackground: "#333544",
    tableHeaderBackground: "#333544",
    tableRowEven: "#333544",
    tableRowOdd: "#333544",
    tableText: "#FFFFFF",
    tableHeaderText: "#FFFFFF",
    borderColor: "#4b4d59",
    inputBackground: "#333544",
    inputText: "#FFFFFF",
    buttonBackground: "#333544",
    buttonText: "#FFFFFF",
    titleColor: "#4EFF63",
  },
  light: {
    background: "#E6E7E9",
    text: "#000000",
    primary: "#214A72", // 버튼 등에 사용될 기본 색상
    secondary: "#F0F0F0",
    accent: "#214A72", // 강조 색상
    tableBackground: "#FFFFFF",
    tableHeaderBackground: "#FFFFFF",
    tableRowEven: "#FFFFFF",
    tableRowOdd: "#F0F0F0", // 약간 다른 회색으로 변경
    tableText: "#000000",
    tableHeaderText: "#000000",
    borderColor: "#E0E0E0",
    inputBackground: "#FFFFFF", // 입력 배경 흰색
    inputText: "#000000",
    buttonBackground: "#214A72", // 기본 버튼 배경
    buttonText: "#FFFFFF", // 기본 버튼 텍스트
    titleColor: "#000000",
  },
};