from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from ninja import NinjaAPI
from ninja_jwt.authentication import JWTAuth

from apps.core.api.router import router as core_router
from apps.crm.api.router import router as crm_router
from apps.communication.api.router import router as comm_router
from apps.dashboard.api.router import router as dashboard_router
from apps.views.api.router import router as views_router
from apps.integrations.api.router import router as integrations_router
from apps.settings.api.router import router as settings_router

api = NinjaAPI(
    title="Precept CRM API",
    version="0.1.0",
    auth=JWTAuth(),
    docs_url="/docs",
)

api.add_router("/auth/", core_router, tags=["Authentication"])
api.add_router("/crm/", crm_router, tags=["CRM"])
api.add_router("/comm/", comm_router, tags=["Communication"])
api.add_router("/dashboard/", dashboard_router, tags=["Dashboard"])
api.add_router("/views/", views_router, tags=["Views"])
api.add_router("/integrations/", integrations_router, tags=["Integrations"])
api.add_router("/settings/", settings_router, tags=["Settings"])

def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("api/health/", health_check),
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
