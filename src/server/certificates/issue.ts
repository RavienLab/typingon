import crypto from "crypto";
import { prisma } from "@/server/db";

export async function issueCertificate(attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { result: true, exam: true },
  });

  if (!attempt || attempt.status !== "verified") {
    throw new Error("Attempt not eligible");
  }

  // 🔒 Prevent duplicate issuance
  const existing = await prisma.certificate.findUnique({
    where: { attemptId },
  });

  if (existing) {
    return existing;
  }

  const year = new Date().getFullYear();
  const modeCode = attempt.mode.slice(0, 3).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  const certificateId = `TYP-${year}-${modeCode}-${random}`;

  // 🔐 Stronger verification hash
  const verificationHash = crypto
    .createHash("sha256")
    .update(
      attempt.id +
        attempt.result?.wpm +
        attempt.result?.accuracy +
        attempt.result?.totalChars +
        attempt.durationMs +
        certificateId
    )
    .digest("hex");

  return prisma.certificate.create({
    data: {
      attemptId,
      certificateId,
      verificationHash,
    },
  });
}