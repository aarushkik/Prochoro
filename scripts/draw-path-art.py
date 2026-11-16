#!/usr/bin/env python3
"""Draws the learning-path artwork and exports it as transparent PNGs.

Each drawing is authored here as ink strokes, given a slight hand wobble, and
rasterised by headless Chrome at 3x. The app only ever loads the PNGs: nothing
on the path is built from views at run time. Images are single-colour so the
app can tint them with the theme's ink (see `PathArt.tsx`).

    python3 scripts/draw-path-art.py

Geometry here must match `src/components/home/pathGeometry.ts`.
"""
import math
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets', 'path', 'prochoro')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
SCALE = 3

STEP = 124          # vertical distance between two stops
AMPLITUDE = 76      # how far the path swings from the centre line
TRAIL_PAD = 14      # air either side of a trail tile

INK = '#000'


def wobble(seed, amount=1.6, freq=0.045):
    return (f'<filter id="w" x="-10%" y="-10%" width="120%" height="120%">'
            f'<feTurbulence type="fractalNoise" baseFrequency="{freq}" numOctaves="2" seed="{seed}"/>'
            f'<feDisplacementMap in="SourceGraphic" scale="{amount}" xChannelSelector="R" yChannelSelector="G"/></filter>')


def svg(width, height, body, seed=3, amount=1.6):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
            f'<defs>{wobble(seed, amount)}</defs><g filter="url(#w)" fill="none" stroke="{INK}" '
            f'stroke-linecap="round" stroke-linejoin="round">{body}</g></svg>')


def line(d, w=3, extra=''):
    return f'<path d="{d}" stroke-width="{w}" {extra}/>'


def fill(d):
    return f'<path d="{d}" fill="{INK}" stroke="{INK}" stroke-width="3"/>'


# ---------------------------------------------------------------- stops ----

def stone(width, height, lip):
    """A pebble seen from above with a lip under it: a stepping stone you press."""
    cx = width / 2
    rx = width / 2 - 5
    ry = (height - lip) / 2 - 5
    cy = ry + 5
    top = f'M{cx - rx},{cy} a{rx},{ry} 0 1 0 {rx * 2},0 a{rx},{ry} 0 1 0 {-rx * 2},0'
    under = f'M{cx - rx},{cy} v{lip} a{rx},{ry} 0 0 0 {rx * 2},0 v{-lip}'
    silhouette = f'M{cx - rx},{cy} a{rx},{ry} 0 0 1 {rx * 2},0 v{lip} a{rx},{ry} 0 0 1 {-rx * 2},0 z'
    ticks = ''
    for dx in (-rx * 0.52, rx * 0.34):
        y = cy + ry * math.sqrt(1 - (dx / rx) ** 2)
        ticks += line(f'M{cx + dx},{y + 3} v{lip - 6}', 2.4)
    # A short second stroke, the way a marker circle never quite closes.
    flick = line(f'M{cx - rx * 0.62},{cy - ry * 0.62} q{rx * 0.22},{-ry * 0.3} {rx * 0.5},{-ry * 0.32}', 2.2, 'opacity="0.55"')
    return silhouette, line(top) + line(under) + ticks + flick


def stop_assets():
    out = {}
    for name, (w, h, lip) in {'stop': (80, 86, 10), 'stop-boss': (104, 110, 12)}.items():
        silhouette, outline = stone(w, h, lip)
        out[f'{name}-fill'] = svg(w, h, fill(silhouette), seed=5)
        out[f'{name}-line'] = svg(w, h, outline, seed=5)
    return out


# ---------------------------------------------------------------- trail ----

def offsets():
    return [round(AMPLITUDE * math.sin(i * math.pi / 4)) for i in range(8)]


def trail_assets():
    xs = offsets()
    points = [(xs[i % 8], i * STEP) for i in range(-1, 7)]
    out = {}
    width = AMPLITUDE + TRAIL_PAD * 2
    for k in range(4):
        p0, p1, p2, p3 = points[k], points[k + 1], points[k + 2], points[k + 3]
        m1 = ((p2[0] - p0[0]) / 2, (p2[1] - p0[1]) / 2)
        m2 = ((p3[0] - p1[0]) / 2, (p3[1] - p1[1]) / 2)
        ox, oy = TRAIL_PAD, -p1[1]
        a = (p1[0] + ox, p1[1] + oy)
        b = (p2[0] + ox, p2[1] + oy)
        c1 = (a[0] + m1[0] / 3, a[1] + m1[1] / 3)
        c2 = (b[0] - m2[0] / 3, b[1] - m2[1] / 3)
        curve = f'M{a[0]},{a[1]} C{c1[0]},{c1[1]} {c2[0]},{c2[1]} {b[0]},{b[1]}'
        # Drawn end to end: the stones are opaque and sit on top of it.
        body = line(curve, 4.6, "stroke-dasharray='9 11' stroke-dashoffset='3'")
        out[f'trail-{k}'] = svg(width, STEP, body, seed=11 + k, amount=1.2)
    return out


# --------------------------------------------------------------- badges ----

def badge(glyph, seed):
    ring = 'M4,16 a12,12 0 1 0 24,0 a12,12 0 1 0 -24,0'
    return svg(32, 32, fill(ring), seed=seed, amount=0.8), svg(32, 32, line(ring, 2.6) + glyph, seed=seed, amount=0.8)


