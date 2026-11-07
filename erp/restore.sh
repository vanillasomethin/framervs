#!/usr/bin/env bash
# Restores a backup made by backup.sh, replacing ALL current ERP data.
#
#   ./restore.sh backups/erp-2026-11-02_0230.tar.gz

set -euo pipefail
cd "$(dirname "$0")"

archive=${1:?Usage: ./restore.sh backups/erp-<date>.tar.gz}
[[ -f "$archive" ]] || { echo "No such file: $archive" >&2; exit 1; }

read -rp "This replaces ALL current ERP data with $archive. Type RESTORE to continue: " answer
[[ "$answer" == "RESTORE" ]] || { echo "Cancelled."; exit 1; }

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
tar -C "$work" -xzf "$archive"

docker compose stop app caddy
docker compose up -d postgres
until docker compose exec -T postgres pg_isready -U oe -d openestimate >/dev/null 2>&1; do sleep 2; done

docker compose exec -T postgres pg_restore -U oe -d openestimate --clean --if-exists --no-owner < "$work/database.dump"
docker compose run --rm --no-deps -T --entrypoint sh app -c 'rm -rf /data/* && tar -C /data -xzf -' < "$work/files.tar.gz"

docker compose up -d app caddy
echo "Restored from $archive."
