import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { AnswerFeedback } from "@/lib/types/interviewCoach";
import type { ResumeDefaultsInput } from "@/lib/validators/resume.schema";

export type ProfileTextField = "aboutMe" | "elevatorPitch" | "strengths";
export type SaveableProfileField = ProfileTextField | "voiceGuide";

export interface ProfileTexts {
  aboutMe: string | null;
  elevatorPitch: string | null;
  strengths: string | null;
  voiceGuide: string | null;
}

export const profileKeys = {
  all: ["profile"] as const,
  resumeDefaults: ["profile", "resume-defaults"] as const,
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? `Request failed: ${res.status}`);
  }
  return (await res.json()).data as T;
}

export function useProfileTexts() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: () => fetchJson<ProfileTexts>("/api/profile"),
  });
}

/** Generates a fresh draft for review — does not save it. */
export function useGenerateProfileText() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: { field: ProfileTextField; language: string; guidedAnswers?: { question: string; answer: string }[] }) =>
      fetchJson<{ field: ProfileTextField; text: string }>("/api/profile/generate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onError: (error: Error) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useSaveProfileText() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: { field: SaveableProfileField; text: string }) =>
      fetchJson<{ field: SaveableProfileField; text: string }>("/api/profile/save", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast({ title: "Saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
    },
  });
}

/** Education + contact defaults stored on the profile, prefilled into the resume generator. */
export function useResumeDefaults() {
  return useQuery({
    queryKey: profileKeys.resumeDefaults,
    queryFn: () => fetchJson<ResumeDefaultsInput>("/api/profile/resume-defaults"),
  });
}

export function useSaveResumeDefaults() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: ResumeDefaultsInput) =>
      fetchJson<ResumeDefaultsInput>("/api/profile/resume-defaults", {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.resumeDefaults });
      toast({ title: "Saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
    },
  });
}

/** On-demand coaching feedback on a hand-written draft — nothing is persisted. */
export function useEvaluateProfileText() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: { field: ProfileTextField; draftText: string; language: string }) =>
      fetchJson<AnswerFeedback>("/api/profile/evaluate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onError: (error: Error) => {
      toast({ title: "Could not get feedback", description: error.message, variant: "destructive" });
    },
  });
}
