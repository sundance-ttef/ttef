/**
 * Turns the content currently hard-coded in the site into an NDJSON file for
 * `sanity dataset import`.
 *
 * Import is used rather than a client + write token because it needs no
 * secrets: it runs on the CLI login you already have, and it can attach the
 * real image files straight off disk via `_sanityAsset`.
 *
 * IDs use hyphens, never dots. Sanity reserves a dotted prefix for drafts
 * (`drafts.x`) and content releases (`versions.r.x`), so an id like
 * `sponsor.barron` is parsed as a VERSION of document `barron` — it imports
 * without error, the CLI lists it, and every perspective the site queries with
 * returns nothing. That failure is silent in both directions.
 *
 * This is a one-time migration. Once the content lives in Sanity, this file is
 * history — re-running it would recreate documents that editors have since
 * changed, so it deliberately uses fixed `_id`s and `createIfNotExists`
 * semantics via `--missing` on the import command.
 */
import {writeFileSync, existsSync} from 'node:fs'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const IMG = resolve(here, '../../public/img')

/** `_sanityAsset` lets the importer upload a local file and wire up the ref. */
const img = (rel, alt) => {
  const abs = resolve(IMG, rel)
  if (!existsSync(abs)) throw new Error(`seed image missing: ${abs}`)
  return {_type: 'image', _sanityAsset: `image@file://${abs}`, ...(alt ? {alt} : {})}
}

const docs = []

// ---------------------------------------------------------------- campaign
// The 2026–27 budget, exactly as /impact/ listed it. The goal is their sum
// (111,944) — it is not stored separately, so the two can never disagree.
const budget = [
  ['Math + STEAM Impact Aide', 'Mrs. Miles', 29645],
  ['Reading Impact Aide', null, 19634],
  ['Fundraising Support', 'Red Envelope, Fun Run, Auction', 16500],
  ['PE Teacher', 'Mrs. Norris', 15815],
  ['School, Classroom + Library Supplies', null, 11500],
  ['Music + Choir Teacher', 'Mrs. Serrano', 6800],
  ['Field Trip Support', null, 4900],
  ['Clubs — Running, Chess, Musical Theater + more', null, 3100],
  ['Business Expenses', 'insurance, taxes, website', 2050],
  ['PAC Support & Student Activities', null, 2000],
]

docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  schoolYear: '2026–27',
  budget: budget.map(([label, note, amount], i) => ({
    _type: 'budgetLine',
    _key: `line${i}`,
    label,
    ...(note ? {note} : {}),
    amount,
  })),
  raised: 0,
  suggestedPerStudent: 275,
  monthlyPlanMonths: 10,
  // `updated` intentionally absent — no date shows until the campaign opens.
})

// ---------------------------------------------------------------- sponsors
const sponsors = [
  ['barron', 'The Barron Team', 'platinum', 'https://thebarronteam.com', 'sp-barron.png'],
  ['dmo', 'Dr. Melanie Orthodontics', 'gold', 'https://www.drmelanieorthodontics.com/', 'sp-dmo.png'],
  ['smilephr', 'Smile PHR', 'gold', 'https://smilephr.com', 'sp-smilephr.png'],
  ['cmdc', 'Carmel Mountain Dental Care', 'gold', 'https://www.carmelmtndentalcare.com/', 'sp-cmdc.png'],
  ['kappel', 'Kappel Realty Group', 'silver', 'https://kappelrealtygroup.com', 'sp-kappel.png'],
]
sponsors.forEach(([id, name, tier, url, logo], i) => {
  docs.push({_id: `sponsor-${id}`, _type: 'sponsor', name, tier, url, order: i, logo: img(logo)})
})

