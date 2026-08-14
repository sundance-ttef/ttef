/**
 * The fundraising figures, now edited in Sanity under "Campaign & goal".
 *
 * This module keeps the shape it had when the numbers were hard-coded, so
 * every page that reads `goalText` or `percent` is unchanged. What moved is
 * where the numbers come from.
 *
 * The fetch is a top-level await, which means it happens once at build time
 * and the values are baked into the HTML. If Sanity is unreachable or the
 * document is missing, the BUILD FAILS rather than deploying a page that tells
 * families the goal is $0 — a wrong number here is worse than a late deploy.
 */
import { getCampaign } from '../lib/sanity';

const campaign = await getCampaign();

if (!campaign) {
  throw new Error(
    'No "Campaign & goal" document found in Sanity. The site cannot build ' +
      'without the fundraising figures — check the singleton exists in the Studio.',
  );
}

/**
 * The line-item budget, and the goal derived from it.
 *
 * The goal is the SUM of the budget rather than a number stored beside it.
 * Two figures that have to agree will eventually disagree — a treasurer edits
 * one line and forgets the total — and a goal that contradicts the breakdown
 * printed right below it is the kind of error a parent notices.
 */
export const budget = campaign.budget ?? [];
const goal = budget.reduce((total, line) => total + (line.amount ?? 0), 0);

export const fundraising = {
  goal,
  raised: campaign.raised,
  /** e.g. 'Aug 11'. Null hides the label. */
  updated: campaign.updated
    ? new Date(campaign.updated + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null,
  schoolYear: campaign.schoolYear,
  suggestedPerStudent: campaign.suggestedPerStudent,
  monthlyPlanMonths: campaign.monthlyPlanMonths,
};

const usd = (n: number) => '$' + n.toLocaleString('en-US');

export const goalText = usd(fundraising.goal);
export const raisedText = usd(fundraising.raised);
export const remainingText = usd(Math.max(0, fundraising.goal - fundraising.raised));
export const askText = usd(fundraising.suggestedPerStudent);
/** e.g. "$27.50" — the monthly equivalent of the suggested gift. */
export const askMonthlyText =
  '$' +
  (fundraising.suggestedPerStudent / fundraising.monthlyPlanMonths)
    .toFixed(2)
    .replace(/\.00$/, '');

export const percent = fundraising.goal
  ? Math.round((fundraising.raised / fundraising.goal) * 100)
  : 0;
