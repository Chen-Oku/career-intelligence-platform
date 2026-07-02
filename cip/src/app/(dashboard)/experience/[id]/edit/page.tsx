import { EditExperienceClient } from "./EditExperienceClient";

export default async function EditExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditExperienceClient id={id} />;
}
