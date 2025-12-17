import React from 'react';
import { useParams } from 'react-router-dom';
import StaffRegister from './StaffRegister';
import StaffSearch from './StaffSearch';

const StaffPage: React.FC = () => {
  const { action } = useParams<{ action: string }>();

  switch (action) {
    case 'register':
      return <StaffRegister />;
    case 'search':
      return <StaffSearch />;
    default:
      return <StaffSearch />; // 기본적으로 검색 페이지 표시
  }
};

export default StaffPage;
