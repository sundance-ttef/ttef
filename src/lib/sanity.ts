/**
 * The Sanity connection, and every query the site makes.
 *
 * Content is fetched at BUILD time and baked into static HTML — visitors never
 * talk to Sanity. That keeps the site on Netlify's free tier, makes API usage a
 * function of how often the site is rebuilt rather than how much traffic it
 * gets, and means the site stays up even if Sanity is down.
 *
 * The trade-off: publishing in the Studio does not change the site until a
 * rebuild runs. A webhook triggers that automatically (see BACKLOG/README).
 *
 * `useCdn: false` is deliberate. The CDN can serve content a few seconds stale,
 * and the one moment we read is immediately after an editor hit Publish — the
 * exact moment a stale read would bake yesterday's content into the build.
 */
import {createClient} from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const projectId = import.meta.env.SANITY_PROJECT_ID || '5yz712qe';
const dataset = import.meta.env.SANITY_DATASET || 'production';

export const sanity = createClient({
  projectId,
  dataset,
  apiVersion: '2024-10-01',
  useCdn: false,
  perspective: 'published',
});

const builder = imageUrlBuilder({clientConfig: {projectId, dataset}} as any);

export type SanityImage = {
  asset?: {_ref?: string; _id?: string};
  alt?: string;
  hotspot?: {x: number; y: number};
} | null | undefined;

/**
 * Build a CDN URL for an image, resized and re-encoded.
 *
 * Always pass a width: Sanity serves the original otherwise, and a 4MB phone
 * photo dropped into a 270px tile is the easiest performance mistake to make
 * with a CMS. `auto('format')` serves WebP/AVIF where supported.
 */
export function imageUrl(image: SanityImage, width: number, height?: number): string | null {
  if (!image?.asset) return null;
  let b = builder.image(image as any).width(width).auto('format').quality(78);
  if (height) {
    b = b.height(height).fit('crop');
    /**
     * A phone photo is usually portrait and every tile here is landscape, so
     * something has to be cut. Sanity's default is to cut from the centre,
     * which on a photo of people standing up removes their heads.
     *
     * With a hotspot set in the Studio, the builder crops around it and that
     * is always the right answer. Without one — and none of the migrated
     * photos have one — `entropy` picks the busiest region instead of the
     * middle, which keeps faces far more often than centring does.
     */
    b = image.hotspot ? b.crop('focalpoint') : b.crop('entropy');
  }
  return b.url();
}


// ---------------------------------------------------------------------------
// School year
// ---------------------------------------------------------------------------

/**
 * The school year a date falls in, identified by its opening calendar year:
 * 2026 means 2026–27. The boundary is 1 July, so anything from July onward
 * belongs to the year that is about to start.
 */
export const schoolYearOf = (iso: string) => {
  const d = new Date(iso + 'T12:00:00');
  return d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
};

export const currentSchoolYear = () => schoolYearOf(new Date().toISOString().slice(0, 10));

/**
 * How an event's date should be presented.
 *
 * The MONTH is safe to show from any date, current or not — Book Fair is in
 * October every year. The DAY is not: last year's day is simply wrong. So a
 * date left over from a previous school year is treated as unconfirmed, and a
 * forgotten annual update degrades to "October, date to be announced" instead
 * of telling families to turn up on the wrong Thursday.
 */
export function eventDate(iso?: string | null, confirmed?: boolean) {
  if (!iso) return {month: null, full: null, confirmed: false, stale: false};
  const d = new Date(iso + 'T12:00:00');
  const stale = schoolYearOf(iso) !== currentSchoolYear();
  const isConfirmed = Boolean(confirmed) && !stale;
  return {
    month: d.toLocaleDateString('en-US', {month: 'long'}),
    full: isConfirmed
      ? d.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})
      : null,
    confirmed: isConfirmed,
    stale,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface BudgetLine {
  label: string;
  note?: string | null;
  amount: number;
}

export interface Campaign {
  schoolYear: string;
  budget: BudgetLine[];
  raised: number;
  updated: string | null;
  suggestedPerStudent: number;
  monthlyPlanMonths: number;
}

export interface Sponsor {
  name: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  url: string;
  logo: SanityImage;
}

