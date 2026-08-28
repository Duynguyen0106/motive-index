import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DistressResources } from "@/components/ContentWarning";
import { Disclaimer } from "@/components/Disclaimer";
import { PageHeader } from "@/components/PageHeader";
import { QuickLinks } from "@/components/ui";

export const metadata: Metadata = {
  title: "About & ethics",
  description: "Purpose, audience, ethical guidelines, and access policy for Motive Index.",
};

export default function AboutPage() {
  return (
    <div className="site-shell page-intro py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Monitor", href: "/" }, { label: "About & ethics" }]} />
      <PageHeader
        className="mt-5"
        label="About"
        title="Purpose & ethics"
        description="A searchable educational repository of historical case files, document pointers, and forensic psychological analyses focused on offender behavior, motivation, and mental-state concepts."
      />
      <QuickLinks
        links={[
          { href: "/method", label: "Method" },
          { href: "/contribute", label: "Contribute" },
          { href: "/archive", label: "Case archive" },
          { href: "/stats", label: "Archive stats" },
        ]}
      />

      <div className="mt-10 space-y-10 pb-8">
        <section className="panel p-6 md:p-8">
          <h2 className="display text-2xl">Target audience</h2>
          <ul className="mt-4 space-y-2 text-[var(--ink-soft)]">
            <li>Forensic psychology students and academics</li>
            <li>Researchers in criminology, psychology, and sociology</li>
            <li>Law enforcement professionals (training contexts)</li>
            <li>Writers, journalists, and educators (with disclaimers)</li>
            <li>General readers with scholarly interest (content warnings apply)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="display text-3xl">Ethical & sensitivity guidelines</h2>
          <div className="card p-6">
            <ul className="space-y-3 text-[var(--ink-soft)]">
              <li>
                <strong className="text-[var(--ink)]">Victims first.</strong> Avoid
                gratuitous detail and graphic imagery; prefer analysis over spectacle.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Content warnings</strong> on
                dossiers and documents with disturbing material.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Restricted materials</strong>{" "}
                may require adult / academic framing; see access policy below.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Cite rigorously.</strong> Never
                present speculation as fact; label hypotheses and confidence.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Living persons.</strong>{" "}
                Anonymize when appropriate; stick to public facts for public figures.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Photographs.</strong> Flagship
                dossiers may include attributed public-record images—courthouses,
                memorials, and historical context preferred over crime-scene or victim
                imagery. Mugshots and arrest photos are click-to-reveal.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Copyright.</strong> Host only
                public-domain or permitted materials; otherwise link out.
              </li>
              <li>
                <strong className="text-[var(--ink)]">No clinical advice.</strong>{" "}
                Educational use only—not diagnosis, treatment, or legal counsel.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Anti-fabrication.</strong> Live
                ingest and AI drafts cannot publish without passing provenance and
                reference integrity gates. Wikipedia-sourced catalog entries are labeled as
                encyclopedic, not human-reviewed.
              </li>
            </ul>
          </div>
        </section>

        <section id="access" className="card scroll-mt-24 p-6 md:p-8">
          <h2 className="display text-2xl">Access policy</h2>
          <p className="body-copy mt-3 text-[var(--ink-soft)]">
            This MVP publishes educational summaries openly with warnings. Future
            releases will add age gates and academic registration for graphic
            primary documents. Contributors must accept automated integrity review.
          </p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Planned: authentication, role-based document access, and audit logs for
            sensitive retrievals.
          </p>
        </section>

        <section className="card p-6 md:p-8">
          <h2 className="display text-2xl">Legal notes</h2>
          <ul className="mt-4 space-y-2 text-[var(--ink-soft)]">
            <li>Account terms and privacy policy will govern submissions when auth launches.</li>
            <li>Defamation risk is reduced by sticking to public records and labeled opinion.</li>
            <li>Jurisdiction-specific privacy rules may limit autopsy or sealed materials.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <DistressResources />
          <Disclaimer />
          <p className="text-sm text-[var(--muted)]">
            See also <Link href="/method" className="text-[var(--accent)] hover:underline">Method</Link>{" "}
            and <Link href="/contribute" className="text-[var(--accent)] hover:underline">Contribute</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
