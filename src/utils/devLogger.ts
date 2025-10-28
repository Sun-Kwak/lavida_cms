// src/lib/utils/devLogger.ts

/**
 * 개발 또는 테스트 환경에서만 콘솔 로그를 출력하는 유틸 함수
 * - development 환경
 * - http 프로토콜 (테스트 서버 등)
 */

const isLocalDev =
  typeof window !== 'undefined'
    ? process.env.NODE_ENV === 'development' || window.location.protocol === 'http:'
    : process.env.NODE_ENV === 'development';

export const devLog = (...args: any[]) => {
  if (isLocalDev) {
    console.log(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (isLocalDev) {
    console.warn(...args);
  }
};

export const devError = (...args: any[]) => {
  if (isLocalDev) {
    console.error(...args);
  }
};
