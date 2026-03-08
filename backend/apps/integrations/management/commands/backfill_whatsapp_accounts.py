"""Backfill existing WhatsApp accounts and link messages after multi-account migration.

Safe to run multiple times (idempotent).
"""

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Backfill display_name/is_default on WhatsAppSettings and link messages to accounts"

    def handle(self, *args, **options):
        from apps.integrations.models import WhatsAppMessage, WhatsAppSettings

        settings_qs = WhatsAppSettings.unscoped.all()
        count = 0

        for ws in settings_qs:
            updated_fields = []
            if not ws.is_default:
                ws.is_default = True
                updated_fields.append("is_default")
            if not ws.display_name:
                ws.display_name = ws.phone_number_id or "Default"
                updated_fields.append("display_name")
            if updated_fields:
                ws.save(update_fields=updated_fields)
                count += 1

            # Batch-update unlinked messages for this company
            linked = WhatsAppMessage.unscoped.filter(
                company_id=ws.company_id, whatsapp_account__isnull=True
            ).update(whatsapp_account=ws)
            if linked:
                self.stdout.write(f"  Linked {linked} messages to {ws}")

        self.stdout.write(self.style.SUCCESS(f"Backfilled {count} WhatsApp accounts"))
