#!/usr/bin/env python3
"""Baseline-JPEG decoder + ASCII/colour-region renderer, for diagnosing
screenshots when the model cannot view images.

Usage:
  python tools/jpeg-ascii.py <file.jpg> [--cols 96] [--rows 40] [--mode lum|colour]
"""
import struct
import sys
from collections import Counter

ZIGZAG = [
    0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5,
    12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28,
    35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51,
    58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63,
]


def clamp(v):
    return 0 if v < 0 else (255 if v > 255 else int(v))


class BitReader:
    def __init__(self, data):
        self.d = data
        self.i = 0
        self.b = 0
        self.n = 0

    def _fill(self):
        if self.i >= len(self.d):
            self.b = 0
            self.n = 8
            return
        c = self.d[self.i]
        self.i += 1
        if c == 0xFF:
            nxt = self.d[self.i] if self.i < len(self.d) else 0xD9
            if nxt == 0x00:
                self.i += 1          # stuffed 0xFF -> literal 0xFF byte
            elif 0xD0 <= nxt <= 0xD7:
                self.i += 1          # restart marker: skip it, resync
                c = 0
            else:
                c = 0
        self.b = c
        self.n = 8

    def bit(self):
        if self.n == 0:
            self._fill()
        self.n -= 1
        return (self.b >> self.n) & 1

    def bits(self, k):
        v = 0
        for _ in range(k):
            v = (v << 1) | self.bit()
        return v


def extend(v, t):
    return v - (1 << t) + 1 if t and v < (1 << (t - 1)) else v


def build_huff(bits, vals):
    code = 0
    k = 0
    table = {}
    for l in range(1, 17):
        for _ in range(bits[l - 1]):
            table[(l, code)] = vals[k]
            k += 1
            code += 1
        code <<= 1
    return table


def decode_huff(br, table):
    code = 0
    for l in range(1, 17):
        code = (code << 1) | br.bit()
        if (l, code) in table:
            return table[(l, code)]
    return 0


def idct(blk):
    """2D IDCT with correct normalisation (matches the JPEG spec's 1/4 factor)."""
    import math
    # precomputed cosine table
    cos = [[math.cos((2 * x + 1) * u * math.pi / 16) for u in range(8)] for x in range(8)]
    cu = [1 / math.sqrt(2) if u == 0 else 1.0 for u in range(8)]
    tmp = [[0.0] * 8 for _ in range(8)]
    out = [[0.0] * 8 for _ in range(8)]
    for y in range(8):
        for x in range(8):
            s = 0.0
            for u in range(8):
                s += cu[u] * blk[y][u] * cos[x][u]
            tmp[y][x] = s
    for x in range(8):
        for y in range(8):
            s = 0.0
            for v in range(8):
                s += cu[v] * tmp[v][x] * cos[y][v]
            # +128 = JPEG level shift (samples are stored shifted by -128).
            out[y][x] = s / 4.0 + 128.0
    return out


def decode(path):
    d = open(path, 'rb').read()
    assert d[:2] == b'\xff\xd8'
    i = 2
    qt = {}
    hts = {}
    sof = None
    while i < len(d) - 1:
        if d[i] != 0xFF:
            i += 1
            continue
        m = d[i + 1]
        if m == 0xD8 or m == 0x01 or 0xD0 <= m <= 0xD7:
            i += 2
            continue
        if m == 0xD9:
            break
        ln = struct.unpack('>H', d[i + 2:i + 4])[0]
        seg = d[i + 4:i + 2 + ln]
        if m == 0xDB:
            p = 0
            while p < len(seg):
                pq = seg[p] >> 4
                tq = seg[p] & 15
                p += 1
                if pq == 0:
                    qt[tq] = list(seg[p:p + 64])
                    p += 64
                else:
                    qt[tq] = list(struct.unpack('>64H', seg[p:p + 128]))
                    p += 128
        elif m in (0xC4,):
            p = 0
            while p < len(seg):
                tc = seg[p] >> 4
                th = seg[p] & 15
                p += 1
                bits = list(seg[p:p + 16])
                p += 16
                n = sum(bits)
                vals = list(seg[p:p + n])
                p += n
                hts[(tc, th)] = build_huff(bits, vals)
        elif m in (0xC0, 0xC1, 0xC2):
            prec = seg[0]
            h, w = struct.unpack('>HH', seg[1:5])
            nf = seg[5]
            comps = []
            p = 6
            for _ in range(nf):
                cid = seg[p]
                hv = seg[p + 1]
                tq = seg[p + 2]
                comps.append({'id': cid, 'h': hv >> 4, 'v': hv & 15, 'tq': tq})
                p += 3
            sof = {'w': w, 'h': h, 'comps': comps, 'prog': m == 0xC2}
        elif m == 0xDA:
            ns = seg[0]
            scan = []
            p = 1
            for _ in range(ns):
                cs = seg[p]
                tt = seg[p + 1]
                scan.append({'id': cs, 'dc': tt >> 4, 'ac': tt & 15})
                p += 2
            ss = seg[p]
            se = seg[p + 1]
            a = seg[p + 2]
            data = d[i + 2 + ln:]
            return sof, qt, hts, scan, data, ss, se, a
        i += 2 + ln
    raise ValueError('no SOS')


