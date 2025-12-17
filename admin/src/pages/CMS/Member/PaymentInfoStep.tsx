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
import CustomDateInput from '../../../components/CustomDateInput';
import NumberTextField from '../../../components/NumberTextField';
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

  // 횟수제 상품의 금액 계산 (기준 횟수 대비 비례 계산)
  const calculateSessionPrice = (basePrice: number, sessions: number, baseSessions: number): number => {
    return Math.round((basePrice / baseSessions) * sessions);
  };

  // 상품 선택 옵션 생성
  const getProductOptions = () => [
    { value: '', label: loading ? '상품 로딩 중...' : '상품을 선택하세요' },
    ...availableProducts
      .map(product => ({
        value: product.id,
        label: `${product.name} - ${product.price?.toLocaleString() || '가격미정'}원${product.programType === '기간제' ? ' (기간제)' : ''}`
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ko-KR'))
  ];

  const handleProductSelect = (value: string) => {
    if (value) {
      const product = availableProducts.find(p => p.id === value);
      if (product) {
        console.log('=== 상품 선택 디버깅 ===');
        console.log('선택한 상품:', product);
        console.log('programType:', product.programType);
        console.log('validityMonths:', product.validityMonths);
        console.log('sessions:', product.sessions);
        
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

        // 기간제인 경우 상품의 개월수를 기준으로 설정
        if (product.programType === '기간제') {
          const today = new Date();
          
          // 상품에 등록된 개월수를 기준으로 설정 (기본값: 1개월)
          const productMonths = product.months || 1;
          const days = productMonths * 30; // 개월수를 일수로 변환 (1개월 = 30일)
          
          const endDate = new Date(today);
          endDate.setDate(endDate.getDate() + days);
          
          convertedProduct.duration = days;
          convertedProduct.baseDuration = days;
          convertedProduct.months = productMonths; // 개월수 저장
          convertedProduct.baseMonths = productMonths; // 기준 개월수 저장
          convertedProduct.startDate = today;
          convertedProduct.endDate = endDate;
          // 상품 가격은 해당 개월수에 대한 가격이므로 그대로 사용 (기간제는 가격 고정)
          convertedProduct.price = product.price || 0;
          // 적용금액도 초기에는 상품 가격과 동일
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
          
          // 유효기간 설정 - 오늘부터 시작
          const today = new Date();
          convertedProduct.startDate = today;
          
          // 유효기간(validityMonths 또는 months)으로 종료일 계산
          const validityMonths = product.validityMonths || product.months || 1;
          const endDate = new Date(today);
          endDate.setMonth(endDate.getMonth() + validityMonths);
          convertedProduct.endDate = endDate;
          convertedProduct.months = validityMonths;
        }

        console.log('=== convertedProduct 최종 ===');
        console.log('startDate:', convertedProduct.startDate);
        console.log('endDate:', convertedProduct.endDate);
        console.log('전체:', convertedProduct);

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
        if (value !== undefined && value !== null && value > 0) {
          // 횟수제: 상품의 기본 횟수와 가격을 기준으로 비례 계산
          const basePrice = product.basePrice || product.originalPrice || 0;
          const baseSessions = product.baseSessions || 1; // 상품의 기본 횟수
          product.price = calculateSessionPrice(basePrice, value, baseSessions);
          product.appliedPrice = product.price; // 적용금액도 함께 업데이트
        } else {
          // 횟수가 비어있거나 0 이하인 경우 가격을 0으로 설정
          product.price = 0;
          product.appliedPrice = 0;
        }
      }
    } else if (field === 'startDate') {
      product.startDate = value;
      if (product.programType === '기간제' && product.duration) {
        // 기간제: 시작일 변경 시 종료일 재계산
        const endDate = new Date(value);
        endDate.setDate(endDate.getDate() + product.duration);
        product.endDate = endDate;
      } else if (product.programType === '횟수제' && product.endDate) {
        // 횟수제: 시작일 변경 시 기간(months) 재계산
        const days = Math.ceil((product.endDate.getTime() - value.getTime()) / (1000 * 3600 * 24));
        product.months = Math.round(days / 30);
      }
    } else if (field === 'endDate') {
      product.endDate = value;
      if (product.programType === '기간제' && product.startDate) {
        // 기간제: 종료일 변경 시 기간 재계산
        const days = Math.ceil((value.getTime() - product.startDate.getTime()) / (1000 * 3600 * 24));
        product.duration = days;
        product.months = Math.round(days / 30);
      } else if (product.programType === '횟수제' && product.startDate) {
        // 횟수제: 종료일 변경 시 기간(months) 재계산
        const days = Math.ceil((value.getTime() - product.startDate.getTime()) / (1000 * 3600 * 24));
        product.months = Math.round(days / 30);
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
          inModal={false}
        />
      </FormField>

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
            inModal={false}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', alignItems: 'start' }}>
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
                            value={product.sessions}
                            onChange={(value) => handleProductEdit(index, 'sessions', value)}
                            width="100px"
                            placeholder="횟수"
                            allowEmpty={true}
                          />
                          <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>회</span>
                        </div>
                      </div>
                      
                      <div>
                        <label style={{ 
                          fontSize: '12px', 
                          color: '#666', 
                          display: 'block', 
                          marginBottom: '8px',
                          fontWeight: '600'
                        }}>
                          유효기간
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <CustomDateInput
                            value={product.startDate ? product.startDate.toISOString().split('T')[0] : ''}
                            onChange={(value) => handleProductEdit(index, 'startDate', new Date(value))}
                            placeholder="시작일"
                          />
                          <CustomDateInput
                            value={product.endDate ? product.endDate.toISOString().split('T')[0] : ''}
                            onChange={(value) => handleProductEdit(index, 'endDate', new Date(value))}
                            placeholder="종료일"
                            min={product.startDate ? product.startDate.toISOString().split('T')[0] : undefined}
                          />
                        </div>
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
                      value={product.appliedPrice}
                      onChange={(value) => handleProductEdit(index, 'appliedPrice', value)}
                      step={1000}
                      width="120px"
                      placeholder="금액"
                      allowEmpty={true}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Label>받은금액</Label>
                {formData.paymentInfo.receivedAmount !== undefined && formData.paymentInfo.receivedAmount >= 1000000 && formData.paymentInfo.receivedAmount > totalAmount && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.paymentInfo.bonusPointsEnabled || false}
                      onChange={(e) => {
                        onUpdate({
                          paymentInfo: {
                            ...formData.paymentInfo,
                            bonusPointsEnabled: e.target.checked
                          }
                        });
                      }}
                      style={{ margin: 0 }}
                    />
                    정액제 (100만원당 10만원)
                  </label>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <NumberTextField
                  value={formData.paymentInfo.receivedAmount}
                  onChange={(value) => {
                    onUpdate({
                      paymentInfo: {
                        ...formData.paymentInfo,
                        receivedAmount: value
                      }
                    });
                  }}
                  placeholder="받은 금액을 입력하세요"
                  width="100%"
                  allowEmpty={true}
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
                        let message = `받은금액 전체(${formData.paymentInfo.receivedAmount.toLocaleString()}원)를 포인트로 적립 후, 상품비용(${totalAmount.toLocaleString()}원) 차감 예정`;
                        
                        // 보너스 포인트는 체크박스가 활성화되고 받은금액이 100만원 이상일 때만 적용
                        if (formData.paymentInfo.bonusPointsEnabled && formData.paymentInfo.receivedAmount >= 1000000) {
                          const millionUnits = Math.floor(formData.paymentInfo.receivedAmount / 1000000);
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
    </StepContent>
  );
};

export default PaymentInfoStep;
