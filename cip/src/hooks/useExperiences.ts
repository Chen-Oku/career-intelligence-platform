import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { ExperienceDTO } from "@/lib/types/experience";
import type {
  CreateExperienceInput,
  UpdateExperienceInput,
} from "@/lib/validators/experience.schema";

// ─── Query Keys ───────────────────────────────────────────────────────────────
// Centralized keys prevent typos and make invalidation explicit.
export const experienceKeys = {
  all: ["experiences"] as const,
  detail: (id: string) => ["experiences", id] as const,
};

// ─── Fetcher Utilities ────────────────────────────────────────────────────────

/** Turns a Zod .flatten() error payload into a readable message, e.g. "teamSize: Number must be greater than 0" */
function describeValidationError(body: {
  details?: { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };
}): string | undefined {
  const details = body.details;
  if (!details) return undefined;

  const messages = [
    ...(details.formErrors ?? []),
    ...Object.entries(details.fieldErrors ?? {})
      .filter(([, msgs]) => msgs && msgs.length > 0)
      .map(([field, msgs]) => `${field}: ${msgs!.join(", ")}`),
  ];

  return messages.length > 0 ? messages.join(" ") : undefined;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(describeValidationError(body) ?? body.error ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  const { data } = await res.json();
  return data as T;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch all experiences for the current user */
export function useExperiences() {
  return useQuery({
    queryKey: experienceKeys.all,
    queryFn: () => fetchJson<ExperienceDTO[]>("/api/experience"),
  });
}

/** Fetch a single experience by id */
export function useExperience(id: string) {
  return useQuery({
    queryKey: experienceKeys.detail(id),
    queryFn: () => fetchJson<ExperienceDTO>(`/api/experience/${id}`),
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateExperience() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateExperienceInput) =>
      fetchJson<ExperienceDTO>("/api/experience", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: experienceKeys.all });
      toast({ title: "Experience saved" });
      router.push("/experience");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateExperience(id: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: Omit<UpdateExperienceInput, "id">) =>
      fetchJson<ExperienceDTO>(`/api/experience/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: experienceKeys.all });
      queryClient.invalidateQueries({ queryKey: experienceKeys.detail(id) });
      toast({ title: "Changes saved" });
      router.push("/experience");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<void>(`/api/experience/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: experienceKeys.all });
      toast({ title: "Experience deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useClearAllExperiences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => fetchJson<void>("/api/experience", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: experienceKeys.all });
      toast({ title: "All experience cleared" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to clear", description: error.message, variant: "destructive" });
    },
  });
}
