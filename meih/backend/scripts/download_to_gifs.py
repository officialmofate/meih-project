#!/usr/bin/env python3
import os, time, urllib.request, av
from PIL import Image

OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'assets', 'images')
TEMP = os.path.join(os.path.dirname(__file__), '_temp.mp4')
os.makedirs(OUTPUT, exist_ok=True)

VIDEOS = {
    'wedding': 35895, 'corporate': 46675, 'birthday': 50051,
    'conference': 13192, 'concert': 17631, 'exhibition': 46425,
    'festival': 18116, 'sports': 43483, 'charity': 23134,
    'graduation': 15923, 'hackathon': 22760, 'community': 4709,
    'celebration': 14873, 'workshop': 45957, 'ngo': 23326,
    'product': 50417, 'other': 5224, 'health': 5568,
    'agritech': 47260, 'education': 35954, 'ai': 22760,
    'climate': 14051, 'fintech': 46979, 'energy': 15452,
    'transport': 41389, 'robotics': 32295, 'water': 1164,
}

def download(vid_id, dest):
    url = f'https://assets.mixkit.co/videos/{vid_id}/{vid_id}-720.mp4'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=120) as r:
        with open(dest, 'wb') as f:
            while True:
                c = r.read(131072)
                if not c: break
                f.write(c)

def to_gif(mp4, gif):
    container = av.open(mp4)
    stream = container.streams.video[0]
    fps = float(stream.average_rate or 30)
    max_frames = 8 * 3  # 8fps * 3sec

    step = max(1, int(fps / 8))
    frames = []
    for i, frame in enumerate(container.decode(video=0)):
        if i >= max_frames * step:
            break
        if i % step == 0 and len(frames) < max_frames:
            img = frame.to_image()
            if img.width > 480:
                r = 480 / img.width
                img = img.resize((480, int(img.height * r)), Image.LANCZOS)
            frames.append(img)
    container.close()

    if not frames:
        return False

    qs = [f.quantize(colors=128, method=Image.Quantize.MEDIANCUT).convert('RGB') for f in frames]
    qs[0].save(gif, save_all=True, append_images=qs[1:], duration=125, loop=0, optimize=True)
    return True

ok = fail = 0
for cat, vid in VIDEOS.items():
    gif = os.path.join(OUTPUT, f'{cat}.gif')
    print(f'[{cat}] ', end='', flush=True)
    try:
        download(vid, TEMP)
        to_gif(TEMP, gif)
        sz = os.path.getsize(gif) // 1024
        print(f'OK {sz}KB')
        ok += 1
    except Exception as e:
        print(f'FAIL {e}')
        fail += 1
    if os.path.exists(TEMP):
        os.remove(TEMP)
    time.sleep(0.2)

print(f'\nDone: {ok}/{ok+fail} GIFs')
