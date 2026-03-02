from datetime import datetime
from typing import Any, Dict, List, Optional

from ninja import Schema


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

class ViewSettingsOut(Schema):
    id: int
    label: str = ""
    icon: str = ""
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    is_standard: bool = False
    is_default: bool = False
    type: str = "list"
    entity_type: str = ""
    route_name: str = ""
    pinned: bool = False
    public: bool = False
    filters: dict = {}
    order_by: dict = {}
    columns: list = []
    rows: list = []
    load_default_columns: bool = False
    group_by_field: str = ""
    column_field: str = ""
    title_field: str = ""
    kanban_columns: list = []
    kanban_fields: list = []
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def resolve_user_email(obj) -> Optional[str]:
        return obj.user.email if obj.user_id else None


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class ViewSettingsCreate(Schema):
    label: str
    icon: str = ""
    type: str = "list"
    entity_type: str
    filters: dict = {}
    order_by: dict = {}
    columns: list = []
    rows: list = []
    group_by_field: str = ""
    column_field: str = ""
    title_field: str = ""
    kanban_columns: list = []
    kanban_fields: list = []
    pinned: bool = False
    public: bool = False
    load_default_columns: bool = False


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class ViewSettingsUpdate(Schema):
    label: Optional[str] = None
    icon: Optional[str] = None
    type: Optional[str] = None
    entity_type: Optional[str] = None
    filters: Optional[dict] = None
    order_by: Optional[dict] = None
    columns: Optional[list] = None
    rows: Optional[list] = None
    group_by_field: Optional[str] = None
    column_field: Optional[str] = None
    title_field: Optional[str] = None
    kanban_columns: Optional[list] = None
    kanban_fields: Optional[list] = None
    pinned: Optional[bool] = None
    public: Optional[bool] = None
    load_default_columns: Optional[bool] = None


# ---------------------------------------------------------------------------
# FormScript
# ---------------------------------------------------------------------------


class FormScriptOut(Schema):
    id: int
    name: str
    dt: str
    view: str
    enabled: bool
    script: str
    created_at: datetime
    updated_at: datetime


class FormScriptCreate(Schema):
    name: str
    dt: str
    view: str = "Form"
    enabled: bool = True
    script: str = ""


class FormScriptUpdate(Schema):
    name: Optional[str] = None
    dt: Optional[str] = None
    view: Optional[str] = None
    enabled: Optional[bool] = None
    script: Optional[str] = None


# ---------------------------------------------------------------------------
# FieldsLayout
# ---------------------------------------------------------------------------


class FieldsLayoutOut(Schema):
    id: int
    dt: str
    type: str
    layout: List[Any]
    created_at: datetime
    updated_at: datetime


class FieldsLayoutCreate(Schema):
    dt: str
    type: str
    layout: List[Any] = []


class FieldsLayoutUpdate(Schema):
    dt: Optional[str] = None
    type: Optional[str] = None
    layout: Optional[List[Any]] = None
