"""Test settings."""
from .base import *  # noqa: F401, F403

DEBUG = True

DATABASES["default"]["NAME"] = "precept_test"  # noqa: F405
DATABASES["infra"]["NAME"] = "precept_test"  # noqa: F405

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
