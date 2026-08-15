import {defineField, defineType} from 'sanity'

/**
 * A one-off event — something that happens once, on a date, and needs a page.
 *
 * It lives at /events/<url>/ and appears in NO grid and NO menu. That is the
 * point of it: an ad-hoc event can have a real page to put on a flyer or behind
 * a QR code without every ad-hoc thing that ever happened piling up on the
 * Events page. It is reached only by a link someone places by hand.
 *
 * Not to be confused with a `tradition`, which recurs and IS listed, or with a
 * `dineOutNight`, which belongs to the monthly run and nests under it. Unlike a
 * dine out night, every field that matters here is required: there is no
 * placeholder state, because an event with no date and no name is not an event
 * anyone can be told about.
 */
export default defineType({
  name: 'oneOffEvent',
  title: 'One-off event',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'What it is called, as families will see it.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      options: {dateFormat: 'ddd, MMM D, YYYY'},
      description: 'The day it happens. The url is built from this, so it is required.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      description:
        'Becomes /events/<url>/. Press Generate once the name and date are filled in. The date leads it so two events with the same name in different years never collide. Do NOT change it once a flyer has gone out.',
      options: {
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
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'where',
      title: 'Where',
      type: 'string',
      description: 'Address or cross-streets, so families know where to go.',
    }),
    defineField({
      name: 'summary',
      title: 'Details',
      type: 'text',
      rows: 3,
      description: 'Times, what to bring, what it costs — a line or two.',
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
      description: 'Shown whole and never cropped, so a portrait flyer keeps its detail.',
      options: {hotspot: true},
    }),
  ],
  orderings: [{title: 'Date, newest first', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {
    select: {title: 'title', date: 'date', media: 'photo'},
    prepare({title, date, media}) {
      return {
        title,
        subtitle: date ? new Date(date + 'T12:00:00').toDateString() : 'No date yet',
        media,
      }
    },
  },
})
