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

/** The school year runs August to June, so month names cannot sort themselves. */
export const SCHOOL_MONTHS = [
  'August', 'September', 'October', 'November', 'December',
  'January', 'February', 'March', 'April', 'May', 'June',
];

/** Anything with an unrecognised month sorts last. */
const monthIndex = (m?: string | null) => {
  const i = SCHOOL_MONTHS.indexOf(m ?? '');
  return i === -1 ? 99 : i;
};

/** Whether this happens once a year, as opposed to running through it. */
const isAnnual = (e: Tradition) => (e.cadence ?? 'annual') === 'annual';

/**
 * School-year order, with recurring events first.
 *
 * They lead because they are happening all year, so they are always the most
 * immediately relevant thing on the page, where a single-month event may be ten
 * months away. This used to be a -1 returned from the month lookup for a magic
 * "Monthly" month; now the cadence says it outright, and a month is only ever
 * a month.
 */
export const bySchoolYear = (a: Tradition, b: Tradition) =>
  Number(isAnnual(a)) - Number(isAnnual(b)) ||
  monthIndex(a.month) - monthIndex(b.month) ||
  (a.date ?? '').localeCompare(b.date ?? '') ||
  a.title.localeCompare(b.title);

/**
 * How an entry's timing reads, in the two lengths the site needs.
 *
 * `short` goes in the tight places — a card's meta line, a menu row — where
 * "October — date to be announced" would not fit and the month alone is enough.
 * `full` is the page's own eyebrow, where the missing date is worth saying.
 *
 * A recurring event uses its cadence for both and is never described as
 * awaiting a date, because it is not waiting on one.
 */
export const traditionWhen = (e: Tradition) => {
  if (!isAnnual(e)) return {short: 'Monthly', full: 'Monthly'};
  const when = eventWhen(e.month, e.date);
  return {short: when.month ?? '', full: when.label};
};

/**
 * How an event's timing should read.
 *
 * The MONTH is the durable fact — Book Fair is in October every year — and is
 * always set. The DATE is this year's detail and is often not known yet, in
 * which case the page says "October — date to be announced" rather than
 * showing a day nobody has agreed to.
 *
 * A date left over from a PREVIOUS school year is ignored, so a forgotten
 * annual update degrades to the month rather than telling families to turn up
 * on last year's Thursday.
 */
