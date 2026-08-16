// @ts-check
import { defineConfig } from 'astro/config';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const FEED_URL =
  'https://calendar.google.com/calendar/ical/twintrailsfoundation%40gmail.com/public/basic.ics';

/**
 * Bake the school calendar's hash into the deployed site. The
 * calendar-sync workflow compares the live feed's hash against this
 * file and only fires a rebuild when they differ — the deployed site
 * is the record of what it was last built from, so no external state
 * is needed. A failed fetch bakes 'unknown', which differs from any
 * real hash and simply triggers one extra rebuild next check.
 *
 * The hash must be CANONICAL: Google serves the feed with events in a
 * different order on every request and stamps each response with a
 * fresh DTSTAMP, so a raw hash differs on every fetch even when nothing
 * changed (measured: 7,174 diff lines between consecutive fetches).
 * Strip the stamp and sort the lines — the same canonicalization the
 * workflow applies — so only real edits move the hash.
 */
const canonicalize = (ics) =>
  ics
    .split('\n')
    .filter((line) => !line.startsWith('DTSTAMP'))
    .sort()
    .join('\n');

const calendarHash = {
  name: 'calendar-hash',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      let hash = 'unknown';
      try {
        const res = await fetch(FEED_URL);
        if (res.ok) {
          hash = createHash('sha256').update(canonicalize(await res.text())).digest('hex');
        }
      } catch {
        // A failed fetch must not break the build; 'unknown' stands.
      }
      await writeFile(new URL('calendar-hash.txt', dir), hash);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  integrations: [calendarHash],
});
