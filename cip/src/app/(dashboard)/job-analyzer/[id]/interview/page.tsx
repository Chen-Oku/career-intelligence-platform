import { InterviewSimulatorClient } from "./InterviewSimulatorClient";

export const metadata = { title: "Mock Interview" };

export default async function InterviewSimulatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InterviewSimulatorClient jobId={id} />;
}
