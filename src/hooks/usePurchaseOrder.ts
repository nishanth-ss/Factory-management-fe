import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./useNoistackToast";
import { useDispatch } from "react-redux";
import { setPurchaseOrderResponse } from "@/store/manufacturingCollection";
import { useEffect } from "react";
import type { PurchaseOrderApiResponse, PurchaseOrder } from "@/types/purchaseType";

export function usePurchaseOrders(params?: { page?: number; limit?: number; search?: string }) {
    const dispatch = useDispatch();
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const search = params?.search ?? "";

    const query = useQuery<PurchaseOrderApiResponse, Error>({
        queryKey: ["purchaseOrders", page, limit, search],
        queryFn: async () => {
            const url = `/purchase?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
            const res = await apiRequest<PurchaseOrderApiResponse>("GET", url);
            return res; // return full API response
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
        staleTime: 30_000,
    });

    useEffect(() => {
        if (query.data) {
            dispatch(setPurchaseOrderResponse(query.data));
        }
    }, [query.data, dispatch]);

    return query;
}

export const useCreatePurchaseOrder = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation<any, Error, PurchaseOrder>({
        mutationFn: (data: PurchaseOrder) =>
            apiRequest<any>("POST", "/purchase", data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
            toast(res.message, { variant: "success" });
        },
        onError: (error) => {
            toast(error.message, { variant: "error" });
        },
    });
};

export const useUpdatePurchaseOrder = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation<any, Error, { id: string; status: string }>({
        mutationFn: ({ id, status }) =>
            apiRequest<any>("PUT", `/purchase/${id}`, { status }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
            toast(res.message, { variant: "success" });
        },
        onError: (error) => {
            toast(error.message, { variant: "error" });
        },
    });
};
