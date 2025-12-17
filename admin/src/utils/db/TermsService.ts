/**
 * 약관 및 문서 관리 서비스
 */

import { BaseDBManager } from './BaseDBManager';
import { TermsDocument } from './types';

export class TermsService extends BaseDBManager {

  /**
   * 약관/문서 추가
   */
  async addTermsDocument(documentData: Omit<TermsDocument, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<TermsDocument> {
    try {
      // 같은 타입의 기존 문서들의 최대 버전 찾기
      const existingDocs = await this.getTermsDocumentsByType(documentData.type);
      const maxVersion = existingDocs.length > 0 ? Math.max(...existingDocs.map(doc => doc.version)) : 0;

      // 기존 활성 문서들 비활성화
      for (const doc of existingDocs.filter(d => d.isActive)) {
        await this.updateTermsDocument(doc.id, { isActive: false });
      }

      const newDocument: TermsDocument = {
        ...documentData,
        id: this.generateUUID(),
        version: maxVersion + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: documentData.isActive ? new Date() : null
      };

      await this.executeTransaction('termsDocuments', 'readwrite', (store) => 
        store.add(newDocument)
      );

      console.log('약관/문서 추가 성공:', newDocument);
      return newDocument;
    } catch (error) {
      console.error('약관/문서 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 약관/문서 조회
   */
  async getAllTermsDocuments(): Promise<TermsDocument[]> {
    try {
      const documents = await this.executeTransaction('termsDocuments', 'readonly', (store) => 
        store.getAll()
      );
      
      return documents.map(doc => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
        publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null
      }));
    } catch (error) {
      console.error('약관/문서 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * ID로 약관/문서 조회
   */
  async getTermsDocumentById(id: string): Promise<TermsDocument | null> {
    try {
      const document = await this.executeTransaction('termsDocuments', 'readonly', (store) => 
        store.get(id)
      );
      
      if (document) {
        return {
          ...document,
          createdAt: new Date(document.createdAt),
          updatedAt: new Date(document.updatedAt),
          publishedAt: document.publishedAt ? new Date(document.publishedAt) : null
        };
      }
      
      return null;
    } catch (error) {
      console.error('약관/문서 조회 실패:', error);
      return null;
    }
  }

  /**
   * 타입별 약관/문서 조회
   */
  async getTermsDocumentsByType(type: TermsDocument['type']): Promise<TermsDocument[]> {
    try {
      const documents = await this.executeTransaction('termsDocuments', 'readonly', (store) => {
        return store.getAll();
      });
      
      const filteredDocs = documents.filter(doc => doc.type === type);
      
      return filteredDocs.map(doc => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
        publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null
      })).sort((a, b) => b.version - a.version); // 최신 버전부터
    } catch (error) {
      console.error('타입별 약관/문서 조회 실패:', error);
      return [];
    }
  }

  /**
   * 활성화된 약관/문서만 조회 (타입별)
   */
  async getActiveTermsDocument(type: TermsDocument['type']): Promise<TermsDocument | null> {
    try {
      const documents = await this.executeTransaction('termsDocuments', 'readonly', (store) => {
        return store.getAll();
      });
      
      const activeDoc = documents.find(doc => doc.type === type && doc.isActive);
      
      if (!activeDoc) return null;

      return {
        ...activeDoc,
        createdAt: new Date(activeDoc.createdAt),
        updatedAt: new Date(activeDoc.updatedAt),
        publishedAt: activeDoc.publishedAt ? new Date(activeDoc.publishedAt) : null
      };
    } catch (error) {
      console.error('활성 약관/문서 조회 실패:', error);
      return null;
    }
  }

  /**
   * 약관/문서 수정
   */
  async updateTermsDocument(id: string, updates: Partial<Omit<TermsDocument, 'id' | 'createdAt' | 'updatedAt' | 'version'>>): Promise<TermsDocument | null> {
    try {
      const existingDocument = await this.executeTransaction('termsDocuments', 'readonly', (store) => 
        store.get(id)
      );

      if (!existingDocument) {
        console.error('수정할 약관/문서를 찾을 수 없습니다:', id);
        return null;
      }

      // 활성화 시 같은 타입의 다른 문서들 비활성화
      if (updates.isActive === true && !existingDocument.isActive) {
        const otherDocs = await this.getTermsDocumentsByType(existingDocument.type);
        for (const doc of otherDocs.filter((d: TermsDocument) => d.id !== id && d.isActive)) {
          await this.executeTransaction('termsDocuments', 'readwrite', (store) => 
            store.put({
              ...doc,
              isActive: false,
              updatedAt: new Date()
            })
          );
        }
      }

      const updatedDocument: TermsDocument = {
        ...existingDocument,
        ...updates,
        id,
        createdAt: new Date(existingDocument.createdAt),
        updatedAt: new Date(),
        publishedAt: updates.isActive === true && !existingDocument.isActive ? new Date() : 
                    updates.isActive === false ? null : 
                    existingDocument.publishedAt
      };

      await this.executeTransaction('termsDocuments', 'readwrite', (store) => 
        store.put(updatedDocument)
      );

      console.log('약관/문서 수정 성공:', updatedDocument);
      return updatedDocument;
    } catch (error) {
      console.error('약관/문서 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 약관/문서 삭제
   */
  async deleteTermsDocument(id: string): Promise<boolean> {
    try {
      await this.executeTransaction('termsDocuments', 'readwrite', (store) => 
        store.delete(id)
      );

      console.log('약관/문서 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('약관/문서 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 약관/문서 검색 (제목, 내용)
   */
  async searchTermsDocuments(searchTerm: string): Promise<TermsDocument[]> {
    try {
      const allDocuments = await this.getAllTermsDocuments();
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      return allDocuments.filter(doc => 
        doc.title.toLowerCase().includes(lowerSearchTerm) ||
        doc.content.toLowerCase().includes(lowerSearchTerm)
      );
    } catch (error) {
      console.error('약관/문서 검색 실패:', error);
      return [];
    }
  }

  /**
   * 모든 활성 약관/문서 조회 (회원가입 시 사용)
   */
  async getAllActiveTermsDocuments(): Promise<TermsDocument[]> {
    try {
      const allDocuments = await this.getAllTermsDocuments();
      return allDocuments.filter(doc => doc.isActive);
    } catch (error) {
      console.error('활성 약관/문서 조회 실패:', error);
      return [];
    }
  }

  /**
   * 약관 타입별 최신 버전 조회
   */
  async getLatestVersionByType(type: TermsDocument['type']): Promise<TermsDocument | null> {
    try {
      const documents = await this.getTermsDocumentsByType(type);
      // 이미 최신 버전부터 정렬되어 있음
      return documents.length > 0 ? documents[0] : null;
    } catch (error) {
      console.error('최신 버전 약관/문서 조회 실패:', error);
      return null;
    }
  }

  /**
   * 약관 버전 히스토리 조회
   */
  async getVersionHistory(type: TermsDocument['type']): Promise<TermsDocument[]> {
    try {
      return await this.getTermsDocumentsByType(type);
    } catch (error) {
      console.error('약관 버전 히스토리 조회 실패:', error);
      return [];
    }
  }

  /**
   * 약관 발행 (비활성 상태를 활성으로 변경)
   */
  async publishTermsDocument(id: string): Promise<TermsDocument | null> {
    try {
      return await this.updateTermsDocument(id, { 
        isActive: true,
        publishedAt: new Date()
      });
    } catch (error) {
      console.error('약관/문서 발행 실패:', error);
      throw error;
    }
  }

  /**
   * 약관 철회 (활성 상태를 비활성으로 변경)
   */
  async unpublishTermsDocument(id: string): Promise<TermsDocument | null> {
    try {
      return await this.updateTermsDocument(id, { 
        isActive: false,
        publishedAt: null
      });
    } catch (error) {
      console.error('약관/문서 철회 실패:', error);
      throw error;
    }
  }

  /**
   * 약관 복사 (새 버전 생성)
   */
  async duplicateTermsDocument(id: string, updates?: Partial<Pick<TermsDocument, 'title' | 'content'>>): Promise<TermsDocument> {
    try {
      const originalDoc = await this.getTermsDocumentById(id);
      if (!originalDoc) {
        throw new Error('복사할 약관/문서를 찾을 수 없습니다.');
      }

      return await this.addTermsDocument({
        type: originalDoc.type,
        title: updates?.title || `${originalDoc.title} (복사본)`,
        content: updates?.content || originalDoc.content,
        isActive: false // 복사본은 비활성 상태로 생성
      });
    } catch (error) {
      console.error('약관/문서 복사 실패:', error);
      throw error;
    }
  }

  /**
   * 약관 타입별 통계
   */
  async getTermsStatsByType(): Promise<Record<TermsDocument['type'], {
    total: number;
    active: number;
    inactive: number;
    latestVersion: number;
  }>> {
    try {
      const allDocuments = await this.getAllTermsDocuments();
      const types: TermsDocument['type'][] = [
        'privacy_policy', 'terms_of_service', 'business_info', 
        'marketing_consent', 'member_terms', 'contract'
      ];

      const stats: any = {};

      for (const type of types) {
        const typeDocs = allDocuments.filter(doc => doc.type === type);
        stats[type] = {
          total: typeDocs.length,
          active: typeDocs.filter(doc => doc.isActive).length,
          inactive: typeDocs.filter(doc => !doc.isActive).length,
          latestVersion: typeDocs.length > 0 ? Math.max(...typeDocs.map(doc => doc.version)) : 0
        };
      }

      return stats;
    } catch (error) {
      console.error('약관 통계 조회 실패:', error);
      return {} as any;
    }
  }
}