import urllib.request
urls = [
    'https://assets.mixkit.co/videos/35895/35895-720.mp4',
    'https://assets.mixkit.co/videos/46675/46675-720.mp4',
    'https://assets.mixkit.co/videos/50051/50051-720.mp4',
]
for url in urls:
    try:
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            size = resp.headers.get('Content-Length', '?')
            print(f'OK - {size} bytes - {url}')
    except Exception as e:
        print(f'FAIL {e} - {url}')
