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

## Layout

```
src/
  data/nav.ts        navigation tree, social links, and org facts (EIN, address,
                     emails, Zoom link) — change them here, not in the pages
  layouts/Base.astro page shell: head, header, footer, menu scripts
  components/        Header, Footer, Sponsors
  pages/             one file per URL (index.astro -> /)
  styles/global.css  design tokens and component styles
public/img/          photography, logos, sponsor marks
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
