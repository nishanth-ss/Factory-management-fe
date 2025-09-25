// types/auth.ts
export interface User {
    id?: string;
    name: string;
    email: string;
    role: string;
    password?: string; // optional here
    data?: string; // optional here
  }
  
  export interface AuthResponse {
    user: User;
    data: string;
  }
  