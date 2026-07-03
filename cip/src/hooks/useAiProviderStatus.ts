import { useQuery } from "@tanstack/react-query";
import type { AiProviderStatus } from "@/lib/types/aiProvider";

async function fetchProviderStatus(): Promise<AiProviderStatus> {
  const res = await fetch("/api/ai/provider-status");
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()).data as AiProviderStatus;
}

export function useAiProviderStatus() {
  return useQuery({
    queryKey: ["ai-provider-status"],
    queryFn: fetchProviderStatus,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
