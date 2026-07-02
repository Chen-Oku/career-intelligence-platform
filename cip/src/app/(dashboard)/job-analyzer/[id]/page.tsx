import { JobAnalysisDetailClient } from "./JobAnalysisDetailClient";

export default async function JobAnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobAnalysisDetailClient id={id} />;
}
