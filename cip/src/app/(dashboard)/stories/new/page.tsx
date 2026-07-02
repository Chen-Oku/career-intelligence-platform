// src/app/(dashboard)/stories/new/page.tsx
"use client";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { StoryForm } from "@/components/career/StoryForm";
import { useCreateStory } from "@/hooks/useStories";

export default function NewStoryPage() {
  const t = useTranslations("stories");
  const { mutateAsync, isPending } = useCreateStory();
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title={t("newPage.title")} description={t("newPage.description")} />
      <StoryForm onSubmit={async (d) => { await mutateAsync(d); }} isLoading={isPending} />
    </div>
  );
}
