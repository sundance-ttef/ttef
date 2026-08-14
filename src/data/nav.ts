export type NavChild = { label: string; href: string };
export type NavEntry = { label: string; href: string; children?: NavChild[] };

/** The whole site navigation, in one place. */
export const nav: NavEntry[] = [
  { label: 'About Us', href: '/about/' },
  { label: 'Our Impact', href: '/impact/' },
  {
    label: 'Events',
    href: '/events/',
    children: [
      { label: 'Events overview', href: '/events/' },
      { label: 'Book Fair', href: '/events/book-fair/' },
      { label: 'Fall Carnival', href: '/events/carnival/' },
      { label: 'Multicultural Night', href: '/events/multicultural-night/' },
      { label: 'Spring Auction', href: '/support/auction/' },
      { label: 'Fun Run', href: '/support/fun-run/' },
      { label: 'Talent Show', href: '/events/talent-show/' },
      { label: 'Senior Clap Out', href: '/events/senior-clap-out/' },
      { label: 'Dine Out Nights', href: '/support/dine-out/' },
    ],
  },
  { label: 'Calendar', href: '/calendar/' },
  { label: 'Shop', href: '/shop/' },
  {
    label: 'Support Us',
    href: '/support/',
    children: [
      { label: 'Support overview', href: '/support/' },
      { label: 'Donate', href: '/donate/' },
      { label: 'Red Envelope Campaign', href: '/support/red-envelope/' },
      { label: 'Spring Auction', href: '/support/auction/' },
      { label: 'Fun Run', href: '/support/fun-run/' },
      { label: 'Dine Out Nights', href: '/support/dine-out/' },
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
  zoom: 'https://us02web.zoom.us/j/87377496307',
  calendarId: 'twintrailsfoundation@gmail.com',
};
