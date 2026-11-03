#!/usr/bin/env bash
# First-time setup for OpenConstructionERP on a fresh server.
#
#   1. Generates the database password and login-signing secret (.env)
#   2. Starts the database and app WITHOUT exposing them to the internet
#   3. Creates your admin account from inside the server
#   4. Only then starts Caddy (HTTPS) so the site goes public
#
# Step 3 matters: on a fresh install the first account ever registered becomes
# the admin, so it must be yours before anyone else can reach the site.
#
# Usage: ./setup.sh            (run from the erp/ folder, as a user that can run docker)

set -euo pipefail
cd "$(dirname "$0")"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
die() { printf '\n\033[31mError:\033[0m %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || die "Docker isn't installed. Install it with: curl -fsSL https://get.docker.com | sh"
docker compose version >/dev/null 2>&1 || die "Docker Compose v2 isn't available (docker compose ...)."

# --- 1. Secrets ---------------------------------------------------------------
if [[ -f .env ]]; then
  say "Using the existing .env"
else
  read -rp "Domain for the ERP [erp.vanillasometh.in]: " domain
  domain=${domain:-erp.vanillasometh.in}
  umask 077
  cat > .env <<EOF
ERP_DOMAIN=${domain}
POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 32)
OE_IMAGE_TAG=18.9.0
OE_REGISTRATION_MODE=admin-approve
OE_DEFAULT_REGISTRATION_ROLE=editor
EOF
  say "Created .env with new secrets (keep a copy in your password manager)."
fi
set -a; source .env; set +a

# --- 2. Database + app (private) -----------------------------------------------
say "Starting the database and app (first start downloads ~1 GB and can take a few minutes)…"
docker compose up -d postgres app

printf 'Waiting for the app to be ready'
for _ in $(seq 1 120); do
  # </dev/null: exec would otherwise swallow whatever is typed while we wait
  if docker compose exec -T app curl -fsS http://localhost:8080/api/health </dev/null >/dev/null 2>&1; then ready=1; break; fi
  printf '.'; sleep 5
done
echo
[[ ${ready:-} == 1 ]] || die "The app didn't become healthy. See: docker compose logs app"

# --- 3. Admin account ------------------------------------------------------------
if [[ -f .admin-created ]]; then
  say "Admin account already created earlier."
else
  say "Create the admin account"
  read -rp "Your name: " name
  read -rp "Your email (used to log in): " email
  while true; do
    read -rsp "Password (8+ characters, letters and numbers): " password; echo
    read -rsp "Repeat password: " password2; echo
    [[ "$password" == "$password2" ]] && break
    echo "Passwords don't match, try again."
  done

  body=$(NAME="$name" EMAIL="$email" PASSWORD="$password" python3 -c \
    'import json,os; print(json.dumps({"full_name": os.environ["NAME"], "email": os.environ["EMAIL"], "password": os.environ["PASSWORD"]}))')
  status=$(docker compose exec -T app curl -s -o /tmp/register.json -w '%{http_code}' \
    -H 'Content-Type: application/json' -d "$body" http://localhost:8080/api/v1/users/auth/register/ </dev/null)
  if [[ "$status" != "201" ]]; then
    docker compose exec -T app cat /tmp/register.json </dev/null || true
    die "Creating the admin account failed (HTTP $status)."
  fi
  touch .admin-created
  say "Admin account created for ${email}."
fi

# --- 4. Go public ---------------------------------------------------------------
say "Starting HTTPS (Caddy)…"
docker compose up -d caddy

say "Done! Open https://${ERP_DOMAIN} and log in."
cat <<EOF
- HTTPS certificates are issued automatically within a minute if ${ERP_DOMAIN}
  already points at this server's IP address.
- Team members can sign up on the site; you approve them under Users.
- Set up nightly backups: see "Backups" in README.md.
EOF
