// Single User type
export interface UserType {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: "superintendent" | "storekeeper" | "jailor";
  created_at?: string; 
}

export interface UserResponse {
  response: UserType[];
}

// API response for GET /users
export interface UsersApiResponse {
  data: UserResponse;
  total: number;
  page: number;
  limit: number;
}

// API response for create/update/delete
export interface UserCreateResponse {
  status: boolean;
  message: string;
  data?: UserType;
}
