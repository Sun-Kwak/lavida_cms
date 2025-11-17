import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { dbManager, type Member, type Product as DBProduct } from '../../../utils/indexedDB';
import { AppColors } from '../../../styles/colors';
import { AppTextStyles } from '../../../styles/textStyles';
import CustomDropdown from '../../../components/CustomDropdown';
import CustomDateInput from '../../../components/CustomDateInput';
import NumberTextField from '../../../components/NumberTextField';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
  
  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

const FormField = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: ${AppColors.onBackground};
  margin-bottom: 8px;
  font-size: ${AppTextStyles.body2.fontSize};
`;

const ProductItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: ${AppColors.surface};
  border: 1px solid ${AppColors.borderLight};
  border-radius: 8px;
  margin-bottom: 8px;
`;

const ProductInfo = styled.div`
  flex: 1;
`;

const ProductName = styled.div`
  font-weight: 600;
  color: ${AppColors.onSurface};
  margin-bottom: 4px;
`;

const RemoveButton = styled.button`
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  &:hover {
    background: #cc3333;
  }
`;

const PointPaymentSection = styled.div`
  background: ${AppColors.primary}10;
  border: 1px solid ${AppColors.primary}30;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
`;

const PointInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
`;

const PointUseButton = styled.button`
  background: ${AppColors.primary};
  color: ${AppColors.onPrimary};
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: ${AppTextStyles.body3.fontSize};
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    opacity: 0.9;
  }
`;

const WarningText = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  margin: 16px 0;
  color: #856404;
  font-size: ${AppTextStyles.body3.fontSize};
  text-align: center;
`;

const InfoText = styled.div`
  font-size: ${AppTextStyles.body3.fontSize};
  color: ${AppColors.onInput1};
  margin-top: 8px;
  line-height: 1.4;
`;

interface Product {
  id: string;
  name: string;
  originalPrice?: number; // DB에서 가져온 기본 가격
  basePrice?: number; // 기준 가격
  price: number; // 상품금액 (계산될 정확한 금액)
  appliedPrice?: number; // 적용금액 (사용자가 조정할 수 있는 최종 금액)
  description?: string;
  programType?: string; // '기간제' | '횟수제'
  // 기간제 관련
  duration?: number; // 기간(일)
  baseDuration?: number; // 기준 기간
  months?: number; // 개월수
  baseMonths?: number; // 기준 개월수
  startDate?: Date;
  endDate?: Date;
  // 횟수제 관련
  sessions?: number; // 수업 횟수
  baseSessions?: number; // 기준 횟수
}

interface PaymentInfo {
  selectedProducts: Product[];
  paymentMethod: string;
  receivedAmount?: number;
  pointPayment?: number;
}

interface CoursePaymentPanelProps {
  selectedMember: Member;
  memberPointBalance: number;
  paymentInfo: PaymentInfo;
  onPaymentUpdate: (updates: Partial<PaymentInfo>) => void;
}

