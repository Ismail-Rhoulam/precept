from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Create the 'precept' and 'infra' PostgreSQL schemas if they do not exist."

    def handle(self, *args, **options):
        schemas = ["precept", "infra"]
        with connection.cursor() as cursor:
            for schema in schemas:
                cursor.execute(
                    f"CREATE SCHEMA IF NOT EXISTS {schema};"
                )
                self.stdout.write(
                    self.style.SUCCESS(f"Schema '{schema}' ensured.")
                )
        self.stdout.write(self.style.SUCCESS("All schemas ready."))
