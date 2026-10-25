"""Waves 46b — TÁCH NỀN THẬT cho orb-logo-big.png.

Vấn đề: file gốc bro đưa tên là `...-removebg-preview.png` nhưng pixel KHÔNG
trong suốt: toàn bộ 500x500 phủ một MÀN ĐEN alpha=128 (giác mạc xám), chỉ có
đĩa orb bên trong (bbox 432x433) đạt alpha=255. Vì alpha=128 không phải 0,
ảnh vẽ ra thành một Ô VUÔNG XÁM ĐEN — đúng như bro nói "logo có dc add xoá nền
đéo đâu".

Thuật toán (thuần Python, không cần thư viện ngoài):
  1. Đọc PNG RGBA + giun lọc (unfilter) các dòng IDAT.
  2. Xác định tâm + bán kính đĩa orb từ vùng alpha cao (>200).
  3. Với mỗi pixel:
       - ngoài bán kính R+feather  -> alpha = 0            (nền thật sự trong)
       - trong  bán kính R-feather -> giữ nguyên alpha
       - dải chuyển tiếp           -> giảm alpha theo khoảng cách (khử răng cưa)
  4. Loại luôn "màn đen": nơi alpha thấp & màu gần đen -> alpha = 0.
  5. Ghi lại PNG RGBA (nén zlib, filter 0).
"""
import struct, zlib, sys, math

def read_png(p):
    d = open(p, 'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n', 'not a PNG'
    i = 8
    idat = b''
    w = h = bd = ct = None
    while i < len(d):
        ln = struct.unpack('>I', d[i:i+4])[0]
        typ = d[i+4:i+8]
        body = d[i+8:i+8+ln]
        i += 12 + ln
        if typ == b'IHDR':
            w, h, bd, ct, comp, filt, inter = struct.unpack('>IIBBBBB', body)
        elif typ == b'IDAT':
            idat += body
        elif typ == b'IEND':
            break
    return w, h, bd, ct, zlib.decompress(idat)

def unfilter(raw, w, h, ch):
    stride = w * ch
    out = bytearray()
    prev = bytearray(stride)
    pos = 0
    for _ in range(h):
        ft = raw[pos]; pos += 1
        line = bytearray(raw[pos:pos+stride]); pos += stride
        if ft == 1:
            for x in range(ch, stride):
                line[x] = (line[x] + line[x-ch]) & 255
        elif ft == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif ft == 3:
            for x in range(stride):
                a = line[x-ch] if x >= ch else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif ft == 4:
            for x in range(stride):
                a = line[x-ch] if x >= ch else 0
                b = prev[x]
                c = prev[x-ch] if x >= ch else 0
                pp = a + b - c
                pa, pb, pc = abs(pp-a), abs(pp-b), abs(pp-c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out += line
        prev = line
    return out

def write_png(path, w, h, rgba):
    raw = bytearray()
    stride = w * 4
    for y in range(h):
        raw.append(0)
        raw += rgba[y*stride:(y+1)*stride]
    def chunk(t, data):
        c = struct.pack('>I', len(data)) + t + data
        return c + struct.pack('>I', zlib.crc32(t + data) & 0xffffffff)
    out = b'\x89PNG\r\n\x1a\n'
    out += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    out += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    out += chunk(b'IEND', b'')
    open(path, 'wb').write(out)

def cutout(src, dst, pad=0.985, feather=10, report=True):
    w, h, bd, ct, raw = read_png(src)
    assert ct == 6 and bd == 8, f'expect RGBA8, got ct={ct} bd={bd}'
    px = unfilter(raw, w, h, 4)

    # 1) centroid + radius of the solid disc (alpha > 200)
    sx = sy = n = 0
    for y in range(h):
        base = y * w * 4
        for x in range(w):
            if px[base + x*4 + 3] > 200:
                sx += x; sy += y; n += 1
    if not n:
        raise SystemExit('no opaque pixels — nothing to cut out')
    cx = sx / n; cy = sy / n

    # radius from the farthest opaque pixel (robust to a slightly off-centre disc)
    rmax = 0.0
    for y in range(h):
        base = y * w * 4
        for x in range(w):
            if px[base + x*4 + 3] > 200:
                d = math.hypot(x - cx, y - cy)
                if d > rmax:
                    rmax = d
    R = rmax * pad
    inner = R - feather
    if report:
        print(f'  size {w}x{h}  centroid ({cx:.1f},{cy:.1f})  Rmax {rmax:.1f}  R {R:.1f}')

    # 2) alpha keying by distance
    zeroed = 0
    for y in range(h):
        base = y * w * 4
        for x in range(w):
            o = base + x*4
            d = math.hypot(x - cx, y - cy)
            if d <= inner:
                # inside: keep, but kill a residual black veil (dark + already faint)
                a = px[o+3]
                if a < 40 and px[o] < 30 and px[o+1] < 30 and px[o+2] < 30:
                    px[o+3] = 0
                    zeroed += 1
                continue
            if d >= R:
                if px[o+3]:
                    px[o+3] = 0
                    zeroed += 1
                continue
            # feather band
            t = (R - d) / feather          # 0 at R, 1 at inner
            a = int(round(px[o+3] * t))
            if a < 8:
                a = 0
            if px[o+3] != a:
                zeroed += 1
            px[o+3] = a

    write_png(dst, w, h, px)
    if report:
        print(f'  zeroed/softened {zeroed} px  ->  {dst}')

    # 3) verify
    raw2 = read_png(dst)[4]
    px2 = unfilter(raw2, w, h, 4)
    def a(x, y): return px2[(y*w + x)*4 + 3]
    corners = {n: a(x, y) for n, (x, y) in {
        'TL': (2, 2), 'TR': (w-3, 2), 'BL': (2, h-3), 'BR': (w-3, h-3)}.items()}
    semi = sum(1 for y in range(0, h, 4) for x in range(0, w, 4) if 0 < a(x, y) < 255)
    zero = sum(1 for y in range(0, h, 4) for x in range(0, w, 4) if a(x, y) == 0)
    tot = len(range(0, h, 4)) * len(range(0, w, 4))
    if report:
        print(f'  corners {corners}')
        print(f'  alpha=0: {zero}/{tot} ({zero/tot*100:.1f}%)   semi: {semi}/{tot} ({semi/tot*100:.1f}%)')

if __name__ == '__main__':
    cutout(sys.argv[1], sys.argv[2],
           pad=float(sys.argv[3]) if len(sys.argv) > 3 else 0.985,
           feather=int(sys.argv[4]) if len(sys.argv) > 4 else 10)
