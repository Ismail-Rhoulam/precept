from datetime import datetime
from typing import Optional

from ninja import Schema


# ---------------------------------------------------------------------------
# Product — output
# ---------------------------------------------------------------------------


class ProductOut(Schema):
    id: int
    product_code: str
    product_name: str = ""
    standard_rate: float = 0
    description: str = ""
    disabled: bool = False
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def resolve_standard_rate(obj) -> float:
        return float(obj.standard_rate)


# ---------------------------------------------------------------------------
# Product — create / update
# ---------------------------------------------------------------------------


class ProductCreate(Schema):
    product_code: str
    product_name: str = ""
    standard_rate: float = 0
    description: str = ""


class ProductUpdate(Schema):
    product_code: Optional[str] = None
    product_name: Optional[str] = None
    standard_rate: Optional[float] = None
    description: Optional[str] = None
    disabled: Optional[bool] = None


# ---------------------------------------------------------------------------
# Lead / Deal product line items — output
# ---------------------------------------------------------------------------


class LeadProductOut(Schema):
    id: int
    product_id: Optional[int] = None
    product_name: str
    qty: float = 1
    rate: float = 0
    amount: float = 0
    discount_percentage: float = 0
    discount_amount: float = 0
    net_amount: float = 0

    @staticmethod
    def resolve_rate(obj) -> float:
        return float(obj.rate)

    @staticmethod
    def resolve_amount(obj) -> float:
        return float(obj.amount)

    @staticmethod
    def resolve_discount_percentage(obj) -> float:
        return float(obj.discount_percentage)

    @staticmethod
    def resolve_discount_amount(obj) -> float:
        return float(obj.discount_amount)

    @staticmethod
    def resolve_net_amount(obj) -> float:
        return float(obj.net_amount)


class DealProductOut(Schema):
    id: int
    product_id: Optional[int] = None
    product_name: str
    qty: float = 1
    rate: float = 0
    amount: float = 0
    discount_percentage: float = 0
    discount_amount: float = 0
    net_amount: float = 0

    @staticmethod
    def resolve_rate(obj) -> float:
        return float(obj.rate)

    @staticmethod
    def resolve_amount(obj) -> float:
        return float(obj.amount)

    @staticmethod
    def resolve_discount_percentage(obj) -> float:
        return float(obj.discount_percentage)

    @staticmethod
    def resolve_discount_amount(obj) -> float:
        return float(obj.discount_amount)

    @staticmethod
    def resolve_net_amount(obj) -> float:
        return float(obj.net_amount)


# ---------------------------------------------------------------------------
# Lead / Deal product line items — create
# ---------------------------------------------------------------------------


class LeadProductCreate(Schema):
    product_id: Optional[int] = None
    product_name: str
    qty: float = 1
    rate: float = 0
    discount_percentage: float = 0


class DealProductCreate(Schema):
    product_id: Optional[int] = None
    product_name: str
    qty: float = 1
    rate: float = 0
    discount_percentage: float = 0
