import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// ✅ Fetch expenditures with pagination
export function useDashboard() {
  const query = useQuery<any, Error>({
    queryKey: ["dashboard"], // 👈 include page + limit here
    queryFn: async () => {
      const res = await apiRequest<any>(
        "GET",
        `/dashboard`
      );
      return res.data;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
  });

  return query;
}

export function useDashboardActivity({ page, limit }: { page: number; limit: number }) {
    const query = useQuery<any, Error>({
      queryKey: ["dashboardActivity", page, limit], // 👈 include page + limit here
      queryFn: async () => {
        const res = await apiRequest<any>(
          "GET",
          `/dashboard/activity?page=${page}&limit=${limit}`
        );
        return res;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 10_000,
    });
  
    return query;
  }

  export function useDashboardPendingApproval({ page, limit }: { page: number; limit: number }) {
    const query = useQuery<any, Error>({
      queryKey: ["dashboardPendingApproval", page, limit], // 👈 include page + limit here
      queryFn: async () => {
        const res = await apiRequest<any>(
          "GET",
          `/dashboard/pending-approval?page=${page}&limit=${limit}`
        );
        return res;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 10_000,
    });
  
    return query;
  }
