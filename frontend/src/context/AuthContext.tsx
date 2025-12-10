import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "../lib/api";
import { authAPI } from "../lib/api";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = authAPI.getToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const currentUser = await authAPI.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Если токен есть, но пользователь не получен - токен невалидный
        // Очищаем токен и разлогиниваем пользователя
        await authAPI.logout();
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      // При ошибке очищаем токен и разлогиниваем
      await authAPI.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      refreshSession,
      setUser,
    }),
    [user, isLoading, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
