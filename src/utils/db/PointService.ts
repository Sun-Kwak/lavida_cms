/**
 * 포인트 관리 서비스
 */

import { BaseDBManager } from './BaseDBManager';
import { Point, PointTransaction, PointBalance, PointStats } from './types';

export class PointService extends BaseDBManager {

  // ==================== 기존 포인트 시스템 (호환성 유지) ====================

  /**
   * 포인트 적립 (기존 시스템)
   */
  async addPoint(pointData: Omit<Point, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const point: Point = {
        id: this.generateUUID(),
        ...pointData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.executeTransaction('points', 'readwrite', (store) => 
        store.add(point)
      );

      console.log('포인트 적립 성공:', point.id, `${point.amount}원`);
      return point.id;
    } catch (error) {
      console.error('포인트 적립 실패:', error);
      throw error;
    }
  }

  /**
   * 회원별 포인트 내역 조회 (기존 시스템)
   */
  async getPointsByMember(memberId: string): Promise<Point[]> {
    try {
      return await this.executeTransaction('points', 'readonly', (store) => {
        const index = store.index('memberId');
        return index.getAll(memberId);
      });
    } catch (error) {
      console.error('회원별 포인트 조회 실패:', error);
      return [];
    }
  }

  /**
   * 회원의 현재 사용 가능한 포인트 잔액 계산 (기존 시스템)
   */
  async getMemberPointBalance(memberId: string): Promise<number> {
    try {
      const points = await this.getPointsByMember(memberId);
      const now = new Date();
      
      // 만료되지 않은 포인트들만 계산
      const validPoints = points.filter(point => {
        // 만료일이 없거나 만료일이 지나지 않은 경우
        return !point.expiryDate || point.expiryDate > now;
      });
      
      // 총 포인트 합계 (적립은 +, 사용은 -)
      return validPoints.reduce((total, point) => total + point.amount, 0);
    } catch (error) {
      console.error('포인트 잔액 계산 실패:', error);
      return 0;
    }
  }

  /**
   * 포인트 사용 (기존 시스템)
   */
  async usePoints(memberId: string, amount: number, source: string, description?: string, relatedPaymentId?: string): Promise<string> {
    try {
      // 사용 가능한 포인트 잔액 확인
      const currentBalance = await this.getMemberPointBalance(memberId);
      
      if (currentBalance < amount) {
        throw new Error(`포인트가 부족합니다. 현재 잔액: ${currentBalance.toLocaleString()}원, 사용 요청: ${amount.toLocaleString()}원`);
      }

      // 회원 정보 조회 - 외부에서 주입받아야 함
      const memberName = 'Unknown'; // TODO: 회원 서비스에서 이름 조회

      // 포인트 사용 내역 추가 (음수로 저장)
      return await this.addPoint({
        memberId,
        memberName,
        amount: -amount, // 사용은 음수
        type: 'used',
        source,
        description,
        relatedPaymentId
      });
    } catch (error) {
      console.error('포인트 사용 실패:', error);
      throw error;
    }
  }

