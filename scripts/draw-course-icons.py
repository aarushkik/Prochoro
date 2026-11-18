#!/usr/bin/env python3
"""Draws subject emblems for courses added after the original eight.

Same approach as `draw-path-art.py`: hand-authored ink strokes with a slight
wobble, rasterised by headless Chrome at 3x into single-colour transparent
PNGs that the app tints with the theme's ink. Stroke weight and the small
accent marks match the generated emblems in `courses.png`.

    python3 scripts/draw-course-icons.py
"""
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets', 'characters', 'prochoro')
SITE = os.path.join(ROOT, 'site', 'img', 'prochoro')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
SIZE = 148
SCALE = 3


def svg(body, seed):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE}" height="{SIZE}" viewBox="0 0 {SIZE} {SIZE}">'
            f'<defs><filter id="w" x="-10%" y="-10%" width="120%" height="120%">'
            f'<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="{seed}"/>'
            f'<feDisplacementMap in="SourceGraphic" scale="1.4" xChannelSelector="R" yChannelSelector="G"/></filter></defs>'
            f'<g filter="url(#w)" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">{body}</g></svg>')


def path(d, width=4):
    return f'<path d="{d}" stroke-width="{width}"/>'


def circle(cx, cy, r, width=4, fill=False):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" stroke-width="{width}"' + (' fill="#000"' if fill else '') + '/>'


# AP Computer Science Principles: the internet as a globe of connected nodes.
CSP = ''.join([
    circle(62, 78, 38),
    path('M62 40 C44 54 44 102 62 116 C80 102 80 54 62 40', 3.4),
    path('M25 78 H99', 3.4),
    path('M30 60 C48 66 76 66 94 60', 3.2),
    path('M30 96 C48 90 76 90 94 96', 3.2),
    path('M94 52 L116 30', 3.4), path('M100 84 L126 90', 3.4), path('M88 108 L108 126', 3.4),
    path('M116 30 L126 90', 2.8), path('M126 90 L108 126', 2.8),
    circle(118, 28, 8), circle(127, 91, 8), circle(108, 128, 7),
    circle(118, 28, 2.4, 2, True), circle(127, 91, 2.4, 2, True),
    path('M18 30 l8 6', 3), path('M30 18 l4 9', 3), path('M14 46 l9 1', 3),
])

# AP Statistics: a histogram under its normal curve.
STATS = ''.join([
    path('M20 18 V128 H136', 4),
    path('M16 24 l4 -6 l4 6', 3.2), path('M130 124 l6 4 l-6 4', 3.2),
    path('M30 128 V112 H46 V128', 3.6), path('M46 128 V84 H62 V128', 3.6), path('M62 128 V58 H78 V128', 3.6),
    path('M78 128 V84 H94 V128', 3.6), path('M94 128 V112 H110 V128', 3.6),
    path('M24 124 C44 122 52 44 70 42 C88 44 96 122 120 124', 4.4),
    path('M70 42 V128', 2.4).replace('stroke-width="2.4"', 'stroke-width="2.4" stroke-dasharray="5 6"'),
    path('M110 26 l7 7', 3), path('M122 22 l2 10', 3), path('M130 34 l-9 3', 3),
])

ICONS = {'course-ap-csp': (CSP, 41), 'course-ap-stats': (STATS, 43)}


def render(name, markup, workdir):
    page = os.path.join(workdir, name + '.html')
    with open(page, 'w') as handle:
        handle.write('<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head>'
                     f'<body>{markup}</body></html>')
    target = os.path.join(OUT, name + '.png')
    try:
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
                        f'--user-data-dir={os.path.join(workdir, "profile")}', '--default-background-color=00000000',
                        f'--force-device-scale-factor={SCALE}', f'--window-size={SIZE},{SIZE}',
                        f'--screenshot={target}', 'file://' + page],
                       check=True, timeout=60, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except subprocess.TimeoutExpired:
        if not os.path.exists(target):
            raise
    os.makedirs(SITE, exist_ok=True)
    shutil.copyfile(target, os.path.join(SITE, name + '.png'))
    print(name + '.png')


def main():
    if not os.path.exists(CHROME):
        sys.exit('Google Chrome is needed to rasterise the drawings.')
    workdir = tempfile.mkdtemp(prefix='prochoro-course-icons-')
    try:
        for name, (body, seed) in ICONS.items():
            render(name, svg(body, seed), workdir)
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
    if shutil.which('oxipng'):
        files = [os.path.join(OUT, n + '.png') for n in ICONS] + [os.path.join(SITE, n + '.png') for n in ICONS]
        subprocess.run(['oxipng', '-o', '4', '--strip', 'safe', '-q', *files], check=False)


if __name__ == '__main__':
    main()
