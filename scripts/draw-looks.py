#!/usr/bin/env python3
"""Draws the hats the platypus can wear.

Same approach as `draw-path-art.py`: hand-authored ink strokes with a slight
wobble, rasterised by headless Chrome into single-colour transparent PNGs.
Every hat is two layers:

  <id>.png       the ink lines, tinted with the theme's ink
  <id>-fill.png  the hat's solid shape, tinted with the page colour, so the
                 head's outline and tuft do not show through the hat

All hats share one 300 × 300 canvas. The point where the hat meets the top
of the head is (150, 240) and the head is 222 units wide (x 39–261); the app
places that point and width on the head measured by `measure-heads.py`.

    python3 scripts/draw-looks.py                 # writes src/assets/looks/
    python3 scripts/draw-looks.py --sheet out.png # also renders a review sheet
"""
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets', 'looks')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
SIZE = 300
SCALE = 2


def flower(cx, cy, r=11):
    """Five round petals and a centre, as fill shapes and ink outlines."""
    import math
    petals = []
    for i in range(5):
        a = math.radians(-90 + i * 72)
        px, py = cx + math.cos(a) * r * 0.95, cy + math.sin(a) * r * 0.95
        petals.append(f'M{px - r * 0.62:.1f} {py:.1f} a{r * 0.62:.1f} {r * 0.62:.1f} 0 1 0 {r * 1.24:.1f} 0 a{r * 0.62:.1f} {r * 0.62:.1f} 0 1 0 {-r * 1.24:.1f} 0')
    centre = f'M{cx - r * 0.34:.1f} {cy:.1f} a{r * 0.34:.1f} {r * 0.34:.1f} 0 1 0 {r * 0.68:.1f} 0 a{r * 0.34:.1f} {r * 0.34:.1f} 0 1 0 {-r * 0.68:.1f} 0'
    return petals, centre


def star(cx, cy, r):
    import math
    points = []
    for i in range(10):
        a = math.radians(-90 + i * 36)
        rr = r if i % 2 == 0 else r * 0.45
        points.append(f'{cx + math.cos(a) * rr:.1f} {cy + math.sin(a) * rr:.1f}')
    return 'M' + ' L'.join(points) + ' Z'


def flower_crown():
    import math
    fills, inks, dots = [], [], []
    # Flowers ride the dome: highest at the crown, lower towards the sides.
    for dx in (-84, -42, 0, 42, 84):
        cy = 240 + 44 * (dx / 111) ** 2 - 4
        petals, centre = flower(150 + dx, cy, 13 if dx == 0 else 11.5)
        fills += petals
        inks += [(p, 3.4) for p in petals]
        dots.append(centre)
    leaves = []
    for dx in (-63, -21, 21, 63):
        cy = 240 + 44 * (dx / 111) ** 2 + 2
        leaves.append((f'M{150 + dx - 9} {cy + 3} Q{150 + dx} {cy - 11} {150 + dx + 9} {cy + 3} Q{150 + dx} {cy + 9} {150 + dx - 9} {cy + 3}', 3))
    return {'fill': fills + [d for d, _ in leaves], 'ink': leaves + inks, 'solid': dots}


