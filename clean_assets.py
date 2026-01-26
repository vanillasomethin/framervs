import csv
import html
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

INPUT = "cloudinary-upload.csv"
OUTPUT = "cloudinary-upload.cleaned.csv"

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

with open(INPUT, "r", encoding="utf-8", newline="") as f:
    reader = csv.DictReader(f)
    for r in reader:
        # Skip completely malformed rows
        if not r.get("source_url") or not r.get("public_id"):
            bad_lines += 1
            continue

        source_url = normalize_url(r["source_url"])
        public_id = r["public_id"].strip()

        # Fix resource type based on file extension
        resource_type = infer_resource_type(source_url)

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

print(f"Input rows: {len(rows)} (skipped malformed: {bad_lines})")
print(f"Unique public_id: {len(deduped)}")
print(f"Saved: {OUTPUT}")
