import {defineField, defineType} from 'sanity'
import {ORGS} from './orgs'
import {SCHOOL_MONTHS} from './months'

/**
 * Events whose page is hand-built in `src/pages/` rather than rendered from
 * this document by `events/[slug].astro`.
 *
 * Their entry here exists only to APPEAR — it is what puts the event in the
 * Events grid and the Events menu — so the fields that only the generic layout
 * reads render nowhere for them. Hiding those stops an editor writing a
 * write-up, uploading a gallery, or setting a button that silently never
 * shows up. Only the fields the grid and the menu use stay visible: name, url,
 * month, date, who runs it, summary, and the Events-page photo.
 *
 * Astro gives a static route precedence over a dynamic one, which is what lets
 * the hand-built file win. Adding a page here means adding its slug here too.
 */
const CUSTOM_PAGE_SLUGS = ['dine-out']

const hiddenOnCustomPages = ({document}: {document?: unknown}) =>
  CUSTOM_PAGE_SLUGS.includes(
    (document as {slug?: {current?: string}} | undefined)?.slug?.current ?? '',
  )

/**
 * One entry on the Events page and in the Events menu — Book Fair, Fall
 * Carnival, the Auction, Dine Out Nights.
 *
 * `cadence` is what separates them: an annual event falls in one month of the
 * year, and anything else runs through it and leads the list.
 *
 * The page LAYOUTS stay in code: the talent show has a photo strip, the
 * auction a gallery, dine-out a list, and those were designed individually.
 * What lives here is everything that changes year to year — the blurb, the
 * photos, the registration link, whether details are announced yet. So a
 * chair can update their event without a developer, and a new event still
 * gets a designed page rather than a generic one.
 *
 * `slug` must match the existing URL, because printed flyers and QR codes
 * point at these paths.
 */
