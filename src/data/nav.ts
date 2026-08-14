export type NavChild = {
  label: string;
  href: string;
  /** Shown right-aligned in the dropdown — when in the school year this happens. */
  meta?: string;
  /** The "all of them" entry, set apart at the top of its menu. */
  overview?: boolean;
};
export type NavEntry = { label: string; href: string; children?: NavChild[] };

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
      { label: 'Book Fair', href: '/events/book-fair/', meta: 'October' },
      { label: 'Fall Carnival', href: '/events/carnival/', meta: 'October' },
      { label: 'Multicultural Night', href: '/events/multicultural-night/', meta: 'January' },
      { label: 'Spring Auction', href: '/events/auction/', meta: 'February' },
      { label: 'Fun Run', href: '/events/fun-run/', meta: 'March' },
      { label: 'Talent Show', href: '/events/talent-show/', meta: 'Spring' },
      { label: 'Senior Clap Out', href: '/events/senior-clap-out/', meta: 'June' },
      { label: 'Dine Out Nights', href: '/events/dine-out/', meta: 'Monthly' },
    ],
  },
  { label: 'Calendar', href: '/calendar/' },
  {
    label: 'Support Us',
    href: '/support/',
    // Auction, Fun Run and Dine Outs are listed under Events; repeating them here
    // made the same page appear in two menus.
    children: [
      { label: 'All the ways to give', href: '/support/', overview: true },
      { label: 'Donate', href: '/donate/', meta: 'Any time' },
      { label: 'Red Envelope Campaign', href: '/support/red-envelope/', meta: 'Sep–Nov' },
      { label: 'Corporate Sponsorship', href: '/support/sponsorship/', meta: 'From $250' },
      { label: 'Spirit Wear Store', href: '/shop/', meta: 'Wildcat gear' },
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
