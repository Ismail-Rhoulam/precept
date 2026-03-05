from django.core.management.base import BaseCommand
from django.db import connections


class Command(BaseCommand):
    help = "Create the 'precept' and 'infra' PostgreSQL schemas if they do not exist."

    def handle(self, *args, **options):
        schemas = ["precept", "infra"]
        with connections["default"].cursor() as cursor:
            for schema in schemas:
                cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {schema};")
                self.stdout.write(
                    self.style.SUCCESS(f"Schema '{schema}' ensured.")
                )

            # Each database alias needs its own django_migrations table so
            # that migrate --database=default and --database=infra track
            # their applied migrations independently.
            for schema in schemas:
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS {schema}.django_migrations (
                        id serial PRIMARY KEY,
                        app varchar(255) NOT NULL,
                        name varchar(255) NOT NULL,
                        applied timestamp with time zone NOT NULL DEFAULT now()
                    );
                """)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Migration tracker '{schema}.django_migrations' ensured."
                    )
                )

        self.stdout.write(self.style.SUCCESS("All schemas ready."))
