import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { DossierAiProvenance } from "@/components/AiProvenanceBadge";
import { CaseImagePanel } from "@/components/CaseImagePanel";
import { CaseImageGallery } from "@/components/CaseImageGallery";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseTabs } from "@/components/CaseTabs";
import { CaseTabKeyboardNav } from "@/components/CaseTabKeyboardNav";
import { CaseNarrativeView, NARRATIVE_CHAPTER_ORDER } from "@/components/CaseNarrative";
import { ContentWarning, DistressResources } from "@/components/ContentWarning";
import { Disclaimer } from "@/components/Disclaimer";
import { DossierActionBar } from "@/components/DossierActionBar";
import { DossierNeighborNav } from "@/components/DossierNeighborNav";
import { ForensicAnalysisView } from "@/components/PsychMap";
import { Timeline } from "@/components/Timeline";
import { RelatedCases } from "@/components/RelatedCases";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { CaseStatusBadge } from "@/components/ui";
import { reviewStatusLabel } from "@/lib/aiProvenance";
import { getActiveTab, CASE_TABS, dossierShareUrl } from "@/lib/case-tabs";
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
import { monitorUrlFromFilters, searchUrlFromFilters, getAdjacentCases } from "@/lib/search";
import { getSiteUrl } from "@/lib/seo";
import { getPrimaryCaseImage } from "@/lib/caseImages";
import type { SearchFilters } from "@/lib/types";
import { getPrimaryDirectReferences } from "@/lib/validation/referenceAccuracy";
import { ReferenceQualityBadge } from "@/components/ReferenceQualityBadge";
import {
  isEncyclopedicImportCase,
  isModerationDraftCase,
  shouldIndexCase,
} from "@/lib/casePublishState";

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
  return getAllCases()
    .filter((c) => c.featured)
    .slice(0, 24)
    .map((c) => ({ id: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = getCaseByIdOrSlug(id);
  if (!c) return { title: "Case not found" };
  const url = `${getSiteUrl()}/cases/${c.slug}`;
  const primaryImage = getPrimaryCaseImage(c.slug);
  const indexable = shouldIndexCase(c);
  return {
    title: c.name,
    description: c.subtitle,
    alternates: { canonical: url },
    robots: indexable ? undefined : { index: false, follow: false },
    openGraph: {
      type: "article",
      title: c.name,
      description: c.subtitle,
      url,
      ...(primaryImage
        ? { images: [{ url: primaryImage.url, alt: primaryImage.alt }] }
        : {}),
    },
    twitter: {
      card: primaryImage ? "summary_large_image" : "summary",
      title: c.name,
      description: c.subtitle,
      ...(primaryImage ? { images: [primaryImage.url] } : {}),
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
    psychologicalFactor: crimeCase.psychologicalFactors[0] ?? "",
    theoreticalFramework: crimeCase.theoreticalFrameworks[0] ?? "",
    status: crimeCase.status === "unsolved" ? "unsolved" : "",
  };

  const docs = getDocumentsForCase(crimeCase.slug);
  const { analysis } = crimeCase;
  const allCases = getAllCases();
  const { prev: prevCase, next: nextCase } = getAdjacentCases(crimeCase.slug, allCases);
  const dossierUrl = dossierShareUrl(crimeCase.slug, tab, {
    hasNarrative: Boolean(narrative),
    siteOrigin: getSiteUrl(),
  });
  const primaryImage = crimeCase.images?.[0];
  const storyChapterIds = narrative
    ? NARRATIVE_CHAPTER_ORDER.filter((id) => narrative.chapters.some((c) => c.id === id))
    : [];

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
    <article className="dossier-page w-full min-w-0 max-w-full overflow-x-clip pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="dossier-header site-shell py-6 md:py-12">
        <Breadcrumbs
          items={[
            { label: "Monitor", href: "/" },
            { label: "Archive", href: "/archive" },
            { label: crimeCase.name, href: `/cases/${crimeCase.slug}` },
            { label: tabLabel },
          ]}
        />
        <div className="dossier-header-grid mt-5">
          <div className="dossier-header-main">
        <p className="label flex flex-wrap items-center gap-2">
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
          <Link
            href={searchUrlFromFilters(searchSimilar)}
            className="btn btn-ghost dossier-action-secondary text-sm"
          >
            Similar cases
          </Link>
          <Link
            href={`/live?country=${country}`}
            className="btn btn-ghost dossier-action-secondary text-sm"
          >
            Regional news
          </Link>
          <Link href="/archive" className="btn btn-ghost dossier-action-secondary text-sm">
            Full archive
          </Link>
          <ShareLinkButton url={dossierUrl} label="Share dossier" />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {crimeCase.crimeCategories.map((c) => (
            <Link key={c} href={`/archive?crimeCategory=${c}`} className="tag tag-link">
              {CRIME_CATEGORY_LABELS[c]}
            </Link>
          ))}
          {crimeCase.status === "unsolved" ? (
            <Link href="/archive?status=unsolved" className="tag tag-link">
              Unsolved
            </Link>
          ) : null}
        </div>
        <div className="mt-6 max-w-3xl space-y-3">
          <ContentWarning text={crimeCase.warning} level={crimeCase.contentLevel} />
          {isModerationDraftCase(crimeCase) ? (
            <div className="card border-[var(--maroon)]/30 bg-[color-mix(in_srgb,var(--maroon)_6%,var(--paper))] p-4">
              <p className="text-xs font-semibold tracking-[0.12em] text-[var(--maroon)] uppercase">
                Draft — not published
              </p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                This dossier is awaiting integrity gate review. Do not cite
                behavioral claims until an editor approves publication.
              </p>
            </div>
          ) : null}
          {isEncyclopedicImportCase(crimeCase) ? (
            <div className="card p-4">
              <p className="text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                Wikipedia-sourced catalog entry
              </p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Entity identity is linked to a Wikipedia article. Forensic analysis is algorithmic and
                not human-reviewed — verify facts against court records and primary sources before
                citation.
              </p>
            </div>
          ) : null}
        </div>
        <div className="mt-4 space-y-3">
          <DossierAiProvenance crimeCase={crimeCase} />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
            <span>Analysis: {analysis.status}</span>
            <span>Review: {reviewStatusLabel(crimeCase)}</span>
            <span>Updated {formatDate(analysis.updatedAt)}</span>
          </div>
        </div>
          </div>
          {primaryImage ? (
            <div className="dossier-header-media">
              <CaseImagePanel image={primaryImage} variant="hero" priority />
            </div>
          ) : null}
        </div>
      </header>

      <div className="dossier-sticky-stack">
        <Suspense fallback={null}>
          <CaseTabKeyboardNav
            hasNarrative={Boolean(narrative)}
            prevCase={prevCase ? { slug: prevCase.slug, name: prevCase.name } : undefined}
            nextCase={nextCase ? { slug: nextCase.slug, name: nextCase.name } : undefined}
            storyChapterIds={storyChapterIds}
          />
          <CaseTabs slug={crimeCase.slug} defaultTab={tab} hasNarrative={Boolean(narrative)} />
        </Suspense>
        <DossierActionBar
          name={crimeCase.name}
          slug={crimeCase.slug}
          searchSimilar={searchSimilar}
          country={country}
          hasNarrative={Boolean(narrative)}
          siteOrigin={getSiteUrl()}
          prevCase={prevCase ? { slug: prevCase.slug, name: prevCase.name } : undefined}
          nextCase={nextCase ? { slug: nextCase.slug, name: nextCase.name } : undefined}
        />
      </div>

      <div className="dossier-body site-shell w-full min-w-0 max-w-full py-8">
        {tab === "story" && narrative ? (
          <CaseNarrativeView
            narrative={narrative}
            isDraft={crimeCase.analysis.status !== "published"}
            caseTags={crimeCase.tags}
          />
        ) : null}

        {tab === "story" && !narrative ? (
          <p className="text-[var(--muted)]">
            Full narrative pending for this record. See Overview and Timeline tabs.
          </p>
        ) : null}

        {tab === "overview" ? (
          <div className="dossier-overview-grid grid gap-6 md:grid-cols-[1.25fr_0.75fr]">
            <div className="dossier-overview-main space-y-6">
              <section className="card p-6 md:p-8">
                <h2 className="display text-2xl">Overview</h2>
                <p className="body-copy prose-safe mt-3 text-[var(--ink-soft)] md:text-lg">
                  {crimeCase.overview}
                </p>
              </section>
              {crimeCase.images && crimeCase.images.length > 1 ? (
                <CaseImageGallery images={crimeCase.images} />
              ) : null}
              <section className="card p-6 md:p-8">
                <h2 className="display text-2xl">Legal outcome</h2>
                <p className="body-copy prose-safe mt-3 text-[var(--ink-soft)]">
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
                <dl className="prose-safe mt-4 space-y-3 text-sm md:text-base">
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
            <aside className="dossier-overview-aside space-y-4">
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
              <p className="body-copy prose-safe mt-3 text-[var(--ink-soft)] md:text-lg">
                {analysis.summary}
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                    Psychological factors
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {crimeCase.psychologicalFactors.map((f) => (
                      <li key={f}>
                        <Link
                          href={searchUrlFromFilters({ psychologicalFactor: f })}
                          className="rounded border border-[var(--line)] px-2 py-1 text-sm hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          {FACTOR_LABELS[f]}
                        </Link>
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

            <ForensicAnalysisView analysis={analysis} />

            <section className="grid gap-4 md:grid-cols-2">
              <div className="card p-6">
                <h2 className="display text-2xl">Alternative explanations</h2>
                <ul className="mt-4 space-y-2">
                  {analysis.alternativeExplanations.map((a) => (
                    <li key={a} className="body-copy prose-safe text-[var(--ink-soft)]">
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-6">
                <h2 className="display text-2xl">What we cannot know</h2>
                <ul className="mt-4 space-y-2">
                  {analysis.whatWeCannotKnow.map((a) => (
                    <li key={a} className="body-copy prose-safe text-[var(--muted)]">
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
                    <p className="body-copy prose-safe mt-3 text-[var(--ink-soft)]">{c.body}</p>
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
            <p className="body-copy prose-safe mt-2 max-w-2xl text-[var(--ink-soft)]">
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
            {(() => {
              const primaryLink = getPrimaryDirectReferences(crimeCase.references)[0];
              return primaryLink?.url ? (
                <section className="card p-6">
                  <h2 className="display text-xl">Primary source</h2>
                  <p className="body-copy mt-2 text-sm text-[var(--ink-soft)]">
                    Jump directly to the main public record for this case.
                  </p>
                  <a
                    href={primaryLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Open primary source
                    <span aria-hidden>↗</span>
                  </a>
                  <p className="mt-3 text-sm text-[var(--muted)]">{primaryLink.citation}</p>
                </section>
              ) : null;
            })()}
            <section className="card p-6">
              <h2 className="display text-2xl">References & citations</h2>
              <p className="body-copy prose-safe mt-2 max-w-3xl text-sm text-[var(--ink-soft)]">
                Primary sources for verifying behavioral claims in this dossier. Notes explain
                forensic relevance — not endorsement of every interpretive claim.
              </p>
              <ul className="mt-5 space-y-4">
                {crimeCase.references.map((r) => (
                  <li key={r.id} className="reference-item border-b border-[var(--line)] pb-4 last:border-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ReferenceQualityBadge reference={r} />
                      <span className="text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                        {r.kind}
                      </span>
                      {r.year ? (
                        <span className="text-xs text-[var(--muted)]">{r.year}</span>
                      ) : null}
                      {r.languageLabel ? (
                        <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-xs text-[var(--accent)]">
                          {r.languageLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="body-copy prose-safe mt-2 text-[var(--ink-soft)]">
                      {r.url ? (
                        <a href={r.url} className="hover:text-[var(--accent)] hover:underline">
                          {r.citation}
                        </a>
                      ) : (
                        r.citation
                      )}
                    </p>
                    {r.note ? (
                      <p className="mt-2 text-sm text-[var(--muted)]">{r.note}</p>
                    ) : null}
                    {r.originalCitation ? (
                      <p className="mt-2 text-sm text-[var(--muted)]" lang={r.language}>
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

        <DossierNeighborNav
          prev={prevCase ? { slug: prevCase.slug, name: prevCase.name } : undefined}
          next={nextCase ? { slug: nextCase.slug, name: nextCase.name } : undefined}
          tab={tab}
        />
      </div>
    </article>
  );
}
