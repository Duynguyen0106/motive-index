import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function NotFound() {
  return (
    <div className="site-shell py-14 md:py-20">
      <Breadcrumbs items={[{ label: "Monitor", href: "/" }, { label: "Not found" }]} />
      <p className="label mt-6">404</p>
      <h1 className="display mt-3 text-4xl text-[var(--ink)] md:text-5xl">Page not found</h1>
      <p className="body-copy mt-4 max-w-xl text-lg text-[var(--ink-soft)]">
        That dossier or route doesn&apos;t exist in the catalog. Try search, the archive index, or
        return to the world monitor.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary text-sm">
          World monitor
        </Link>
        <Link href="/search" className="btn btn-ghost text-sm">
          Advanced search
        </Link>
        <Link href="/archive" className="btn btn-ghost text-sm">
          Case archive
        </Link>
      </div>
    </div>
  );
}
