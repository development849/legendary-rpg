import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { clearSessionId } from "@/lib/queryClient";

function getSessionHeaders(): Record<string, string> {
  try {
    const sid = localStorage.getItem("legendaryrpg_sid");
    if (sid) return { "X-Session-Id": sid };
  } catch {}
  return {};
}

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
    headers: getSessionHeaders(),
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function performLogout(): Promise<void> {
  const headers = getSessionHeaders();

  const localRes = await fetch("/api/auth/logout-local", {
    method: "POST",
    credentials: "include",
    headers,
  });

  clearSessionId();

  if (localRes.ok) {
    window.location.href = "/auth";
    return;
  }

  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: performLogout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
