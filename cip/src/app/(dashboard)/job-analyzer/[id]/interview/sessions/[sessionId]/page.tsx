import { SessionRecapClient } from "./SessionRecapClient";

export const metadata = { title: "Interview Session Recap" };

export default async function SessionRecapPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  return <SessionRecapClient jobId={id} sessionId={sessionId} />;
}
