from django.core.management.base import BaseCommand
from django.db import connections


class Command(BaseCommand):
    help = "Create the 'precept' PostgreSQL schema if it does not exist."

    def handle(self, *args, **options):
        with connections["default"].cursor() as cursor:
            cursor.execute("CREATE SCHEMA IF NOT EXISTS precept;")
            self.stdout.write(
                self.style.SUCCESS("Schema 'precept' ensured.")
            )

        self.stdout.write(self.style.SUCCESS("All schemas ready."))
