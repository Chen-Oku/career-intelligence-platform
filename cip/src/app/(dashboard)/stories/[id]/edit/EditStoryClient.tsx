"use client";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { StoryForm } from "@/components/career/StoryForm";
import { useStory, useUpdateStory } from "@/hooks/useStories";
import { storyDTOToFormValues } from "@/lib/types/story";

export function EditStoryClient({ id }: { id: string }) {
  const t = useTranslations("stories");
  const { data: story, isLoading, isError } = useStory(id);
  const { mutateAsync, isPending } = useUpdateStory(id);
  if (isLoading) return <div className="p-6 max-w-3xl mx-auto"><ExperienceListSkeleton /></div>;
  if (isError || !story) notFound();
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title={t("editPage.title")} description={story.title} />
      <StoryForm defaultValues={storyDTOToFormValues(story)} onSubmit={async (d) => { await mutateAsync(d); }} isLoading={isPending} submitLabel={t("editPage.submitLabel")} />
    </div>
  );
}
