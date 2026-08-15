/**
 * The school year runs August to June, so month names cannot sort themselves —
 * alphabetically, April comes before February comes before January. Anything
 * ordered by month has to sort against this list rather than the name.
 *
 * Shared by every type that asks for a month, the same way `orgs.ts` is shared
 * by every type that shows the coloured org tag. It was copied into two schemas
 * before this existed, which is two chances for them to drift apart.
 *
 * `src/lib/sanity.ts` keeps its own copy deliberately: the site and the Studio
 * are separate packages and cannot import across the boundary.
 */
export const SCHOOL_MONTHS = [
  'August', 'September', 'October', 'November', 'December',
  'January', 'February', 'March', 'April', 'May', 'June',
]
