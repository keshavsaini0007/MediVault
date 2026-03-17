import React, { createContext, useContext, useState, useCallback } from 'react';
import Colors, { DarkColors } from '../constants/colors';

type ThemeColors = typeof Colors;
export type UserRole = 'patient' | 'doctor';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  role: UserRole;
  userName: string;
  userInitial: string;
  setUser: (role: UserRole, name: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: Colors,
  isDark: false,
  toggleTheme: () => {},
  role: 'patient',
  userName: 'User',
  userInitial: 'U',
  setUser: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [role, setRole]     = useState<UserRole>('patient');
  const [userName, setUserName] = useState('Rahul Singh');

  const toggleTheme = useCallback(() => setIsDark(p => !p), []);

  const setUser = useCallback((r: UserRole, name: string) => {
    setRole(r);
    setUserName(name);
  }, []);

  const userInitial = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const colors = isDark ? DarkColors : Colors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme, role, userName, userInitial, setUser }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
