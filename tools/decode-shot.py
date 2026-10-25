#!/usr/bin/env python3
"""Pure-python PNG/JPG reader for diagnosing screenshots when no OCR / no image
viewing is available.  Prints dimensions, a coarse colour histogram and a
per-row brightness signature so the *shape* of a UI can be inferred.

Usage:  python tools/decode-shot.py <file> [--rows N] [--cols M]
"""
import struct
import sys
import zlib
from collections import Counter


def read_png(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'not a png'
    pos = 8
    idat = b''
    w = h = bd = ct = None
    plte = None
    trns = None
    while pos < len(data):
        ln = struct.unpack('>I', data[pos:pos + 4])[0]
        typ = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + ln]
        if typ == b'IHDR':
            w, h, bd, ct, comp, filt, inter = struct.unpack('>IIBBBBB', body)
            assert inter == 0, 'interlaced png unsupported'
        elif typ == b'PLTE':
            plte = body
        elif typ == b'tRNS':
            trns = body
        elif typ == b'IDAT':
            idat += body
        elif typ == b'IEND':
            break
        pos += 12 + ln
    raw = zlib.decompress(idat)
    ch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ct]
    assert bd == 8, f'bit depth {bd} unsupported'
    stride = w * ch
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]
        p += 1
        line = bytearray(raw[p:p + stride])
        p += stride
        if f == 1:
            for i in range(ch, stride):
                line[i] = (line[i] + line[i - ch]) & 255
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                b = prev[i]
                c = prev[i - ch] if i >= ch else 0
                pa = abs(b - c)
                pb = abs(a - c)
                pc = abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    # expand palette
    if ct == 3:
        rgb = bytearray(w * h * 3)
        for i in range(w * h):
            idx = out[i]
            rgb[i * 3:i * 3 + 3] = plte[idx * 3:idx * 3 + 3]
        return w, h, 3, rgb
    if ct == 0:
        rgb = bytearray(w * h * 3)
        for i in range(w * h):
            v = out[i]
            rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = v
        return w, h, 3, rgb
    if ct == 4:
        rgb = bytearray(w * h * 3)
        for i in range(w * h):
            v = out[i * 2]
            rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = v
        return w, h, 3, rgb
    return w, h, 3, out


def read_jpg(path):
    """Minimal baseline-JPEG decoder (enough for diagnostics)."""
    data = open(path, 'rb').read()
    pos = 2
    qt = {}
    huff = {}
    w = h = None
    comps = []
    scan = None
    while pos < len(data) - 1:
        if data[pos] != 0xFF:
            pos += 1
            continue
        m = data[pos + 1]
        pos += 2
        if m in (0xD8, 0x01) or 0xD0 <= m <= 0xD7:
            continue
        if m == 0xD9:
            break
        ln = struct.unpack('>H', data[pos:pos + 2])[0]
        seg = data[pos + 2:pos + ln]
        if m == 0xDB:
            i = 0
            while i < len(seg):
                pq = seg[i] >> 4
                tq = seg[i] & 15
                i += 1
                n = 64 * (2 if pq else 1)
                vals = []
                for k in range(64):
                    vals.append(struct.unpack('>H', seg[i + 2 * k:i + 2 * k + 2])[0] if pq
                                else seg[i + k])
                i += n
                zig = [0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26,
                       33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56,
                       57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38,
                       31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63]
                tbl = [0] * 64
                for z, v in zip(zig, vals):
                    tbl[z] = v
                qt[tq] = tbl
        elif m == 0xC4:
            i = 0
            while i < len(seg):
                tc = seg[i] >> 4
                th = seg[i] & 15
                i += 1
                counts = seg[i:i + 16]
                i += 16
                total = sum(counts)
                syms = seg[i:i + total]
                i += total
                code = 0
                k = 0
                table = {}
                for l in range(1, 17):
                    for _ in range(counts[l - 1]):
                        table[(l, code)] = syms[k]
                        k += 1
                        code += 1
                    code <<= 1
                huff[(tc, th)] = table
        elif m == 0xC0 or m == 0xC1:
            h = struct.unpack('>H', seg[1:3])[0]
            w = struct.unpack('>H', seg[3:5])[0]
            nc = seg[5]
            comps = []
            for c in range(nc):
                cid, samp, tq = seg[6 + c * 3:9 + c * 3]
                comps.append({'id': cid, 'h': samp >> 4, 'v': samp & 15, 'tq': tq})
        elif m == 0xDA:
            i = 0
            ns = seg[0]
            for c in range(ns):
                cs, td = seg[1 + c * 2:3 + c * 2]
                for cc in comps:
                    if cc['id'] == cs:
                        cc['dc'] = td >> 4
                        cc['ac'] = td & 15
            scan = data[pos + ln:]
            break
        pos += ln
    if w is None:
        raise ValueError('no SOF found')
    return w, h, comps, scan, qt, huff


