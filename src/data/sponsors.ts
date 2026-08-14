/**
 * Corporate sponsors, and what each tier buys.
 *
 * The logos appear in two places — the scrolling rail on the home page and the
 * tiered wall on /support/ — so they live here rather than being written twice.
 *
 * When the CMS lands this is the shape it fills: a sponsor is a name, a tier, a
 * link, and a logo.
 */

export type Tier = 'platinum' | 'gold' | 'silver' | 'bronze';

export interface Sponsor {
  name: string;
  tier: Tier;
  url: string;
  logo: string;
}

/** Order within a tier is the order they appear. */
export const sponsors: Sponsor[] = [
  { name: 'The Barron Team', tier: 'platinum', url: 'https://thebarronteam.com', logo: '/img/sp-barron.png' },
  { name: 'Dr. Melanie Orthodontics', tier: 'gold', url: 'https://www.drmelanieorthodontics.com/', logo: '/img/sp-dmo.png' },
  { name: 'Smile PHR', tier: 'gold', url: 'https://smilephr.com', logo: '/img/sp-smilephr.png' },
  { name: 'Carmel Mountain Dental Care', tier: 'gold', url: 'https://www.carmelmtndentalcare.com/', logo: '/img/sp-cmdc.png' },
  { name: 'Kappel Realty Group', tier: 'silver', url: 'https://kappelrealtygroup.com', logo: '/img/sp-kappel.png' },
];

export const tiers: { key: Tier; label: string; price: string }[] = [
  { key: 'platinum', label: 'Platinum', price: '$1,600' },
  { key: 'gold', label: 'Gold', price: '$1,000' },
  { key: 'silver', label: 'Silver', price: '$500' },
  { key: 'bronze', label: 'Bronze', price: '$250' },
];

/** Only tiers that actually have a sponsor, so an empty row never renders. */
export const populatedTiers = tiers.filter((t) => sponsors.some((s) => s.tier === t.key));

export const sponsorsIn = (tier: Tier) => sponsors.filter((s) => s.tier === tier);
