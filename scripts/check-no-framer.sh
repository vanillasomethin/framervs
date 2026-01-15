#!/usr/bin/env bash
set -euo pipefail

pattern='framerusercontent|framer\.website|framerstatic|framer-search-index|data-framer|editorbar'

if git grep -I -n -E "$pattern" -- .; then
  echo "Error: Disallowed Framer artifacts found in tracked files."
  exit 1
fi

echo "No disallowed Framer artifacts found."
