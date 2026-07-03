import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { ResumeDTO } from "@/lib/types/resume";
import type { GenerateResumeInput, UpdateResumeContentInput } from "@/lib/validators/resume.schema";

export const resumeKeys = {
  all: ["resumes"] as const,
  detail: (id: string) => ["resumes", id] as const,
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

export function useResumes() {
  return useQuery({ queryKey: resumeKeys.all, queryFn: () => fetchJson<ResumeDTO[]>("/api/resumes") });
}

export function useResume(id: string) {
  return useQuery({
    queryKey: resumeKeys.detail(id),
    queryFn: () => fetchJson<ResumeDTO>(`/api/resumes/${id}`),
    enabled: !!id,
  });
}

export function useGenerateResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: GenerateResumeInput) =>
      fetchJson<ResumeDTO>("/api/resumes/generate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.all });
      toast({ title: "Resume generated" });
      router.push(`/resumes/${data.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateResumeContentInput }) =>
      fetchJson<ResumeDTO>(`/api/resumes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(resumeKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: resumeKeys.all });
      toast({ title: "Resume updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });
}

function filenameFromContentDisposition(header: string | null, fallback: string): string {
  const match = header?.match(/filename="([^"]+)"/);
  return match?.[1] ?? fallback;
}

export function useDownloadResume() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, format }: { id: string; format: "pdf" | "docx" }) => {
      const res = await fetch(`/api/resumes/${id}/download?format=${format}`);
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? `Request failed: ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filenameFromContentDisposition(res.headers.get("Content-Disposition"), `resume.${format}`);
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

export function useDeleteResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => fetchJson<void>(`/api/resumes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.all });
      toast({ title: "Resume deleted" });
      router.push("/resumes");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    },
  });
}

export function useClearAllResumes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => fetchJson<void>("/api/resumes", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.all });
      toast({ title: "All resumes cleared" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to clear", description: error.message, variant: "destructive" });
    },
  });
}
