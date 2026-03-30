import { prisma } from "@/server/db";
import { analyzeSuspicion } from "@/server/exam/suspicion";

export default async function AttemptDetail({
  params,
}: {
  params: { attemptId: string };
}) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: params.attemptId },
    include: {
      user: true,
      exam: true,
      result: true,
      events: true,
      keystrokes: true,
    },
  });

  if (!attempt) {
    return <div>Attempt not found</div>;
  }
  const flags = analyzeSuspicion(attempt, attempt.events);

  return (
    <div className="p-10 space-y-8">
      <h1 className="text-xl font-bold">Attempt Inspection</h1>

      <section>
        <div>Candidate: {attempt.user?.name}</div>
        <div>Exam: {attempt.exam.title}</div>
        <div>Status: {attempt.status}</div>
        <div>WPM: {attempt.result?.wpm}</div>
        <div>Accuracy: {attempt.result?.accuracy}</div>
      </section>

      {flags.length > 0 && (
        <div className="bg-red-100 text-red-700 p-4 rounded">
          <div className="font-semibold">Suspicion Flags</div>
          <ul>
            {flags.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
        </div>
      )}

      <section>
        <h2 className="font-semibold mb-3">Event Timeline</h2>
        <ul className="text-sm space-y-1">
          {attempt.events.map((e) => (
            <li key={e.id}>
              {e.type} — {new Date(e.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
