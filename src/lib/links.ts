import * as Linking from 'expo-linking';

/**
 * The app's public pages.
 *
 * These are not decoration. App Store Connect requires a working privacy
 * policy URL and a working support URL, both are checked, and a broken one is
 * a straightforward rejection. The sign-in screen also asserts that continuing
 * means agreeing to the terms — an assertion that is only fair if the terms
 * can actually be opened from the place it is made.
 *
 * Served from `site/` in this repo via GitHub Pages. Change the base here if
 * the app ever gets its own domain; nothing else references these URLs.
 */
const BASE = 'https://prochoro.net';

export const links = {
  home: BASE,
  privacy: `${BASE}/privacy.html`,
  terms: `${BASE}/terms.html`,
  support: `${BASE}/support.html`,
} as const;

/**
 * Open one in the system browser.
 *
 * Deliberately swallows failures. There is no useful thing to tell someone
 * whose device has no browser, and a crash on the sign-in screen because a
 * legal link would not open would be far worse than the link not opening.
 */
export function openLink(url: string): void {
  void Linking.openURL(url).catch(() => undefined);
}
