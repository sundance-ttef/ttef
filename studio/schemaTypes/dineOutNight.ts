import {defineField, defineType} from 'sanity'

/**
 * One dine-out night. These are announced a month at a time, so a night
 * usually exists as a placeholder ("November — coming soon") before the
 * restaurant is booked.
 *
 * `restaurant` is therefore optional and `month` is required: the month is
 * what gets published first. Past/upcoming is derived from the date at build
 * time rather than stored, so nothing has to be toggled by hand.
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
      description: 'The month as families see it, e.g. November. Shown before a date is set.',
      validation: (r) => r.required(),
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
      name: 'restaurant',
      title: 'Restaurant',
      type: 'string',
      description: 'Leave empty to show "Coming soon".',
    }),
    defineField({
      name: 'blurb',
      title: 'Details',
      type: 'text',
      rows: 2,
      description: 'Times, whether to mention Sundance, percentage donated — one or two lines.',
    }),
    defineField({
      name: 'link',
      title: 'Restaurant or flyer link',
      type: 'url',
      validation: (r) => r.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'photo',
      title: 'Photo or flyer',
      type: 'image',
      description:
        'Fills a wide tile and is cropped to fit, so keep the important part centred. Leave empty to show the placeholder.',
      options: {hotspot: true},
    }),
  ],
  orderings: [{title: 'Date', name: 'date', by: [{field: 'date', direction: 'asc'}]}],
  preview: {
    select: {month: 'month', restaurant: 'restaurant', date: 'date', media: 'photo'},
    prepare({month, restaurant, date, media}) {
      return {
        title: `${month}${restaurant ? ` — ${restaurant}` : ' — coming soon'}`,
        subtitle: date ? new Date(date + 'T12:00:00').toDateString() : 'No date yet',
        media,
      }
    },
  },
})
