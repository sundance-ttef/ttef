import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

// The project id is not a secret — it ships in the client bundle of every
// Sanity studio. Defaulting to it here means a fresh clone works with no .env.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || '5yz712qe'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineConfig({
  name: 'ttef',
  title: 'Twin Trails Education Foundation',
  projectId,
  dataset,
  plugins: [
    structureTool({
      /**
       * The sidebar is the whole interface for most people here, so it is
       * ordered by how often each thing is edited rather than alphabetically.
       * "Campaign & goal" is a singleton — one document, opened directly, with
       * no list in front of it and no way to create a second one.
       *
       * "Dine out nights" and "One-off events" are separate types rather than
       * two views of one. They are the same SHAPE, but a shared type needed
       * three conditionally hidden fields, three conditional validations, and
       * descriptions that had to address both readers at once — so someone
       * adding a one-off was told what to enter "for a dine out night".
       */
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Campaign & goal')
              .id('siteSettings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.divider(),
            S.documentTypeListItem('dineOutNight').title('Dine out nights'),
            S.documentTypeListItem('volunteerSignup').title('Volunteer sign-ups'),
            S.divider(),
            S.documentTypeListItem('tradition').title('Recurring events'),
            S.documentTypeListItem('oneOffEvent').title('One-off events'),
            S.documentTypeListItem('sponsor').title('Sponsors'),
            S.divider(),
            // Split the same way the About page is: one folder per roster, so
            // the Studio matches what an editor is looking at on the site.
            ...(
              [
                ['Foundation board', 'foundation'],
                ['PAC chairs', 'pac'],
              ] as const
            ).map(([title, org]) =>
              S.listItem()
                .title(title)
                .id(`board-${org}`)
                .schemaType('boardPosition')
                .child(
                  S.documentTypeList('boardPosition')
                    .title(title)
                    .filter('_type == "boardPosition" && org == $org')
                    .params({org})
                    .defaultOrdering([{field: 'order', direction: 'asc'}])
                    .initialValueTemplates([
                      S.initialValueTemplateItem('boardPosition-in-org', {org}),
                    ]),
                ),
            ),
          ]),
    }),
    visionTool({defaultApiVersion: '2024-10-01'}),
  ],
  schema: {
    types: schemaTypes,
    templates: (prev) => [
      /**
       * `siteSettings` is created once by the seed script; hide it from the
       * global "create new" menu so nobody makes a second competing copy.
       *
       * `boardPosition` is hidden from it for a different reason: a seat's
       * roster is read-only and comes from the folder it was created in, so one
       * made from the global menu would be stuck on whichever roster the
       * default happened to name. Removing it here leaves the two roster
       * folders as the only way in, and each pre-fills its own org. The
       * parameterised template below is unaffected — it takes an argument, so
       * it never appears in the global menu anyway.
       */
      ...prev.filter((t) => !['siteSettings', 'boardPosition'].includes(t.schemaType)),
      {
        id: 'boardPosition-in-org',
        title: 'Board position on one roster',
        schemaType: 'boardPosition',
        parameters: [{name: 'org', type: 'string'}],
        value: ({org}: {org: string}) => ({org}),
      },
    ],
  },
  document: {
    actions: (prev, {schemaType}) =>
      schemaType === 'siteSettings'
        ? prev.filter(({action}) => action !== 'unpublish' && action !== 'delete' && action !== 'duplicate')
        : prev,
  },
})
