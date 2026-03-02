from ninja import Router

from apps.views.api import view_settings, form_scripts, fields_layout

router = Router()

router.add_router("/settings/", view_settings.router, tags=["View Settings"])
router.add_router("/form-scripts/", form_scripts.router, tags=["Form Scripts"])
router.add_router("/fields-layout/", fields_layout.router, tags=["Fields Layout"])
