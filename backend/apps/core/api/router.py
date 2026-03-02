from django.contrib.auth import authenticate
from ninja import Router
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken

from apps.core.api.schemas import LoginIn, RegisterIn, TokenOut, UserOut
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
# Sub-routers
# ---------------------------------------------------------------------------

router.add_router("/data-import/", data_import.router, tags=["Data Import"])
router.add_router("/i18n/", translations.router, tags=["i18n"])
