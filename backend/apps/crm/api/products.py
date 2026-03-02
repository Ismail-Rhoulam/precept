from typing import Any, Dict, List

from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja import Query, Router

from apps.crm.api.schemas.product import ProductCreate, ProductOut, ProductUpdate
from apps.crm.models import Product

router = Router()


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get("/", response=Dict[str, Any])
def list_products(
    request,
    search: str = "",
    page: int = 1,
    page_size: int = 20,
):
    qs = Product.objects.filter(company=request.company)

    if search:
        qs = qs.filter(
            Q(product_name__icontains=search)
            | Q(product_code__icontains=search)
        )

    qs = qs.order_by("-updated_at")
    total = qs.count()
    offset = (page - 1) * page_size
    products = qs[offset : offset + page_size]

    return {
        "results": [ProductOut.from_orm(p) for p in products],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------


@router.get("/{product_id}", response=ProductOut)
def get_product(request, product_id: int):
    product = get_object_or_404(
        Product, pk=product_id, company=request.company
    )
    return product


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("/", response={201: ProductOut})
def create_product(request, payload: ProductCreate):
    user = request.auth
    data = payload.dict()
    data["company"] = request.company
    data["created_by"] = user
    data["modified_by"] = user
    product = Product.objects.create(**data)
    return 201, product


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


@router.patch("/{product_id}", response=ProductOut)
def update_product(request, product_id: int, payload: ProductUpdate):
    product = get_object_or_404(
        Product, pk=product_id, company=request.company
    )
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(product, attr, value)
    product.modified_by = request.auth
    product.save()
    return product


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/{product_id}", response={204: None})
def delete_product(request, product_id: int):
    product = get_object_or_404(
        Product, pk=product_id, company=request.company
    )
    product.delete()
    return 204, None
