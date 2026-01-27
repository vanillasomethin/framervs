#!/usr/bin/env python3
import re
from pathlib import Path

ROOT = Path("public")

VIOLATIONS = [
    (
        "Cloudinary video URL without extension",
        re.compile(r"https?://res\.cloudinary\.com/[^\s"'<>)]*/video/[^\s"'<>).]*?(?=[\s"'<>)]|$)"),
    ),
    (
        "Cloudinary images URL without extension",
        re.compile(r"https?://res\.cloudinary\.com/[^\s"'<>)]*/images/[^\s"'<>).]*?(?=[\s"'<>)]|$)"),
    ),
    (
        "Cloudinary URL with /cdn-cgi/",
        re.compile(r"https?://res\.cloudinary\.com/[^\s"'<>)]*/cdn-cgi/[^\s"'<>)]*"),
    ),
]

SCRIPT_SRC_RE = re.compile(r"<script\s+[^>]*src=([\"'])(https?://res\.cloudinary\.com/[^\"']+)\1", re.IGNORECASE)


def is_extensionless(url: str) -> bool:
    path = url.split("?", 1)[0].split("#", 1)[0]
    tail = path.rsplit("/", 1)[-1]
    return "." not in tail


def scan_file(path: Path) -> list[tuple[int, str]]:
    violations: list[tuple[int, str]] = []
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = path.read_text(encoding="latin-1")
    for idx, line in enumerate(text.splitlines(), start=1):
        for label, pattern in VIOLATIONS:
            for match in pattern.finditer(line):
                url = match.group(0)
                if "cdn-cgi" in label:
                    violations.append((idx, f"{label}: {url}"))
                else:
                    if is_extensionless(url):
                        violations.append((idx, f"{label}: {url}"))
        for match in SCRIPT_SRC_RE.finditer(line):
            url = match.group(2)
            violations.append((idx, f"Cloudinary script src: {url}"))
    return violations


def main() -> int:
    if not ROOT.exists():
        return 0
    failures: list[str] = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        for line_no, message in scan_file(path):
            failures.append(f"{path}:{line_no}: {message}")
    if failures:
        for failure in failures:
            print(failure)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
