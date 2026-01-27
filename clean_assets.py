import csv
import html
import json
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

INPUT = "cloudinary-upload.csv"
OUTPUT = "cloudinary-upload.cleaned.csv"
MAP_FILE = "cloudinary-map.json"
UNMIGRATED_REPORT = "cloudinary-upload.unmigrated.txt"

# If True, keeps URL query params (width/height/scale-down-to).
# If False, removes them to get canonical/original URLs.
KEEP_QUERY = True


def infer_resource_type(url: str) -> str:
    u = url.lower()
    if u.endswith(".mp4"):
        return "video"
    if u.endswith((".woff2", ".woff", ".ttf", ".otf")):
        return "raw"
    # svg/png/jpg/jpeg/webp/gif etc will all be "image" for Cloudinary
    return "image"


def normalize_url(url: str) -> str:
    url = url.strip().rstrip("\\")  # fixes trailing "\" artifacts
    url = html.unescape(url)  # converts &amp; -> &
    p = urlparse(url)
    if KEEP_QUERY:
        # still normalize ordering of query params (helps dedupe)
        q = parse_qsl(p.query, keep_blank_values=True)
        q = sorted(q, key=lambda x: x[0])
        return urlunparse((p.scheme, p.netloc, p.path, p.params, urlencode(q), p.fragment))
    return urlunparse((p.scheme, p.netloc, p.path, "", "", ""))


def url_quality_score(url: str) -> tuple:
    """
    Higher is better. Prefers:
    - no scale-down-to
    - no explicit width/height
    - shorter query
    """
    u = url.lower()
    has_scale = "scale-down-to=" in u
    has_dims = ("width=" in u) or ("height=" in u)
    # shorter query is generally cleaner
    p = urlparse(url)
    qlen = len(p.query)
    return (
        0 if has_scale else 1,
        0 if has_dims else 1,
        -qlen,
    )


rows = []
bad_lines = 0
unmigrated = []

with open(MAP_FILE, "r", encoding="utf-8") as f:
    cloudinary_map = json.load(f)

cloud_name = cloudinary_map.get("cloudName")
mapping = cloudinary_map.get("mapping", {})


def strip_query(url: str) -> str:
    p = urlparse(url)
    return urlunparse((p.scheme, p.netloc, p.path, "", "", ""))


def canonicalize_framer_url(url: str) -> str:
    url = html.unescape(url)
    p = urlparse(url)
    q = parse_qsl(p.query, keep_blank_values=True)
    q = sorted(q, key=lambda x: (x[0], x[1]))
    return urlunparse((p.scheme, p.netloc, p.path, p.params, urlencode(q), p.fragment))


def is_framer_asset(url: str) -> bool:
    p = urlparse(url)
    return p.netloc == "framerusercontent.com" and (
        p.path.startswith("/assets/") or p.path.startswith("/images/")
    )


def is_sites_mjs(url: str) -> bool:
    p = urlparse(url)
    return "/sites/" in p.path and p.path.endswith(".mjs")


def cloudinary_delivery_url(public_id: str, resource_type: str) -> str:
    if resource_type == "raw":
        return f"https://res.cloudinary.com/{cloud_name}/raw/upload/{public_id}"
    if resource_type == "video":
        return (
            f"https://res.cloudinary.com/{cloud_name}/video/upload/f_auto,q_auto/{public_id}"
        )
    return f"https://res.cloudinary.com/{cloud_name}/image/upload/f_auto,q_auto/{public_id}"

base_path_map = {}
for framer_url, mapped_public_id in mapping.items():
    base_path = strip_query(framer_url)
    if base_path not in base_path_map:
        base_path_map[base_path] = mapped_public_id

with open(INPUT, "r", encoding="utf-8", newline="") as f:
    reader = csv.DictReader(f)
    for r in reader:
        # Skip completely malformed rows
        if not r.get("source_url") or not r.get("public_id"):
            bad_lines += 1
            continue

        source_url = normalize_url(r["source_url"])
        if is_sites_mjs(source_url):
            unmigrated.append(f"SKIPPED /sites .mjs: {source_url}")
            continue

        public_id = r["public_id"].strip()

        # Fix resource type based on file extension
        resource_type = infer_resource_type(source_url)

        if is_framer_asset(source_url):
            canonical_url = canonicalize_framer_url(source_url)
            mapped_public_id = mapping.get(canonical_url)
            if not mapped_public_id:
                mapped_public_id = base_path_map.get(strip_query(canonical_url))
            if mapped_public_id:
                public_id = mapped_public_id
                source_url = cloudinary_delivery_url(mapped_public_id, resource_type)
            else:
                unmigrated.append(f"NO MAPPING: {canonical_url}")

        rows.append(
            {
                "source_url": source_url,
                "public_id": public_id,
                "resource_type": resource_type,
            }
        )

# Deduplicate by public_id, keeping the best URL
best = {}
for r in rows:
    pid = r["public_id"]
    if pid not in best:
        best[pid] = r
    else:
        if url_quality_score(r["source_url"]) > url_quality_score(best[pid]["source_url"]):
            best[pid] = r

deduped = list(best.values())

with open(OUTPUT, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["source_url", "public_id", "resource_type"])
    writer.writeheader()
    writer.writerows(deduped)

with open(UNMIGRATED_REPORT, "w", encoding="utf-8") as f:
    f.write("\n".join(sorted(set(unmigrated))) + "\n")

print(f"Input rows: {len(rows)} (skipped malformed: {bad_lines})")
print(f"Unique public_id: {len(deduped)}")
print(f"Saved: {OUTPUT}")
print(f"Unmigrated report: {UNMIGRATED_REPORT}")
