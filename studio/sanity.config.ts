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
            S.documentTypeListItem('occurrence').title('Calendar events'),
            S.documentTypeListItem('dineOutNight').title('Dine out nights'),
            S.documentTypeListItem('volunteerSignup').title('Volunteer sign-ups'),
            S.divider(),
            S.documentTypeListItem('tradition').title('Annual events'),
            S.documentTypeListItem('sponsor').title('Sponsors'),
          ]),
    }),
    visionTool({defaultApiVersion: '2024-10-01'}),
  ],
  schema: {
    types: schemaTypes,
    // The singleton is created once by the seed script; hide it from the
    // global "create new" menu so nobody makes a second competing copy.
    templates: (prev) => prev.filter((t) => t.schemaType !== 'siteSettings'),
  },
  document: {
    actions: (prev, {schemaType}) =>
      schemaType === 'siteSettings'
        ? prev.filter(({action}) => action !== 'unpublish' && action !== 'delete' && action !== 'duplicate')
        : prev,
  },
})
