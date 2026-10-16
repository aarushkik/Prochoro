import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { URL } from "node:url";
import { BOSS_FAMILIES, bossForNode } from "../src/data/bosses";
import { getQuestMap } from "../src/data/questMap";
import { apCourses } from "../src/data/apCourses";

test("every course resolves sixty named guardian variants without changing stored stop IDs", () => {
  assert.equal(Object.keys(BOSS_FAMILIES).length, 10);
  for (const course of apCourses) {
    const bosses = getQuestMap(course.id).units.flatMap((u) =>
      u.nodes.filter((n) => n.kind === "boss"),
    );
    assert.equal(bosses.length, 60);
    assert.equal(new Set(bosses.map((b) => b.title)).size, 60);
    assert.equal(new Set(bosses.map((b) => bossForNode(b.id)?.key)).size, 60);
    for (const node of bosses) {
      const art = bossForNode(node.id);
      assert.ok(art);
      assert.equal(art.name, node.title);
      assert.equal(art.tier, node.tier);
    }
  }
  assert.equal(bossForNode("ap-biology-u1-s1-lesson"), null);
  assert.equal(bossForNode("ap-biology-u99-s1-boss"), null);
});
test("sixty boss portraits use ten distinct monochrome atlases bundled for offline play", () => {
  const catalog = readFileSync(new URL("../src/data/characterArt.ts", import.meta.url), "utf8");
  const hashes = new Set<string>();
  for (const family of Object.keys(BOSS_FAMILIES)) {
    const path = `../src/assets/characters/prochoro/bosses/${family}.png`;
    const image = readFileSync(new URL(path, import.meta.url));
    assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(image.readUInt32BE(16), 1536);
    assert.equal(image.readUInt32BE(20), 1024);
    assert.equal(image[25], 6, `${family} must have an alpha channel`);
    assert.ok(image.length > 8000);
    assert.ok(catalog.includes(`prochoro/bosses/${family}.png`));
    hashes.add(createHash("sha256").update(image).digest("hex"));
  }
  assert.equal(hashes.size, 10, "each family needs its own artwork");
  for (const [path, width, height] of [
    ["../src/assets/characters/prochoro/companions.png", 1448, 1086],
    ["../src/assets/characters/prochoro/courses.png", 1774, 887],
    ["../src/assets/characters/prochoro/activities.png", 1774, 887],
  ] as const) {
    const image = readFileSync(new URL(path, import.meta.url));
    assert.equal(image.readUInt32BE(16), width);
    assert.equal(image.readUInt32BE(20), height);
    assert.equal(image[25], 6);
  }
});
