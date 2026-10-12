"""Generate the VT monogram app icons (192, 512, maskable 512). Run with python3 -I."""
import sys
from PIL import Image, ImageDraw, ImageFont

THREAD = (46, 58, 135)
CHALK = (247, 243, 236)
OUT = sys.argv[1]

def font(size):
    for path in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                 "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()

def icon(size, maskable):
    img = Image.new("RGBA", (size, size), THREAD + (255,) if maskable else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if not maskable:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=THREAD)
    # Maskable: content inside the central 80% safe zone.
    scale = 0.62 if maskable else 0.8
    inner = size * scale
    off = (size - inner) / 2
    f = font(int(inner * 0.42))
    d.text((size / 2, off + inner * 0.42), "VT", font=f, fill=CHALK, anchor="mm")
    y = off + inner * 0.8
    w = max(2, int(size * 0.02))
    d.line([off + inner * 0.08, y, off + inner * 0.92, y], fill=CHALK, width=w)
    for i in range(6):
        x = off + inner * (0.12 + i * 0.152)
        h = inner * (0.09 if i % 2 == 0 else 0.05)
        d.line([x, y - h, x, y], fill=CHALK, width=max(1, w // 2 + 1))
    return img

icon(192, False).save(f"{OUT}/icon-192.png")
icon(512, False).save(f"{OUT}/icon-512.png")
icon(512, True).save(f"{OUT}/icon-maskable-512.png")
