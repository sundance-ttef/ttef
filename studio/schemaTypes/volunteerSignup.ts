import {defineField, defineType} from 'sanity'
import {ORGS} from './occurrence'

/**
 * A current volunteer sign-up on /volunteer/.
 *
 * These go up before the sheet exists more often than not, so `url` is
 * optional: with no link the card reads "sign-up sheet coming soon" instead of
 * offering a dead button. Deleting the document is how a sign-up comes down.
 */
export default defineType({
  name: 'volunteerSignup',
  title: 'Volunteer sign-up',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'e.g. Garden Club, Back to School Dance',
      validation: (r) => r.required(),
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
      name: 'when',
      title: 'When',
      type: 'string',
      description: 'Free text, e.g. "Fridays, 8–10 AM" or "Sep 11". Leave empty if not set.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'url',
      title: 'Sign-up link',
      type: 'url',
      description:
        'SignUpGenius, a Google Form, anything. Leave empty and the card says the sheet is coming soon.',
      validation: (r) => r.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Low numbers first.',
      initialValue: 0,
    }),
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', when: 'when', url: 'url'},
    prepare({title, when, url}) {
      return {title, subtitle: [when, url ? 'has link' : 'coming soon'].filter(Boolean).join(' · ')}
    },
  },
})
