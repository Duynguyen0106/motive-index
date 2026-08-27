import type { ForensicAnalysis, LiveUpdate, TimelineEvent, BehaviorSignal, SourceRef, CaseStatus } from "@/lib/types";
import { worldSeedCases } from "@/data/worldCases";

/** Seed rows before catalog enrichment supplies research metadata. */
export type SeedCase = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  jurisdiction: string;
  era: string;
  status: CaseStatus;
  tags: string[];
  warning: string;
  overview: string;
  timeline: TimelineEvent[];
  signals: BehaviorSignal[];
  sources: SourceRef[];
  analysis: ForensicAnalysis;
  featured?: boolean;
};

export const cases: SeedCase[] = [
  {
    id: "case-bundy",
    slug: "ted-bundy",
    name: "Ted Bundy",
    subtitle: "Charm, compartmentalization, and instrumental predation",
    jurisdiction: "United States (multi-state)",
    era: "1970s",
    status: "closed",
    tags: ["organized", "instrumental", "impression management"],
    warning: "Public-record behavioral analysis. Minimal graphic detail.",
    overview:
      "Theodore Robert Bundy exploited trust across multiple states in the 1970s—posing as injured, authoritative, or romantically available while abducting and murdering young women. His case defines organized, instrumental predation paired with exceptional impression management: law school, politics, and even search-party participation while victims remained missing.",
    featured: true,
    timeline: [
      {
        id: "tb-0",
        date: "1946",
        label: "Birth and hidden parentage",
        detail:
          "Born in Vermont; raised by grandparents who initially presented as parents. Later learned his 'sister' was his mother.",
        behavioralNote: "Identity and secrecy themes in biographical accounts—not deterministic causation.",
      },
      {
        id: "tb-0b",
        date: "1960s",
        label: "College and broken engagement",
        detail:
          "University of Washington student; painful breakup with Stephanie Brooks coincides with dropout and drift in some accounts.",
        behavioralNote: "Narcissistic injury hypotheses appear in literature; evidence is correlational.",
      },
      {
        id: "tb-1",
        date: "1974–1978",
        label: "Escalating multi-state pattern",
        detail:
          "Confirmed and attributed abductions and murders across Washington, Utah, Colorado, and other states; deceptive approaches in parking lots and campuses.",
        behavioralNote: "Suggests rehearsal, mobility, and adaptive targeting.",
      },
      {
        id: "tb-2",
        date: "1977–1978",
        label: "Custody escapes",
        detail:
          "Escaped custody twice and continued offending before final capture.",
        behavioralNote: "Persistence under threat; planning under constraint.",
      },
      {
        id: "tb-3",
        date: "1979–1989",
        label: "Trials and media self-presentation",
        detail:
          "Acted as own counsel at times; cultivated courtroom and media image.",
        behavioralNote: "Impression management as a sustained behavioral strategy.",
      },
    ],
    signals: [
      {
        id: "tb-s1",
        dimension: "planning",
        observation:
          "Cross-jurisdiction offending and deceptive approach methods indicate premeditation rather than purely impulsive acts.",
        sourceIds: ["tb-src-1"],
      },
      {
        id: "tb-s2",
        dimension: "social_functioning",
        observation:
          "Capacity to present as trustworthy and socially competent in public roles.",
        sourceIds: ["tb-src-2"],
      },
      {
        id: "tb-s3",
        dimension: "empathy_remorse",
        observation:
          "Public statements and conduct often prioritized self-image and legal strategy over victim-centered remorse.",
        sourceIds: ["tb-src-1"],
      },
      {
        id: "tb-s4",
        dimension: "pattern_consistency",
        observation:
          "Behavioral themes (deception, control of approach context) recur across the documented series.",
        sourceIds: ["tb-src-1"],
      },
    ],
    sources: [
      {
        title: "Public trial records and contemporaneous reporting (summary)",
        kind: "court",
      },
      {
        title: "FBI behavioral analysis literature on organized offenders",
        kind: "academic",
      },
    ],
    analysis: {
      status: "published",
      summary:
        "Public evidence supports an organized, instrumental pattern: planning, mobility, and high impression-management skill. Clinical labels remain hypotheses; the durable finding is behavioral—systematic deception used to create opportunity.",
      constructs: [
        {
          id: "tb-c1",
          label: "Organized instrumental pattern",
          dimension: "planning",
          hypothesis:
            "Offending appears goal-directed and adaptive across settings rather than primarily disorganized or acutely psychotic.",
          evidence: [
            "Multi-state mobility and approach staging",
            "Custody escapes requiring planning",
          ],
          counterEvidence: [
            "Some events may include opportunistic elements under stress",
          ],
          confidence: 0.86,
          clinicalCaveat:
            "Organization describes offense behavior, not a DSM diagnosis.",
        },
        {
          id: "tb-c2",
          label: "Impression management / superficial charm",
          dimension: "social_functioning",
          hypothesis:
            "Social presentation was used strategically to reduce suspicion and gain access.",
          evidence: [
            "Documented ability to appear conventional and credible",
            "Courtroom self-advocacy as image control",
          ],
          counterEvidence: [
            "Charm in public records can be amplified by media narrative",
          ],
          confidence: 0.8,
        },
        {
          id: "tb-c3",
          label: "Low victim-centered remorse signals",
          dimension: "empathy_remorse",
          hypothesis:
            "Available public conduct emphasizes self-preservation and performance over restorative remorse.",
          evidence: [
            "Focus on legal theater and self-narrative in late proceedings",
          ],
          counterEvidence: [
            "Private remorse cannot be ruled out from public sources alone",
          ],
          confidence: 0.72,
          clinicalCaveat:
            "Absence of public remorse ≠ clinical confirmation of psychopathy.",
        },
      ],
      alternativeExplanations: [
        "Media mythology may exaggerate consistency of 'charm' as a trait",
        "Substance use or acute stress could modulate specific incidents",
        "Group and investigative biases can shape retrospective profiles",
      ],
      whatWeCannotKnow: [
        "Private internal experience and childhood causation from public records alone",
        "Exact motive hierarchy for each offense",
        "Undocumented offenses or aborted attempts",
      ],
      modelVersion: "rubric-v1-seed",
      reviewedByHuman: true,
      updatedAt: "2026-08-01T12:00:00.000Z",
    },
  },
  {
    id: "case-rader",
    slug: "dennis-rader-btk",
    name: "Dennis Rader (BTK)",
    subtitle: "Double life, ritualized control, and communication compulsion",
    jurisdiction: "Kansas, United States",
    era: "1974–2005",
    status: "closed",
    tags: ["organized", "power-control", "double life"],
    warning: "Public-record analysis. Communications discussed without graphic detail.",
    overview:
      "Dennis Rader murdered ten people in Kansas between 1974 and 1991 while maintaining a public life as husband, father, church leader, and city compliance officer. He branded himself BTK in taunting letters and resurfaced in 2004—leading to capture when metadata on a floppy disk traced back to him.",
    featured: true,
    timeline: [
      {
        id: "dr-1",
        date: "1974–1991",
        label: "Offense series with long gaps",
        detail:
          "Documented murders occurred over years with extended dormant periods.",
        behavioralNote: "Capacity for long-term concealment and self-regulation between acts.",
      },
      {
        id: "dr-2",
        date: "1970s–2000s",
        label: "Communications to media/police",
        detail:
          "Letters and packages asserted identity, demanded recognition, and controlled narrative.",
        behavioralNote: "Attention and dominance via information control.",
      },
      {
        id: "dr-3",
        date: "2005",
        label: "Digital trace leads to arrest",
        detail:
          "Metadata from a communication contributed to identification while he held civic roles.",
        behavioralNote: "Compulsion to communicate overrode operational security.",
      },
    ],
    signals: [
      {
        id: "dr-s1",
        dimension: "control",
        observation:
          "Offense and communication patterns emphasize domination, staging, and naming power (self-branding as BTK).",
        sourceIds: ["dr-src-1"],
      },
      {
        id: "dr-s2",
        dimension: "social_functioning",
        observation:
          "Held community roles (church, compliance officer) while concealing offending—strong compartmentalization.",
        sourceIds: ["dr-src-2"],
      },
      {
        id: "dr-s3",
        dimension: "pattern_consistency",
        observation:
          "Recurrent need to document and announce identity across decades.",
        sourceIds: ["dr-src-1"],
      },
    ],
    sources: [
      { title: "Court proceedings and plea records (public)", kind: "court" },
      { title: "Contemporaneous Wichita reporting on BTK communications", kind: "news" },
    ],
    analysis: {
      status: "published",
      summary:
        "Behavior points to a power-control pattern with exceptional compartmentalization. The communications are psychologically central: recognition and narrative control appear as persistent drives that eventually enabled capture.",
      constructs: [
        {
          id: "dr-c1",
          label: "Power / control motivation",
          dimension: "control",
          hypothesis:
            "Acts and letters function to assert dominance and authorship over fear and investigation.",
          evidence: [
            "Self-naming and taunting communications",
            "Emphasis on binding/control themes in public case narrative",
          ],
          counterEvidence: [
            "Some communications may also serve practical misdirection",
          ],
          confidence: 0.84,
        },
        {
          id: "dr-c2",
          label: "Compartmentalized double life",
          dimension: "social_functioning",
          hypothesis:
            "Conventional social roles were sustained alongside covert offending, implying high secrecy skill and identity splitting at the behavioral level.",
          evidence: [
            "Community roles concurrent with series",
            "Long concealment span",
          ],
          counterEvidence: [
            "Workplace and family associates may have missed subtle cues retrospectively amplified",
          ],
          confidence: 0.88,
        },
        {
          id: "dr-c3",
          label: "Communication compulsion vs. security",
          dimension: "pattern_consistency",
          hypothesis:
            "Need for recognition competed with—and ultimately defeated—concealment goals.",
          evidence: [
            "Resumed contact after long silence",
            "Traceable digital communication",
          ],
          counterEvidence: [
            "Investigator pressure and media climate also shaped timing",
          ],
          confidence: 0.81,
        },
      ],
      alternativeExplanations: [
        "Sexual paraphilic drivers may co-occur with power motives (not mutually exclusive)",
        "Ego investment in 'BTK' persona may be partly media co-construction",
      ],
      whatWeCannotKnow: [
        "Full private fantasy life from public documents alone",
        "Precise triggers for dormant intervals",
      ],
      modelVersion: "rubric-v1-seed",
      reviewedByHuman: true,
      updatedAt: "2026-08-01T12:00:00.000Z",
    },
  },
  {
    id: "case-kaczynski",
    slug: "ted-kaczynski",
    name: "Ted Kaczynski",
    subtitle: "Ideology, isolation, and instrumental violence",
    jurisdiction: "United States",
    era: "1978–1996",
    status: "closed",
    tags: ["ideological", "isolated", "manifesto-driven"],
    warning: "Focuses on ideology and lifestyle pattern, not bomb-making detail.",
    overview:
      "Ted Kaczynski's eighteen-year bombing campaign targeted universities, airlines, and technology figures while he lived in a Montana cabin writing an anti-industrial manifesto. Family recognition of his prose after publication led to arrest—one of the most studied cases of ideology fused with instrumental terror.",
    featured: true,
    timeline: [
      {
        id: "tk-1",
        date: "1971+",
        label: "Withdrawal to remote cabin life",
        detail:
          "Chose extreme isolation and subsistence living after academic exit.",
        behavioralNote: "Voluntary social disconnection as identity project.",
      },
      {
        id: "tk-2",
        date: "1978–1995",
        label: "Campaign of mailed and placed devices",
        detail:
          "Targets linked to his technological critique; long duration.",
        behavioralNote: "Violence subordinated to ideological communication goals.",
      },
      {
        id: "tk-3",
        date: "1995–1996",
        label: "Manifesto publication and identification",
        detail:
          "Publication led to recognition by family and arrest.",
        behavioralNote: "Need to publish ideas created investigative exposure.",
      },
    ],
    signals: [
      {
        id: "tk-s1",
        dimension: "reality_testing",
        observation:
          "Coherent long-form ideological writing; debate continues on where radical belief ends and clinical delusion begins.",
        sourceIds: ["tk-src-1"],
      },
      {
        id: "tk-s2",
        dimension: "planning",
        observation:
          "Multi-year campaign with target selection tied to thesis suggests high instrumental planning.",
        sourceIds: ["tk-src-2"],
      },
      {
        id: "tk-s3",
        dimension: "social_functioning",
        observation:
          "Extreme isolation and rejection of conventional affiliation.",
        sourceIds: ["tk-src-1"],
      },
    ],
    sources: [
      { title: "Industrial Society and Its Future (public manifesto text)", kind: "primary" },
      { title: "Federal case reporting and plea history", kind: "court" },
    ],
    analysis: {
      status: "published",
      summary:
        "The dominant public pattern is ideological instrumental violence paired with profound isolation. Psychological inference should separate (a) radical political belief, (b) possible clinical disorder hypotheses, and (c) strategic communication via terror—without collapsing them into one label.",
      constructs: [
        {
          id: "tk-c1",
          label: "Ideological instrumental pattern",
          dimension: "planning",
          hypothesis:
            "Violence functioned as enforcement and publicity for a written worldview.",
          evidence: [
            "Manifesto-linked justification",
            "Long campaign duration with thematic targets",
          ],
          counterEvidence: [
            "Personal grievance may also animate target choice",
          ],
          confidence: 0.87,
        },
        {
          id: "tk-c2",
          label: "Voluntary extreme isolation",
          dimension: "social_functioning",
          hypothesis:
            "Withdrawal reinforced belief encapsulation and reduced corrective social feedback.",
          evidence: [
            "Cabin subsistence lifestyle",
            "Minimal affiliative ties in later decades",
          ],
          counterEvidence: [
            "Isolation can be consequence as well as cause of radicalization",
          ],
          confidence: 0.85,
        },
        {
          id: "tk-c3",
          label: "Competing clinical vs. political frames",
          dimension: "reality_testing",
          hypothesis:
            "Public debate includes schizophrenia-spectrum hypotheses versus primarily political extremism; evidence is mixed and contested.",
          evidence: [
            "Highly organized writing and planning",
            "Family identification based on prose style",
          ],
          counterEvidence: [
            "Some evaluators historically argued major mental illness",
          ],
          confidence: 0.55,
          clinicalCaveat:
            "Do not treat contested historical evaluations as settled diagnosis.",
        },
      ],
      alternativeExplanations: [
        "Trauma or perceived humiliation narratives as amplifiers",
        "Identity fusion with manifesto as primary reinforcer",
      ],
      whatWeCannotKnow: [
        "Definitive clinical diagnosis from open sources",
        "Private decision process for each device",
      ],
      modelVersion: "rubric-v1-seed",
      reviewedByHuman: true,
      updatedAt: "2026-08-01T12:00:00.000Z",
    },
  },
  {
    id: "case-wuornos",
    slug: "aileen-wuornos",
    name: "Aileen Wuornos",
    subtitle: "Trauma history, survival context, and contested motive frames",
    jurisdiction: "Florida, United States",
    era: "1989–1990",
    status: "closed",
    tags: ["contested motive", "trauma context", "highway series"],
    warning:
      "Includes discussion of alleged self-defense claims vs. prosecution narrative. No graphic detail.",
    overview:
      "Wuornos was convicted of murdering men along Florida highways. She alternately framed killings as self-defense and later made conflicting statements. The case is used here to practice holding competing motive hypotheses and trauma-informed context without excusing harm.",
    featured: false,
    timeline: [
      {
        id: "aw-1",
        date: "Pre-1989",
        label: "Documented instability and marginalization",
        detail:
          "Public biographies describe severe early adversity, housing instability, and survival sex work.",
        behavioralNote: "High cumulative stress and mistrust as developmental context.",
      },
      {
        id: "aw-2",
        date: "1989–1990",
        label: "Series of roadside killings",
        detail:
          "Multiple victims; weapon use; later arrest after investigation.",
        behavioralNote: "Pattern requires explanation beyond a single encounter.",
      },
      {
        id: "aw-3",
        date: "1992+",
        label: "Shifting public accounts",
        detail:
          "Statements oscillated between self-defense and other admissions.",
        behavioralNote: "Narrative instability complicates motive inference.",
      },
    ],
    signals: [
      {
        id: "aw-s1",
        dimension: "stressors",
        observation:
          "Long-term marginalization and alleged prior victimization appear in biographical sources.",
        sourceIds: ["aw-src-1"],
      },
      {
        id: "aw-s2",
        dimension: "empathy_remorse",
        observation:
          "Public affect and statements varied widely across interviews and proceedings.",
        sourceIds: ["aw-src-2"],
      },
      {
        id: "aw-s3",
        dimension: "pattern_consistency",
        observation:
          "Multiple similar roadside encounters ending in fatal violence suggest a repeated script, whatever the motive mix.",
        sourceIds: ["aw-src-2"],
      },
    ],
    sources: [
      { title: "Florida trial coverage and appellate summaries", kind: "court" },
      { title: "Biographical reporting on early life adversity", kind: "biography" },
    ],
    analysis: {
      status: "published",
      summary:
        "This dossier prioritizes competing frames: instrumental robbery, trauma-driven hypervigilant violence, and mixed motives. Confidence stays moderate because self-report was unstable and media narratives were polarizing.",
      constructs: [
        {
          id: "aw-c1",
          label: "Contested self-defense vs. predation",
          dimension: "planning",
          hypothesis:
            "Some incidents may involve perceived threat; the series pattern also fits instrumental or preemptive aggression hypotheses.",
          evidence: [
            "Defendant self-defense claims",
            "Multiple similar victim contexts",
          ],
          counterEvidence: [
            "Prosecution argued robbery and intent inconsistent with pure defense",
          ],
          confidence: 0.5,
        },
        {
          id: "aw-c2",
          label: "Trauma-amplified threat perception",
          dimension: "stressors",
          hypothesis:
            "Severe adversity may have heightened readiness to interpret encounters as dangerous—context, not exculpation.",
          evidence: [
            "Documented early adversity in public biographies",
            "Survival work in high-risk settings",
          ],
          counterEvidence: [
            "Many people with trauma never offend; trauma ≠ destiny",
          ],
          confidence: 0.68,
          clinicalCaveat:
            "Trauma history is correlational context, not a clinical verdict in this product.",
        },
      ],
      alternativeExplanations: [
        "Substance influence on specific incidents",
        "Partner dynamics influencing statements and behavior",
        "Media incentives to cast her as either monster or victim archetype",
      ],
      whatWeCannotKnow: [
        "Subjective threat level in each encounter",
        "Stable personality diagnosis from public conflicted testimony",
      ],
      modelVersion: "rubric-v1-seed",
      reviewedByHuman: true,
      updatedAt: "2026-08-01T12:00:00.000Z",
    },
  },
  {
    id: "case-zodiac",
    slug: "zodiac-killer",
    name: "Zodiac Killer",
    subtitle: "Unidentified offender, cipher communication, fear as theater",
    jurisdiction: "Northern California, United States",
    era: "1960s–1970s",
    status: "unsolved",
    tags: ["unidentified", "communications", "terror theater"],
    warning:
      "Unsolved case. Analysis is of the public offender persona and communications, not a named person.",
    overview:
      "An unidentified offender linked to murders and a stream of letters/ciphers. Without a confirmed subject, forensic psychology here analyzes the communication strategy and behavioral claims—not a personality diagnosis of a known individual.",
    featured: true,
    timeline: [
      {
        id: "zk-1",
        date: "1968–1969",
        label: "Confirmed and suspected attacks",
        detail:
          "Cluster of attacks in Northern California attributed to the same offender by investigators.",
        behavioralNote: "Public pattern includes couple victims and outdoor settings.",
      },
      {
        id: "zk-2",
        date: "1969+",
        label: "Letters and ciphers to press",
        detail:
          "Demanded publication; mixed solved/unsolved ciphers; taunting tone.",
        behavioralNote: "Media manipulation as extension of offending.",
      },
    ],
    signals: [
      {
        id: "zk-s1",
        dimension: "control",
        observation:
          "Letters attempt to control police/press behavior through threats and puzzles.",
        sourceIds: ["zk-src-1"],
      },
      {
        id: "zk-s2",
        dimension: "planning",
        observation:
          "Cipher construction and multi-incident attribution suggest investment beyond impulsive violence alone.",
        sourceIds: ["zk-src-1"],
      },
      {
        id: "zk-s3",
        dimension: "affect",
        observation:
          "Tone in letters often gleeful/taunting regarding fear caused.",
        sourceIds: ["zk-src-2"],
      },
    ],
    sources: [
      { title: "Archived Zodiac letters (public newspaper archives)", kind: "primary" },
      { title: "Investigative summaries from period reporting", kind: "news" },
    ],
    analysis: {
      status: "published",
      summary:
        "With no confirmed identity, analysis stays at the level of the communicative offender persona: control through terror, puzzle-based narcissistic supply, and possible mixture of instrumental and expressive motives. Any named-suspect psych profile is out of scope here.",
      constructs: [
        {
          id: "zk-c1",
          label: "Terror-as-communication",
          dimension: "control",
          hypothesis:
            "Letters indicate that public fear and investigative frustration were valued outcomes.",
          evidence: [
            "Demands for publication",
            "Taunting content regarding police",
          ],
          counterEvidence: [
            "Some letters could be copycats; attribution remains debated for parts of the series",
          ],
          confidence: 0.7,
        },
        {
          id: "zk-c2",
          label: "Cognitive investment / puzzle dominance",
          dimension: "planning",
          hypothesis:
            "Cipher work implies need for intellectual dominance and prolonged engagement with audience.",
          evidence: [
            "Multiple ciphers",
            "Sustained correspondence pattern",
          ],
          counterEvidence: [
            "Ciphers may also be practical identity-protection theater",
          ],
          confidence: 0.66,
        },
      ],
      alternativeExplanations: [
        "Multiple offenders or hoax letters mixed into corpus",
        "Expressive rage motives coexisting with publicity motives",
      ],
      whatWeCannotKnow: [
        "True identity and life history",
        "Which letters are authentic",
        "Clinical state of the offender(s)",
      ],
      modelVersion: "rubric-v1-seed",
      reviewedByHuman: true,
      updatedAt: "2026-08-01T12:00:00.000Z",
    },
  },
  {
    id: "case-manson",
    slug: "charles-manson",
    name: "Charles Manson",
    subtitle: "Charismatic control, shared delusion dynamics, and group crime",
    jurisdiction: "California, United States",
    era: "1969",
    status: "closed",
    tags: ["group influence", "charisma", "shared belief"],
    warning:
      "Focus on influence and group process. Graphic crime-scene detail omitted.",
    overview:
      "Manson influenced followers who committed murders. The forensic-psych interest is less 'lone predator profiling' and more charismatic authority, belief encapsulation, and diffusion of responsibility in a closed group.",
    featured: false,
    timeline: [
      {
        id: "cm-1",
        date: "1967–1969",
        label: "Formation of dependent follower circle",
        detail:
          "Communal living, isolation from outside ties, leader-centered interpretation of events.",
        behavioralNote: "Classic high-control group conditions.",
      },
      {
        id: "cm-2",
        date: "Aug 1969",
        label: "Murders carried out by followers",
        detail:
          "Killings executed by group members amid apocalyptic narrative framing.",
        behavioralNote: "Violence as enacted group belief under leader direction.",
      },
      {
        id: "cm-3",
        date: "1970–1971",
        label: "Trial as performance stage",
        detail:
          "Courtroom behavior by Manson and followers reinforced cultic identity.",
        behavioralNote: "Public performance sustaining in-group cohesion.",
      },
    ],
    signals: [
      {
        id: "cm-s1",
        dimension: "control",
        observation:
          "Leader monopolized meaning-making; followers sought approval through compliance.",
        sourceIds: ["cm-src-1"],
      },
      {
        id: "cm-s2",
        dimension: "reality_testing",
        observation:
          "Apocalyptic 'Helter Skelter' narrative organized group perception of race war and destiny.",
        sourceIds: ["cm-src-2"],
      },
      {
        id: "cm-s3",
        dimension: "social_functioning",
        observation:
          "Charisma and manipulation within a vulnerable youth population of the era.",
        sourceIds: ["cm-src-1"],
      },
    ],
    sources: [
      { title: "Trial records and prosecution narrative summaries", kind: "court" },
      { title: "Sociological literature on high-control groups", kind: "academic" },
    ],
    analysis: {
      status: "published",
      summary:
        "Best read as a group-influence case: belief isolation, leader idealization, and moral disengagement. Individual pathology hypotheses about Manson matter less for prevention lessons than how closed systems convert ideology into delegated violence.",
      constructs: [
        {
          id: "cm-c1",
          label: "Charismatic coercive control",
          dimension: "control",
          hypothesis:
            "Authority rested on emotional dependency and interpretive monopoly rather than formal hierarchy alone.",
          evidence: [
            "Follower obedience in high-risk acts",
            "Communal isolation patterns",
          ],
          counterEvidence: [
            "Some followers may have had independent motives (status, fear, belonging)",
          ],
          confidence: 0.82,
        },
        {
          id: "cm-c2",
          label: "Shared narrative encapsulation",
          dimension: "reality_testing",
          hypothesis:
            "Apocalyptic story reduced outside reality-testing and reframed murder as meaningful.",
          evidence: [
            "Documented Helter Skelter framing",
            "Trial-era group displays",
          ],
          counterEvidence: [
            "Not all associates equally endorsed the narrative",
          ],
          confidence: 0.78,
        },
      ],
      alternativeExplanations: [
        "Drug effects on follower judgment",
        "Leader criminal opportunism draped in mysticism",
      ],
      whatWeCannotKnow: [
        "Exact private beliefs of each participant",
        "Counterfactual: whether murders occur without specific cultural moment",
      ],
      modelVersion: "rubric-v1-seed",
      reviewedByHuman: true,
      updatedAt: "2026-08-01T12:00:00.000Z",
    },
  },
  {
    id: "case-shipman",
    slug: "harold-shipman",
    name: "Harold Shipman",
    subtitle: "Professional trust, concealed pattern, and undetected lethality",
    jurisdiction: "United Kingdom",
    era: "1970s–1998",
    status: "closed",
    tags: ["healthcare", "trust exploitation", "concealment"],
    warning:
      "Medical murder case discussed at pattern level only; no clinical how-to detail.",
    overview:
      "Shipman, a general practitioner, was convicted of murdering patients and suspected of many more. Psychologically, the case highlights exploitation of institutional trust, emotional flatness in professional guise, and how systems fail to detect low-visibility predation.",
    featured: false,
    timeline: [
      {
        id: "hs-1",
        date: "1970s–1990s",
        label: "Practice-based access to vulnerable patients",
        detail:
          "Repeated private encounters with elderly patients in trust settings.",
        behavioralNote: "Occupational role as continuous opportunity structure.",
      },
      {
        id: "hs-2",
        date: "1998",
        label: "Forged will triggers investigation",
        detail:
          "Crude forgery around a victim's estate led to scrutiny atypical of prior covert pattern.",
        behavioralNote: "Possible escalation in risk-taking or entitlement.",
      },
      {
        id: "hs-3",
        date: "2000",
        label: "Conviction on multiple counts",
        detail:
          "Convicted of 15 murders; inquiries suggested far larger series.",
        behavioralNote: "Scale implies long-term emotional disengagement from victims.",
      },
    ],
    signals: [
      {
        id: "hs-s1",
        dimension: "social_functioning",
        observation:
          "Maintained professional credibility for years while harming those in care.",
        sourceIds: ["hs-src-1"],
      },
      {
        id: "hs-s2",
        dimension: "empathy_remorse",
        observation:
          "Public accounts emphasize lack of candid remorse and continued denial patterns.",
        sourceIds: ["hs-src-2"],
      },
      {
        id: "hs-s3",
        dimension: "planning",
        observation:
          "Method blended into routine care visits—high ecological camouflage.",
        sourceIds: ["hs-src-1"],
      },
    ],
    sources: [
      { title: "Shipman Inquiry public reports", kind: "court" },
      { title: "UK press archives on investigation and trial", kind: "news" },
    ],
    analysis: {
      status: "published",
      summary:
        "A trust-predator pattern: lethality hidden inside caregiving routine. Psychological hypotheses include profound empathy deficit and possible need for control over life/death, but system failure (monitoring gaps) is equally central to the case lesson.",
      constructs: [
        {
          id: "hs-c1",
          label: "Trust-role camouflage",
          dimension: "planning",
          hypothesis:
            "Professional role supplied access, privacy, and presumed benevolence that delayed detection.",
          evidence: [
            "Killings embedded in home visits/care context",
            "Long duration before exposure",
          ],
          counterEvidence: [
            "Some colleagues later recalled uneasy impressions (hindsight bias risk)",
          ],
          confidence: 0.9,
        },
        {
          id: "hs-c2",
          label: "Empathy deficit hypothesis",
          dimension: "empathy_remorse",
          hypothesis:
            "Scale and concealment are difficult to reconcile with intact victim-centered empathy.",
          evidence: [
            "Extensive suspected series",
            "Limited remorse in public record",
          ],
          counterEvidence: [
            "Alternative: compartmentalized rationalizations without global empathy absence",
          ],
          confidence: 0.74,
          clinicalCaveat:
            "Empathy inferences from outcomes are indirect.",
        },
      ],
      alternativeExplanations: [
        "God-complex / omnipotence motives",
        "Practical motives around wills/control in subset of cases",
      ],
      whatWeCannotKnow: [
        "Exact count of victims",
        "Private motive phenomenology",
      ],
      modelVersion: "rubric-v1-seed",
      reviewedByHuman: true,
      updatedAt: "2026-08-01T12:00:00.000Z",
    },
  },
  ...worldSeedCases,
  {
    id: "case-ripley-draft",
    slug: "contemporary-draft-example",
    name: "Contemporary draft stub",
    subtitle: "Example live-ingest case awaiting human review",
    jurisdiction: "Example jurisdiction",
    era: "2026",
    status: "closed",
    tags: ["draft", "live-ingest"],
    warning: "Synthetic example used to demonstrate the live pipeline UI—not a real case file.",
    overview:
      "This stub shows how a newly ingested matter appears before full forensic analysis is approved. In production, headlines arrive from public sources, entities are extracted, and analysis remains draft until review.",
    featured: false,
    timeline: [
      {
        id: "cd-1",
        date: "2026-08-26",
        label: "Ingested from public news cluster",
        detail:
          "Multiple outlets report the same arrest; dedupe merged them into one stub.",
        behavioralNote: "Insufficient primary documents for construct scoring.",
      },
    ],
    signals: [],
    sources: [
      { title: "Example wire story (placeholder)", kind: "news" },
    ],
    analysis: {
      status: "pending",
      summary:
        "Analysis pending. The rubric will not publish construct scores until evidence excerpts and human review are present.",
      constructs: [],
      alternativeExplanations: [],
      whatWeCannotKnow: [
        "Almost everything—awaiting reliable primary sourcing",
      ],
      modelVersion: "rubric-v1",
      reviewedByHuman: false,
      updatedAt: "2026-08-26T18:00:00.000Z",
    },
  },
];

