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
  if (height) b = b.height(height).fit('crop');
  return b.url();
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface Campaign {
  schoolYear: string;
  goal: number;
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

export interface Occurrence {
  name: string;
  date: string;
  time?: string;
  org: 'pac' | 'foundation' | 'school';
  href?: string | null;
}

export interface Tradition {
  title: string;
  slug: string;
  monthLabel: string;
  order: number;
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
  when: string | null;
  description: string | null;
  url: string | null;
}

/** Today at midnight, so an event happening TODAY still counts as upcoming. */
const todayISO = () => new Date().toISOString().slice(0, 10);

export const getCampaign = () =>
  sanity.fetch<Campaign>(`*[_id == "siteSettings"][0]{
    schoolYear, goal, raised, "updated": updated, suggestedPerStudent, monthlyPlanMonths
  }`);

export const getSponsors = () =>
  sanity.fetch<Sponsor[]>(`*[_type == "sponsor" && defined(logo.asset)]
    | order(order asc, name asc){ name, tier, url, logo }`);

/** Upcoming only — anything before today drops out with no manual pruning. */
export const getUpcoming = (limit = 12) =>
  sanity.fetch<Occurrence[]>(
    `*[_type == "occurrence" && date >= $today] | order(date asc)[0...$limit]{
      name, date, time, org, "href": tradition->slug.current
    }`,
    {today: todayISO(), limit},
  );

export const getTraditions = () =>
  sanity.fetch<Tradition[]>(`*[_type == "tradition"] | order(order asc){
    title, "slug": slug.current, monthLabel, order, org, summary, ctaLabel, ctaUrl, photos
  }`);

export const getTradition = (slug: string) =>
  sanity.fetch<Tradition | null>(
    `*[_type == "tradition" && slug.current == $slug][0]{
      title, "slug": slug.current, monthLabel, order, org, summary, ctaLabel, ctaUrl, photos
    }`,
    {slug},
  );

export const getDineOutNights = () =>
  sanity.fetch<DineOutNight[]>(`*[_type == "dineOutNight"]
    | order(select(defined(date) => date, "9999-12-31") asc, month asc){
      month, date, restaurant, blurb, link, photo
    }`);

export const getVolunteerSignups = () =>
  sanity.fetch<VolunteerSignup[]>(`*[_type == "volunteerSignup"]
    | order(order asc, title asc){ title, when, description, url }`);
