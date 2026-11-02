# Studio ERP — OpenConstructionERP

The studio's private construction workspace at **https://erp.vanillasometh.in**: bills of quantities (BOQ), cost estimating with 120,000+ cost items, CAD/BIM/PDF takeoff, 4D scheduling, 5D cost control and tendering.

It runs [OpenConstructionERP](https://github.com/datadrivenconstruction/OpenConstructionERP) unmodified, from the project's own published Docker image, behind Caddy for automatic HTTPS. Only the studio team can sign in; new sign-ups wait for an admin to approve them.

This folder isn't part of the public website. Netlify only publishes `public/`.

## What you need

| | |
|---|---|
| **A server** | Ubuntu 22.04/24.04, **4 GB RAM minimum** (8 GB if you'll do a lot of BIM/IFC work), 2 vCPU, 60 GB+ disk. Any VPS works: for example DigitalOcean (Bangalore), AWS Lightsail (Mumbai) or Hetzner. Roughly ₹1,500–3,000/month. |
| **DNS** | An `A` record for `erp.vanillasometh.in` pointing to the server's IP address. Add it where the domain's DNS is managed (Netlify DNS if the domain uses Netlify's nameservers). |
| **Ports** | 80 and 443 open on the server's firewall. |

## First-time setup (about 15 minutes)

SSH into the server, then:

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh

# 2. Get these files
sudo git clone https://github.com/vanillasomethin/framervs.git /opt/vs-erp
cd /opt/vs-erp/erp

# 3. Run setup
sudo ./setup.sh
```

`setup.sh` asks for the domain, then your name, email and password, and:

1. creates `.env` with a new database password and login-signing secret;
2. starts the database and app **without** exposing them to the internet;
3. creates **your admin account** from inside the server;
4. starts HTTPS, so the site goes public.

The order matters. On a fresh install, the first account ever registered becomes the admin, so setup claims it before anyone else can reach the site.

**Save the contents of `.env` in your password manager.** Without it, backups can't be restored on a new server.

Then open https://erp.vanillasometh.in, log in, and follow the app's guided onboarding (company type, country, currency INR, cost database).

## Adding the team

Team members open the site and sign up. Their accounts stay inactive until you approve them under **Users** in the app. Approved accounts get the **editor** role by default.

To change that, edit `.env` and run `sudo docker compose up -d`:
- `OE_DEFAULT_REGISTRATION_ROLE`: `viewer`, `editor` or `manager`.
- `OE_REGISTRATION_MODE=closed`: switches off sign-up; admins create accounts instead.

## Backups

Run a backup now, then schedule one nightly:

```bash
sudo ./backup.sh                       # writes backups/erp-<date>.tar.gz
sudo crontab -e                        # add the line below
30 2 * * * cd /opt/vs-erp/erp && ./backup.sh >> backups/backup.log 2>&1
```

Each backup holds the database, all uploaded files (drawings, models, PDFs) and `.env`. Backups older than 14 days are deleted automatically (`KEEP_DAYS=30 ./backup.sh` keeps more).

**Copy backups off the server**, otherwise losing the server means losing the backups too. Most VPS providers also offer automatic snapshots for a small fee; turn those on as well.

To restore: `sudo ./restore.sh backups/erp-<date>.tar.gz`. This replaces all current data.

## Updating

The app version is pinned in `.env` (`OE_IMAGE_TAG`) so nothing changes unexpectedly. To update:

1. Check the [release notes](https://github.com/datadrivenconstruction/OpenConstructionERP/releases) for anything marked as breaking.
2. Run `sudo ./backup.sh`.
3. Set `OE_IMAGE_TAG` in `.env` to the new version, then run `sudo docker compose pull && sudo docker compose up -d`.

Database migrations run automatically on start. If something goes wrong, set the old tag back and restore the backup.

## Everyday commands

```bash
sudo docker compose ps            # is everything running?
sudo docker compose logs -f app   # app logs
sudo docker compose restart app   # restart the app
```

## License

OpenConstructionERP is AGPL-3.0. Using it unmodified, as here, needs nothing further. If the studio ever **modifies** its code and lets people use the modified version over the network, the modified source must be offered to those users. Parts of the bundled cost data are CC BY 4.0 and need attribution, which the app shows itself.
