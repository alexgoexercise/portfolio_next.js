import { useMemo } from 'react';
import type { Band } from '../content/bands';
import type { Project } from '../content/projects';
import { education, experience, researchProjects, summary } from '../content/resume';
import { socials } from '../content/contact';
import type { Hotspot } from '../diorama/hotspots';
import { useLang, type Lang } from './index';
import {
  zhBands,
  zhEducation,
  zhExperience,
  zhHotspots,
  zhProjects,
  zhResearchProjects,
  zhSocials,
  zhSummary,
} from './zh';

/** A band with its Chinese words, when it has some. The pictures, links and dates are shared. */
export function localBand(band: Band, lang: Lang): Band {
  const zh = lang === 'zh' ? zhBands[band.id] : undefined;
  if (!zh) return band;
  return {
    ...band,
    description: zh.description,
    period: zh.period ?? band.period,
    role: zh.role,
    tags: zh.tags,
    clickNotice: band.clickNotice ? zh.clickNotice ?? band.clickNotice : undefined,
    performances: band.performances.map((show) => {
      const t = zh.shows[show.title];
      return t ? { ...show, title: t.title ?? show.title, venue: t.venue ?? show.venue, description: t.description } : show;
    }),
  };
}

/** The short name of a band (the tag under its cover, "Shows with …"). */
export function localShort(id: string, short: string, lang: Lang) {
  return (lang === 'zh' && zhBands[id]?.short) || short;
}

export function localProject(project: Project, lang: Lang): Project {
  const zh = lang === 'zh' ? zhProjects[project.title] : undefined;
  if (!zh) return project;
  return { ...project, description: zh.description, clickNotice: zh.clickNotice ?? project.clickNotice };
}

export function localSocialNote(name: string, note: string, lang: Lang) {
  return (lang === 'zh' && zhSocials[name]) || note;
}

export function localHotspot(spot: Hotspot, lang: Lang): Hotspot {
  const zh = lang === 'zh' ? zhHotspots[spot.id] : undefined;
  if (!zh) return spot;
  return {
    ...spot,
    label: zh.label,
    blurb: zh.blurb,
    cta: zh.cta ?? spot.cta,
    view: spot.view ? { ...spot.view, label: zh.view ?? spot.view.label } : undefined,
  };
}

/** The resume in the language in use. */
export function useResume() {
  const { lang } = useLang();
  return useMemo(
    () =>
      lang === 'zh'
        ? { summary: zhSummary, education: zhEducation, experience: zhExperience, researchProjects: zhResearchProjects }
        : { summary, education, experience, researchProjects },
    [lang],
  );
}

export { socials };
