#!/bin/bash
set -e

CONFIG_FILE="/etc/opendkim/keys/postfix_config.json"
DKIM_SELECTOR="${DKIM_SELECTOR:-mail}"

# ── Resolve mail domain: config file (set by Django) → env var → wait ──
resolve_domain() {
    # Try the config file written by Django when user sets domain in UI
    if [ -f "$CONFIG_FILE" ]; then
        domain=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('mail_domain',''))" 2>/dev/null || true)
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

# ── Generate DKIM key if not present ──
mkdir -p "$DKIM_KEY_DIR"
if [ ! -f "${DKIM_KEY_DIR}/${DKIM_SELECTOR}.private" ]; then
    echo "Generating DKIM key for ${MAIL_DOMAIN} (selector: ${DKIM_SELECTOR})..."
    opendkim-genkey -b 2048 -d "$MAIL_DOMAIN" -D "$DKIM_KEY_DIR" -s "$DKIM_SELECTOR" -v
    chown -R opendkim:opendkim /etc/opendkim/keys
fi

# ── OpenDKIM tables ──
cat > /etc/opendkim/KeyTable <<EOF
${DKIM_SELECTOR}._domainkey.${MAIL_DOMAIN} ${MAIL_DOMAIN}:${DKIM_SELECTOR}:${DKIM_KEY_DIR}/${DKIM_SELECTOR}.private
EOF

cat > /etc/opendkim/SigningTable <<EOF
*@${MAIL_DOMAIN} ${DKIM_SELECTOR}._domainkey.${MAIL_DOMAIN}
EOF

cat > /etc/opendkim/TrustedHosts <<EOF
127.0.0.1
localhost
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
*.${MAIL_DOMAIN}
EOF

chown -R opendkim:opendkim /etc/opendkim

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

# DKIM via OpenDKIM milter
milter_protocol = 6
milter_default_action = accept
smtpd_milters = inet:localhost:8891
non_smtpd_milters = inet:localhost:8891
EOF

# ── Start services ──
echo "Starting OpenDKIM..."
service opendkim start

echo "Starting Postfix for domain: ${MAIL_DOMAIN}"
exec postfix start-fg