export interface Stat { value: string; label: string }
export interface Milestone { label: string; amount: string }

export interface Tradition {
  title: string;
  coverImage?: SanityImage;
  stats?: Stat[];
  milestones?: Milestone[];
  photosCaption?: string | null;
  body?: any[];
  showOnEventsPage?: boolean;
  slug: string;
  date?: string | null;
  dateConfirmed?: boolean;
  org: 'pac' | 'foundation' | 'school';
  summary: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  photos?: SanityImage[];
}

export interface DineOutNight {
  month: string;
  date: string | null;
  restaurant: string | null;
  blurb: string | null;
  link: string | null;
  photo: SanityImage;
}

export interface VolunteerSignup {
  title: string;
  org: 'pac' | 'foundation' | 'school';
  when: string | null;
  description: string | null;
  url: string | null;
}


export const getCampaign = () =>
  sanity.fetch<Campaign>(`*[_id == "siteSettings"][0]{
    schoolYear, budget[]{label, note, amount}, raised,
    "updated": updated, suggestedPerStudent, monthlyPlanMonths
  }`);

export const getSponsors = () =>
  sanity.fetch<Sponsor[]>(`*[_type == "sponsor" && defined(logo.asset)]
    | order(order asc, name asc){ name, tier, url, logo }`);

export const getTraditions = () =>
  sanity.fetch<Tradition[]>(`*[_type == "tradition"] | order(order asc){
    title, "slug": slug.current, date, dateConfirmed, org, summary, showOnEventsPage, ctaLabel, ctaUrl, photos
  }`);

/**
 * The main yearly events: the Events menu and the "Every year at Sundance"
 * grid, which must always agree. Dine Out Nights is excluded — it keeps its
 * page but is linked from Support Us, being a fundraiser rather than a
 * once-a-year event.
 */
export const getYearlyEvents = () =>
  sanity.fetch<Tradition[]>(`*[_type == "tradition" && showOnEventsPage != false]
    | order(date asc){
      title, "slug": slug.current, date, dateConfirmed, org, summary, coverImage
    }`);

export const getTradition = (slug: string) =>
  sanity.fetch<Tradition | null>(
    `*[_type == "tradition" && slug.current == $slug][0]{
      title, "slug": slug.current, date, dateConfirmed, org, summary,
      coverImage, stats, milestones, photosCaption, body, ctaLabel, ctaUrl, photos
    }`,
    {slug},
  );

export const getDineOutNights = () =>
  sanity.fetch<DineOutNight[]>(`*[_type == "dineOutNight"]
    | order(order asc){ month, date, restaurant, blurb, link, photo }`);

export const getVolunteerSignups = () =>
  sanity.fetch<VolunteerSignup[]>(`*[_type == "volunteerSignup"]
    | order(order asc, title asc){ title, org, when, description, url }`);

/** The coloured org tag: class suffix and label, matching the CSS. */
export const orgTag = (org: 'pac' | 'foundation' | 'school') =>
  org === 'foundation'
    ? {cls: 'f', label: 'Foundation'}
    : org === 'school'
      ? {cls: 's', label: 'School'}
      : {cls: 'p', label: 'PAC'};

/** "SEP" / "11" for the date chips on the upcoming lists. */
export const dateChip = (iso: string) => {
  const d = new Date(iso + 'T12:00:00');
  return {
    mon: d.toLocaleDateString('en-US', {month: 'short'}).toUpperCase(),
    day: String(d.getDate()),
  };
};

/**
 * The home page's cards: the next few annual events.
 *
 * Day-to-day dates live in Google Calendar, which /calendar/ embeds — keeping a
 * second copy of them here meant every PTA date had to be typed twice and the
 * two could disagree. The annual events are the things worth putting on the
 * front page anyway.
 *
 * The school year wraps: once the last event has passed, this fills from the
 * start of the year again rather than leaving the section empty, which is
 * correct for events that recur every year.
 */
export async function getUpcomingEvents(limit = 3): Promise<Tradition[]> {
  const all = await getYearlyEvents();
  const today = new Date().toISOString().slice(0, 10);
  const ahead = all.filter((e) => e.date && e.date >= today);
  return [...ahead, ...all.filter((e) => !ahead.includes(e))].slice(0, limit);
}
