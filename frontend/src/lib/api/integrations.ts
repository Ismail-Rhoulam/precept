import { api } from "./client"
import type {
  TwilioSettings,
  ExotelSettings,
  WhatsAppSettings,
  WhatsAppMessage,
  WhatsAppConversation,
  TelephonyAgent,
  LeadSyncSource,
  FacebookPage,
  FacebookForm,
  EmailAccount,
  EmailMessage,
  EmailThread,
  IntegrationStatus,
  CRMSettingsData,
} from "@/types/integration"

export const integrationsApi = {
  // Twilio
  getTwilioSettings: () =>
    api.get<TwilioSettings>("/integrations/twilio/settings"),

  saveTwilioSettings: (data: Partial<TwilioSettings>) =>
    api.post<TwilioSettings>("/integrations/twilio/settings", data),

  getVoIPToken: () =>
    api.get<{ token: string }>("/integrations/twilio/token"),

  // Exotel
  getExotelSettings: () =>
    api.get<ExotelSettings>("/integrations/exotel/settings"),

  saveExotelSettings: (data: Partial<ExotelSettings>) =>
    api.post<ExotelSettings>("/integrations/exotel/settings", data),

  makeExotelCall: (data: { to: string; from?: string }) =>
    api.post("/integrations/exotel/make-call", data),

  // WhatsApp
  getWhatsAppSettings: () =>
    api.get<WhatsAppSettings[]>("/integrations/whatsapp/settings"),

  createWhatsAppAccount: (data: Partial<WhatsAppSettings>) =>
    api.post<WhatsAppSettings>("/integrations/whatsapp/settings", data),

  getWhatsAppAccount: (id: number) =>
    api.get<WhatsAppSettings>(`/integrations/whatsapp/settings/${id}`),

  updateWhatsAppAccount: (id: number, data: Partial<WhatsAppSettings>) =>
    api.patch<WhatsAppSettings>(`/integrations/whatsapp/settings/${id}`, data),

  deleteWhatsAppAccount: (id: number) =>
    api.delete(`/integrations/whatsapp/settings/${id}`),

  getWhatsAppMessages: async (entityType: string, entityId: number) => {
    const res = await api.get<{ results: WhatsAppMessage[]; total: number }>(
      `/integrations/whatsapp/messages/${entityType}/${entityId}`
    )
    return res.results
  },

  sendWhatsAppMessage: (data: {
    to_number: string
    content: string
    content_type?: string
    media_url?: string
    mime_type?: string
    account_id?: number
    entity_type?: string
    entity_id?: number
  }) => api.post<WhatsAppMessage>("/integrations/whatsapp/messages", data),

  uploadWhatsAppMedia: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
    const resp = await fetch(`${baseUrl}/integrations/whatsapp/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: "Upload failed" }))
      throw new Error(err.detail || "Upload failed")
    }
    return resp.json() as Promise<{ media_url: string; mime_type: string; filename: string }>
  },

  getWhatsAppConversations: (page: number = 1, accountId?: number) =>
    api.get<{ results: WhatsAppConversation[]; total: number }>(
      "/integrations/whatsapp/conversations",
      { params: { page, ...(accountId ? { account_id: accountId } : {}) } }
    ),

  getConversationMessages: (phoneNumber: string, page: number = 1, accountId?: number) =>
    api.get<{ results: WhatsAppMessage[]; total: number }>(
      `/integrations/whatsapp/conversations/${encodeURIComponent(phoneNumber)}/messages`,
      { params: { page, ...(accountId ? { account_id: accountId } : {}) } }
    ),

  // Facebook
  getSyncSources: () =>
    api.get<LeadSyncSource[]>("/integrations/facebook/sync-sources"),

  createSyncSource: (data: Partial<LeadSyncSource>) =>
    api.post<LeadSyncSource>("/integrations/facebook/sync-sources", data),

  updateSyncSource: (id: number, data: Partial<LeadSyncSource>) =>
    api.patch<LeadSyncSource>(`/integrations/facebook/sync-sources/${id}`, data),

  deleteSyncSource: (id: number) =>
    api.delete(`/integrations/facebook/sync-sources/${id}`),

  triggerSync: (id: number) =>
    api.post(`/integrations/facebook/sync-sources/${id}/sync`),

  fetchFacebookPages: (token: string) =>
    api.post<FacebookPage[]>("/integrations/facebook/fetch-pages", {
      access_token: token,
    }),

  fetchFacebookForms: (pageId: string, token: string) =>
    api.post<FacebookForm[]>("/integrations/facebook/fetch-forms", {
      page_id: pageId,
      access_token: token,
    }),

  // Telephony Agents
  getAgents: () =>
    api.get<TelephonyAgent[]>("/integrations/telephony/agents"),

  getAgent: (userId: number) =>
    api.get<TelephonyAgent>(`/integrations/telephony/agents/${userId}`),

  createAgent: (data: Partial<TelephonyAgent>) =>
    api.post<TelephonyAgent>("/integrations/telephony/agents", data),

  updateAgent: (id: number, data: Partial<TelephonyAgent>) =>
    api.patch<TelephonyAgent>(`/integrations/telephony/agents/${id}`, data),

  deleteAgent: (id: number) =>
    api.delete(`/integrations/telephony/agents/${id}`),

  getIntegrationStatus: () =>
    api.get<IntegrationStatus>("/integrations/telephony/status"),

  // Email
  getEmailAccounts: () =>
    api.get<EmailAccount[]>("/integrations/email/settings"),

  createEmailAccount: (data: Partial<EmailAccount>) =>
    api.post<EmailAccount>("/integrations/email/settings", data),

  getEmailAccount: (id: number) =>
    api.get<EmailAccount>(`/integrations/email/settings/${id}`),

  updateEmailAccount: (id: number, data: Partial<EmailAccount>) =>
    api.patch<EmailAccount>(`/integrations/email/settings/${id}`, data),

  deleteEmailAccount: (id: number) =>
    api.delete(`/integrations/email/settings/${id}`),

  testEmailConnection: (id: number, testType: string) =>
    api.post<{ success: boolean; error?: string }>(
      `/integrations/email/settings/${id}/test`,
      { test_type: testType }
    ),

  // Email Compose & Messages
  composeEmail: (data: {
    to_emails: string[]
    cc_emails?: string[]
    bcc_emails?: string[]
    subject?: string
    body_html?: string
    body_text?: string
    account_id?: number
    entity_type?: string
    entity_id?: number
    in_reply_to_id?: number
    attachment_ids?: number[]
  }) => api.post<EmailMessage>("/integrations/email/compose", data),

  uploadEmailAttachment: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
    const resp = await fetch(`${baseUrl}/integrations/email/upload-attachment`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: "Upload failed" }))
      throw new Error(err.detail || "Upload failed")
    }
    return resp.json() as Promise<{ id: number; filename: string; mime_type: string; file_size: number }>
  },

  getEntityEmails: (entityType: string, entityId: number, page: number = 1) =>
    api.get<{ results: EmailMessage[]; total: number; page: number; page_size: number }>(
      `/integrations/email/messages/${entityType}/${entityId}`,
      { params: { page } }
    ),

  getEmailDetail: (messageId: number) =>
    api.get<EmailMessage>(`/integrations/email/messages/detail/${messageId}`),

  getEmailThreads: (page: number = 1, accountId?: number) =>
    api.get<{ results: EmailThread[]; total: number; page: number; page_size: number }>(
      "/integrations/email/threads",
      { params: { page, ...(accountId ? { account_id: accountId } : {}) } }
    ),

  getThreadMessages: (threadId: string, page: number = 1, accountId?: number) =>
    api.get<{ results: EmailMessage[]; total: number; page: number; page_size: number }>(
      `/integrations/email/threads/${encodeURIComponent(threadId)}/messages`,
      { params: { page, ...(accountId ? { account_id: accountId } : {}) } }
    ),

  triggerEmailSync: (accountId: number) =>
    api.post<{ status: string; new_messages?: number; error?: string }>(
      `/integrations/email/sync/${accountId}`
    ),

  getBuiltinSmtpStatus: () =>
    api.get<{ available: boolean; mail_domain: string }>(
      "/integrations/email/builtin-smtp-status"
    ),

  getDkimRecord: () =>
    api.get<{ selector: string; domain: string; dns_name?: string; record: string; error?: string }>(
      "/integrations/email/dkim-record"
    ),

  // CRM Settings
  getCRMSettings: () =>
    api.get<CRMSettingsData>("/settings/"),

  updateCRMSettings: (data: Partial<CRMSettingsData>) =>
    api.patch<CRMSettingsData>("/settings/", data),
}
