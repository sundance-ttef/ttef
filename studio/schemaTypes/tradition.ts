import {defineField, defineType} from 'sanity'
import {ORGS} from './orgs'

/**
 * One of the annual events that has its own page — Book Fair, Fall Carnival,
 * the Auction, and so on.
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
  title: 'Annual event',
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
      name: 'date',
      title: 'Date',
      type: 'date',
      options: {dateFormat: 'ddd, MMM D, YYYY'},
      description:
        'This year\u2019s date. It sets the month shown in the Events menu and on the card, and the order events appear in. Put your best guess in and leave "Date confirmed" off until it is settled.',
      validation: (r) =>
        r.custom((value, ctx) =>
          (ctx.document as any)?.showOnEventsPage !== false && !value
            ? 'A yearly event needs a date — the menu and the grid are ordered by it.'
            : true,
        ),
    }),
    defineField({
      name: 'dateConfirmed',
      title: 'Date confirmed',
      type: 'boolean',
      description:
        'Off means the event page shows the month and "date to be announced" instead of a specific day. Turn it on once the date is settled. A date left over from a previous school year is treated as unconfirmed automatically, so a forgotten update can never show families the wrong day.',
      initialValue: false,
    }),
    defineField({
      name: 'showOnEventsPage',
      title: 'One of the main yearly events?',
      type: 'boolean',
      description:
        'On means it appears in the Events menu and the "Every year at Sundance" grid. Off means the page still exists at its URL but is linked from elsewhere — Dine Out Nights lives under Support Us.',
      initialValue: true,
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
      of: [{type: 'block'}],
      description:
        'The main content of the event page. Leave empty and the page shows "details coming soon".',
    }),
    defineField({
      name: 'ctaLabel',
      title: 'Button label',
      type: 'string',
      description: 'e.g. "Register your student". Leave empty for no button.',
    }),
    defineField({
      name: 'ctaUrl',
      title: 'Button link',
      type: 'url',
      validation: (r) => r.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}, fields: [
        {name: 'alt', type: 'string', title: 'Describe the photo', description: 'Read aloud by screen readers.'},
      ]}],
      description:
        'THE FIRST PHOTO IS THE COVER shown on the Events page — drag your best one to the front. Photos fill their tiles and are cropped to fit, so set the hotspot on faces. Leave empty to show placeholders.',
    }),
  ],
  orderings: [{title: 'School year order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', month: 'monthLabel', org: 'org', media: 'photos.0'},
    prepare({title, month, org, media}) {
      const label = ORGS.find((o) => o.value === org)?.title ?? org
      return {title, subtitle: `${month} · ${label}`, media}
    },
  },
})
