import type { User, Conversation, Message, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:3006/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        data: null as T,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async googleAuth(): Promise<void> {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/users/me');
  }

  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return this.request<Conversation[]>('/conversations');
  }

  async getMessages(conversationId: string, page = 1, limit = 50): Promise<ApiResponse<Message[]>> {
    return this.request<Message[]>(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  }

  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>('/users');
  }

  async createConversation(participantId: string): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();