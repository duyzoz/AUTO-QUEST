"""Crop a rect from a PNG and print a coarse ASCII map + dominant colors.
Usage: python crop-see.py <png> <x> <y> <w> <h> [cols]
Because Read cannot display images in this environment.
"""
import sys
from PIL import Image

p = sys.argv[1]
x, y, w, h = (int(v) for v in sys.argv[2:6])
cols = int(sys.argv[6]) if len(sys.argv) > 6 else 78

im = Image.open(p).convert('RGBA')
im = im.crop((x, y, x + w, y + h))
W, H = im.size
print(f'crop {W}x{H} from ({x},{y})')

cell = W / cols
rows = max(1, int(H / (cell * 2.0)))  # char cells are ~2x tall
px = im.load()

ramp = ' .:-=+*#%@'
for ry in range(rows):
    line = []
    y0 = int(ry * H / rows)
    y1 = max(y0 + 1, int((ry + 1) * H / rows))
    for rx in range(cols):
        x0 = int(rx * W / cols)
        x1 = max(x0 + 1, int((rx + 1) * W / cols))
        tot = 0.0
        n = 0
        for yy in range(y0, y1):
            for xx in range(x0, x1):
                r, g, b, a = px[xx, yy]
                if a < 8:
                    continue
                tot += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0
                n += 1
        if n == 0:
            line.append('~')  # transparent
        else:
            v = tot / n
            line.append(ramp[min(len(ramp) - 1, int(v * len(ramp)))])
    print(f'{y0:4d} ' + ''.join(line))

# dominant opaque colors
from collections import Counter
c = Counter()
for yy in range(0, H, 3):
    for xx in range(0, W, 3):
        r, g, b, a = px[xx, yy]
        if a < 200:
            continue
        c[(r // 32 * 32, g // 32 * 32, b // 32 * 32)] += 1
print('--- dominant opaque colors (32-bucketed) ---')
for (r, g, b), n in c.most_common(10):
    print(f'  rgb({r:3d},{g:3d},{b:3d}) x{n}')
