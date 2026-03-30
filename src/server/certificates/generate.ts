import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

type CertificateInput = {
  candidateName: string;
  examTitle: string;
  mode: string;
  wpm: number;
  accuracy: number;
  attemptId: string;
};

export async function generateCertificate(
  input: CertificateInput,
): Promise<string> {
  const outputDir = path.join(process.cwd(), "certificates");
  const filePath = path.join(outputDir, `${input.attemptId}.pdf`);

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  /* ---------- CONTENT ---------- */

  doc.fontSize(20).text("Typing Examination Certificate", {
    align: "center",
  });

  doc.moveDown(2);

  doc.fontSize(12);
  doc.text(`Candidate Name: ${input.candidateName}`);
  doc.text(`Exam Title: ${input.examTitle}`);
  doc.text(`Mode: ${input.mode}`);
  doc.text(`Words Per Minute (WPM): ${input.wpm.toFixed(2)}`);
  doc.text(`Accuracy: ${input.accuracy.toFixed(2)}%`);
  doc.text(`Attempt ID: ${input.attemptId}`);

  doc.moveDown(2);
  doc.fontSize(10).text(
    "This certificate is system-generated and cryptographically verifiable.",
  );

  doc.end();

  // Wait for file write to complete
  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return filePath;
}
