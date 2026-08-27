import type { CaseNarrative } from "@/lib/types";
import { getDeepNarrative } from "@/data/deepContent";

export const caseNarratives: Record<string, CaseNarrative> = {
  "ted-bundy": {
    hook:
      "He looked like the man parents hoped their daughter would bring home—law student, crisis-line volunteer, Republican campaign worker—while crossing state lines to hunt strangers in the dark.",
    chapters: [
      {
        id: "origins",
        title: "A boy who learned to perform",
        period: "1946–1960s",
        lead: "Theodore Robert Bundy was born in Vermont to an unwed mother and raised by grandparents who initially presented themselves as his parents.",
        paragraphs: [
          "Public biographies describe a childhood marked by secrecy about his parentage. When Bundy later learned that his 'sister' was actually his mother, contemporaries and researchers have debated how deeply that revelation shaped his identity—but the through-line in accounts is a young man intensely concerned with status, acceptance, and image.",
          "Peers recalled charm, ambition, and a hunger to belong to respectable circles. He dated, studied, and moved through middle-class institutions without the early criminal record that often precedes violent careers. What stands out forensically is not a visible 'monster' origin story but a long apprenticeship in social presentation.",
        ],
        psychNote:
          "Early relational ambiguity may have fed identity confusion hypotheses, but many offenders with stable childhoods exist—treat origins as context, not causation.",
      },
      {
        id: "formation",
        title: "College, romance, and the first disappearances",
        period: "Late 1960s–1973",
        lead: "At the University of Washington he excelled academically, fell in love, and appeared headed for law school or politics.",
        paragraphs: [
          "Bundy's romantic relationship with Stephanie Brooks (a pseudonym used in many accounts) ended painfully; some biographers link the breakup to a shift in mood and entitlement. Whether that single event 'caused' later violence is oversimplified, but it coincides with a period when he dropped out, traveled, and—according to later investigations—may have begun experimenting with voyeurism and nighttime prowling.",
          "Women began vanishing from college towns in the Pacific Northwest. At first the pattern was diffuse: attractive young women, often near campuses, last seen walking alone or accepting help from a friendly stranger. Bundy was not yet on investigators' radar; he blended into volunteer search parties and professional settings.",
        ],
        psychNote:
          "Formation phase shows grooming of opportunity skills—deception, mobility, reading social trust—before escalation to lethal violence.",
      },
      {
        id: "escalation",
        title: "The killing years",
        period: "1974–1978",
        paragraphs: [
          "Investigators eventually tied Bundy to a multi-state series. His approach often involved feigned injury (a cast or crutches), impersonation of authority, or direct charm in public spaces. Victims were selected for accessibility and vulnerability, not random chaos.",
          "Offenses spanned Washington, Oregon, Utah, Colorado, and Florida. He stole cars, changed appearance, and exploited jurisdictional gaps in 1970s policing. After arrests he escaped custody twice—once from a courthouse library and once through a ceiling panel—demonstrating planning under extreme stress.",
          "Florida trials in the late 1970s brought national attention. Bundy sometimes acted as his own attorney, turning proceedings into performance. Media coverage amplified the paradox: an articulate defendant accused of horrific crimes.",
        ],
        psychNote:
          "Escalation shows organized, instrumental predation with adaptive learning—not impulsive 'snap' violence.",
      },
      {
        id: "method",
        title: "How the crimes were committed",
        period: "Behavioral pattern",
        lead: "Bundy did not rely on brute chaos; he engineered situations where victims voluntarily entered his control.",
        paragraphs: [
          "Modus operandi centered on approach deception: fake injuries, requests for help loading items into a car, or impersonating police. Once proximity was gained, sudden violence and transport to secondary locations followed. Public records emphasize control of the approach context rather than break-in randomness.",
          "Signature elements—behaviors not strictly necessary to complete the crime—included post-offense trophy-like retention of items and a recurring need to revisit sites, according to investigative summaries. Graphic specifics are omitted here; the forensic point is systematic staging.",
        ],
        psychNote:
          "Distinguish MO (practical method) from signature (psychological need). Bundy's signature cluster supports dominance and possession themes in scholarly literature.",
      },
      {
        id: "motivation",
        title: "What drove the violence",
        paragraphs: [
          "Bundy offered shifting accounts: pornography addiction, rage at women, even theatrical claims near execution. Forensic psychologists generally emphasize power, control, and sadistic sexual domination inferred from behavior—not from any single interview quote.",
          "Instrumental motives appear primary: victim selection, restraint, and post-offense concealment suggest goal-directed predation. Narcissistic injury (rejection, status loss) may have lowered inhibition but does not fully explain a multi-year series.",
          "He rarely showed sustained, victim-centered remorse in public proceedings; legal and image management dominated late-life statements.",
        ],
        psychNote:
          "Motivation hierarchies are inferred; 'psychopathy' labels in pop culture exceed what public records clinically establish.",
      },
      {
        id: "investigation",
        title: "Detection, escape, and capture",
        paragraphs: [
          "Initial investigations struggled with fragmented jurisdictions and limited databases. A traffic stop in Utah and forensic comparison of dental evidence in Florida proved pivotal in different eras of the case.",
          "Bundy's escapes humiliated institutions and renewed fear. He continued offending after escape until recapture in Florida. Television trials made him a cultural reference point for 'the killer who didn't look like one.'",
        ],
      },
      {
        id: "aftermath",
        title: "Trials, execution, and legacy",
        period: "1979–1989",
        paragraphs: [
          "Convicted and sentenced to death in Florida, Bundy was executed in 1989. True-crime publishing exploded around his story, sometimes glamorizing charm while minimizing victims.",
          "For researchers the durable lesson is methodological: organized offenders can occupy high-trust social roles; investigative bias toward 'stranger monsters' delays recognition of familiar presentations.",
        ],
        psychNote:
          "Media 'charisma' narratives can distort student understanding—anchor analysis in court records and victim impact, not film portrayals.",
      },
    ],
  },

  "dennis-rader-btk": {
    hook:
      "For thirty-one years Wichita's BTK killer mailed poetry about murder to newspapers while raising children, serving on church council, and inspecting compliance for the city.",
    chapters: [
      {
        id: "origins",
        title: "Ordinary beginnings, private fantasies",
        period: "1945–1970s",
        lead: "Dennis Lynn Rader grew up in Kansas with a reportedly strict household and early interests in voyeurism and control fantasies described later in his own writings.",
        paragraphs: [
          "Biographical accounts portray a man who appeared unremarkable in adolescence—no early homicide—but who later described intrusive bondage and dominance fantasies in journals and communications. Military service and college followed conventional pathways.",
          "He married, had children, and settled into suburban routines. Outwardly he was the neighbor who mowed lawns and attended church; inwardly he cultivated a self-mythology he would eventually name BTK—Bind, Torture, Kill.",
        ],
        psychNote:
          "Private fantasy life is largely inaccessible; we infer from decades-later admissions and letter content, not childhood diagnosis.",
      },
      {
        id: "formation",
        title: "First murders and the birth of BTK",
        period: "1974",
        paragraphs: [
          "The Otero family murders in January 1974 announced a new terror in Wichita. Rader later admitted binding and killing multiple family members in their home—a control-focused intrusion into domestic space.",
          "He sent letters to police and media almost immediately, claiming credit and demanding recognition. The BTK persona was not an afterthought; it was part of the psychological payoff from the beginning.",
        ],
      },
      {
        id: "escalation",
        title: "Decades between kills",
        period: "1974–1991",
        paragraphs: [
          "Additional victims followed across years with long dormant stretches. Rader held jobs, joined the church, and became a Cub Scout leader—roles that placed him near families while he hid a violent secret life.",
          "Between murders he continued writing: poems, diagrams, and packages describing fantasies. Dormancy suggests capacity for inhibition when risk rose, undermining simplistic ' unstoppable urge' stereotypes.",
        ],
        psychNote:
          "Compartmentalization allowed high-functioning civic identity alongside covert offending—a core teaching case for double-life offenders.",
      },
      {
        id: "method",
        title: "Home intrusion and ritual control",
        lead: "Rader selected households, surveilled routines, and entered when he believed he could dominate victims completely.",
        paragraphs: [
          "His modus operandi emphasized binding, isolation, and psychological terror before death. Communications often referenced religious or moral language ironically layered atop violence.",
          "Self-branding appeared in ligatures, signatures, and later computer disks. The offender treated investigation as an audience.",
        ],
      },
      {
        id: "motivation",
        title: "Power, recognition, and the compulsion to write",
        paragraphs: [
          "Rader's own allocution and letters stress dominance, sexual control, and fame. Unlike purely instrumental robbers, he invested enormous energy in being known as BTK.",
          "That need for authorship eventually conflicted with concealment—a tension common in communication-driven offenders.",
        ],
        psychNote:
          "Narcissistic supply from taunting letters can override risk calculation; treat resumed contact as behavioral data.",
      },
      {
        id: "investigation",
        title: "Silence, return, and a floppy disk",
        period: "2004–2005",
        paragraphs: [
          "After years of quiet, Rader resurfaced with messages mocking investigators. He asked whether communications could be traced on floppy disks; when told they likely could not, he sent one—metadata led detectives to a church computer and his identity.",
          "Arrest in 2005 shocked Wichita: BTK was the compliance officer, the church man, the father.",
        ],
        psychNote:
          "Operational security failed because recognition motive exceeded fear—a textbook conflict between ego and survival.",
      },
      {
        id: "aftermath",
        title: "Guilty plea and life sentences",
        paragraphs: [
          "Rader pleaded guilty and described crimes in chillingly flat detail during allocution. He received multiple life sentences without parole.",
          "The case reshaped public understanding of 'the monster next door' and is widely taught in profiling courses alongside Bundy and Shipman.",
        ],
      },
    ],
  },

  "ted-kaczynski": {
    hook:
      "A mathematics prodigy who published papers in his twenties became a hermit in Montana, mailing bombs to airlines, academics, and computer stores to force the world to read his manifesto.",
    chapters: [
      {
        id: "origins",
        title: "Gifted child, brittle belonging",
        period: "1942–1960s",
        lead: "Theodore John Kaczynski skipped grades, entered Harvard young, and impressed professors with abstract ability—while reporting profound social alienation.",
        paragraphs: [
          "Some accounts describe harsh bullying and participation in stressful psychological research during his Harvard years; scholars debate how much those experiences contributed to later radicalization versus pre-existing temperament.",
          "He completed a PhD at Michigan and briefly taught at Berkeley, then abruptly resigned in 1969. Colleagues saw eccentricity; few predicted terrorism.",
        ],
        psychNote:
          "High IQ and social isolation correlate weakly with violence—avoid 'mad genius' stereotypes without evidence.",
      },
      {
        id: "formation",
        title: "The cabin and the turning point",
        period: "1971–1978",
        paragraphs: [
          "Kaczynski built a remote cabin near Lincoln, Montana, living without electricity or running water. He rejected industrial society not only rhetorically but physically.",
          "Family contact narrowed; brother David later described increasing anger in letters. The first attributed device exploded at Northwestern University in 1978, injuring a security guard—opening an eighteen-year campaign.",
        ],
      },
      {
        id: "escalation",
        title: "The Unabomber campaign",
        period: "1978–1995",
        paragraphs: [
          "Devices were mailed or placed targeting figures linked—sometimes loosely—to technology and modernity: computer stores, airline executives, academics. Fatalities and maimings accumulated as FBI task forces struggled with sparse forensic links.",
          "Kaczynski honed craftsmanship and anonymity. Investigative profiles initially misread ideological motives, focusing on workplace grudges.",
        ],
      },
      {
        id: "method",
        title: "Bombs as messages",
        lead: "Each device was engineered for harm, but the campaign's strategic center was publication of ideas.",
        paragraphs: [
          "Wood, metal, and later plastic housings concealed explosives designed to maim. Kaczynski avoided early capture through careful handling and misdirection.",
          "In 1995 he demanded newspapers publish his manifesto, Industrial Society and Its Future, threatening more attacks. The text argued industrial-technological society destroys human freedom.",
        ],
      },
      {
        id: "motivation",
        title: "Ideology, grievance, and identity fusion",
        paragraphs: [
          "Primary motive in public analysis is ideological: violence as propaganda for anti-civilization thesis. Personal humiliations may have amplified rage but did not replace the manifesto's coherent (if extreme) worldview.",
          "Debate persists whether clinical delusion or political extremism dominated—competency evaluations conflicted. Behavior shows long-range planning inconsistent with acute psychotic disorganization.",
        ],
        psychNote:
          "Teach three layers separately: belief content, clinical hypotheses, and instrumental terror strategy.",
      },
      {
        id: "investigation",
        title: "Manifesto recognition and arrest",
        period: "1996",
        paragraphs: [
          "David Kaczynski recognized writing style and themes, contacted authorities, and cooperated with investigation. FBI arrested Ted at the cabin; journals and bomb components were recovered.",
          "Legal strategy debated insanity defense; Ted pleaded guilty to avoid that framing, receiving life without parole.",
        ],
      },
      {
        id: "aftermath",
        title: "Imprisonment and cultural afterlife",
        paragraphs: [
          "Kaczynski died in federal prison in 2023. His manifesto remains assigned in courses on terrorism and technology ethics—often paired with warnings against romanticizing violence.",
          "Forensic psychology uses the case to study isolation, belief encapsulation, and family-based identification.",
        ],
      },
    ],
  },

  "aileen-wuornos": {
    hook:
      "Abandoned by her mother, abused in childhood, and living on Florida highways, Aileen Wuornos killed seven men in fourteen months—then told the world incompatible stories about why.",
    chapters: [
      {
        id: "origins",
        title: "Childhood of abandonment",
        period: "1956–1970s",
        lead: "Aileen Carol Pittman was born in Michigan and raised amid alcoholism, neglect, and alleged sexual abuse documented in court and biographical records.",
        paragraphs: [
          "Her mother left; her grandparents raised her in instability. Teen pregnancy, homelessness, and survival sex work followed. By adulthood she cycled through jail, relationships, and roadside economies few researchers enter without bias.",
          "None of this history excuses homicide—but it is essential context for understanding threat perception, mistrust, and desperation.",
        ],
        psychNote:
          "Trauma-informed formulation is not exculpation; it explains vulnerability factors and narrative instability under stress.",
      },
      {
        id: "formation",
        title: "Selby, highways, and the first killing",
        period: "1989",
        paragraphs: [
          "Wuornos met Tyria Moore; their relationship mixed affection, dependency, and mutual substance use. Wuornos worked Interstate 75, picking up men in bars and parking lots.",
          "Richard Mallory, a convicted rapist in some accounts, was the first documented victim in November 1989. Wuornos later claimed self-defense against sexual assault; prosecution argued robbery and premeditation.",
        ],
      },
      {
        id: "escalation",
        title: "A short, violent series",
        period: "1989–1990",
        paragraphs: [
          "Six more men died in similar contexts over the next year. Vehicles, weapons, and patterns linked cases. Wuornos spent money from victims' belongings; Moore eventually cooperated with police after arrest in 1991.",
          "Speed of the series suggests escalating script behavior—whether driven by fear, robbery, rage, or mixture remains contested.",
        ],
      },
      {
        id: "method",
        title: "Roadside encounters",
        paragraphs: [
          "Encounters began as transactional or social pickups. Wuornos shot victims with a .22 pistol, often leaving bodies along highways. Staging was minimal; concealment relied on mobility and victim anonymity.",
          "Unlike organized serial killers, crime scenes were not highly ritualized—but repetition of context (lone men, cars, isolation) forms a behavioral signature.",
        ],
      },
      {
        id: "motivation",
        title: "Self-defense, robbery, or predation?",
        paragraphs: [
          "Wuornos's statements shifted: self-defense, robbery to support Moore, hatred of men, even desire for fame. Prosecutors emphasized financial gain and pattern inconsistent with single-incident fear.",
          "Feminist and media framings polarized the case—icon of male violence victimization versus 'first female serial killer' spectacle. Forensic teaching holds multiple hypotheses simultaneously.",
        ],
        psychNote:
          "Unstable self-report lowers confidence in any single motive attribution—weight behavioral pattern over interview performance.",
      },
      {
        id: "investigation",
        title: "Arrest, trials, and media storm",
        paragraphs: [
          "Ballistics and Moore's cooperation tied Wuornos to victims. Trials were televised; Wuornos's courtroom demeanor alienated some jurors. She was convicted on multiple counts and sentenced to death.",
        ],
      },
      {
        id: "aftermath",
        title: "Execution and contested legacy",
        period: "2002",
        paragraphs: [
          "Wuornos was executed by lethal injection in Florida in 2002. Documentaries and films amplified mythologies; victim families remain central to ethical retelling.",
          "Researchers use the case for lessons on gender bias in serial-killer labeling, trauma context, and unreliable narrators.",
        ],
      },
    ],
  },

  "zodiac-killer": {
    hook:
      "Northern California, 1968: a couple murdered at a lovers' lane—and soon a letter arrived at three newspapers demanding publication or more bodies would follow.",
    chapters: [
      {
        id: "origins",
        title: "Unknown subject",
        period: "Persona only",
        lead: "No offender was convicted as the Zodiac; this chapter addresses the public behavioral persona constructed in letters and attributed crimes.",
        paragraphs: [
          "Investigators linked several murders and an attempted murder to a single unknown subject. Suspects have been proposed for decades; DNA and handwriting analysis remain inconclusive or disputed in public reporting.",
          "Forensic psychology therefore analyzes communication strategy and claimed behavior—not a diagnosed individual.",
        ],
      },
      {
        id: "formation",
        title: "Lake Herman Road and the first letters",
        period: "1968–1969",
        paragraphs: [
          "The December 1968 shooting of Betty Lou Jensen and David Faraday began the attributed series. In July 1969 Darlene Ferrin was killed and Michael Mageau wounded at Blue Rock Springs.",
          "In August 1969 three Bay Area papers received nearly identical letters with details and a cipher chunk. The writer demanded front-page publication, signing with a crossed-circle symbol that became iconic.",
        ],
      },
      {
        id: "escalation",
        title: "Lake Berryessa and Presidio Heights",
        period: "1969",
        paragraphs: [
          "September 1969: Bryan Hartnell and Cecelia Shepard attacked at Lake Berryessa; the killer wore a hood with the Zodiac symbol and claimed credit on their car door.",
          "Two weeks later taxi driver Paul Stine was shot in San Francisco. A partial license plate sighting and conflicting sketches fueled decades of amateur sleuthing.",
        ],
      },
      {
        id: "method",
        title: "Mixed MO, heavy signature",
        paragraphs: [
          "Attacks varied: shooting couples in parked cars, stabbing at a lake, shooting a cab driver. Modus operandi was not rigid—suggesting opportunistic adaptation.",
          "Signature elements clustered in letters, ciphers, costume at Berryessa, and threats to school buses. Violence served a theater of public fear.",
        ],
        psychNote:
          "Communication-heavy offenders may prioritize audience impact over consistent crime-scene ritual.",
      },
      {
        id: "motivation",
        title: "Terror as communication",
        paragraphs: [
          "Letters mocked police, demanded recognition, and claimed victim counts. Motives inferred: dominance over institutions, intellectual superiority via ciphers, and sustained notoriety.",
          "Some passages express misogynistic and apocalyptic themes; others read as performance for media amplification.",
        ],
      },
      {
        id: "investigation",
        title: "Ciphers, hoaxes, and dead ends",
        period: "1969–present",
        paragraphs: [
          "Amateur and expert cryptographers cracked portions of ciphers; full messages revealed grandiose fantasies, not identities. Hoax letters complicated the corpus.",
          "The case remains officially open in some jurisdictions; periodic DNA tests on stamps and envelopes renew hope and controversy.",
        ],
      },
      {
        id: "aftermath",
        title: "Cultural myth and cold case science",
        paragraphs: [
          "Zodiac became America's template for the taunting unknown killer— influencing films, books, and true-crime culture. Investigative lessons include database integration and handwriting corpus authentication.",
          "Students should study victim identities and investigative errors, not only puzzle-solving romance.",
        ],
      },
    ],
  },

  "charles-manson": {
    hook:
      "A petty criminal who could not read music convinced followers he would spark a race war—and sent them to kill for a prophecy named Helter Skelter.",
    chapters: [
      {
        id: "origins",
        title: "Institutions and early crime",
        period: "1934–1960s",
        lead: "Charles Milles Manson was born to a teenage mother and spent much of youth in reform schools and prisons for theft, pimping, and fraud.",
        paragraphs: [
          "Parole files describe manipulation, charm, and instability. He learned to read people in carceral environments—a skill he later weaponized in 1960s counterculture California.",
          "Released in 1967 amid hippie communes and drug markets, he positioned himself as guru to lost young people seeking belonging.",
        ],
      },
      {
        id: "formation",
        title: "The Family forms",
        period: "1967–1968",
        paragraphs: [
          "Manson collected followers—mostly young women—at Spahn Ranch and later Barker Ranch. He used LSD, sex, scripture remixing, and isolation to fuse identity to his worldview.",
          "Musical ambitions connected him to Los Angeles industry fringes; rejection narratives later appear in motive theories.",
        ],
        psychNote:
          "Group influence often exceeds individual pathology—analyze social processes, not only leader traits.",
      },
      {
        id: "escalation",
        title: "From petty crime to murder",
        period: "1969",
        paragraphs: [
          "July 1969: Gary Hinman killed by Family members. August 9–10: Sharon Tate and guests murdered at Cielo Drive; Leno and Rosemary LaBianca murdered the next night.",
          "Crimes were brutal and staged with messages; Manson was not present at all scenes but directed and participated in planning according to trial evidence.",
        ],
      },
      {
        id: "method",
        title: "Delegated violence",
        lead: "Manson rarely needed to kill with his own hands—followers enacted violence to please him and fulfill prophecy.",
        paragraphs: [
          "Modus operandi involved multiple attackers, overkill, and graffiti-like messaging. Weapons included knives and firearms; victims were strangers and acquaintances alike.",
          "The method spread panic across Hollywood and Los Angeles elite circles.",
        ],
      },
      {
        id: "motivation",
        title: "Helter Skelter and control",
        paragraphs: [
          "Prosecutor Vincent Bugliosi argued Manson believed Beatles lyrics predicted racial apocalypse he would lead from desert hiding. Followers would survive and inherit.",
          "Alternative frames emphasize drug debts, copycat revenge for prior arrests, or pure dominance. Group belief and leader charisma intertwined.",
        ],
        psychNote:
          "Apocalyptic ideology can authorize moral disengagement—followers see violence as cosmic necessity.",
      },
      {
        id: "investigation",
        title: "Arrest and theatrical trial",
        paragraphs: [
          "Family arrested initially on unrelated charges; forensic links and member statements built murder case. Trial featured carved Xs on foreheads, outbursts, and Manson's courtroom performance.",
        ],
      },
      {
        id: "aftermath",
        title: "Life sentences and cult-studies legacy",
        paragraphs: [
          "Manson and followers received death sentences commuted to life when California law changed. He died in prison in 2017.",
          "The case anchors curricula on charismatic control, moral disengagement, and media spectacle.",
        ],
      },
    ],
  },

  "harold-shipman": {
    hook:
      "Britain's trusted GP visited elderly patients in their homes—and used that trust to administer lethal doses of morphine for reasons still debated by inquiry.",
    chapters: [
      {
        id: "origins",
        title: "Medical calling, early warning signs",
        period: "1946–1970s",
        lead: "Harold Frederick Shipman qualified as a doctor after his mother died of cancer during his youth—a loss he cited when explaining interest in medicine.",
        paragraphs: [
          "He became a GP in Hyde, Greater Manchester, known for thoroughness and sometimes brusque manner. Colleagues later recalled oddities around death certificates and morphine records that were not acted upon.",
          "Early fraud convictions involving pethidine addiction were known to regulators but did not end his career—a systemic theme as important as individual psychology.",
        ],
        psychNote:
          "Professional trust roles create opportunity structures independent of 'evil genius' narratives.",
      },
      {
        id: "formation",
        title: "Practice and pattern",
        period: "1970s–1990s",
        paragraphs: [
          "Shipman ran a solo practice with high elderly patient load. He visited homes, signed deaths without suspicion, and controlled medical documentation.",
          "Inquiry later estimated he may have killed over 200 patients; fifteen murders were proven at trial. Pattern: elderly victims, afternoon visits, morphine injection, forged wills in some cases.",
        ],
      },
      {
        id: "escalation",
        title: "Scale hidden in routine care",
        paragraphs: [
          "Death rates around his practice exceeded statistical norms for years before detection. Medical culture deferred to doctors; families often accepted sudden death in frail patients.",
          "Forged will benefiting Shipman on Kathleen Grundy's estate triggered forensic review—daughter's persistence broke the pattern.",
        ],
      },
      {
        id: "method",
        title: "The doctor's bag",
        lead: "Lethality arrived as care—injections administered by the one person families trusted most.",
        paragraphs: [
          "Shipman injected diamorphine (medical heroin) causing respiratory arrest. He then completed death certificates attributing natural causes—heart attack, stroke.",
          "No struggle; victims often died seated or in bed. Crime scenes looked like compassionate end-of-life events.",
        ],
      },
      {
        id: "motivation",
        title: "God complex, grief, or thrill?",
        paragraphs: [
          "Inquiry and experts speculated: god-like power over life and death, re-enactment of mother's death, financial gain from wills, or addiction to killing itself. Shipman denied motives and never cooperated.",
          "Empirical certainty is low; behavioral data emphasize control, deception, and sustained calm performance.",
        ],
        psychNote:
          "Healthcare serial murder often lacks sexual motive—power and medical authority dominate hypotheses.",
      },
      {
        id: "investigation",
        title: "Grundy exhumation and arrest",
        period: "1998–1999",
        paragraphs: [
          "Exhumation found morphine; Shipman arrested. Audit of records revealed suspicious clustering. Media called him Dr Death—a label inquiries cautioned against sensationalizing.",
          "Trial convicted on fifteen counts; he received life without parole.",
        ],
      },
      {
        id: "aftermath",
        title: "Shipman Inquiry and system reform",
        paragraphs: [
          "Public inquiries recommended coroner reform, controlled drugs monitoring, and GP oversight. Shipman hanged himself in prison in 2004.",
          "Case is taught worldwide for detection failure in trusted professions—not only individual pathology.",
        ],
      },
    ],
  },

  "contemporary-draft-example": {
    hook: "Draft placeholder — narrative pending human verification and source review.",
    chapters: [
      {
        id: "origins",
        title: "Pending research",
        paragraphs: [
          "This stub demonstrates the live-ingest pipeline. Verified cases receive full documentary chapters after moderation.",
        ],
      },
    ],
  },
};

export function getCaseNarrative(slug: string): CaseNarrative | undefined {
  return caseNarratives[slug] ?? getDeepNarrative(slug);
}
