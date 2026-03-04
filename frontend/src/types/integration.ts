export interface TwilioSettings {
  id: number
  enabled: boolean
  account_sid: string
  auth_token: string
  api_key: string
  api_secret: string
  twiml_sid: string
  record_calls: boolean
}

export interface ExotelSettings {
  id: number
  enabled: boolean
  account_sid: string
  subdomain: string
  api_key: string
  api_token: string
  webhook_verify_token: string
  record_calls: boolean
}

export interface WhatsAppSettings {
  id: number
  enabled: boolean
  phone_number_id: string
  access_token: string
  business_account_id: string
  webhook_verify_token: string
  app_secret: string
}

export interface WhatsAppMessage {
  id: number
  message_id: string
  message_type: "Incoming" | "Outgoing"
  from_number: string
  to_number: string
  content: string
  content_type: string
  status: "Pending" | "Sent" | "Delivered" | "Read" | "Failed"
  template_name: string
  media_url: string
  created_at: string
}

export interface WhatsAppConversation {
  phone_number: string
  last_message: WhatsAppMessage
  last_message_at: string
  entity_type: string | null
  entity_id: number | null
  entity_name: string | null
}

export interface TelephonyAgent {
  id: number
  user_id: number
  user_email: string
  user_name: string
  mobile_no: string
  default_medium: string
  twilio_enabled: boolean
  twilio_number: string
  exotel_enabled: boolean
  exotel_number: string
  call_receiving_device: "Computer" | "Phone"
}

export interface LeadSyncSource {
  id: number
  name: string
  source_type: "Facebook"
  enabled: boolean
  facebook_page_id: string
  facebook_page_name: string
  facebook_form_id: string
  facebook_form_name: string
  field_mapping: Record<string, string>
  last_synced_at: string | null
  sync_frequency: string
  created_at: string
}

export interface FacebookPage {
  id: string
  name: string
}

export interface FacebookForm {
  id: string
  name: string
}

export interface IntegrationStatus {
  twilio_enabled: boolean
  exotel_enabled: boolean
  whatsapp_enabled: boolean
  default_calling_medium: string
}

export interface CRMSettingsData {
  id: number
  brand_name: string
  currency: string
  enable_forecasting: boolean
}
