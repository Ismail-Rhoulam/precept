import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { integrationsApi } from "@/lib/api/integrations"
import type {
  TwilioSettings,
  ExotelSettings,
  WhatsAppSettings,
  TelephonyAgent,
  LeadSyncSource,
  EmailAccount,
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

export function useCreateWhatsAppAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<WhatsAppSettings>) =>
      integrationsApi.createWhatsAppAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] })
      queryClient.invalidateQueries({ queryKey: ["integration-status"] })
    },
  })
}

export function useUpdateWhatsAppAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WhatsAppSettings> }) =>
      integrationsApi.updateWhatsAppAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] })
      queryClient.invalidateQueries({ queryKey: ["integration-status"] })
    },
  })
}

export function useDeleteWhatsAppAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => integrationsApi.deleteWhatsAppAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] })
      queryClient.invalidateQueries({ queryKey: ["integration-status"] })
    },
  })
}

export function useWhatsAppConversations(accountId?: number) {
  return useQuery({
    queryKey: ["whatsapp-conversations", accountId],
    queryFn: () => integrationsApi.getWhatsAppConversations(1, accountId),
  })
}

export function useConversationMessages(phoneNumber: string, accountId?: number) {
  return useQuery({
    queryKey: ["whatsapp-conversation-messages", phoneNumber, accountId],
    queryFn: () => integrationsApi.getConversationMessages(phoneNumber, 1, accountId),
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
      content_type?: string
      media_url?: string
      mime_type?: string
      account_id?: number
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

export function useUploadWhatsAppMedia() {
  return useMutation({
    mutationFn: (file: File) => integrationsApi.uploadWhatsAppMedia(file),
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

// --- Mail Domains ---

export function useMailDomains() {
  return useQuery({
    queryKey: ["mail-domains"],
    queryFn: () => integrationsApi.getMailDomains(),
  })
}

export function useAddMailDomain() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (domain: string) => integrationsApi.addMailDomain(domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mail-domains"] })
    },
  })
}

export function useDeleteMailDomain() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => integrationsApi.deleteMailDomain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mail-domains"] })
    },
  })
}

export function useDomainDnsRecords(domainId: number | null) {
  return useQuery({
    queryKey: ["domain-dns-records", domainId],
    queryFn: () => integrationsApi.getDomainDnsRecords(domainId!),
    enabled: !!domainId,
  })
}

export function useVerifyDomainDns() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => integrationsApi.verifyDomainDns(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["mail-domains"] })
      queryClient.invalidateQueries({ queryKey: ["domain-dns-records", id] })
    },
  })
}

// --- Email ---

export function useEmailAccounts() {
  return useQuery({
    queryKey: ["email-accounts"],
    queryFn: () => integrationsApi.getEmailAccounts(),
  })
}

export function useCreateEmailAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<EmailAccount>) =>
      integrationsApi.createEmailAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] })
      queryClient.invalidateQueries({ queryKey: ["integration-status"] })
    },
  })
}

export function useUpdateEmailAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmailAccount> }) =>
      integrationsApi.updateEmailAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] })
      queryClient.invalidateQueries({ queryKey: ["integration-status"] })
    },
  })
}

export function useDeleteEmailAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => integrationsApi.deleteEmailAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] })
      queryClient.invalidateQueries({ queryKey: ["integration-status"] })
    },
  })
}

export function useTestEmailConnection() {
  return useMutation({
    mutationFn: ({ id, testType }: { id: number; testType: string }) =>
      integrationsApi.testEmailConnection(id, testType),
  })
}

// --- Email Compose & Messages ---

export function useEntityEmails(entityType: string, entityId: number) {
  return useQuery({
    queryKey: ["email-messages", entityType, entityId],
    queryFn: () => integrationsApi.getEntityEmails(entityType, entityId),
    enabled: !!entityType && !!entityId,
  })
}

export function useComposeEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
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
    }) => integrationsApi.composeEmail(data),
    onSuccess: (_data, variables) => {
      if (variables.entity_type && variables.entity_id) {
        queryClient.invalidateQueries({
          queryKey: ["email-messages", variables.entity_type, variables.entity_id],
        })
      }
      queryClient.invalidateQueries({ queryKey: ["email-threads"] })
    },
  })
}

export function useUploadEmailAttachment() {
  return useMutation({
    mutationFn: (file: File) => integrationsApi.uploadEmailAttachment(file),
  })
}

export function useEmailThreads(accountId?: number) {
  return useQuery({
    queryKey: ["email-threads", accountId],
    queryFn: () => integrationsApi.getEmailThreads(1, accountId),
  })
}

export function useThreadMessages(threadId: string, accountId?: number) {
  return useQuery({
    queryKey: ["email-thread-messages", threadId, accountId],
    queryFn: () => integrationsApi.getThreadMessages(threadId, 1, accountId),
    enabled: !!threadId,
  })
}

export function useTriggerEmailSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accountId: number) => integrationsApi.triggerEmailSync(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-threads"] })
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
