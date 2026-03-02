"""Development settings."""
from .base import *  # noqa: F401, F403

DEBUG = True

ALLOWED_HOSTS = ["*"]

# More permissive CORS in dev
CORS_ALLOW_ALL_ORIGINS = True
