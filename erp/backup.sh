#!/usr/bin/env bash
# Backs up the ERP database and uploaded files (drawings, BIM models, PDFs).
#
#   ./backup.sh                    writes backups/erp-<date>.tar.gz, keeps 14 days
#   KEEP_DAYS=30 ./backup.sh       keep a month instead
#
# Run it nightly with cron (crontab -e):
#   30 2 * * * cd /opt/vs-erp/erp && ./backup.sh >> backups/backup.log 2>&1
#
# Also copy the backups folder off the server (see README.md): a backup that
# lives only on the same machine is lost with it.

set -euo pipefail
cd "$(dirname "$0")"

KEEP_DAYS=${KEEP_DAYS:-14}
stamp=$(date +%Y-%m-%d_%H%M)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p backups

docker compose exec -T postgres pg_dump -U oe -d openestimate --format=custom </dev/null > "$work/database.dump"
# The app keeps writing (caches, indexes) while we read; GNU tar reports that as
# exit 1 ("file changed as we read it"), which is fine for a live backup.
docker compose exec -T app sh -c 'tar -C /data --warning=no-file-changed -czf - .; [ $? -le 1 ]' </dev/null > "$work/files.tar.gz"
cp .env "$work/env"

tar -C "$work" -czf "backups/erp-$stamp.tar.gz" .
chmod 600 "backups/erp-$stamp.tar.gz"
find backups -name 'erp-*.tar.gz' -mtime +"$KEEP_DAYS" -delete

echo "$(date -Is) backup ok: backups/erp-$stamp.tar.gz ($(du -h "backups/erp-$stamp.tar.gz" | cut -f1))"
