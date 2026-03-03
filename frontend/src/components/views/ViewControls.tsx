"use client"

import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveLabel, setSaveLabel] = useState("")
  const [showViewsPopover, setShowViewsPopover] = useState(false)
  const [showSortPopover, setShowSortPopover] = useState(false)
  const [showColumnPopover, setShowColumnPopover] = useState(false)

  function handleViewTypeChange(type: "list" | "kanban" | "group_by") {
    setViewType(type)
    onViewTypeChange?.(type)
  }

  function handleSelectView(view: ViewSettings) {
    setActiveView(view)
    onFiltersChange?.(view.filters || {})
    onSortChange?.(view.order_by || {})
    onViewTypeChange?.(view.type)
    if (view.column_field) onColumnFieldChange?.(view.column_field)
    if (view.group_by_field) onGroupByFieldChange?.(view.group_by_field)
    setShowViewsPopover(false)
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
    } catch {
      // Error handled by mutation state
    }
  }

  async function handleSetDefault(id: number) {
    try {
      await setDefaultView.mutateAsync(id)
    } catch {
      // Error handled by mutation state
    }
  }

  async function handlePinView(id: number) {
    try {
      await pinView.mutateAsync(id)
    } catch {
      // Error handled by mutation state
    }
  }

  async function handleTogglePublic(id: number) {
    try {
      await togglePublicView.mutateAsync(id)
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
      <Card className="flex items-center justify-between gap-4 px-4 py-2 rounded-lg">
        {/* Left Group: View Type Tabs + Active View Name */}
        <div className="flex items-center gap-3">
          {/* View Type Tabs */}
          <Tabs value={viewType} onValueChange={(val) => handleViewTypeChange(val as "list" | "kanban" | "group_by")}>
            <TabsList className="h-8">
              {VIEW_TYPE_TABS.map((tab) => (
                <TabsTrigger key={tab.type} value={tab.type} className="gap-1.5 text-xs px-3 py-1">
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* View Name Dropdown */}
          <Popover open={showViewsPopover} onOpenChange={setShowViewsPopover}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-sm font-medium">
                {activeView?.label || "All " + entityType + "s"}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="start">
              {viewsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Default "All" view */}
                  <Button
                    variant={!activeView ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 text-sm h-9",
                      !activeView && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => {
                      setActiveView(null)
                      onFiltersChange?.({})
                      onSortChange?.({ created_at: "desc" })
                      setShowViewsPopover(false)
                    }}
                  >
                    <List className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate text-left">All {entityType}s</span>
                  </Button>

                  {/* Pinned Views */}
                  {pinnedViews.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 mt-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Pinned
                        </span>
                      </div>
                      {pinnedViews.map((view) => (
                        <ViewListItem
                          key={view.id}
                          view={view}
                          isActive={activeView?.id === view.id}
                          onSelect={() => handleSelectView(view)}
                          onSetDefault={() => handleSetDefault(view.id)}
                          onPin={() => handlePinView(view.id)}
                          onTogglePublic={() => handleTogglePublic(view.id)}
                          onDuplicate={() => handleDuplicateView(view)}
                          onDelete={() => handleDeleteView(view.id)}
                        />
                      ))}
                    </>
                  )}

                  {/* Other Views */}
                  {unpinnedViews.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 mt-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Views
                        </span>
                      </div>
                      {unpinnedViews.map((view) => (
                        <ViewListItem
                          key={view.id}
                          view={view}
                          isActive={activeView?.id === view.id}
                          onSelect={() => handleSelectView(view)}
                          onSetDefault={() => handleSetDefault(view.id)}
                          onPin={() => handlePinView(view.id)}
                          onTogglePublic={() => handleTogglePublic(view.id)}
                          onDuplicate={() => handleDuplicateView(view)}
                          onDelete={() => handleDeleteView(view.id)}
                        />
                      ))}
                    </>
                  )}

                  {!viewsLoading && pinnedViews.length === 0 && unpinnedViews.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No saved views</p>
                  )}
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Right Group: Filter, Sort, Columns, Save */}
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <Button
            variant={showFilterPanel || filterCount > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={cn(
              "gap-1.5 text-sm",
              showFilterPanel || filterCount > 0
                ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-700"
                : ""
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {filterCount > 0 && (
              <Badge className="w-5 h-5 rounded-full p-0 justify-center text-[10px] font-bold">
                {filterCount}
              </Badge>
            )}
          </Button>

          {/* Sort Button */}
          <Popover open={showSortPopover} onOpenChange={setShowSortPopover}>
            <PopoverTrigger asChild>
              <Button
                variant={showSortPopover || sortCount > 0 ? "default" : "outline"}
                size="sm"
                className={cn(
                  "gap-1.5 text-sm",
                  showSortPopover || sortCount > 0
                    ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-700"
                    : ""
                )}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort
                {sortCount > 0 && (
                  <Badge className="w-5 h-5 rounded-full p-0 justify-center text-[10px] font-bold">
                    {sortCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0 shadow-none" align="end">
              <SortControls
                orderBy={orderBy}
                onSortChange={handleSortChange}
                entityType={entityType}
              />
            </PopoverContent>
          </Popover>

          {/* Column Settings Button */}
          <Popover open={showColumnPopover} onOpenChange={setShowColumnPopover}>
            <PopoverTrigger asChild>
              <Button
                variant={showColumnPopover ? "default" : "outline"}
                size="sm"
                className={cn(
                  "gap-1.5 text-sm",
                  showColumnPopover
                    ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-700"
                    : ""
                )}
              >
                <Columns3 className="w-3.5 h-3.5" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0 shadow-none" align="end">
              <ColumnSettings
                columns={columns}
                onColumnsChange={handleColumnsChange}
                entityType={entityType}
              />
            </PopoverContent>
          </Popover>

          {/* Save View Button */}
          <Popover open={showSaveForm} onOpenChange={setShowSaveForm}>
            <PopoverTrigger asChild>
              <Button size="sm" className="gap-1.5 text-sm">
                <Save className="w-3.5 h-3.5" />
                Save View
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <form onSubmit={handleSaveView}>
                <Label
                  htmlFor="view-label"
                  className="text-xs text-muted-foreground mb-1.5 block"
                >
                  View Name
                </Label>
                <Input
                  id="view-label"
                  type="text"
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  placeholder="e.g. My Active Leads"
                  className="h-9 text-sm"
                  autoFocus
                />
                {createView.isError && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {createView.error instanceof Error
                      ? createView.error.message
                      : "Failed to save view"}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSaveForm(false)
                      setSaveLabel("")
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!saveLabel.trim() || createView.isPending}
                    className="flex-1 gap-1.5"
                  >
                    {createView.isPending && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    Save
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>
        </div>
      </Card>

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
  onSelect: () => void
  onSetDefault: () => void
  onPin: () => void
  onTogglePublic: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function ViewListItem({
  view,
  isActive,
  onSelect,
  onSetDefault,
  onPin,
  onTogglePublic,
  onDuplicate,
  onDelete,
}: ViewListItemProps) {
  const typeIcon =
    view.type === "kanban" ? Kanban : view.type === "group_by" ? LayoutGrid : List

  const TypeIcon = typeIcon

  return (
    <div className="relative group">
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
          isActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"
        )}
      >
        <button onClick={onSelect} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <TypeIcon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">{view.label}</span>
          {view.is_default && (
            <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          )}
          {view.pinned && (
            <Pin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
          {view.public && (
            <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {!view.is_standard && (
              <DropdownMenuItem onClick={onSetDefault}>
                <Star className="w-3.5 h-3.5" />
                {view.is_default ? "Unset Default" : "Set as Default"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onPin}>
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
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onTogglePublic}>
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
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="w-3.5 h-3.5" />
              Duplicate
            </DropdownMenuItem>
            {!view.is_standard && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
