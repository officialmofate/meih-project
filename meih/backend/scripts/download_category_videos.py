#!/usr/bin/env python3
"""
Download short looping video clips from Pexels for MEIH category cards.

Usage:
  python download_category_videos.py YOUR_PEXELS_API_KEY

  Get a free API key at: https://www.pexels.com/api/
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
import subprocess
import shutil

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'assets', 'videos')
MAX_DURATION = 4  # seconds
TARGET_WIDTH = 480

CATEGORIES = {
    # Event categories
    'wedding':      'wedding ceremony dance',
    'corporate':    'corporate event conference',
    'birthday':     'birthday party celebration',
    'conference':   'business conference presentation',
    'concert':      'live concert music stage',
    'exhibition':   'art exhibition gallery',
    'festival':     'cultural festival celebration',
    'sports':       'sports event stadium',
    'charity':      'charity gala dinner event',
    'graduation':   'university graduation ceremony',
    'hackathon':    'coding hackathon teamwork',
    'community':    'community gathering outdoor',
    'celebration':  'celebration party confetti',
    'workshop':     'creative workshop hands',
    'ngo':          'ngo charity volunteer work',
    'product':      'product launch event stage',
    'other':        'event planning decoration',
    # Innovation categories
    'health':       'healthcare medical technology',
    'agritech':     'agriculture farming technology',
    'education':    'education classroom learning',
    'ai':           'artificial intelligence technology',
    'climate':      'nature forest climate',
    'fintech':      'digital payment banking mobile',
    'energy':       'solar panels renewable energy',
    'transport':    'smart city transportation',
    'robotics':     'robot automation technology',
    'water':        'clean water technology',
}


def search_videos(api_key, query, per_page=3):
    """Search Pexels for videos."""
    url = f'https://api.pexels.com/videos/search?query={urllib.parse.quote(query)}&per_page={per_page}&size=small'
    req = urllib.request.Request(url, headers={'Authorization': api_key})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f'  API error {e.code}: {e.reason}')
        return None
    except Exception as e:
        print(f'  Request error: {e}')
        return None


def get_best_file(video_data):
    """Pick the best video file (HD or SD, mp4 preferred)."""
    files = video_data.get('video_files', [])
    # Prefer HD mp4
    for f in files:
        if f.get('file_type') == 'video/mp4' and f.get('quality') == 'hd':
            return f['link']
    # Fall back to any mp4
    for f in files:
        if f.get('file_type') == 'video/mp4':
            return f['link']
    # Fall back to anything
    if files:
        return files[0].get('link')
    return None


def download_file(url, dest):
    """Download a file with progress."""
    print(f'  Downloading: {url[:80]}...')
    req = urllib.request.Request(url, headers={'User-Agent': 'MEIH-CategoryDownloader/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            with open(dest, 'wb') as f:
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    f.write(chunk)
        return True
    except Exception as e:
        print(f'  Download error: {e}')
        return False


def compress_video(input_path, output_path):
    """Trim and compress video using ffmpeg."""
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        print('  ffmpeg not found — saving raw video (larger file)')
        shutil.copy2(input_path, output_path)
        return True

    cmd = [
        ffmpeg, '-y', '-i', input_path,
        '-t', str(MAX_DURATION),
        '-vf', f'scale={TARGET_WIDTH}:-2',
        '-c:v', 'libx264', '-crf', '28',
        '-preset', 'fast',
        '-an',
        '-movflags', '+faststart',
        output_path
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, timeout=60)
        if result.returncode == 0:
            return True
        print(f'  ffmpeg error: {result.stderr.decode()[:200]}')
        shutil.copy2(input_path, output_path)
        return True
    except subprocess.TimeoutExpired:
        print('  ffmpeg timeout — saving raw video')
        shutil.copy2(input_path, output_path)
        return True
    except Exception as e:
        print(f'  ffmpeg error: {e}')
        shutil.copy2(input_path, output_path)
        return True


def main():
    if len(sys.argv) < 2:
        print('Usage: python download_category_videos.py YOUR_PEXELS_API_KEY')
        print('Get a free key at: https://www.pexels.com/api/')
        sys.exit(1)

    api_key = sys.argv[1]
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    import urllib.parse

    results = {}
    for category, query in CATEGORIES.items():
        print(f'\n[{category}] Searching: "{query}"')
        data = search_videos(api_key, query, per_page=3)
        if not data or not data.get('videos'):
            print(f'  No videos found, skipping')
            results[category] = None
            continue

        # Pick best video
        best_url = None
        for v in data['videos']:
            best_url = get_best_file(v)
            if best_url:
                break

        if not best_url:
            print(f'  No downloadable file found')
            results[category] = None
            continue

        raw_path = os.path.join(OUTPUT_DIR, f'{category}_raw.mp4')
        final_path = os.path.join(OUTPUT_DIR, f'{category}.mp4')

        if download_file(best_url, raw_path):
            print(f'  Compressing...')
            compress_video(raw_path, final_path)
            # Remove raw file
            if os.path.exists(raw_path) and os.path.exists(final_path) and raw_path != final_path:
                os.remove(raw_path)
            size_kb = os.path.getsize(final_path) // 1024
            print(f'  Saved: {final_path} ({size_kb} KB)')
            results[category] = f'{category}.mp4'
        else:
            results[category] = None

        # Respect rate limit
        time.sleep(0.5)

    # Write manifest
    manifest_path = os.path.join(OUTPUT_DIR, 'manifest.json')
    with open(manifest_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f'\nManifest written to {manifest_path}')
    print(f'Done! {sum(1 for v in results.values() if v)}/{len(results)} videos downloaded.')


if __name__ == '__main__':
    main()
