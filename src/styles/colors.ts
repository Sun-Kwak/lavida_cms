export const AppColors = {

  // 기본색상 - 브랜드 컬러 기반
  // Base Colors
  primary: "#37bbd6", // 브랜드 컬러
  secondary: "#2a9bb5", // 조금 더 어두운 청록색
  tertiary: "#4dc8dd", // 조금 더 밝은 청록색
  background: "#ffffff",
  surface: "#FFFFFF",

  // 텍스트 또는 any on 기본색상
  // Text or any content on base colors
  onPrimary: "#ffffff", // 브랜드 컬러 위의 텍스트는 흰색
  onSecondary: "#FFFFFF",
  onTertiary: "#000000",
  onBackground: "#000000",
  onSurface: "#000000",

  // 상태
  // Status Colors
  disabled: "#AEa9A6",
  error: "#f75226",
  success: "#25c800",
  warning: "#e79E00",
  info: "#37bbd6", // 브랜드 컬러를 info 색상으로도 사용

  // 버튼 - 브랜드 컬러 기반
  // Button Colors
  buttonPrimary: "#37bbd6", // 브랜드 컬러
  buttonPrimaryHover: "#2a9bb5", // 호버 시 더 어두운 색
  buttonPrimaryActive: "#1e7a8a", // 클릭 시 가장 어두운 색
  buttonSecondary: "#4dc8dd", // 보조 버튼
  buttonSecondaryHover: "#37bbd6", // 보조 버튼 호버
  buttonSecondaryActive: "#2a9bb5", // 보조 버튼 클릭
  buttonDisabled: "#E0E0E0",

  // 테그 - 브랜드 컬러 톤 적용
  // Tag Colors
  tagPrimary: "#37bbd6",
  tagSuccess: "#4CAF50",
  tagWarning: "#FFC107",
  tagError: "#B00020",
  tagInfo: "#4dc8dd",
  tagActive: "#2a9bb5",
  tagDisabled: "#9E9E9E",

  // 네비게이션 - 브랜드 컬러
  // Navigation
  navigationBackground: "#37bbd6",
  navigationText: "#FFFFFF",

  // 아이콘 - 브랜드 컬러 톤
  // Icon Colors
  iconPrimary: "#37bbd6",
  iconSecondary: "#2a9bb5",
  iconTertiary: "#4dc8dd",
  iconSuccess: "#4CAF50",
  iconWarning: "#FFC107",
  iconError: "#B00020",
  iconDisabled: "#9E9E9E",

  // 보더 - 브랜드 컬러와 조화
  // Border Colors
  borderLight: "#E0E0E0",
  borderDark: "#9E9E9E",
  borderError: "#B00020",
  borderPrimary: "#37bbd6", // 브랜드 컬러 보더 추가

  // 기타
  // Others / Miscellaneous
  divider: "#E0E0E0",
  overlay: "#000000",
  shadowLight: "#E0E0E0",
  shadowMedium: "#B0BEC5",
  shadowDark: "#78909C",

  link: "#37bbd6", // 브랜드 컬러로 링크 색상
  linkHover: "#2a9bb5",
  linkActive: "#1e7a8a",
  linkDisabled: "#9E9E9E",

  hoverText: '#2a9bb5', // 브랜드 컬러 톤
  border: '#b8e6f0', // 브랜드 컬러의 밝은 톤
  
  input: '#ffffff',
  onInput1 : '#B3B3B3',
  onInput2: '#666666',
  onInput3: '#262626',
  onInput4: '#ED2424',
  onInput5: '#949494',

  // 브랜드 컬러 기반 버튼들
  btnA : '#37bbd6', // 브랜드 컬러
  btnAHover: '#2a9bb5',
  btnAActive: '#1e7a8a',
  onBtnA: '#FFFFFF',

  btnC : '#f3f3f3',
  onBtnC: '#949494',
  btnCEmphasis: '#f0fbfc', // 브랜드 컬러의 매우 밝은 톤
  onBtnCEmphasis: '#2a9bb5',

  btnE : '#b8e6f0', // 브랜드 컬러의 밝은 톤
  onBtnE: '#1e7a8a', // 브랜드 컬러의 어두운 톤
  btnE_Disabled: '#CCCCCC',
  onBtnE_Disabled: '#949494',
  btnE_Hover: '#37bbd6', // 브랜드 컬러
  onBtnE_Hover: '#FFFFFF',

  onPopup: '#f3f3f3',

} as const;
