from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path("ws/crm/", consumers.CRMConsumer.as_asgi()),
]