HATS = {
    # Mortarboard: a skullcap under a square board seen from a little above.
    'grad-cap': {
        'fill': [
            'M52 246 C52 212 92 196 150 196 C208 196 248 212 248 246 Q150 262 52 246 Z',
            'M30 184 L150 146 L270 184 L150 222 Z',
        ],
        'ink': [
            ('M52 246 C52 212 92 196 150 196 C208 196 248 212 248 246 Q150 262 52 246 Z', 4.2),
            ('M30 184 L150 146 L270 184 L150 222 Z', 4.4),
            ('M150 184 Q214 188 236 196 L236 238', 3.4),
            ('M226 236 L236 262 L246 236 Z', 3.2),
        ],
        'solid': ['M143 184 a7 6 0 1 0 14 0 a7 6 0 1 0 -14 0'],
    },
    # Knit beanie with a folded ribbed band and a pom-pom.
    'beanie': {
        'fill': [
            'M44 236 C38 160 100 122 150 122 C200 122 262 160 256 236 Z',
            'M34 256 Q150 280 266 256 L266 222 Q150 246 34 222 Z',
            'M132 110 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0',
        ],
        'ink': [
            ('M46 226 C40 160 100 122 150 122 C200 122 260 160 254 226', 4.2),
            ('M34 256 Q150 280 266 256 L266 222 Q150 246 34 222 Z', 4.2),
            ('M132 110 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0', 3.8),
            ('M62 232 L60 260', 2.6), ('M96 238 L95 266', 2.6), ('M130 242 L130 270', 2.6), ('M170 242 L170 270', 2.6),
            ('M204 238 L205 266', 2.6), ('M238 232 L240 260', 2.6),
            ('M96 156 Q110 142 128 136', 2.6), ('M142 102 l6 6 M158 100 l-4 8', 2.4),
        ],
        'solid': [],
    },
    # Top hat: a tall crown with a band, on a curled brim.
    'top-hat': {
        'fill': [
            'M30 242 Q150 280 270 242 Q150 214 30 242 Z',
            'M80 238 L88 104 Q150 88 212 104 L220 238 Q150 254 80 238 Z',
        ],
        'ink': [
            ('M30 242 Q150 280 270 242 Q150 214 30 242 Z', 4.2),
            ('M80 238 L88 104 Q150 88 212 104 L220 238', 4.4),
            ('M88 104 Q150 120 212 104', 3.4),
            ('M84 206 Q150 222 216 206 L215 182 Q150 198 85 182 Z', 3.2),
            ('M106 132 L104 168', 2.6),
        ],
        'solid': [],
    },
    # Striped party cone, tipped a little, with a pom on the point.
    'party-hat': {
        'fill': [
            'M94 246 L168 104 L214 238 Q156 262 94 246 Z',
            'M152 98 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0',
        ],
        'ink': [
            ('M94 246 L168 104 L214 238 Q156 262 94 246 Z', 4.4),
            ('M126 186 Q164 188 194 178', 3), ('M110 216 Q160 222 204 208', 3), ('M146 146 Q168 150 182 142', 3),
            ('M152 98 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0', 3.6),
            ('M160 86 l-6 -8 M176 84 l6 -8 M186 96 l9 -2', 2.6),
        ],
        'solid': ['M128 236 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0', 'M170 230 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
                  'M150 204 a4.5 4.5 0 1 0 9 0 a4.5 4.5 0 1 0 -9 0', 'M170 166 a4.5 4.5 0 1 0 9 0 a4.5 4.5 0 1 0 -9 0'],
    },
    # Explorer's pith helmet: a dome, a band and a wide brim.
    'explorer': {
        'fill': [
            'M54 236 C54 164 100 132 150 132 C200 132 246 164 246 236 Z',
            'M24 242 Q150 290 276 242 Q150 214 24 242 Z',
        ],
        'ink': [
            ('M54 236 C54 164 100 132 150 132 C200 132 246 164 246 236', 4.2),
            ('M24 242 Q150 290 276 242 Q150 214 24 242 Z', 4.2),
            ('M56 230 Q150 250 244 230 L242 208 Q150 228 58 208 Z', 3.2),
            ('M150 132 L150 120', 4), ('M96 166 Q114 148 134 142', 2.6),
        ],
        'solid': ['M143 118 a7 6 0 1 0 14 0 a7 6 0 1 0 -14 0'],
    },
    # Crown: a band with five points and a jewel on each.
    'crown': {
        'fill': ['M74 246 Q150 262 226 246 L232 180 L198 212 L176 166 L150 204 L124 166 L102 212 L68 180 Z'],
        'ink': [
            ('M74 246 Q150 262 226 246 L232 180 L198 212 L176 166 L150 204 L124 166 L102 212 L68 180 Z', 4.4),
            ('M78 226 Q150 242 222 226', 3),
        ],
        'solid': [
            'M61 176 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0', 'M117 162 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0',
            'M169 162 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0', 'M225 176 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0',
            star(150, 238, 8),
        ],
    },
    # Wizard's hat: a wide brim and a tall cone whose tip flops over.
    'wizard': {
        'fill': [
            'M22 240 Q150 286 278 240 Q150 214 22 240 Z',
            'M72 238 C102 182 130 118 160 70 Q182 40 222 46 Q190 62 186 98 C198 150 210 198 228 236 Q150 254 72 238 Z',
        ],
        'ink': [
            ('M22 240 Q150 286 278 240 Q150 214 22 240 Z', 4.2),
            ('M72 238 C102 182 130 118 160 70 Q182 40 222 46 Q190 62 186 98 C198 150 210 198 228 236', 4.4),
            ('M84 220 Q150 238 220 220', 3), ('M222 46 l8 -6 M224 54 l9 2', 2.4),
        ],
        'solid': [star(138, 182, 10), star(172, 138, 8), star(166, 206, 6)],
    },
    'flower-crown': flower_crown(),
}


