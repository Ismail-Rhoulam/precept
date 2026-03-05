"""
Database router for Precept CRM multi-schema layout.

- Business models → 'default' database (precept schema)
- Django internals (migrations, content types, admin log) → 'infra' database (infra schema)
"""

INFRA_APPS = {
    "auth",
    "contenttypes",
    "sessions",
    "django_celery_beat",
}


class PreceptDBRouter:
    def _is_infra(self, model):
        return model._meta.app_label in INFRA_APPS

    def db_for_read(self, model, **hints):
        if self._is_infra(model):
            return "infra"
        return "default"

    def db_for_write(self, model, **hints):
        if self._is_infra(model):
            return "infra"
        return "default"

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label in INFRA_APPS:
            return db == "infra"
        return db == "default"
