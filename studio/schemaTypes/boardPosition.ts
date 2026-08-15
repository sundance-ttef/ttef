import {defineField, defineType} from 'sanity'
import {ORGS} from './orgs'

/**
 * One seat on the Foundation board or among the PAC chairs — filled or open.
 *
 * The SEAT is the document, not the person. A board's structure is the durable
 * fact and the people rotate through it, the same way an annual event's name is
 * durable and its date is this year's detail. So a year's turnover is editing
 * who holds a seat, not deleting and recreating a roster.
 *
 * `holder` empty is what makes a seat OPEN. That is the whole mechanism, and it
 * is why open positions are not a separate list: when the two were separate,
 * filling a role took two edits in two places — add the person, remember to
 * delete the advertisement — and nothing stopped a seat from being both filled
 * and advertised as vacant. One field cannot disagree with itself.
 *
 * A seat with no holder is always shown as open, even if it is marked to be
 * featured: there is no name and no face to put on a large card, so assignment
 * decides where it renders and `featured` only ranks it once it is filled.
 */
export default defineType({
  name: 'boardPosition',
  title: 'Board position',
  type: 'document',
  fields: [
    defineField({
      name: 'role',
      title: 'Position',
      type: 'string',
      description:
        'The seat itself — President, Treasurer, Board Member, Fall Carnival Co-Chair. Someone holding two can put both here, separated by "&".',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'org',
      title: 'Roster',
      type: 'string',
      description:
        'Set by the folder this seat was created in. A seat belongs to one roster for good — if someone moves between them, empty their old seat and fill one on the other roster rather than moving this.',
      // A board seat is Foundation or PAC; "School" is on the shared list for
      // events the school itself runs and has no roster of its own.
      options: {list: ORGS.filter((o) => o.value !== 'school'), layout: 'radio'},
      validation: (r) => r.required(),
      initialValue: 'foundation',
      /**
       * Shown but not editable. The sidebar folder already decided this and
       * pre-fills it, so asking again was a question with a known answer — and
       * an answerable one, which meant a wrong click could file a seat into the
       * roster the editor was not looking at, where they would never find it.
       */
      readOnly: true,
    }),
    defineField({
      name: 'holder',
      title: 'Who holds it',
      type: 'string',
      description:
        'Their name, as they want it shown to families. LEAVE EMPTY and the seat moves to "Open positions" on its own — that is the only thing you have to change when someone steps down.',
    }),
    defineField({
      name: 'photo',
      title: 'Headshot',
      type: 'image',
      description:
        'Only shown on the seats marked below. Cropped to a circle, so set the hotspot on the face. Leave empty and their initials show instead.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'featured',
      title: 'Show at the top, with a photo',
      type: 'boolean',
      description:
        'For the officers — usually the President and Vice President. The top row is a two-across grid, so more than two will wrap and look unbalanced. Ignored while the seat is open.',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Position in the list',
      type: 'number',
      description:
        'Low numbers first. President 1, Vice President 2, and so on. Without this the list falls back to alphabetical, which puts the Treasurer above the President.',
      validation: (r) => r.required(),
      initialValue: 1,
    }),
    defineField({
      name: 'description',
      title: 'What the role involves',
      type: 'text',
      rows: 2,
      description:
        'Shown only while the seat is OPEN, to tell someone what they would be taking on — "Manage and oversee finances alongside the Treasurer." Worth filling in before you need it.',
    }),
  ],
  orderings: [
    {
      title: 'Roster order',
      name: 'roster',
      by: [{field: 'org', direction: 'asc'}, {field: 'order', direction: 'asc'}],
    },
  ],
  preview: {
    select: {role: 'role', holder: 'holder', featured: 'featured', media: 'photo'},
    prepare({role, holder, featured, media}) {
      return {
        // The SEAT is the title, because the seat is what this document is.
        // Putting the holder here instead read as "Board position: Chantal
        // Hebert" — a person filed under a type that is not a person.
        //
        // The org is deliberately left out: the sidebar already splits these
        // into one folder per roster, so repeating it in every row is noise.
        title: role,
        subtitle: holder
          ? `${holder}${featured ? ' · top of the page' : ''}`
          : 'Open position',
        media,
      }
    },
  },
})
