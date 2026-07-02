// src/hooks/useStories.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { StoryDTO } from "@/lib/types/story";
import type { CreateStoryInput, UpdateStoryInput } from "@/lib/validators/story.schema";

export const storyKeys = { all: ["stories"] as const, detail: (id: string) => ["stories", id] as const };

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `${res.status}`); }
  if (res.status === 204) return undefined as T;
  return (await res.json()).data as T;
}

export function useStories() {
  return useQuery({ queryKey: storyKeys.all, queryFn: () => fetchJson<StoryDTO[]>("/api/stories") });
}
export function useStory(id: string) {
  return useQuery({ queryKey: storyKeys.detail(id), queryFn: () => fetchJson<StoryDTO>(`/api/stories/${id}`), enabled: !!id });
}
export function useCreateStory() {
  const qc = useQueryClient(); const { toast } = useToast(); const router = useRouter();
  return useMutation({
    mutationFn: (i: CreateStoryInput) => fetchJson<StoryDTO>("/api/stories", { method: "POST", body: JSON.stringify(i) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: storyKeys.all }); toast({ title: "Story saved" }); router.push("/stories"); },
    onError: (e: Error) => toast({ title: "Failed to save", description: e.message, variant: "destructive" }),
  });
}
export function useUpdateStory(id: string) {
  const qc = useQueryClient(); const { toast } = useToast(); const router = useRouter();
  return useMutation({
    mutationFn: (i: Omit<UpdateStoryInput, "id">) => fetchJson<StoryDTO>(`/api/stories/${id}`, { method: "PATCH", body: JSON.stringify(i) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: storyKeys.all }); qc.invalidateQueries({ queryKey: storyKeys.detail(id) }); toast({ title: "Story updated" }); router.push("/stories"); },
    onError: (e: Error) => toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
  });
}
export function useDeleteStory() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => fetchJson<void>(`/api/stories/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: storyKeys.all }); toast({ title: "Story deleted" }); },
    onError: (e: Error) => toast({ title: "Failed to delete", description: e.message, variant: "destructive" }),
  });
}
export function useClearAllStories() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: () => fetchJson<void>("/api/stories", { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: storyKeys.all }); toast({ title: "All stories cleared" }); },
    onError: (e: Error) => toast({ title: "Failed to clear", description: e.message, variant: "destructive" }),
  });
}
