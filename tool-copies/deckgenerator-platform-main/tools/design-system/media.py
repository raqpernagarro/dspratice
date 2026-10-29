# Re-encodes the media the template examples reference, plus the whole brand photo
# library, into out/project/media/ (run from .build/). Uses macOS `sips`; the
# repo's `sharp` binary is blocked by code-signing policy on some machines.
# Every file must stay under 512 KB (the design system's cap for loose files).
import json, os, shutil, subprocess, urllib.parse

R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = 'out/project/media/'
LIMIT = 500_000

used = [urllib.parse.unquote(p) for p in json.load(open('assets.json'))]
photos = ['assets/photography/' + f for f in sorted(os.listdir(R + '/assets/photography'))
          if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
paths = list(dict.fromkeys(used + photos))

def sips(src, dst, *args):
    subprocess.run(['sips', *args, src, '--out', dst], capture_output=True, check=False)

def width(src):
    out = subprocess.run(['sips', '-g', 'pixelWidth', src], capture_output=True, text=True).stdout
    return int(out.split()[-1])

def shrink_png(src, dst, w):
    """Palette-quantise a PNG that is still too large (keeps transparency)."""
    try:
        from PIL import Image
        im = Image.open(src)
        im.thumbnail((w, w))
        im = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
        im.save(dst, optimize=True)
    except ImportError:
        sips(src, dst, '-Z', str(w))

total, big = 0, []
for p in paths:
    src, dst = R + '/' + p, OUT + p
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    ext = os.path.splitext(p)[1].lower()
    if ext in ('.svg', '.gif'):
        shutil.copyfile(src, dst)
    elif 'photography' in p:
        # Longest side 1440px, quality 55: ~170 KB a photo.
        sips(src, dst, '-s', 'format', 'jpeg', '-s', 'formatOptions', '55', '-Z', '1440')
    elif ext == '.png':
        if os.path.getsize(src) <= LIMIT:
            shutil.copyfile(src, dst)
        else:
            sips(src, dst, '--resampleWidth', str(min(width(src), 1280)))
            if os.path.getsize(dst) > LIMIT:
                shrink_png(src, dst, 900)
            if os.path.getsize(dst) > LIMIT:
                sips(src, dst, '--resampleWidth', '640')
    else:
        sips(src, dst, '-s', 'format', 'jpeg', '-s', 'formatOptions', '70', '--resampleWidth', str(min(width(src), 1920)))
        if os.path.getsize(dst) > LIMIT:
            sips(src, dst, '-s', 'format', 'jpeg', '-s', 'formatOptions', '60', '--resampleWidth', str(min(width(src), 1280)))
    size = os.path.getsize(dst)
    total += size
    if size > 512_000:
        big.append((p, size))

shutil.copyfile(R + '/assets/photography/manifest.json', OUT + 'assets/photography/manifest.json')
print(f'media: {len(paths)} files, {total / 1e6:.1f} MB', '' if not big else f'— OVER 512 KB: {big}')
if big:
    raise SystemExit(1)
