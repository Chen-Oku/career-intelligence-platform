import { ResumeDetailClient } from "./ResumeDetailClient";

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResumeDetailClient id={id} />;
}
