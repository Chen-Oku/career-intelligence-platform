"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { createSkillSchema, CreateSkillInput, SKILL_CATEGORIES, SKILL_LEVELS } from "@/lib/validators/skill.schema";
import { suggestSkillCategory, findSimilarSkillName } from "@/lib/types/skill";
import { useCreateSkill, useUpdateSkill, useSkills } from "@/hooks/useSkills";
import type { SkillDTO } from "@/lib/types/skill";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, the dialog is in edit mode */
  editSkill?: SkillDTO | null;
}

/**
 * AddSkillDialog — handles both create and edit.
 *
 * UX decision: No "add another" toggle here. Instead, the dialog closes
 * after adding and the user can re-open it. Skills are added quickly
 * enough that the open/close cycle doesn't slow the workflow.
 * The alternative — keeping the dialog open — risks adding duplicates.
 */
export function AddSkillDialog({ open, onOpenChange, editSkill }: AddSkillDialogProps) {
  const t = useTranslations("skills");
  const isEditMode = !!editSkill;
  const { data: existingSkills } = useSkills();
  const { mutateAsync: createSkill, isPending: isCreating } = useCreateSkill();
  const { mutateAsync: updateSkill, isPending: isUpdating } = useUpdateSkill();
  const isPending = isCreating || isUpdating;

  // Tracks whether the user has manually picked a category for this session,
  // so the name-based suggestion doesn't clobber a deliberate choice.
  const categoryTouchedRef = useRef(false);

  const form = useForm<CreateSkillInput>({
    resolver: zodResolver(createSkillSchema),
    defaultValues: {
      name: "",
      category: "TECHNICAL",
      level: "INTERMEDIATE",
      isPublic: true,
      tags: [],
    },
  });

  const category = form.watch("category");
  const name = form.watch("name");
  const isSoft = category === "SOFT";

  const otherSkillNames = useMemo(
    () => (existingSkills ?? []).filter((s) => s.id !== editSkill?.id).map((s) => s.name),
    [existingSkills, editSkill],
  );
  const similarName = useMemo(() => findSimilarSkillName(name, otherSkillNames), [name, otherSkillNames]);

  // Populate form when switching to edit mode
  useEffect(() => {
    categoryTouchedRef.current = false;
    if (editSkill) {
      form.reset({
        name: editSkill.name,
        category: editSkill.category,
        level: editSkill.level,
        yearsOfExp: editSkill.yearsOfExp,
        isPublic: editSkill.isPublic,
        tags: [...editSkill.tags],
      });
    } else {
      form.reset({ name: "", category: "TECHNICAL", level: "INTERMEDIATE", isPublic: true, tags: [] });
    }
  }, [editSkill, form]);

  // Soft skills aren't rated by proficiency level — clear it when switching to SOFT.
  useEffect(() => {
    if (isSoft) form.setValue("level", undefined);
  }, [isSoft, form]);

  const handleSubmit = async (data: CreateSkillInput) => {
    if (isEditMode && editSkill) {
      await updateSkill({ id: editSkill.id, ...data });
    } else {
      await createSkill(data);
    }
    onOpenChange(false);
    categoryTouchedRef.current = false;
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("dialog.editTitle", { name: editSkill?.name ?? "" }) : t("dialog.addTitle")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dialog.nameLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("dialog.namePlaceholder")}
                      autoFocus
                      list="existing-skill-names"
                      {...field}
                      onBlur={(e) => {
                        field.onBlur();
                        if (!isEditMode && !categoryTouchedRef.current) {
                          const suggestion = suggestSkillCategory(e.target.value);
                          if (suggestion) form.setValue("category", suggestion);
                        }
                      }}
                    />
                  </FormControl>
                  {/* Native browser autocomplete against names already in use, to discourage near-duplicates like "Unreal" / "Unreal Engine" */}
                  <datalist id="existing-skill-names">
                    {Array.from(new Set(otherSkillNames)).map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                  {similarName && (
                    <p className="text-xs text-amber-600">
                      {t("dialog.similarNameWarning", { name: similarName })}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category + Level on same row — Level hidden for SOFT skills */}
            <div className={cn("grid gap-3", isSoft ? "grid-cols-1" : "grid-cols-2")}>
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dialog.categoryLabel")}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        categoryTouchedRef.current = true;
                        field.onChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("dialog.categoryPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SKILL_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {t(`category.${cat}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isSoft && (
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("dialog.levelLabel")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("dialog.levelPlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SKILL_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {t(`level.${level}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {isSoft && (
              <p className="text-xs text-muted-foreground -mt-1">
                {t("dialog.softSkillHint")}
              </p>
            )}

            {/* Years of experience — optional, shown compactly */}
            <FormField
              control={form.control}
              name="yearsOfExp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("dialog.yearsOfExpLabel")}{" "}
                    <span className="text-muted-foreground font-normal">{t("dialog.yearsOfExpOptional")}</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0.5}
                      max={50}
                      step={0.5}
                      placeholder={t("dialog.yearsOfExpPlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { onOpenChange(false); categoryTouchedRef.current = false; form.reset(); }}
                disabled={isPending}
              >
                {t("dialog.cancel")}
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? (
                  <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />{isEditMode ? t("dialog.saving") : t("dialog.adding")}</>
                ) : (
                  isEditMode ? t("dialog.saveChanges") : t("dialog.addSkill")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
