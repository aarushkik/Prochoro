#!/usr/bin/env node
// Renders App Store screenshots of real screens at Apple's exact pixel sizes:
// 6.9" iPhone 1320 × 2868 (portrait) and 13" iPad 2752 × 2064 (landscape, so
// the three-panel Play layout shows). Screens come from the design preview,
// which mounts the real app with disposable sample progress:
//
//   npm run preview:design          # serves http://localhost:8085
//   npm run store:screenshots       # writes docs/app-store/screenshots/
//
// Needs Google Chrome. The preview's own 36-point control bar is cropped off.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'app-store', 'screenshots');
const PREVIEW = process.argv[2] ?? 'http://localhost:8085';
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BAR = 36;

const DEVICES = {
  'iphone-6.9': { width: 440, height: 956, scale: 3 },
  'ipad-13': { width: 1376, height: 1032, scale: 2 },
};
// [file name, preview buttons to press in order, colour scheme]
const SHOTS = {
  'iphone-6.9': [
    ['01-path', ['Study home']],
    ['02-boss', ['Boss duel']],
    ['03-code-question', ['CSP pseudocode preview']],
    ['04-data-question', ['Statistics table preview']],
    ['05-progress', ['Study home', 'Progress']],
    ['06-subjects', ['Subjects']],
    ['07-dark-mode', ['Study home'], 'dark'],
  ],
  'ipad-13': [
    ['01-path', ['Study home']],
    ['02-boss', ['Boss duel']],
    ['03-code-question', ['CSP pseudocode preview']],
    ['04-progress', ['Study home', 'Progress']],
    ['05-subjects', ['Subjects']],
    ['06-dark-mode', ['Study home'], 'dark'],
  ],
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const port = 9300 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'prochoro-store-shots-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });

try {
  let page;
  for (let i = 0; i < 50 && !page; i += 1) {
    await sleep(200);
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch { /* Chrome is still starting. */ }
  }
  if (!page) throw new Error('Chrome did not start.');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject); });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, message => message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result));
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;
  const waitFor = async (expression, what) => {
    for (let i = 0; i < 100; i += 1) { if (await evaluate(expression)) return; await sleep(150); }
    throw new Error(`Timed out waiting for ${what}. Is the design preview running at ${PREVIEW}?`);
  };
  // Press the visible control whose whole text is `label`, the way a finger would.
  const press = async label => {
    const at = await evaluate(`(() => {
      const want = ${JSON.stringify(label)};
      const all = [...document.querySelectorAll('[role=button],[role=tab],button,a,div')]
        .filter(e => e.innerText && e.innerText.trim() === want && e.getClientRects().length);
      const hittable = e => { const b = e.getBoundingClientRect(); const top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return top && (e.contains(top) || top.contains(e)); };
      const el = all.filter(hittable).pop() ?? all.pop(); if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const b = el.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2];
    })()`);
    if (!at) throw new Error(`Could not find "${label}" in the preview.`);
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: at[0], y: at[1], button: 'left', clickCount: 1 });
    await sleep(1400);
  };

  await send('Page.enable');
  await send('Runtime.enable');
  for (const [device, shots] of Object.entries(SHOTS)) {
    const { width, height, scale } = DEVICES[device];
    mkdirSync(join(OUT, device), { recursive: true });
    for (const [name, steps, scheme = 'light'] of shots) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: height + BAR, deviceScaleFactor: scale, mobile: false });
      // Real glass, a still frame (no bobbing mid-capture) and the requested appearance.
      await send('Emulation.setEmulatedMedia', { features: [
        { name: 'prefers-color-scheme', value: scheme },
        { name: 'prefers-reduced-transparency', value: 'no-preference' },
        { name: 'prefers-reduced-motion', value: 'reduce' },
      ] });
      await send('Page.navigate', { url: PREVIEW });
      await waitFor(`document.readyState === 'complete' && document.body.innerText.includes(${JSON.stringify(steps[0])})`, 'the preview menu');
      await sleep(800);
      for (const step of steps) await press(step);
      const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: BAR, width, height, scale: 1 } });
      const file = join(OUT, device, `${name}.png`);
      writeFileSync(file, Buffer.from(shot.data, 'base64'));
      console.log(`${device}/${name}.png  ${width * scale} × ${height * scale}`);
    }
  }
  socket.close();
} finally {
  chrome.kill('SIGKILL');
  rmSync(profile, { recursive: true, force: true });
}

// Lossless size reduction when available; the PNGs stay pixel-identical.
const optimizer = spawnSync('oxipng', ['-o', '4', '--strip', 'safe', '-q', '-r', OUT], { stdio: 'inherit' });
if (optimizer.error) console.log('Tip: install oxipng to shrink the PNGs losslessly.');
