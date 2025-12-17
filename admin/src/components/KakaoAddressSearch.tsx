import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { KakaoAddressDocument, AddressInfo } from '../pages/CMS/Member/types';

interface KakaoAddressSearchProps {
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
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
  
  &:disabled {
    background-color: #f5f5f5;
    color: #999;
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  padding: 6px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
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

const ResultsList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  margin: 0;
  padding: 0;
  list-style: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ResultItem = styled.li`
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const AddressName = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const AddressDetail = styled.div`
  font-size: 12px;
  color: #666;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
`;

// 카카오 주소 API 키 - 환경변수에서 가져오기
const KAKAO_API_KEY = process.env.REACT_APP_KAKAO_API_KEY;

const KakaoAddressSearch: React.FC<KakaoAddressSearchProps> = ({
  onAddressSelect,
  placeholder = "주소를 검색하세요",
  disabled = false,
  value = ""
}) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [searchResults, setSearchResults] = useState<KakaoAddressDocument[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string>('');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    if (!KAKAO_API_KEY) {
      setError('카카오 API 키가 설정되지 않았습니다.');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `KakaoAK ${KAKAO_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.documents && data.documents.length > 0) {
        setSearchResults(data.documents);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setError('검색 결과가 없습니다.');
      }
    } catch (err) {
      console.error('Address search error:', err);
      setError('주소 검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    searchAddress(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleAddressSelect = (document: KakaoAddressDocument) => {
    const addressInfo: AddressInfo = {
      address: document.address_name,
      sigunguCode: document.address.b_code, // 법정동 코드를 시군구 코드로 사용
      dong: document.address.region_3depth_name || document.address.region_3depth_h_name, // 동 정보
      roadAddress: document.road_address?.address_name || '',
      jibunAddress: document.address.address_name
    };

    setSearchQuery(document.address_name);
    setShowResults(false);
    setError('');
    onAddressSelect(addressInfo);
  };

  return (
    <SearchContainer ref={searchContainerRef}>
      <SearchInput
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled || isSearching}
      />
      <SearchButton
        type="button"
        onClick={handleSearch}
        disabled={disabled || isSearching}
      >
        {isSearching ? '검색중...' : '검색'}
      </SearchButton>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {showResults && searchResults.length > 0 && (
        <ResultsList>
          {searchResults.map((document, index) => (
            <ResultItem
              key={index}
              onClick={() => handleAddressSelect(document)}
            >
              <AddressName>{document.address_name}</AddressName>
              {document.road_address && (
                <AddressDetail>도로명: {document.road_address.address_name}</AddressDetail>
              )}
            </ResultItem>
          ))}
        </ResultsList>
      )}
    </SearchContainer>
  );
};

export default KakaoAddressSearch;