// ------------------------------------------------------------- traditions
// Dates come from what the site already said. Where it only named a month, the
// day is a placeholder and dateConfirmed is FALSE, so the site shows the month
// and "date to be announced" rather than a day nobody has agreed to.
//   [slug, title, date, confirmed, org, summary, photos, showOnEventsPage]
const traditions = [
  ['book-fair', 'Book Fair', '2026-10-05', true, 'pac', 'A week of books in the library, with proceeds coming back to Sundance.', [['events/book-fair.jpg', 'Book Fair banner: read more, learn more, dream more']]],
  ['carnival', 'Fall Carnival', '2026-10-23', true, 'pac', 'Games, food, and the biggest family night of the fall.', []],
  ['multicultural-night', 'Multicultural Night', '2027-01-29', true, 'pac', 'Families share the food, dress, music, and traditions of home.', []],
  ['auction', 'Spring Auction', '2027-02-26', true, 'foundation', 'An evening out for the grown-ups. The 2024 auction raised over $10,500.', [['gala/gala-3.jpg', 'Guests at the 2024 Sundance auction'],
    ['gala/gala-1.jpg', '2024 Sundance auction, photo 1'],
    ['gala/gala-2.jpg', '2024 Sundance auction, photo 2']]],
  ['fun-run', 'Fun Run', '2027-03-26', true, 'foundation', 'Students collect pledges and run. School-wide goals unlock celebrations.', [['events/fun-run-1.jpg', 'Sundance students running in the 2025 Fun Run'],
    ['events/fun-run-2.jpg', '2025 Sundance Fun Run, photo 2'],
    ['events/fun-run-3.jpg', '2025 Sundance Fun Run, photo 3'],
    ['events/fun-run-4.jpg', '2025 Sundance Fun Run, photo 4']]],
  ['talent-show', 'Talent Show', '2027-04-24', false, 'pac', 'Auditions, rehearsals, and a night on stage.', [['events/talent-show-3.jpg', 'Students performing at the 2025 Sundance talent show'],
    ['events/talent-show-1.jpg', '2025 Sundance talent show, photo 1'],
    ['events/talent-show-2.jpg', '2025 Sundance talent show, photo 2'],
    ['events/talent-show-4.jpg', '2025 Sundance talent show, photo 4']]],
  ['senior-clap-out', 'Senior Clap Out', '2027-06-01', true, 'pac', 'Sundance alumni come back to walk the halls one last time.', []],
  // Linked from Support Us, not Events — it is a fundraiser, not a yearly event.
  ['dine-out', 'Dine Out Nights', null, false, 'pac', 'Eat out on a set night and the restaurant sends a share back to Sundance.', [], false],
]
traditions.forEach(([slug, title, date, dateConfirmed, org, summary, photos, onEventsPage]) => {
  docs.push({
    _id: `tradition-${slug}`,
    _type: 'tradition',
    title,
    slug: {_type: 'slug', current: slug},
    ...(date ? {date, dateConfirmed} : {}),
    org,
    summary,
    showOnEventsPage: onEventsPage !== false,
    // First photo is the card cover on the events grid.
    ...(photos.length
      ? {photos: photos.map(([rel, alt]) => ({...img(rel, alt), _key: rel.replace(/\W/g, '')}))}
      : {}),
  })
})

// ----------------------------------------------------------- dine outs
const dineOuts = [
  ['september', 'September', null, 'Details for this year are still being arranged.', null],
  ['october', 'October', null, 'Details for this year are still being arranged.', null],
  ['november', 'November', null,
   'Restaurant to be announced. Mention Sundance and a portion of your check comes back to school.',
   'events/dine-out-november.jpg'],
]
dineOuts.forEach(([id, month, date, blurb, photo], i) => {
  docs.push({
    _id: `dineOut-${id}`,
    _type: 'dineOutNight',
    month,
    order: i + 1,
    ...(date ? {date} : {}),
    ...(blurb ? {blurb} : {}),
    ...(photo ? {photo: img(photo)} : {}),
  })
})

// ------------------------------------------------------ volunteer sign-ups
docs.push({
  _id: 'signup-garden',
  _type: 'volunteerSignup',
  title: 'Garden Club',
  org: 'pac',
  description: 'Help students plant, weed, and tend the school garden.',
  url: 'https://www.signupgenius.com/go/10C0A4FADAB2CA7FFC07-64608483-garden#/',
  order: 0,
})
docs.push({
  _id: 'signup-dance',
  _type: 'volunteerSignup',
  title: 'Back to School Dance',
  org: 'pac',
  // Sep 11 2026 is a Friday — the page said Fri, an earlier draft of this
  // script said Thu. The page was right.
  when: 'Fri, Sep 11 · 5:30–7:30 PM',
  description: 'Setup, snacks, and cleanup shifts for the first family night.',
  order: 1,
})

// Headline figures, lifted from the hand-built pages these replace.
const STATS = {
  auction: [['$10,500+', 'Raised in 2024'], ['Feb 26', '2027 auction'], ['5:30 PM', 'Doors open']],
  'fun-run': [['$30,000', 'School-wide goal'], ['$75', 'Per-student baseline'], ['Mar 26', '2027 event']],
}
for (const d of docs) {
  const slug = d._type === 'tradition' ? d.slug?.current : null
  if (slug && STATS[slug]) {
    d.stats = STATS[slug].map(([value, label], i) => ({_type: 'stat', _key: `s${i}`, value, label}))
  }
}

const out = resolve(here, 'seed.ndjson')
writeFileSync(out, docs.map((d) => JSON.stringify(d)).join('\n') + '\n')

const counts = docs.reduce((a, d) => ((a[d._type] = (a[d._type] || 0) + 1), a), {})
console.log(`wrote ${docs.length} documents -> ${out}`)
for (const [t, n] of Object.entries(counts)) console.log(`  ${n.toString().padStart(3)}  ${t}`)
