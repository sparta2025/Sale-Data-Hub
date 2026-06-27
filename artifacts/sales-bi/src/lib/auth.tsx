import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserProfile, useGetMe } from "@workspace/api-client-react";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemo: boolean;
  login: (token: string) => void;
  logout: () => void;
  setDemoMode: (active: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("sbi_token"));
  const [isDemo, setIsDemo] = useState<boolean>(() => localStorage.getItem("sbi_demo") === "true");

  const { data: user, isLoading: isMeLoading } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: ["auth_me", token],
      retry: false
    }
  });

  const login = (newToken: string) => {
    localStorage.setItem("sbi_token", newToken);
    localStorage.removeItem("sbi_demo");
    setToken(newToken);
    setIsDemo(false);
  };

  const logout = () => {
    localStorage.removeItem("sbi_token");
    setToken(null);
  };

  const setDemoMode = (active: boolean) => {
    if (active) {
      localStorage.setItem("sbi_demo", "true");
      setIsDemo(true);
    } else {
      localStorage.removeItem("sbi_demo");
      setIsDemo(false);
    }
  };

  useEffect(() => {
    if (!token && !isDemo && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
      // Handled in router level usually, but just in case
    }
  }, [token, isDemo]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: isMeLoading,
        isAuthenticated: !!user,
        isDemo,
        login,
        logout,
        setDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
