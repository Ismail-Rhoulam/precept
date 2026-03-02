"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  List,
  Kanban,
  LayoutGrid,
  ChevronDown,
  Filter,
  ArrowUpDown,
  Columns3,
  Save,
  Pin,
  PinOff,
  Globe,
  Lock,
  Star,
  Copy,
  Trash2,
  X,
  Loader2,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useViewStore } from "@/stores/viewStore"
import {
  useViews,
  useCreateView,
  useDeleteView,
  useSetDefaultView,
  usePinView,
  useTogglePublicView,
} from "@/hooks/useViews"
import type { ViewSettings, ViewSettingsCreate, ColumnDef, FilterCondition } from "@/types/view"
import { FilterBuilder } from "./FilterBuilder"
import { SortControls } from "./SortControls"
import { ColumnSettings } from "./ColumnSettings"

interface ViewControlsProps {
  entityType: string
  onFiltersChange?: (filters: Record<string, any>) => void
  onSortChange?: (orderBy: Record<string, string>) => void
  onViewTypeChange?: (type: "list" | "kanban" | "group_by") => void
  onColumnFieldChange?: (field: string) => void
  onGroupByFieldChange?: (field: string) => void
}

const VIEW_TYPE_TABS = [
  { type: "list" as const, label: "List", icon: List },
  { type: "kanban" as const, label: "Kanban", icon: Kanban },
  { type: "group_by" as const, label: "Group By", icon: LayoutGrid },
]

