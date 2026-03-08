from ninja import Router

router = Router()

from apps.integrations.api.twilio import router as twilio_router  # noqa: E402
from apps.integrations.api.exotel import router as exotel_router  # noqa: E402
from apps.integrations.api.whatsapp import router as whatsapp_router  # noqa: E402
from apps.integrations.api.facebook import router as facebook_router  # noqa: E402
from apps.integrations.api.telephony import router as telephony_router  # noqa: E402
from apps.integrations.api.email import router as email_router  # noqa: E402

router.add_router("/twilio/", twilio_router, tags=["Twilio"])
router.add_router("/exotel/", exotel_router, tags=["Exotel"])
router.add_router("/whatsapp/", whatsapp_router, tags=["WhatsApp"])
router.add_router("/facebook/", facebook_router, tags=["Facebook"])
router.add_router("/telephony/", telephony_router, tags=["Telephony"])
router.add_router("/email/", email_router, tags=["Email"])
