from typing import List

from django.contrib.auth import authenticate
from django.db import transaction
from django.utils.text import slugify
from ninja import Router
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken

from apps.core.api.schemas import (
    CompanyIn,
    CompanyOut,
    LoginIn,
    RegisterIn,
    SetupCheckOut,
    SetupIn,
    TokenOut,
    UserOut,
)
from apps.core.models import Company, User
from apps.core.api import data_import, translations

router = Router()


@router.post("/login", response=TokenOut, auth=None)
def login(request, payload: LoginIn):
    """Authenticate with email + password and receive JWT tokens."""
    user = authenticate(request, email=payload.email, password=payload.password)
    if user is None:
        raise HttpError(401, "Invalid email or password.")

    refresh = RefreshToken.for_user(user)

    # Embed company_id in the token so middleware can resolve the tenant.
    if user.company_id:
        refresh["company_id"] = user.company_id
        refresh.access_token["company_id"] = user.company_id

    return TokenOut(
        access=str(refresh.access_token),
        refresh=str(refresh),
    )


@router.post("/register", response={201: TokenOut}, auth=None)
def register(request, payload: RegisterIn):
    """Register a new user under an existing company."""
    try:
        company = Company.objects.get(slug=payload.company_slug, is_active=True)
    except Company.DoesNotExist:
        raise HttpError(400, "Company not found or inactive.")

    if User.objects.filter(email=payload.email).exists():
        raise HttpError(409, "A user with this email already exists.")

    user = User.objects.create_user(
        email=payload.email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name or "",
        company=company,
    )

    refresh = RefreshToken.for_user(user)
    refresh["company_id"] = company.pk
    refresh.access_token["company_id"] = company.pk

    return 201, TokenOut(
        access=str(refresh.access_token),
        refresh=str(refresh),
    )


@router.get("/setup-check", response=SetupCheckOut, auth=None)
def setup_check(request):
    """Check whether the system needs initial setup (no users exist)."""
    return {"needs_setup": not User.objects.exists()}


@router.post("/setup", response={201: TokenOut}, auth=None)
def setup(request, payload: SetupIn):
    """First-time setup: create the initial company + superuser + seed data."""
    if User.objects.exists():
        raise HttpError(400, "Setup has already been completed.")

    slug = slugify(payload.company_name)
    if Company.objects.filter(slug=slug).exists():
        raise HttpError(409, "A company with this name already exists.")

    with transaction.atomic():
        company = Company.objects.create(
            name=payload.company_name, slug=slug, is_active=True
        )

        user = User.objects.create_superuser(
            email=payload.email,
            password=payload.password,
            first_name=payload.first_name,
            last_name=payload.last_name or "",
            company=company,
            role=User.Role.ADMIN,
        )

        _seed_lookup_data(company)

    refresh = RefreshToken.for_user(user)
    refresh["company_id"] = company.pk
    refresh.access_token["company_id"] = company.pk

    return 201, TokenOut(
        access=str(refresh.access_token),
        refresh=str(refresh),
    )


def _seed_lookup_data(company):
    """Seed default lookup data for a new company."""
    from django.apps import apps

    lookups = {
        ("crm", "LeadStatus"): {
            "key": "lead_status",
            "records": [
                {"lead_status": "New", "type": "Open", "color": "blue", "position": 1},
                {"lead_status": "Contacted", "type": "Ongoing", "color": "orange", "position": 2},
                {"lead_status": "Qualified", "type": "Ongoing", "color": "green", "position": 3},
                {"lead_status": "Unqualified", "type": "Lost", "color": "red", "position": 4},
                {"lead_status": "Junk", "type": "Lost", "color": "gray", "position": 5},
            ],
        },
        ("crm", "DealStatus"): {
            "key": "deal_status",
            "records": [
                {"deal_status": "Qualification", "type": "Open", "probability": 10, "position": 1},
                {"deal_status": "Demo/Meeting", "type": "Ongoing", "probability": 30, "position": 2},
                {"deal_status": "Proposal", "type": "Ongoing", "probability": 50, "position": 3},
                {"deal_status": "Negotiation", "type": "Ongoing", "probability": 70, "position": 4},
                {"deal_status": "Won", "type": "Won", "probability": 100, "position": 5},
                {"deal_status": "Lost", "type": "Lost", "probability": 0, "position": 6},
            ],
        },
        ("crm", "LeadSource"): {
            "key": "source_name",
            "records": [
                {"source_name": "Website"},
                {"source_name": "Referral"},
                {"source_name": "Cold Call"},
                {"source_name": "Social Media"},
                {"source_name": "Advertisement"},
            ],
        },
        ("crm", "Industry"): {
            "key": "industry_name",
            "records": [
                {"industry_name": "Technology"},
                {"industry_name": "Healthcare"},
                {"industry_name": "Finance"},
                {"industry_name": "Education"},
                {"industry_name": "Retail"},
                {"industry_name": "Manufacturing"},
            ],
        },
    }

    for (app_label, model_name), config in lookups.items():
        try:
            Model = apps.get_model(app_label, model_name)
        except LookupError:
            continue
        key_field = config["key"]
        for record in config["records"]:
            defaults = {k: v for k, v in record.items() if k != key_field}
            Model.unscoped.get_or_create(
                **{key_field: record[key_field]}, company=company, defaults=defaults
            )


