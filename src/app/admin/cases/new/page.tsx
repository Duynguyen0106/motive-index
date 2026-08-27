import Link from "next/link";
import { CaseCreateForm } from "@/components/CaseCreateForm";
import { LogoutButton } from "@/components/LogoutButton";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create case",
  description: "Extract structured case data with OpenAI and create a dossier.",
};

export default async function AdminNewCasePage() {
  const session = await getAdminSession();
  return (
    <div className="site-shell py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
            Admin
          </p>
          <h1 className="display mt-2 text-4xl">Create case</h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Signed in as {session?.email ?? "admin"}. Use extraction to pre-fill
            the form, then review and save.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/admin/upload" className="text-[var(--accent)] hover:underline">
            Upload document
          </Link>
          <LogoutButton />
        </div>
      </div>
      <CaseCreateForm />
    </div>
  );
}