export const updates: LiveUpdate[] = [
  {
    id: "upd-1",
    createdAt: "2026-08-27T08:30:00.000Z",
    headline: "New draft stub ingested from public news cluster",
    summary:
      "Deduped three outlet stories into contemporary-draft-example. Analysis queued.",
    caseSlug: "contemporary-draft-example",
    kind: "new_case",
    status: "published",
  },
  {
    id: "upd-2",
    createdAt: "2026-08-26T16:10:00.000Z",
    headline: "Zodiac dossier sources expanded",
    summary:
      "Added newspaper archive references for letter tone analysis.",
    caseSlug: "zodiac-killer",
    kind: "source_added",
    status: "published",
  },
  {
    id: "upd-3",
    createdAt: "2026-08-25T11:00:00.000Z",
    headline: "Shipman analysis revised — trust-camouflage confidence raised",
    summary:
      "Human review strengthened planning construct after Inquiry report cross-check.",
    caseSlug: "harold-shipman",
    kind: "revision",
    status: "published",
  },
  {
    id: "upd-4",
    createdAt: "2026-08-24T09:45:00.000Z",
    headline: "BTK communication-compulsion construct published",
    summary:
      "Pattern-consistency score finalized after letter chronology pass.",
    caseSlug: "dennis-rader-btk",
    kind: "analysis_ready",
    status: "published",
  },
  {
    id: "upd-5",
    createdAt: "2026-08-22T14:20:00.000Z",
    headline: "Method page: competing explanations now required",
    summary:
      "Rubric v1 enforces alternative explanations and cannot-know sections on every publish.",
    kind: "revision",
    status: "published",
  },
];