def render(path, cols=100, rows=44):
    sof, qt, hts, scan, data, ss, se, a = decode(path)
    w, h = sof['w'], sof['h']
    comps = sof['comps']
    byid = {c['id']: c for c in comps}
    hmax = max(c['h'] for c in comps)
    vmax = max(c['v'] for c in comps)
    mcux = (w + 8 * hmax - 1) // (8 * hmax)
    mcuy = (h + 8 * vmax - 1) // (8 * vmax)

    # full-res planes (subsampled chroma stored at its own res)
    planes = {}
    for c in comps:
        pw = mcux * c['h'] * 8
        ph = mcuy * c['v'] * 8
        planes[c['id']] = [[0] * pw for _ in range(ph)]

    br = BitReader(data)
    pred = {c['id']: 0 for c in comps}
    # Build an id -> scan-entry map. In a baseline interleaved scan, `scan[]` lists
    # every component with its own DC/AC table selector. Looking this up positionally
    # with .index() was buggy (and O(n) inside the hot loop).
    sc = {s['id']: s for s in scan}

    for my in range(mcuy):
        for mx in range(mcux):
            for c in comps:
                ent = sc[c['id']]
                dct = hts[(0, ent['dc'])]
                act = hts[(1, ent['ac'])]
                q = qt[c['tq']]
                for by in range(c['v']):
                    for bx in range(c['h']):
                        blk = [[0] * 8 for _ in range(8)]
                        t = decode_huff(br, dct)
                        diff = extend(br.bits(t), t) if t else 0
                        pred[c['id']] += diff
                        blk[0][0] = pred[c['id']] * q[0]
                        k = 1
                        while k < 64:
                            rs = decode_huff(br, act)
                            r = rs >> 4
                            s = rs & 15
                            if s == 0:
                                if r == 15:
                                    k += 16
                                    continue
                                break
                            k += r
                            if k > 63:
                                break
                            z = ZIGZAG[k]
                            v = extend(br.bits(s), s)
                            blk[z // 8][z % 8] = v * q[k]
                            k += 1
                        px = idct(blk)
                        oy = (my * c['v'] + by) * 8
                        ox = (mx * c['h'] + bx) * 8
                        pl = planes[c['id']]
                        for yy in range(8):
                            ry = oy + yy
                            if ry >= len(pl):
                                continue
                            row = pl[ry]
                            for xx in range(8):
                                rx = ox + xx
                                if rx < len(row):
                                    row[rx] = px[yy][xx]

    # sample to ASCII
    def sample(cid, x, y):
        c = byid[cid]
        pl = planes[cid]
        sx = min(len(pl[0]) - 1, int(x * c['h'] / hmax))
        sy = min(len(pl) - 1, int(y * c['v'] / vmax))
        return pl[sy][sx]

    ramp = ' .:-=+*#%@'
    out = []
    for oy in range(rows):
        line = ''
        for ox in range(cols):
            x = int((ox + 0.5) * w / cols)
            y = int((oy + 0.5) * h / rows)
            Y = sample(comps[0]['id'], x, y)
            if len(comps) >= 3:
                Cb = sample(comps[1]['id'], x, y)
                Cr = sample(comps[2]['id'], x, y)
            else:
                Cb = Cr = 128
            r = clamp(Y + 1.402 * (Cr - 128))
            g = clamp(Y - 0.344136 * (Cb - 128) - 0.714136 * (Cr - 128))
            b = clamp(Y + 1.772 * (Cb - 128))
            lum = (0.2126 * r + 0.7152 * g + 0.0722 * b)
            line += ramp[min(9, int(lum / 25.6))]
        out.append(line)
    print(f'--- {path.split(chr(92))[-1]} {w}x{h} ---')
    print('\n'.join(out))
    # colour region summary
    buckets = Counter()
    for oy in range(0, rows * 4, 4):
        for ox in range(0, cols * 4, 2):
            x = int((ox + 0.5) * w / (cols * 4))
            y = int((oy + 0.5) * h / (rows * 4))
            Y = sample(comps[0]['id'], x, y)
            Cb = sample(comps[1]['id'], x, y) if len(comps) >= 3 else 128
            Cr = sample(comps[2]['id'], x, y) if len(comps) >= 3 else 128
            r = clamp(Y + 1.402 * (Cr - 128))
            g = clamp(Y - 0.344136 * (Cb - 128) - 0.714136 * (Cr - 128))
            b = clamp(Y + 1.772 * (Cb - 128))
            buckets[(r // 48 * 48, g // 48 * 48, b // 48 * 48)] += 1
    print('\ntop colours (r,g,b)->count:')
    for c, n in buckets.most_common(10):
        print(f'  {c}: {n}')


def region(path, x0f, y0f, x1f, y1f, cols=110, rows=40):
    """Render a sub-region (fractions 0..1) at higher effective resolution."""
    sof, qt, hts, scan, data, ss, se, a = decode(path)
    w, h = sof['w'], sof['h']
    comps = sof['comps']
    sc = {s['id']: s for s in scan}
    hmax = max(c['h'] for c in comps)
    vmax = max(c['v'] for c in comps)
    mcux = (w + 8 * hmax - 1) // (8 * hmax)
    mcuy = (h + 8 * vmax - 1) // (8 * vmax)
    planes = {}
    for c in comps:
        planes[c['id']] = [[0] * (mcux * c['h'] * 8) for _ in range(mcuy * c['v'] * 8)]
    br = BitReader(data)
    pred = {c['id']: 0 for c in comps}
    for my in range(mcuy):
        for mx in range(mcux):
            for c in comps:
                ent = sc[c['id']]
                dct = hts[(0, ent['dc'])]
                act = hts[(1, ent['ac'])]
                q = qt[c['tq']]
                for by in range(c['v']):
                    for bx in range(c['h']):
                        blk = [[0] * 8 for _ in range(8)]
                        t = decode_huff(br, dct)
                        diff = extend(br.bits(t), t) if t else 0
                        pred[c['id']] += diff
                        blk[0][0] = pred[c['id']] * q[0]
                        k = 1
                        while k < 64:
                            rs = decode_huff(br, act)
                            r = rs >> 4
                            sz = rs & 15
                            if sz == 0:
                                if r == 15:
                                    k += 16
                                    continue
                                break
                            k += r
                            if k > 63:
                                break
                            z = ZIGZAG[k]
                            blk[z // 8][z % 8] = extend(br.bits(sz), sz) * q[k]
                            k += 1
                        px = idct(blk)
                        oy = (my * c['v'] + by) * 8
                        ox = (mx * c['h'] + bx) * 8
                        pl = planes[c['id']]
                        for yy in range(8):
                            ry = oy + yy
                            if ry >= len(pl):
                                continue
                            row = pl[ry]
                            for xx in range(8):
                                rx = ox + xx
                                if rx < len(row):
                                    row[rx] = px[yy][xx]

    def sample(cid, x, y):
        c = [cc for cc in comps if cc['id'] == cid][0]
        pl = planes[cid]
        sx = min(len(pl[0]) - 1, max(0, int(x * c['h'] / hmax)))
        sy = min(len(pl) - 1, max(0, int(y * c['v'] / vmax)))
        return pl[sy][sx]

    def rgb(x, y):
        # account for chroma being at a lower sampling rate
        Y = sample(1, x * hmax // hmax if False else x, y)
        Y = sample(comps[0]['id'], x // (hmax // comps[0]['h']), y // (vmax // comps[0]['v']))
        if len(comps) >= 3:
            Cb = sample(comps[1]['id'], x // (hmax // comps[1]['h']), y // (vmax // comps[1]['v']))
            Cr = sample(comps[2]['id'], x // (hmax // comps[2]['h']), y // (vmax // comps[2]['v']))
        else:
            Cb = Cr = 128
        return (clamp(Y + 1.402 * (Cr - 128)),
                clamp(Y - 0.344136 * (Cb - 128) - 0.714136 * (Cr - 128)),
                clamp(Y + 1.772 * (Cb - 128)))

    ramp = ' .:-=+*#%@'
    x0, x1 = int(x0f * w), int(x1f * w)
    y0, y1 = int(y0f * h), int(y1f * h)
    print(f'--- region x {x0}-{x1}  y {y0}-{y1} of {path.split(chr(92))[-1]} ---')
    for oy in range(rows):
        line = ''
        for ox in range(cols):
            x = x0 + int((ox + 0.5) * (x1 - x0) / cols)
            y = y0 + int((oy + 0.5) * (y1 - y0) / rows)
            r, g, b = rgb(x, y)
            line += ramp[min(9, int((0.2126 * r + 0.7152 * g + 0.0722 * b) / 25.6))]
        print(line)


def dumpgrid(path, x0f, y0f, x1f, y1f, cols=40, rows=24):
    """Print an RGB hex grid — lets me *read* actual colours per cell."""
    seq = []
    import io as _io
    sof, qt, hts, scan, data, ss, se, a = decode(path)
    w, h = sof['w'], sof['h']
    comps = sof['comps']
    sc = {s['id']: s for s in scan}
    hmax = max(c['h'] for c in comps)
    vmax = max(c['v'] for c in comps)
    mcux = (w + 8 * hmax - 1) // (8 * hmax)
    mcuy = (h + 8 * vmax - 1) // (8 * vmax)
    planes = {}
    for c in comps:
        planes[c['id']] = [[0] * (mcux * c['h'] * 8) for _ in range(mcuy * c['v'] * 8)]
    br = BitReader(data)
    pred = {c['id']: 0 for c in comps}
    for my in range(mcuy):
        for mx in range(mcux):
            for c in comps:
                ent = sc[c['id']]
                dct = hts[(0, ent['dc'])]
                act = hts[(1, ent['ac'])]
                q = qt[c['tq']]
                for by in range(c['v']):
                    for bx in range(c['h']):
                        blk = [[0] * 8 for _ in range(8)]
                        t = decode_huff(br, dct)
                        diff = extend(br.bits(t), t) if t else 0
                        pred[c['id']] += diff
                        blk[0][0] = pred[c['id']] * q[0]
                        k = 1
                        while k < 64:
                            rs = decode_huff(br, act)
                            r = rs >> 4
                            sz = rs & 15
                            if sz == 0:
                                if r == 15:
                                    k += 16
                                    continue
                                break
                            k += r
                            if k > 63:
                                break
                            z = ZIGZAG[k]
                            blk[z // 8][z % 8] = extend(br.bits(sz), sz) * q[k]
                            k += 1
                        px = idct(blk)
                        oy = (my * c['v'] + by) * 8
                        ox = (mx * c['h'] + bx) * 8
                        pl = planes[c['id']]
                        for yy in range(8):
                            ry = oy + yy
                            if ry >= len(pl):
                                continue
                            row = pl[ry]
                            for xx in range(8):
                                rx = ox + xx
                                if rx < len(row):
                                    row[rx] = px[yy][xx]

    def samp(cid, x, y):
        c = [cc for cc in comps if cc['id'] == cid][0]
        pl = planes[cid]
        sx = min(len(pl[0]) - 1, max(0, x * c['h'] // hmax))
        sy = min(len(pl) - 1, max(0, y * c['v'] // vmax))
        return pl[sy][sx]

    def rgb(x, y):
        Y = samp(comps[0]['id'], x, y)
        Cb = samp(comps[1]['id'], x, y) if len(comps) >= 3 else 128
        Cr = samp(comps[2]['id'], x, y) if len(comps) >= 3 else 128
        return (clamp(Y + 1.402 * (Cr - 128)),
                clamp(Y - 0.344136 * (Cb - 128) - 0.714136 * (Cr - 128)),
                clamp(Y + 1.772 * (Cb - 128)))

    x0, x1 = int(x0f * w), int(x1f * w)
    y0, y1 = int(y0f * h), int(y1f * h)
    print(f'--- RGB grid x {x0}-{x1} y {y0}-{y1} ---')
    for oy in range(rows):
        cells = []
        for ox in range(cols):
            x = x0 + int((ox + 0.5) * (x1 - x0) / cols)
            y = y0 + int((oy + 0.5) * (y1 - y0) / rows)
            r, g, b = rgb(x, y)
            cells.append(f'{r:02x}{g:02x}{b:02x}')
        print(' '.join(cells))


if __name__ == '__main__':
    args = sys.argv[1:]
    p = args[0]
    fn = render
    pos = [a for a in args[1:] if not a.startswith('--')]
    if '--grid' in args:
        fn = dumpgrid
    elif '--region' in args:
        fn = region
    if fn is dumpgrid:
        a = [float(v) for v in pos[:4]]
        cols = int(args[args.index('--cols') + 1]) if '--cols' in args else 40
        rows = int(args[args.index('--rows') + 1]) if '--rows' in args else 24
        fn(p, a[0], a[1], a[2], a[3], cols, rows)
    elif fn is region:
        a = [float(v) for v in pos[:4]]
        cols = int(args[args.index('--cols') + 1]) if '--cols' in args else 110
        rows = int(args[args.index('--rows') + 1]) if '--rows' in args else 40
        fn(p, a[0], a[1], a[2], a[3], cols, rows)
    else:
        cols = int(args[args.index('--cols') + 1]) if '--cols' in args else 100
        rows = int(args[args.index('--rows') + 1]) if '--rows' in args else 44
        fn(p, cols, rows)