@router.get("/me", response=UserOut, auth=JWTAuth())
def me(request):
    """Return the current authenticated user's profile."""
    user = request.auth
    return UserOut(
        id=user.pk,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_superuser=user.is_superuser,
        company_id=user.company_id,
        company_name=user.company.name if user.company else None,
        avatar=user.avatar.url if user.avatar else None,
    )


@router.post("/token/refresh", response=TokenOut, auth=None)
def refresh_token(request, refresh: str):
    """Exchange a refresh token for a new access + refresh pair."""
    try:
        old_refresh = RefreshToken(refresh)
    except Exception:
        raise HttpError(401, "Invalid or expired refresh token.")

    # Carry forward the company_id claim.
    company_id = old_refresh.payload.get("company_id")
    new_refresh = RefreshToken.for_user(
        User.objects.get(pk=old_refresh["user_id"])
    )
    if company_id:
        new_refresh["company_id"] = company_id
        new_refresh.access_token["company_id"] = company_id

    return TokenOut(
        access=str(new_refresh.access_token),
        refresh=str(new_refresh),
    )


# ---------------------------------------------------------------------------
# Company management (superuser only)
# ---------------------------------------------------------------------------


def _require_superuser(user):
    if not user.is_superuser:
        raise HttpError(403, "Superuser access required.")


@router.get("/companies/", response=List[CompanyOut], auth=JWTAuth())
def list_companies(request):
    """List all companies. Superuser only."""
    _require_superuser(request.auth)
    return Company.objects.all()


@router.post("/companies/", response={201: TokenOut}, auth=JWTAuth())
def create_company(request, payload: CompanyIn):
    """Create a new company and assign it to the current user if they have none."""
    _require_superuser(request.auth)

    slug = slugify(payload.name)
    if Company.objects.filter(slug=slug).exists():
        raise HttpError(409, "A company with this name already exists.")

    company = Company.objects.create(name=payload.name, slug=slug, is_active=True)

    user = request.auth
    if not user.company_id:
        user.company = company
        user.role = "admin"
        user.save(update_fields=["company", "role"])

    # Return new tokens with company_id
    refresh = RefreshToken.for_user(user)
    refresh["company_id"] = company.pk
    refresh.access_token["company_id"] = company.pk

    return 201, TokenOut(
        access=str(refresh.access_token),
        refresh=str(refresh),
    )


@router.post("/companies/{company_id}/switch/", response=TokenOut, auth=JWTAuth())
def switch_company(request, company_id: int):
    """Switch the current superuser to a different company."""
    _require_superuser(request.auth)

    try:
        company = Company.objects.get(pk=company_id, is_active=True)
    except Company.DoesNotExist:
        raise HttpError(404, "Company not found or inactive.")

    user = request.auth
    user.company = company
    user.save(update_fields=["company"])

    refresh = RefreshToken.for_user(user)
    refresh["company_id"] = company.pk
    refresh.access_token["company_id"] = company.pk

    return TokenOut(
        access=str(refresh.access_token),
        refresh=str(refresh),
    )


# ---------------------------------------------------------------------------
# Sub-routers
# ---------------------------------------------------------------------------

router.add_router("/data-import/", data_import.router, tags=["Data Import"])
router.add_router("/i18n/", translations.router, tags=["i18n"])
