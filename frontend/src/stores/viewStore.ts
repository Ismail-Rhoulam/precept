import { create } from "zustand"
import type { ViewSettings, ColumnDef } from "@/types/view"

const DEFAULT_COLUMNS: Record<string, ColumnDef[]> = {
  Lead: [
    { key: "lead_name", label: "Lead Name", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "organization", label: "Organization", type: "text" },
    { key: "status", label: "Status", type: "select" },
    { key: "source", label: "Source", type: "select" },
    { key: "lead_owner_name", label: "Owner", type: "text" },
    { key: "created_at", label: "Created", type: "date" },
  ],
  Deal: [
    { key: "organization_name", label: "Organization", type: "text" },
    { key: "status", label: "Status", type: "select" },
    { key: "deal_value", label: "Deal Value", type: "number" },
    { key: "probability", label: "Probability", type: "number" },
    { key: "source", label: "Source", type: "select" },
    { key: "deal_owner_name", label: "Owner", type: "text" },
    { key: "created_at", label: "Created", type: "date" },
  ],
  Contact: [
    { key: "full_name", label: "Name", type: "text" },
    { key: "email_id", label: "Email", type: "text" },
    { key: "mobile_no", label: "Mobile", type: "text" },
    { key: "company_name", label: "Company", type: "text" },
    { key: "designation", label: "Designation", type: "text" },
    { key: "created_at", label: "Created", type: "date" },
  ],
  Organization: [
    { key: "organization_name", label: "Name", type: "text" },
    { key: "website", label: "Website", type: "text" },
    { key: "industry", label: "Industry", type: "select" },
    { key: "territory", label: "Territory", type: "select" },
    { key: "no_of_employees", label: "Employees", type: "number" },
    { key: "annual_revenue", label: "Revenue", type: "number" },
    { key: "created_at", label: "Created", type: "date" },
  ],
}

interface ViewState {
  activeView: ViewSettings | null
  viewType: "list" | "kanban" | "group_by"
  filters: Record<string, any>
  orderBy: Record<string, string>
  columns: ColumnDef[]
  groupByField: string
  columnField: string

  setActiveView: (view: ViewSettings | null) => void
  setViewType: (type: "list" | "kanban" | "group_by") => void
  setFilters: (filters: Record<string, any>) => void
  setOrderBy: (orderBy: Record<string, string>) => void
  setColumns: (columns: ColumnDef[]) => void
  setGroupByField: (field: string) => void
  setColumnField: (field: string) => void
  resetToDefaults: (entityType: string) => void
}

export const useViewStore = create<ViewState>((set) => ({
  activeView: null,
  viewType: "list",
  filters: {},
  orderBy: { created_at: "desc" },
  columns: [],
  groupByField: "",
  columnField: "status",

  setActiveView: (view: ViewSettings | null) => {
    if (view) {
      set({
        activeView: view,
        viewType: view.type,
        filters: view.filters || {},
        orderBy: view.order_by || { created_at: "desc" },
        columns: view.columns || [],
        groupByField: view.group_by_field || "",
        columnField: view.column_field || "status",
      })
    } else {
      set({ activeView: null })
    }
  },

  setViewType: (type: "list" | "kanban" | "group_by") =>
    set({ viewType: type }),

  setFilters: (filters: Record<string, any>) =>
    set({ filters }),

  setOrderBy: (orderBy: Record<string, string>) =>
    set({ orderBy }),

  setColumns: (columns: ColumnDef[]) =>
    set({ columns }),

  setGroupByField: (field: string) =>
    set({ groupByField: field }),

  setColumnField: (field: string) =>
    set({ columnField: field }),

  resetToDefaults: (entityType: string) =>
    set({
      activeView: null,
      viewType: "list",
      filters: {},
      orderBy: { created_at: "desc" },
      columns: DEFAULT_COLUMNS[entityType] || [],
      groupByField: "",
      columnField: "status",
    }),
}))