def jpg_probe(path):
    """Decode a downsampled grayscale grid from a baseline JPEG (diagnostic only)."""
    import math
    w, h, comps, scan, qt, huff = read_jpg(path)
    # bit reader with 0xFF00 unstuffing
    bits = []
    i = 0
    n = len(scan)
    while i < n:
        b = scan[i]
        if b == 0xFF:
            if i + 1 < n and scan[i + 1] == 0:
                bits.append(0xFF)
                i += 2
                continue
            if i + 1 < n and 0xD0 <= scan[i + 1] <= 0xD7:
                i += 2
                continue
            break
        bits.append(b)
        i += 1
    bitpos = [0]

    def getbit():
        p = bitpos[0]
        if p >= len(bits) * 8:
            return 0
        bitpos[0] = p + 1
        return (bits[p >> 3] >> (7 - (p & 7))) & 1

    def decode(tbl):
        code = 0
        for l in range(1, 17):
            code = (code << 1) | getbit()
            if (l, code) in tbl:
                return tbl[(l, code)]
        return 0

    def extend(v, t):
        return v - (1 << t) + 1 if t and v < (1 << (t - 1)) else v

    zig = [0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40,
           48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29,
           22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54,
           47, 55, 62, 63]
    cos = [[math.cos((2 * x + 1) * u * math.pi / 16) for x in range(8)] for u in range(8)]

    def idct(blk):
        out = [[0.0] * 8 for _ in range(8)]
        for y in range(8):
            for x in range(8):
                s = 0.0
                for v in range(8):
                    for u in range(8):
                        s += (0.25 if u and v else (0.125 * math.sqrt(2)) if (u or v) else 0.0625) * \
                             blk[v * 8 + u] * cos[u][x] * cos[v][y]
                out[y][x] = s
        return out

    maxh = max(c['h'] for c in comps)
    maxv = max(c['v'] for c in comps)
    mcux = (w + 8 * maxh - 1) // (8 * maxh)
    mcuy = (h + 8 * maxv - 1) // (8 * maxv)
    # only decode luma (first component)
    c0 = comps[0]
    pred = 0
    luma = [[128] * w for _ in range(h)]
    for my in range(mcuy):
        for mx in range(mcux):
            for cv in range(c0['v']):
                for chh in range(c0['h']):
                    blk = [0] * 64
                    t = decode(huff[(0, c0['dc'])])
                    diff = extend(decode_signed(bits, bitpos, t), t) if t else 0
                    pred += diff
                    blk[0] = pred * qt[c0['tq']][0]
                    k = 1
                    while k < 64:
                        rs = decode(huff[(1, c0['ac'])])
                        r, s = rs >> 4, rs & 15
                        if s == 0:
                            if r != 15:
                                break
                            k += 16
                            continue
                        k += r
                        if k > 63:
                            break
                        v = extend(decode_signed(bits, bitpos, s), s)
                        blk[zig[k]] = v * qt[c0['tq']][k]
                        k += 1
                    px = idct(blk)
                    bx = (mx * c0['h'] + chh) * 8
                    by = (my * c0['v'] + cv) * 8
                    for y in range(8):
                        if by + y >= h:
                            break
                        for x in range(8):
                            if bx + x >= w:
                                break
                            luma[by + y][bx + x] = max(0, min(255, int(px[y][x] + 128)))
    return w, h, luma


def decode_signed(bits, bitpos, n):
    v = 0
    for _ in range(n):
        p = bitpos[0]
        b = (bits[p >> 3] >> (7 - (p & 7))) & 1 if p < len(bits) * 8 else 0
        bitpos[0] = p + 1
        v = (v << 1) | b
    return v


def report_gray(w, h, gray, rows, cols):
    """Per-region brightness grid + row signature."""
    print(f'  size: {w}x{h}')
    print('  brightness grid (0=black 9=white):')
    bh = max(1, h // rows)
    bw = max(1, w // cols)
    for r in range(rows):
        line = ''
        for c in range(cols):
            y0, y1 = r * bh, min(h, (r + 1) * bh)
            x0, x1 = c * bw, min(w, (c + 1) * bw)
            tot = cnt = 0
            for y in range(y0, y1, 2):
                for x in range(x0, x1, 2):
                    tot += gray[y][x]
                    cnt += 1
            avg = tot / max(1, cnt)
            line += str(min(9, int(avg / 25.6)))
        print(f'   {line}')
    print('  row signature (mean brightness per row band):')
    step = max(1, h // 40)
    sig = []
    for y in range(0, h, step):
        tot = sum(gray[y]) / w
        sig.append(tot)
    print('   ' + ' '.join(f'{int(v)}' for v in sig))


def main():
    files = [a for a in sys.argv[1:] if not a.startswith('--')]
    rows = 20
    cols = 60
    if '--rows' in sys.argv:
        rows = int(sys.argv[sys.argv.index('--rows') + 1])
    if '--cols' in sys.argv:
        cols = int(sys.argv[sys.argv.index('--cols') + 1])
    for f in files:
        print(f'=== {f}')
        try:
            if f.lower().endswith('.jpg') or f.lower().endswith('.jpeg'):
                w, h, luma = jpg_probe(f)
                report_gray(w, h, luma, rows, cols)
            else:
                w, h, ch, px = read_png(f)
                gray = [[(px[(y * w + x) * 3] * 299 + px[(y * w + x) * 3 + 1] * 587 +
                         px[(y * w + x) * 3 + 2] * 114) // 1000 for x in range(w)] for y in range(h)]
                # colour histogram (quantised)
                hist = Counter()
                for y in range(0, h, 3):
                    for x in range(0, w, 3):
                        i = (y * w + x) * 3
                        r, g, b = px[i], px[i + 1], px[i + 2]
                        hist[(r >> 5 << 5, g >> 5 << 5, b >> 5 << 5)] += 1
                top = hist.most_common(10)
                total = sum(hist.values())
                print('  top colours:', ', '.join(
                    f'#{r:02x}{g:02x}{b:02x}({100 * c // total}%)' for (r, g, b), c in top))
                report_gray(w, h, gray, rows, cols)
        except Exception as e:
            print(f'  ERROR: {type(e).__name__}: {e}')


if __name__ == '__main__':
    main()
