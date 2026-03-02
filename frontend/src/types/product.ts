export interface Product {
  id: number
  product_code: string
  product_name: string
  standard_rate: number
  description: string
  disabled: boolean
  created_at: string
  updated_at: string
}

export interface ProductCreate {
  product_code: string
  product_name: string
  standard_rate: number
  description?: string
}

export interface ProductUpdate extends Partial<ProductCreate> {
  disabled?: boolean
}

export interface LineItem {
  id: number
  product_id: number | null
  product_name: string
  qty: number
  rate: number
  amount: number
  discount_percentage: number
  discount_amount: number
  net_amount: number
}

export interface LineItemCreate {
  product_id?: number | null
  product_name: string
  qty: number
  rate: number
  discount_percentage?: number
}

export interface ProductListParams {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
}
