"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ClearSectionButtonProps {
  /** Plural label for the entries being cleared, e.g. "experiences", "resumes" */
  itemLabel: string;
  count: number;
  onConfirm: () => void;
  isPending?: boolean;
}

/** Bulk "clear this whole section" control — used on every top-level list page. */
export function ClearSectionButton({ itemLabel, count, onConfirm, isPending }: ClearSectionButtonProps) {
  const t = useTranslations("common.clearSection");
  if (count === 0) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-muted-foreground hover:text-destructive">
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {t("clearSection")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("clearAllTitle", { itemLabel })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("clearAllDescription", { count, itemLabel })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? t("clearing") : t("clearAll")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
