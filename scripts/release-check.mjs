import { readFileSync } from 'node:fs';
const app = JSON.parse(readFileSync(new URL('../app.json', import.meta.url))).expo;
const failures = [];
const check = (ok, message) => { console.log(`${ok ? 'PASS' : 'BLOCKED'}: ${message}`); if (!ok) failures.push(message); };
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
let publicKey = key.startsWith('sb_publishable_');
try { publicKey ||= JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'anon'; } catch {}
check(/^https:\/\/[a-z0-9.-]+\/?$/.test(url) && !url.includes('your-project'), 'A real HTTPS Supabase endpoint is configured');
check(publicKey, 'The Supabase client key is publishable/anon, never service_role');
check(/^[0-9a-f-]{36}$/i.test(app.extra?.eas?.projectId ?? ''), 'EAS project is linked (run eas init with the owner account)');
check(process.env.EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED === 'true', 'Apple sign-in is enabled after configuring and testing its Supabase provider');
const icon = readFileSync(new URL(`../${app.icon}`, import.meta.url));
check(icon.readUInt32BE(16) === 1024 && icon.readUInt32BE(20) === 1024 && ![4,6].includes(icon[25]), 'App icon is 1024 square without an alpha channel');
for (const path of ['privacy.html','terms.html','support.html']) {
  try { const res = await fetch(`https://aarushkik.github.io/StudyPlat/${path}`, {signal:AbortSignal.timeout(10000)}); check(res.ok, `${path} is publicly reachable`); }
  catch { check(false, `${path} is publicly reachable`); }
}
if (publicKey && url.startsWith('https://') && !url.includes('your-project')) {
  try {
    const res = await fetch(`${url.replace(/\/$/,'')}/auth/v1/settings`, {headers:{apikey:key},signal:AbortSignal.timeout(10000)});
    const data = await res.json();
    for (const provider of ['google','azure','apple']) check(res.ok && data.external?.[provider] === true, `${provider} provider is configured in Supabase`);
  } catch { check(false, 'Supabase provider configuration is reachable'); }
  try {
    // An unauthenticated probe cannot delete anything. It verifies the
    // function is deployed and rejects requests before any account operation.
    const deletion = await fetch(`${url.replace(/\/$/,'')}/functions/v1/delete-apple-account`, {
      method: 'POST', headers: { apikey: key, 'content-type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10000),
    });
    const guard = await deletion.json();
    check(deletion.status === 401 && guard.error === 'NOT_SIGNED_IN', 'Apple deletion function is deployed and denies unauthenticated requests');
  } catch { check(false, 'Apple deletion function is reachable'); }
}
console.log('Manual release gates: Apple server secrets and revocation test, apply/test supabase/schema.sql, native OAuth and recovery, two-device/offline sync, deletion, TestFlight, content review, privacy labels and screenshots. See docs/release-readiness.md.');
process.exitCode = failures.length ? 1 : 0;
