import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { InterviewSessionDTO } from "@/lib/types/interviewSession";
import type { CreateInterviewSessionInput } from "@/lib/validators/interviewSession.schema";

export const interviewSessionKeys = {
  byJob: (jobId: string) => ["interview-sessions", "job", jobId] as const,
  detail: (id: string) => ["interview-sessions", id] as const,
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? `Request failed: ${res.status}`);
  }
  return (await res.json()).data as T;
}

export function useInterviewSessions(jobId: string) {
  return useQuery({
    queryKey: interviewSessionKeys.byJob(jobId),
    queryFn: () => fetchJson<InterviewSessionDTO[]>(`/api/job-analyzer/${jobId}/interview-sessions`),
    enabled: !!jobId,
  });
}

export function useInterviewSession(sessionId: string) {
  return useQuery({
    queryKey: interviewSessionKeys.detail(sessionId),
    queryFn: () => fetchJson<InterviewSessionDTO>(`/api/interview-sessions/${sessionId}`),
    enabled: !!sessionId,
  });
}

export function useCreateInterviewSession(jobId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateInterviewSessionInput) =>
      fetchJson<InterviewSessionDTO>(`/api/job-analyzer/${jobId}/interview-sessions`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewSessionKeys.byJob(jobId) });
      toast({ title: "Session saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save session", description: error.message, variant: "destructive" });
    },
  });
}
