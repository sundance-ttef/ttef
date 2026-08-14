import {defineField, defineType} from 'sanity'

export const ORGS = [
  {title: 'PAC', value: 'pac'},
  {title: 'Foundation', value: 'foundation'},
  {title: 'School', value: 'school'},
]

/**
 * A single dated thing on the calendar — Back to School Night, Friday Flag, a
 * PAC meeting. These drive "Coming up next" on the home page and /events/.
 *
 * Anything already past is dropped at build time, so the list never needs
 * pruning by hand; add next year's dates whenever they are known and they
 * appear on their own.
 */
export default defineType({
  name: 'occurrence',
  title: 'Calendar event',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      options: {dateFormat: 'ddd, MMM D, YYYY'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'time',
      title: 'Time',
      type: 'string',
      description: 'As it should read, e.g. "5:30 – 7:00 PM". Leave empty if there is no set time.',
    }),
    defineField({
      name: 'org',
      title: 'Who runs it',
      type: 'string',
      options: {list: ORGS, layout: 'radio'},
      description: 'Sets the coloured tag. School covers anything the school itself runs.',
      validation: (r) => r.required(),
      initialValue: 'pac',
    }),
    defineField({
      name: 'featured',
      title: 'Show on the home page',
      type: 'boolean',
      description:
        'The home page shows the next three featured events as cards. Leave off for routine dates like Friday Flag so the highlights stay highlights.',
      initialValue: false,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Only shown on the home-page card. Required if this is featured.',
      validation: (r) =>
        r.custom((value, ctx) =>
          (ctx.document as any)?.featured && !value
            ? 'A featured event needs a description — it is what the home-page card shows.'
            : true,
        ),
    }),
    defineField({
      name: 'tradition',
      title: 'Links to which event page?',
      type: 'reference',
      to: [{type: 'tradition'}],
      description:
        'Optional. If this date belongs to one of the annual events, link it and the row becomes clickable.',
    }),
  ],
  orderings: [{title: 'Date', name: 'date', by: [{field: 'date', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', date: 'date', time: 'time', org: 'org'},
    prepare({title, date, time, org}) {
      const d = date ? new Date(date + 'T12:00:00') : null
      const when = d
        ? d.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})
        : 'No date'
      const label = ORGS.find((o) => o.value === org)?.title ?? org
      return {title, subtitle: `${when}${time ? ` · ${time}` : ''} · ${label}`}
    },
  },
})
