import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { JobDescriptionDTO } from "@/lib/types/job";
import type { AnalyzeJobInput } from "@/lib/validators/job.schema";
import type { AnswerFeedback } from "@/lib/types/interviewCoach";
import type { EvaluateAnswerInput } from "@/lib/validators/interviewCoach.schema";

export const jobKeys = {
  all: ["jobs"] as const,
  detail: (id: string) => ["jobs", id] as const,
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `${res.status}`); }
  if (res.status === 204) return undefined as T;
  return (await res.json()).data as T;
}

/** Lightweight list item — just the header info for the list page */
export interface JobListItem {
  id: string;
  company: string;
  title: string;
  matchScore: number | null;
  missingSkills: string[];
  language: string;
  createdAt: string;
}

export function useJobAnalyses() {
  return useQuery({
    queryKey: jobKeys.all,
    queryFn: () => fetchJson<JobListItem[]>("/api/job-analyzer"),
  });
}

export function useJobAnalysis(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => fetchJson<JobDescriptionDTO>(`/api/job-analyzer/${id}`),
    enabled: !!id,
  });
}

export function useAnalyzeJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AnalyzeJobInput) =>
      fetchJson<JobDescriptionDTO>("/api/job-analyzer", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast({ title: "Analysis complete" });
      router.push(`/job-analyzer/${data.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    },
  });
}

/** On-demand coaching feedback — no query invalidation, nothing is persisted. */
export function useEvaluateAnswer() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: EvaluateAnswerInput) =>
      fetchJson<AnswerFeedback>("/api/job-analyzer/evaluate-answer", { method: "POST", body: JSON.stringify(input) }),
    onError: (error: Error) => {
      toast({ title: "Could not get feedback", description: error.message, variant: "destructive" });
    },
  });
}

/** Regenerates one question's suggestedAnswer with a different angle; persists it server-side. */
export function useRegenerateAnswer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ jobId, questionIndex }: { jobId: string; questionIndex: number }) =>
      fetchJson<{ questionIndex: number; suggestedAnswer: string | null }>(
        `/api/job-analyzer/${jobId}/regenerate-answer`,
        { method: "POST", body: JSON.stringify({ questionIndex }) },
      ),
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
    },
    onError: (error: Error) => {
      toast({ title: "Could not generate another answer", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteJobAnalysis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => fetchJson<void>(`/api/job-analyzer/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast({ title: "Analysis deleted" });
      router.push("/job-analyzer");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    },
  });
}

export function useClearAllJobAnalyses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => fetchJson<void>("/api/job-analyzer", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast({ title: "All analyses cleared" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to clear", description: error.message, variant: "destructive" });
    },
  });
}
