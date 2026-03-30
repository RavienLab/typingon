export async function getTexts() {
  const res = await fetch("/api/v1/texts", {
    cache: "force-cache",
  });
  return res.json();
}
