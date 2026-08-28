import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseTabs } from "@/components/CaseTabs";
import { CaseTabKeyboardNav } from "@/components/CaseTabKeyboardNav";
import { CaseNarrativeView } from "@/components/CaseNarrative";
import { ContentWarning, DistressResources } from "@/components/ContentWarning";
import { Disclaimer } from "@/components/Disclaimer";
import { DossierActionBar } from "@/components/DossierActionBar";
import { PsychMap } from "@/components/PsychMap";
import { Timeline } from "@/components/Timeline";
import { RelatedCases } from "@/components/RelatedCases";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { CaseStatusBadge } from "@/components/ui";
import { getActiveTab, CASE_TABS } from "@/lib/case-tabs";
import {
  getAllCases,
  getCaseBySlug,
  getDocumentsForCase,
  getTheories,
} from "@/lib/data";
import type { CrimeCase } from "@/lib/types";
import {
  CRIME_CATEGORY_LABELS,
  FACTOR_LABELS,
  FRAMEWORK_LABELS,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { resolveCaseCountry } from "@/lib/country";
import { monitorUrlFromFilters, searchUrlFromFilters } from "@/lib/search";
import { getSiteUrl } from "@/lib/seo";
import type { SearchFilters } from "@/lib/types";

function getCaseByIdOrSlug(idOrSlug: string): CrimeCase | undefined {
  const key = decodeURIComponent(idOrSlug);
  return getAllCases().find((c) => c.id === key) ?? getCaseBySlug(key);
}
export const dynamicParams = true;
export const dynamic = "force-dynamic";

function theoryHref(framework: string): string {
  const match = getTheories().find((t) => t.framework === framework);
  return match ? `/resources/theories/${match.slug}` : "/resources";
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateStaticParams() {
  return getAllCases().map((c) => ({ id: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = getCaseByIdOrSlug(id);
  if (!c) return { title: "Case not found" };
  const url = `${getSiteUrl()}/cases/${c.slug}`;
  return {
    title: c.name,
    description: c.subtitle,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: c.name,
      description: c.subtitle,
      url,
    },
    twitter: {
      card: "summary",
      title: c.name,
      description: c.subtitle,
    },
  };
}

export default async function CasePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const crimeCase = getCaseByIdOrSlug(id);
  if (!crimeCase) notFound();

  if (decodeURIComponent(id) !== crimeCase.slug) {
    const tab = sp.tab ? `?tab=${encodeURIComponent(sp.tab)}` : "";
    permanentRedirect(`/cases/${crimeCase.slug}${tab}`);
  }

  const narrative = crimeCase.narrative;
  const tab = getActiveTab(sp.tab, { hasNarrative: Boolean(narrative) });
  const tabLabel = CASE_TABS.find((t) => t.id === tab)?.label ?? tab;

  const country = resolveCaseCountry(crimeCase);
  const searchSimilar: SearchFilters = {
    country,
    crimeCategory: crimeCase.crimeCategories[0] ?? "",
  };

  const docs = getDocumentsForCase(crimeCase.slug);
  const { analysis } = crimeCase;
  const allCases = getAllCases();
  const dossierUrl = `${getSiteUrl()}/cases/${crimeCase.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: crimeCase.name,
    description: crimeCase.subtitle,
    url: dossierUrl,
    datePublished: `${crimeCase.yearStart}`,
    author: { "@type": "Organization", name: "Motive Index" },
    about: crimeCase.crimeCategories.map((c) => CRIME_CATEGORY_LABELS[c]).join(", "),
  };

  return (
    <article className="dossier-page pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="dossier-header site-shell py-10 md:py-12">
        <Breadcrumbs
          items={[
            { label: "Monitor", href: "/" },
            { label: "Archive", href: "/archive" },
            { label: crimeCase.name, href: `/cases/${crimeCase.slug}` },
            { label: tabLabel },
          ]}
        />
        <p className="label mt-5 flex flex-wrap items-center gap-2">
          <span>
            {crimeCase.yearStart}
            {crimeCase.yearEnd ? `–${crimeCase.yearEnd}` : ""} · {crimeCase.location}
          </span>
          <CaseStatusBadge status={crimeCase.status} />
        </p>
        <h1 className="display mt-2 max-w-4xl text-[clamp(2.4rem,6vw,3.75rem)] text-[var(--ink)]">
          {crimeCase.name}
        </h1>
        {crimeCase.nameOriginal ? (
          <p className="mt-2 text-lg text-[var(--ink-soft)]">
            Original ({crimeCase.primarySourceLanguageLabel ?? "source language"}):{" "}
            <span lang={crimeCase.primarySourceLanguage}>{crimeCase.nameOriginal}</span>
          </p>
        ) : null}
        {crimeCase.primarySourceLanguage ? (
          <div className="dossier-callout mt-4 max-w-3xl p-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
              Translated dossier · {crimeCase.primarySourceLanguageLabel}
            </p>
            {crimeCase.translationNote ? (
              <p className="body-copy mt-2 text-sm text-[var(--ink-soft)]">
                {crimeCase.translationNote}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--muted)]">
              English text synthesized from non-English public sources. See References for
              original-language citations.
            </p>
          </div>
        ) : null}
        {crimeCase.aliases?.length ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Also known as: {crimeCase.aliases.join(" · ")}
          </p>
        ) : null}
        <p className="lede mt-4 max-w-3xl">{crimeCase.subtitle}</p>
        <div className="dossier-actions mt-5 flex flex-wrap gap-2">
          <Link href={monitorUrlFromFilters({}, crimeCase.slug)} className="btn btn-primary text-sm">
            View on map
          </Link>
          <Link href={searchUrlFromFilters(searchSimilar)} className="btn btn-ghost text-sm">
            Similar cases
          </Link>
          <Link href={`/live?country=${country}`} className="btn btn-ghost text-sm">
            Regional news
          </Link>
          <Link href="/archive" className="btn btn-ghost text-sm">
            Full archive
          </Link>
          <ShareLinkButton url={dossierUrl} label="Share dossier" />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {crimeCase.crimeCategories.map((c) => (
            <span key={c} className="tag">
              {CRIME_CATEGORY_LABELS[c]}
            </span>
          ))}
        </div>
        <div className="mt-6 max-w-3xl space-y-3">
          <ContentWarning text={crimeCase.warning} level={crimeCase.contentLevel} />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
          <span>Analysis: {analysis.status}</span>
          <span>
            Review: {analysis.reviewedByHuman ? "human-reviewed" : "awaiting review"}
          </span>
          <span>Updated {formatDate(analysis.updatedAt)}</span>
        </div>
      </header>

      <div className="dossier-sticky-stack">
        <Suspense fallback={null}>
          <CaseTabKeyboardNav />
          <CaseTabs slug={crimeCase.slug} />
        </Suspense>
        <DossierActionBar
          name={crimeCase.name}
          slug={crimeCase.slug}
          searchSimilar={searchSimilar}
          country={country}
        />
      </div>

      <div className="dossier-body site-shell py-8">
        {tab === "story" && narrative ? (
          <CaseNarrativeView
            narrative={narrative}
            isDraft={crimeCase.analysis.status !== "published"}
          />
        ) : null}

        {tab === "story" && !narrative ? (
          <p className="text-[var(--muted)]">
            Full narrative pending for this record. See Overview and Timeline tabs.
          </p>
        ) : null}

        {tab === "overview" ? (
          <div className="grid gap-6 md:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-6">
              <section className="card p-6 md:p-8">
                <h2 className="display text-2xl">Overview</h2>
                <p className="body-copy mt-3 text-[var(--ink-soft)] md:text-lg">
                  {crimeCase.overview}
                </p>
              </section>
              <section className="card p-6 md:p-8">
                <h2 className="display text-2xl">Legal outcome</h2>
                <p className="body-copy mt-3 text-[var(--ink-soft)]">
                  {crimeCase.legalOutcome.summary}
                </p>
                <dl className="mt-4 grid gap-3 text-sm">
                  {crimeCase.legalOutcome.trial ? (
                    <div>
                      <dt className="font-semibold text-[var(--ink)]">Trial</dt>
                      <dd className="text-[var(--ink-soft)]">
                        {crimeCase.legalOutcome.trial}
                      </dd>
                    </div>
                  ) : null}
                  {crimeCase.legalOutcome.sentencing ? (
                    <div>
                      <dt className="font-semibold text-[var(--ink)]">Sentencing</dt>
                      <dd className="text-[var(--ink-soft)]">
                        {crimeCase.legalOutcome.sentencing}
                      </dd>
                    </div>
                  ) : null}
                  {crimeCase.legalOutcome.appeals ? (
                    <div>
                      <dt className="font-semibold text-[var(--ink)]">Appeals</dt>
                      <dd className="text-[var(--ink-soft)]">
                        {crimeCase.legalOutcome.appeals}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </section>
              <section className="card p-6 md:p-8">
                <h2 className="display text-2xl">Behavioral profile</h2>
                <dl className="mt-4 space-y-3 text-sm md:text-base">
                  <div>
                    <dt className="font-semibold">Modus operandi</dt>
                    <dd className="text-[var(--ink-soft)]">
                      {crimeCase.behavioralProfile.modusOperandi}
                    </dd>
                  </div>
                  {crimeCase.behavioralProfile.signature ? (
                    <div>
                      <dt className="font-semibold">Signature</dt>
                      <dd className="text-[var(--ink-soft)]">
                        {crimeCase.behavioralProfile.signature}
                      </dd>
                    </div>
                  ) : null}
                  {crimeCase.behavioralProfile.escalation ? (
                    <div>
                      <dt className="font-semibold">Escalation</dt>
                      <dd className="text-[var(--ink-soft)]">
                        {crimeCase.behavioralProfile.escalation}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="font-semibold">Organization level</dt>
                    <dd className="text-[var(--ink-soft)] capitalize">
                      {crimeCase.behavioralProfile.organizationLevel}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
            <aside className="space-y-4">
              <div className="card p-5">
                <h3 className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                  Offender(s)
                </h3>
                <ul className="mt-3 space-y-3">
                  {crimeCase.offenders.map((o) => (
                    <li key={o.id}>
                      <p className="font-semibold text-[var(--ink)]">{o.name}</p>
                      <p className="text-sm text-[var(--ink-soft)]">
                        {o.known ? "Known" : "Unknown"}
                        {o.sex ? ` · ${o.sex}` : ""}
                        {o.ageAtOffense ? ` · age ${o.ageAtOffense}` : ""}
                      </p>
                      {o.background ? (
                        <p className="mt-1 text-sm text-[var(--muted)]">{o.background}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-5">
                <h3 className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                  Victim(s)
                </h3>
                <ul className="mt-3 space-y-3">
                  {crimeCase.victims.length ? (
                    crimeCase.victims.map((v) => (
                      <li key={v.id}>
                        <p className="font-semibold text-[var(--ink)]">{v.name}</p>
                        {v.demographicsNote ? (
                          <p className="text-sm text-[var(--muted)]">{v.demographicsNote}</p>
                        ) : null}
                        {v.relationshipToOffender ? (
                          <p className="text-sm text-[var(--ink-soft)]">
                            Relationship context: {v.relationshipToOffender}
                          </p>
                        ) : null}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-[var(--muted)]">Not recorded in stub.</li>
                  )}
                </ul>
              </div>
              <div className="card p-5">
                <h3 className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                  Motivations (hypotheses)
                </h3>
                <ul className="mt-3 space-y-2">
                  {crimeCase.motivationalFactors.map((m) => (
                    <li key={m.label}>
                      <p className="font-medium text-[var(--ink)]">{m.label}</p>
                      <p className="text-sm text-[var(--ink-soft)]">{m.detail}</p>
                    </li>
                  ))}
                  {!crimeCase.motivationalFactors.length ? (
                    <li className="text-sm text-[var(--muted)]">Pending</li>
                  ) : null}
                </ul>
              </div>
              <RelatedCases crimeCase={crimeCase} allCases={allCases} compact />
            </aside>
          </div>
        ) : null}

        {tab === "timeline" ? (
          <div>
            <h2 className="display text-3xl">Behavioral timeline</h2>
            <div className="mt-5">
              <Timeline events={crimeCase.timeline} />
            </div>
          </div>
        ) : null}

        {tab === "analysis" ? (
          <div className="space-y-6">
            <section className="card p-6 md:p-8">
              <h2 className="display text-2xl">Analysis summary</h2>
              <p className="body-copy mt-3 text-[var(--ink-soft)] md:text-lg">
                {analysis.summary}
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                    Psychological factors
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {crimeCase.psychologicalFactors.map((f) => (
                      <li
                        key={f}
                        className="rounded border border-[var(--line)] px-2 py-1 text-sm"
                      >
                        {FACTOR_LABELS[f]}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                    Theoretical frameworks
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {crimeCase.theoreticalFrameworks.map((f) => (
                      <li
                        key={f}
                        className="rounded border border-[var(--line)] px-2 py-1 text-sm"
                      >
                        <Link
                          href={theoryHref(f)}
                          className="hover:text-[var(--accent)]"
                        >
                          {FRAMEWORK_LABELS[f]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                  Diagnosis notes
                </h3>
                <ul className="mt-3 space-y-3">
                  {crimeCase.diagnoses.map((d) => (
                    <li key={d.label} className="border-l-2 border-[var(--line)] pl-3">
                      <p className="font-medium">
                        {d.label}{" "}
                        <span className="text-xs font-normal text-[var(--muted)]">
                          ({d.status})
                        </span>
                      </p>
                      <p className="text-sm text-[var(--ink-soft)]">{d.note}</p>
                    </li>
                  ))}
                  {!crimeCase.diagnoses.length ? (
                    <li className="text-sm text-[var(--muted)]">None recorded.</li>
                  ) : null}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="display text-3xl">Psychological map</h2>
              <p className="body-copy mt-2 text-[var(--ink-soft)]">
                Constructs are hypotheses grounded in public behavior—not diagnoses.
              </p>
              <div className="mt-5">
                <PsychMap constructs={analysis.constructs} />
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="card p-6">
                <h2 className="display text-2xl">Alternative explanations</h2>
                <ul className="mt-4 space-y-2">
                  {analysis.alternativeExplanations.map((a) => (
                    <li key={a} className="body-copy text-[var(--ink-soft)]">
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-6">
                <h2 className="display text-2xl">What we cannot know</h2>
                <ul className="mt-4 space-y-2">
                  {analysis.whatWeCannotKnow.map((a) => (
                    <li key={a} className="body-copy text-[var(--muted)]">
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="display text-3xl">Expert & student commentary</h2>
              {(analysis.expertCommentary ?? []).length ? (
                (analysis.expertCommentary ?? []).map((c) => (
                  <article key={c.id} className="card p-6">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
                      {c.role} {c.reviewed ? "· reviewed" : "· pending review"}
                    </p>
                    <h3 className="display mt-2 text-xl">{c.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {c.author} · {formatDate(c.publishedAt)}
                    </p>
                    <p className="body-copy mt-3 text-[var(--ink-soft)]">{c.body}</p>
                  </article>
                ))
              ) : (
                <p className="text-[var(--muted)]">
                  No commentary yet.{" "}
                  <Link href="/contribute" className="text-[var(--accent)] hover:underline">
                    Submit an analysis
                  </Link>
                  .
                </p>
              )}
            </section>
          </div>
        ) : null}

        {tab === "documents" ? (
          <div>
            <h2 className="display text-3xl">Document library</h2>
            <p className="body-copy mt-2 max-w-2xl text-[var(--ink-soft)]">
              Public-domain or link-out sources only. Motive Index does not host
              copyrighted full text without permission.
            </p>
            <ul className="mt-5 grid gap-3">
              {docs.map((d) => (
                <li key={d.id} className="card p-5">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[var(--accent)] uppercase">
                    {d.type.replaceAll("_", " ")}
                  </p>
                  <h3 className="display mt-1 text-xl">{d.title}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{d.summary}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Psych relevance: {d.psychRelevance}
                  </p>
                  <p className="mt-2 text-sm text-[var(--maroon)]">{d.contentWarning}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Source: {d.source}
                    {d.publicDomain ? " · public domain" : " · link / citation only"}
                    {d.hosted ? " · hosted" : " · not hosted locally"}
                  </p>
                  {d.url ? (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
                    >
                      Open source
                    </a>
                  ) : null}
                </li>
              ))}
              {!docs.length ? (
                <li className="text-[var(--muted)]">No documents linked yet.</li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {tab === "references" ? (
          <div className="space-y-6">
            <section className="card p-6">
              <h2 className="display text-2xl">References & citations</h2>
              <ul className="mt-4 space-y-3">
                {crimeCase.references.map((r) => (
                  <li key={r.id} className="body-copy text-[var(--ink-soft)]">
                    <span className="mr-2 text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                      {r.kind}
                    </span>
                    {r.languageLabel ? (
                      <span className="mr-2 rounded bg-[var(--surface)] px-1.5 py-0.5 text-xs text-[var(--accent)]">
                        {r.languageLabel}
                      </span>
                    ) : null}
                    {r.url ? (
                      <a href={r.url} className="hover:text-[var(--accent)] hover:underline">
                        {r.citation}
                      </a>
                    ) : (
                      r.citation
                    )}
                    {r.originalCitation ? (
                      <p
                        className="mt-1 text-sm text-[var(--muted)]"
                        lang={r.language}
                      >
                        Original: {r.originalCitation}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
            <section className="card p-6">
              <h2 className="display text-2xl">Source index</h2>
              <ul className="mt-4 space-y-2">
                {crimeCase.sources.map((s) => (
                  <li key={s.title} className="text-[var(--ink-soft)]">
                    <span className="mr-2 text-xs uppercase text-[var(--muted)]">
                      {s.kind}
                    </span>
                    {s.languageLabel ? (
                      <span className="mr-2 rounded bg-[var(--surface)] px-1.5 py-0.5 text-xs text-[var(--accent)]">
                        {s.languageLabel}
                      </span>
                    ) : null}
                    {s.url ? (
                      <a href={s.url} className="hover:text-[var(--accent)] hover:underline">
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                    {s.originalTitle ? (
                      <p className="mt-1 text-sm text-[var(--muted)]" lang={s.language}>
                        Original: {s.originalTitle}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
            <DistressResources />
            <Disclaimer />
          </div>
        ) : null}

        {tab !== "overview" ? (
          <RelatedCases crimeCase={crimeCase} allCases={allCases} />
        ) : null}
      </div>
    </article>
  );
}
