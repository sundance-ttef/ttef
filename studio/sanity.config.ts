import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

// The project id is not a secret — it ships in the client bundle of every
// Sanity studio. Defaulting to it here means a fresh clone works with no .env.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || '5yz712qe'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

/**
 * The series that Dine Out Nights hang off. Document ids here are deterministic
 * (`tradition-<slug>`), set by the seed, so this is stable — but the list below
 * FILTERS on the slug rather than the id, which survives a re-seed. The id is
 * needed only to pre-fill the reference on a newly created night.
 */
const DINE_OUT_ID = 'tradition-dine-out'

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
       * "Dine out nights" and "One-off events" are two views of the SAME type,
       * split by whether the event belongs to a series. Folders here are a
       * reading of the data, not a property of it — which is what lets a
       * second series get its own folder later without a schema change.
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
            S.listItem()
              .title('Dine out nights')
              .id('dineOutNights')
              .schemaType('datedEvent')
              .child(
                S.documentTypeList('datedEvent')
                  .title('Dine out nights')
                  .filter('_type == "datedEvent" && series->slug.current == $series')
                  .params({series: 'dine-out'})
                  .defaultOrdering([{field: 'order', direction: 'asc'}])
                  // Creating from inside the folder pre-fills the series, so it
                  // behaves like a folder rather than a saved search.
                  .initialValueTemplates([
                    S.initialValueTemplateItem('datedEvent-in-series', {seriesId: DINE_OUT_ID}),
                  ]),
              ),
            S.documentTypeListItem('volunteerSignup').title('Volunteer sign-ups'),
            S.divider(),
            S.documentTypeListItem('tradition').title('Recurring events'),
            S.listItem()
              .title('One-off events')
              .id('oneOffEvents')
              .schemaType('datedEvent')
              .child(
                S.documentTypeList('datedEvent')
                  .title('One-off events')
                  .filter('_type == "datedEvent" && !defined(series)')
                  .defaultOrdering([{field: 'date', direction: 'desc'}])
                  .initialValueTemplates([S.initialValueTemplateItem('datedEvent-one-off')]),
              ),
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
      ...prev.filter((t) => !['siteSettings', 'boardPosition', 'datedEvent'].includes(t.schemaType)),
      {
        id: 'datedEvent-in-series',
        title: 'Dated event in a series',
        schemaType: 'datedEvent',
        parameters: [{name: 'seriesId', type: 'string'}],
        value: ({seriesId}: {seriesId: string}) => ({
          series: {_type: 'reference', _ref: seriesId},
        }),
      },
      {
        // A dated event with no series: the folder is the only way to make one,
        // now that `series` is read-only and a globally created event would be
        // stuck with whatever the default happened to be.
        id: 'datedEvent-one-off',
        title: 'One-off event',
        schemaType: 'datedEvent',
        value: {},
      },
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
