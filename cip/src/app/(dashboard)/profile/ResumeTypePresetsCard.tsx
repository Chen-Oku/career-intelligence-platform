"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useResumeTypePresets, useCreateResumeTypePreset, useUpdateResumeTypePreset,
  useDeleteResumeTypePreset, useSuggestResumeTypePresets,
} from "@/hooks/useResumeTypePresets";
import { ResumeTypePresetForm } from "@/components/document/ResumeTypePresetForm";
import { ResumeTypePresetSuggestionDialog } from "@/components/document/ResumeTypePresetSuggestionDialog";
import type { CreateResumeTypePresetInput } from "@/lib/validators/resumeTypePreset.schema";
import type { ResumeTypePresetDTO } from "@/lib/types/resumeTypePreset";
import type { CandidateResumeTypePreset } from "@/infrastructure/ai/gemini/ResumeTypePresetSuggesterService";

/**
 * ResumeTypePresetsCard — the user's own set of resume "angles" (e.g.
 * "Backend Engineer", "ArchViz"), used to tune generation. Replaces the old
 * fixed 9-type list: MASTER/CUSTOM stay as universal built-ins (not shown
 * here as rows), everything else starts empty per account and is built by
 * hand or via "Suggest with AI".
 */
export function ResumeTypePresetsCard() {
  const t = useTranslations("profile.resumeTypePresets");
  const locale = useLocale();
  const { data: presets, isLoading } = useResumeTypePresets();
  const { mutate: deletePreset, isPending: isDeleting } = useDeleteResumeTypePreset();
  const { mutateAsync: suggest, isPending: isSuggesting } = useSuggestResumeTypePresets();

  const [editing, setEditing] = useState<ResumeTypePresetDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<CandidateResumeTypePreset[] | null>(null);

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (preset: ResumeTypePresetDTO) => { setEditing(preset); setDialogOpen(true); };

  const handleSuggest = async () => {
    const result = await suggest({ language: locale });
    if (result) setSuggestions(result);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={isSuggesting} onClick={handleSuggest}>
            {isSuggesting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            {t("suggestWithAi")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        {!isLoading && presets && presets.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
            <p className="text-sm font-medium">{t("emptyState.title")}</p>
            <p className="max-w-sm text-xs text-muted-foreground">{t("emptyState.description")}</p>
          </div>
        )}

        {!isLoading && presets && presets.length > 0 && (
          <ul className="space-y-2">
            {presets.map((preset) => (
              <li key={preset.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{preset.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{preset.focus}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(preset)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deletePreset(preset.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button type="button" variant="outline" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />{t("addPreset")}
        </Button>
      </CardContent>

      <ResumeTypePresetDialog key={editing?.id ?? "new"} open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      {suggestions && (
        <ResumeTypePresetSuggestionDialog
          open={suggestions !== null}
          onOpenChange={(open) => { if (!open) setSuggestions(null); }}
          candidates={suggestions}
        />
      )}
    </Card>
  );
}

function ResumeTypePresetDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ResumeTypePresetDTO | null;
}) {
  const t = useTranslations("profile.resumeTypePresets.form");
  const { mutateAsync: create, isPending: isCreating } = useCreateResumeTypePreset();
  const { mutateAsync: update, isPending: isUpdating } = useUpdateResumeTypePreset();
  const isPending = isCreating || isUpdating;

  const defaultValues: Partial<CreateResumeTypePresetInput> & { prioritizeKeywords?: string[] } = editing
    ? {
        name: editing.name,
        focus: editing.focus,
        vocabulary: editing.vocabulary ?? "",
        prioritizeKeywords: editing.prioritizeKeywords,
        defaultTitle: editing.defaultTitle ?? "",
      }
    : { name: "", focus: "", vocabulary: "", prioritizeKeywords: [], defaultTitle: "" };

  const handleSubmit = async (values: CreateResumeTypePresetInput) => {
    if (editing) await update({ id: editing.id, ...values });
    else await create(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>
        <ResumeTypePresetForm
          defaultValues={defaultValues}
          isLoading={isPending}
          submitLabel={editing ? t("saveChanges") : t("create")}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
