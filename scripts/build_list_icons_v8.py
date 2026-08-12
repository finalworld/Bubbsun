from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\Administrator\Downloads\ChatGPT Image 12 aug. 2026 07_30_03.png")
REFERENCE = ROOT / "public/assets/new-icons/lists"
OUTPUT = ROOT / "public/assets/new-icons/lists-v8"
PREVIEW = ROOT / "list-icons-v8-verification.png"

NAMES = [
    "list_cart", "list_basket", "list_food", "list_dining",
    "list_home", "list_drink_cup", "list_work", "list_checklist",
    "list_fitness", "list_hiking", "list_pets", "list_vacation",
    "list_supporter_heart_cart", "list_supporter_moon",
    "list_supporter_emblem", "list_supporter_compass",
]


def alpha_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    return alpha.getbbox()


def components(alpha: np.ndarray):
    # Ignore only near-invisible export residue while finding each artwork.
    mask = alpha >= 8
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    found = []
    for y in range(height):
        for x in range(width):
            if not mask[y, x] or seen[y, x]:
                continue
            queue = deque([(y, x)])
            seen[y, x] = True
            points = []
            while queue:
                yy, xx = queue.popleft()
                points.append((yy, xx))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = yy + dy, xx + dx
                        if (0 <= ny < height and 0 <= nx < width and
                                mask[ny, nx] and not seen[ny, nx]):
                            seen[ny, nx] = True
                            queue.append((ny, nx))
            if len(points) >= 20:
                found.append(points)
    return found


def main():
    source = Image.open(SOURCE).convert("RGBA")
    pixels = np.asarray(source)
    groups = [[] for _ in range(16)]
    centers = [((col + .5) * source.width / 4, (row + .5) * source.height / 4)
               for row in range(4) for col in range(4)]

    for points in components(pixels[:, :, 3]):
        cy = sum(y for y, _ in points) / len(points)
        cx = sum(x for _, x in points) / len(points)
        group = min(range(16), key=lambda i: (cx - centers[i][0]) ** 2 + (cy - centers[i][1]) ** 2)
        groups[group].extend(points)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    preview = Image.new("RGB", (4 * 520, 4 * 320), "#eee0c4")
    draw = ImageDraw.Draw(preview)

    for index, name in enumerate(NAMES):
        points = groups[index]
        if not points:
            raise RuntimeError(f"No artwork found for {name}")
        ys = [p[0] for p in points]
        xs = [p[1] for p in points]
        x0, y0, x1, y1 = min(xs), min(ys), max(xs) + 1, max(ys) + 1
        isolated = Image.new("RGBA", source.size)
        mask = Image.new("L", source.size)
        mask_pixels = np.asarray(mask).copy()
        for y, x in points:
            mask_pixels[y, x] = pixels[y, x, 3]
        mask = Image.fromarray(mask_pixels, "L")
        isolated.paste(source, (0, 0), mask)
        artwork = isolated.crop((x0, y0, x1, y1))

        reference = Image.open(REFERENCE / f"{name}.png").convert("RGBA")
        target = alpha_bbox(reference)
        if target is None:
            raise RuntimeError(f"Reference icon has no alpha: {name}")
        tx0, ty0, tx1, ty1 = target
        target_w, target_h = tx1 - tx0, ty1 - ty0
        # Match the corresponding legacy icon's exact visible width and height.
        # This is intentionally not a generic "contain" operation: contain was
        # the reason several replacements looked smaller in otherwise identical cards.
        new_size = (target_w, target_h)
        artwork = artwork.resize(new_size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (256, 256))
        cx, cy = (tx0 + tx1) / 2, (ty0 + ty1) / 2
        px, py = round(cx - new_size[0] / 2), round(cy - new_size[1] / 2)
        canvas.alpha_composite(artwork, (px, py))
        canvas.save(OUTPUT / f"{name}.png", optimize=True)

        col, row = index % 4, index // 4
        ox, oy = col * 520, row * 320
        for panel_x, icon in ((ox + 20, reference), (ox + 270, canvas)):
            box = Image.new("RGB", (220, 220), "#8e77b7" if col % 2 == 0 else "#2f8582")
            display = icon.resize((220, 220), Image.Resampling.LANCZOS)
            box.paste(display, (0, 0), display)
            preview.paste(box, (panel_x, oy + 30))
        draw.text((ox + 20, oy + 265), f"OLD {name}", fill="#24170f")
        draw.text((ox + 270, oy + 265), f"NEW {name}", fill="#24170f")
        print(f"{name}: old={target_w}x{target_h} new={alpha_bbox(canvas)}")

    preview.save(PREVIEW)
    print(f"Wrote {OUTPUT}")
    print(f"Wrote {PREVIEW}")


if __name__ == "__main__":
    main()
