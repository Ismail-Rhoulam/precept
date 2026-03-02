from django.contrib.contenttypes.models import ContentType

from apps.communication.models import StatusChangeLog


def log_status_change(instance, old_status: str, new_status: str, user):
    """Log a status change for a model instance.

    Args:
        instance: The model instance whose status changed (e.g. Lead, Deal).
        old_status: The previous status string.
        new_status: The new status string.
        user: The user who performed the change.

    Returns:
        The created StatusChangeLog instance, or None if statuses are equal.
    """
    if old_status == new_status:
        return None

    ct = ContentType.objects.get_for_model(instance)
    return StatusChangeLog.objects.create(
        content_type=ct,
        object_id=instance.pk,
        from_status=old_status,
        to_status=new_status,
        changed_by=user,
    )
