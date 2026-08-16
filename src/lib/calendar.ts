/**
 * Upcoming dates, read from the school's public Google Calendar at build time.
 *
 * The calendar is the single source of truth for dates: the PAC already keeps
 * it up to date, /calendar/ embeds it, and this module reads the same feed so
 * nothing has to be typed twice. Sanity owns the events that have PAGES; the
 * calendar owns when things happen.
 *
 * Two things make ICS parsing easy to get quietly wrong, so both are handled
 * explicitly here:
 *
 * 1. RECURRENCE. A monthly meeting is one VEVENT with an RRULE that has to be
 *    expanded into real dates, respecting UNTIL and EXDATE. The feed carries
 *    four superseded "Monthly Foundation Meeting" series whose UNTIL has
 *    passed; only the open-ended one should produce dates. Hand-rolling this
 *    is where naive parsers break, so `node-ical` does it.
 *
 * 2. TIME ZONE. A 7pm Pacific meeting is the NEXT DAY in UTC, so reading the
 *    UTC date turns "second Monday" into Tuesday. All-day events have the
 *    mirror-image bug: their timestamp is midnight UTC, and converting THAT to
 *    Pacific moves them a day earlier. Timed events are therefore formatted in
 *    school time, and all-day events are read as plain calendar dates.
 */
import ical from 'node-ical';

const FEEDS = [
  // The school's public calendar — the single source of truth for dates.
  'https://calendar.google.com/calendar/ical/twintrailsfoundation%40gmail.com/public/basic.ics',
];

const TZ = 'America/Los_Angeles';

export interface CalendarEvent {
  /** Local calendar date, YYYY-MM-DD, in school time. */
  date: string;
  title: string;
  /** e.g. "6 PM". Empty for all-day events. */
  time: string;
  /** e.g. "7 PM". Empty for all-day events and for entries with no DTEND. */
  endTime: string;
  allDay: boolean;
  /** Plain-text body of the calendar entry, HTML stripped. May be ''. */
  description: string;
  /** Plain-text LOCATION field. May be ''. */
  location: string;
}

/**
 * Calendar descriptions arrive as HTML-ish text with ICS escapes and folded
 * lines; locations come with escaped commas. Families read both, so both are
 * cleaned here rather than at every call site. Zoom URLs are stripped from
 * descriptions — the card already links the whole meeting to the room, and a
 * bare URL mid-sentence is noise.
 */
