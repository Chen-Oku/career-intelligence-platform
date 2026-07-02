import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { InterviewPrepAnswerDTO } from "@/lib/types/interviewPrep";
import type { InterviewPrepType } from "@/lib/validators/interviewPrep.schema";
import type { AnswerFeedback } from "@/lib/types/interviewCoach";

export const interviewPrepKeys = {
  all: ["interviewPrep"] as const,
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? `Request failed: ${res.status}`);
  }
  return (await res.json()).data as T;
}

export function useInterviewPrepAnswers() {
  return useQuery({
    queryKey: interviewPrepKeys.all,
    queryFn: () => fetchJson<InterviewPrepAnswerDTO[]>("/api/interview-prep"),
  });
}

/** Generates a fresh draft for review — does not save it. */
export function useGenerateInterviewPrep() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: { type: InterviewPrepType; language: string; guidedAnswers?: { question: string; answer: string }[] }) =>
      fetchJson<{ type: InterviewPrepType; text: string }>("/api/interview-prep/generate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onError: (error: Error) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useSaveInterviewPrep() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: { type: InterviewPrepType; text: string }) =>
      fetchJson<{ type: InterviewPrepType; text: string }>("/api/interview-prep/save", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewPrepKeys.all });
      toast({ title: "Saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
    },
  });
}

/** On-demand coaching feedback on a hand-written draft — nothing is persisted. */
export function useEvaluateInterviewPrep() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: { type: InterviewPrepType; draftText: string; language: string }) =>
      fetchJson<AnswerFeedback>("/api/interview-prep/evaluate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onError: (error: Error) => {
      toast({ title: "Could not get feedback", description: error.message, variant: "destructive" });
    },
  });
}
