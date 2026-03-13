#!/bin/bash
set -e

CONFIG_FILE="/etc/opendkim/keys/postfix_config.json"
DKIM_SELECTOR="${DKIM_SELECTOR:-mail}"

# ── Ensure the shared volume is writable by the backend (uid 100) ──
chmod 777 /etc/opendkim/keys

# ── Resolve mail domain: config file (set by Django) → env var → wait ──
resolve_domain() {
    # Try the config file written by Django when user sets domain in UI
    if [ -f "$CONFIG_FILE" ]; then
        domain=$(sed -n 's/.*"mail_domain"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$CONFIG_FILE" 2>/dev/null || true)
        if [ -n "$domain" ]; then
            echo "$domain"
            return
        fi
    fi
    # Fall back to environment variable
    if [ -n "${MAIL_DOMAIN:-}" ]; then
        echo "$MAIL_DOMAIN"
        return
    fi
    echo ""
}

MAIL_DOMAIN=$(resolve_domain)

if [ -z "$MAIL_DOMAIN" ]; then
    echo "No mail domain configured yet. Waiting for configuration via UI..."
    echo "Checking every 10 seconds for $CONFIG_FILE ..."
    while [ -z "$MAIL_DOMAIN" ]; do
        sleep 10
        MAIL_DOMAIN=$(resolve_domain)
    done
    echo "Domain detected: $MAIL_DOMAIN"
fi

DKIM_KEY_DIR="/etc/opendkim/keys/${MAIL_DOMAIN}"
DKIM_SELECTOR2="mail2"

# ── Generate DKIM keys (2 selectors for rotation) ──
mkdir -p "$DKIM_KEY_DIR"
for sel in "$DKIM_SELECTOR" "$DKIM_SELECTOR2"; do
    if [ ! -f "${DKIM_KEY_DIR}/${sel}.private" ]; then
        echo "Generating DKIM key for ${MAIL_DOMAIN} (selector: ${sel})..."
        opendkim-genkey -b 2048 -d "$MAIL_DOMAIN" -D "$DKIM_KEY_DIR" -s "$sel" -v
    fi
done
# Make keys readable by backend (they share the /etc/opendkim/keys volume)
chmod 644 "${DKIM_KEY_DIR}"/*.private 2>/dev/null || true
chmod 644 "${DKIM_KEY_DIR}"/*.txt 2>/dev/null || true


# ── Postfix main.cf ──
cat > /etc/postfix/main.cf <<EOF
# Basic
smtpd_banner = \$myhostname ESMTP
biff = no
append_dot_mydomain = no

# Host & domain
myhostname = mail.${MAIL_DOMAIN}
mydomain = ${MAIL_DOMAIN}
myorigin = \$mydomain
mydestination = \$myhostname, localhost.\$mydomain, localhost

# Network — accept from Docker internal networks only
inet_interfaces = all
inet_protocols = ipv4
mynetworks = 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16

# Relay — do not be an open relay
smtpd_relay_restrictions = permit_mynetworks, reject_unauth_destination
relay_domains =

# TLS outbound (opportunistic)
smtp_tls_security_level = may
smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt

# Size limit (25 MB)
message_size_limit = 26214400

# DKIM signing is handled by the backend (dkimpy) before submission
# No milter needed — OpenDKIM milter on Ubuntu 22.04 is beta software
EOF

# ── Disable chroot for all Postfix services (unnecessary inside Docker) ──
sed -i 's/^\([a-z].*\)  y  /\1  n  /g' /etc/postfix/master.cf

# ── Start services ──

echo "Starting Postfix for domain: ${MAIL_DOMAIN}"
exec postfix start-fg
