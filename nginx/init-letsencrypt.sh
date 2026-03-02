#!/bin/bash

# Initial Let's Encrypt certificate setup for precept.online
# Usage: sudo ./nginx/init-letsencrypt.sh

set -e

DOMAIN="precept.online"
EMAIL="${CERTBOT_EMAIL:-}"  # Set your email or pass CERTBOT_EMAIL env var
STAGING=0  # Set to 1 to use Let's Encrypt staging (for testing)

COMPOSE="docker compose -f docker-compose.prod.yml"
DATA_PATH="./certbot"

if [ -z "$EMAIL" ]; then
    echo "Error: Set CERTBOT_EMAIL environment variable or edit this script."
    echo "Usage: CERTBOT_EMAIL=you@example.com sudo -E ./nginx/init-letsencrypt.sh"
    exit 1
fi

echo "### Creating dummy certificate for $DOMAIN ..."
mkdir -p "$DATA_PATH/conf/live/$DOMAIN"
$COMPOSE run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj '/CN=localhost'" certbot
echo

echo "### Starting nginx ..."
$COMPOSE up -d nginx
echo

echo "### Deleting dummy certificate ..."
$COMPOSE run --rm --entrypoint "\
    rm -rf /etc/letsencrypt/live/$DOMAIN && \
    rm -rf /etc/letsencrypt/archive/$DOMAIN && \
    rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot
echo

echo "### Requesting Let's Encrypt certificate for $DOMAIN ..."

if [ "$STAGING" = "1" ]; then
    STAGING_ARG="--staging"
else
    STAGING_ARG=""
fi

$COMPOSE run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    --domain $DOMAIN \
    --rsa-key-size 4096 \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot
echo

echo "### Reloading nginx ..."
$COMPOSE exec nginx nginx -s reload

echo "### Done! SSL certificate obtained for $DOMAIN"
