// 기존 IndexedDB 코드를 서버 API 호출로 변환
// src/utils/branchAPI.ts (또는 apiClient.ts에 추가)

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// API 응답 타입 정의
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  total?: number;
  currentPage?: number;
  totalPages?: number;
  validationErrors?: any[];
}

// 지점 타입 (기존과 동일하지만 id가 string)
export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

class BranchAPIClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      // Authorization 헤더는 실제 인증 구현 시 추가
      // 'Authorization': `Bearer ${getAuthToken()}`
    };

    const config: RequestInit = {
      headers: defaultHeaders,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API 요청 실패');
      }

      return data;
    } catch (error) {
      console.error('API 요청 에러:', error);
      throw error;
    }
  }

  /**
   * 모든 지점 조회 (기존 getAllBranches와 호환)
   */
  async getAllBranches(): Promise<Branch[]> {
    const response = await this.request<Branch[]>('/branches');
    return response.data || [];
  }

  /**
   * ID로 지점 조회 (기존 getBranchById와 호환)
   */
  async getBranchById(id: string): Promise<Branch | null> {
    try {
      const response = await this.request<Branch>(`/branches/${id}`);
      return response.data || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 지점 추가 (기존 addBranch와 호환)
   */
  async addBranch(branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<Branch> {
    const response = await this.request<Branch>('/branches', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });

    if (!response.data) {
      throw new Error('지점 생성 실패');
    }

    return response.data;
  }

  /**
   * 지점 수정 (기존 updateBranch와 호환)
   */
  async updateBranch(
    id: string, 
    updates: Partial<Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Branch | null> {
    try {
      const response = await this.request<Branch>(`/branches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return response.data || null;
    } catch (error) {
      console.error('지점 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 지점 삭제 (기존 deleteBranch와 호환)
   */
  async deleteBranch(id: string): Promise<boolean> {
    try {
      await this.request(`/branches/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('지점 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 활성 지점만 조회 (기존 getActiveBranches와 호환)
   */
  async getActiveBranches(): Promise<Branch[]> {
    const response = await this.request<Branch[]>('/branches/active');
    return response.data || [];
  }

  /**
   * 지점명으로 검색 (기존 searchBranchesByName과 호환)
   */
  async searchBranchesByName(name: string): Promise<Branch[]> {
    const response = await this.request<Branch[]>(`/branches/search/${encodeURIComponent(name)}`);
    return response.data || [];
  }

  /**
   * 지점명으로 정확히 일치하는 지점 조회 (기존 getBranchByName과 호환)
   */
  async getBranchByName(name: string): Promise<Branch | null> {
    try {
      const branches = await this.searchBranchesByName(name);
      const exactMatch = branches.find(branch => branch.name === name);
      return exactMatch || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 지점 상태 토글 (새로운 기능)
   */
  async toggleBranchStatus(id: string): Promise<Branch | null> {
    try {
      const response = await this.request<Branch>(`/branches/${id}/toggle-status`, {
        method: 'PATCH',
      });
      return response.data || null;
    } catch (error) {
      console.error('지점 상태 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 지점 통계 조회 (새로운 기능)
   */
  async getBranchStats(): Promise<{
    totalBranches: number;
    activeBranches: number;
    inactiveBranches: number;
    recentBranches: Branch[];
  }> {
    const response = await this.request<any>('/branches/stats');
    return response.data || {
      totalBranches: 0,
      activeBranches: 0,
      inactiveBranches: 0,
      recentBranches: []
    };
  }

  /**
   * 페이지네이션을 지원하는 지점 목록 조회 (새로운 기능)
   */
  async getBranchesWithPagination(options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isActive?: boolean;
  } = {}): Promise<{
    branches: Branch[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.isActive !== undefined) params.append('isActive', options.isActive.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/branches?${queryString}` : '/branches';
    
    const response = await this.request<Branch[]>(endpoint);
    
    return {
      branches: response.data || [],
      total: response.total || 0,
      currentPage: response.currentPage || 1,
      totalPages: response.totalPages || 1
    };
  }
}

// 싱글톤 인스턴스 생성
export const branchAPI = new BranchAPIClient();

// 기존 IndexedDB 관리자와 호환성을 위한 래퍼
export const apiManager = {
  // 지점 관련 메소드들
  getAllBranches: () => branchAPI.getAllBranches(),
  getBranchById: (id: string) => branchAPI.getBranchById(id),
  addBranch: (branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>) => 
    branchAPI.addBranch(branchData),
  updateBranch: (id: string, updates: Partial<Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>>) => 
    branchAPI.updateBranch(id, updates),
  deleteBranch: (id: string) => branchAPI.deleteBranch(id),
  getActiveBranches: () => branchAPI.getActiveBranches(),
  getBranchByName: (name: string) => branchAPI.getBranchByName(name),
  searchBranchesByName: (name: string) => branchAPI.searchBranchesByName(name),
};

export default branchAPI;