export function ViewControls({
  entityType,
  onFiltersChange,
  onSortChange,
  onViewTypeChange,
  onColumnFieldChange,
  onGroupByFieldChange,
}: ViewControlsProps) {
  const {
    activeView,
    viewType,
    filters,
    orderBy,
    columns,
    groupByField,
    columnField,
    setActiveView,
    setViewType,
    setFilters,
    setOrderBy,
    setColumns,
    setGroupByField,
    setColumnField,
  } = useViewStore()

  const { data: views, isLoading: viewsLoading } = useViews(entityType)
  const createView = useCreateView()
  const deleteView = useDeleteView()
  const setDefaultView = useSetDefaultView()
  const pinView = usePinView()
  const togglePublicView = useTogglePublicView()

  const [showViewsDropdown, setShowViewsDropdown] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveLabel, setSaveLabel] = useState("")
  const [viewActionMenuId, setViewActionMenuId] = useState<number | null>(null)

  const viewsDropdownRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const columnSettingsRef = useRef<HTMLDivElement>(null)
  const saveFormRef = useRef<HTMLDivElement>(null)
  const viewActionMenuRef = useRef<HTMLDivElement>(null)

  const closeAllDropdowns = useCallback(() => {
    setShowViewsDropdown(false)
    setShowSortDropdown(false)
    setShowColumnSettings(false)
    setShowSaveForm(false)
    setViewActionMenuId(null)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (viewsDropdownRef.current && !viewsDropdownRef.current.contains(target)) {
        setShowViewsDropdown(false)
        setViewActionMenuId(null)
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(target)) {
        setShowSortDropdown(false)
      }
      if (columnSettingsRef.current && !columnSettingsRef.current.contains(target)) {
        setShowColumnSettings(false)
      }
      if (saveFormRef.current && !saveFormRef.current.contains(target)) {
        setShowSaveForm(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleViewTypeChange(type: "list" | "kanban" | "group_by") {
    setViewType(type)
    onViewTypeChange?.(type)
    closeAllDropdowns()
  }

  function handleSelectView(view: ViewSettings) {
    setActiveView(view)
    onFiltersChange?.(view.filters || {})
    onSortChange?.(view.order_by || {})
    onViewTypeChange?.(view.type)
    if (view.column_field) onColumnFieldChange?.(view.column_field)
    if (view.group_by_field) onGroupByFieldChange?.(view.group_by_field)
    setShowViewsDropdown(false)
    setViewActionMenuId(null)
  }

  function handleFiltersChange(newFilters: FilterCondition[]) {
    const filterMap: Record<string, any> = {}
    newFilters.forEach((f) => {
      filterMap[f.field] = { operator: f.operator, value: f.value }
    })
    setFilters(filterMap)
    onFiltersChange?.(filterMap)
  }

  function handleSortChange(newOrderBy: Record<string, string>) {
    setOrderBy(newOrderBy)
    onSortChange?.(newOrderBy)
  }

  function handleColumnsChange(newColumns: ColumnDef[]) {
    setColumns(newColumns)
  }

  function handleGroupByFieldChange(field: string) {
    setGroupByField(field)
    onGroupByFieldChange?.(field)
  }

  function handleColumnFieldChange(field: string) {
    setColumnField(field)
    onColumnFieldChange?.(field)
  }

  async function handleSaveView(e: React.FormEvent) {
    e.preventDefault()
    if (!saveLabel.trim()) return

    const data: ViewSettingsCreate = {
      label: saveLabel.trim(),
      type: viewType,
      entity_type: entityType,
      filters,
      order_by: orderBy,
      columns,
      group_by_field: groupByField,
      column_field: columnField,
    }

    try {
      const newView = await createView.mutateAsync(data)
      setActiveView(newView)
      setSaveLabel("")
      setShowSaveForm(false)
    } catch {
      // Error handled by mutation state
    }
  }

  async function handleDeleteView(id: number) {
    try {
      await deleteView.mutateAsync(id)
      if (activeView?.id === id) {
        setActiveView(null)
      }
      setViewActionMenuId(null)
    } catch {
      // Error handled by mutation state
    }
  }

  async function handleSetDefault(id: number) {
    try {
      await setDefaultView.mutateAsync(id)
      setViewActionMenuId(null)
    } catch {
      // Error handled by mutation state
    }
  }

  async function handlePinView(id: number) {
    try {
      await pinView.mutateAsync(id)
      setViewActionMenuId(null)
    } catch {
      // Error handled by mutation state
    }
  }

  async function handleTogglePublic(id: number) {
    try {
      await togglePublicView.mutateAsync(id)
      setViewActionMenuId(null)
    } catch {
      // Error handled by mutation state
    }
  }

  async function handleDuplicateView(view: ViewSettings) {
    const data: ViewSettingsCreate = {
      label: `${view.label} (Copy)`,
      type: view.type,
      entity_type: view.entity_type,
      filters: view.filters,
      order_by: view.order_by,
      columns: view.columns,
      group_by_field: view.group_by_field,
      column_field: view.column_field,
      title_field: view.title_field,
      kanban_columns: view.kanban_columns,
      kanban_fields: view.kanban_fields,
    }

    try {
      await createView.mutateAsync(data)
      setViewActionMenuId(null)
    } catch {
      // Error handled by mutation state
    }
  }

  // Parse filters into FilterCondition[] for the FilterBuilder
  const filterConditions: FilterCondition[] = Object.entries(filters).map(
    ([field, condition]) => ({
      field,
      operator: condition?.operator || "=",
      value: condition?.value ?? "",
    })
  )

  const filterCount = filterConditions.length
  const sortCount = Object.keys(orderBy).length

  // Split views into pinned and unpinned
  const pinnedViews = (views || []).filter((v) => v.pinned)
  const unpinnedViews = (views || []).filter((v) => !v.pinned)

  return (
    <div className="space-y-0">
      {/* Main Toolbar */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-white border border-gray-200 rounded-lg">
        {/* Left Group: View Type Tabs + Active View Name */}
        <div className="flex items-center gap-3">
          {/* View Type Tabs */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {VIEW_TYPE_TABS.map((tab) => (
              <button
                key={tab.type}
                onClick={() => handleViewTypeChange(tab.type)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  viewType === tab.type
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Name Dropdown */}
          <div className="relative" ref={viewsDropdownRef}>
            <button
              onClick={() => {
                setShowViewsDropdown(!showViewsDropdown)
                setShowSortDropdown(false)
                setShowColumnSettings(false)
                setShowSaveForm(false)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              {activeView?.label || "All " + entityType + "s"}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showViewsDropdown && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  {viewsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <>
                      {/* Default "All" view */}
                      <button
                        onClick={() => {
                          setActiveView(null)
                          onFiltersChange?.({})
                          onSortChange?.({ created_at: "desc" })
                          setShowViewsDropdown(false)
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                          !activeView
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <List className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 truncate">All {entityType}s</span>
                      </button>

                      {/* Pinned Views */}
                      {pinnedViews.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 mt-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                              Pinned
                            </span>
                          </div>
                          {pinnedViews.map((view) => (
                            <ViewListItem
                              key={view.id}
                              view={view}
                              isActive={activeView?.id === view.id}
                              actionMenuOpen={viewActionMenuId === view.id}
                              onSelect={() => handleSelectView(view)}
                              onToggleActions={() =>
                                setViewActionMenuId(
                                  viewActionMenuId === view.id ? null : view.id
                                )
                              }
                              onSetDefault={() => handleSetDefault(view.id)}
                              onPin={() => handlePinView(view.id)}
                              onTogglePublic={() => handleTogglePublic(view.id)}
                              onDuplicate={() => handleDuplicateView(view)}
                              onDelete={() => handleDeleteView(view.id)}
                              actionMenuRef={viewActionMenuRef}
                            />
                          ))}
                        </>
                      )}

                      {/* Other Views */}
                      {unpinnedViews.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 mt-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                              Views
                            </span>
                          </div>
                          {unpinnedViews.map((view) => (
                            <ViewListItem
                              key={view.id}
                              view={view}
                              isActive={activeView?.id === view.id}
                              actionMenuOpen={viewActionMenuId === view.id}
                              onSelect={() => handleSelectView(view)}
                              onToggleActions={() =>
                                setViewActionMenuId(
                                  viewActionMenuId === view.id ? null : view.id
                                )
                              }
                              onSetDefault={() => handleSetDefault(view.id)}
                              onPin={() => handlePinView(view.id)}
                              onTogglePublic={() => handleTogglePublic(view.id)}
                              onDuplicate={() => handleDuplicateView(view)}
                              onDelete={() => handleDeleteView(view.id)}
                              actionMenuRef={viewActionMenuRef}
                            />
                          ))}
                        </>
                      )}

                      {!viewsLoading && pinnedViews.length === 0 && unpinnedViews.length === 0 && (
                        <p className="px-3 py-2 text-xs text-gray-400">No saved views</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Group: Filter, Sort, Columns, Save */}
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <button
            onClick={() => {
              setShowFilterPanel(!showFilterPanel)
              setShowSortDropdown(false)
              setShowColumnSettings(false)
              setShowSaveForm(false)
            }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors",
              showFilterPanel || filterCount > 0
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {filterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                {filterCount}
              </span>
            )}
          </button>

          {/* Sort Button */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              onClick={() => {
                setShowSortDropdown(!showSortDropdown)
                setShowFilterPanel(false)
                setShowColumnSettings(false)
                setShowSaveForm(false)
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors",
                showSortDropdown || sortCount > 0
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort
              {sortCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                  {sortCount}
                </span>
              )}
            </button>

            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-1 z-50">
                <SortControls
                  orderBy={orderBy}
                  onSortChange={handleSortChange}
                  entityType={entityType}
                />
              </div>
            )}
          </div>

          {/* Column Settings Button */}
          <div className="relative" ref={columnSettingsRef}>
            <button
              onClick={() => {
                setShowColumnSettings(!showColumnSettings)
                setShowFilterPanel(false)
                setShowSortDropdown(false)
                setShowSaveForm(false)
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors",
                showColumnSettings
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              <Columns3 className="w-3.5 h-3.5" />
              Columns
            </button>

            {showColumnSettings && (
              <div className="absolute top-full right-0 mt-1 z-50">
                <ColumnSettings
                  columns={columns}
                  onColumnsChange={handleColumnsChange}
                  entityType={entityType}
                />
              </div>
            )}
          </div>

          {/* Save View Button */}
          <div className="relative" ref={saveFormRef}>
            <button
              onClick={() => {
                setShowSaveForm(!showSaveForm)
                setShowFilterPanel(false)
                setShowSortDropdown(false)
                setShowColumnSettings(false)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save View
            </button>

            {showSaveForm && (
              <div className="absolute top-full right-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <form onSubmit={handleSaveView} className="p-3">
                  <label
                    htmlFor="view-label"
                    className="block text-xs font-medium text-gray-600 mb-1.5"
                  >
                    View Name
                  </label>
                  <input
                    id="view-label"
                    type="text"
                    value={saveLabel}
                    onChange={(e) => setSaveLabel(e.target.value)}
                    placeholder="e.g. My Active Leads"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  {createView.isError && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {createView.error instanceof Error
                        ? createView.error.message
                        : "Failed to save view"}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSaveForm(false)
                        setSaveLabel("")
                      }}
                      className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!saveLabel.trim() || createView.isPending}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors",
                        !saveLabel.trim() || createView.isPending
                          ? "bg-blue-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {createView.isPending && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      Save
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel (below toolbar) */}
      {showFilterPanel && (
        <div className="mt-2">
          <FilterBuilder
            filters={filterConditions}
            onFiltersChange={handleFiltersChange}
            entityType={entityType}
          />
        </div>
      )}
    </div>
  )
}

// --- ViewListItem sub-component ---

interface ViewListItemProps {
  view: ViewSettings
  isActive: boolean
  actionMenuOpen: boolean
  onSelect: () => void
  onToggleActions: () => void
  onSetDefault: () => void
  onPin: () => void
  onTogglePublic: () => void
  onDuplicate: () => void
  onDelete: () => void
  actionMenuRef: React.RefObject<HTMLDivElement>
}

function ViewListItem({
  view,
  isActive,
  actionMenuOpen,
  onSelect,
  onToggleActions,
  onSetDefault,
  onPin,
  onTogglePublic,
  onDuplicate,
  onDelete,
  actionMenuRef,
}: ViewListItemProps) {
  const typeIcon =
    view.type === "kanban" ? Kanban : view.type === "group_by" ? LayoutGrid : List

  const TypeIcon = typeIcon

  return (
    <div className="relative group">
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
          isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
        )}
      >
        <button onClick={onSelect} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <TypeIcon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">{view.label}</span>
          {view.is_default && (
            <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          )}
          {view.pinned && (
            <Pin className="w-3 h-3 text-gray-400 flex-shrink-0" />
          )}
          {view.public && (
            <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" />
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleActions()
          }}
          className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
        >
          <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Actions Menu */}
      {actionMenuOpen && (
        <div
          ref={actionMenuRef}
          className="absolute right-0 top-full mt-0.5 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[60]"
        >
          <div className="py-1">
            {!view.is_standard && (
              <button
                onClick={onSetDefault}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
              >
                <Star className="w-3.5 h-3.5" />
                {view.is_default ? "Unset Default" : "Set as Default"}
              </button>
            )}
            <button
              onClick={onPin}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
            >
              {view.pinned ? (
                <>
                  <PinOff className="w-3.5 h-3.5" />
                  Unpin
                </>
              ) : (
                <>
                  <Pin className="w-3.5 h-3.5" />
                  Pin
                </>
              )}
            </button>
            <button
              onClick={onTogglePublic}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
            >
              {view.public ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Make Private
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  Make Public
                </>
              )}
            </button>
            <button
              onClick={onDuplicate}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicate
            </button>
            {!view.is_standard && (
              <>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={onDelete}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
