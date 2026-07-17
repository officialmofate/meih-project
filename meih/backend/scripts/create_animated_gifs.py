"""
Create animated video-like GIFs from static images using Ken Burns effect.
Adds slow zoom + pan motion to make images feel alive.
"""
import os
import math
from PIL import Image, ImageFilter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(SCRIPT_DIR, '../../frontend/assets/images')
OUTPUT_DIR = IMAGES_DIR  # overwrite in place

FPS = 10
DURATION_MS = 100  # per frame
TOTAL_FRAMES = 12  # ~1.2 seconds loop
OUTPUT_SIZE = (320, 240)


def ken_burns_frame(img, frame_idx, total_frames, zoom_start=1.0, zoom_end=1.25, pan_x=0.15, pan_y=0.1):
    """Generate a single Ken Burns frame."""
    t = frame_idx / total_frames
    # Ease in-out
    t = 0.5 - 0.5 * math.cos(t * math.pi)

    zoom = zoom_start + (zoom_end - zoom_start) * t
    # Oscillate pan direction for variety
    dx = pan_x * math.sin(t * math.pi * 2 - math.pi / 2)
    dy = pan_y * math.sin(t * math.pi * 2 - math.pi / 2)

    w, h = img.size
    new_w = int(w * zoom)
    new_h = int(h * zoom)

    # Resize up
    resized = img.resize((new_w, new_h), Image.LANCZOS)

    # Calculate crop position (centered + pan offset)
    cx = (new_w - OUTPUT_SIZE[0]) / 2 + dx * (new_w - OUTPUT_SIZE[0]) / 2
    cy = (new_h - OUTPUT_SIZE[1]) / 2 + dy * (new_h - OUTPUT_SIZE[1]) / 2

    cx = max(0, min(cx, new_w - OUTPUT_SIZE[0]))
    cy = max(0, min(cy, new_h - OUTPUT_SIZE[1]))

    frame = resized.crop((int(cx), int(cy), int(cx) + OUTPUT_SIZE[0], int(cy) + OUTPUT_SIZE[1]))
    return frame


def create_animated_gif(input_path, output_path):
    """Convert a static image to an animated Ken Burns GIF."""
    img = Image.open(input_path).convert('RGB')
    img = img.resize((OUTPUT_SIZE[0] + 100, OUTPUT_SIZE[1] + 60), Image.LANCZOS)

    frames = []
    for i in range(TOTAL_FRAMES):
        frame = ken_burns_frame(img, i, TOTAL_FRAMES,
                                zoom_start=1.0, zoom_end=1.15,
                                pan_x=0.1, pan_y=0.06)
        frames.append(frame)

    # Save animated GIF
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=DURATION_MS,
        loop=0,
        optimize=True,
    )
    size_kb = os.path.getsize(output_path) / 1024
    print(f"  Saved: {os.path.basename(output_path)} ({size_kb:.0f} KB, {TOTAL_FRAMES} frames)")


def main():
    # Event category images
    event_images = [
        'wedding.gif', 'corporate.gif', 'birthday.gif', 'conference.gif',
        'concert.gif', 'exhibition.gif', 'festival.gif', 'sports.gif',
        'charity.gif', 'graduation.gif', 'hackathon.gif', 'community.gif',
        'celebration.gif', 'workshop.gif', 'ngo.gif', 'product.gif', 'other.gif',
    ]

    # Innovation category images
    innovation_images = [
        'health.gif', 'agritech.gif', 'education.gif', 'ai.gif',
        'climate.gif', 'fintech.gif', 'energy.gif', 'transport.gif',
        'robotics.gif', 'water.gif',
    ]

    all_images = event_images + innovation_images

    print(f"Creating animated GIFs for {len(all_images)} categories...")
    print(f"  Size: {OUTPUT_SIZE[0]}x{OUTPUT_SIZE[1]}, {TOTAL_FRAMES} frames @ {DURATION_MS}ms")
    print()

    success = 0
    failed = 0
    for name in all_images:
        input_path = os.path.join(IMAGES_DIR, name)
        output_path = os.path.join(OUTPUT_DIR, name)

        if not os.path.exists(input_path):
            print(f"  SKIP (not found): {name}")
            failed += 1
            continue

        try:
            create_animated_gif(input_path, output_path)
            success += 1
        except Exception as e:
            print(f"  ERROR: {name} - {e}")
            failed += 1

    print(f"\nDone: {success} created, {failed} failed")


if __name__ == '__main__':
    main()
