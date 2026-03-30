import { prisma } from "@/server/db";
import crypto from "crypto";

export default async function VerifyPage({
  params,
}: {
  params: { certificateId: string };
}) {
  const cert = await prisma.certificate.findUnique({
    where: { certificateId: params.certificateId },
    include: {
      attempt: {
        include: { result: true, exam: true, user: true },
      },
    },
  });

  if (!cert) {
    return <div>Certificate Not Found</div>;
  }

  // 🔒 Block invalidated attempts
  if (cert.attempt.status === "invalidated") {
    return <div>Certificate Invalidated</div>;
  }

  // 🔒 Optional revocation check (if you add isRevoked later)
  if ((cert as any).isRevoked) {
    return <div>Certificate Revoked</div>;
  }

  // 🔐 Recompute verification hash
  const computed = crypto
    .createHash("sha256") 
    .update(
      cert.attempt.id +
        cert.attempt.result?.wpm +
        cert.attempt.result?.accuracy +
        cert.attempt.result?.totalChars +
        cert.attempt.durationMs +
        cert.certificateId
    )
    .digest("hex");

  if (computed !== cert.verificationHash) {
    return <div>Certificate Tampered</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-10">
      <h1 className="text-2xl font-bold mb-6">
        Certificate Verified
      </h1>

      <div className="space-y-2">
        <div>Candidate: {cert.attempt.user?.name}</div>
        <div>Exam: {cert.attempt.exam.title}</div>
        <div>Mode: {cert.attempt.mode}</div>
        <div>WPM: {cert.attempt.result?.wpm}</div>
        <div>Accuracy: {cert.attempt.result?.accuracy}%</div>
        <div>Issued: {cert.issuedAt.toDateString()}</div>
        <div>Certificate ID: {cert.certificateId}</div>
      </div>
    </div>
  );
}