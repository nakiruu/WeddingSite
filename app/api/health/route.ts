import { NextResponse } from "next/server";

// Used by the container healthcheck. Deliberately does not touch the database:
// it answers "is the server accepting requests", which is what an orchestrator
// restarts on. A DB failure is a different problem with a different response.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true, service: "wedding-site" });
}
