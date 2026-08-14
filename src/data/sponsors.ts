/**
 * Corporate sponsors, now edited in Sanity under "Sponsors".
 *
 * `logo` is resolved to a CDN URL here rather than in the templates, so the
 * home rail and the tiered wall on /support/ keep rendering `<img src={s.logo}>`
 * exactly as they did when logos were files in /public.
 *
 * The width is requested explicitly: Sanity serves the original otherwise, and
 * a board member uploading a 4MB photo of a business card would push it down
 * the wire untouched. 500px is 2x the widest slot the CSS allows.
 */
import { getSponsors, imageUrl } from '../lib/sanity';

export type Tier = 'platinum' | 'gold' | 'silver' | 'bronze';

export interface Sponsor {
  name: string;
  tier: Tier;
  url: string;
  logo: string;
}

const LOGO_WIDTH = 500;

export const sponsors: Sponsor[] = (await getSponsors())
  .map((s) => ({ name: s.name, tier: s.tier, url: s.url, logo: imageUrl(s.logo, LOGO_WIDTH)! }))
  .filter((s) => s.logo);

/**
 * Tier prices stay in code. They are the published rate card the sponsorship
 * page's table is built from, and they change once a year by board decision —
 * not the kind of thing that should be editable without review.
 */
export const tiers: { key: Tier; label: string; price: string }[] = [
  { key: 'platinum', label: 'Platinum', price: '$1,600' },
  { key: 'gold', label: 'Gold', price: '$1,000' },
  { key: 'silver', label: 'Silver', price: '$500' },
  { key: 'bronze', label: 'Bronze', price: '$250' },
];

/** Only tiers that actually have a sponsor, so an empty row never renders. */
export const populatedTiers = tiers.filter((t) => sponsors.some((s) => s.tier === t.key));

export const sponsorsIn = (tier: Tier) => sponsors.filter((s) => s.tier === tier);
