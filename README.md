# Twin Trails Education Foundation

The website for the Twin Trails Education Foundation, which supports
[Sundance Elementary](https://sundance.powayusd.com/) in Poway Unified.

Built with [Astro](https://astro.build) as a static site — real HTML at real URLs,
no client-side routing, and no JavaScript framework. The only scripts on the page are
the mobile menu and the sponsor rail; if they fail, every page still works.

## Running it

```sh
npm install
npm run dev      # local dev server
npm run build    # static output into dist/
npm run preview  # serve the built output
```

## Content: who edits what, and where

Content that changes during the year lives in **Sanity**. Board members edit it at
[twintrailsfoundation.org/admin](https://sundance-ttef.netlify.app/admin), which
redirects to the Studio at `ttef.sanity.studio`. Login is Google, GitHub, **or
email + password** — no GitHub account required.

| Edited in Sanity | Still in code |
|---|---|
| Campaign goal, raised, last-updated | Payment destinations (`src/data/giving.ts`) |
| Calendar events, dine-out nights | Navigation structure (`src/data/nav.ts`) |
| Volunteer sign-ups | Sponsorship tier prices |
| Sponsors (name, tier, logo) | Every page layout |
| Annual events (blurbs, photos, links) | Board roster |

**Payment links are deliberately not editable.** A typo in a CMS field routes real
donations to the wrong place with no review step. Changing them should require a
commit someone can see.

Content is fetched at **build time** and baked into the HTML, so visitors never talk
to Sanity: no runtime dependency, no per-visitor API cost, and the site keeps serving
if Sanity is down. The trade-off is that publishing does not change the site until a
rebuild runs — see the build hook below.

Two things behave on their own, by design, so nobody has to maintain them:
past calendar events disappear, and the next dine-out night marks itself "next up".

### Editing the Studio itself

```sh
cd studio
npm install
npm run dev      # Studio at localhost:3333 against the live dataset
npm run deploy   # publish to ttef.sanity.studio
```

Schema changes need `npm run deploy` to reach editors. Document ids must use
hyphens, never dots — Sanity reserves a dotted prefix for drafts (`drafts.x`) and
content releases, so `sponsor.barron` is read as a *version* of a document called
`barron`: it imports without error and the CLI lists it, but every perspective the
site queries with returns nothing.

## Layout

```
src/
  data/nav.ts        navigation tree, social links, and org facts (EIN, address,
                     emails, Zoom link) — change them here, not in the pages
  data/giving.ts     live payment destinations — treat edits as money changes
  lib/sanity.ts      the CMS connection and every query the site makes
  layouts/Base.astro page shell: head, header, footer, menu scripts
  components/        Header, Footer, Sponsors
  pages/             one file per URL (index.astro -> /)
  styles/global.css  design tokens and component styles
public/img/          photography, logos, sponsor marks
studio/              Sanity Studio: schemas, and the one-time migration script
```

Adding a page means adding a file under `src/pages/` and an entry in `src/data/nav.ts`.

## Conventions worth keeping

- **Colour carries meaning.** Maroon `#75143F` is the Foundation, teal `#008080` is
  PAC, and gold marks sponsorship. Don't use them decoratively — mixing them implies
  something owns something it doesn't.
- **"Parent Activities Committee"**, plural. Never "Activity".
- The legal name is **Twin Trails Education Foundation** (EIN 20‑1105904). It appears
  on tax receipts and in the footer.

## Related

Working material — the archived WordPress site, content inventory, design decisions,
and the clickable prototype — lives in a separate private repo, `ttef-resources`,
so this one stays limited to what actually ships.
