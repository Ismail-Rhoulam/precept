import logging
from typing import Any, Dict, List

from django.shortcuts import get_object_or_404
from ninja import Router

from apps.integrations.api.schemas import (
    IntegrationStatusOut,
    TelephonyAgentCreate,
    TelephonyAgentOut,
    TelephonyAgentUpdate,
)
from apps.integrations.models import (
    ExotelSettings,
    TelephonyAgent,
    TwilioSettings,
    WhatsAppSettings,
)

logger = logging.getLogger(__name__)

router = Router()


# ---------------------------------------------------------------------------
# Agents CRUD
# ---------------------------------------------------------------------------


@router.get("/agents", response=List[TelephonyAgentOut])
def list_agents(request):
    """List all telephony agents for the current tenant."""
    agents = TelephonyAgent.objects.select_related("user").all()
    return list(agents)


@router.get("/agents/{user_id}", response=TelephonyAgentOut)
def get_agent(request, user_id: int):
    """Get the telephony agent config for a specific user."""
    agent = get_object_or_404(
        TelephonyAgent.objects.select_related("user"),
        user_id=user_id,
    )
    return agent


@router.post("/agents", response={201: TelephonyAgentOut})
def create_agent(request, payload: TelephonyAgentCreate):
    """Create a telephony agent."""
    data = payload.dict()
    data["company"] = request.company
    agent = TelephonyAgent.objects.create(**data)
    agent = TelephonyAgent.objects.select_related("user").get(pk=agent.pk)
    return 201, agent


@router.patch("/agents/{agent_id}", response=TelephonyAgentOut)
def update_agent(request, agent_id: int, payload: TelephonyAgentUpdate):
    """Update a telephony agent config."""
    agent = get_object_or_404(TelephonyAgent, pk=agent_id)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(agent, attr, value)
    agent.save()
    agent = TelephonyAgent.objects.select_related("user").get(pk=agent.pk)
    return agent


@router.delete("/agents/{agent_id}", response={204: None})
def delete_agent(request, agent_id: int):
    """Delete a telephony agent."""
    agent = get_object_or_404(TelephonyAgent, pk=agent_id)
    agent.delete()
    return 204, None


# ---------------------------------------------------------------------------
# Integration Status
# ---------------------------------------------------------------------------


@router.get("/status", response=IntegrationStatusOut)
def integration_status(request):
    """Get a summary of which integrations are enabled for the current tenant."""
    twilio_enabled = TwilioSettings.objects.filter(
        company=request.company, enabled=True
    ).exists()
    exotel_enabled = ExotelSettings.objects.filter(
        company=request.company, enabled=True
    ).exists()
    whatsapp_enabled = WhatsAppSettings.objects.filter(
        company=request.company, enabled=True
    ).exists()

    # Determine default calling medium
    default_calling_medium = ""
    if twilio_enabled:
        default_calling_medium = "Twilio"
    elif exotel_enabled:
        default_calling_medium = "Exotel"

    return IntegrationStatusOut(
        twilio_enabled=twilio_enabled,
        exotel_enabled=exotel_enabled,
        whatsapp_enabled=whatsapp_enabled,
        default_calling_medium=default_calling_medium,
    )
