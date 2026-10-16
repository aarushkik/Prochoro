/** Static hosting needs a real callback directory, including its trailing slash. */
export function webAuthURL(origin: string, basePath: string, path: 'auth/callback' | 'auth/recovery', development = false): string {
  const segments = basePath.split('/').filter(Boolean).join('/');
  const base = development || !segments ? '' : `/${segments}`;
  return new URL(`${base}/${path}${development ? '' : '/'}`, origin).toString();
}

export function secureAuthOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
  } catch { return false; }
}
