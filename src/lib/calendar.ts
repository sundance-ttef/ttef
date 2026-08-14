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

const FEED =
  'https://calendar.google.com/calendar/ical/twintrailsfoundation%40gmail.com/public/basic.ics';

const TZ = 'America/Los_Angeles';

export interface CalendarEvent {
  /** Local calendar date, YYYY-MM-DD, in school time. */
  date: string;
  title: string;
  /** e.g. "6:00 PM". Empty for all-day events. */
  time: string;
  allDay: boolean;
}

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
 * page. They still appear on /calendar/ — this only keeps them out of the
 * three-card summary. Matched case-insensitively against the whole title.
 */
const NOT_HEADLINE = [/^vapa$/i, /^friday flag$/i];

/**
 * Only the Foundation meeting is on Zoom. The PAC meeting that precedes it the
 * same evening is in the library only — that distinction came from the
 * schedule this site replaced, so do not widen it without checking.
 */
/**
 * Who runs a calendar entry, inferred from its title. The calendar has no
 * owner field, and defaulting everything to "School" mislabels the PAC and
 * Foundation meetings, which is the one thing the coloured tag exists to say.
 */
export const orgOf = (title: string): 'pac' | 'foundation' | 'school' =>
  /foundation/i.test(title) ? 'foundation' : /\bpac\b/i.test(title) ? 'pac' : 'school';

/**
 * Both the PAC and the Foundation monthly meetings are on Zoom, so any entry
 * that is a meeting carries the join link. This is why /calendar/ no longer
 * needs a standing "join a meeting" block: the link sits on the meeting
 * itself, beside the date it applies to.
 */
export const isZoomMeeting = (title: string) => /\bmeetings?\b/i.test(title);

/**
 * Link a calendar entry to an event page when it is clearly the same thing.
 * Matching is on normalised text containment rather than equality, because the
 * calendar says "Book Fair" where the site says "Book Fair" but might equally
 * say "Book Fair - all week".
 */
export function matchEvent<T extends {title: string; slug: string}>(
  calendarTitle: string,
  events: T[],
): T | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const t = norm(calendarTitle);
  return (
    events.find((e) => {
      const n = norm(e.title);
      return t === n || t.startsWith(n + ' ') || t.includes(n);
    }) ?? null
  );
}

export async function getCalendarEvents(
  { days = 150, includeRoutine = true } = {},
): Promise<CalendarEvent[]> {
  let data: Record<string, any>;
  try {
    data = (await ical.async.fromURL(FEED)) as Record<string, any>;
  } catch (err) {
    // The calendar being unreachable must not break a deploy. The pages that
    // use this fall back to their own empty state.
    console.warn('[calendar] could not read the Google Calendar feed:', err);
    return [];
  }

  const now = new Date();
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const out: CalendarEvent[] = [];

  for (const item of Object.values(data)) {
    if (!item || item.type !== 'VEVENT' || !item.start) continue;
    const allDay = item.datetype === 'date';
    const title = String(item.summary ?? '').replace(/\\,/g, ',').trim();
    if (!title) continue;

    const push = (instant: Date) => {
      // An all-day event's timestamp is midnight UTC and is not a moment in
      // time — converting it to Pacific would move it back a day.
      const date = allDay ? instant.toISOString().slice(0, 10) : localDate(instant, TZ);
      out.push({date, title, time: allDay ? '' : localTime(instant, TZ), allDay});
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

  const filtered = includeRoutine
    ? out
    : out.filter((e) => !NOT_HEADLINE.some((re) => re.test(e.title)));

  // Same day, earlier time first; all-day events lead the day.
  return filtered.sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date < b.date ? -1 : 1,
  );
}
