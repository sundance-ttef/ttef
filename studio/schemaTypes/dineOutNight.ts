import {defineField, defineType} from 'sanity'
import {SCHOOL_MONTHS} from './months'

/**
 * One Dine Out Night — a month in the year's run of them.
 *
 * These are announced a month at a time, so a night usually exists as a
 * placeholder ("October — coming soon") before the restaurant is booked. That
 * is why `month` is required and everything else is not: the month is what gets
 * published first.
 *
 * A night gets its own page at /events/dine-out/<url>/ once it is BOOKED —
 * once it has a date, a restaurant and a url. A placeholder has none of those
 * and correctly gets no page, because a link that leads to "to be announced" is
 * worse than no link.
 *
 * This and `oneOffEvent` were briefly one shared type with a "which series"
 * reference. On paper they are the same shape; in the Studio they are not. The
 * shared type needed three conditionally hidden fields, three conditional
 * validations, and field descriptions that had to describe a dine out night and
 * a one-off at the same time — so an editor creating a one-off was told what to
 * put where "for a dine out night". Two types cost one extra file and read
 * correctly to the person actually filling them in.
 */
export default defineType({
  name: 'dineOutNight',
  title: 'Dine out night',
  type: 'document',
  fields: [
    defineField({
      name: 'month',
      title: 'Month',
      type: 'string',
      description:
        'The month as families see it. A night can be published with just this, before the restaurant is booked — it shows as "October — coming soon".',
      options: {list: SCHOOL_MONTHS},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'order',
      title: 'Position in the school year',
      type: 'number',
      description:
        'September is 1, October 2, and so on. Needed because a night with no date yet would otherwise sort alphabetically — April before February before January.',
      validation: (r) => r.required(),
      initialValue: 1,
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      options: {dateFormat: 'ddd, MMM D, YYYY'},
      description:
        'Leave empty until it is booked. Once set, the night sorts by this and moves to "past" on its own after it happens.',
    }),
    defineField({
      name: 'title',
      title: 'Restaurant',
      type: 'string',
      description: 'Leave empty to show "Coming soon".',
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      description:
        'Becomes /events/dine-out/<url>/. Press Generate once the date and the restaurant are filled in. Shorten it if you like. Do NOT change it once a flyer has gone out.',
      options: {
        // Date first so the year's nights read chronologically, and so the same
        // restaurant booked twice can never collide.
        source: (doc: Record<string, unknown>) =>
          doc.date && doc.title ? `${doc.date} ${doc.title}` : '',
        // The stock slugifier turns an apostrophe into a separator, so "Ike's"
        // becomes "ike-s". Drop quotes outright first.
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
      /**
       * An ERROR once the night is booked, not a warning. As a warning this was
       * publishable, and a booked night published without a url silently gets no
       * page — the schedule shows the card, the card links nowhere, and nothing
       * says why. That happened to the first night ever filled in.
       */
      validation: (r) =>
        r.custom((slug: {current?: string} | undefined, context) => {
          const doc = context.document as {date?: string; title?: string} | undefined
          if (doc?.date && doc?.title && !slug?.current) {
            return 'This night has a date and a restaurant, so it needs a URL to have a page — press Generate.'
          }
          return true
        }),
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
      description:
        'Times, whether to mention Sundance, what share comes back, anything excluded — a line or two.',
    }),
    defineField({
      name: 'link',
      title: 'Restaurant or flyer link',
      type: 'url',
      validation: (r) => r.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'photo',
      title: 'Flyer or photo',
      type: 'image',
      description:
        'Shown whole and never cropped, so a portrait flyer keeps its header and its QR code.',
      options: {hotspot: true},
    }),
  ],
  orderings: [
    {
      title: 'School year order',
      name: 'schoolYear',
      by: [{field: 'order', direction: 'asc'}, {field: 'date', direction: 'asc'}],
    },
  ],
  preview: {
    select: {title: 'title', month: 'month', date: 'date', media: 'photo'},
    prepare({title, month, date, media}) {
      return {
        title: `${month} — ${title || 'coming soon'}`,
        subtitle: date ? new Date(date + 'T12:00:00').toDateString() : 'No date yet',
        media,
      }
    },
  },
})
