import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const roleHierarchy: Record<UserRole, number> = {
  student: 1,
  club_member: 2,
  core_member: 3,
  club_head: 4,
  club_co_coordinator: 5,
  club_coordinator: 6,
  co_admin: 7,
  admin: 8,
  owner: 9,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on load
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData); // Set immediately from cache

          // Then fetch fresh data
          const freshUser = await api.getProfile(userData.id || (userData as any)._id);
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch (err) {
          console.error('Failed to sync user data:', err);
          // If token is invalid/expired, stay as is or logout
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await api.login({ email, password: pass });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    // Simple check if role matches or is higher in hierarchy (if logic applies)
    // For now strict role matching might be safer unless hierarchy is strictly defined
    return roles.some(role => roleHierarchy[user.role] >= roleHierarchy[role]);
  };

  const refreshUser = async () => {
    if (user?.id) {
      try {
        const freshUser = await api.getProfile(user.id);
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      } catch (err) {
        console.error('Refresh failed:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || null,
        login,
        logout,
        updateUser,
        refreshUser,
        hasPermission,
        loading
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
