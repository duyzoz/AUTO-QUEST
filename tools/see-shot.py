"""Waves 49b — 'nhìn' ảnh chụp bằng ASCII + đo vùng.

Không đọc chữ. Chỉ trả: kích thước, và lưới ký tự theo ĐỘ SÁNG (đậm = sáng) +
bảng màu các ô đáng ngờ. Đủ để biết khung/hiệu ứng có NẰM ĐÚNG CHỖ không và có
mảng đen bất thường nào không.
"""
import sys
from PIL import Image

path = sys.argv[1]
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 96
im = Image.open(path).convert('RGB')
W, H = im.size
print(f"size={W}x{H}")

# lưới độ sáng
ramp = " .:-=+*#%@"
rows = max(1, int(cols * (H / W) * 0.5))
small = im.resize((cols, rows))
px = small.load()
print("--- luminance map (dấu đậm = sáng) ---")
for y in range(rows):
    line = ""
    for x in range(cols):
        r, g, b = px[x, y]
        lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
        line += ramp[min(len(ramp) - 1, int(lum * len(ramp)))]
    print(line)

# các ô đen bất thường (lum < 0.06) — nghi vấn "viền đen mờ"
print("--- dark blobs (lum<0.06), >=200px ---")
from collections import deque
mask = [[False] * cols for _ in range(rows)]
for y in range(rows):
    for x in range(cols):
        r, g, b = px[x, y]
        lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
        mask[y][x] = lum < 0.06
seen = [[False] * cols for _ in range(rows)]
for y in range(rows):
    for x in range(cols):
        if mask[y][x] and not seen[y][x]:
            q = deque([(x, y)]); seen[y][x] = True; cells = []
            while q:
                cx, cy = q.popleft(); cells.append((cx, cy))
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = cx+dx, cy+dy
                    if 0 <= nx < cols and 0 <= ny < rows and mask[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True; q.append((nx, ny))
            if len(cells) >= 6:
                xs = [c[0] for c in cells]; ys = [c[1] for c in cells]
                print(f"  blob: {len(cells)} cells, x {min(xs)}-{max(xs)} y {min(ys)}-{max(ys)}")

# màu trung bình từng dải ngang (10 dải)
print("--- avg color per horizontal band ---")
bands = 10
for i in range(bands):
    y0 = int(H*i/bands); y1 = max(y0+1, int(H*(i+1)/bands))
    crop = im.crop((0, y0, W, y1))
    px2 = crop.resize((1,1)).load()
    r, g, b = px2[0,0]
    print(f"  band {i} y{y0}-{y1}: rgb({r},{g},{b}) lum={round((0.2126*r+0.7152*g+0.0722*b)/255,3)}")
