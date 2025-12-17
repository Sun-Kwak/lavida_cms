'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type AdminAuthContextType = {
  isLoggedIn: boolean;
  ready: boolean;
  accessToken: string | null;
  login: (id: string, token: string) => void;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);
let externalLogout: (() => void) | null = null;

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // sessionStorage에서 로그인 상태 및 토큰 확인
    const adminId = sessionStorage.getItem('adminId');
    const token = sessionStorage.getItem('accessToken');
    
    console.log('AdminAuthContext 초기화:', { adminId, hasToken: !!token });
    
    if (adminId && token) {
      setIsLoggedIn(true);
      setAccessToken(token);
    }
    
    setReady(true);
  }, []);

  const login = (id: string, token: string) => {
    // 유효한 토큰인지 확인
    if (!token || token.trim() === '') {
      console.error('유효하지 않은 토큰:', token);
      return;
    }
    
    console.log('관리자 로그인 저장:', { id, token: '존재함' });
    
    // sessionStorage에 사용자 정보와 토큰 저장
    sessionStorage.setItem('adminId', id);
    sessionStorage.setItem('accessToken', token);
    setIsLoggedIn(true);
    setAccessToken(token);
  };

  const logout = () => {
    console.log('관리자 로그아웃 처리');
    
    // sessionStorage 정리 및 상태 업데이트
    sessionStorage.removeItem('adminId');
    sessionStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setAccessToken(null);
  };

  // 외부에서 사용할 수 있게 등록
  externalLogout = logout;

  return (
    <AdminAuthContext.Provider value={{ isLoggedIn, ready, accessToken, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// 외부에서 호출 가능하도록 export
export const triggerAdminLogout = () => {
  if (externalLogout) externalLogout();
};

// 외부에서 토큰을 가져올 수 있는 헬퍼 함수
export const getAdminAccessToken = (): string | null => {
  return sessionStorage.getItem('accessToken');
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return context;
};
