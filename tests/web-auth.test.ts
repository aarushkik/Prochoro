import test from 'node:test';
import assert from 'node:assert/strict';
import { secureAuthOrigin, webAuthURL } from '../src/lib/webAuthURL';

test('published auth links land inside the app on static-hosted callback directories', () => {
  assert.equal(webAuthURL('https://prochoro.net', '/app', 'auth/callback'), 'https://prochoro.net/app/auth/callback/');
  assert.equal(webAuthURL('https://prochoro.net', '/app/', 'auth/recovery'), 'https://prochoro.net/app/auth/recovery/');
  assert.equal(webAuthURL('https://example.github.io', '/project/app', 'auth/callback'), 'https://example.github.io/project/app/auth/callback/');
  assert.equal(webAuthURL('https://prochoro.net', '', 'auth/callback'), 'https://prochoro.net/auth/callback/');
});
test('public auth requires HTTPS while loopback previews remain usable', () => {
  assert.equal(secureAuthOrigin('https://prochoro.net'), true);
  assert.equal(secureAuthOrigin('http://prochoro.net'), false);
  assert.equal(secureAuthOrigin('http://localhost:8085'), true);
  assert.equal(secureAuthOrigin('http://127.0.0.1:8085'), true);
  assert.equal(secureAuthOrigin('http://localhost.example.com'), false);
});
test('local Expo auth callbacks retain the local origin and development route', () => {
  assert.equal(webAuthURL('http://localhost:8085', '/app', 'auth/callback', true), 'http://localhost:8085/auth/callback');
  assert.equal(webAuthURL('http://127.0.0.1:8082', '/app', 'auth/recovery', true), 'http://127.0.0.1:8082/auth/recovery');
});
