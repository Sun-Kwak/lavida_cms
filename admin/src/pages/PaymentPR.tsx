import React, { useState } from 'react';
import './PaymentPR.css';

interface Branch {
  id: string;
  name: string;
  displayName: string;
  address: string;
  mapUrl: string;
  embedUrl: string;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
}

const PaymentPR: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<string>('suji');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: '', phone: '' });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [fieldErrors, setFieldErrors] = useState<{name: boolean, phone: boolean}>({ name: false, phone: false });

  const branches: Branch[] = [
    {
      id: 'suji',
      name: 'suji',
      displayName: '라비다 라운지 (수지동천점)',
      address: '경기도 용인시 수지구 신수로805, 케이투타워 3층',
      mapUrl: 'https://maps.google.com/maps?q=경기도+용인시+수지구+신수로805+케이투타워',
      embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3172.8156!2d127.0983!3d37.3256!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDE5JzMyLjIiTiAxMjfCsDA1JzU0LjAiRQ!5e0!3m2!1sko!2skr!4v1600000000000!5m2!1sko!2skr',
      products: [
        {
          id: 'wbm_6month',
          name: 'wbm 무제한 순환 운동 6개월',
          price: 644000,
        },
        {
          id: 'relaxing_30',
          name: '릴렉싱 30회',
          price: 750000,
        },
      ],
    },
    {
      id: 'siheung',
      name: 'siheung',
      displayName: '라비다 퀸즈서클 (시흥배곧점)',
      address: '시흥시 배곧4로 87 베스트프라자 3층 307, 308, 309호',
      mapUrl: 'https://maps.google.com/maps?q=시흥시+배곧4로+87+베스트프라자',
      embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3168.2156!2d126.7283!3d37.3756!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDIyJzMyLjIiTiAxMjbCsDQzJzU0LjAiRQ!5e0!3m2!1sko!2skr!4v1600000000000!5m2!1sko!2skr',
      products: [
        {
          id: 'queens_daily_6month',
          name: '퀸즈서클 DAILY 6개월',
          price: 644000,
        },
        {
          id: 'stretching_30',
          name: '스트레칭 30회',
          price: 750000,
        },
      ],
    },
  ];

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: '신용/체크카드',
    },
    {
      id: 'simple',
      name: '간편결제',
      description: '카카오페이, 네이버페이 등',
    },
  ];

  const getCurrentBranch = () => branches.find(b => b.id === selectedBranch);
  const getCurrentProduct = () => {
    const branch = getCurrentBranch();
    return branch?.products.find(p => p.id === selectedProduct);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원';
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const validatePhoneNumber = (phone: string) => {
    const numbers = phone.replace(/[^\d]/g, '');
    return numbers.length === 10 || numbers.length === 11;
  };

  const validateName = (name: string) => {
    return name.trim().length >= 2;
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    setSelectedProduct(''); // 지점 변경시 상품 선택 초기화
  };

  const handlePayment = () => {
    let hasErrors = false;
    const newFieldErrors = { name: false, phone: false };

    if (!selectedBranch || !selectedProduct || !customerInfo.name || !customerInfo.phone) {
      alert('모든 정보를 입력해주세요.');
      return;
    }

    if (!validateName(customerInfo.name)) {
      newFieldErrors.name = true;
      hasErrors = true;
    }

    if (!validatePhoneNumber(customerInfo.phone)) {
      newFieldErrors.phone = true;
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      alert('입력 정보를 확인해주세요.');
      return;
    }
    
    const branch = getCurrentBranch();
    const product = getCurrentProduct();
    
    alert(`PG 심사용 결제 페이지입니다.\n\n지점: ${branch?.displayName}\n상품: ${product?.name}\n금액: ${formatPrice(product?.price || 0)}\n고객: ${customerInfo.name}\n전화번호: ${customerInfo.phone}`);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setCustomerInfo({ ...customerInfo, phone: formatted });
    setFieldErrors({ ...fieldErrors, phone: false });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerInfo({ ...customerInfo, name: e.target.value });
    setFieldErrors({ ...fieldErrors, name: false });
  };

  return (
    <div className="payment-pr-container">
      {/* App Bar */}
      <div className="app-bar">
        <div className="app-bar-content">
          <div className="logo">
            <img src="/lavida_cms/logo.png" alt="LAVIDA" className="logo-image" />
          </div>
        </div>
      </div>

      <div className="content">
        {/* 지점 선택 섹션 */}
        <section className="section">
          <h2 className="section-title">지점 선택</h2>
          <div className="branch-selection">
            {branches.map((branch) => (
              <label key={branch.id} className={`branch-card ${selectedBranch === branch.id ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="branch"
                  value={branch.id}
                  checked={selectedBranch === branch.id}
                  onChange={() => handleBranchChange(branch.id)}
                  className="branch-radio"
                />
                <div className="branch-info">
                  <div className="branch-name">{branch.displayName}</div>
                  <div className="branch-address">{branch.address}</div>
                </div>
              </label>
            ))}
          </div>
          
          {/* 선택된 지점 지도 */}
          {selectedBranch && (
            <div className="branch-map">
              <iframe
                src={getCurrentBranch()?.embedUrl}
                width="100%"
                height="200"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${getCurrentBranch()?.displayName} 지도`}
              ></iframe>
            </div>
          )}
        </section>

        {/* 상품 선택 섹션 */}
        {selectedBranch && (
          <section className="section">
            <h2 className="section-title">상품 선택</h2>
            <div className="product-selection">
              {getCurrentBranch()?.products.map((product) => (
                <label key={product.id} className={`product-card ${selectedProduct === product.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="product"
                    value={product.id}
                    checked={selectedProduct === product.id}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="product-radio"
                  />
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">{formatPrice(product.price)}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>
        )}

        {/* 고객 정보 입력 */}
        {selectedProduct && (
          <section className="section">
            <h2 className="section-title">고객 정보</h2>
            <div className="customer-form">
              <div className="input-group">
                <label htmlFor="customer-name">성함</label>
                <input
                  id="customer-name"
                  type="text"
                  value={customerInfo.name}
                  onChange={handleNameChange}
                  placeholder="성함을 입력하세요"
                  className={`input-field ${fieldErrors.name ? 'error' : ''}`}
                />
                {fieldErrors.name && <div className="error-message">성함은 2글자 이상 입력해주세요.</div>}
              </div>
              <div className="input-group">
                <label htmlFor="customer-phone">전화번호</label>
                <input
                  id="customer-phone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  className={`input-field ${fieldErrors.phone ? 'error' : ''}`}
                  maxLength={13}
                />
                {fieldErrors.phone && <div className="error-message">올바른 전화번호를 입력해주세요.</div>}
              </div>
            </div>
          </section>
        )}

        {/* 결제 정보 확인 */}
        {selectedBranch && selectedProduct && (
          <section className="section">
            <h2 className="section-title">결제 정보</h2>
            <div className="payment-summary">
              <div className="summary-row">
                <span className="summary-label">지점:</span>
                <span className="summary-value">{getCurrentBranch()?.displayName}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">상품:</span>
                <span className="summary-value">{getCurrentProduct()?.name}</span>
              </div>
              <div className="summary-row total">
                <span className="summary-label">결제 금액:</span>
                <span className="summary-value">{formatPrice(getCurrentProduct()?.price || 0)}</span>
              </div>
            </div>
          </section>
        )}

        {/* 결제 수단 선택 */}
        {selectedProduct && (
          <section className="section">
            <h2 className="section-title">결제 수단</h2>
            <div className="payment-method-selection">
              {paymentMethods.map((method) => (
                <label key={method.id} className={`payment-method-card ${selectedPaymentMethod === method.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedPaymentMethod === method.id}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="payment-method-radio"
                  />
                  <div className="payment-method-info">
                    <div className="payment-method-name">{method.name}</div>
                    {method.description && (
                      <div className="payment-method-description">{method.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div className="pg-notice">
              ※ 본 페이지는 PG 심사용 결제 샘플입니다
            </div>
          </section>
        )}

        {/* PG 심사 대응 문구 */}
        <div className="pg-info">
          본 결제 페이지는 라비다 직영 지점 상품 결제를 위한 페이지이며, 실제 서비스 제공 후 결제가 진행됩니다.
        </div>
      </div>

      {/* 결제 버튼 */}
      {selectedBranch && selectedProduct && customerInfo.name && customerInfo.phone && (
        <div className="payment-button-container">
          <button 
            className="payment-button"
            onClick={handlePayment}
          >
            결제하기
          </button>
        </div>
      )}

      {/* 사업자 정보 푸터 */}
      <footer className="business-footer">
        <div className="business-info">
          <div className="company-name">(주)프리마베라컴퍼니</div>
          <div className="business-details">
            <div>대표전화 : 031-276-1205</div>
            <div>사업자등록번호 : 284-88-02400</div>
            <div>대표자 : 임성근</div>
          </div>
          <div className="address">
            주소: 경기도 용인시 수지구 신수로805, 케이투타워 3층 라비다 라운지
          </div>
          <div className="contact">
            <div>문의 : 031-276-1205</div>
            <div>이메일 : sg.lim@theprimavera.co.kr</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentPR;