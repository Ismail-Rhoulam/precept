from datetime import timedelta
from typing import Any, Dict, List

from django.shortcuts import get_object_or_404
from ninja import Router

from apps.crm.api.schemas.sla import SLACreate, SLAOut, SLAUpdate
from apps.crm.models import ServiceDay, ServiceLevelAgreement, SLAPriority

router = Router()


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get("/", response=List[SLAOut])
def list_slas(request):
    qs = (
        ServiceLevelAgreement.objects.filter(company=request.company)
        .select_related("holiday_list")
        .prefetch_related("priorities", "working_hours")
        .order_by("-updated_at")
    )
    return list(qs)


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------


@router.get("/{sla_id}", response=SLAOut)
def get_sla(request, sla_id: int):
    sla = get_object_or_404(
        ServiceLevelAgreement.objects.select_related("holiday_list").prefetch_related(
            "priorities", "working_hours"
        ),
        pk=sla_id,
        company=request.company,
    )
    return sla


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("/", response={201: SLAOut})
def create_sla(request, payload: SLACreate):
    user = request.auth
    data = payload.dict(exclude={"priorities", "working_hours"})
    data["company"] = request.company
    data["created_by"] = user
    data["modified_by"] = user

    sla = ServiceLevelAgreement.objects.create(**data)

    # Nested priorities
    for p in payload.priorities:
        SLAPriority.objects.create(
            sla=sla,
            priority=p.priority,
            response_time=timedelta(seconds=p.response_time_seconds),
        )

    # Nested working hours
    for wh in payload.working_hours:
        ServiceDay.objects.create(
            sla=sla,
            day=wh.day,
            start_time=wh.start_time,
            end_time=wh.end_time,
        )

    # Re-fetch with relations
    sla = (
        ServiceLevelAgreement.objects.select_related("holiday_list")
        .prefetch_related("priorities", "working_hours")
        .get(pk=sla.pk)
    )
    return 201, sla


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


@router.patch("/{sla_id}", response=SLAOut)
def update_sla(request, sla_id: int, payload: SLAUpdate):
    sla = get_object_or_404(
        ServiceLevelAgreement, pk=sla_id, company=request.company
    )

    data = payload.dict(exclude_unset=True)
    priorities_data = data.pop("priorities", None)
    working_hours_data = data.pop("working_hours", None)

    for attr, value in data.items():
        setattr(sla, attr, value)
    sla.modified_by = request.auth
    sla.save()

    # Replace priorities if provided
    if priorities_data is not None:
        sla.priorities.all().delete()
        for p in priorities_data:
            SLAPriority.objects.create(
                sla=sla,
                priority=p["priority"],
                response_time=timedelta(seconds=p["response_time_seconds"]),
            )

    # Replace working hours if provided
    if working_hours_data is not None:
        sla.working_hours.all().delete()
        for wh in working_hours_data:
            ServiceDay.objects.create(
                sla=sla,
                day=wh["day"],
                start_time=wh["start_time"],
                end_time=wh["end_time"],
            )

    # Re-fetch with relations
    sla = (
        ServiceLevelAgreement.objects.select_related("holiday_list")
        .prefetch_related("priorities", "working_hours")
        .get(pk=sla.pk)
    )
    return sla


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/{sla_id}", response={204: None})
def delete_sla(request, sla_id: int):
    sla = get_object_or_404(
        ServiceLevelAgreement, pk=sla_id, company=request.company
    )
    sla.delete()
    return 204, None
