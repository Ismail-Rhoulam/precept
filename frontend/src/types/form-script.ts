export interface FormScript {
  id: number
  name: string
  entity_type: string
  script: string
  enabled: boolean
  description: string
  created_at: string
  updated_at: string
}

export interface FormScriptCreate {
  name: string
  entity_type: string
  script: string
  enabled?: boolean
  description?: string
}

export interface FormScriptUpdate extends Partial<FormScriptCreate> {}
