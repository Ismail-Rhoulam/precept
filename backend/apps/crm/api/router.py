from ninja import Router

router = Router()

from apps.crm.api.leads import router as leads_router  # noqa: E402
from apps.crm.api.deals import router as deals_router  # noqa: E402
from apps.crm.api.organizations import router as organizations_router  # noqa: E402
from apps.crm.api.contacts import router as contacts_router  # noqa: E402
from apps.crm.api.sla import router as sla_router  # noqa: E402
from apps.crm.api.products import router as products_router  # noqa: E402

router.add_router("/leads", leads_router, tags=["Leads"])
router.add_router("/deals", deals_router, tags=["Deals"])
router.add_router("/organizations", organizations_router, tags=["Organizations"])
router.add_router("/contacts", contacts_router, tags=["Contacts"])
router.add_router("/sla", sla_router, tags=["SLA"])
router.add_router("/products", products_router, tags=["Products"])
