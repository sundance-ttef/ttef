import {defineField, defineType} from 'sanity'

/**
 * The campaign numbers, as a singleton.
 *
 * There is exactly one of these documents and the Studio pins it to the top of
 * the sidebar, because during the Red Envelope campaign "raised" is the single
 * field anyone needs to touch — often weekly.
 *
 * `raised` and `updated` belong together: the site prints the date next to the
 * total, so a number updated without its date reads as stale. The Studio warns
 * when one moves without the other.
 */
export default defineType({
  name: 'siteSettings',
  title: 'Campaign & goal',
  type: 'document',
  fields: [
    defineField({
      name: 'schoolYear',
      title: 'School year',
      type: 'string',
      description: 'Shown all over the site, e.g. 2026–27. Use an en dash, not a hyphen.',
      validation: (r) => r.required(),
      initialValue: '2026–27',
    }),
    defineField({
      name: 'goal',
      title: 'Fundraising goal (whole dollars)',
      type: 'number',
      description: 'No commas or dollar sign — just the number, e.g. 111944.',
      validation: (r) => r.required().min(0).integer(),
    }),
    defineField({
      name: 'raised',
      title: 'Raised so far (whole dollars)',
      type: 'number',
      description: 'Update this and the date below together.',
      validation: (r) => r.required().min(0).integer(),
    }),
    defineField({
      name: 'updated',
      title: 'Totals last checked',
      type: 'date',
      options: {dateFormat: 'MMM D, YYYY'},
      description:
        'Printed next to the total. Leave empty before the campaign opens and no date is shown.',
    }),
    defineField({
      name: 'suggestedPerStudent',
      title: 'Suggested gift per student (whole dollars)',
      type: 'number',
      validation: (r) => r.required().min(0).integer(),
      initialValue: 275,
    }),
    defineField({
      name: 'monthlyPlanMonths',
      title: 'Months the monthly plan runs over',
      type: 'number',
      description:
        'Used to show the monthly equivalent of the suggested gift. 10 months turns $275 into $27.50.',
      validation: (r) => r.required().min(1).integer(),
      initialValue: 10,
    }),
  ],
  preview: {
    select: {year: 'schoolYear', raised: 'raised', goal: 'goal'},
    prepare({year, raised, goal}) {
      const usd = (n: number) => '$' + (n ?? 0).toLocaleString('en-US')
      const pct = goal ? Math.round(((raised ?? 0) / goal) * 100) : 0
      return {title: `${year} campaign`, subtitle: `${usd(raised)} of ${usd(goal)} — ${pct}%`}
    },
  },
})
