import html
import json
import re
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

MAP_FILE = Path("cloudinary-map.json")
REPORT_FILE = Path("cloudinary-replacements-report.json")
ROOT = Path(".")
EXTENSIONS = {".html", ".json"}

FRAMER_URL_RE = re.compile(
    r"https?://framerusercontent\.com/(?:images|assets)/[^\s\"'<>)]*"
)


def strip_query(url: str) -> str:
    p = urlparse(url)
    return urlunparse((p.scheme, p.netloc, p.path, "", "", ""))


def canonicalize_framer_url(url: str) -> str:
    url = html.unescape(url)
    p = urlparse(url)
    q = parse_qsl(p.query, keep_blank_values=True)
    q = sorted(q, key=lambda x: (x[0], x[1]))
    return urlunparse((p.scheme, p.netloc, p.path, p.params, urlencode(q), p.fragment))


def infer_resource_type(url: str) -> str:
    u = url.lower()
    if u.endswith(".mp4"):
        return "video"
    if u.endswith((".woff2", ".woff", ".ttf", ".otf")):
        return "raw"
    return "image"


def cloudinary_delivery_url(cloud_name: str, public_id: str, resource_type: str) -> str:
    if resource_type == "raw":
        return f"https://res.cloudinary.com/{cloud_name}/raw/upload/{public_id}"
    if resource_type == "video":
        return f"https://res.cloudinary.com/{cloud_name}/video/upload/f_auto,q_auto/{public_id}"
    return f"https://res.cloudinary.com/{cloud_name}/image/upload/f_auto,q_auto/{public_id}"


def main() -> None:
    cloudinary_map = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    cloud_name = cloudinary_map.get("cloudName")
    mapping = cloudinary_map.get("mapping", {})

    base_path_map = {}
    for framer_url, mapped_public_id in mapping.items():
        base_path = strip_query(framer_url)
        if base_path not in base_path_map:
            base_path_map[base_path] = mapped_public_id

    replacements = 0
    no_mapping = set()
    updated_files = 0

    for path in ROOT.rglob("*"):
        if path.suffix not in EXTENSIONS:
            continue
        if path.is_dir():
            continue
        if path.name.startswith("."):
            continue
        if path.resolve() in {MAP_FILE.resolve(), REPORT_FILE.resolve()}:
            continue
        text = path.read_text(encoding="utf-8")

        def replace_match(match: re.Match) -> str:
            nonlocal replacements
            original = match.group(0)
            canonical_url = canonicalize_framer_url(original)
            mapped_public_id = mapping.get(canonical_url)
            if not mapped_public_id:
                mapped_public_id = base_path_map.get(strip_query(canonical_url))
            if not mapped_public_id:
                no_mapping.add(canonical_url)
                return original
            resource_type = infer_resource_type(canonical_url)
            replacements += 1
            return cloudinary_delivery_url(cloud_name, mapped_public_id, resource_type)

        updated = FRAMER_URL_RE.sub(replace_match, text)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            updated_files += 1

    REPORT_FILE.write_text(
        json.dumps(
            {
                "replacements": replacements,
                "no_mapping_count": len(no_mapping),
                "no_mapping_urls": sorted(no_mapping),
                "updated_files": updated_files,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
