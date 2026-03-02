import { api } from "./client"
import type {
  TwilioSettings,
  ExotelSettings,
  WhatsAppSettings,
  WhatsAppMessage,
  TelephonyAgent,
  LeadSyncSource,
  FacebookPage,
  FacebookForm,
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
    api.get<WhatsAppSettings>("/integrations/whatsapp/settings"),

  saveWhatsAppSettings: (data: Partial<WhatsAppSettings>) =>
    api.post<WhatsAppSettings>("/integrations/whatsapp/settings", data),

  getWhatsAppMessages: (entityType: string, entityId: number) =>
    api.get<WhatsAppMessage[]>(
      `/integrations/whatsapp/messages/${entityType}/${entityId}`
    ),

  sendWhatsAppMessage: (data: {
    to_number: string
    content: string
    entity_type?: string
    entity_id?: number
  }) => api.post<WhatsAppMessage>("/integrations/whatsapp/messages", data),

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

  // CRM Settings
  getCRMSettings: () =>
    api.get<CRMSettingsData>("/settings/"),

  updateCRMSettings: (data: Partial<CRMSettingsData>) =>
    api.patch<CRMSettingsData>("/settings/", data),
}
