import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { ModerationQueue } from "@/components/ModerationQueue";
import { RunLiveUpdateButton } from "@/components/RunLiveUpdateButton";
import { getAdminSession } from "@/lib/auth";
import { getModerationQueue } from "@/lib/data";
import { getRecentJobs } from "@/lib/pipeline/ingestWorker";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Moderation",
  description: "Approve or reject live-ingest drafts before publication.",
};

export default async function AdminModerationPage() {
  const session = await getAdminSession();
  const queue = getModerationQueue();
  const jobs = getRecentJobs(5);

  return (
    <div className="site-shell py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
            Admin
          </p>
          <h1 className="display mt-2 text-4xl">Moderation & live updates</h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Signed in as {session?.email ?? "admin"}. Drafts stay unpublished
            until approved.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/admin/cases/new" className="text-[var(--accent)] hover:underline">
            Create case
          </Link>
          <Link href="/admin/upload" className="text-[var(--accent)] hover:underline">
            Upload
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="mb-8">
        <RunLiveUpdateButton />
      </div>

      <section className="card mb-8 p-5">
        <h2 className="display text-xl">Publication checklist</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--ink-soft)]">
          <li>Every approve runs provenance + reference gates — blockers disable the button.</li>
          <li>Ingest/admin stubs need ≥1 verifiable reference (URL or court/report citation).</li>
          <li>AI/heuristic narratives and analysis stay draft until you verify primary sources.</li>
          <li>
            Catalog validation: <code className="text-xs">npm run validate:all</code>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="display mb-4 text-3xl">
          Queue ({queue.length})
        </h2>
        <ModerationQueue initial={queue} />
      </section>

      <section className="card p-5">
        <h2 className="display text-xl">Recent pipeline jobs</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--ink-soft)]">
          {jobs.map((job, i) => (
            <li key={i} className="border-b border-[var(--line)] pb-2 last:border-0">
              <code className="text-xs">{JSON.stringify(job)}</code>
            </li>
          ))}
          {!jobs.length ? <li>No jobs yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