export default defineType({
  name: 'tradition',
  title: 'Recurring event',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      options: {source: 'title', maxLength: 60},
      description:
        'Becomes /events/<url>/. Do NOT change this on an existing event — printed QR codes point at it.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'cadence',
      title: 'How often it happens',
      type: 'string',
      description:
        'An annual event falls in one month of the year. A monthly one runs through the year and leads the Events page and menu, because something happening all year is always more immediately relevant than something ten months away.',
      options: {
        list: [
          {title: 'Once a year', value: 'annual'},
          {title: 'Every month', value: 'monthly'},
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
      initialValue: 'annual',
    }),
    defineField({
      name: 'month',
      title: 'Month it happens',
      type: 'string',
      description:
        'The month this event falls in most years. This is what orders the Events menu and the grid, and it is what visitors see until a date is set.',
      options: {list: SCHOOL_MONTHS},
      // Only an annual event falls in a month. This used to carry a "Monthly"
      // option, which put a CADENCE in a list of months — the sort then needed
      // a sentinel to lift it, and the date field had to inspect a month value
      // to know it was meaningless. One honest field removed all three.
      hidden: ({document}) => (document as any)?.cadence !== 'annual',
      validation: (r) =>
        r.custom((month, context) => {
          const doc = context.document as {cadence?: string} | undefined
          if (doc?.cadence === 'annual' && !month) return 'An annual event needs the month it falls in.'
          return true
        }),
    }),
    defineField({
      name: 'date',
      title: 'This year\u2019s date',
      type: 'date',
      options: {dateFormat: 'ddd, MMM D, YYYY'},
      description:
        'Leave EMPTY until the date is actually settled — the page then shows the month and "date to be announced". Do not put a guess here: a specific day on the page is one families will plan around. A date left over from a previous school year is ignored automatically.',
      // Anything recurring has many dates, not one, so the field is meaningless.
      hidden: ({document}) => (document as any)?.cadence !== 'annual',
    }),
    defineField({
      name: 'org',
      title: 'Who runs it',
      type: 'string',
      options: {list: ORGS, layout: 'radio'},
      validation: (r) => r.required(),
      initialValue: 'pac',
    }),
    defineField({
      name: 'summary',
      title: 'Short description',
      type: 'text',
      rows: 3,
      description: 'One or two sentences. Used on the events grid and at the top of the page.',
      validation: (r) => r.required().max(300),
    }),
    defineField({
      name: 'body',
      title: 'Page details',
      type: 'array',
      hidden: hiddenOnCustomPages,
      of: [{type: 'block'}],
      description:
        'The main content of the event page. Leave empty and the page shows "details coming soon".',
    }),
    defineField({
      name: 'ctaLabel',
      title: 'Button label',
      type: 'string',
      hidden: hiddenOnCustomPages,
      description: 'e.g. "Register your student". Leave empty for no button.',
    }),
    defineField({
      name: 'ctaUrl',
      title: 'Button link',
      type: 'url',
      hidden: hiddenOnCustomPages,
      validation: (r) => r.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'flyer',
      title: 'Flyer',
      type: 'image',
      hidden: hiddenOnCustomPages,
      description:
        'THIS year\u2019s poster, shown below the details above. It is displayed whole and never cropped, so a portrait flyer keeps its header and its QR code. Different from the two other pictures here: the Events page photo is the card on /events/, and the gallery below is previous years.',
      options: {hotspot: true},
      fields: [
        {name: 'alt', type: 'string', title: 'Describe the flyer',
         description: 'Read aloud by screen readers. Say what it announces.'},
      ],
    }),
    defineField({
      name: 'coverImage',
      title: 'Photo for the Events page',
      type: 'image',
      description:
        'The picture shown on the Events page for this event. It is cropped to a 4:3 card, so set the hotspot on faces. The event\u2019s own page shows the gallery below, not this.',
      options: {hotspot: true},
      fields: [
        {name: 'alt', type: 'string', title: 'Describe the photo',
         description: 'Read aloud by screen readers.'},
      ],
    }),
    defineField({
      name: 'stats',
      title: 'Headline numbers',
      type: 'array',
      hidden: hiddenOnCustomPages,
      description:
        'The two or three figures worth putting at the top of the page — what was raised, the goal, when doors open. Leave empty and the row is not shown.',
      of: [
        {
          type: 'object',
          name: 'stat',
          fields: [
            {name: 'value', title: 'Figure', type: 'string', description: 'e.g. $10,500+ or 5:30 PM',
             validation: (r: any) => r.required()},
            {name: 'label', title: 'What it is', type: 'string', description: 'e.g. Raised in 2024',
             validation: (r: any) => r.required()},
          ],
          preview: {
            select: {value: 'value', label: 'label'},
            prepare: ({value, label}: any) => ({title: value, subtitle: label}),
          },
        },
      ],
    }),
    defineField({
      name: 'milestones',
      title: 'Goal milestones',
      type: 'array',
      hidden: hiddenOnCustomPages,
      description:
        'What unlocks at what total, e.g. "Pie in the Face" at $25,000. Shown as a list. Leave empty and the section is not shown.',
      of: [
        {
          type: 'object',
          name: 'milestone',
          fields: [
            {name: 'label', title: 'What it unlocks', type: 'string',
             validation: (r: any) => r.required()},
            {name: 'amount', title: 'At what total', type: 'string',
             description: 'Written as families read it, e.g. $25,000.',
             validation: (r: any) => r.required()},
          ],
          preview: {
            select: {label: 'label', amount: 'amount'},
            prepare: ({label, amount}: any) => ({title: label, subtitle: amount}),
          },
        },
      ],
    }),
    defineField({
      name: 'photosTitle',
      title: 'Photos title',
      type: 'string',
      hidden: hiddenOnCustomPages,
      description:
        'The heading shown ABOVE the gallery, e.g. "2026 Book Fair". Leave empty and it just reads "Photos".',
    }),
    defineField({
      name: 'photos',
      title: 'Photo gallery',
      type: 'array',
      hidden: hiddenOnCustomPages,
      of: [{type: 'image', options: {hotspot: true}, fields: [
        {name: 'alt', type: 'string', title: 'Describe the photo', description: 'Read aloud by screen readers.'},
      ]}],
      description:
        'The photos shown low on the event page, under the title above. The header image is separate — these do not need to include it. Photos fill their tiles and are cropped to fit, so set the hotspot on faces.',
    }),
  ],
  /* No custom ordering. The one that used to be here was called "School year
     order" but sorted by the month NAME, so it listed April, August, December,
     February — the exact bug the shared month list exists to prevent, sitting
     in the file that defines it. Real school-year order is cadence first and
     then a position in SCHOOL_MONTHS, which a Sanity ordering cannot express,
     so the site sorts it and the Studio does not pretend to. */
  preview: {
    select: {title: 'title', month: 'month', date: 'date', org: 'org', cadence: 'cadence', media: 'coverImage'},
    prepare({title, month, date, org, cadence, media}) {
      const label = ORGS.find((o) => o.value === org)?.title ?? org
      // A recurring event is described by its cadence, never by a date it is
      // waiting on — it is not waiting on one.
      const when =
        cadence === 'monthly'
          ? 'Monthly'
          : date
            ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {month: 'long', day: 'numeric'})
            : `${month ?? 'No month'} — date to be announced`
      return {title, subtitle: `${when} · ${label}`, media}
    },
  },
})
