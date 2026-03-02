export interface FieldsLayout {
  id: number
  entity_type: string
  layout_type: string
  layout: LayoutDefinition
  created_at: string
  updated_at: string
}

export interface LayoutDefinition {
  sections: LayoutSection[]
}

export interface LayoutSection {
  label: string
  columns: number
  fields: string[]
}

export interface FieldsLayoutCreate {
  entity_type: string
  layout_type: string
  layout: LayoutDefinition | Record<string, unknown>
}

export interface FieldsLayoutUpdate extends Partial<FieldsLayoutCreate> {}
