import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

test('every installed Metro asset pipeline reads bundled PNG dimensions', async () => {
  const roots = [process.cwd(), path.dirname(require.resolve('@expo/metro/package.json')), path.dirname(require.resolve('@react-native/community-cli-plugin/package.json'))];
  const manifests = new Set(roots.map(root => require.resolve('metro/package.json', { paths: [root] })));
  for (const manifest of manifests) {
    const { getAssetData } = require(path.join(path.dirname(manifest), 'src/Assets.js'));
    const asset = await getAssetData(path.resolve('assets/prochoro-icon.png'), 'assets/prochoro-icon.png', [], 'ios', '/assets');
    assert.equal(asset.width, 1024);
    assert.equal(asset.height, 1024);
    assert.equal(asset.type, 'png');
  }
});

test('Xcode project tooling remains compatible with the patched UUID dependency', () => {
  const project = require('xcode').project('unused.pbxproj');
  project.hash = { project: { objects: {} } };
  const first = project.generateUuid();
  const second = project.generateUuid();
  assert.match(first, /^[A-F0-9]{24}$/);
  assert.notEqual(first, second);
});
