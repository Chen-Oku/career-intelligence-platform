import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { postAiJson } from "@/lib/apiFetch";
import type { CoverLetterDTO } from "@/lib/types/coverLetter";

export interface GenerateCoverLetterParams {
  jobDescriptionId: string;
  language: string;
  extraNotes?: string;
}

export const coverLetterKeys = {
  all: ["coverLetters"] as const,
  detail: (id: string) => ["coverLetters", id] as const,
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()).data as T;
}

export function useCoverLetters() {
  return useQuery({ queryKey: coverLetterKeys.all, queryFn: () => fetchJson<CoverLetterDTO[]>("/api/cover-letters") });
}

export function useCoverLetter(id: string) {
  return useQuery({
    queryKey: coverLetterKeys.detail(id),
    queryFn: () => fetchJson<CoverLetterDTO>(`/api/cover-letters/${id}`),
    enabled: !!id,
  });
}

export function useGenerateCoverLetter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: GenerateCoverLetterParams) =>
      postAiJson<CoverLetterDTO>("/api/cover-letters/generate", input),
    onSuccess: ({ data, aiProvider }) => {
      queryClient.invalidateQueries({ queryKey: coverLetterKeys.all });
      toast({ title: "Cover letter generated", description: aiProvider ? `Generated with ${aiProvider}` : undefined });
      router.push(`/cover-letters/${data.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    },
  });
}

function filenameFromContentDisposition(header: string | null, fallback: string): string {
  const match = header?.match(/filename="([^"]+)"/);
  return match?.[1] ?? fallback;
}

export function useDownloadCoverLetter() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, format }: { id: string; format: "pdf" | "docx" }) => {
      const res = await fetch(`/api/cover-letters/${id}/download?format=${format}`);
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? `Request failed: ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filenameFromContentDisposition(res.headers.get("Content-Disposition"), `cover-letter.${format}`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    onError: (error: Error) => {
      toast({ title: "Download failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteCoverLetter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => fetchJson<void>(`/api/cover-letters/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coverLetterKeys.all });
      toast({ title: "Cover letter deleted" });
      router.push("/cover-letters");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    },
  });
}

export function useClearAllCoverLetters() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => fetchJson<void>("/api/cover-letters", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coverLetterKeys.all });
      toast({ title: "All cover letters cleared" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to clear", description: error.message, variant: "destructive" });
    },
  });
}
