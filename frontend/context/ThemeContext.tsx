import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Colors, { DarkColors } from '../constants/colors';
import { getUserData, authAPI, User, isDemoMode, clearToken } from '../services/api';

type ThemeColors = typeof Colors;
export type UserRole = 'patient' | 'doctor';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  role: UserRole;
  userName: string;
  userInitial: string;
  user: User | null;
  setUser: (role: UserRole, name: string, user?: User) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: Colors,
  isDark: false,
  toggleTheme: () => {},
  role: 'patient',
  userName: 'User',
  userInitial: 'U',
  user: null,
  setUser: () => {},
  refreshUser: async () => {},
  logout: async () => {},
  isLoading: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [role, setRole] = useState<UserRole>('patient');
  const [userName, setUserName] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const toggleTheme = useCallback(() => setIsDark(p => !p), []);

  const setUserContext = useCallback((newRole: UserRole, name: string, userData?: User) => {
    setRole(newRole);
    setUserName(name);
    if (userData) {
      setUser(userData);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authAPI.me();
      setUser(userData);
      setRole(userData.role);
      const fullName = userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      setUserName(fullName);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const isDemo = await isDemoMode();
      if (isDemo) {
        await clearToken();
      } else {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setRole('patient');
    setUserName('');
  }, []);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await getUserData();
        if (storedUser) {
          setUser(storedUser);
          setRole(storedUser.role);
          const fullName = storedUser.name || `${storedUser.firstName || ''} ${storedUser.lastName || ''}`.trim();
          setUserName(fullName);
        }
      } catch (error) {
        console.error('Failed to load stored user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  const userInitial = userName
    ? userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const colors = isDark ? DarkColors : Colors;

  return (
    <ThemeContext.Provider value={{
      colors,
      isDark,
      toggleTheme,
      role,
      userName,
      userInitial,
      user,
      setUser: setUserContext,
      refreshUser,
      logout,
      isLoading,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