export function eventWhen(month?: string | null, iso?: string | null) {
  const usable = Boolean(iso) && schoolYearOf(iso!) === currentSchoolYear();
  const monthLabel =
    month ?? (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {month: 'long'}) : null);
  const full = usable
    ? new Date(iso! + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
    : null;
  return {
    month: monthLabel,
    full,
    confirmed: usable,
    /** The one string a page prints for a DATED event's timing. */
    label: full ?? (monthLabel ? `${monthLabel} — date to be announced` : 'Date to be announced'),
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
  photosTitle?: string | null;
  body?: any[];
  slug: string;
  date?: string | null;
  month?: string | null;
  cadence?: 'annual' | 'monthly';
  org: 'pac' | 'foundation' | 'school';
  summary: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  photos?: SanityImage[];
}

/**
 * The shape a dated event's PAGE needs, whatever kind it is.
 *
 * A dine out night and a one-off are separate document types — see the schemas
 * for why — but they render the same page, so both queries project into this
 * one display contract and one component draws it.
 */
export interface DatedEvent {
  title: string | null;
  slug: string | null;
  date: string | null;
  where: string | null;
  summary: string | null;
  link: string | null;
  photo: SanityImage;
}

/** A night in the monthly run. `month` carries a slot that is not booked yet. */
export interface DineOutNight extends DatedEvent {
  month: string;
  order: number;
}

export interface BoardPosition {
  role: string;
  org: 'pac' | 'foundation';
  holder: string | null;
  photo: SanityImage;
  featured: boolean;
  order: number;
  description: string | null;
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

/** Every annual event, in school-year order. Used to build the page routes. */
export const getTraditions = () =>
  sanity.fetch<Tradition[]>(`*[_type == "tradition"]{
    title, "slug": slug.current, month, cadence, date, org, summary, ctaLabel, ctaUrl, photos
  }`);

/**
 * Every entry on the Events page and in the Events menu, which must always agree.
 *
 * Dine Out Nights IS one of these — it is a card and a menu item like any
 * other. What it is not is annual, and that is said by its `cadence` rather
 * than by a "not really an annual event" toggle or a fake month. The nights
 * themselves are `datedEvent`s pointing back at it.
 */
export const getYearlyEvents = async () => {
  const rows = await sanity.fetch<Tradition[]>(`*[_type == "tradition"]{
    title, "slug": slug.current, month, cadence, date, org, summary, coverImage
  }`);
  return rows.sort(bySchoolYear);
};

export const getTradition = (slug: string) =>
  sanity.fetch<Tradition | null>(
    `*[_type == "tradition" && slug.current == $slug][0]{
      title, "slug": slug.current, month, cadence, date, org, summary,
      coverImage, stats, milestones, photosTitle, body, ctaLabel, ctaUrl, photos
    }`,
    {slug},
  );

const DATED_EVENT_FIELDS = `
  title, "slug": slug.current, date, where, summary, link, photo
`;

/**
 * The year's dine out nights, in school-year order.
 *
 * Ordered by `order` first and `date` second, not by date alone: a slot that is
 * not booked has no date, and one sorted by its month NAME would put April
 * before February before January.
 */
export const getDineOutNights = () =>
  sanity.fetch<DineOutNight[]>(
    `*[_type == "dineOutNight"] | order(order asc, date asc){${DATED_EVENT_FIELDS}, month, order}`,
  );

/**
 * One-off events — a page each, deliberately listed nowhere.
 *
 * Reached only by a link someone places by hand, which is the point: an ad-hoc
 * event can have a real page to print without every ad-hoc event that ever
 * happened piling up on the Events grid.
 */
export const getOneOffEvents = () =>
  sanity.fetch<DatedEvent[]>(
    `*[_type == "oneOffEvent"] | order(date desc){${DATED_EVENT_FIELDS}}`,
  );

/**
 * Whether a dine out night has its own page.
 *
 * It needs all three: a restaurant and a date because otherwise the page has
 * nothing on it, and a url because that is what the page is built at. A slot
 * that is not booked has none of them and correctly gets no page — a link that
 * leads to "to be announced" is worse than no link.
 *
 * A one-off needs no such check: its date, name and url are all required, so
 * one cannot exist unbooked.
 */
export const isBooked = (e: DatedEvent) => Boolean(e.slug && e.date && e.title);

/**
 * "Wednesday, September 3, 2026".
 *
 * Unlike `eventWhen`, this never suppresses a date for being in a past school
 * year. A tradition with last year's date is showing a stale detail; a dated
 * event IS its date, so hiding it would leave the page describing nothing.
 */
export const fullDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

/**
 * Every seat on both rosters, filled or open, in the order the About page
 * shows them.
 *
 * Sorted by `order` and never by name: a roster is ranked, not alphabetical,
 * and a name sort would put the Treasurer above the President. `role` only
 * breaks a tie between two seats given the same number by mistake, so the page
 * is at least stable rather than arbitrary.
 */
export const getBoardPositions = () =>
  sanity.fetch<BoardPosition[]>(`*[_type == "boardPosition"]
    | order(order asc, role asc){ role, org, holder, photo, featured, order, description }`);

/**
 * A seat is open when nobody holds it. `featured` is deliberately not consulted:
 * an open seat has no name and no face, so there is nothing to put on a large
 * card and it belongs in the open list whatever its ranking says.
 */
export const isOpen = (p: BoardPosition) => !p.holder;

/**
 * "Aram Chia Sarafian" → "AC".
 *
 * The first letter of the first two words, which is what the hand-written
 * roster used. Derived rather than stored: an initials field would be one more
 * thing to keep in step with the name, and it can only ever disagree.
 */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

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
