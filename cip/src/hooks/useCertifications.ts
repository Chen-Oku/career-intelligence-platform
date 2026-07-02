import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { CertificationDTO } from "@/lib/types/certification";
import type { CreateCertificationInput, UpdateCertificationInput } from "@/lib/validators/certification.schema";

export const certificationKeys = {
  all: ["certifications"] as const,
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

export function useCertifications() {
  return useQuery({
    queryKey: certificationKeys.all,
    queryFn: () => fetchJson<CertificationDTO[]>("/api/certifications"),
  });
}

export function useCreateCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateCertificationInput) =>
      fetchJson<CertificationDTO>("/api/certifications", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: certificationKeys.all });
      toast({ title: `"${data.name}" added` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add certification", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCertificationInput & { id: string }) =>
      fetchJson<CertificationDTO>(`/api/certifications/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: certificationKeys.all });
      toast({ title: `"${data.name}" updated` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => fetchJson<void>(`/api/certifications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificationKeys.all });
      toast({ title: "Certification removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
    },
  });
}
