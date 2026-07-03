import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { EducationDTO } from "@/lib/types/education";
import type { CreateEducationInput, UpdateEducationInput } from "@/lib/validators/education.schema";

export const educationKeys = {
  all: ["education"] as const,
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

export function useEducation() {
  return useQuery({
    queryKey: educationKeys.all,
    queryFn: () => fetchJson<EducationDTO[]>("/api/education"),
  });
}

export function useCreateEducation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateEducationInput) =>
      fetchJson<EducationDTO>("/api/education", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: educationKeys.all });
      toast({ title: `"${data.institution}" added` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add education", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateEducation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateEducationInput & { id: string }) =>
      fetchJson<EducationDTO>(`/api/education/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: educationKeys.all });
      toast({ title: `"${data.institution}" updated` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteEducation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => fetchJson<void>(`/api/education/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.all });
      toast({ title: "Education entry removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
    },
  });
}
