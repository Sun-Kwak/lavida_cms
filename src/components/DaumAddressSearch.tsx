import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AddressInfo } from '../pages/CMS/Member/types';

interface DaumAddressSearchProps {
  onAddressSelect: (addressInfo: AddressInfo) => void;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
}

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 100px 0 16px;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 14px;
  box-sizing: border-box;
  cursor: pointer;
  background-color: white;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }
  
  &:disabled {
    background-color: #f5f5f5;
    color: #999;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background-color: #0056b3;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const AddressDetails = styled.div`
  margin-top: 8px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
`;

declare global {
  interface Window {
    daum: any;
  }
}

const DaumAddressSearch: React.FC<DaumAddressSearchProps> = ({
  onAddressSelect,
  placeholder = "클릭하여 주소를 검색하세요",
  disabled = false,
  value = ""
}) => {
  const [address, setAddress] = useState(value);
  const [addressDetails, setAddressDetails] = useState<AddressInfo | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    setAddress(value);
  }, [value]);

  useEffect(() => {
    // Daum 우편번호 서비스 스크립트 로드
    const loadDaumScript = () => {
      if (window.daum && window.daum.Postcode) {
        setIsScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      script.onload = () => {
        setIsScriptLoaded(true);
      };
      script.onerror = () => {
        console.error('Daum 우편번호 서비스 스크립트 로드 실패');
      };
      document.head.appendChild(script);
    };

    loadDaumScript();
  }, []);

  const handleSearch = () => {
    if (!isScriptLoaded || !window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data: any) {
        console.log('Daum 주소 데이터:', data); // 디버깅용 로그
        
        // 도로명 주소 또는 지번 주소 선택
        const fullAddress = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
        
        // 시군구 코드는 법정동 코드에서 추출 (앞 5자리)
        const sigunguCode = data.bcode ? data.bcode.substring(0, 5) : '';
        
        // 동 정보는 법정동명 우선, 없으면 행정동명
        const dong = data.bname || data.hname || '';

        const addressInfo: AddressInfo = {
          address: fullAddress,
          sigunguCode: sigunguCode,
          dong: dong,
          roadAddress: data.roadAddress || '',
          jibunAddress: data.jibunAddress || ''
        };

        console.log('추출된 주소 정보:', addressInfo); // 디버깅용 로그

        setAddress(fullAddress);
        setAddressDetails(addressInfo);
        onAddressSelect(addressInfo);
      },
      onresize: function(size: any) {
        // 팝업 크기 조정 시 처리할 내용
      },
      width: '100%',
      height: '100%',
      theme: {
        bgColor: "#FFFFFF", // 배경색
        searchBgColor: "#0B65C8", // 검색창 배경색
        contentBgColor: "#FFFFFF", // 본문 배경색
        pageBgColor: "#FAFAFA", // 페이지 배경색
        textColor: "#333333", // 기본 글자색
        queryTextColor: "#FFFFFF", // 검색창 글자색
        postcodeTextColor: "#FA4256", // 우편번호 글자색
        emphTextColor: "#008BD3", // 강조 글자색
        outlineColor: "#E0E0E0" // 테두리
      }
    }).open();
  };

  return (
    <SearchContainer>
      <SearchInput
        type="text"
        value={address}
        onClick={handleSearch}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
      />
      <SearchButton
        type="button"
        onClick={handleSearch}
        disabled={disabled || !isScriptLoaded}
      >
        {!isScriptLoaded ? '로딩중...' : '주소검색'}
      </SearchButton>
      
      {addressDetails && (
        <AddressDetails>
          <div><strong>도로명:</strong> {addressDetails.roadAddress}</div>
          <div><strong>지번:</strong> {addressDetails.jibunAddress}</div>
          <div><strong>시군구코드:</strong> {addressDetails.sigunguCode} (법정동코드 앞 5자리)</div>
          <div><strong>동 정보:</strong> {addressDetails.dong}</div>
        </AddressDetails>
      )}
    </SearchContainer>
  );
};

export default DaumAddressSearch;
