import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/auth";

interface AuthState {
  user: Pick<User, "name" | "email" | "role"> | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Accept payload with both user and token
    setUser: (
      state,
      action: PayloadAction<{ user: AuthState["user"]; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem("authToken", action.payload.token);
    },
    clearUser: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("authToken");
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("authToken");
    },
  },
});

export const { setUser, clearUser, logout } = authSlice.actions;
export default authSlice.reducer;
