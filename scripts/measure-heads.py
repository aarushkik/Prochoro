#!/usr/bin/env python3
"""Measures where the platypus's head is in every mascot pose, for hats.

Each pose is a crop of a transparent ink atlas. The drawing's outline is
closed, so flooding the background in from the crop's edges leaves a solid
silhouette. For the head we take the widest run of that silhouette near the
top: its middle is the head's centre and its width the head's width. The
crown is the highest silhouette point over the middle of the head, and the
tilt comes from the dome's height either side of it.

A few poses fool the measurement (a raised pencil, a tilted head);
OVERRIDES corrects them by hand after checking the QA sheet:

    python3 scripts/measure-heads.py            # writes src/data/lookAnchors.json
    python3 scripts/measure-heads.py --qa out.png path/to/hat.png
    python3 scripts/measure-heads.py --site     # the website's hat gallery

Anchors are fractions of each pose's frame: x and y of the crown, the head
width w, and the tilt in degrees (positive leans the hat clockwise).
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEETS = os.path.join(ROOT, 'src', 'assets', 'mascot', 'prochoro')
FRAMES = json.load(open(os.path.join(ROOT, 'src', 'data', 'mascotFrames.json')))
OUT = os.path.join(ROOT, 'src', 'data', 'lookAnchors.json')

# Same mapping as MASCOT_FRAMES in src/components/Mascot/Mascot.types.ts.
POSES = {
    'neutral': ('expressions', 0), 'excited': ('expressions', 1), 'sad': ('expressions', 2),
    'thinking': ('expressions', 3), 'surprised': ('expressions', 4), 'proud': ('expressions', 5),
    'worried': ('expressions', 6), 'sleepy': ('expressions', 7), 'celebrate': ('expressions', 8),
    'reading': ('activities', 0), 'wave': ('activities', 1), 'point': ('activities', 2),
    'meditate': ('activities', 3), 'map': ('activities', 4), 'idea': ('activities', 5),
    'thumbsup': ('activities', 6), 'wince': ('activities', 7), 'trophy': ('activities', 8),
    'bossReady': ('moments', 0), 'bossWin': ('moments', 1), 'bossLose': ('moments', 2),
    'streakOn': ('moments', 3), 'streakLost': ('moments', 4), 'streakFreeze': ('moments', 5),
    'levelUp': ('moments', 6), 'progress': ('moments', 7), 'chest': ('moments', 8),
}

# Hand corrections, applied over the measurement: {pose: {key: value}}.
OVERRIDES = {}


def silhouette(ink):
    """Everything the background cannot reach from the edges."""
    outside = np.zeros_like(ink)
    outside[0, :] = ~ink[0, :]
    outside[-1, :] = ~ink[-1, :]
    outside[:, 0] = ~ink[:, 0]
    outside[:, -1] = ~ink[:, -1]
    free = ~ink
    while True:
        grown = outside.copy()
        grown[1:, :] |= outside[:-1, :]
        grown[:-1, :] |= outside[1:, :]
        grown[:, 1:] |= outside[:, :-1]
        grown[:, :-1] |= outside[:, 1:]
        grown &= free
        if (grown == outside).all():
            return ~outside
        outside = grown


def runs(row):
    """(start, end) pairs of consecutive True values."""
    padded = np.concatenate([[False], row, [False]])
    edges = np.flatnonzero(padded[1:] != padded[:-1])
    return list(zip(edges[::2], edges[1::2]))


def body_of(solid):
    """The largest connected piece of silhouette: the platypus, not its props."""
    small = solid[::2, ::2]
    labels = np.zeros(small.shape, dtype=np.int32)
    sizes = [0]
    for start in zip(*np.nonzero(small)):
        if labels[start]:
            continue
        label = len(sizes)
        labels[start] = label
        stack, count = [start], 0
        while stack:
            r, c = stack.pop()
            count += 1
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < small.shape[0] and 0 <= nc < small.shape[1] and small[nr, nc] and not labels[nr, nc]:
                    labels[nr, nc] = label
                    stack.append((nr, nc))
        sizes.append(count)
    keep = labels == int(np.argmax(sizes))
    return np.kron(keep, np.ones((2, 2), dtype=bool))[:solid.shape[0], :solid.shape[1]] & solid


def run_near(row, x):
    """The run of `row` containing column x, or the nearest one."""
    best = None
    for start, end in runs(row):
        if start <= x < end:
            return start, end
        gap = min(abs(x - start), abs(x - end))
        if best is None or gap < best[0]:
            best = (gap, (start, end))
    return best[1] if best else None


# Where the hat's band is measured: this far below the top of the dome, as a
# fraction of the frame's height. The hat art draws its band at the same level.
BAND = 0.08


def measure(pose):
    sheet, index = POSES[pose]
    x, y, w, h = FRAMES[sheet]['frames'][index]
    alpha = np.asarray(Image.open(os.path.join(SHEETS, sheet + '.png')).convert('RGBA'))[y:y + h, x:x + w, 3]
    body = body_of(silhouette(alpha > 60))
    rows = np.flatnonzero(body.any(axis=1))
    top, tall = rows[0], rows[-1] - rows[0]
    # A first guess at the head's centre: the widest run at cheek height.
    guess = max((run for r in (0.22, 0.26, 0.3) for run in runs(body[int(top + tall * r)])), key=lambda run: run[1] - run[0])
    cx = (guess[0] + guess[1]) / 2
    # The dome starts where the silhouette over the head stops being tuft-thin.
    dome = next(r for r in range(top, top + int(tall * 0.45)) if (run := run_near(body[r], cx)) and run[1] - run[0] >= 0.2 * w)
    band = dome + int(BAND * h)
    start, end = run_near(body[band], cx)
    cx, bw = (start + end) / 2, end - start
    # Tilt: the dome's height a third of the band either side of the middle.
    def surface(col):
        hits = np.flatnonzero(body[:, max(0, min(w - 1, int(col)))])
        return hits[0] if len(hits) else dome
    left, right = surface(cx - bw / 3), surface(cx + bw / 3)
    tilt = math.degrees(math.atan2(right - left, bw * 2 / 3))
    anchor = {'x': round(cx / w, 4), 'y': round(band / h, 4), 'w': round(bw / w, 4), 'tilt': round(max(-25, min(25, tilt)), 1)}
    anchor.update(OVERRIDES.get(pose, {}))
    return anchor


# The hat art's contact point and the share of its width the head band spans:
# (150, 240) on a 300 canvas, band 222 wide. Kept in step with draw-looks.py
# and src/components/Mascot/Mascot.tsx.
HAT_BASE = (0.5, 0.8)
HAT_SPAN = 0.74


def place(frame_size, anchor, hat_size):
    """Where a hat image goes over a frame: the same arithmetic the app uses."""
    fw, fh = frame_size
    width = anchor['w'] * fw / HAT_SPAN
    height = width * hat_size[1] / hat_size[0]
    return width, height, anchor['x'] * fw - HAT_BASE[0] * width, anchor['y'] * fh - HAT_BASE[1] * height


def qa(out, hat_path):
    hat = Image.open(hat_path).convert('RGBA')
    tiles = []
    for pose in POSES:
        sheet, index = POSES[pose]
        x, y, w, h = FRAMES[sheet]['frames'][index]
        frame = Image.open(os.path.join(SHEETS, sheet + '.png')).convert('RGBA').crop((x, y, x + w, y + h))
        a = measure(pose)
        pad = 140
        tile = Image.new('RGBA', (w + pad * 2, h + pad * 2), 'white')
        tile.alpha_composite(frame, (pad, pad))
        hw, hh, left, top = place((w, h), a, hat.size)
        art = hat.resize((max(1, round(hw)), max(1, round(hh))), Image.LANCZOS)
        # Lean about the contact point, as the app's transformOrigin does.
        art = art.rotate(-a['tilt'], resample=Image.BICUBIC, center=(HAT_BASE[0] * art.width, HAT_BASE[1] * art.height))
        tile.alpha_composite(art, (round(pad + left), round(pad + top)))
        tile = tile.convert('RGB').resize((260, round(260 * tile.height / tile.width)))
        tiles.append((pose, tile))
    cols = 9
    cell_h = max(t.height for _, t in tiles) + 24
    sheet = Image.new('RGB', (cols * 270, math.ceil(len(tiles) / cols) * cell_h), 'white')
    from PIL import ImageDraw
    draw = ImageDraw.Draw(sheet)
    for i, (pose, tile) in enumerate(tiles):
        cx, cy = (i % cols) * 270, (i // cols) * cell_h
        sheet.paste(tile, (cx + 5, cy))
        draw.text((cx + 10, cy + tile.height + 4), pose, fill='black')
    sheet.save(out)
    print('QA sheet:', out)


# The website's hat gallery: (hat, pose) pairs drawn by `--site`.
SITE_LOOKS = [('grad-cap', 'wave'), ('wizard', 'excited'), ('crown', 'proud'), ('flower-crown', 'neutral')]


def site():
    """Platypus-in-a-hat images for site/img/prochoro, ink black, hat knockout white."""
    looks = os.path.join(ROOT, 'src', 'assets', 'looks')
    out = os.path.join(ROOT, 'site', 'img', 'prochoro')
    for hat_id, pose in SITE_LOOKS:
        sheet, index = POSES[pose]
        x, y, w, h = FRAMES[sheet]['frames'][index]
        frame = Image.open(os.path.join(SHEETS, sheet + '.png')).convert('RGBA').crop((x, y, x + w, y + h))
        k = 320 / max(w, h)
        fw, fh = round(w * k), round(h * k)
        frame = frame.resize((fw, fh), Image.LANCZOS)
        canvas = Image.new('RGBA', (440, 440), (0, 0, 0, 0))
        left0, top0 = (440 - fw) // 2, 440 - fh - 14
        canvas.alpha_composite(frame, (left0, top0))
        ink = Image.open(os.path.join(looks, hat_id + '.png')).convert('RGBA')
        fill = Image.open(os.path.join(looks, hat_id + '-fill.png')).convert('RGBA')
        a = measure(pose)
        hw, hh, left, top = place((fw, fh), a, ink.size)
        for layer, colour in ((fill, (255, 255, 255)), (ink, (0, 0, 0))):
            art = Image.new('RGBA', layer.size, colour + (0,))
            art.putalpha(layer.getchannel('A'))
            art = art.resize((round(hw), round(hh)), Image.LANCZOS)
            art = art.rotate(-a['tilt'], resample=Image.BICUBIC, center=(HAT_BASE[0] * art.width, HAT_BASE[1] * art.height))
            canvas.alpha_composite(art, (round(left0 + left), round(top0 + top)))
        target = os.path.join(out, f'look-{hat_id}.png')
        canvas.save(target)
        print(target)


def main():
    if len(sys.argv) >= 2 and sys.argv[1] == '--site':
        site()
        return
    if len(sys.argv) >= 4 and sys.argv[1] == '--qa':
        qa(sys.argv[2], sys.argv[3])
        return
    anchors = {pose: measure(pose) for pose in POSES}
    with open(OUT, 'w') as handle:
        json.dump(anchors, handle, indent=1)
        handle.write('\n')
    for pose, a in anchors.items():
        print(f'{pose:13} x={a["x"]:.3f} y={a["y"]:.3f} w={a["w"]:.3f} tilt={a["tilt"]:+.1f}')


if __name__ == '__main__':
    main()
