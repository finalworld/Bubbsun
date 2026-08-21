from pathlib import Path
from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"

# Remove the warm paper background without changing the logo's original colours.
logo_source = Image.open(ASSETS / "bubbsun-logo-source.png").convert("RGB")
background = Image.new("RGB", logo_source.size, logo_source.getpixel((0, 0)))
difference = ImageChops.difference(logo_source, background)
r, g, b = difference.split()
alpha = ImageChops.lighter(ImageChops.lighter(r, g), b).point(lambda value: 0 if value < 22 else min(255, (value - 22) * 9))
logo = logo_source.convert("RGBA")
logo.putalpha(alpha)
logo_path = ASSETS / "bubbsun-logo-new.png"
bbox = logo.getchannel("A").getbbox()
if bbox:
    left, top, right, bottom = bbox
    pad = 18
    bbox = (max(0, left-pad), max(0, top-pad), min(logo.width, right+pad), min(logo.height, bottom+pad))
    logo.crop(bbox).save(logo_path)

def remove_paper(cell: Image.Image) -> Image.Image:
    """Remove the connected warm paper/card background, while keeping pale highlights."""
    rgb = cell.convert("RGB")
    pixels = rgb.load()
    width, height = rgb.size
    seen = set()
    stack = []
    for x in range(width):
        stack.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        stack.extend(((0, y), (width - 1, y)))

    def paper(pixel):
        r, g, b = pixel
        return r > 205 and g > 185 and b > 150 and max(pixel) - min(pixel) < 95

    mask = Image.new("L", rgb.size, 255)
    alpha = mask.load()
    while stack:
        point = stack.pop()
        if point in seen:
            continue
        seen.add(point)
        x, y = point
        if not paper(pixels[x, y]):
            continue
        alpha[x, y] = 0
        if x: stack.append((x - 1, y))
        if x + 1 < width: stack.append((x + 1, y))
        if y: stack.append((x, y - 1))
        if y + 1 < height: stack.append((x, y + 1))

    mask = mask.filter(ImageFilter.GaussianBlur(.55))
    result = rgb.convert("RGBA")
    result.putalpha(mask)
    bbox = mask.point(lambda value: 255 if value > 24 else 0).getbbox()
    return result.crop(bbox) if bbox else result

def square_asset(image: Image.Image, size: int = 256, padding: int = 12) -> Image.Image:
    image.thumbnail((size - padding * 2, size - padding * 2), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size))
    canvas.alpha_composite(image, ((size - image.width) // 2, (size - image.height) // 2))
    return canvas

def crop_grid(source: Path, cols: int, rows: int, names: list[str], out_dir: Path, inset: int = 18):
    image = Image.open(source).convert("RGBA")
    out_dir.mkdir(parents=True, exist_ok=True)
    cell_w, cell_h = image.width / cols, image.height / rows
    for index, name in enumerate(names):
        col, row = index % cols, index // cols
        box = (
            round(col * cell_w + inset), round(row * cell_h + inset),
            round((col + 1) * cell_w - inset), round((row + 1) * cell_h - inset),
        )
        square_asset(remove_paper(image.crop(box))).save(out_dir / f"{name}.png", optimize=True)

crop_grid(
    Path(r"C:\Users\Administrator\AppData\Local\Temp\codex-clipboard-f02ec358-19fe-4f4e-87ab-36de8ac5a916.png"),
    4, 4,
    ["list_cart","list_basket","list_food","list_dining","list_home","list_drink_cup","list_work","list_checklist","list_fitness","list_hiking","list_pets","list_vacation","list_supporter_heart_cart","list_supporter_moon","list_supporter_emblem","list_supporter_compass"],
    ASSETS / "new-icons" / "lists", 55,
)
crop_grid(
    Path(r"C:\Users\Administrator\AppData\Local\Temp\codex-clipboard-8d1f2623-0af4-4b35-950e-10d2b85db1fc.png"),
    6, 2,
    ["group_home","group_coffee","group_plant","group_paws","group_heart","group_star","group_tree","group_cottage","group_people","group_cart","group_sun","group_moon"],
    ASSETS / "new-icons" / "groups", 48,
)

# The supplied paper menu is itself the final full-size artwork.
Image.open(Path(r"C:\Users\Administrator\AppData\Local\Temp\codex-clipboard-f2a92d43-c5ef-4076-8367-9ff8462ca3a9.png")).convert("RGB").save(
    ASSETS / "menu-paper-v700.jpg", quality=92, optimize=True
)

# Split and clean the two flame states used instead of thumbs-up icons.
flames = Image.open(Path(r"C:\Users\Administrator\AppData\Local\Temp\codex-clipboard-717125e6-957b-46db-bbb8-6c7e53afb82d.png")).convert("RGBA")
for index, name in enumerate(("flame-empty", "flame-filled")):
    left = round(index * flames.width / 2)
    right = round((index + 1) * flames.width / 2)
    cleaned = remove_paper(flames.crop((left, 0, right, flames.height)))
    square_asset(cleaned, 96, 8).save(ASSETS / f"{name}.png", optimize=True)
