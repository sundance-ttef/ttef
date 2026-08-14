/**
 * Where the money actually goes.
 *
 * Every one of these is the link currently in use on twintrailsfoundation.org,
 * recovered from the archived site. They are live payment destinations, so
 * treat a change here as a change to where donations land.
 *
 * ⚠️ Confirm each is still current for 2026–27 before the domain is pointed —
 * the Square checkout and the JotForm were both created for the 2025 campaign.
 */
export const giving = {
  /**
   * ⚠️ DEAD — the Square checkout returns 404, verified in a browser on
   * 2026-08-14. The same dead link is live on twintrailsfoundation.org today,
   * so card donors there hit an error page.
   *
   * Card giving is routed through PayPal instead: its donate page offers
   * "Donate with Debit or Credit Card" without needing a PayPal account.
   * If the Foundation still uses Square, generate a fresh checkout link and
   * point `card` back at it.
   */
  squareDead: 'https://checkout.square.site/merchant/MLMA25HK3453G/checkout/4N3AMJLQBAGWNCZ474IA36NZ',
  /** Where "Give by card" points until Square is replaced. */
  get card() { return this.paypal; },
  /** PayPal hosted button — one-time, recurring, or card without an account. */
  paypal:
    'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3XYDNS9KFKNMA',
  /** The Red Envelope donation form families fill in online. */
  donationForm: 'https://form.jotform.com/252184797627168',
  /** Employer matching lookup for Poway Unified. */
  matchingGifts: 'https://www.matchinggifts.com/powayusd',
  /** Teacher supply reimbursement, 2026–27. */
  reimbursementForm: 'https://form.jotform.com/261928705657166',
};
