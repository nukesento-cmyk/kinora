import { identity } from "@kinora/core";
import { getBrand } from "@kinora/ui";
import { getAuth, getDb } from "@/server/auth";

export const dynamic = "force-dynamic";

/** The signed-in member's own data as a JSON download. Nothing about anyone else. */
export async function GET(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  const db = getDb();
  const rows = await identity.collectMemberData(db, session.user.id);
  if (!rows) {
    return Response.json(
      { error: "not_found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  const now = new Date();
  await identity.recordDataExport(db, session.user.id);
  const slug =
    getBrand(process.env)
      .name.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") || "account";
  return new Response(JSON.stringify(identity.buildMemberExport(rows, now), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-data-${now.toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
