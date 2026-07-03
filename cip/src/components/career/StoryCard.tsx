"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { STORY_CATEGORY_LABELS, STORY_CATEGORY_COLORS } from "@/lib/types/story";
import { useDeleteStory } from "@/hooks/useStories";
import type { StoryDTO } from "@/lib/types/story";

/**
 * StoryCard — collapsible card for the story list.
 *
 * UX decision: Expand in-place rather than navigate to a detail page.
 * Stories are read frequently during interview prep — collapsing/expanding
 * is faster than navigating back and forth.
 *
 * The STAR labels (S / T / A / R) are intentionally small and muted —
 * they act as structural anchors, not the main reading surface.
 */
export function StoryCard({ story }: { story: StoryDTO }) {
  const t = useTranslations("stories");
  const [expanded, setExpanded] = useState(false);
  const { mutate: deleteStory, isPending } = useDeleteStory();
  const categoryColor = STORY_CATEGORY_COLORS[story.category];

  return (
    <div className={cn(
      "group rounded-lg border bg-card transition-shadow",
      expanded ? "shadow-sm" : "hover:shadow-sm",
      "border-border overflow-hidden",
    )}>
      {/* Header row — always visible */}
      <div
        className="flex items-start gap-4 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("h-5 px-2 text-[10px] font-medium border", categoryColor)}>
              {STORY_CATEGORY_LABELS[story.category]}
            </Badge>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold leading-snug">{story.title}</h3>
          {!expanded && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {story.situation}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Edit + delete — only visible on hover */}
          <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild onClick={(e) => e.stopPropagation()}>
              <Link href={`/stories/${story.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("card.deleteDialog.title")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.rich("card.deleteDialog.description", {
                      title: story.title,
                      strong: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("card.deleteDialog.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteStory(story.id)}
                  >{t("card.deleteDialog.confirm")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Expand toggle */}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Expanded STAR content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border/50">
          <div className="mt-4 space-y-4">
            {[
              { label: "S", full: t("card.situation"), content: story.situation },
              { label: "T", full: t("card.task"),      content: story.task },
              { label: "A", full: t("card.action"),    content: story.action },
              { label: "R", full: t("card.result"),    content: story.result },
            ].map(({ label, full, content }) => (
              <div key={label} className="flex gap-3">
                <div className="w-5 shrink-0 pt-0.5">
                  <span className="font-mono-data text-xs font-semibold text-muted-foreground/60">
                    {label}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    {full}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{content}</p>
                </div>
              </div>
            ))}

            {story.impact && (
              <div className="flex gap-3">
                <div className="w-5 shrink-0 pt-0.5">
                  <span className="font-mono-data text-xs font-semibold text-primary/60">★</span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/60 mb-1">{t("card.impact")}</p>
                  <p className="text-sm font-medium text-primary">{story.impact}</p>
                </div>
              </div>
            )}
          </div>

          {/* Skills / keywords */}
          {(story.skills.length > 0 || story.keywords.length > 0) && (
            <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap gap-1.5">
              {story.skills.map((s) => (
                <Badge key={s} variant="secondary" className="h-5 px-2 text-[11px] font-normal">{s}</Badge>
              ))}
              {story.keywords.map((k) => (
                <Badge key={k} variant="outline" className="h-5 px-2 text-[11px] font-normal text-muted-foreground">{k}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
