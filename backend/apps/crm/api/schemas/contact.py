from datetime import datetime
from typing import Optional

from ninja import Schema


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

class ContactOut(Schema):
    id: int
    first_name: str
    last_name: str = ""
    full_name: str = ""
    email_id: str = ""
    mobile_no: str = ""
    phone: str = ""
    gender: str = ""
    salutation: str = ""
    company_name: str = ""
    designation: str = ""
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Create / Update
# ---------------------------------------------------------------------------

class ContactCreate(Schema):
    first_name: str
    last_name: str = ""
    email_id: str = ""
    mobile_no: str = ""
    phone: str = ""
    gender: str = ""
    salutation: str = ""
    company_name: str = ""
    designation: str = ""


class ContactUpdate(Schema):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_id: Optional[str] = None
    mobile_no: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    salutation: Optional[str] = None
    company_name: Optional[str] = None
    designation: Optional[str] = None
