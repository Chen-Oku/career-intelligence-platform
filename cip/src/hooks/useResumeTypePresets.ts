import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ResumeTypePresetDTO } from "@/lib/types/resumeTypePreset";
import type { CreateResumeTypePresetInput, UpdateResumeTypePresetInput } from "@/lib/validators/resumeTypePreset.schema";
import type { CandidateResumeTypePreset } from "@/infrastructure/ai/gemini/ResumeTypePresetSuggesterService";

export const resumeTypePresetKeys = {
  all: ["resumeTypePresets"] as const,
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const { data } = await res.json();
  return data as T;
}

export function useResumeTypePresets() {
  return useQuery({
    queryKey: resumeTypePresetKeys.all,
    queryFn: () => fetchJson<ResumeTypePresetDTO[]>("/api/resume-type-presets"),
  });
}

export function useCreateResumeTypePreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateResumeTypePresetInput) =>
      fetchJson<ResumeTypePresetDTO>("/api/resume-type-presets", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resumeTypePresetKeys.all });
      toast({ title: `"${data.name}" added` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add preset", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateResumeTypePreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateResumeTypePresetInput & { id: string }) =>
      fetchJson<ResumeTypePresetDTO>(`/api/resume-type-presets/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resumeTypePresetKeys.all });
      toast({ title: `"${data.name}" updated` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteResumeTypePreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => fetchJson<void>(`/api/resume-type-presets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeTypePresetKeys.all });
      toast({ title: "Preset removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
    },
  });
}

export function useSuggestResumeTypePresets() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: { language: string }) =>
      fetchJson<CandidateResumeTypePreset[]>("/api/resume-type-presets/suggest", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onError: (error: Error) => {
      toast({ title: "Suggestion failed", description: error.message, variant: "destructive" });
    },
  });
}
