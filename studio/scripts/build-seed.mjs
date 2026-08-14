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
const img = (rel) => {
  const abs = resolve(IMG, rel)
  if (!existsSync(abs)) throw new Error(`seed image missing: ${abs}`)
  return {_type: 'image', _sanityAsset: `image@file://${abs}`}
}

const docs = []

// ---------------------------------------------------------------- campaign
docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  schoolYear: '2026–27',
  goal: 111944,
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
// Order is the school year, which is also the order the Events menu uses.
const traditions = [
  ['book-fair', 'Book Fair', 'October', 'pac', 'A week of books in the library, with proceeds coming back to Sundance.', ['events/book-fair.jpg']],
  ['carnival', 'Fall Carnival', 'October', 'pac', 'Games, food, and the biggest family night of the fall.', []],
  ['multicultural-night', 'Multicultural Night', 'January', 'pac', 'Families share the food, dress, music, and traditions of home.', []],
  ['auction', 'Spring Auction', 'February', 'foundation', 'An evening out for the grown-ups. The 2024 auction raised over $10,500.', ['gala/gala-1.jpg', 'gala/gala-2.jpg', 'gala/gala-3.jpg']],
  ['fun-run', 'Fun Run', 'March', 'foundation', 'Students collect pledges and run. School-wide goals unlock celebrations.', ['events/fun-run-1.jpg', 'events/fun-run-2.jpg', 'events/fun-run-3.jpg', 'events/fun-run-4.jpg']],
  ['talent-show', 'Talent Show', 'Spring', 'pac', 'Auditions, rehearsals, and a night on stage.', ['events/talent-show-1.jpg', 'events/talent-show-2.jpg', 'events/talent-show-3.jpg', 'events/talent-show-4.jpg']],
  ['senior-clap-out', 'Senior Clap Out', 'June', 'pac', 'Sundance alumni come back to walk the halls one last time.', []],
  ['dine-out', 'Dine Out Nights', 'Monthly', 'pac', 'Eat out on a set night and the restaurant sends a share back to Sundance.', []],
]
traditions.forEach(([slug, title, monthLabel, org, summary, photos], i) => {
  docs.push({
    _id: `tradition-${slug}`,
    _type: 'tradition',
    title,
    slug: {_type: 'slug', current: slug},
    monthLabel,
    order: i + 1,
    org,
    summary,
    ...(photos.length ? {photos: photos.map((p) => ({...img(p), _key: p.replace(/\W/g, '')}))} : {}),
  })
})

// ------------------------------------------------------------- occurrences
// The school year runs Aug–Jun, so Aug–Dec are 2026 and Jan–Jun are 2027.
const yearFor = (mon) => (['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'].includes(mon) ? 2027 : 2026)
const MONTHS = {JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12}
const iso = (mon, day) =>
  `${yearFor(mon)}-${String(MONTHS[mon]).padStart(2, '0')}-${String(day).padStart(2, '0')}`

// [month, day, name, time, org, tradition slug, description (home card only)]
const occurrences = [
  ['AUG', 13, 'Back to School Night', '5:30 – 7:00 PM', 'school', null],
  ['AUG', 21, 'VAPA', '', 'school', null],
  ['AUG', 28, 'Friday Flag', '8:00 – 8:30 AM', 'school', null],
  ['SEP', 11, 'Back to School Dance', '5:30 – 7:30 PM', 'pac', null,
   'The first big family night of the year. Music, dancing, and a chance to meet your Wildcat\u2019s new classmates.'],
  ['SEP', 14, 'Monthly PAC Meeting', '6:00 – 7:00 PM · Library', 'pac', null],
  ['SEP', 14, 'Monthly Foundation Meeting', '7:00 – 8:00 PM · Library + Zoom', 'foundation', null,
   'Second Monday of every month in the Sundance Library, with Zoom. Everyone is welcome, and there\u2019s always an open forum.'],
  ['SEP', 19, 'Bike Rodeo', '10:00 AM – 12:00 PM', 'pac', null,
   'A morning of bike safety, skills, and games on campus for riders of every age and confidence level.'],
  ['SEP', 22, 'Picture Day', '', 'school', null],
  ['OCT', 5, 'Book Fair — all week', 'Oct 5 – 9', 'pac', 'book-fair'],
  ['OCT', 12, 'Monthly PAC Meeting', '6:00 – 7:00 PM · Library', 'pac', null],
  ['OCT', 12, 'Monthly Foundation Meeting', '7:00 – 8:00 PM · Library + Zoom', 'foundation', null],
  ['OCT', 23, 'Fall Carnival', '5:30 – 7:30 PM', 'pac', 'carnival'],
]
occurrences.forEach(([mon, day, name, time, org, tradition, description], i) => {
  docs.push({
    _id: `occurrence-${i}`,
    _type: 'occurrence',
    name,
    date: iso(mon, day),
    ...(time ? {time} : {}),
    org,
    // Anything with a home-page blurb is one of the three featured cards.
    ...(description ? {description, featured: true} : {}),
    ...(tradition ? {tradition: {_type: 'reference', _ref: `tradition-${tradition}`}} : {}),
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

const out = resolve(here, 'seed.ndjson')
writeFileSync(out, docs.map((d) => JSON.stringify(d)).join('\n') + '\n')

const counts = docs.reduce((a, d) => ((a[d._type] = (a[d._type] || 0) + 1), a), {})
console.log(`wrote ${docs.length} documents -> ${out}`)
for (const [t, n] of Object.entries(counts)) console.log(`  ${n.toString().padStart(3)}  ${t}`)
