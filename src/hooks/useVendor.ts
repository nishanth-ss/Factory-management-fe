import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./useNoistackToast";
import { useDispatch } from "react-redux";
import { setVendorResponse } from "@/store/manufacturingCollection";
import { useEffect } from "react";
import type { VendorsApiResponse, CreateVendor } from "@/types/vendor";

export function useVendors() {
    const dispatch = useDispatch();

    const query = useQuery<VendorsApiResponse, Error>({
        queryKey: ["vendors"],
        queryFn: async () => {
            const res = await apiRequest<VendorsApiResponse>("GET", "/vendor");
            return res; // return full API response
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
        staleTime: 30_000,
    });

    useEffect(() => {
        if (query.data) {
            dispatch(setVendorResponse(query.data));
        }
    }, [query.data, dispatch]);

    return query;
}

export const useCreateVendor = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation<any, Error, CreateVendor>({
        mutationFn: (data: CreateVendor) =>
            apiRequest<any>("POST", "/vendor", data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["vendors"] });
            toast(res.message, { variant: "success" });
        },
        onError: (error) => {
            toast(error.message, { variant: "error" });
        },
    });
};

export const useUpdateVendor = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation<any, Error, CreateVendor>({
        mutationFn: (data: CreateVendor) =>
            apiRequest<any>("PUT", `/vendor/${data.id}`, data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["vendors"] });
            toast(res.message, { variant: "success" });
        },
        onError: (error) => {
            toast(error.message, { variant: "error" });
        },
    });
};
