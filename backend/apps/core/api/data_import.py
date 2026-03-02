import csv
import io
from typing import Any, Dict, List, Optional

from django.http import HttpResponse
from ninja import File, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile

from apps.core.api.schemas import (
    ImportableEntity,
    ImportFieldDef,
    ImportPreviewOut,
    ImportResultOut,
)

router = Router()


# ---------------------------------------------------------------------------
# Entity field definitions
# ---------------------------------------------------------------------------

ENTITY_FIELD_DEFS: Dict[str, List[Dict[str, Any]]] = {
    "lead": [
        {"name": "first_name", "label": "First Name", "type": "string", "required": True},
        {"name": "last_name", "label": "Last Name", "type": "string", "required": False},
        {"name": "email", "label": "Email", "type": "email", "required": False},
        {"name": "mobile_no", "label": "Mobile No", "type": "string", "required": False},
        {"name": "phone", "label": "Phone", "type": "string", "required": False},
        {"name": "organization", "label": "Organization", "type": "string", "required": False},
        {"name": "job_title", "label": "Job Title", "type": "string", "required": False},
        {"name": "website", "label": "Website", "type": "string", "required": False},
        {"name": "gender", "label": "Gender", "type": "string", "required": False},
        {"name": "salutation", "label": "Salutation", "type": "string", "required": False},
        {"name": "annual_revenue", "label": "Annual Revenue", "type": "decimal", "required": False},
        {"name": "no_of_employees", "label": "No. of Employees", "type": "string", "required": False},
    ],
    "deal": [
        {"name": "organization_name", "label": "Organization Name", "type": "string", "required": False},
        {"name": "first_name", "label": "First Name", "type": "string", "required": False},
        {"name": "last_name", "label": "Last Name", "type": "string", "required": False},
        {"name": "email", "label": "Email", "type": "email", "required": False},
        {"name": "mobile_no", "label": "Mobile No", "type": "string", "required": False},
        {"name": "deal_value", "label": "Deal Value", "type": "decimal", "required": False},
        {"name": "currency", "label": "Currency", "type": "string", "required": False},
        {"name": "probability", "label": "Probability (%)", "type": "decimal", "required": False},
        {"name": "next_step", "label": "Next Step", "type": "string", "required": False},
        {"name": "website", "label": "Website", "type": "string", "required": False},
        {"name": "job_title", "label": "Job Title", "type": "string", "required": False},
    ],
    "contact": [
        {"name": "first_name", "label": "First Name", "type": "string", "required": True},
        {"name": "last_name", "label": "Last Name", "type": "string", "required": False},
        {"name": "email_id", "label": "Email", "type": "email", "required": False},
        {"name": "mobile_no", "label": "Mobile No", "type": "string", "required": False},
        {"name": "phone", "label": "Phone", "type": "string", "required": False},
        {"name": "company_name", "label": "Company Name", "type": "string", "required": False},
        {"name": "designation", "label": "Designation", "type": "string", "required": False},
        {"name": "gender", "label": "Gender", "type": "string", "required": False},
        {"name": "salutation", "label": "Salutation", "type": "string", "required": False},
    ],
    "organization": [
        {"name": "organization_name", "label": "Organization Name", "type": "string", "required": True},
        {"name": "website", "label": "Website", "type": "string", "required": False},
        {"name": "annual_revenue", "label": "Annual Revenue", "type": "decimal", "required": False},
        {"name": "no_of_employees", "label": "No. of Employees", "type": "string", "required": False},
        {"name": "currency", "label": "Currency", "type": "string", "required": False},
    ],
    "task": [
        {"name": "title", "label": "Title", "type": "string", "required": True},
        {"name": "description", "label": "Description", "type": "string", "required": False},
        {"name": "priority", "label": "Priority", "type": "string", "required": False},
        {"name": "status", "label": "Status", "type": "string", "required": False},
        {"name": "due_date", "label": "Due Date", "type": "datetime", "required": False},
        {"name": "entity_type", "label": "Entity Type", "type": "string", "required": False},
        {"name": "entity_id", "label": "Entity ID", "type": "integer", "required": False},
    ],
    "calllog": [
        {"name": "caller_number", "label": "Caller Number", "type": "string", "required": True},
        {"name": "receiver_number", "label": "Receiver Number", "type": "string", "required": True},
        {"name": "status", "label": "Status", "type": "string", "required": False},
        {"name": "call_type", "label": "Call Type", "type": "string", "required": False},
        {"name": "start_time", "label": "Start Time", "type": "datetime", "required": False},
        {"name": "end_time", "label": "End Time", "type": "datetime", "required": False},
        {"name": "telephony_medium", "label": "Telephony Medium", "type": "string", "required": False},
        {"name": "recording_url", "label": "Recording URL", "type": "string", "required": False},
    ],
}

