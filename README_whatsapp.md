# WhatsApp Integration – Developer Guide

## Architecture

| Layer | Files |
|-------|-------|
| **Model** | `backend/apps/integrations/models/whatsapp_settings.py` |
| **Service** | `backend/apps/integrations/services/whatsapp_service.py` |
| **API** | `backend/apps/integrations/api/whatsapp.py` |
| **Schemas** | `backend/apps/integrations/api/schemas.py` |
| **Frontend chat** | `frontend/src/components/telephony/WhatsAppChat.tsx` |
| **Frontend page** | `frontend/src/app/(dashboard)/whatsapp/page.tsx` |
| **Types** | `frontend/src/types/integration.ts` |
| **Hooks** | `frontend/src/hooks/useIntegrations.ts` |
| **API client** | `frontend/src/lib/api/integrations.ts` |
| **WebSocket** | `frontend/src/hooks/useWebSocket.ts` |

## Supported Message Types

| Type | Inbound | Outbound | Notes |
|------|---------|----------|-------|
| Text + emoji | Yes | Yes | UTF-8 stored as-is, no sanitisation needed |
| Image + caption | Yes | Yes | Caption stored in `content` field |
| Video + caption | Yes | Yes | Caption stored in `content` field |
| Audio / voice note | Yes | Yes | Voice notes arrive as `audio/ogg; codecs=opus` |
| Document | Yes | Yes | Filename / caption in `content` field |
| Static sticker (.webp) | Yes | Yes | Emoji in `content`, media in `media_url` |
| Animated sticker (.webp) | Yes | Yes | Same handling – WhatsApp animated stickers are webp |
| Reaction | Yes | – | Emoji stored in `content` |
| Template | – | Yes | Via `/send-template` endpoint |

## How Inbound Works

1. Meta sends POST to `/api/integrations/whatsapp/webhook`.
2. `handle_webhook()` parses the payload, downloads media via Graph API, stores locally under `MEDIA_ROOT/whatsapp/`, creates a `WhatsAppMessage` record.
3. **Idempotency**: duplicate `message_id` values are silently skipped – safe for webhook retries.
4. A WebSocket event (`whatsapp_message`) is broadcast to connected frontend clients.

## How Outbound Works

### Text message

```bash
curl -X POST http://localhost:8000/api/integrations/whatsapp/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_number": "1234567890",
    "content": "Hello 👋 world! 🎉"
  }'
```

### Image + caption

```bash
# Step 1: Upload the file
curl -X POST http://localhost:8000/api/integrations/whatsapp/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@photo.jpg"
# Response: { "media_url": "/media/whatsapp/abc123.jpg", "mime_type": "image/jpeg", "filename": "photo.jpg" }

# Step 2: Send the message
curl -X POST http://localhost:8000/api/integrations/whatsapp/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_number": "1234567890",
    "content": "Check this out!",
    "content_type": "image",
    "media_url": "/media/whatsapp/abc123.jpg",
    "mime_type": "image/jpeg"
  }'
```

### Video + caption

```bash
curl -X POST http://localhost:8000/api/integrations/whatsapp/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@clip.mp4"

curl -X POST http://localhost:8000/api/integrations/whatsapp/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_number": "1234567890",
    "content": "Watch this!",
    "content_type": "video",
    "media_url": "/media/whatsapp/<uuid>.mp4",
    "mime_type": "video/mp4"
  }'
```

### Audio / voice note

```bash
curl -X POST http://localhost:8000/api/integrations/whatsapp/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@voice.ogg"

curl -X POST http://localhost:8000/api/integrations/whatsapp/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_number": "1234567890",
    "content_type": "audio",
    "media_url": "/media/whatsapp/<uuid>.ogg",
    "mime_type": "audio/ogg"
  }'
```

### Document

```bash
curl -X POST http://localhost:8000/api/integrations/whatsapp/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@report.pdf"

curl -X POST http://localhost:8000/api/integrations/whatsapp/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_number": "1234567890",
    "content": "Q4 Report",
    "content_type": "document",
    "media_url": "/media/whatsapp/<uuid>.pdf",
    "mime_type": "application/pdf"
  }'
```

### Static sticker (.webp)

```bash
curl -X POST http://localhost:8000/api/integrations/whatsapp/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sticker.webp"

curl -X POST http://localhost:8000/api/integrations/whatsapp/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_number": "1234567890",
    "content_type": "sticker",
    "media_url": "/media/whatsapp/<uuid>.webp",
    "mime_type": "image/webp"
  }'
```

### Animated sticker (.webp)

Same as static sticker – WhatsApp animated stickers use webp format. The only
difference is the file itself contains animation frames.

```bash
curl -X POST http://localhost:8000/api/integrations/whatsapp/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@animated.webp"

curl -X POST http://localhost:8000/api/integrations/whatsapp/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_number": "1234567890",
    "content_type": "sticker",
    "media_url": "/media/whatsapp/<uuid>.webp",
    "mime_type": "image/webp"
  }'
```

## Testing Inbound Messages

Use the Meta webhook testing tool in the App Dashboard, or simulate with curl:

```bash
curl -X POST http://localhost:8000/api/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "BIZ_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": { "phone_number_id": "YOUR_PHONE_NUMBER_ID" },
          "messages": [{
            "id": "wamid.test123",
            "from": "1234567890",
            "timestamp": "1700000000",
            "type": "text",
            "text": { "body": "Hello 👋 from test! 🚀🎉" }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### Test sticker inbound (simulated)

```bash
curl -X POST http://localhost:8000/api/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "BIZ_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": { "phone_number_id": "YOUR_PHONE_NUMBER_ID" },
          "messages": [{
            "id": "wamid.sticker456",
            "from": "1234567890",
            "timestamp": "1700000000",
            "type": "sticker",
            "sticker": {
              "id": "MEDIA_ID",
              "mime_type": "image/webp",
              "animated": false,
              "emoji": "😀"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

## Troubleshooting

### Webhook not receiving messages
- Verify `webhook_verify_token` in settings matches what's configured in Meta Dashboard.
- Ensure the webhook URL is publicly accessible (use ngrok for local dev).
- Check that `enabled=True` in WhatsApp settings.

### Media download fails
- Access token may be expired – refresh it in Meta Dashboard.
- Check `MEDIA_ROOT` directory has write permissions.
- Look for `Failed to download media` in backend logs.

### Outbound media fails
- Ensure the file was uploaded via `/upload` first.
- WhatsApp has size limits: images 5MB, video 16MB, audio 16MB, documents 100MB, stickers 500KB (static) / 500KB (animated).
- Stickers must be exactly 512x512 pixels in webp format.

### Emoji display issues
- The system stores emoji as native UTF-8. No encoding/decoding is needed.
- If emoji appear garbled, check your database character set is `utf8mb4` (MySQL) or UTF-8 (PostgreSQL).

### Duplicate messages
- The webhook handler deduplicates by WhatsApp message ID (`message_id` field).
- If you see duplicates, check that `message_id` is populated on existing records.

### Status updates not reflecting
- Status updates use `WhatsAppMessage.unscoped` to bypass tenant filtering.
- The `message_id` field must be indexed (it is by default via `db_index=True`).

## Migration

After deploying the code changes, run the migration:

```bash
python manage.py migrate integrations
```

This adds the `mime_type` field and changes `media_url` from `URLField` to `CharField`.
