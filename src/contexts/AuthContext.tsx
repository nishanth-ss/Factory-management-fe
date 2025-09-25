import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Pick<User, 'id' | 'name' | 'email' | 'role'> | null>(null);

  // Check if user is authenticated on app load
  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update user state when auth data changes
  useEffect(() => {
    if (authData && 'user' in authData) {
      setUser(authData.user);
    } else {
      setUser(null);
    }
  }, [authData]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await apiRequest('POST', '/api/auth/login', { email, password });
    },
    onSuccess: (data: any) => {
      if (data && 'user' in data) {
        setUser(data.user);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear(); // Clear all cached data
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}