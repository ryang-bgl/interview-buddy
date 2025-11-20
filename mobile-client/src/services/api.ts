import { LeetCodeSolution, UserStats } from '@/types/solution';
import { DsaQuestion } from '@/types/question';
import { getSupabaseClient } from '@/config/supabase';

// Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

interface SyncRequest {
  solutions: LeetCodeSolution[];
  lastSyncTime?: Date;
}

interface SyncResponse {
  solutions: LeetCodeSolution[];
  conflicts?: LeetCodeSolution[];
  lastSyncTime: Date;
}

class ApiClient {
  private token: string | null = null;

  setAuthToken(token: string) {
    this.token = token;
  }

  clearAuthToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    authMode: 'default' | 'supabase' = 'default'
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      if (authMode === 'supabase') {
        try {
          const supabase = getSupabaseClient();
          const { data } = await supabase.auth.getSession();
          const supabaseToken = data.session?.access_token;
          if (supabaseToken) {
            headers.Authorization = `Bearer ${supabaseToken}`;
          }
        } catch (error) {
          console.warn('Failed to get Supabase session for DSA request', error);
        }
      } else if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(credentials: LoginRequest & { email: string }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    const result = await this.request<void>('/auth/logout', {
      method: 'POST',
    });
    this.clearAuthToken();
    return result;
  }

  // Solutions management
  async getSolutions(): Promise<ApiResponse<LeetCodeSolution[]>> {
    return this.request<LeetCodeSolution[]>('/solutions');
  }

  async createSolution(solution: Omit<LeetCodeSolution, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<LeetCodeSolution>> {
    return this.request<LeetCodeSolution>('/solutions', {
      method: 'POST',
      body: JSON.stringify(solution),
    });
  }

  async updateSolution(id: string, solution: Partial<LeetCodeSolution>): Promise<ApiResponse<LeetCodeSolution>> {
    return this.request<LeetCodeSolution>(`/solutions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(solution),
    });
  }

  async deleteSolution(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/solutions/${id}`, {
      method: 'DELETE',
    });
  }

  // Sync functionality
  async syncSolutions(syncData: SyncRequest): Promise<ApiResponse<SyncResponse>> {
    return this.request<SyncResponse>('/sync', {
      method: 'POST',
      body: JSON.stringify(syncData),
    });
  }

  // User statistics
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return this.request<UserStats>('/user/stats');
  }

  async getQuestions(): Promise<ApiResponse<DsaQuestion[]>> {
    return this.request<DsaQuestion[]>('/api/dsa/questions', {}, 'supabase');
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Helper functions for common operations
export async function isServerAvailable(): Promise<boolean> {
  try {
    const response = await apiClient.healthCheck();
    return response.success;
  } catch {
    return false;
  }
}

export async function authenticateUser(username: string, password: string): Promise<boolean> {
  try {
    const response = await apiClient.login({ username, password });
    if (response.success && response.data) {
      apiClient.setAuthToken(response.data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function syncWithServer(localSolutions: LeetCodeSolution[]): Promise<{
  success: boolean;
  solutions?: LeetCodeSolution[];
  conflicts?: LeetCodeSolution[];
  error?: string;
}> {
  try {
    const response = await apiClient.syncSolutions({
      solutions: localSolutions,
    });

    if (response.success && response.data) {
      return {
        success: true,
        solutions: response.data.solutions,
        conflicts: response.data.conflicts,
      };
    }

    return {
      success: false,
      error: response.error || 'Sync failed',
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error during sync',
    };
  }
}
