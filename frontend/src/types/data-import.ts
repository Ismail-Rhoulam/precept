export interface ImportableEntity {
  label: string
  value: string
  fields: ImportFieldDef[]
}

export interface ImportFieldDef {
  name: string
  label: string
  type: string
  required: boolean
}

export interface ImportPreview {
  headers: string[]
  sample_rows: string[][]
  row_count: number
}

export interface ImportResult {
  total: number
  success: number
  errors: { row: number; field: string; message: string }[]
}
