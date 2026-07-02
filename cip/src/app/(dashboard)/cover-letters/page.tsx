// ── src/app/(dashboard)/cover-letters/page.tsx ───────────────────────────────
"use client";
import Link from "next/link";
import { Sparkles, Mail, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { ClearSectionButton } from "@/components/shared/ClearSectionButton";
import { useCoverLetters, useDeleteCoverLetter, useClearAllCoverLetters } from "@/hooks/useCoverLetters";

export default function CoverLettersPage() {
  const t = useTranslations("coverLetters.list");
  const { data: coverLetters, isLoading } = useCoverLetters();
  const { mutate: deleteCoverLetter } = useDeleteCoverLetter();
  const { mutate: clearAll, isPending: isClearing } = useClearAllCoverLetters();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        action={
          <div className="flex items-center gap-2">
            <ClearSectionButton
              itemLabel={t("clearLabel")}
              count={coverLetters?.length ?? 0}
              onConfirm={() => clearAll()}
              isPending={isClearing}
            />
            <Button size="sm" asChild>
              <Link href="/cover-letters/new"><Sparkles className="mr-1.5 h-3.5 w-3.5" />{t("generateCoverLetter")}</Link>
            </Button>
          </div>
        }
      />

      {isLoading && <ExperienceListSkeleton />}

      {!isLoading && (coverLetters?.length ?? 0) === 0 && (
        <EmptyState
          icon={Mail}
          title={t("emptyState.title")}
          description={t("emptyState.description")}
          action={<Button size="sm" asChild><Link href="/cover-letters/new">{t("emptyState.action")}</Link></Button>}
        />
      )}

      {!isLoading && coverLetters && coverLetters.length > 0 && (
        <div className="mt-6 space-y-3">
          {coverLetters.map((coverLetter) => (
            <div key={coverLetter.id} className="group flex items-center gap-0 rounded-lg border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow">
              <div className="w-0.5 shrink-0 bg-primary" />
              <div className="flex flex-1 items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <Link href={`/cover-letters/${coverLetter.id}`} className="block">
                    <h3 className="text-sm font-semibold truncate hover:text-primary transition-colors">
                      {coverLetter.company} — {coverLetter.jobTitle}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono-data">
                    {new Date(coverLetter.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/cover-letters/${coverLetter.id}`}>{t("view")}</Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteCoverLetter(coverLetter.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
