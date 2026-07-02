import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { SkillDTO } from "@/lib/types/skill";
import type { CreateSkillInput, UpdateSkillInput } from "@/lib/validators/skill.schema";
import type { SkillCandidate } from "@/application/career/DetectSkillCandidates";

export const skillKeys = {
  all: ["skills"] as const,
  detail: (id: string) => ["skills", id] as const,
  candidates: ["skills", "candidates"] as const,
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

export function useSkills() {
  return useQuery({
    queryKey: skillKeys.all,
    queryFn: () => fetchJson<SkillDTO[]>("/api/skills"),
  });
}

/**
 * Skill mentions found across Experience/Project/Story arrays that aren't in
 * the Skill table yet. Fetched only while the detection dialog is open.
 */
export function useSkillCandidates(enabled: boolean) {
  return useQuery({
    queryKey: skillKeys.candidates,
    queryFn: () => fetchJson<SkillCandidate[]>("/api/skills/detect"),
    enabled,
    staleTime: 0,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateSkillInput) =>
      fetchJson<SkillDTO>("/api/skills", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
      toast({ title: `"${data.name}" added` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add skill", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateSkillInput & { id: string }) =>
      fetchJson<SkillDTO>(`/api/skills/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
      toast({ title: `"${data.name}" updated` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<void>(`/api/skills/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
      toast({ title: "Skill removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
    },
  });
}

export function useClearAllSkills() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => fetchJson<void>("/api/skills", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
      toast({ title: "All skills cleared" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to clear", description: error.message, variant: "destructive" });
    },
  });
}
