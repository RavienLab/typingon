import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { prisma } from "@/server/db";
import { Buffer } from "buffer";

/* -------------------------------------------------- */
/* STREAM VERSION (Single Certificate Download) */
/* -------------------------------------------------- */

export async function generateCertificatePdf(certificateId: string) {
  const cert = await prisma.certificate.findUnique({
    where: { certificateId },
    include: {
      attempt: {
        include: {
          result: true,
          exam: true,
          user: true,
        },
      },
    },
  });

  if (!cert) throw new Error("Certificate not found");

  const verificationUrl =
    `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certificateId}`;

  const qrImage = await QRCode.toDataURL(verificationUrl);

  const doc = new PDFDocument({ size: "A4", margin: 50 });

  doc.fontSize(26).text("Typing Certification", { align: "center" });
  doc.moveDown(2);

  doc.fontSize(16).text(`Candidate: ${cert.attempt.user?.name ?? ""}`);
  doc.text(`Exam: ${cert.attempt.exam.title}`);
  doc.text(`Mode: ${cert.attempt.mode}`);
  doc.text(`WPM: ${cert.attempt.result?.wpm ?? ""}`);
  doc.text(`Accuracy: ${cert.attempt.result?.accuracy ?? ""}%`);

  doc.moveDown(2);
  doc.text(`Certificate ID: ${cert.certificateId}`);
  doc.text(`Issued: ${cert.issuedAt.toDateString()}`);

  doc.moveDown(2);
  doc.image(qrImage, { fit: [120, 120] });

  doc.end();

  return doc;
}

/* -------------------------------------------------- */
/* BUFFER VERSION (For ZIP Batch Export) */
/* -------------------------------------------------- */

export async function generateCertificateBufferFromId(
  certificateId: string
): Promise<Buffer> {
  const cert = await prisma.certificate.findUnique({
    where: { certificateId },
    include: {
      attempt: {
        include: {
          result: true,
          exam: true,
          user: true,
        },
      },
    },
  });

  if (!cert) throw new Error("Certificate not found");

  const doc = new PDFDocument({ size: "A4", margin: 50 });

  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  const finished = new Promise<Buffer>((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });

  doc.fontSize(26).text("Typing Certification", { align: "center" });
  doc.moveDown(2);

  doc.fontSize(16).text(`Candidate: ${cert.attempt.user?.name ?? ""}`);
  doc.text(`Exam: ${cert.attempt.exam.title}`);
  doc.text(`Mode: ${cert.attempt.mode}`);
  doc.text(`WPM: ${cert.attempt.result?.wpm ?? ""}`);
  doc.text(`Accuracy: ${cert.attempt.result?.accuracy ?? ""}%`);

  doc.moveDown(2);
  doc.text(`Certificate ID: ${cert.certificateId}`);
  doc.text(`Issued: ${cert.issuedAt.toDateString()}`);

  doc.end();

  return finished;
}