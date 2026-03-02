from typing import Any, Dict, List, Optional

from ninja import Schema


class LoginIn(Schema):
    email: str
    password: str


class TokenOut(Schema):
    access: str
    refresh: str


class RegisterIn(Schema):
    email: str
    password: str
    first_name: str
    last_name: Optional[str] = ""
    company_slug: str


class UserOut(Schema):
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    avatar: Optional[str] = None


# ---------------------------------------------------------------------------
# Data Import
# ---------------------------------------------------------------------------


class ImportFieldDef(Schema):
    name: str
    label: str
    type: str  # "string", "email", "integer", "datetime", "boolean"
    required: bool = False


class ImportableEntity(Schema):
    label: str
    value: str  # entity type key used in import
    fields: List[ImportFieldDef]


class ImportPreviewOut(Schema):
    headers: List[str]
    sample_rows: List[List[str]]
    row_count: int


class ImportResultOut(Schema):
    total: int
    success: int
    errors: List[Dict[str, Any]]  # list of {"row": int, "message": str}
