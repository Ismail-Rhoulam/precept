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
  display_name: string
  is_default: boolean
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
  mime_type: string
  media_proxy_url: string | null
  whatsapp_account_id: number | null
  created_at: string
}

export interface WhatsAppConversation {
  phone_number: string
  last_message: WhatsAppMessage
  last_message_at: string
  entity_type: string | null
  entity_id: number | null
  entity_name: string | null
  whatsapp_account_id: number | null
  whatsapp_account_name: string | null
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

export interface EmailAccount {
  id: number
  enabled: boolean
  display_name: string
  is_default: boolean
  email_address: string
  smtp_mode: "external" | "builtin"
  mail_domain: string
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  smtp_use_tls: boolean
  smtp_use_ssl: boolean
  imap_host: string
  imap_port: number
  imap_username: string
  imap_password: string
  imap_use_ssl: boolean
  imap_folder: string
  enable_incoming: boolean
  last_synced_at: string | null
  sync_frequency: string
}

export interface IntegrationStatus {
  twilio_enabled: boolean
  exotel_enabled: boolean
  whatsapp_enabled: boolean
  email_enabled: boolean
  default_calling_medium: string
}

export interface EmailMessage {
  id: number
  direction: "Incoming" | "Outgoing"
  status: "Draft" | "Queued" | "Sending" | "Sent" | "Failed" | "Received"
  from_email: string
  to_emails: string[]
  cc_emails: string[]
  bcc_emails: string[]
  subject: string
  body_html: string
  body_text: string
  message_id_header: string
  in_reply_to: string
  thread_id: string
  email_account_id: number | null
  entity_type: string | null
  entity_id: number | null
  attachments: EmailAttachment[]
  error_message: string
  created_at: string
  updated_at: string
}

export interface EmailAttachment {
  id: number
  filename: string
  mime_type: string
  file_size: number
}

export interface EmailThread {
  thread_id: string
  subject: string
  last_message: EmailMessage
  last_message_at: string
  participants: string[]
  message_count: number
  entity_type: string | null
  entity_id: number | null
  entity_name: string | null
  email_account_id: number | null
  email_account_name: string | null
}

export interface CRMSettingsData {
  id: number
  brand_name: string
  currency: string
  enable_forecasting: boolean
}
