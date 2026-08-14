import { getYearlyEvents } from '../lib/sanity';

export type NavChild = {
  label: string;
  href: string;
  /** Shown right-aligned in the dropdown — when in the school year this happens. */
  meta?: string;
  /** The "all of them" entry, set apart at the top of its menu. */
  overview?: boolean;
};
export type NavEntry = { label: string; href: string; children?: NavChild[] };

/**
 * The Events menu is built from the same Sanity query as the "Every year at
 * Sundance" grid, so the menu and the page cannot disagree about what a yearly
 * event is. Renaming an event in the Studio renames it in both places.
 */
const yearlyEvents = await getYearlyEvents();

/** The whole site navigation, in one place. */
export const nav: NavEntry[] = [
  { label: 'About Us', href: '/about/' },
  { label: 'Our Impact', href: '/impact/' },
  {
    label: 'Events',
    href: '/events/',
    // in school-year order, the same order the traditions grid uses
    children: [
      { label: 'All events', href: '/events/', overview: true },
      ...yearlyEvents.map((e) => ({
        label: e.title,
        href: `/events/${e.slug}/`,
        meta: e.monthLabel,
      })),
    ],
  },
  { label: 'Calendar', href: '/calendar/' },
  {
    label: 'Support Us',
    href: '/support/',
    // Auction and Fun Run are listed under Events; repeating them here made the
    // same page appear in two menus. Dine Out Nights is the other way round —
    // it is a way to give rather than a yearly event, so it lives only here.
    // Its URL stays under /events/ because printed material points at it.
    children: [
      { label: 'All the ways to give', href: '/support/', overview: true },
      { label: 'Donate', href: '/donate/', meta: 'Any time' },
      { label: 'Spirit Wear Store', href: '/shop/', meta: 'Wildcat gear' },
      { label: 'Dine Out Nights', href: '/events/dine-out/', meta: 'Monthly' },
      { label: 'Red Envelope Campaign', href: '/support/red-envelope/', meta: 'Sep–Nov' },
      { label: 'Corporate Sponsorship', href: '/support/sponsorship/', meta: 'From $250' },
    ],
  },
  { label: 'Volunteer', href: '/volunteer/' },
  { label: 'Contact', href: '/contact/' },
];

export const social = {
  facebook: 'https://www.facebook.com/groups/214661706390640',
  instagram: 'https://www.instagram.com/sundancepacandfoundation',
};

export const org = {
  name: 'Twin Trails Education Foundation',
  short: 'Twin Trails',
  school: 'Sundance Elementary',
  ein: '20‑1105904',
  phone: '858‑484‑2950',
  phoneHref: 'tel:8584842950',
  address: ['8944 Twin Trails Drive', 'San Diego, CA 92129'],
  email: {
    foundation: 'Sundance-Foundation@GoogleGroups.com',
    pac: 'pacsundancepq@gmail.com',
    finance: 'sundance-finance@googlegroups.com',
  },
  zoom: 'https://us02web.zoom.us/j/87377496307?pwd=xdNaPtEO3g8Hkm1NGqGSIF0di34uIe.1',
  calendarId: 'twintrailsfoundation@gmail.com',
};