ENTITY_LABELS = {
    "lead": "Lead",
    "deal": "Deal",
    "contact": "Contact",
    "organization": "Organization",
    "task": "Task",
    "calllog": "Call Log",
}


def _parse_csv_file(file: UploadedFile) -> tuple:
    """Parse an uploaded CSV file and return (headers, rows)."""
    content = file.read()
    try:
        text = content.decode("utf-8-sig")  # handles BOM
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        return [], []
    headers = [h.strip() for h in rows[0]]
    data_rows = rows[1:]
    return headers, data_rows


def _create_lead(row_data: dict, company, user):
    from apps.crm.models import Lead
    from apps.crm.models.classification import LeadStatus

    status = LeadStatus.objects.filter(company=company).first()
    if not status:
        raise ValueError("No LeadStatus found for this company.")

    lead = Lead.objects.create(
        company=company,
        status=status,
        created_by=user,
        modified_by=user,
        **{k: v for k, v in row_data.items() if hasattr(Lead, k) and k not in ("company", "status")},
    )
    return lead


def _create_contact(row_data: dict, company, user):
    from apps.crm.models import Contact

    contact = Contact.objects.create(
        company=company,
        created_by=user,
        modified_by=user,
        **{k: v for k, v in row_data.items() if k not in ("company",)},
    )
    return contact


def _create_organization(row_data: dict, company, user):
    from apps.crm.models import Organization

    org = Organization.objects.create(
        company=company,
        created_by=user,
        modified_by=user,
        **{k: v for k, v in row_data.items() if k not in ("company",)},
    )
    return org


def _create_task(row_data: dict, company, user):
    from apps.communication.models import Task

    task = Task.objects.create(
        company=company,
        created_by=user,
        modified_by=user,
        **{k: v for k, v in row_data.items() if k not in ("company",)},
    )
    return task


def _create_calllog(row_data: dict, company, user):
    from apps.communication.models import CallLog
    import uuid

    calllog = CallLog.objects.create(
        company=company,
        call_id=str(uuid.uuid4()),
        created_by=user,
        modified_by=user,
        **{k: v for k, v in row_data.items() if k not in ("company", "call_id")},
    )
    return calllog


ENTITY_CREATOR_MAP = {
    "lead": _create_lead,
    "contact": _create_contact,
    "organization": _create_organization,
    "task": _create_task,
    "calllog": _create_calllog,
}


def _map_row_to_dict(headers: List[str], row: List[str], field_defs: List[Dict]) -> dict:
    """Map a CSV row (by header name) to a dict of valid field names."""
    valid_fields = {f["name"] for f in field_defs}
    result = {}
    for i, header in enumerate(headers):
        col_name = header.strip().lower().replace(" ", "_")
        if col_name in valid_fields and i < len(row):
            value = row[i].strip()
            if value:
                result[col_name] = value
    return result


# ---------------------------------------------------------------------------
# GET /importable-entities
# ---------------------------------------------------------------------------


@router.get("/importable-entities", response=List[ImportableEntity])
def list_importable_entities(request):
    """Return list of entity types that can be imported, with their field definitions."""
    entities = []
    for key, label in ENTITY_LABELS.items():
        field_defs = [
            ImportFieldDef(
                name=f["name"],
                label=f["label"],
                type=f["type"],
                required=f["required"],
            )
            for f in ENTITY_FIELD_DEFS[key]
        ]
        entities.append(ImportableEntity(label=label, value=key, fields=field_defs))
    return entities


