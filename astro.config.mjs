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
 * The hash must be CANONICAL and tool-independent. Google serves the
 * feed with events in a different order on every request and stamps
 * each response with a fresh DTSTAMP, so a raw hash differs on every
 * fetch even when nothing changed (measured: 7,174 diff lines between
 * consecutive fetches). Sorting lines does NOT fix it: ICS folds long
 * lines with a leading space, and sort orders space-first, so the
 * shell's and Node's sorts land folded lines in different places.
 * Instead each line is hashed and the line-hashes sorted — order of
 * the input cannot affect the result, and the workflow computes it
 * identically (sha256sum per line | sort | sha256sum).
 */
const canonicalHash = (ics) => {
  const lines = ics
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line && !line.startsWith('DTSTAMP'));
  const lineHashes = lines
    .map((line) => createHash('sha256').update(line).digest('hex'))
    .sort()
    .join('\n');
  // The trailing newline matches the workflow's pipe into sha256sum —
  // without it the outer hashes differ even when every line-hash agrees.
  return createHash('sha256').update(lineHashes + '\n').digest('hex');
};

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
