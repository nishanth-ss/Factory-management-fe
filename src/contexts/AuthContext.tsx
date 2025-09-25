import { createContext, useContext } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, AuthResponse } from "@/types/auth";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser } from "@/store/authSlice";
import type { AppDispatch, RootState } from "@/store/store";

interface AuthContextType {
  user: Pick<User, "id" | "name" | "email" | "role"> | null;
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
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch: AppDispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  // Login mutation
  const loginMutation = useMutation<AuthResponse, unknown, { email: string; password: string }>({
    mutationFn: async ({ email, password }) =>
      apiRequest<AuthResponse>("POST", "/auth/login", { email, password }, { withCredentials: false }),
    onSuccess: (data) => {
      if (data.user && data.data) {
        dispatch(
          setUser({
            user: {
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
            },
            token: data.data, // JWT from API
          })
        );
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation<void, unknown>({
    mutationFn: async () => apiRequest<void>("POST", "/auth/logout"),
    onSuccess: () => {
      dispatch(clearUser());
      queryClient.clear();
    },
  });

  // Functions
  const login = async (email: string, password: string): Promise<void> => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = async () => logoutMutation.mutateAsync();

  const hasRole = (role: string) => user?.role === role;
  const hasAnyRole = (roles: string[]) => (user ? roles.includes(user.role ?? "") : false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: loginMutation.isPending || logoutMutation.isPending,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
