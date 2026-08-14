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
      name: 'budget',
      title: 'What the money pays for',
      type: 'array',
      description:
        'The line-item budget shown on Our Impact. THE FUNDRAISING GOAL IS THE SUM OF THESE — there is no separate goal to keep in step, so editing a line here updates the goal, the progress bars and the per-student ask everywhere on the site. Drag to reorder; the site shows them in this order.',
      validation: (r) => r.required().min(1),
      of: [
        {
          type: 'object',
          name: 'budgetLine',
          fields: [
            {
              name: 'label',
              title: 'What it is',
              type: 'string',
              description: 'e.g. Math + STEAM Impact Aide',
              validation: (r: any) => r.required(),
            },
            {
              name: 'note',
              title: 'Detail',
              type: 'string',
              description:
                'Optional, shown in italics after the label — a staff name, or what it covers. No brackets needed.',
            },
            {
              name: 'amount',
              title: 'Amount (whole dollars)',
              type: 'number',
              description: 'No commas or dollar sign.',
              validation: (r: any) => r.required().min(0).integer(),
            },
          ],
          preview: {
            select: {label: 'label', note: 'note', amount: 'amount'},
            prepare({label, note, amount}: any) {
              return {
                title: `${label}${note ? ` (${note})` : ''}`,
                subtitle: '$' + (amount ?? 0).toLocaleString('en-US'),
              }
            },
          },
        },
      ],
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
    select: {year: 'schoolYear', raised: 'raised', budget: 'budget'},
    prepare({year, raised, budget}) {
      const usd = (n: number) => '$' + (n ?? 0).toLocaleString('en-US')
      const goal = (budget ?? []).reduce((t: number, b: any) => t + (b?.amount ?? 0), 0)
      const pct = goal ? Math.round(((raised ?? 0) / goal) * 100) : 0
      return {title: `${year} campaign`, subtitle: `${usd(raised)} of ${usd(goal)} — ${pct}%`}
    },
  },
})
