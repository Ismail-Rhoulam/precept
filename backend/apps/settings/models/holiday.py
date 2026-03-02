from django.db import models

from apps.core.models.mixins import TenantMixin


class HolidayList(TenantMixin):
    list_name = models.CharField(max_length=255)

    class Meta:
        db_table = "crm_holiday_lists"

    def __str__(self):
        return self.list_name


class Holiday(models.Model):
    holiday_list = models.ForeignKey(
        HolidayList, on_delete=models.CASCADE, related_name="holidays"
    )
    date = models.DateField()
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "crm_holidays"

    def __str__(self):
        return f"{self.date} - {self.description}"
