import {defineField, defineType} from 'sanity'

export const TIERS = [
  {title: 'Platinum — $1,600', value: 'platinum'},
  {title: 'Gold — $1,000', value: 'gold'},
  {title: 'Silver — $500', value: 'silver'},
  {title: 'Bronze — $250', value: 'bronze'},
]

/**
 * A corporate sponsor. Appears in two places from this one document: the
 * scrolling rail on the home page and the tiered wall on /support/.
 *
 * A tier with no sponsors never renders, so removing the last Bronze sponsor
 * removes the Bronze row rather than leaving an empty band.
 */
export default defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Business name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'tier',
      title: 'Sponsorship level',
      type: 'string',
      options: {list: TIERS, layout: 'radio'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'url',
      title: 'Website',
      type: 'url',
      description: 'Must start with https:// — a bare domain will not link correctly.',
      validation: (r) => r.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description:
        'A wide logo on a white or transparent background works best — it sits in a light box and is never cropped.',
      options: {hotspot: false},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order within the tier',
      type: 'number',
      description: 'Low numbers first. Ties fall back to alphabetical.',
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: 'Tier, then order',
      name: 'tierOrder',
      by: [
        {field: 'tier', direction: 'asc'},
        {field: 'order', direction: 'asc'},
        {field: 'name', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {title: 'name', tier: 'tier', media: 'logo'},
    prepare({title, tier, media}) {
      const label = TIERS.find((t) => t.value === tier)?.title ?? tier
      return {title, subtitle: label, media}
    },
  },
})
