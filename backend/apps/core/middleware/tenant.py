from django.http import HttpRequest

from apps.core.models.mixins import _tenant_context


# Paths that should skip tenant resolution entirely.
_SKIP_PREFIXES = ("/admin/", "/api/auth/")


class TenantMiddleware:
    """
    Resolve the current tenant (company) from the JWT token's ``company_id``
    claim and set it on ``request.company`` as well as in the
    ``_tenant_context`` context-var so that TenantManager can auto-filter
    querysets.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        request.company = None
        token = _tenant_context.set(None)

        try:
            if not any(request.path.startswith(p) for p in _SKIP_PREFIXES):
                company_id = self._resolve_company_id(request)
                if company_id is not None:
                    from apps.core.models import Company

                    try:
                        company = Company.objects.get(pk=company_id, is_active=True)
                        request.company = company
                        _tenant_context.set(company.pk)
                    except Company.DoesNotExist:
                        pass

            response = self.get_response(request)
        finally:
            _tenant_context.reset(token)

        return response

    @staticmethod
    def _resolve_company_id(request: HttpRequest):
        """
        Try to extract ``company_id`` from the JWT payload attached to the
        request by the upstream authentication backend.
        """
        # If the user is authenticated and has a company, use that.
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            company = getattr(user, "company", None)
            if company is not None:
                return company.pk if hasattr(company, "pk") else company

        # Fallback: attempt to decode the Authorization header manually so that
        # the tenant context is available even before Django's auth middleware
        # has run (e.g. for middleware ordering flexibility).
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            try:
                from ninja_jwt.tokens import UntypedToken

                raw_token = auth_header.split(" ", 1)[1]
                validated = UntypedToken(raw_token)
                return validated.payload.get("company_id")
            except Exception:
                return None

        return None
