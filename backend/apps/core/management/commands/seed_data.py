from django.core.management.base import BaseCommand
from django.apps import apps


class Command(BaseCommand):
    help = (
        "Seed the database with a demo company, admin user, and default "
        "lookup data (statuses, sources, industries). Idempotent."
    )

    def handle(self, *args, **options):
        from apps.core.models import Company, User

        # ------------------------------------------------------------------
        # 1. Default Company
        # ------------------------------------------------------------------
        company, created = Company.objects.get_or_create(
            slug="demo",
            defaults={"name": "Demo Company"},
        )
        self._report("Company", company.name, created)

        # ------------------------------------------------------------------
        # 2. Admin User
        # ------------------------------------------------------------------
        user, created = User.objects.get_or_create(
            email="admin@precept.io",
            defaults={
                "first_name": "Admin",
                "role": User.Role.ADMIN,
                "company": company,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            user.set_password("admin123")
            user.save(update_fields=["password"])
        self._report("User", user.email, created)

        # ------------------------------------------------------------------
        # 3. Lead Statuses
        # ------------------------------------------------------------------
        self._seed_model(
            "crm",
            "LeadStatus",
            company,
            name_field="name",
            records=[
                {"name": "New", "category": "Open", "color": "blue", "order": 1},
                {"name": "Contacted", "category": "Ongoing", "color": "orange", "order": 2},
                {"name": "Qualified", "category": "Ongoing", "color": "green", "order": 3},
                {"name": "Unqualified", "category": "Lost", "color": "red", "order": 4},
                {"name": "Junk", "category": "Lost", "color": "gray", "order": 5},
            ],
        )

        # ------------------------------------------------------------------
        # 4. Deal Statuses
        # ------------------------------------------------------------------
        self._seed_model(
            "crm",
            "DealStatus",
            company,
            name_field="name",
            records=[
                {"name": "Qualification", "category": "Open", "probability": 10, "order": 1},
                {"name": "Demo/Meeting", "category": "Ongoing", "probability": 30, "order": 2},
                {"name": "Proposal", "category": "Ongoing", "probability": 50, "order": 3},
                {"name": "Negotiation", "category": "Ongoing", "probability": 70, "order": 4},
                {"name": "Won", "category": "Won", "probability": 100, "order": 5},
                {"name": "Lost", "category": "Lost", "probability": 0, "order": 6},
            ],
        )

        # ------------------------------------------------------------------
        # 5. Lead Sources
        # ------------------------------------------------------------------
        self._seed_model(
            "crm",
            "LeadSource",
            company,
            name_field="name",
            records=[
                {"name": "Website"},
                {"name": "Referral"},
                {"name": "Cold Call"},
                {"name": "Social Media"},
                {"name": "Advertisement"},
            ],
        )

        # ------------------------------------------------------------------
        # 6. Industries
        # ------------------------------------------------------------------
        self._seed_model(
            "crm",
            "Industry",
            company,
            name_field="name",
            records=[
                {"name": "Technology"},
                {"name": "Healthcare"},
                {"name": "Finance"},
                {"name": "Education"},
                {"name": "Retail"},
                {"name": "Manufacturing"},
            ],
        )

        self.stdout.write(self.style.SUCCESS("\nSeed data complete."))

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _seed_model(self, app_label, model_name, company, *, name_field, records):
        """
        Seed records for a tenant-scoped lookup model.

        Uses ``get_or_create`` so the command is idempotent.  The model is
        looked up via ``django.apps.apps.get_model`` so it works even when
        the CRM app hasn't been imported at module level.
        """
        try:
            Model = apps.get_model(app_label, model_name)
        except LookupError:
            self.stdout.write(
                self.style.WARNING(
                    f"  Skipped {app_label}.{model_name} — model not found."
                )
            )
            return

        for record in records:
            lookup = {name_field: record[name_field], "company": company}
            defaults = {k: v for k, v in record.items() if k != name_field}
            obj, created = Model.unscoped.get_or_create(
                **lookup, defaults=defaults
            )
            self._report(model_name, obj, created)

    def _report(self, label, obj, created):
        if created:
            self.stdout.write(self.style.SUCCESS(f"  Created {label}: {obj}"))
        else:
            self.stdout.write(f"  {label} already exists: {obj}")
