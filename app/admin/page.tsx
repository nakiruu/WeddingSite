import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLogin } from "@/components/admin-login";
import { AdminDashboard } from "@/components/admin-dashboard";
import { ADMIN_COOKIE, sessionTokenIsValid } from "@/lib/admin-auth";
import { getDb, listRsvps, listClaims } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin — Julie & Nick",
  // Keep it out of search results even if the URL is guessed or shared.
  robots: { index: false, follow: false, nocache: true },
};

// Guest data must never be prerendered into a cacheable page.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const jar = await cookies();
  const authorized = sessionTokenIsValid(jar.get(ADMIN_COOKIE)?.value);

  // The database is only read after the check, so an unauthorized request
  // never loads guest data into memory, let alone into the response.
  if (!authorized) return <AdminLogin />;

  const db = getDb();
  return <AdminDashboard rsvps={listRsvps(db)} claims={listClaims(db)} />;
}
