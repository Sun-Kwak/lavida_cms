import React, { useState, useEffect } from 'react';
import { 
  StepContent, 
  StepTitle, 
  FormField, 
  Label, 
  ProductItem, 
  ProductInfo, 
  ProductName, 
  RemoveButton,
  SkipMessage 
} from './StyledComponents';
import { Product, StepProps } from './types';
import CustomDropdown from '../../../components/CustomDropdown';
import { dbManager, type Product as DBProduct } from '../../../utils/indexedDB';

const PaymentInfoStep: React.FC<StepProps> = ({ formData, onUpdate }) => {
  const [availableProducts, setAvailableProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // 선택된 지점이 변경될 때마다 상품 목록 로드
  useEffect(() => {
    if (formData.joinInfo.branchId) {
      loadProductsByBranch(formData.joinInfo.branchId);
    } else {
      setAvailableProducts([]);
    }
  }, [formData.joinInfo.branchId]);

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

  // 기간제 상품의 금액 계산 (기본 한달 기준으로 일할 계산)
  const calculatePeriodPrice = (basePrice: number, days: number): number => {
    const baseDays = 30; // 기본 한달 (30일) 기준
    return Math.round((basePrice / baseDays) * days);
  };

  // 횟수제 상품의 금액 계산 (기준 횟수 대비 비례 계산)
  const calculateSessionPrice = (basePrice: number, sessions: number, baseSessions: number): number => {
    return Math.round((basePrice / baseSessions) * sessions);
  };

  // 상품 선택 옵션 생성
  const getProductOptions = () => [
    { value: '', label: loading ? '상품 로딩 중...' : '상품을 선택하세요' },
    ...availableProducts.map(product => ({
      value: product.id,
      label: `${product.name} - ${product.price?.toLocaleString() || '가격미정'}원${product.programType === '기간제' ? ' (기간제)' : ''}`
    }))
  ];

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

        // 기간제인 경우 기본 30일 설정
        if (product.programType === '기간제') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const endDate = new Date(tomorrow);
          endDate.setDate(endDate.getDate() + 30);
          
          convertedProduct.duration = 30;
          convertedProduct.baseDuration = 30;
          convertedProduct.startDate = tomorrow;
          convertedProduct.endDate = endDate;
          // 계산된 정확한 상품금액
          convertedProduct.price = calculatePeriodPrice(product.price || 0, 30);
          // 적용금액도 초기에는 계산된 금액과 동일
          convertedProduct.appliedPrice = convertedProduct.price;
        }
        // 횟수제인 경우 기본 횟수 설정 (상품에서 가져오거나 기본값 사용)
        else if (product.programType === '횟수제') {
          // DB에서 sessions 정보를 가져와야 하지만, 임시로 기본값 사용
          const defaultSessions = 10; // 기본 10회
          convertedProduct.sessions = defaultSessions;
          convertedProduct.baseSessions = defaultSessions;
          // 계산된 정확한 상품금액
          convertedProduct.price = calculateSessionPrice(product.price || 0, defaultSessions, defaultSessions);
          // 적용금액도 초기에는 계산된 금액과 동일
          convertedProduct.appliedPrice = convertedProduct.price;
        }

        handleProductAdd(convertedProduct);
      }
    }
  };  const handleProductAdd = (product: Product) => {
    onUpdate({
      paymentInfo: {
        ...formData.paymentInfo,
        selectedProducts: [...formData.paymentInfo.selectedProducts, product]
      }
    });
  };

  // 상품 편집 (기간, 횟수, 가격 등)
  const handleProductEdit = (index: number, field: string, value: any) => {
    const updatedProducts = [...formData.paymentInfo.selectedProducts];
    const product = { ...updatedProducts[index] };
    
    if (field === 'duration') {
      product.duration = value;
      if (product.programType === '기간제' && product.startDate) {
        // 기간제: 종료일 재계산
        const endDate = new Date(product.startDate);
        endDate.setDate(endDate.getDate() + value);
        product.endDate = endDate;
        // 상품금액 재계산
        const basePrice = product.basePrice || product.originalPrice || 0;
        product.price = calculatePeriodPrice(basePrice, value);
        product.appliedPrice = product.price; // 적용금액도 함께 업데이트
      }
    } else if (field === 'sessions') {
      product.sessions = value;
      if (product.programType === '횟수제') {
        // 횟수제: 횟수에 따른 상품금액 재계산
        const basePrice = product.basePrice || product.originalPrice || 0;
        const baseSessions = product.baseSessions || 10; // 기준 횟수
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
    } else if (field === 'appliedPrice') {
      // 적용금액은 사용자가 직접 수정 가능
      product.appliedPrice = value;
    }
    
    updatedProducts[index] = product;
    
    onUpdate({
      paymentInfo: {
        ...formData.paymentInfo,
        selectedProducts: updatedProducts
      }
    });
  };

  const handleProductRemove = (productId: string) => {
    const updatedProducts = formData.paymentInfo.selectedProducts.filter((p, index) => {
      // 같은 상품이 여러 개 있을 수 있으므로 첫 번째 것만 제거
      const firstMatchIndex = formData.paymentInfo.selectedProducts.findIndex(product => product.id === productId);
      return index !== firstMatchIndex;
    });
    
    onUpdate({
      paymentInfo: {
        ...formData.paymentInfo,
        selectedProducts: updatedProducts
      }
    });
  };

  const totalAmount = formData.paymentInfo.selectedProducts.reduce((sum, product) => {
    return sum + (product.appliedPrice || product.price);
  }, 0);

  // 결제 방법 옵션
  const paymentMethodOptions = [
    { value: 'card', label: '카드' },
    { value: 'cash', label: '현금' },
    { value: 'transfer', label: '계좌이체' }
  ];

  const handlePaymentMethodChange = (value: string) => {
    onUpdate({
      paymentInfo: {
        ...formData.paymentInfo,
        paymentMethod: value
      }
    });
  };

  return (
    <StepContent>
      <StepTitle>결제정보</StepTitle>
      
      <FormField>
        <Label>결제 방법</Label>
        <CustomDropdown
          value={formData.paymentInfo.paymentMethod || 'card'}
          onChange={handlePaymentMethodChange}
          options={paymentMethodOptions}
        />
      </FormField>
      
      {formData.paymentInfo.selectedProducts.length === 0 ? (
        <SkipMessage>
          결제할 상품이 없습니다.<br />
          상품을 선택하거나 건너뛰기를 선택하세요.
        </SkipMessage>
      ) : (
        <div>
          <h3>선택된 상품</h3>
          {formData.paymentInfo.selectedProducts.map((product, index) => (
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
                          marginBottom: '6px',
                          fontWeight: '500'
                        }}>
                          시작일
                        </label>
                        <input
                          type="date"
                          value={product.startDate ? product.startDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => handleProductEdit(index, 'startDate', new Date(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                            height: '36px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ 
                          fontSize: '12px', 
                          color: '#666', 
                          display: 'block', 
                          marginBottom: '6px',
                          fontWeight: '500'
                        }}>
                          기간(일)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={product.duration || 30}
                          onChange={(e) => handleProductEdit(index, 'duration', parseInt(e.target.value) || 1)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                            height: '36px'
                          }}
                        />
                      </div>
                    </div>
                    {product.endDate && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#666',
                        marginTop: '4px',
                        padding: '4px 8px',
                        backgroundColor: '#fff',
                        borderRadius: '3px',
                        border: '1px solid #e9ecef'
                      }}>
                        종료일: {product.endDate.toLocaleDateString()}
                      </div>
                    )}
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
                        marginBottom: '6px',
                        fontWeight: '500'
                      }}>
                        수업 횟수
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={product.sessions || 10}
                          onChange={(e) => handleProductEdit(index, 'sessions', parseInt(e.target.value) || 1)}
                          style={{
                            width: '100px',
                            padding: '8px 10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                            height: '36px'
                          }}
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
                      fontWeight: '500'
                    }}>
                      적용금액:
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={product.appliedPrice || product.price}
                      onChange={(e) => handleProductEdit(index, 'appliedPrice', parseInt(e.target.value) || 0)}
                      style={{
                        width: '120px',
                        padding: '8px 10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#0066cc',
                        boxSizing: 'border-box',
                        height: '36px'
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
          
          {/* 기존 기간제 상품 설정 UI 제거 */}
          
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
            
            <FormField>
              <Label>받은금액</Label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  value={formData.paymentInfo.receivedAmount || totalAmount}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : 0;
                    onUpdate({
                      paymentInfo: {
                        ...formData.paymentInfo,
                        receivedAmount: value
                      }
                    });
                  }}
                  placeholder="받은 금액을 입력하세요"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    height: '36px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    onUpdate({
                      paymentInfo: {
                        ...formData.paymentInfo,
                        receivedAmount: totalAmount
                      }
                    });
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    height: '36px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  적용금액 합계로 설정
                </button>
              </div>
              {formData.paymentInfo.receivedAmount !== undefined && formData.paymentInfo.receivedAmount !== totalAmount && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px',
                  color: formData.paymentInfo.receivedAmount > totalAmount ? '#28a745' : '#dc3545'
                }}>
                  {formData.paymentInfo.receivedAmount > totalAmount 
                    ? (() => {
                        const excessAmount = formData.paymentInfo.receivedAmount - totalAmount;
                        let message = `초과금액: ${excessAmount.toLocaleString()}원 (포인트로 적립 예정)`;
                        
                        if (excessAmount >= 1000000) {
                          const millionUnits = Math.floor(excessAmount / 1000000);
                          const bonusPoints = millionUnits * 100000;
                          message += ` + 보너스 ${bonusPoints.toLocaleString()}원`;
                        }
                        
                        return message;
                      })()
                    : `부족금액: ${(totalAmount - formData.paymentInfo.receivedAmount).toLocaleString()}원 (미수금으로 처리 예정)`
                  }
                </div>
              )}
            </FormField>
          </div>
        </div>
      )}

      <FormField style={{ marginTop: '24px' }}>
        <Label>상품 추가</Label>
        {!formData.joinInfo.branchId ? (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '4px',
            color: '#856404',
            fontSize: '14px'
          }}>
            먼저 가입정보에서 지점을 선택해주세요.
          </div>
        ) : (
          <CustomDropdown
            value=""
            onChange={handleProductSelect}
            options={getProductOptions()}
            disabled={loading || availableProducts.length === 0}
          />
        )}
        {formData.joinInfo.branchId && availableProducts.length === 0 && !loading && (
          <div style={{ 
            marginTop: '8px',
            color: '#6c757d',
            fontSize: '12px'
          }}>
            선택한 지점에 등록된 상품이 없습니다.
          </div>
        )}
      </FormField>
    </StepContent>
  );
};

export default PaymentInfoStep;
