// Liveness check for uptime monitors and deploy checks. Reveals nothing about configuration.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok", service: "web" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
