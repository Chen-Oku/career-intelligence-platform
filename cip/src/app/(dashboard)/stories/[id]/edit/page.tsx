import { EditStoryClient } from "./EditStoryClient";

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditStoryClient id={id} />;
}
