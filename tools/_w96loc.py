from PIL import Image
import sys
im = Image.open(sys.argv[1]).convert('RGB')
W,H = im.size
print('size',W,H)
# tìm cụm logo (khối màu đậm khác nền) trong vùng sidebar trên
x0,y0,x1,y1 = 0,0,300,110
rows={}
for y in range(y0,y1):
    line=''
    for x in range(x0,x1):
        r,g,b = im.getpixel((x,y))
        lum = 0.299*r+0.587*g+0.114*b
        line += '#' if lum<90 else ('+' if lum<170 else '.')
    if '#' in line or '+' in line:
        rows[y]=line
ks=sorted(rows)[:80]
for y in ks:
    print('%3d %s'%(y, rows[y]))
