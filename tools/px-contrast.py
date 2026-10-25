"""Do contrast PIXEL THAT voi nen GRADIENT.

Nen duoc noi suy theo TUNG COT: lay pixel hang tren cung va hang duoi cung cua
anh crop (vung dem 3px, khong co glyph) roi noi tuyen theo y.
=> moi pixel co nen CUC BO rieng, dung ca khi nen la gradient doc.
"""
import sys
from PIL import Image


def lum(c):
    def f(v):
        s = v / 255
        return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])


def ratio(la, lb):
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def analyse(path, pad=3):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    px = im.load()
    # hang nen: 0..pad-1 va h-pad..h-1 (vung dem quanh rect, khong co glyph)
    rows = []
    samples = []
    for y in range(pad):
        for x in range(pad, w - pad):
            samples.append((x, y, px[x, y]))
    for y in range(h - pad, h):
        for x in range(pad, w - pad):
            samples.append((x, y, px[x, y]))
    if not samples:
        return dict(file=path, note='crop too small')

    top = {}
    bot = {}
    for x, y, c in samples:
        if y < pad:
            top.setdefault(x, []).append(c)
        else:
            bot.setdefault(x, []).append(c)
    avg = lambda cs: tuple(sum(c[i] for c in cs) // len(cs) for i in range(3))

    res = []
    for y in range(h):
        for x in range(w):
            t = top.get(x)
            b = bot.get(x)
            if t and b:
                ca, cb = avg(t), avg(b)
                f = y / (h - 1)
                bgc = tuple(ca[i] + (cb[i] - ca[i]) * f for i in range(3))
            elif t:
                bgc = avg(t)
            elif b:
                bgc = avg(b)
            else:
                continue
            lbg = lum(bgc)
            lc = lum(px[x, y])
            res.append((abs(lc - lbg), ratio(lc, lbg), px[x, y], bgc, lbg, lc))

    res.sort(key=lambda t: -t[0])
    maxdev = res[0][0]
    # "muc chu" = pixel lech > 45% do lech cuc dai (bo ria antialias)
    ink = [r for r in res if r[0] > maxdev * 0.45]
    rs = sorted(r[1] for r in ink)
    n = len(rs)
    darkest = min(ink, key=lambda r: r[5])
    brightest = max(ink, key=lambda r: r[5])
    # nen trung binh tren vung co chu
    p10 = rs[int(n * 0.10)]
    return dict(
        file=path.replace('\\', '/').split('/')[-1],
        bgMid='#%02x%02x%02x' % tuple(int(v) for v in res[len(res) // 2][3]),
        inkLo='#%02x%02x%02x' % darkest[2],
        inkHi='#%02x%02x%02x' % brightest[2],
        n=n,
        p10=round(rs[int(n * 0.10)], 2),
        p50=round(rs[int(n * 0.50)], 2),
        p90=round(rs[int(n * 0.90)], 2),
        maxdev=round(maxdev, 3),
        pass45=p10 >= 4.5,
    )


for p in sys.argv[1:]:
    print(analyse(p))