def svg(shapes, layer, seed):
    if layer == 'fill':
        body = ''.join(f'<path d="{d}" fill="#000" stroke="#000" stroke-width="7" stroke-linejoin="round"/>' for d in shapes['fill'])
        body += ''.join(f'<path d="{d}" fill="#000"/>' for d in shapes.get('solid', []))
    else:
        body = ''.join(f'<path d="{d}" fill="none" stroke="#000" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>' for d, w in shapes['ink'])
        body += ''.join(f'<path d="{d}" fill="#000"/>' for d in shapes.get('solid', []))
    wobble = (f'<defs><filter id="w" x="-10%" y="-10%" width="120%" height="120%">'
              f'<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="{seed}"/>'
              f'<feDisplacementMap in="SourceGraphic" scale="1.6" xChannelSelector="R" yChannelSelector="G"/></filter></defs>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE}" height="{SIZE}" viewBox="0 0 {SIZE} {SIZE}">'
            f'{wobble}<g filter="url(#w)">{body}</g></svg>')


def render(markup, target, workdir, name):
    page = os.path.join(workdir, name + '.html')
    with open(page, 'w') as handle:
        handle.write('<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head>'
                     f'<body>{markup}</body></html>')
    try:
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
                        f'--user-data-dir={os.path.join(workdir, "profile")}', '--default-background-color=00000000',
                        f'--force-device-scale-factor={SCALE}', f'--window-size={SIZE},{SIZE}',
                        f'--screenshot={target}', 'file://' + page],
                       check=True, timeout=60, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except subprocess.TimeoutExpired:
        if not os.path.exists(target):
            raise


def review(out):
    """Every hat on a light and a dark tile, to judge the art on its own."""
    from PIL import Image
    tiles = []
    for name in HATS:
        ink = Image.open(os.path.join(OUT, name + '.png')).convert('RGBA')
        fill = Image.open(os.path.join(OUT, name + '-fill.png')).convert('RGBA')
        for bg, fg, page in (('white', (0, 0, 0), (255, 255, 255)), ('black', (255, 255, 255), (0, 0, 0))):
            tile = Image.new('RGBA', ink.size, bg)
            tile.alpha_composite(Image.new('RGBA', ink.size, page + (255,)), (0, 0), )
            knock = Image.new('RGBA', ink.size, page + (0,)); knock.putalpha(fill.getchannel('A'))
            tile.alpha_composite(knock)
            lines = Image.new('RGBA', ink.size, fg + (0,)); lines.putalpha(ink.getchannel('A'))
            tile.alpha_composite(lines)
            tiles.append(tile.convert('RGB').resize((200, 200)))
    sheet = Image.new('RGB', (len(HATS) * 2 * 204, 204), 'grey')
    for i, tile in enumerate(tiles):
        sheet.paste(tile, (i * 204 + 2, 2))
    sheet.save(out)
    print('review sheet:', out)


def main():
    if not os.path.exists(CHROME):
        sys.exit('Google Chrome is needed to rasterise the drawings.')
    os.makedirs(OUT, exist_ok=True)
    workdir = tempfile.mkdtemp(prefix='prochoro-looks-')
    try:
        for seed, (name, shapes) in enumerate(HATS.items(), start=61):
            render(svg(shapes, 'ink', seed), os.path.join(OUT, name + '.png'), workdir, name)
            render(svg(shapes, 'fill', seed), os.path.join(OUT, name + '-fill.png'), workdir, name + '-fill')
            print(name)
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
    if shutil.which('oxipng'):
        subprocess.run(['oxipng', '-o', '4', '--strip', 'safe', '-q', '-r', OUT], check=False)
    if len(sys.argv) >= 3 and sys.argv[1] == '--sheet':
        review(sys.argv[2])


if __name__ == '__main__':
    main()
