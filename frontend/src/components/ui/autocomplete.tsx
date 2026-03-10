"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"

export interface AutocompleteOption {
  value: string
  label: string
  disabled?: boolean
}

interface AutocompleteProps {
  options: AutocompleteOption[]
  value?: string
  onValueChange?: (value: string) => void
  onSearchChange?: (search: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  loading?: boolean
  disabled?: boolean
  className?: string
}

const Autocomplete = React.forwardRef<HTMLDivElement, AutocompleteProps>(
  (
    {
      options,
      value,
      onValueChange,
      onSearchChange,
      placeholder = "Select an option...",
      searchPlaceholder = "Search...",
      emptyMessage = "No results found.",
      loading = false,
      disabled = false,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLDivElement>(null)

    const selectedOption = options.find((opt) => opt.value === value)

    const filtered = React.useMemo(() => {
      if (!search) return options
      const lower = search.toLowerCase()
      return options.filter((opt) => opt.label.toLowerCase().includes(lower))
    }, [options, search])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setSearch(val)
      setHighlightedIndex(-1)
      onSearchChange?.(val)
      if (!open) setOpen(true)
    }

    const handleSelect = (optionValue: string) => {
      onValueChange?.(optionValue === value ? "" : optionValue)
      setSearch("")
      setOpen(false)
      inputRef.current?.blur()
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      onValueChange?.("")
      setSearch("")
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault()
          setOpen(true)
        }
        return
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setHighlightedIndex((prev) => {
            const next = prev + 1
            return next >= filtered.length ? 0 : next
          })
          break
        case "ArrowUp":
          e.preventDefault()
          setHighlightedIndex((prev) => {
            const next = prev - 1
            return next < 0 ? filtered.length - 1 : next
          })
          break
        case "Enter":
          e.preventDefault()
          if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
            handleSelect(filtered[highlightedIndex].value)
          }
          break
        case "Escape":
          e.preventDefault()
          setOpen(false)
          setSearch("")
          inputRef.current?.blur()
          break
      }
    }

    // Scroll highlighted item into view
    React.useEffect(() => {
      if (highlightedIndex >= 0 && listRef.current) {
        const items = listRef.current.querySelectorAll("[data-autocomplete-item]")
        items[highlightedIndex]?.scrollIntoView({ block: "nearest" })
      }
    }, [highlightedIndex])

    // Close on outside click
    React.useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false)
          setSearch("")
        }
      }
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    return (
      <div ref={containerRef} className={cn("relative", className)}>
        {/* Trigger / Input */}
        <div
          ref={ref}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={() => {
            if (!disabled) {
              setOpen(true)
              inputRef.current?.focus()
            }
          }}
        >
          {open ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setOpen(true)}
                placeholder={searchPlaceholder}
                disabled={disabled}
                className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                autoComplete="off"
              />
            </div>
          ) : (
            <span
              className={cn(
                "flex-1 truncate text-left",
                !selectedOption && "text-muted-foreground"
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          )}

          <div className="flex items-center gap-1 shrink-0 ml-1">
            {value && !open && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-sm p-0.5 hover:bg-accent hover:text-accent-foreground"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5 opacity-50" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </div>

        {/* Dropdown */}
        {open && (
          <div
            className={cn(
              "absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
              "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
            )}
          >
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto p-1"
              role="listbox"
            >
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                filtered.map((option, index) => (
                  <div
                    key={option.value}
                    data-autocomplete-item
                    role="option"
                    aria-selected={option.value === value}
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
                      option.value === value && "font-medium",
                      index === highlightedIndex &&
                        "bg-accent text-accent-foreground",
                      option.disabled &&
                        "pointer-events-none opacity-50"
                    )}
                    onClick={() => {
                      if (!option.disabled) handleSelect(option.value)
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.value === value && (
                      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)
Autocomplete.displayName = "Autocomplete"

export { Autocomplete }
