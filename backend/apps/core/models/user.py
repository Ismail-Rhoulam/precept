from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model.

    Uses email as the primary identifier instead of username.
    Each non-superuser belongs to a Company (tenant).
    """

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MANAGER = "manager", "Manager"
        SALES_USER = "sales_user", "Sales User"
        SALES_AGENT = "sales_agent", "Sales Agent"

    # Remove the default username field
    username = None

    email = models.EmailField("email address", unique=True)
    phone = models.CharField(max_length=20, blank=True, default="")
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    company = models.ForeignKey(
        "core.Company",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="users",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.SALES_USER,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name"]

    class Meta:
        db_table = '"precept"."user"'

    def __str__(self):
        return self.email
