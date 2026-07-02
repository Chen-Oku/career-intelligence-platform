import { CoverLetterDetailClient } from "./CoverLetterDetailClient";

export default async function CoverLetterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CoverLetterDetailClient id={id} />;
}
