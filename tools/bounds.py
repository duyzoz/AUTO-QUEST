"""Find the extent of the profile card + frame in a screenshot.
Detects non-background rows/columns to locate the card and the frame overhang.
Usage: python bounds.py <png|jpg> [x0 y0 x1 y1]
"""
import sys
from PIL import Image

p = sys.argv[1]
x0, y0, x1, y1 = (int(v) for v in sys.argv[2:6]) if len(sys.argv) > 5 else (0, 0, *Image.open(p).size)

im = Image.open(p).convert('RGB').crop((x0, y0, x1, y1))
W, H = im.size
px = im.load()

def lum(r, g, b):
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0

# Rows / cols whose max luminance is above a threshold = "something drawn"
TH = 0.16
rows = []
for yy in range(H):
    mx = 0.0
    for xx in range(0, W, 2):
        v = lum(*px[xx, yy])
        if v > mx:
            mx = v
    rows.append(mx)
cols = []
for xx in range(W):
    mx = 0.0
    for yy in range(0, H, 2):
        v = lum(*px[xx, yy])
        if v > mx:
            mx = v
    cols.append(mx)

def runs(vals, th, minlen=6):
    out, s = [], None
    for i, v in enumerate(vals):
        if v > th:
            if s is None:
                s = i
        else:
            if s is not None:
                if i - s >= minlen:
                    out.append((s + (y0 if vals is rows else x0), i - 1 + (y0 if vals is rows else x0)))
                s = None
    if s is not None and len(vals) - s >= minlen:
        out.append((s + (y0 if vals is rows else x0), len(vals) - 1 + (y0 if vals is rows else x0)))
    return out

print(f'image {W}x{H} (crop from {x0},{y0})')
print('row runs (y ranges with content):', runs(rows, TH))
print('col runs (x ranges with content):', runs(cols, TH))
