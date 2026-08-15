import {defineField, defineType} from 'sanity'
import {SCHOOL_MONTHS} from './months'

/**
 * One thing that happens on one date and has its own page.
 *
 * This is the counterpart to `tradition`. A tradition's identity is its NAME —
 * Book Fair is Book Fair every year, and its date is this year's detail. A
 * dated event's identity is its DATE: September 2026 at Ike's and September
 * 2027 at Ike's are two different events with two different pages, which is
 * why the date leads the url.
 *
 * `series` is the only thing that separates the two kinds of dated event:
 *
 *   series set    → a night in a run of them. Listed on that series' page
 *                   (Dine Out Nights), and its url nests underneath it.
 *   series empty  → a one-off. Lives at /events/<url>/, appears in no grid and
 *                   no menu, and is reached only by a link you place yourself.
 *
 * Being listed on the Events page is therefore a property of the SERIES, not
 * of the event — which is what lets a one-off have a real page without
 * cluttering the Events grid with every ad-hoc thing that ever happened.
 */

/**
 * A one-off has no series to hold an unbooked placeholder slot, so the
 * placeholder machinery is hidden unless the event belongs to one.
 */
const hiddenUnlessSeries = ({document}: {document?: unknown}) =>
  !(document as {series?: unknown} | undefined)?.series

export default defineType({
  name: 'datedEvent',
  title: 'Dated event',
  type: 'document',
  fields: [
    defineField({
      name: 'series',
      title: 'Series',
      type: 'reference',
      to: [{type: 'tradition'}],
      description:
        'Set by the folder this was created in. A night in a series is listed on that series\u2019 page and its url sits underneath it; an event with no series stands on its own and appears in no grid and no menu.',
      /**
       * Shown but not editable, for the same reason `org` is on boardPosition:
       * the sidebar folder already decided this and pre-fills it, so asking
       * again was a question with a known answer — and an answerable one, which
       * meant a wrong click could file a night into a folder the editor was not
       * looking at, where they would never find it again.
       */
      readOnly: true,
    }),
    defineField({
      name: 'month',
      title: 'Month',
      type: 'string',
      description:
        'The month as families see it. A series slot can be published with just this, before the date and the venue are booked — it shows as "October — coming soon".',
      options: {list: SCHOOL_MONTHS},
      hidden: hiddenUnlessSeries,
      validation: (r) =>
        r.custom((month, context) => {
          const doc = context.document as {series?: unknown} | undefined
          if (doc?.series && !month) return 'A night in a series needs a month, even before it is booked.'
          return true
        }),
    }),
    defineField({
      name: 'order',
      title: 'Position in the school year',
      type: 'number',
      description:
        'September is 1, October 2, and so on. Needed because slots that have no date yet would otherwise sort alphabetically — April before February before January.',
      hidden: hiddenUnlessSeries,
      initialValue: 1,
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      options: {dateFormat: 'ddd, MMM D, YYYY'},
      description:
        'For a series slot, leave empty until it is booked. Once set, the event sorts by this and moves to "past" on its own after it happens.',
      validation: (r) =>
        r.custom((date, context) => {
          const doc = context.document as {series?: unknown} | undefined
          if (!doc?.series && !date) return 'A one-off event needs a date — the date is what its url is built from.'
          return true
        }),
    }),
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description:
        'What it is. For a dine out night this is the restaurant — "Ike’s Place". Leave empty on an unbooked series slot to show "Coming soon".',
      validation: (r) =>
        r.custom((title, context) => {
          const doc = context.document as {series?: unknown} | undefined
          if (!doc?.series && !title) return 'A one-off event needs a name.'
          return true
        }),
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      description:
        'Press Generate once the date and the name are filled in. Shorten it if you like — "2026-09-03-ikes" reads better than "2026-09-03-ikes-place". Do NOT change it once a flyer has gone out.',
      options: {
        // Date first so a year's events sort and read chronologically, and so
        // the same venue booked twice can never collide.
        source: (doc: Record<string, unknown>) =>
          doc.date && doc.title ? `${doc.date} ${doc.title}` : '',
        // The stock slugifier turns an apostrophe into a separator, so
        // "Ike's Place" becomes "ike-s-place". Drop quotes outright first.
        slugify: (input: string) =>
          input
            .toLowerCase()
            .replace(/['‘’"“”]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60)
            .replace(/-+$/, ''),
        maxLength: 60,
      },
      // A warning rather than an error: an unbooked series slot is a perfectly
      // valid document and has to stay publishable without a url.
      validation: (r) =>
        r
          .custom((slug: {current?: string} | undefined, context) => {
            const doc = context.document as {date?: string; title?: string} | undefined
            if (doc?.date && doc?.title && !slug?.current) {
              return 'This event has a date and a name, so it can have its own page — press Generate to give it one.'
            }
            return true
          })
          .warning(),
    }),
    defineField({
      name: 'where',
      title: 'Where',
      type: 'string',
      description: 'Address or cross-streets, so families know which branch to go to.',
    }),
    defineField({
      name: 'summary',
      title: 'Details',
      type: 'text',
      rows: 3,
      description: 'Times, whether to mention Sundance, percentage donated — a line or two.',
    }),
    defineField({
      name: 'link',
      title: 'Website or flyer link',
      type: 'url',
      validation: (r) => r.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'photo',
      title: 'Flyer or photo',
      type: 'image',
      description:
        'Fills a wide tile and is cropped to fit, so keep the important part centred. Leave empty to show the placeholder.',
      options: {hotspot: true},
    }),
  ],
  orderings: [
    {
      title: 'School year order',
      name: 'schoolYear',
      by: [{field: 'order', direction: 'asc'}, {field: 'date', direction: 'asc'}],
    },
    {title: 'Date, newest first', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', month: 'month', date: 'date', series: 'series.title', media: 'photo'},
    prepare({title, month, date, series, media}) {
      return {
        title: title || `${month ?? 'Unscheduled'} — coming soon`,
        subtitle: [series ?? 'One-off', date ? new Date(date + 'T12:00:00').toDateString() : 'No date yet']
          .join(' · '),
        media,
      }
    },
  },
})
