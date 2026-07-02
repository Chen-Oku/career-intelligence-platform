import { EditProjectClient } from "./EditProjectClient";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditProjectClient id={id} />;
}
