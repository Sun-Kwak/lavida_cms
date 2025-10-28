import { toast } from 'react-toastify';
import { MemberFormData } from './types';
import { dbManager } from '../../../utils/indexedDB';

// ID를 이름으로 변환하는 함수들
const getBranchName = async (branchId: string): Promise<string> => {
  if (!branchId) return '선택되지 않음';
  try {
    const branches = await dbManager.getAllBranches();
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : branchId;
  } catch (error) {
    console.error('지점 이름 조회 실패:', error);
    return branchId;
  }
};

const getStaffName = async (staffId: string): Promise<string> => {
  if (!staffId) return '선택되지 않음';
  try {
    const staff = await dbManager.getAllStaff();
    const employee = staff.find(s => s.id === staffId);
    return employee ? employee.name : staffId;
  } catch (error) {
    console.error('직원 이름 조회 실패:', error);
    return staffId;
  }
};

// HTML 문서 생성 함수
const generateDocumentHTML = async (formData: MemberFormData): Promise<string> => {
  const branchName = await getBranchName(formData.joinInfo.branchId);
  const coachName = await getStaffName(formData.joinInfo.coach);
  
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>회원 등록 정보 - ${formData.basicInfo.name || '신규회원'}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f5f5f5;
        }
        
        .document-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background: white;
          min-height: 100vh;
        }
        
        .document-header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #007bff;
        }
        
        .document-title {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin: 0 0 8px 0;
        }
        
        .document-subtitle {
          font-size: 16px;
          color: #666;
          margin: 0;
        }
        
        .section {
          margin-bottom: 40px;
          break-inside: avoid;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #007bff;
          margin: 0 0 20px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #dee2e6;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .info-label {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }
        
        .info-value {
          font-size: 16px;
          color: #333;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        }
        
        .product-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #dee2e6;
          margin-bottom: 8px;
        }
        
        .product-name {
          font-size: 16px;
          color: #333;
          flex: 1;
        }
        
        .product-price {
          font-size: 16px;
          color: #007bff;
          font-weight: 600;
        }
        
        .agreement-item {
          margin-bottom: 24px;
          break-inside: avoid;
        }
        
        .agreement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          gap: 12px;
        }
        
        .agreement-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0;
          flex: 1;
        }
        
        .agreement-status {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .agreement-status.agreed {
          background: #e7f5e7;
          color: #2d5a2d;
          border: 1px solid #c3e6c3;
        }
        
        .agreement-status.not-agreed {
          background: #fff2f2;
          color: #8b1538;
          border: 1px solid #f5c6cb;
        }
        
        .agreement-content {
          border: 1px solid #dee2e6;
          border-radius: 4px;
          background: white;
          padding: 16px;
          overflow: hidden;
        }
        
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 20px;
        }
        
        .signature-box {
          text-align: center;
          padding: 20px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          background: #f8f9fa;
        }
        
        .signature-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
          font-weight: 500;
        }
        
        .signature-image {
          max-width: 100%;
          height: 100px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          background: white;
          object-fit: contain;
        }
        
        .no-signature {
          height: 100px;
          border: 1px dashed #dee2e6;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-size: 14px;
          background: white;
        }
        
        @media print {
          body {
            background: white;
          }
          
          .document-container {
            padding: 20px;
            box-shadow: none;
          }
          
          .section {
            page-break-inside: avoid;
          }
        }
        
        @media (max-width: 600px) {
          .info-grid,
          .signature-section {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        <div class="document-header">
          <h1 class="document-title">회원 등록 정보</h1>
          <p class="document-subtitle">작성일: ${new Date().toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">1. 기본 정보</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">이름</span>
              <span class="info-value">${formData.basicInfo.name || '입력되지 않음'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">전화번호</span>
              <span class="info-value">${formData.basicInfo.phone || '입력되지 않음'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">이메일</span>
              <span class="info-value">${formData.basicInfo.email || '입력되지 않음'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">생년월일</span>
              <span class="info-value">${formData.basicInfo.birth || '입력되지 않음'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">성별</span>
              <span class="info-value">${
                formData.basicInfo.gender === 'male' ? '남성' : 
                formData.basicInfo.gender === 'female' ? '여성' : '선택되지 않음'
              }</span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <span class="info-label">주소</span>
              <span class="info-value">${formData.basicInfo.addressInfo.address || '입력되지 않음'}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">2. 가입 정보</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">지점</span>
              <span class="info-value">${branchName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">담당 코치</span>
              <span class="info-value">${coachName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">가입 경로</span>
              <span class="info-value">${formData.joinInfo.joinPath || '선택되지 않음'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">로그인 ID</span>
              <span class="info-value">${formData.joinInfo.loginId || '입력되지 않음'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">로그인 사용</span>
              <span class="info-value">${formData.joinInfo.enableLogin ? '사용' : '사용안함'}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">3. 결제 정보</h2>
          ${formData.paymentInfo.selectedProducts.length > 0 ? 
            formData.paymentInfo.selectedProducts.map(product => `
              <div class="product-item">
                <span class="product-name">${product.name}</span>
                <span class="product-price">${product.price.toLocaleString()}원</span>
              </div>
            `).join('') : 
            '<span class="info-value" style="display: block; color: #666;">선택된 상품이 없습니다</span>'
          }
        </div>
        
        <div class="section">
          <h2 class="section-title">4. 약관 동의 및 서명</h2>
          
          <div style="margin-bottom: 32px;">
            <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">약관 동의 현황</h4>
            ${formData.agreementInfo.agreements.map(agreement => `
              <div class="agreement-item">
                <div class="agreement-header">
                  <h3 class="agreement-title">
                    ${agreement.title} ${agreement.required ? '(필수)' : ''}
                  </h3>
                  <span class="agreement-status ${agreement.agreed ? 'agreed' : 'not-agreed'}">
                    ${agreement.agreed ? '동의함' : '동의안함'}
                  </span>
                </div>
                <div class="agreement-content">
                  ${agreement.content}
                </div>
              </div>
            `).join('')}
          </div>

          <div>
            <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">서명</h4>
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-label">고객 서명</div>
                ${formData.agreementInfo.customerSignature ? 
                  `<img class="signature-image" src="${formData.agreementInfo.customerSignature}" alt="고객 서명" />` :
                  '<div class="no-signature">서명되지 않음</div>'
                }
                <div style="margin-top: 8px; font-size: 12px; color: #666;">
                  위 약관에 동의하며 서명합니다.
                </div>
              </div>
              <div class="signature-box">
                <div class="signature-label">직원 서명</div>
                ${formData.agreementInfo.staffSignature ? 
                  `<img class="signature-image" src="${formData.agreementInfo.staffSignature}" alt="직원 서명" />` :
                  '<div class="no-signature">서명되지 않음</div>'
                }
                <div style="margin-top: 8px; font-size: 12px; color: #666;">
                  약관 설명 및 확인 완료
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// 파일로 저장하는 함수
export const saveDocumentAsFile = async (formData: MemberFormData): Promise<string> => {
  try {
    const html = await generateDocumentHTML(formData);
    const fileName = `회원등록_${formData.basicInfo.name || '신규회원'}_${new Date().toISOString().slice(0, 10)}.html`;
    
    // Blob으로 파일 생성
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // 파일 다운로드
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return fileName;
  } catch (error) {
    console.error('문서 저장 실패:', error);
    throw error;
  }
};

// 새창에서 열기 위한 함수
export const openPreviewWindow = async (formData: MemberFormData) => {
  // 비동기적으로 이름들을 가져오기
  const branchName = await getBranchName(formData.joinInfo.branchId);
  const coachName = await getStaffName(formData.joinInfo.coach);
  const newWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
  
  if (newWindow) {
    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>회원 등록 정보 - ${formData.basicInfo.name || '신규회원'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
          }
          
          .document-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
            min-height: 100vh;
          }
          
          .document-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #007bff;
          }
          
          .document-title {
            font-size: 28px;
            font-weight: 700;
            color: #333;
            margin: 0 0 8px 0;
          }
          
          .document-subtitle {
            font-size: 16px;
            color: #666;
            margin: 0;
          }
          
          .section {
            margin-bottom: 40px;
            break-inside: avoid;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #007bff;
            margin: 0 0 20px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid #dee2e6;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .info-label {
            font-size: 14px;
            color: #666;
            font-weight: 500;
          }
          
          .info-value {
            font-size: 16px;
            color: #333;
            padding: 8px 12px;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #dee2e6;
          }
          
          .product-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            margin-bottom: 8px;
          }
          
          .product-name {
            font-size: 16px;
            color: #333;
            flex: 1;
          }
          
          .product-price {
            font-size: 16px;
            color: #007bff;
            font-weight: 600;
          }
          
          .agreement-item {
            margin-bottom: 24px;
            break-inside: avoid;
          }
          
          .agreement-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            gap: 12px;
          }
          
          .agreement-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin: 0;
            flex: 1;
          }
          
          .agreement-status {
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
          }
          
          .agreement-status.agreed {
            background: #e7f5e7;
            color: #2d5a2d;
            border: 1px solid #c3e6c3;
          }
          
          .agreement-status.not-agreed {
            background: #fff2f2;
            color: #8b1538;
            border: 1px solid #f5c6cb;
          }
          
          .agreement-content {
            border: 1px solid #dee2e6;
            border-radius: 4px;
            background: white;
            padding: 16px;
            overflow: hidden;
          }
          
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-top: 20px;
          }
          
          .signature-box {
            text-align: center;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            background: #f8f9fa;
          }
          
          .signature-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 12px;
            font-weight: 500;
          }
          
          .signature-image {
            max-width: 100%;
            height: 100px;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            background: white;
            object-fit: contain;
          }
          
          .no-signature {
            height: 100px;
            border: 1px dashed #dee2e6;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 14px;
            background: white;
          }
          
          @media print {
            body {
              background: white;
            }
            
            .document-container {
              padding: 20px;
              box-shadow: none;
            }
            
            .section {
              page-break-inside: avoid;
            }
          }
          
          @media (max-width: 600px) {
            .info-grid,
            .signature-section {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="document-container">
          <div class="document-header">
            <h1 class="document-title">회원 등록 정보</h1>
            <p class="document-subtitle">작성일: ${new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          
          <div class="section">
            <h2 class="section-title">1. 기본 정보</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">이름</span>
                <span class="info-value">${formData.basicInfo.name || '입력되지 않음'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">전화번호</span>
                <span class="info-value">${formData.basicInfo.phone || '입력되지 않음'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">이메일</span>
                <span class="info-value">${formData.basicInfo.email || '입력되지 않음'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">생년월일</span>
                <span class="info-value">${formData.basicInfo.birth || '입력되지 않음'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">성별</span>
                <span class="info-value">${
                  formData.basicInfo.gender === 'male' ? '남성' : 
                  formData.basicInfo.gender === 'female' ? '여성' : '선택되지 않음'
                }</span>
              </div>
              <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">주소</span>
                <span class="info-value">${formData.basicInfo.addressInfo.address || '입력되지 않음'}</span>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">2. 가입 정보</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">지점</span>
                <span class="info-value">${branchName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">담당 코치</span>
                <span class="info-value">${coachName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">가입 경로</span>
                <span class="info-value">${formData.joinInfo.joinPath || '선택되지 않음'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">로그인 ID</span>
                <span class="info-value">${formData.joinInfo.loginId || '입력되지 않음'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">로그인 사용</span>
                <span class="info-value">${formData.joinInfo.enableLogin ? '사용' : '사용안함'}</span>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">3. 결제 정보</h2>
            ${formData.paymentInfo.selectedProducts.length > 0 ? 
              formData.paymentInfo.selectedProducts.map(product => `
                <div class="product-item">
                  <span class="product-name">${product.name}</span>
                  <span class="product-price">${product.price.toLocaleString()}원</span>
                </div>
              `).join('') : 
              '<span class="info-value" style="display: block; color: #666;">선택된 상품이 없습니다</span>'
            }
          </div>
          
          <div class="section">
            <h2 class="section-title">4. 약관 동의 및 서명</h2>
            
            <div style="margin-bottom: 32px;">
              <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">약관 동의 현황</h4>
              ${formData.agreementInfo.agreements.map(agreement => `
                <div class="agreement-item">
                  <div class="agreement-header">
                    <h3 class="agreement-title">
                      ${agreement.title} ${agreement.required ? '(필수)' : ''}
                    </h3>
                    <span class="agreement-status ${agreement.agreed ? 'agreed' : 'not-agreed'}">
                      ${agreement.agreed ? '동의함' : '동의안함'}
                    </span>
                  </div>
                  <div class="agreement-content">
                    ${agreement.content}
                  </div>
                </div>
              `).join('')}
            </div>

            <div>
              <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">서명</h4>
              <div class="signature-section">
                <div class="signature-box">
                  <div class="signature-label">고객 서명</div>
                  ${formData.agreementInfo.customerSignature ? 
                    `<img class="signature-image" src="${formData.agreementInfo.customerSignature}" alt="고객 서명" />` :
                    '<div class="no-signature">서명되지 않음</div>'
                  }
                  <div style="margin-top: 8px; font-size: 12px; color: #666;">
                    위 약관에 동의하며 서명합니다.
                  </div>
                </div>
                <div class="signature-box">
                  <div class="signature-label">직원 서명</div>
                  ${formData.agreementInfo.staffSignature ? 
                    `<img class="signature-image" src="${formData.agreementInfo.staffSignature}" alt="직원 서명" />` :
                    '<div class="no-signature">서명되지 않음</div>'
                  }
                  <div style="margin-top: 8px; font-size: 12px; color: #666;">
                    약관 설명 및 확인 완료
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    newWindow.document.close();
    newWindow.focus();
  } else {
    toast.error('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
  }
};
