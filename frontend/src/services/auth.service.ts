import { api } from '../lib/api';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  setTokens: (accessToken: string, refreshToken: string, user: any) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }
};
