import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { loginRequest } from "../api/auth";
import {
  ApiError,
  SESSION_EXPIRED_EVENT,
  TOKEN_KEY,
  USER_KEY,
  clearAccessToken,
  storeAccessToken,
} from "../api/client";
import { getMe } from "../api/users";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    sessionStorage.removeItem(USER_KEY);
    return null;
  }
}

function storeUser(user: User): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession(): void {
  clearAccessToken();
  sessionStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => readStoredUser());
  const [ready, setReady] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem(TOKEN_KEY);
    const storedUser = readStoredUser();

    if (!token) {
      clearSession();
      setUserState(null);
      setReady(true);
      return () => {
        active = false;
      };
    }

    getMe()
      .then((profile) => {
        if (!active) return;
        storeUser(profile);
        setUserState(profile);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          setUserState(null);
        } else if (storedUser) {
          setUserState(storedUser);
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      sessionStorage.removeItem(USER_KEY);
      setUserState(null);
      setSessionExpired(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () =>
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    storeAccessToken(response.access_token);
    storeUser(response.user);
    setUserState(response.user);
    setSessionExpired(false);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUserState(null);
    setSessionExpired(false);
  }, []);

  const setUser = useCallback((nextUser: User) => {
    storeUser(nextUser);
    setUserState(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      sessionExpired,
      login,
      logout,
      setUser,
    }),
    [user, ready, sessionExpired, login, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