# ---------------------------------------------------------------------------
# POST /import/preview
# ---------------------------------------------------------------------------


@router.post("/import/preview", response=ImportPreviewOut)
def preview_import(request, file: UploadedFile = File(...)):
    """
    Accept a CSV file and return the first 5 data rows plus detected headers.
    Used by the frontend mapping UI before the actual import.
    """
    headers, rows = _parse_csv_file(file)
    if not headers:
        raise HttpError(400, "Could not parse CSV file or file is empty.")

    sample = []
    for row in rows[:5]:
        # Pad row to match header length
        padded = row + [""] * max(0, len(headers) - len(row))
        sample.append(padded[: len(headers)])

    return ImportPreviewOut(
        headers=headers,
        sample_rows=sample,
        row_count=len(rows),
    )


# ---------------------------------------------------------------------------
# POST /import
# ---------------------------------------------------------------------------


@router.post("/import", response=ImportResultOut)
def import_records(
    request,
    entity_type: str,
    file: UploadedFile = File(...),
):
    """
    Accept a CSV file and create records of the given entity_type.
    Returns success/error counts plus per-row error messages.
    """
    entity_type = entity_type.lower()

    if entity_type not in ENTITY_FIELD_DEFS:
        raise HttpError(
            400,
            f"Unknown entity_type '{entity_type}'. "
            f"Supported: {', '.join(ENTITY_LABELS.keys())}",
        )

    headers, rows = _parse_csv_file(file)
    if not headers:
        raise HttpError(400, "Could not parse CSV file or file is empty.")

    field_defs = ENTITY_FIELD_DEFS[entity_type]
    required_fields = {f["name"] for f in field_defs if f["required"]}
    creator = ENTITY_CREATOR_MAP.get(entity_type)

    user = request.auth
    company = request.company

    success_count = 0
    errors = []

    for row_index, row in enumerate(rows, start=2):  # 1-based, row 1 is header
        if not any(cell.strip() for cell in row):
            continue  # skip blank rows

        try:
            row_data = _map_row_to_dict(headers, row, field_defs)

            # Validate required fields
            missing = required_fields - set(row_data.keys())
            if missing:
                errors.append({
                    "row": row_index,
                    "message": f"Missing required fields: {', '.join(sorted(missing))}",
                })
                continue

            creator(row_data, company, user)
            success_count += 1

        except Exception as exc:
            errors.append({"row": row_index, "message": str(exc)})

    return ImportResultOut(
        total=len([r for r in rows if any(cell.strip() for cell in r)]),
        success=success_count,
        errors=errors,
    )


# ---------------------------------------------------------------------------
# GET /import/template/{entity_type}
# ---------------------------------------------------------------------------


@router.get("/import/template/{entity_type}")
def download_import_template(request, entity_type: str):
    """
    Generate and return a CSV template for the given entity_type.
    The template contains only the header row with the expected column names.
    """
    entity_type = entity_type.lower()

    if entity_type not in ENTITY_FIELD_DEFS:
        raise HttpError(
            400,
            f"Unknown entity_type '{entity_type}'. "
            f"Supported: {', '.join(ENTITY_LABELS.keys())}",
        )

    field_defs = ENTITY_FIELD_DEFS[entity_type]
    headers = [f["label"] for f in field_defs]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    # Write one sample row with placeholders
    sample = []
    for f in field_defs:
        if f["type"] == "email":
            sample.append("example@email.com")
        elif f["type"] == "integer":
            sample.append("1")
        elif f["type"] in ("decimal", "float"):
            sample.append("0.00")
        elif f["type"] == "datetime":
            sample.append("2024-01-01 00:00:00")
        elif f["type"] == "boolean":
            sample.append("true")
        else:
            sample.append(f["label"])
    writer.writerow(sample)

    content = output.getvalue()
    label = ENTITY_LABELS.get(entity_type, entity_type)
    filename = f"{label.lower().replace(' ', '_')}_import_template.csv"

    response = HttpResponse(content, content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
