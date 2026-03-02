"""Production settings."""
import os

from .base import *  # noqa: F401, F403

DEBUG = False

# Trust X-Forwarded-Proto from nginx
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "1") != "0"
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
