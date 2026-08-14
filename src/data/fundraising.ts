/**
 * The fundraising figures, in one place.
 *
 * These appear on both /impact/ and /support/. Keeping them here means the
 * treasurer's update is a single number in a single file — and when the CMS
 * lands, this is the shape it fills in.
 *
 * `updated` is shown to visitors, so it should change whenever `raised` does.
 * Leave it null while the campaign hasn't started and no date is shown.
 */
export const fundraising = {
  /** Total needed for the 2026–27 school year. */
  goal: 111944,
  /** Raised so far. */
  raised: 0,
  /** When `raised` was last checked, e.g. 'Aug 11'. Null hides the label. */
  updated: null as string | null,
  schoolYear: '2026–27',
};

const usd = (n: number) => '$' + n.toLocaleString('en-US');

export const goalText = usd(fundraising.goal);
export const raisedText = usd(fundraising.raised);
export const remainingText = usd(Math.max(0, fundraising.goal - fundraising.raised));
export const percent = fundraising.goal
  ? Math.round((fundraising.raised / fundraising.goal) * 100)
  : 0;
