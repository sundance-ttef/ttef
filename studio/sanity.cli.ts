import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || '5yz712qe',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  /** `npm run deploy` publishes to <studioHost>.sanity.studio */
  studioHost: 'ttef',
  deployment: {
    appId: 'nfnpy9nyvu8ebi3t4x17fzkz',
  },
  autoUpdates: true,
})
