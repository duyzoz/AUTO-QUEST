"""Tìm LỖ AVATAR trong layer rail (alpha = 0 ở giữa) → suy ra hệ quy chiếu thật.

Discord: layer rộng N px. Lỗ avatar (vùng trong suốt) nằm ở một vị trí cố định.
Tỉ lệ (lỗ/chiều rộng layer) là HẰNG SỐ → ta dùng nó để scale đúng theo avatar.
"""
import sys
from PIL import Image

for path in sys.argv[1:]:
    im = Image.open(path).convert('RGBA')
    W, H = im.size
    px = im.load()
    # quét độ trong suốt
    alpha = im.split()[3]
    # tìm hộp bao của vùng ĐỤC (alpha > 32)
    bbox = alpha.point(lambda a: 255 if a > 32 else 0).getbbox()
    print(f"{path}  size={W}x{H}  opaqueBBox={bbox}")
    # tìm vùng TRONG SUỐT ở GIỮA (hàng giữa ảnh)
    ymid = H // 2
    runs = []
    cur = None
    for x in range(W):
        a = px[x, ymid][3]
        if a <= 16:
            if cur is None:
                cur = x
        else:
            if cur is not None:
                runs.append((cur, x - 1))
                cur = None
    if cur is not None:
        runs.append((cur, W - 1))
    # lọc run dài (> 40px) = lỗ avatar/nền trong suốt
    big = [r for r in runs if r[1] - r[0] > 40]
    print(f"   ymid={ymid}: transparent runs>40px = {big}")
    for (x0, x1) in big:
        cxs = (x0 + x1) / 2
        print(f"     hole x {x0}-{x1}  center={cxs:.0f}  ({cxs/W*100:.2f}% of width)  width={x1-x0+1}px")
    # quét cột giữa để tìm lỗ theo chiều dọc
    xmid = W // 2
    vruns = []
    cur = None
    for y in range(H):
        a = px[xmid, y][3]
        if a <= 16:
            if cur is None:
                cur = y
        else:
            if cur is not None:
                vruns.append((cur, y - 1))
                cur = None
    if cur is not None:
        vruns.append((cur, H - 1))
    bigv = [r for r in vruns if r[1] - r[0] > 40]
    print(f"   xmid={xmid}: transparent vruns>40px = {bigv}")
    for (y0, y1) in bigv:
        print(f"     hole y {y0}-{y1}  ({y0/H*100:.2f}%..{y1/H*100:.2f}%)")
