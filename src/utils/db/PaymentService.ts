/**
 * 결제 관리 서비스
 */

import { BaseDBManager } from './BaseDBManager';
import { Payment, Order, OrderProcessingData } from './types';

export class PaymentService extends BaseDBManager {

  /**
   * 결제 정보 추가
   */
  async addPayment(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const payment: Payment = {
        id: this.generateUUID(),
        ...paymentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.executeTransaction('payments', 'readwrite', (store) => 
        store.add(payment)
      );

      console.log('결제 정보 추가 성공:', payment.id);
      return payment.id;
    } catch (error) {
      console.error('결제 정보 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 결제 정보 조회
   */
  async getAllPayments(): Promise<Payment[]> {
    try {
      return await this.executeTransaction('payments', 'readonly', (store) => 
        store.getAll()
      );
    } catch (error) {
      console.error('결제 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * ID로 결제 정보 조회
   */
  async getPaymentById(id: string): Promise<Payment | null> {
    try {
      return await this.executeTransaction('payments', 'readonly', (store) => 
        store.get(id)
      ) || null;
    } catch (error) {
      console.error('결제 정보 조회 실패:', error);
      return null;
    }
  }

  /**
   * 회원별 결제 정보 조회
   */
  async getPaymentsByMember(memberId: string): Promise<Payment[]> {
    try {
      return await this.executeTransaction('payments', 'readonly', (store) => {
        const index = store.index('memberId');
        return index.getAll(memberId);
      });
    } catch (error) {
      console.error('회원별 결제 정보 조회 실패:', error);
      return [];
    }
  }

  /**
   * 결제 정보 수정
   */
  async updatePayment(id: string, updates: Partial<Omit<Payment, 'id' | 'createdAt'>>): Promise<boolean> {
    try {
      const existingPayment = await this.getPaymentById(id);
      if (!existingPayment) {
        throw new Error('수정할 결제 정보를 찾을 수 없습니다.');
      }

      const updatedPayment: Payment = {
        ...existingPayment,
        ...updates,
        updatedAt: new Date(),
      };

      await this.executeTransaction('payments', 'readwrite', (store) => 
        store.put(updatedPayment)
      );

      console.log('결제 정보 수정 성공:', id);
      return true;
    } catch (error) {
      console.error('결제 정보 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 결제 정보 삭제
   */
  async deletePayment(id: string): Promise<boolean> {
    try {
      await this.executeTransaction('payments', 'readwrite', (store) => 
        store.delete(id)
      );

      console.log('결제 정보 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('결제 정보 삭제 실패:', error);
      throw error;
    }
  }
}

export class OrderService extends BaseDBManager {

  /**
   * 주문 생성
   */
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const order: Order = {
        id: this.generateUUID(),
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.executeTransaction('orders', 'readwrite', (store) => 
        store.add(order)
      );

      console.log('주문 생성 성공:', order.id);
      return order.id;
    } catch (error) {
      console.error('주문 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 주문 조회
   */
  async getOrderById(id: string): Promise<Order | null> {
    try {
      return await this.executeTransaction('orders', 'readonly', (store) => 
        store.get(id)
      ) || null;
    } catch (error) {
      console.error('주문 조회 실패:', error);
      return null;
    }
  }

  /**
   * 회원별 주문 조회
   */
  async getOrdersByMember(memberId: string): Promise<Order[]> {
    try {
      return await this.executeTransaction('orders', 'readonly', (store) => {
        const index = store.index('memberId');
        return index.getAll(memberId);
      });
    } catch (error) {
      console.error('회원별 주문 조회 실패:', error);
      return [];
    }
  }

  /**
   * 주문 상태 업데이트
   */
  async updateOrderStatus(orderId: string): Promise<void> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) throw new Error('주문을 찾을 수 없습니다.');

      let newStatus: Order['orderStatus'];
      if (order.unpaidAmount <= 0) {
        newStatus = 'completed';
      } else if (order.paidAmount > 0) {
        newStatus = 'partially_paid';
      } else {
        newStatus = 'pending';
      }

      await this.updateOrder(orderId, { orderStatus: newStatus });
    } catch (error) {
      console.error('주문 상태 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 주문 수정
   */
  async updateOrder(id: string, updates: Partial<Omit<Order, 'id' | 'createdAt'>>): Promise<boolean> {
    try {
      const existingOrder = await this.getOrderById(id);
      if (!existingOrder) {
        throw new Error('수정할 주문을 찾을 수 없습니다.');
      }

      const updatedOrder: Order = {
        ...existingOrder,
        ...updates,
        updatedAt: new Date(),
      };

      await this.executeTransaction('orders', 'readwrite', (store) => 
        store.put(updatedOrder)
      );

      console.log('주문 수정 성공:', id);
      return true;
    } catch (error) {
      console.error('주문 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 회원가입/수강등록 통합 주문 처리
   * 이 메서드는 다른 서비스들과의 협력이 필요하므로 외부에서 의존성을 주입받습니다.
   */
  async processOrderWithPayments(
    orderData: OrderProcessingData,
    dependencies: {
      productService: { getProductById: (id: string) => Promise<any> },
      paymentService: PaymentService,
      pointService: any, // PointService
      courseService: any  // CourseService
    }
  ): Promise<string> {
    try {
      const totalAmount = orderData.products.reduce((sum, p) => sum + p.price, 0);
      const totalPaid = orderData.payments.cash + orderData.payments.card + 
                       orderData.payments.transfer + orderData.payments.points;
      const unpaidAmount = Math.max(0, totalAmount - totalPaid);
      const excessAmount = Math.max(0, totalPaid - totalAmount);

      console.log('=== processOrderWithPayments 계산 ===');
      console.log(`총 주문금액: ${totalAmount.toLocaleString()}원`);
      console.log(`총 결제금액: ${totalPaid.toLocaleString()}원`);
      console.log(`미수금액: ${unpaidAmount.toLocaleString()}원`);
      console.log(`초과금액: ${excessAmount.toLocaleString()}원`);

      // 1. 주문 생성
      const orderId = await this.createOrder({
        memberId: orderData.memberInfo.id,
        memberName: orderData.memberInfo.name,
        branchId: orderData.memberInfo.branchId,
        branchName: orderData.memberInfo.branchName,
        coach: orderData.memberInfo.coach,
        coachName: orderData.memberInfo.coachName,
        orderItems: orderData.products.map(p => ({
          productId: p.id,
          productName: p.name,
          programId: p.programId,
          programName: p.programName,
          programType: p.programType,
          price: p.price,
          quantity: 1
        })),
        totalAmount,
        paidAmount: totalPaid,
        unpaidAmount,
        pointsUsed: orderData.payments.points,
        pointsEarned: excessAmount,
        orderStatus: unpaidAmount > 0 ? 'partially_paid' : 'completed',
        orderType: orderData.orderType
      });

      // 2. 개별 결제 기록 생성
      const paymentMethods = [
        { method: 'cash', amount: orderData.payments.cash },
        { method: 'card', amount: orderData.payments.card },
        { method: 'transfer', amount: orderData.payments.transfer }
      ];

      for (const payment of paymentMethods) {
        if (payment.amount > 0) {
          await dependencies.paymentService.addPayment({
            orderId,
            memberId: orderData.memberInfo.id,
            memberName: orderData.memberInfo.name,
            branchId: orderData.memberInfo.branchId,
            branchName: orderData.memberInfo.branchName,
            coach: orderData.memberInfo.coach,
            coachName: orderData.memberInfo.coachName,
            products: orderData.products.map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              quantity: 1,
              programId: p.programId,
              programName: p.programName,
              programType: p.programType
            })),
            totalAmount: payment.amount,
            paidAmount: payment.amount,
            unpaidAmount: 0,
            paymentStatus: 'completed',
            paymentMethod: payment.method,
            paymentDate: new Date(),
            paymentType: 'course',
            amount: payment.amount,
            memo: `${orderData.orderType} - ${payment.method} 결제`
          });
        }
      }

      // 3. 포인트 사용 처리
      if (orderData.payments.points > 0) {
        await dependencies.pointService.usePointsFIFO(
          orderData.memberInfo.id,
          orderData.payments.points,
          orderId,
          `${orderData.orderType} 포인트 결제`
        );
      }

      // 4. 초과금 포인트 적립
      if (excessAmount > 0) {
        console.log(`=== 초과금 포인트 적립 시작: ${excessAmount.toLocaleString()}원 ===`);

        // 상품 정보 준비
        const products = orderData.products.map(product => ({
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          // courseId와 courseName은 수강 등록 후 업데이트 예정
        }));

        try {
          // 1. 기본 초과금 포인트 적립
          await dependencies.pointService.addPointTransaction({
            memberId: orderData.memberInfo.id,
            memberName: orderData.memberInfo.name,
            amount: excessAmount,
            transactionType: 'earn',
            relatedOrderId: orderId,
            products: products,
            branchId: orderData.memberInfo.branchId,
            branchName: orderData.memberInfo.branchName,
            staffId: orderData.memberInfo.coach,  // coach가 담당 직원 ID
            staffName: orderData.memberInfo.coachName,  // coachName이 담당 직원명
            earnedDate: new Date(),
            isExpired: false,
            source: `${orderData.orderType} 초과금액`,
            description: `${orderData.orderType} 초과금액 포인트 적립 - 구매 상품: ${orderData.products.map(p => p.name).join(', ')}`
          });
          console.log(`기본 포인트 적립 완료: ${excessAmount.toLocaleString()}원`);

          // 2. 보너스 포인트 계산 및 적립 (100만원 단위로 10%씩 추가)
          if (excessAmount >= 1000000) {
            const millionUnits = Math.floor(excessAmount / 1000000);
            const bonusPoints = millionUnits * 100000; // 100만원당 10만원(10%) 보너스
            
            console.log(`=== 보너스 포인트 계산 ===`);
            console.log(`초과금액: ${excessAmount.toLocaleString()}원`);
            console.log(`100만원 단위: ${millionUnits}개`);
            console.log(`보너스 포인트: ${bonusPoints.toLocaleString()}원`);

            await dependencies.pointService.addPointTransaction({
              memberId: orderData.memberInfo.id,
              memberName: orderData.memberInfo.name,
              amount: bonusPoints,
              transactionType: 'earn',
              relatedOrderId: orderId,
              products: products,
              branchId: orderData.memberInfo.branchId,
              branchName: orderData.memberInfo.branchName,
              staffId: orderData.memberInfo.coach,
              staffName: orderData.memberInfo.coachName,
              earnedDate: new Date(),
              isExpired: false,
              source: '보너스포인트',
              description: `${orderData.orderType} 초과금액 보너스 포인트 (${excessAmount.toLocaleString()}원 → ${millionUnits}개 100만원 단위)`
            });
            console.log(`보너스 포인트 적립 완료: ${bonusPoints.toLocaleString()}원`);
          }
        } catch (pointError) {
          console.error('포인트 적립 실패:', pointError);
          throw pointError;
        }
      }

      // 5. 수강 등록 생성 (상품별) - 라커를 제외한 모든 프로그램 상품
      const createdCourses = []; // 생성된 수강 정보 저장
      
      console.log('=== 수강 등록 생성 시작 ===');
      let remainingPaid = totalPaid;
      
      for (const product of orderData.products) {
        // 라커 상품은 수강 등록에서 제외 (locker_ 로 시작하는 ID)
        if (product.id.startsWith('locker_')) {
          console.log(`라커 상품은 수강 등록에서 제외: ${product.name}`);
          continue;
        }

        console.log(`상품 처리: ${product.name} (적용가격: ${product.price.toLocaleString()}원, 원가: ${(product.originalPrice || product.price).toLocaleString()}원)`);
        
        // 이 상품에 할당될 결제액 계산 (적용된 가격 기준)
        const productPaidAmount = Math.min(remainingPaid, product.price);
        const productUnpaidAmount = Math.max(0, product.price - productPaidAmount);
        remainingPaid -= productPaidAmount;

        console.log(`- 상품별 결제액: ${productPaidAmount.toLocaleString()}원`);
        console.log(`- 상품별 미수액: ${productUnpaidAmount.toLocaleString()}원`);

        // 상품 상세 정보 조회 (세션 수와 기간 정보를 위해)
        const productDetails = await dependencies.productService.getProductById(product.id);
        console.log('- 상품 상세 정보:', productDetails);
        
        // 시작일과 종료일 설정
        let startDate: Date;
        let endDate: Date | undefined;
        
        if (product.programType === '기간제') {
          // 기간제 상품의 경우 사용자가 선택한 시작일/종료일 사용
          if (product.startDate && product.endDate) {
            startDate = new Date(product.startDate);
            endDate = new Date(product.endDate);
            console.log(`- 기간제 사용자 선택 기간: ${startDate.toLocaleDateString()} ~ ${endDate.toLocaleDateString()}`);
          } else {
            // 기본값으로 내일부터 30일
            startDate = new Date();
            startDate.setDate(startDate.getDate() + 1);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + (product.duration || 30));
            console.log(`- 기간제 기본 기간: ${startDate.toLocaleDateString()} ~ ${endDate.toLocaleDateString()}`);
          }
        } else {
          // 횟수제나 기타 상품의 경우 당일 시작
          startDate = new Date();
          console.log(`- 횟수제/기타 시작일: ${startDate.toLocaleDateString()}`);
        }

        const courseData = {
          orderId,
          memberId: orderData.memberInfo.id,
          memberName: orderData.memberInfo.name,
          productId: product.id,
          productName: product.name,
          productPrice: product.originalPrice || product.price, // 계산된 정확한 상품 가격
          appliedPrice: product.price, // 사용자가 조정한 적용 가격 (required)
          programId: product.programId,
          programName: product.programName,
          programType: product.programType,
          branchId: orderData.memberInfo.branchId,
          branchName: orderData.memberInfo.branchName,
          coach: orderData.memberInfo.coach,
          coachName: orderData.memberInfo.coachName,
          enrollmentStatus: (productUnpaidAmount > 0 ? 'unpaid' : 'active') as 'unpaid' | 'active',
          paidAmount: productPaidAmount,
          unpaidAmount: productUnpaidAmount,
          startDate: startDate,
          endDate: endDate,
          sessionCount: product.programType === '횟수제' ? (product.sessions || productDetails?.sessions) : undefined,
          completedSessions: 0,
          notes: `${orderData.orderType}을 통한 등록`
        };

        console.log('- 수강 등록 데이터:', courseData);

        try {
          const courseId = await dependencies.courseService.addCourseEnrollment(courseData);
          console.log(`✓ 수강 등록 성공: ${courseId}`);
          
          // 생성된 수강 정보 저장
          createdCourses.push({
            productId: product.id,
            courseId: courseId,
            courseName: product.programName
          });
        } catch (courseError) {
          console.error(`✗ 수강 등록 실패:`, courseError);
          throw courseError;
        }
      }
      console.log('=== 수강 등록 생성 완료 ===');

      // 6. 포인트 거래에 수강 정보 업데이트 (초과금 적립이 있었고 수강이 생성된 경우)
      if (excessAmount > 0 && createdCourses.length > 0) {
        console.log('=== 포인트 거래에 수강 정보 업데이트 시작 ===');
        try {
          await dependencies.pointService.updatePointTransactionWithCourseInfo(orderId, createdCourses);
          console.log('✓ 포인트 거래 수강 정보 업데이트 완료');
        } catch (updateError) {
          console.error('✗ 포인트 거래 수강 정보 업데이트 실패:', updateError);
          // 실패해도 전체 프로세스는 계속 진행
        }
      }

      console.log(`통합 주문 처리 완료: ${orderId}`);
      return orderId;
    } catch (error) {
      console.error('통합 주문 처리 실패:', error);
      throw error;
    }
  }
}