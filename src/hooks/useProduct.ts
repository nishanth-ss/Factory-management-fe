import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setProducts } from "@/store/productSlice";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "./useNoistackToast";

export function useProducts(params: { page?: number; limit?: number; search?: string }) {
    const dispatch = useDispatch();
  
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const search = params.search ?? "";
  
    const query = useQuery<any, Error>({
      queryKey: ["products", page, limit, search],
      queryFn: async () => {
        const res = await apiRequest<any>("GET", "/product", undefined, {
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
        dispatch(setProducts(query.data)); // store full response in Redux
      }
    }, [query.data, dispatch]);
  
    return query;
  }

  export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
  
    return useMutation<any, Error, any>({
      mutationFn: (data: any) => apiRequest<any>("POST", "/product", data),
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        toast(res.message, { variant: "success" });
      },
      onError: (error) => {
        toast(error.message, { variant: "error" });
      },
    });
  };

  export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
  
    return useMutation<any, Error, any>({
      mutationFn: (data: any) => apiRequest<any>("PUT", `/product/${data.id}`, data),
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        toast(res.message, { variant: "success" });
      },
      onError: (error) => {
        toast(error.message, { variant: "error" });
      },
    });
  };