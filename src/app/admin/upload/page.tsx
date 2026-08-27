import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { UploadForm } from "@/components/UploadForm";
import { getAdminSession } from "@/lib/auth";
import { getAllCases } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin upload",
  description: "Upload case documents to storage and register them in the documents table.",
};

export default async function AdminUploadPage() {
  const session = await getAdminSession();
  const cases = getAllCases().map((c) => ({ id: c.id, slug: c.slug, name: c.name }));

  return (
    <div className="site-shell py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
            Admin
          </p>
          <h1 className="display mt-2 text-4xl">Upload document</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
            Signed in as {session?.email ?? "admin"}. Uploads go to Supabase
            Storage + <code>documents</code> table when configured; otherwise
            local <code>.data/uploads</code> with a documents row in the MVP store.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/admin/cases/new" className="text-[var(--accent)] hover:underline">
            Create case
          </Link>
          <Link href="/" className="text-[var(--ink-soft)] hover:text-[var(--accent)]">
            Archive
          </Link>
          <LogoutButton />
        </div>
      </div>
      <UploadForm cases={cases} />
    </div>
  );
}