def badge_assets():
    out = {}
    glyphs = {
        'check': line('M10.5,16.5 l4,4 l7.5,-8.5', 3),
        'lock': line('M11.5,15.5 v-2.6 a4.5,4.5 0 0 1 9,0 v2.6', 2.4) + line('M10,15.5 h12 v7 h-12 z', 2.4) + line('M16,18.4 v1.6', 2.4),
        'crown': line('M9.5,21.5 l-1.5,-9 l5,4 l3,-6 l3,6 l5,-4 l-1.5,9 z', 2.4),
        'play': line('M13,10.5 l8,5.5 l-8,5.5 z', 2.6),
    }
    for seed, (name, glyph) in enumerate(glyphs.items(), start=21):
        solid, outline = badge(glyph, seed)
        out['badge-fill'] = solid
        out[f'badge-{name}'] = outline
    return out


# ---------------------------------------------------------------- props ----

def prop_assets():
    out = {}
    out['prop-tuft'] = svg(44, 36, ''.join([
        line('M10,31 q-1,-10 -6,-16'), line('M17,31 q0,-14 -3,-25'), line('M23,31 q1,-11 6,-19'),
        line('M30,31 q1,-7 8,-11'), line('M5,32 h34', 2.4),
    ]), seed=31)
    out['prop-flower'] = svg(40, 54, ''.join([
        line('M20,50 q-2,-14 1,-26'), line('M20,40 q-9,-1 -11,-9 q9,0 11,9'),
        line('M21,24 m-5.5,-9 a5.5,5.5 0 1 1 11,0 a5.5,5.5 0 1 1 0.5,9 a5.5,5.5 0 1 1 -11,1 a5.5,5.5 0 1 1 -0.5,-10', 2.6),
        line('M21,16.5 m-2.2,0 a2.2,2.2 0 1 0 4.4,0 a2.2,2.2 0 1 0 -4.4,0', 2.2),
    ]), seed=32)
    out['prop-rocks'] = svg(58, 34, ''.join([
        line('M5,29 q-2,-15 13,-17 q14,0 14,17 z'), line('M28,29 q1,-10 11,-11 q13,1 13,11 z'),
        line('M12,20 q3,-4 8,-4', 2.2, 'opacity="0.6"'), line('M38,24 q3,-2 6,-2', 2.2, 'opacity="0.6"'),
    ]), seed=33)
    out['prop-sign'] = svg(48, 58, ''.join([
        line('M24,54 v-26'), line('M8,10 h27 l7,9 l-7,9 h-27 z'), line('M15,19 h13', 2.4),
        line('M14,54 h20', 2.4), line('M17,54 q-1,-5 -4,-7', 2.2), line('M31,54 q1,-5 4,-7', 2.2),
    ]), seed=34)
    out['prop-mushroom'] = svg(42, 44, ''.join([
        line('M5,22 q0,-17 16,-17 q16,0 16,17 q-16,5 -32,0 z'), line('M15,25 q-2,9 -1,14 h14 q1,-5 -1,-14'),
        line('M14,14 a2.4,2.4 0 1 0 0.1,0', 2.2), line('M25,11 a2.8,2.8 0 1 0 0.1,0', 2.2),
    ]), seed=35)
    out['prop-sparkle'] = svg(38, 38, ''.join([
        line('M19,4 q1.5,11 15,15 q-13.5,4 -15,15 q-1.5,-11 -15,-15 q13.5,-4 15,-15 z'),
    ]), seed=36)
    out['prop-bush'] = svg(64, 38, ''.join([
        line('M6,33 q-5,-11 6,-14 q2,-11 14,-9 q8,-9 17,0 q11,-1 11,10 q9,4 4,13 z'),
        line('M24,22 q4,-4 9,-2', 2.2, 'opacity="0.6"'), line('M38,27 q4,-3 8,-1', 2.2, 'opacity="0.6"'),
    ]), seed=37)
    return out


# --------------------------------------------------------------- export ----

def render(name, markup, workdir):
    width = int(float(markup.split('width="')[1].split('"')[0]))
    height = int(float(markup.split('height="')[1].split('"')[0]))
    page = os.path.join(workdir, name + '.html')
    with open(page, 'w') as handle:
        handle.write('<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head>'
                     f'<body>{markup}</body></html>')
    target = os.path.join(OUT, name + '.png')
    try:
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
                        f'--user-data-dir={os.path.join(workdir, "profile")}',
                        '--default-background-color=00000000', f'--force-device-scale-factor={SCALE}',
                        f'--window-size={width},{height}', f'--screenshot={target}', 'file://' + page],
                       check=True, timeout=60, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except subprocess.TimeoutExpired:
        if not os.path.exists(target):
            raise
    print(f'{name}.png  {width}x{height} @{SCALE}x')


def main():
    if not os.path.exists(CHROME):
        sys.exit('Google Chrome is needed to rasterise the drawings.')
    os.makedirs(OUT, exist_ok=True)
    drawings = {}
    drawings.update(stop_assets())
    drawings.update(trail_assets())
    drawings.update(badge_assets())
    drawings.update(prop_assets())
    workdir = tempfile.mkdtemp(prefix='prochoro-path-art-')
    try:
        for name, markup in drawings.items():
            render(name, markup, workdir)
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
    if shutil.which('oxipng'):
        subprocess.run(['oxipng', '-o', '4', '--strip', 'safe', '-q', *[os.path.join(OUT, n + '.png') for n in drawings]], check=False)


if __name__ == '__main__':
    main()
