import { create } from 'zustand';
import { User } from '@/types';
import { authService } from '@/services/auth.service';
import { socketService } from '@/lib/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await authService.login(email, password);
    set({ user: response.user, isAuthenticated: true });

    // Connect socket
    const token = localStorage.getItem('accessToken');
    if (token) {
      socketService.connect(token);
    }
  },

  logout: () => {
    authService.logout();
    socketService.disconnect();
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });

      // Connect socket
      socketService.connect(token);
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (user: User) => {
    set({ user });
  }
}));
