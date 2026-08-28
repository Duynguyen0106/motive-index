/**
 * Hand-authored narrative depth for high-notoriety catalog cases.
 * Merged with generated context in deepContentBuilder — overrides prepend to chapters.
 */
import type { TimelineEvent } from "@/lib/types";

export type DepthOverride = {
  origins?: string[];
  formation?: string[];
  escalation?: string[];
  method?: string[];
  motivation?: string[];
  investigation?: string[];
  aftermath?: string[];
  timeline?: TimelineEvent[];
  offenderBackground?: string;
  victimNote?: string;
};

export const CASE_DEPTH_OVERRIDES: Record<string, DepthOverride> = {
  "john-wayne-gacy": {
    offenderBackground:
      "Gacy presented as a suburban contractor and Democratic precinct captain in Chicago's Norwood Park Township. He entertained children as 'Pogo the Clown' while allegations of workplace harassment circulated years before homicide charges.",
    escalation: [
      "Between 1972 and 1978, Gacy murdered at least 33 young men and boys in the Chicago area. Many victims were lured through job offers or coercion into his home; bodies were buried in crawl spaces beneath the house.",
      "A surviving victim's testimony after a brutal assault in December 1978 led police to search the property. The scale of remains shocked investigators and became a national media event.",
    ],
    method: [
      "MO centered on luring victims with employment or restraint under pretext, followed by asphyxiation. Control of the private residence was essential to concealment.",
      "Signature elements in literature include psychological domination and trophy-like retention of belongings — distinct from the practical need to silence witnesses.",
    ],
    investigation: [
      "Des Plaines police linked Gacy to the disappearance of Robert Piest after pharmacy witnesses placed the youth at Gacy's contracting office. A warrant search revealed the crawl-space graves.",
      "The investigation exposed prior complaints ignored by other jurisdictions — a recurring theme when offenders maintain respectable public roles.",
    ],
  },
  "jeffrey-dahmer": {
    offenderBackground:
      "Dahmer was dismissed from the Army, worked in a chocolate factory, and lived in Milwaukee apartments where neighbors reported sounds and odors. He had prior convictions for drugging and assaulting a minor in Wisconsin.",
    escalation: [
      "From 1978 (first Ohio homicide) through 1991, Dahmer killed 17 males, predominantly young men of color. Milwaukee incidents involved drugging, captivity, and dismemberment.",
      "Police returned a fleeing, drugged victim to Dahmer's apartment in May 1991 after neighbor complaints — a documented institutional failure that allowed further killings.",
    ],
    investigation: [
      "Tracy Edwards escaped in July 1991 and flagged down Milwaukee police with handcuffs on one wrist. Polaroid evidence in the apartment ended the series.",
      "The case prompted national debate on homophobia in policing and the devaluation of marginalized victims.",
    ],
  },
  "richard-ramirez": {
    escalation: [
      "The 'Night Stalker' series (1984–1985) included home invasions across Los Angeles and San Francisco: shootings, stabbings, and sexual assaults with satanic graffiti at some scenes.",
      "Public panic peaked with open-window modus operandi; survivors provided descriptions that eventually converged on Ramirez.",
    ],
    investigation: [
      "Ramirez was identified via fingerprint match from a stolen vehicle. Citizens chased and subdued him in East Los Angeles in August 1985 before police arrival.",
    ],
  },
  "edmund-kemper": {
    offenderBackground:
      "Kemper killed his grandparents at 15, was committed to Atascadero State Hospital, then released to live with his mother in Santa Cruz. He later worked with the highway patrol and befriended officers while killing co-eds.",
    escalation: [
      "After the 1964 double homicide, Kemper matured into a 6'9\" man who picked up hitchhiking students, murdered them, and engaged in necrophilia and dismemberment.",
      "He murdered his mother and her friend in 1973 before calling police and confessing in detail — interviews later used in FBI profiling training.",
    ],
  },
  "golden-state-killer": {
    escalation: [
      "DeAngelo progressed from burglaries and voyeurism to rapes across Northern California (1976–1979), then homicides in Southern California as the 'Original Night Stalker.'",
      "He paused offending while working as a police officer in Exeter, then resumed after relocation — compartmentalization allowed decades of evasion.",
    ],
    investigation: [
      "Cold-case teams preserved DNA. Identification came in 2018 through genetic genealogy (GEDmatch), arresting DeAngelo at age 72.",
      "The case revolutionized cold-case practice and raised privacy ethics around familial DNA searching.",
    ],
  },
  "david-berkowitz": {
    escalation: [
      "Eight shootings in New York (1976–1977) killed six and wounded seven. Letters to press signed 'Son of Sam' demanded publicity and mocked police.",
      "Parking tickets linked Berkowitz's car to a crime scene — mundane forensic work, not profiling, broke the case.",
    ],
  },
  "jack-the-ripper": {
    formation: [
      "Canonical victims were impoverished women in Whitechapel's sex trade — structural vulnerability shaped both victimology and police indifference.",
      "The 'Ripper' persona emerged from press and letter writers; some communications were likely hoaxes, complicating behavioral analysis.",
    ],
    investigation: [
      "Metropolitan Police and City of London forces coordinated poorly. No conviction occurred; hundreds of suspects populate historical debate.",
    ],
    victimNote:
      "Mary Ann Nichols, Annie Chapman, Elizabeth Stride, Catherine Eddowes, Mary Jane Kelly — canonical five; additional attacks may or may not belong to the same offender.",
  },
  "dennis-nilsen": {
    escalation: [
      "Nilsen killed at least 12 men in London flats (1978–1983), retaining corpses for companionship before dismemberment and disposal via drains.",
      "Plumbers investigating blocked drains discovered human remains — mundane maintenance work triggered exposure.",
    ],
  },
  "robert-pickton": {
    escalation: [
      "Women disappeared from Vancouver's Downtown Eastside over years; many were Indigenous or involved in sex work. Pickton farmed pigs in Port Coquitlam.",
      "Police raided the farm in 2002 on an unrelated warrant; subsequent searches found personal effects of missing women.",
    ],
    investigation: [
      "The Missing Women Commission of Inquiry documented systemic failure to investigate disappearances — institutional devaluation of victims delayed the case for years.",
    ],
  },
  "ian-brady-myra-hindley": {
    escalation: [
      "Five children were abducted, tortured, and murdered on Saddleworth Moor (1963–1965). Brady and Hindley recorded audio of victim suffering.",
      "The moors searches for buried bodies continued for decades; Hindley's cooperation was partial and contested.",
    ],
    motivation: [
      "Brady's Nazi fixation and philosophical sadism appear in writings; Hindley's role debates range from coerced accomplice to enthusiastic participant.",
    ],
  },
  "timothy-mcveigh": {
    escalation: [
      "On 19 April 1995, a truck bomb destroyed the Alfred P. Murrah Federal Building in Oklahoma City, killing 168 including children in a daycare center.",
      "McVeigh was motivated by anti-government ideology galvanized by Waco and Ruby Ridge; Terry Nichols was convicted as co-conspirator.",
    ],
    method: [
      "MO involved ammonium nitrate/fuel oil bomb in a rental truck, timed detonation, and pre-offense reconnaissance documented in trial evidence.",
    ],
  },
  "samuel-little": {
    escalation: [
      "Little confessed to 93 murders from 1970–2005; FBI confirmed at least 60. He targeted vulnerable women — often black, often involved in sex work or addiction.",
      "Sketches and geographic memory from Little assisted in closing cold cases nationwide after his 2012 Texas conviction.",
    ],
  },
  "josef-fritzl": {
    formation: [
      "Fritzl imprisoned his daughter Elisabeth in a soundproofed basement in Amstetten for 24 years, fathering seven children with her while maintaining an upstairs family life.",
      "Elisabeth's illness in 2008 forced hospitalization; her story led to discovery of the dungeon and surviving children.",
    ],
    victimNote:
      "Elisabeth Fritzl and children born in captivity; focus on coercive control and institutional missed opportunities to detect abuse.",
  },
};

export function mergeParagraphs(generated: string[], override?: string[]): string[] {
  if (!override?.length) return generated;
  const merged = [...override];
  for (const p of generated) {
    if (!merged.some((m) => m.slice(0, 60) === p.slice(0, 60))) merged.push(p);
  }
  return merged;
}
