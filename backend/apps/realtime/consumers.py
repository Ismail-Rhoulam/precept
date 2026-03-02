from channels.generic.websocket import AsyncJsonWebsocketConsumer


class CRMConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if user is None or user.is_anonymous:
            await self.close()
            return

        self.user_group = f"user_{user.id}"
        self.crm_group = "crm_updates"

        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.channel_layer.group_add(self.crm_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(
                self.user_group, self.channel_name
            )
        if hasattr(self, "crm_group"):
            await self.channel_layer.group_discard(
                self.crm_group, self.channel_name
            )

    async def crm_update(self, event):
        """Handle crm.update type messages."""
        await self.send_json(event["data"])

    async def receive_json(self, content, **kwargs):
        """Handle messages from clients (e.g., typing indicators, presence)."""
        msg_type = content.get("type")
        if msg_type == "ping":
            await self.send_json({"type": "pong"})

    async def notification(self, event):
        """Handle notification type messages."""
        await self.send_json(event["data"])

    async def whatsapp_message(self, event):
        """Handle whatsapp_message type messages."""
        await self.send_json(event["data"])