  /**
   * 만료된 포인트 처리 (기존 시스템)
   */
  async expirePoints(): Promise<number> {
    try {
      const now = new Date();
      const allPoints = await this.executeTransaction('points', 'readonly', (store) => 
        store.getAll()
      );
      
      // 만료된 적립 포인트 찾기 (type이 'earned'이고 만료일이 지난 것들)
      const expiredPoints = allPoints.filter(point => 
        point.type === 'earned' && 
        point.expiryDate && 
        point.expiryDate <= now &&
        point.amount > 0 // 적립된 포인트만
      );
      
      let expiredCount = 0;
      
      // 각 만료된 포인트에 대해 만료 처리 레코드 생성
      for (const expiredPoint of expiredPoints) {
        await this.addPoint({
          memberId: expiredPoint.memberId,
          memberName: expiredPoint.memberName,
          amount: -expiredPoint.amount, // 만료는 음수로 차감
          type: 'expired',
          source: '포인트 만료',
          description: `${expiredPoint.expiryDate.toLocaleDateString()} 만료된 포인트`,
          relatedPaymentId: expiredPoint.relatedPaymentId
        });
        
        expiredCount++;
      }
      
      console.log(`만료된 포인트 처리 완료: ${expiredCount}건`);
      return expiredCount;
    } catch (error) {
      console.error('포인트 만료 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 포인트 내역 검색
   */
  async searchPoints(searchTerm: string): Promise<Point[]> {
    try {
      const allPoints = await this.executeTransaction('points', 'readonly', (store) => 
        store.getAll()
      );
      
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      return allPoints.filter(point => 
        point.memberName.toLowerCase().includes(lowerSearchTerm) ||
        point.source.toLowerCase().includes(lowerSearchTerm) ||
        (point.description && point.description.toLowerCase().includes(lowerSearchTerm))
      );
    } catch (error) {
      console.error('포인트 검색 실패:', error);
      return [];
    }
  }

  /**
   * 회원의 포인트 적립/사용 통계
   */
  async getMemberPointStats(memberId: string): Promise<PointStats> {
    try {
      const points = await this.getPointsByMember(memberId);
      
      const totalEarned = points
        .filter(p => p.type === 'earned')
        .reduce((sum, p) => sum + p.amount, 0);
        
      const totalUsed = Math.abs(points
        .filter(p => p.type === 'used')
        .reduce((sum, p) => sum + p.amount, 0));
        
      const totalExpired = Math.abs(points
        .filter(p => p.type === 'expired')
        .reduce((sum, p) => sum + p.amount, 0));
      
      const currentBalance = await this.getMemberPointBalance(memberId);
      
      return {
        totalEarned,
        totalUsed,
        totalExpired,
        currentBalance,
        transactionCount: points.length
      };
    } catch (error) {
      console.error('포인트 통계 조회 실패:', error);
      return {
        totalEarned: 0,
        totalUsed: 0,
        totalExpired: 0,
        currentBalance: 0,
        transactionCount: 0
      };
    }
  }

  /**
   * 회원의 포인트 적립/사용 통계 (새로운 시스템 전용)
   */
  async getMemberPointStatsUnified(memberId: string): Promise<PointStats> {
    try {
      // 새로운 포인트 시스템에서 해당 회원의 데이터만 필터링
      const allPoints = await this.getAllPointsFromTransactions();
      const memberPoints = allPoints.filter((p: Point) => p.memberId === memberId);
      
      const totalEarned = memberPoints
        .filter((p: Point) => p.type === 'earned')
        .reduce((sum: number, p: Point) => sum + p.amount, 0);
        
      const totalUsed = Math.abs(memberPoints
        .filter((p: Point) => p.type === 'used')
        .reduce((sum: number, p: Point) => sum + p.amount, 0));
        
      const totalExpired = Math.abs(memberPoints
        .filter((p: Point) => p.type === 'expired')
        .reduce((sum: number, p: Point) => sum + p.amount, 0));
      
      const currentBalance = await this.getMemberPointBalanceV2(memberId);
      
      return {
        totalEarned,
        totalUsed,
        totalExpired,
        currentBalance,
        transactionCount: memberPoints.length
      };
    } catch (error) {
      console.error('새로운 포인트 시스템 통계 조회 실패:', error);
      return {
        totalEarned: 0,
        totalUsed: 0,
        totalExpired: 0,
        currentBalance: 0,
        transactionCount: 0
      };
    }
  }

  /**
   * 모든 포인트 내역 조회
   */
  async getAllPoints(): Promise<Point[]> {
    try {
      return await this.executeTransaction('points', 'readonly', (store) => 
        store.getAll()
      );
    } catch (error) {
      console.error('포인트 내역 조회 실패:', error);
      return [];
    }
  }

  /**
   * 새로운 포인트 시스템에서 모든 포인트 내역 조회 (Point 형식으로 변환)
   */
  async getAllPointsFromTransactions(): Promise<Point[]> {
    try {
      console.log('새로운 포인트 시스템에서 데이터 조회 중...');
      
      // 새로운 포인트 트랜잭션 데이터 조회
      const transactions = await this.executeTransaction('pointTransactions', 'readonly', (store) => 
        store.getAll()
      ) as PointTransaction[];
      console.log(`포인트 트랜잭션: ${transactions.length}건`);
      
      // PointTransaction을 Point 형식으로 변환하면서 확장 필드도 포함
      const convertedPoints: Point[] = transactions.map(tx => ({
        id: tx.id,
        memberId: tx.memberId,
        memberName: tx.memberName,
        amount: tx.amount,
        type: tx.transactionType === 'earn' ? 'earned' : 
              tx.transactionType === 'use' ? 'used' : 
              tx.transactionType === 'expire' ? 'expired' : 'adjusted',
        source: tx.source,
        description: tx.description,
        expiryDate: tx.expiryDate,
        relatedPaymentId: tx.relatedOrderId, // orderId를 paymentId로 매핑
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        // 확장 필드들을 any 타입으로 추가 (기존 Point 타입 호환성 유지)
        ...(tx.products && { products: tx.products }),
        ...(tx.branchId && { branchId: tx.branchId }),
        ...(tx.branchName && { branchName: tx.branchName }),
        ...(tx.staffId && { staffId: tx.staffId }),
        ...(tx.staffName && { staffName: tx.staffName }),
        ...(tx.relatedOrderId && { relatedOrderId: tx.relatedOrderId })
      }));
      
      // 생성일 기준으로 최신 순 정렬
      const sortedPoints = convertedPoints.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log(`변환된 포인트 내역: ${sortedPoints.length}건`);
      console.log('최근 3건:', sortedPoints.slice(0, 3).map(p => ({
        날짜: p.createdAt,
        회원: p.memberName,
        금액: p.amount,
        타입: p.type,
        출처: p.source
      })));
      
      return sortedPoints;
      
    } catch (error) {
      console.error('새로운 포인트 시스템 조회 실패:', error);
      return [];
    }
  }

  // ==================== 개선된 포인트 시스템 ====================

  /**
   * 포인트 거래 추가
   */
  async addPointTransaction(transactionData: Omit<PointTransaction, 'id' | 'createdAt' | 'updatedAt' | 'balance'>): Promise<string> {
    try {
      // 현재 잔액 계산
      const currentBalance = await this.getMemberPointBalanceV2(transactionData.memberId);
      const newBalance = currentBalance + transactionData.amount;

      const transaction: PointTransaction = {
        id: this.generateUUID(),
        ...transactionData,
        balance: newBalance,
        isExpired: transactionData.isExpired || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.executeTransaction('pointTransactions', 'readwrite', (store) => 
        store.add(transaction)
      );

      // 포인트 잔액 테이블 업데이트
      await this.updatePointBalance(transactionData.memberId);

      console.log('포인트 거래 추가 성공:', transaction.id, `${transaction.amount}원`);
      return transaction.id;
    } catch (error) {
      console.error('포인트 거래 추가 실패:', error);
      throw error;
    }
  }

  /**
   * FIFO 방식 포인트 사용
   */
  async usePointsFIFO(memberId: string, amount: number, orderId: string, source: string = '상품구매'): Promise<void> {
    try {
      // 1. 사용 가능한 포인트를 적립일 순으로 조회
      const availablePoints = await this.getAvailablePointsOrderByEarnedDate(memberId);
      
      let remainingAmount = amount;
      const usageRecords = [];
      
      // 2. FIFO 방식으로 포인트 차감 계획 수립
      for (const pointBatch of availablePoints) {
        if (remainingAmount <= 0) break;
        
        const useAmount = Math.min(remainingAmount, pointBatch.availableAmount);
        usageRecords.push({
          originalTransactionId: pointBatch.id,
          amount: useAmount,
          earnedDate: pointBatch.earnedDate
        });
        
        remainingAmount -= useAmount;
      }
      
      if (remainingAmount > 0) {
        throw new Error(`포인트 잔액이 부족합니다. 부족 금액: ${remainingAmount.toLocaleString()}원`);
      }
      
      // 3. 사용 내역 기록
      const memberName = 'Unknown'; // TODO: 회원 서비스에서 이름 조회
      for (const usage of usageRecords) {
        await this.addPointTransaction({
          memberId,
          memberName,
          amount: -usage.amount,
          transactionType: 'use',
          relatedOrderId: orderId,
          earnedDate: usage.earnedDate,
          originalTransactionId: usage.originalTransactionId,
          isExpired: false,
          source,
          description: `FIFO 방식 포인트 사용 (원본: ${usage.originalTransactionId.slice(-8)})`
        });
      }
      
      console.log(`FIFO 포인트 사용 완료: ${amount.toLocaleString()}원, ${usageRecords.length}개 배치에서 차감`);
    } catch (error) {
      console.error('FIFO 포인트 사용 실패:', error);
      throw error;
    }
  }

  /**
   * 적립일 순으로 사용 가능한 포인트 조회
   */
  async getAvailablePointsOrderByEarnedDate(memberId: string): Promise<Array<{
    id: string;
    availableAmount: number;
    earnedDate: Date;
  }>> {
    try {
      const transactions = await this.executeTransaction('pointTransactions', 'readonly', (store) => {
        return store.getAll();
      }).then(allTransactions => 
        allTransactions.filter(t => t.memberId === memberId)
      );

      // 적립된 포인트들을 그룹화하고 사용/만료된 포인트를 차감
      const earnedTransactions = transactions.filter(t => 
        t.transactionType === 'earn' && 
        !t.isExpired &&
        (!t.expiryDate || t.expiryDate > new Date())
      );

      const availablePoints = [];
      
      for (const earnedTx of earnedTransactions) {
        // 해당 적립 포인트에서 사용/만료된 금액 계산
        const usedAmount = transactions
          .filter(t => 
            t.originalTransactionId === earnedTx.id && 
            (t.transactionType === 'use' || t.transactionType === 'expire')
          )
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const availableAmount = earnedTx.amount - usedAmount;
        
        if (availableAmount > 0) {
          availablePoints.push({
            id: earnedTx.id,
            availableAmount,
            earnedDate: earnedTx.earnedDate || earnedTx.createdAt
          });
        }
      }

      // 적립일 순으로 정렬 (오래된 것부터)
      return availablePoints.sort((a, b) => a.earnedDate.getTime() - b.earnedDate.getTime());
    } catch (error) {
      console.error('사용 가능한 포인트 조회 실패:', error);
      return [];
    }
  }

  /**
   * 포인트 잔액 테이블 업데이트
   */
  async updatePointBalance(memberId: string): Promise<void> {
    try {
      const transactions = await this.executeTransaction('pointTransactions', 'readonly', (store) => {
        const index = store.index('memberId');
        return index.getAll(memberId);
      });

      const now = new Date();
      const validTransactions = transactions.filter(t => 
        !t.isExpired && (!t.expiryDate || t.expiryDate > now)
      );

      const totalBalance = validTransactions.reduce((sum, t) => sum + t.amount, 0);
      const earnedPoints = transactions.filter(t => t.transactionType === 'earn').reduce((sum, t) => sum + t.amount, 0);
      const usedPoints = Math.abs(transactions.filter(t => t.transactionType === 'use').reduce((sum, t) => sum + t.amount, 0));
      const expiredPoints = Math.abs(transactions.filter(t => t.transactionType === 'expire').reduce((sum, t) => sum + t.amount, 0));

      // 만료 예정 포인트 계산
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);

      const expiringIn30Days = validTransactions.filter(t => 
        t.expiryDate && t.expiryDate <= in30Days && t.transactionType === 'earn'
      ).reduce((sum, t) => sum + t.amount, 0);

      const expiringIn7Days = validTransactions.filter(t => 
        t.expiryDate && t.expiryDate <= in7Days && t.transactionType === 'earn'
      ).reduce((sum, t) => sum + t.amount, 0);

      const balanceData: PointBalance = {
        id: `balance_${memberId}`,
        memberId,
        totalBalance,
        earnedPoints,
        usedPoints,
        expiredPoints,
        expiringIn30Days,
        expiringIn7Days,
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.executeTransaction('pointBalances', 'readwrite', (store) => 
        store.put(balanceData)
      );

      console.log(`포인트 잔액 업데이트 완료: ${memberId} - ${totalBalance.toLocaleString()}원`);
    } catch (error) {
      console.error('포인트 잔액 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 포인트 잔액 조회 (캐시된 값 사용)
   */
  async getMemberPointBalanceCached(memberId: string): Promise<number> {
    try {
      const balance = await this.executeTransaction('pointBalances', 'readonly', (store) => 
        store.get(`balance_${memberId}`)
      );

      if (balance) {
        // 캐시된 값이 너무 오래되었다면 새로 계산
        const hoursSinceUpdate = (new Date().getTime() - balance.lastUpdated.getTime()) / (1000 * 60 * 60);
        if (hoursSinceUpdate < 1) { // 1시간 이내면 캐시 사용
          return balance.totalBalance;
        }
      }

      // 캐시가 없거나 오래되었으면 실시간 계산 후 캐시 업데이트
      await this.updatePointBalance(memberId);
      const updatedBalance = await this.executeTransaction('pointBalances', 'readonly', (store) => 
        store.get(`balance_${memberId}`)
      );
      
      return updatedBalance?.totalBalance || 0;
    } catch (error) {
      console.error('포인트 잔액 조회 실패:', error);
      return 0;
    }
  }

  /**
   * 개선된 포인트 만료 처리
   */
  async expirePointsImproved(): Promise<number> {
    try {
      const now = new Date();
      
      // 만료된 적립 포인트 조회 (아직 만료 처리되지 않은 것만)
      const expiredTransactions = await this.executeTransaction('pointTransactions', 'readonly', (store) => {
        return store.getAll();
      }).then(transactions => 
        transactions.filter(t => 
          t.transactionType === 'earn' && 
          !t.isExpired &&
          t.expiryDate && 
          t.expiryDate <= now
        )
      );

      let expiredCount = 0;
      const memberGroups = new Map<string, PointTransaction[]>();

      // 회원별로 그룹화
      for (const transaction of expiredTransactions) {
        const memberId = transaction.memberId;
        if (!memberGroups.has(memberId)) {
          memberGroups.set(memberId, []);
        }
        memberGroups.get(memberId)!.push(transaction);
      }

      // 각 회원별로 만료 처리
      for (const memberData of Array.from(memberGroups.entries())) {
        const [memberId, transactions] = memberData;
        for (const transaction of transactions) {
          // 해당 적립 포인트에서 실제 사용 가능한 금액 계산
          const availablePoints = await this.getAvailablePointsOrderByEarnedDate(memberId);
          const availablePoint = availablePoints.find(p => p.id === transaction.id);
          
          if (availablePoint && availablePoint.availableAmount > 0) {
            // 만료 처리 기록
            await this.addPointTransaction({
              memberId,
              memberName: transaction.memberName,
              amount: -availablePoint.availableAmount,
              transactionType: 'expire',
              originalTransactionId: transaction.id,
              earnedDate: transaction.earnedDate,
              isExpired: false,
              source: '포인트 만료',
              description: `만료일: ${transaction.expiryDate?.toLocaleDateString()}`
            });

            // 원본 거래를 만료 상태로 표시
            await this.markTransactionAsExpired(transaction.id);
            expiredCount++;
          }
        }
      }

      console.log(`만료된 포인트 처리 완료: ${expiredCount}건`);
      return expiredCount;
    } catch (error) {
      console.error('포인트 만료 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 거래를 만료 상태로 표시
   */
  async markTransactionAsExpired(transactionId: string): Promise<void> {
    try {
      const transaction = await this.executeTransaction('pointTransactions', 'readonly', (store) => 
        store.get(transactionId)
      );

      if (transaction) {
        transaction.isExpired = true;
        transaction.updatedAt = new Date();

        await this.executeTransaction('pointTransactions', 'readwrite', (store) => 
          store.put(transaction)
        );
      }
    } catch (error) {
      console.error('거래 만료 상태 표시 실패:', error);
      throw error;
    }
  }

  /**
   * 회원 포인트 잔액 조회 (기존 메서드 오버라이드 - 호환성 유지)
   */
  async getMemberPointBalanceV2(memberId: string): Promise<number> {
    try {
      // 1. 새로운 PointTransaction 데이터가 있는지 확인
      const transactions = await this.executeTransaction('pointTransactions', 'readonly', (store) => {
        const index = store.index('memberId');
        return index.getAll(memberId);
      });

      if (transactions.length > 0) {
        // 새로운 시스템 사용: 캐시된 잔액 조회
        return await this.getMemberPointBalanceCached(memberId);
      } else {
        // 기존 시스템 사용: Point 테이블에서 계산
        const points = await this.getPointsByMember(memberId);
        const now = new Date();
        
        const validPoints = points.filter(point => {
          return !point.expiryDate || point.expiryDate > now;
        });
        
        return validPoints.reduce((total, point) => total + point.amount, 0);
      }
    } catch (error) {
      console.error('포인트 잔액 조회 실패:', error);
      return 0;
    }
  }

  // ==================== 데이터 마이그레이션 ====================

  /**
   * 기존 Point 데이터를 새로운 PointTransaction으로 마이그레이션
   */
  async migratePointsToTransactions(): Promise<void> {
    try {
      console.log('포인트 데이터 마이그레이션 시작...');
      
      // 1. 기존 포인트 데이터 조회
      const oldPoints = await this.getAllPoints();
      
      // 2. 이미 마이그레이션된 데이터가 있는지 확인
      const existingTransactions = await this.executeTransaction('pointTransactions', 'readonly', (store) => 
        store.getAll()
      );
      
      if (existingTransactions.length > 0) {
        console.log('이미 마이그레이션된 포인트 거래내역이 있습니다. 스킵합니다.');
        return;
      }
      
      // 3. 각 포인트를 PointTransaction으로 변환
      for (const point of oldPoints) {
        const transactionType = point.amount > 0 ? 'earn' : 
                               point.type === 'used' ? 'use' :
                               point.type === 'expired' ? 'expire' : 'adjust';
        
        await this.addPointTransaction({
          memberId: point.memberId,
          memberName: point.memberName,
          amount: point.amount,
          transactionType: transactionType as any,
          earnedDate: point.createdAt,
          expiryDate: point.expiryDate || undefined,
          isExpired: point.type === 'expired',
          source: point.source,
          description: point.description,
          relatedPaymentId: point.relatedPaymentId
        });
      }
      
      console.log(`포인트 데이터 마이그레이션 완료: ${oldPoints.length}건 처리`);
    } catch (error) {
      console.error('포인트 데이터 마이그레이션 실패:', error);
      throw error;
    }
  }

  /**
   * 포인트 거래에 수강 정보 업데이트
   */
  async updatePointTransactionWithCourseInfo(
    orderId: string, 
    courseInfo: Array<{ productId: string; courseId: string; courseName: string }>
  ): Promise<void> {
    try {
      // 모든 포인트 거래를 조회하여 해당 주문 ID를 가진 것들 필터링
      const allTransactions = await this.executeTransaction('pointTransactions', 'readonly', (store) => 
        store.getAll()
      ) as PointTransaction[];

      const pointTransactions = allTransactions.filter(t => t.relatedOrderId === orderId);

      if (!pointTransactions || pointTransactions.length === 0) {
        console.log(`주문 ID ${orderId}와 관련된 포인트 거래가 없습니다.`);
        return;
      }

      // 각 포인트 거래의 products 정보에 수강 정보 추가
      for (const transaction of pointTransactions) {
        if (transaction.products) {
          const updatedProducts = transaction.products.map((product: any) => {
            const courseMatch = courseInfo.find(c => c.productId === product.productId);
            if (courseMatch) {
              return {
                ...product,
                courseId: courseMatch.courseId,
                courseName: courseMatch.courseName
              };
            }
            return product;
          });

          // 업데이트된 거래 정보 저장
          const updatedTransaction = {
            ...transaction,
            products: updatedProducts,
            updatedAt: new Date()
          };

          await this.executeTransaction('pointTransactions', 'readwrite', (store) => 
            store.put(updatedTransaction)
          );

          console.log(`포인트 거래 ${transaction.id}에 수강 정보 업데이트 완료`);
        }
      }
    } catch (error) {
      console.error('포인트 거래 수강 정보 업데이트 실패:', error);
      throw error;
    }
  }
}