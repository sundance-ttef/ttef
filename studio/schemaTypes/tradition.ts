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
      name: 'photosCaption',
      title: 'Photo caption',
      type: 'string',
      description: 'Optional line under the photos, e.g. "Last year\u2019s talent show."',
    }),
    defineField({
      name: 'photos',
      title: 'Photos from previous years',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}, fields: [
        {name: 'alt', type: 'string', title: 'Describe the photo', description: 'Read aloud by screen readers.'},
      ]}],
      description:
        'A gallery of past years, shown low on the event page. The header image above is separate — these do not need to include it. Photos fill their tiles and are cropped to fit, so set the hotspot on faces.',
    }),
  ],
  orderings: [{title: 'School year order', name: 'date', by: [{field: 'date', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', date: 'date', confirmed: 'dateConfirmed', org: 'org', media: 'coverImage'},
    prepare({title, date, confirmed, org, media}) {
      const label = ORGS.find((o) => o.value === org)?.title ?? org
      const d = date ? new Date(date + 'T12:00:00') : null
      const when = d
        ? confirmed
          ? d.toLocaleDateString('en-US', {month: 'long', day: 'numeric'})
          : `${d.toLocaleDateString('en-US', {month: 'long'})} — date TBC`
        : 'No date'
      return {title, subtitle: `${when} · ${label}`, media}
    },
  },
})
