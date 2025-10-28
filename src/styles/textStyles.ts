// src/lib/styles/textStyles.ts

/**
 * AppTextStyles는 애플리케이션 전반에 걸쳐 사용하는 텍스트 스타일을 정의합니다.
 * 텍스트 계층 구조를 통일하고, UI 전반에 일관된 타이포그래피를 적용하기 위한 목적으로 사용됩니다.
 * 변수명은 유지하고, 값은 프로젝트 디자인 가이드에 맞게 변경해주세요
 * AppTextStyles defines the text styles used throughout the application.
 * It ensures a consistent typography system and text hierarchy across the UI.
 * Please keep the variable names and change the values according to your project design guidelines.
 */

export const AppTextStyles = {
  // Display (히어로 영역, 페이지 메인 타이틀)
  // Display (Hero sections, main page titles)
  display1: {
    fontSize: "57px",
    fontWeight: 400,
    lineHeight: "64px",
  },
  display2: {
    fontSize: "45px",
    fontWeight: 400,
    lineHeight: "52px",
  },
  display3: {
    fontSize: "36px",
    fontWeight: 400,
    lineHeight: "44px",
  },

  // Headline (섹션 타이틀, 구역 헤더)
  // Headline (Section titles, area headers)
  headline1: {
    fontSize: "32px",
    fontWeight: 400,
    lineHeight: "40px",
  },
  headline2: {
    fontSize: "28px",
    fontWeight: 400,
    lineHeight: "36px",
  },
  headline3: {
    fontSize: "24px",
    fontWeight: 400,
    lineHeight: "32px",
  },

  // Title (카드, 폼 타이틀 등)
  // Title (Card titles, form headers, etc.)
  title1: {
    fontSize: "32px",
    fontWeight: 700,
    lineHeight: "45px",
  },
  title2: {
    fontSize: "24px",
    fontWeight: 700,
    lineHeight: "33.6px",
  },
  title3: {
    fontSize: "18px",
    fontWeight: 700,
    lineHeight: "22px",
  },

  // Body (본문)
  // Body (Main content text)
  body1: {
    fontSize: "16px",
    fontWeight: 400,
    lineHeight: "24px",
  },
  body2: {
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: "20px",
  },
  body3: {
    fontSize: "13px",
    fontWeight: 400,
    lineHeight: "16px",
  },

  // Label (버튼, 태그, UI 요소)
  // Label (Buttons, tags, UI elements)
  label1: {
    fontSize: "15px",
    fontWeight: 500,
    lineHeight: "18px",
  },
  label2: {
    fontSize: "12px",
    fontWeight: 500,
    lineHeight: "16px",
  },
  label3: {
    fontSize: "11px",
    fontWeight: 500,
    lineHeight: "16px",
  },

  // *************** 추가 ***********
  // Additional Styles
  // 프로젝트에 필요한 추가적인 텍스트 스타일을 여기에 정의할 수 있습니다.
  // You can define additional text styles needed for your project here.

  nav1: {
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: "14px",
  },
} as const;
