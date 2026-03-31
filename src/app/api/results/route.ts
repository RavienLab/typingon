export async function POST() {
  return new Response(
    JSON.stringify({ error: "Deprecated endpoint" }),
    { status: 410 }
  );
}