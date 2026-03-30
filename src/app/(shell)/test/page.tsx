import TestClient from "./TestClient";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Typing Test — Measure Your WPM & Accuracy",
  description:
    "Take a real-time typing test. Track WPM, accuracy, consistency, and improve with daily practice.",
};

export default function Page() {
  return <TestClient />;
}