const clean = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\\,/g, ',')
    .replace(/\\n/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** YYYY-MM-DD for an instant, as it reads on a clock in `tz`. */
const localDate = (d: Date, tz: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

const localTime = (d: Date, tz: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  })
    .format(d)
    .replace(':00', '');

/**
 * Titles that mean something to staff but not to a family scanning the home
 * page. They still appear on /calendar/ — and on the home page when they
 * land before the first headline event, so a quiet stretch never reads as
 * "nothing happening". Matched case-insensitively against the whole title.
 */
const NOT_HEADLINE = [/^vapa$/i, /^friday flag$/i];

/** True for the routine staff entries the home page treats as gap-fillers. */
export const isRoutine = (title: string) => NOT_HEADLINE.some((re) => re.test(title));

/**
 * How a time slot reads. An all-day event has no clock time, and leaving the
 * slot blank looks like missing data rather than a deliberate all-day entry —
 * "No School" and "VAPA" are all-day by nature, not incomplete. A timed event
 * with an end time reads as a range, with the AM/PM marker kept on the end
 * only ("8–8:30 AM", "6–7 PM") because repeating it is the noise, not the
 * information.
 */
export const timeLabel = (e: {time: string; endTime: string; allDay: boolean}) => {
  if (e.allDay || !e.time) return 'All day';
  if (!e.endTime) return e.time;
  const start = e.time.replace(/ (AM|PM)$/, '');
  return `${start}–${e.endTime}`;
};

/**
 * Who runs a calendar entry, inferred from its title. The calendar has no
 * owner field, and defaulting everything to "School" mislabels the PAC and
 * Foundation meetings, which is the one thing the coloured tag exists to say.
 */
export const orgOf = (title: string): 'pac' | 'foundation' | 'school' => {
  if (/foundation/i.test(title)) return 'foundation';
  // PAC runs these but rarely says so in the calendar entry's title.
  if (/\bpac\b|dine\s*out|carnival|book fair|spirit|dance/i.test(title)) return 'pac';
  return 'school';
};

/**
 * Both the PAC and the Foundation monthly meetings are on Zoom, so any entry
 * that is a meeting carries the join link. This is why /calendar/ no longer
 * needs a standing "join a meeting" block: the link sits on the meeting
 * itself, beside the date it applies to.
 */
export const isZoomMeeting = (title: string) => /\bmeetings?\b/i.test(title);

export interface PlaceParts {
  /** "Ike's Love & Sandwiches" — the part before the street number. */
  name: string;
  /** "14827 Pomerado Rd, Poway" — from the first digit on, trimmed of
      state/zip/country tail, which nobody reads on a card. */
  addr: string;
  /** The untouched LOCATION string, for the Maps query. */
  raw: string;
}

/**
 * Google LOCATION is one freeform string — "Ike's love & sandwiches 14827
 * Pomerado Rd, Poway, CA 92064, USA" — with no separator between the place
 * name and the address. The split point is the first digit: nothing before a
 * street number is part of an address, and everything from it on is. A
 * location with no digits ("Sundance Elementary - Library") is a name only.
 */
export const splitLocation = (loc: string): PlaceParts => {
  const i = loc.search(/\d/);
  if (i < 0) return {name: loc, addr: '', raw: loc};
  const name = loc.slice(0, i).replace(/[,\s]+$/, '');
  const addr = loc
    .slice(i)
    .replace(/, USA$/, '')
    .replace(/, CA \d{5}$/, '');
  return {name, addr, raw: loc};
};

/** A Google Maps search link for a freeform location string. */
export const mapsUrl = (loc: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;

/**
 * Link a calendar entry to an event page when it is clearly the same thing.
 *
 * The calendar title is freeform — someone types "Dine Out - IKE'S Love &
 * Sandwich Shop" into Google Calendar while Sanity holds "Ike's Love &
 * Sandwiches" — so exact containment can never bridge the two. The test is
 * word overlap: every significant word of the SHORTER title must appear in
 * the longer one. "Book Fair" matches "Book Fair - all week" (its words are
 * a subset), and "Ike's Love & Sandwiches" matches the calendar's longer
 * form for the same reason; stopwords and one-word drifts like "shop" vs
 * "sandwiches" cannot break it, while two genuinely different events share
 * too few words to collide.
 */
export function matchEvent<T extends {title: string; slug: string}>(
  calendarTitle: string,
  events: T[],
): T | null {
  const STOP = new Set(['the', 'a', 'an', 'and', 'of', 'at', 'in', 'on', 'night', 'nights', 'out']);
  const words = (s: string) =>
    new Set(
      s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ')
        // Crude singular/plural fold for comparison only: "sandwiches" and
        // "sandwich" must not break a match. -ch/-sh/-ss/-x words lose "es",
        // others lose a bare trailing "s". Over-strips ("series" → "serie")
        // but identically on both sides, which is all equality needs.
        .map((w) => w.replace(/(ch|sh|ss|x)es$/, '$1').replace(/s$/, ''))
        .filter((w) => w && !STOP.has(w)),
    );
  const t = words(calendarTitle);
  if (t.size === 0) return null;
  return (
    events.find((e) => {
      const n = words(e.title);
      if (n.size === 0) return false;
      const [small, big] = n.size <= t.size ? [n, t] : [t, n];
      return [...small].every((w) => big.has(w));
    }) ?? null
  );
}

export async function getCalendarEvents(
  { days = 150 } = {},
): Promise<CalendarEvent[]> {
  // All feeds are read and merged; the sort below interleaves them by date.
  // A feed being unreachable must not break a deploy NOR silence the others —
  // each fails independently and the pages fall back on whatever remains.
  const feeds = await Promise.all(
    FEEDS.map(async (url) => {
      try {
        return (await ical.async.fromURL(url)) as Record<string, any>;
      } catch (err) {
        console.warn('[calendar] could not read a Google Calendar feed:', err);
        return {} as Record<string, any>;
      }
    }),
  );

  const now = new Date();
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const out: CalendarEvent[] = [];

  for (const item of feeds.flatMap((data) => Object.values(data))) {
    if (!item || item.type !== 'VEVENT' || !item.start) continue;
    const allDay = item.datetype === 'date';
    const title = String(item.summary ?? '').replace(/\\,/g, ',').trim();
    if (!title) continue;

    const description = clean(String(item.description ?? ''));
    const location = clean(String(item.location ?? ''));
    /* The duration lives on the master event; rrule.between() yields START
       instants only, so each occurrence's end is start + duration. An
       all-day event's DTEND is the next midnight — a calendar convention,
       not a time anyone plans around — so endTime stays empty for those. */
    const startMs = new Date(item.start).getTime();
    const endMs = item.end ? new Date(item.end).getTime() : NaN;
    const duration = Number.isFinite(endMs) ? endMs - startMs : 0;

    const push = (instant: Date) => {
      // An all-day event's timestamp is midnight UTC and is not a moment in
      // time — converting it to Pacific would move it back a day.
      const date = allDay ? instant.toISOString().slice(0, 10) : localDate(instant, TZ);
      const end = !allDay && duration > 0 ? new Date(instant.getTime() + duration) : null;
      out.push({
        date,
        title,
        time: allDay ? '' : localTime(instant, TZ),
        endTime: end ? localTime(end, TZ) : '',
        allDay,
        description,
        location,
      });
    };

    if (item.rrule) {
      const skip = new Set(
        Object.values(item.exdate ?? {}).map((d: any) => new Date(d).toDateString()),
      );
      for (const occurrence of item.rrule.between(now, until, true)) {
        if (!skip.has(occurrence.toDateString())) push(occurrence);
      }
    } else {
      const start = new Date(item.start);
      if (start >= now && start <= until) push(start);
    }
  }

  // Same day, earlier time first; all-day events lead the day.
  return out.sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date < b.date ? -1 : 1,
  );
}