const CoursePaymentPanel: React.FC<CoursePaymentPanelProps> = ({
  selectedMember,
  memberPointBalance,
  paymentInfo,
  onPaymentUpdate
}) => {
  const [availableProducts, setAvailableProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // 횟수제 상품의 금액 계산 (기준 횟수 대비 비례 계산)
  const calculateSessionPrice = (basePrice: number, sessions: number, baseSessions: number): number => {
    return Math.round((basePrice / baseSessions) * sessions);
  };

  // 선택된 회원의 지점별 상품 목록 로드
  useEffect(() => {
    if (selectedMember.branchId) {
      loadProductsByBranch(selectedMember.branchId);
    } else {
      setAvailableProducts([]);
    }
  }, [selectedMember.branchId]);

  // 지점별 상품 로드
  const loadProductsByBranch = async (branchId: string) => {
    setLoading(true);
    try {
      const products = await dbManager.getProductsByBranch(branchId);
      // 활성 상품만 필터링
      const activeProducts = products.filter(product => product.isActive);
      setAvailableProducts(activeProducts);
    } catch (error) {
      console.error('상품 로드 실패:', error);
      setAvailableProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 상품 선택 옵션 생성
  const getProductOptions = () => [
    { value: '', label: loading ? '상품 로딩 중...' : '상품을 선택하세요' },
    ...availableProducts.map(product => ({
      value: product.id,
      label: `${product.name} - ${product.price?.toLocaleString() || '가격미정'}원${product.programType === '기간제' ? ' (기간제)' : ''}`
    }))
  ];

  // 상품 선택 처리
  const handleProductSelect = (value: string) => {
    if (value) {
      const product = availableProducts.find(p => p.id === value);
      if (product) {
        // DBProduct를 Product 타입으로 변환
        const convertedProduct: Product = {
          id: product.id,
          name: product.name,
          originalPrice: product.price || 0, // DB에서 가져온 기본 가격
          basePrice: product.price || 0, // 기준 가격
          price: product.price || 0, // 상품금액 (계산될 정확한 금액)
          appliedPrice: product.price || 0, // 적용금액 (사용자가 조정할 수 있는 최종 금액)
          description: product.description,
          programType: product.programType
        };

        // 기간제인 경우 상품의 개월수를 기준으로 기간 설정 (가격은 고정)
        if (product.programType === '기간제') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          // 상품에 등록된 개월수를 기준으로 설정 (기본값: 1개월)
          const productMonths = product.months || 1;
          const days = productMonths * 30; // 개월수를 일수로 변환 (1개월 = 30일)
          
          const endDate = new Date(tomorrow);
          endDate.setDate(endDate.getDate() + days);
          
          convertedProduct.duration = days;
          convertedProduct.baseDuration = days;
          convertedProduct.months = productMonths; // 개월수 저장
          convertedProduct.baseMonths = productMonths; // 기준 개월수 저장
          convertedProduct.startDate = tomorrow;
          convertedProduct.endDate = endDate;
          // 기간제는 가격 고정 (기간 변경해도 가격 변동 없음)
          convertedProduct.price = product.price || 0;
          convertedProduct.appliedPrice = convertedProduct.price;
        }
        // 횟수제인 경우 상품의 실제 횟수 설정
        else if (product.programType === '횟수제') {
          const productSessions = product.sessions || 10; // 상품에 설정된 횟수 또는 기본 10회
          convertedProduct.sessions = productSessions;
          convertedProduct.baseSessions = productSessions;
          // 횟수제는 상품 가격이 해당 횟수에 대한 가격이므로 그대로 사용
          convertedProduct.price = product.price || 0;
          // 적용금액도 초기에는 상품 가격과 동일
          convertedProduct.appliedPrice = convertedProduct.price;
          
          // 유효기간 설정 (상품에 등록된 validityMonths 사용)
          if (product.validityMonths) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const endDate = new Date(tomorrow);
            endDate.setMonth(endDate.getMonth() + product.validityMonths);
            
            convertedProduct.startDate = tomorrow;
            convertedProduct.endDate = endDate;
            convertedProduct.months = product.validityMonths;
          }
        }

        handleProductAdd(convertedProduct);
      }
    }
  };

  // 상품 추가
  const handleProductAdd = (product: Product) => {
    const newProducts = [...paymentInfo.selectedProducts, product];
    const newTotalAmount = newProducts.reduce((sum, p) => sum + (p.appliedPrice || p.price), 0);
    const currentPointPayment = paymentInfo.pointPayment || 0;
    
    onPaymentUpdate({
      selectedProducts: newProducts,
      receivedAmount: Math.max(0, newTotalAmount - currentPointPayment) // 기본 받은금액 설정
    });
  };

  // 상품 편집 (기간, 횟수, 가격 등)
  const handleProductEdit = (index: number, field: string, value: any) => {
    const updatedProducts = [...paymentInfo.selectedProducts];
    const product = { ...updatedProducts[index] };
    
    if (field === 'duration') {
      product.duration = value;
      if (product.programType === '기간제' && product.startDate) {
        // 기간제: 일수를 개월수로 변환 (가격은 변경하지 않음)
        const months = Math.round(value / 30); // 일수를 개월수로 변환 (30일 = 1개월)
        product.months = months;
        
        // 종료일 재계산
        const endDate = new Date(product.startDate);
        endDate.setDate(endDate.getDate() + value);
        product.endDate = endDate;
        
        // 기간제는 가격 고정 (기간 변경해도 가격 변동 없음)
      }
    } else if (field === 'months') {
      // 개월수 직접 변경 (기간제)
      product.months = value;
      if (product.programType === '기간제' && product.startDate) {
        // 개월수를 일수로 변환
        const days = value * 30; // 1개월 = 30일
        product.duration = days;
        
        // 종료일 재계산
        const endDate = new Date(product.startDate);
        endDate.setDate(endDate.getDate() + days);
        product.endDate = endDate;
        
        // 기간제는 가격 고정 (기간 변경해도 가격 변동 없음)
      }
    } else if (field === 'sessions') {
      product.sessions = value;
      if (product.programType === '횟수제') {
        // 횟수제: 상품의 기본 횟수와 가격을 기준으로 비례 계산
        const basePrice = product.basePrice || product.originalPrice || 0;
        const baseSessions = product.baseSessions || 1; // 상품의 기본 횟수
        product.price = calculateSessionPrice(basePrice, value, baseSessions);
        product.appliedPrice = product.price; // 적용금액도 함께 업데이트
      }
    } else if (field === 'startDate') {
      product.startDate = value;
      if (product.programType === '기간제' && product.duration) {
        // 시작일 변경 시 종료일 재계산
        const endDate = new Date(value);
        endDate.setDate(endDate.getDate() + product.duration);
        product.endDate = endDate;
      }
    } else if (field === 'endDate') {
      product.endDate = value;
      if (product.programType === '기간제' && product.startDate) {
        // 종료일 변경 시 기간 재계산 (가격은 변경하지 않음)
        const days = Math.ceil((value.getTime() - product.startDate.getTime()) / (1000 * 3600 * 24));
        product.duration = days;
        product.months = Math.round(days / 30);
      }
    } else if (field === 'appliedPrice') {
      // 적용금액은 사용자가 직접 수정 가능
      product.appliedPrice = value;
    }
    
    updatedProducts[index] = product;
    
    // 총액 재계산 후 받은금액 업데이트
    const newTotalAmount = updatedProducts.reduce((sum, p) => sum + (p.appliedPrice || p.price), 0);
    const currentPointPayment = paymentInfo.pointPayment || 0;
    
    onPaymentUpdate({
      selectedProducts: updatedProducts,
      receivedAmount: Math.max(0, newTotalAmount - currentPointPayment)
    });
  };

  // 상품 제거
  const handleProductRemove = (productId: string) => {
    const updatedProducts = paymentInfo.selectedProducts.filter((p, index) => {
      // 같은 상품이 여러 개 있을 수 있으므로 첫 번째 것만 제거
      const firstMatchIndex = paymentInfo.selectedProducts.findIndex(product => product.id === productId);
      return index !== firstMatchIndex;
    });
    
    const newTotalAmount = updatedProducts.reduce((sum, p) => sum + (p.appliedPrice || p.price), 0);
    const currentPointPayment = paymentInfo.pointPayment || 0;
    
    onPaymentUpdate({
      selectedProducts: updatedProducts,
      receivedAmount: Math.max(0, newTotalAmount - currentPointPayment) // 받은금액 재계산
    });
  };

  // 결제 방법 변경
  const handlePaymentMethodChange = (value: string) => {
    onPaymentUpdate({
      paymentMethod: value
    });
  };

  // 받은 금액 변경
  const handleReceivedAmountChange = (value: number) => {
    onPaymentUpdate({
      receivedAmount: value
    });
  };

  // 포인트 결제 금액 변경
  const handlePointPaymentChange = (value: number) => {
    const maxPoint = Math.min(memberPointBalance, totalAmount);
    const pointPayment = Math.max(0, Math.min(value, maxPoint));
    
    // 포인트 변경 시 받은 금액(현금/카드)은 총액에서 포인트를 뺀 금액으로 설정
    const cashAmount = Math.max(0, totalAmount - pointPayment);
    
    onPaymentUpdate({
      pointPayment: pointPayment,
      receivedAmount: cashAmount
    });
  };

  // 전체 포인트 사용
  const handleUseAllPoints = () => {
    const maxUsablePoint = Math.min(memberPointBalance, totalAmount);
    
    // 전체 포인트 사용 시 받은 금액(현금/카드)은 총액에서 포인트를 뺀 금액으로 설정
    const cashAmount = Math.max(0, totalAmount - maxUsablePoint);
    
    onPaymentUpdate({
      pointPayment: maxUsablePoint,
      receivedAmount: cashAmount
    });
  };

  const totalAmount = paymentInfo.selectedProducts.reduce((sum, product) => {
    return sum + (product.appliedPrice || product.price);
  }, 0);
  const pointPayment = paymentInfo.pointPayment || 0;
  const cashPayment = paymentInfo.receivedAmount || 0; // 현금/카드 결제 금액

  // 결제 방법 옵션
  const paymentMethodOptions = [
    { value: 'card', label: '카드' },
    { value: 'cash', label: '현금' },
    { value: 'transfer', label: '계좌이체' }
  ];

  return (
    <Container>
      <FormField>
        <Label>결제 방법</Label>
        <CustomDropdown
          value={paymentInfo.paymentMethod || 'card'}
          onChange={handlePaymentMethodChange}
          options={paymentMethodOptions}
          inModal={true}
        />
      </FormField>

      <FormField>
        <Label>상품 추가</Label>
        <CustomDropdown
          value=""
          onChange={handleProductSelect}
          options={getProductOptions()}
          disabled={loading || availableProducts.length === 0}
          inModal={true}
        />
        {availableProducts.length === 0 && !loading && (
          <InfoText>
            선택한 지점에 등록된 상품이 없습니다.
          </InfoText>
        )}
      </FormField>

      {paymentInfo.selectedProducts.length > 0 && (
        <FormField>
          <Label>선택된 상품</Label>
          {paymentInfo.selectedProducts.map((product, index) => (
            <ProductItem key={`${product.id}-${index}`} style={{ marginBottom: '16px' }}>
              <ProductInfo style={{ flex: 1 }}>
                <ProductName>{product.name}</ProductName>
                
                {/* 기간제 상품 편집 */}
                {product.programType === '기간제' && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '12px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ 
                          fontSize: '12px', 
                          color: '#666', 
                          display: 'block', 
                          marginBottom: '8px',
                          fontWeight: '600'
                        }}>
                          시작일
                        </label>
                        <CustomDateInput
                          value={product.startDate ? product.startDate.toISOString().split('T')[0] : ''}
                          onChange={(value) => handleProductEdit(index, 'startDate', new Date(value))}
                          placeholder="시작일을 선택하세요"
                        />
                      </div>
                      <div>
                        <label style={{ 
                          fontSize: '12px', 
                          color: '#666', 
                          display: 'block', 
                          marginBottom: '8px',
                          fontWeight: '600'
                        }}>
                          종료일
                        </label>
                        <CustomDateInput
                          value={product.endDate ? product.endDate.toISOString().split('T')[0] : ''}
                          onChange={(value) => handleProductEdit(index, 'endDate', new Date(value))}
                          placeholder="종료일을 선택하세요"
                          min={product.startDate ? product.startDate.toISOString().split('T')[0] : undefined}
                        />
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#666',
                      marginTop: '4px',
                      padding: '4px 8px',
                      backgroundColor: '#fff',
                      borderRadius: '3px',
                      border: '1px solid #e9ecef'
                    }}>
                      💡 기간제는 가격이 고정되어 있습니다. 기간을 조정해도 가격은 변경되지 않습니다.
                      {product.startDate && product.endDate && (
                        <>
                          <br />기간: {Math.ceil((product.endDate.getTime() - product.startDate.getTime()) / (1000 * 3600 * 24))}일
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 횟수제 상품 편집 */}
                {product.programType === '횟수제' && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '12px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div>
                      <label style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        display: 'block', 
                        marginBottom: '8px',
                        fontWeight: '600'
                      }}>
                        수업 횟수
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <NumberTextField
                          value={product.sessions || (product.baseSessions || 10)}
                          onChange={(value) => handleProductEdit(index, 'sessions', value || 1)}
                          width="100px"
                          placeholder="횟수"
                        />
                        <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>회</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 가격 정보 */}
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  backgroundColor: '#fff', 
                  borderRadius: '6px',
                  border: '1px solid #ddd'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>상품금액: </span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                      {product.price.toLocaleString()}원
                    </span>
                    {product.price !== (product.originalPrice || 0) && (
                      <span style={{ 
                        fontSize: '11px', 
                        color: '#999', 
                        textDecoration: 'line-through',
                        marginLeft: '8px'
                      }}>
                        (원가: {(product.originalPrice || 0).toLocaleString()}원)
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      minWidth: '60px',
                      fontWeight: '600'
                    }}>
                      적용금액:
                    </label>
                    <NumberTextField
                      value={product.appliedPrice || product.price}
                      onChange={(value) => handleProductEdit(index, 'appliedPrice', value || 0)}
                      step={1000}
                      width="120px"
                      placeholder="금액"
                      style={{
                        fontWeight: 'bold',
                        color: '#0066cc'
                      }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0066cc' }}>원</span>
                    
                    {/* 상품금액 대비 적용금액 차이 표시 */}
                    {(product.appliedPrice || product.price) !== product.price && (
                      <span style={{ 
                        fontSize: '11px', 
                        color: (product.appliedPrice || product.price) > product.price ? '#dc3545' : '#28a745',
                        fontWeight: 'bold',
                        marginLeft: '4px'
                      }}>
                        ({(product.appliedPrice || product.price) > product.price ? '+' : ''}
                        {((product.appliedPrice || product.price) - product.price).toLocaleString()}원)
                      </span>
                    )}
                  </div>
                </div>
              </ProductInfo>
              
              <RemoveButton
                onClick={() => handleProductRemove(product.id)}
                style={{ alignSelf: 'flex-start', marginTop: '8px' }}
              >
                ✕
              </RemoveButton>
            </ProductItem>
          ))}
        </FormField>
      )}

      {totalAmount > 0 && (
        <div style={{ 
          marginTop: '16px', 
          padding: '16px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px'
        }}>
          <div style={{
            textAlign: 'right',
            fontWeight: 'bold',
            fontSize: '18px',
            marginBottom: '12px'
          }}>
            총 결제금액: {totalAmount.toLocaleString()}원
          </div>
          
          <PointPaymentSection>
            <Label>포인트 결제</Label>
            <InfoText>
              사용 가능한 포인트: {memberPointBalance.toLocaleString()}원
            </InfoText>
            <PointInputRow>
              <NumberTextField
                value={pointPayment || 0}
                onChange={(value) => handlePointPaymentChange(value || 0)}
                placeholder="포인트 사용 금액"
                width="100%"
                allowEmpty={true}
              />
              <PointUseButton onClick={handleUseAllPoints}>
                전액 사용
              </PointUseButton>
            </PointInputRow>
            {pointPayment > memberPointBalance && (
              <InfoText style={{ color: '#d32f2f' }}>
                포인트 잔액을 초과할 수 없습니다.
              </InfoText>
            )}
          </PointPaymentSection>

          <FormField>
            <Label>받은금액 (현금/카드)</Label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <NumberTextField
                value={paymentInfo.receivedAmount !== undefined ? paymentInfo.receivedAmount : Math.max(0, totalAmount - pointPayment)}
                onChange={(value) => handleReceivedAmountChange(value || 0)}
                placeholder="받은 금액을 입력하세요"
                width="100%"
                allowEmpty={true}
              />
              <button
                type="button"
                onClick={() => {
                  const cashAmount = Math.max(0, totalAmount - pointPayment);
                  handleReceivedAmountChange(cashAmount);
                }}
                style={{
                  minHeight: '48px',
                  padding: '14px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#37bbd6';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(55, 187, 214, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#ddd';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                필요 금액으로 설정
              </button>
            </div>
            {cashPayment !== totalAmount - pointPayment && (
              <InfoText>
                {cashPayment > totalAmount - pointPayment
                  ? (() => {
                      const excessAmount = cashPayment - (totalAmount - pointPayment);
                      let message = `초과금액: ${excessAmount.toLocaleString()}원 (포인트로 적립 예정)`;
                      
                      if (excessAmount >= 1000000) {
                        const millionUnits = Math.floor(excessAmount / 1000000);
                        const bonusPoints = millionUnits * 100000;
                        message += ` + 보너스 ${bonusPoints.toLocaleString()}원`;
                      }
                      
                      return message;
                    })()
                  : `부족금액: ${((totalAmount - pointPayment) - cashPayment).toLocaleString()}원 (미수금으로 처리 예정)`
                }
              </InfoText>
            )}
          </FormField>
        </div>
      )}

      {paymentInfo.selectedProducts.length === 0 && (
        <WarningText>
          등록할 상품을 선택해주세요.
        </WarningText>
      )}
    </Container>
  );
};

export default CoursePaymentPanel;