import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { integrationsApi } from "@/lib/api/integrations"
import type {
  TwilioSettings,
  ExotelSettings,
  WhatsAppSettings,
  TelephonyAgent,
  LeadSyncSource,
  CRMSettingsData,
} from "@/types/integration"

// --- Twilio ---

export function useTwilioSettings() {
  return useQuery({
    queryKey: ["twilio-settings"],
    queryFn: () => integrationsApi.getTwilioSettings(),
  })
}

export function useSaveTwilioSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<TwilioSettings>) =>
      integrationsApi.saveTwilioSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twilio-settings"] })
      queryClient.invalidateQueries({ queryKey: ["integration-status"] })
    },
  })
}

// --- Exotel ---

export function useExotelSettings() {
  return useQuery({
    queryKey: ["exotel-settings"],
    queryFn: () => integrationsApi.getExotelSettings(),
  })
}

export function useSaveExotelSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<ExotelSettings>) =>
      integrationsApi.saveExotelSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exotel-settings"] })
      queryClient.invalidateQueries({ queryKey: ["integration-status"] })
    },
  })
}

// --- WhatsApp ---

export function useWhatsAppSettings() {
  return useQuery({
    queryKey: ["whatsapp-settings"],
    queryFn: () => integrationsApi.getWhatsAppSettings(),
  })
}

export function useSaveWhatsAppSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<WhatsAppSettings>) =>
      integrationsApi.saveWhatsAppSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] })
      queryClient.invalidateQueries({ queryKey: ["integration-status"] })
    },
  })
}

export function useWhatsAppConversations() {
  return useQuery({
    queryKey: ["whatsapp-conversations"],
    queryFn: () => integrationsApi.getWhatsAppConversations(),
  })
}

export function useConversationMessages(phoneNumber: string) {
  return useQuery({
    queryKey: ["whatsapp-conversation-messages", phoneNumber],
    queryFn: () => integrationsApi.getConversationMessages(phoneNumber),
    enabled: !!phoneNumber,
  })
}

export function useWhatsAppMessages(entityType: string, entityId: number) {
  return useQuery({
    queryKey: ["whatsapp-messages", entityType, entityId],
    queryFn: () => integrationsApi.getWhatsAppMessages(entityType, entityId),
    enabled: !!entityType && !!entityId,
  })
}

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      to_number: string
      content: string
      entity_type?: string
      entity_id?: number
    }) => integrationsApi.sendWhatsAppMessage(data),
    onSuccess: (_data, variables) => {
      if (variables.entity_type && variables.entity_id) {
        queryClient.invalidateQueries({
          queryKey: [
            "whatsapp-messages",
            variables.entity_type,
            variables.entity_id,
          ],
        })
      }
    },
  })
}

// --- Facebook Sync Sources ---

export function useSyncSources() {
  return useQuery({
    queryKey: ["sync-sources"],
    queryFn: () => integrationsApi.getSyncSources(),
  })
}

export function useCreateSyncSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<LeadSyncSource>) =>
      integrationsApi.createSyncSource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-sources"] })
    },
  })
}

export function useUpdateSyncSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LeadSyncSource> }) =>
      integrationsApi.updateSyncSource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-sources"] })
    },
  })
}

export function useDeleteSyncSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => integrationsApi.deleteSyncSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-sources"] })
    },
  })
}

export function useTriggerSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => integrationsApi.triggerSync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-sources"] })
    },
  })
}

// --- Telephony Agents ---

export function useTelephonyAgents() {
  return useQuery({
    queryKey: ["telephony-agents"],
    queryFn: () => integrationsApi.getAgents(),
  })
}

export function useCreateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<TelephonyAgent>) =>
      integrationsApi.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telephony-agents"] })
    },
  })
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TelephonyAgent> }) =>
      integrationsApi.updateAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telephony-agents"] })
    },
  })
}

export function useDeleteAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => integrationsApi.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telephony-agents"] })
    },
  })
}

// --- Integration Status ---

export function useIntegrationStatus() {
  return useQuery({
    queryKey: ["integration-status"],
    queryFn: () => integrationsApi.getIntegrationStatus(),
  })
}

// --- CRM Settings ---

export function useCRMSettings() {
  return useQuery({
    queryKey: ["crm-settings"],
    queryFn: () => integrationsApi.getCRMSettings(),
  })
}

export function useUpdateCRMSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CRMSettingsData>) =>
      integrationsApi.updateCRMSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-settings"] })
    },
  })
}

// --- Exotel Call ---

export function useMakeExotelCall() {
  return useMutation({
    mutationFn: (data: { to: string; from?: string }) =>
      integrationsApi.makeExotelCall(data),
  })
}
