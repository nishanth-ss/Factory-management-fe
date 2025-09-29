import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./useNoistackToast";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { setUserResponse } from "@/store/manufacturingCollection";
import type { UserCreateResponse, UserType, UsersApiResponse } from "@/types/UsersApiResponse";

// ✅ Fetch Users
export function useUsers(params: { page?: number; limit?: number; search?: string }) {
  const dispatch = useDispatch();

  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const search = params.search ?? "";

  const query = useQuery<UsersApiResponse, Error>({
    queryKey: ["users", page, limit, search],
    queryFn: async () => {
      const res = await apiRequest<UsersApiResponse>("GET", "/user", undefined, {
        params: { page, limit, search },
      });
      return res; // return full API response
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setUserResponse(query.data)); // store full response in Redux
    }
  }, [query.data, dispatch]);

  return query;
}

// ✅ Create User
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<UserCreateResponse, Error, UserType>({
    mutationFn: (data: UserType) => apiRequest<UserCreateResponse>("POST", "/user", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error.message, { variant: "error" });
    },
  });
};

// ✅ Fetch Single User
export const useSingleUser = (
  id?: string,
  options?: Omit<UseQueryOptions<UserType, Error>, "queryKey" | "queryFn">
) => {
  return useQuery<UserType, Error>({
    queryKey: ["user", id],
    queryFn: async () => {
      if (!id) {
        // Will not run when enabled is false, but this satisfies TypeScript
        throw new Error("Missing user id");
      }
      const res = await apiRequest<UserType>("GET", `/user/${id}`);
      return res;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
    enabled: !!id,
    ...options,
  });
};

// ✅ Update User
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<UserCreateResponse, Error, { id: string; data: Partial<UserType> }>({
    mutationFn: ({ id, data }) => apiRequest<UserCreateResponse>("PUT", `/user/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error.message, { variant: "error" });
    },
  });
};

// ✅ Delete User
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<UserCreateResponse, Error, { id: string }>({
    mutationFn: ({ id }) => apiRequest<UserCreateResponse>("DELETE", `/user/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      // `error.message` now carries server message from axios interceptor
      toast(error.message || "Something went wrong", { variant: "error" });
    },
  });
};
