import urllib.request

patterns = [
    'https://videos.pexels.com/video-files/373290/373290-sd_640_360_30fps.mp4',
    'https://videos.pexels.com/video-files/373290/373290-hd_1280_720_30fps.mp4',
]
headers = {'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.pexels.com/'}
for url in patterns:
    try:
        req = urllib.request.Request(url, headers=headers, method='HEAD')
        with urllib.request.urlopen(req, timeout=10) as resp:
            size = resp.headers.get('Content-Length', '?')
            print(f'OK {resp.status} - {size} bytes - {url}')
    except Exception as e:
        print(f'FAIL {e} - {url}')
