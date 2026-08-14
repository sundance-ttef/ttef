import {defineField, defineType} from 'sanity'
import {ORGS} from './occurrence'

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
      name: 'monthLabel',
      title: 'When (short label)',
      type: 'string',
      description:
        'Shown in the Events menu and on the traditions grid, e.g. October, Spring, Monthly.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'order',
      title: 'Position in the school year',
      type: 'number',
      description:
        'Orders the Events menu and the grid. August is early, June is late — 1, 2, 3… in that order.',
      validation: (r) => r.required(),
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
