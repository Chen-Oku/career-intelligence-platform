// ── src/app/(dashboard)/stories/page.tsx ─────────────────────────────────────
"use client";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { ClearSectionButton } from "@/components/shared/ClearSectionButton";
import { StoryCard } from "@/components/career/StoryCard";
import { useStories, useClearAllStories } from "@/hooks/useStories";
import { STORY_CATEGORY_LABELS } from "@/lib/types/story";
import type { StoryCategory } from "@/domain/career/entities/Story";

export default function StoriesPage() {
  const t = useTranslations("stories");
  const { data: stories, isLoading, isError } = useStories();
  const { mutate: clearAll, isPending: isClearing } = useClearAllStories();

  // Group by category for a cleaner list
  const byCategory = stories?.reduce<Record<string, typeof stories>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {}) ?? {};

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={t("listPage.title")}
        description={t("listPage.description")}
        action={
          <div className="flex items-center gap-2">
            <ClearSectionButton
              itemLabel={t("listPage.clearLabel")}
              count={stories?.length ?? 0}
              onConfirm={() => clearAll()}
              isPending={isClearing}
            />
            <Button size="sm" asChild><Link href="/stories/new"><Plus className="mr-1.5 h-3.5 w-3.5" />{t("listPage.addStory")}</Link></Button>
          </div>
        }
      />
      {isLoading && <ExperienceListSkeleton />}
      {isError && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4"><p className="text-sm text-destructive">{t("listPage.loadError")}</p></div>}
      {!isLoading && !isError && (stories?.length ?? 0) === 0 && (
        <EmptyState
          icon={BookOpen}
          title={t("listPage.emptyState.title")}
          description={t("listPage.emptyState.description")}
          action={<Button size="sm" asChild><Link href="/stories/new">{t("listPage.emptyState.action")}</Link></Button>}
        />
      )}
      {!isLoading && Object.entries(byCategory).map(([category, catStories]) => (
        <div key={category} className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {STORY_CATEGORY_LABELS[category as StoryCategory]}
          </p>
          <div className="space-y-3">
            {catStories.map((s) => <StoryCard key={s.id} story={s} />)}
          </div>
        </div>
      ))}
      {!isLoading && (stories?.length ?? 0) > 0 && (
        <p className="mt-6 text-center font-mono-data text-xs text-muted-foreground">
          {t("listPage.summary", { count: stories!.length })}
        </p>
      )}
    </div>
  );
}
