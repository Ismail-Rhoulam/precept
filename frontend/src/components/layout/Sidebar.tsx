"use client"

import React, { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Handshake,
  Contact,
  Building2,
  CheckSquare,
  StickyNote,
  Mail,
  Phone,
  Calendar,
  Settings,
  Search,
  ChevronDown,
  ChevronLeft,
  Plus,
  Eye,
  BarChart3,
  Layers,
  Columns3,
  Sliders,
  Package,
  Shield,
  Code2,
  LayoutTemplate,
  Plug,
  User,
  MoreHorizontal,
  LogOut,
} from "lucide-react"
import type { LucideProps } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIntegrationStatus } from "@/hooks/useIntegrations"
import { useAuthStore } from "@/stores/authStore"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function WhatsAppIcon(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
    >
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
    </svg>
  )
}

/* ========================= Types ========================= */

interface MenuItemT {
  icon?: React.ReactNode
  label: string
  href?: string
  hasDropdown?: boolean
  children?: MenuItemT[]
}

interface MenuSectionT {
  title: string
  items: MenuItemT[]
}

interface SidebarContentData {
  title: string
  sections: MenuSectionT[]
}

/* ========================= Navigation Config ========================= */

type NavItem = {
  id: string
  icon: React.ReactNode
  label: string
  href: string
}

function getNavItems(integrationStatus: { whatsapp_enabled?: boolean; email_enabled?: boolean } | undefined): NavItem[] {
  const items: NavItem[] = [
    { id: "dashboard", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", href: "/dashboard" },
    { id: "leads", icon: <Users className="h-5 w-5" />, label: "Leads", href: "/leads" },
    { id: "deals", icon: <Handshake className="h-5 w-5" />, label: "Deals", href: "/deals" },
    { id: "contacts", icon: <Contact className="h-5 w-5" />, label: "Contacts", href: "/contacts" },
    { id: "organizations", icon: <Building2 className="h-5 w-5" />, label: "Organizations", href: "/organizations" },
    { id: "tasks", icon: <CheckSquare className="h-5 w-5" />, label: "Tasks", href: "/tasks" },
    { id: "notes", icon: <StickyNote className="h-5 w-5" />, label: "Notes", href: "/notes" },
  ]

  if (integrationStatus?.whatsapp_enabled) {
    items.push({ id: "whatsapp", icon: <WhatsAppIcon className="h-5 w-5" />, label: "WhatsApp", href: "/whatsapp" })
  }

  if (integrationStatus?.email_enabled) {
    items.push({ id: "email", icon: <Mail className="h-5 w-5" />, label: "Email", href: "/email" })
  }

  items.push(
    { id: "call-logs", icon: <Phone className="h-5 w-5" />, label: "Call Logs", href: "/call-logs" },
    { id: "calendar", icon: <Calendar className="h-5 w-5" />, label: "Calendar", href: "/calendar" },
  )

  return items
}

/* ========================= Hash Navigation Helper ========================= */

/**
 * Navigate to a URL that may contain a hash fragment (e.g. /leads#new).
 * Next.js <Link> doesn't trigger hashchange when already on the same page,
 * so we handle it manually.
 */
function useHashNavigate() {
  const router = useRouter()
  const pathname = usePathname()

  return useCallback((href: string) => {
    const hashIndex = href.indexOf("#")
    if (hashIndex === -1) {
      // No hash — normal navigation
      router.push(href)
      return
    }

    const targetPath = href.slice(0, hashIndex)
    const hash = href.slice(hashIndex + 1)

    if (pathname === targetPath) {
      // Already on this page — set hash and fire event manually
      window.location.hash = hash
      window.dispatchEvent(new HashChangeEvent("hashchange"))
      // Clean up hash from URL after a tick
      setTimeout(() => {
        window.history.replaceState(null, "", pathname)
      }, 100)
    } else {
      // Different page — navigate, the page's useEffect will pick up the hash
      router.push(href)
    }
  }, [router, pathname])
}

/* ========================= Detail Content Map ========================= */

function getSidebarContent(activeSection: string): SidebarContentData {
  const contentMap: Record<string, SidebarContentData> = {
    dashboard: {
      title: "Dashboard",
      sections: [
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "Overview", href: "/dashboard" },
          ],
        },
      ],
    },
    leads: {
      title: "Leads",
      sections: [
        {
          title: "Quick Actions",
          items: [
            { icon: <Plus className="h-4 w-4" />, label: "New Lead", href: "/leads#new" },
          ],
        },
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Leads", href: "/leads" },
            { icon: <Columns3 className="h-4 w-4" />, label: "Kanban", href: "/leads#kanban" },
            { icon: <Layers className="h-4 w-4" />, label: "Group By", href: "/leads#group_by" },
          ],
        },
      ],
    },
    deals: {
      title: "Deals",
      sections: [
        {
          title: "Quick Actions",
          items: [
            { icon: <Plus className="h-4 w-4" />, label: "New Deal", href: "/deals#new" },
          ],
        },
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Deals", href: "/deals" },
            { icon: <Columns3 className="h-4 w-4" />, label: "Kanban", href: "/deals#kanban" },
            { icon: <Layers className="h-4 w-4" />, label: "Group By", href: "/deals#group_by" },
          ],
        },
      ],
    },
    contacts: {
      title: "Contacts",
      sections: [
        {
          title: "Quick Actions",
          items: [
            { icon: <Plus className="h-4 w-4" />, label: "New Contact", href: "/contacts#new" },
          ],
        },
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Contacts", href: "/contacts" },
          ],
        },
      ],
    },
    organizations: {
      title: "Organizations",
      sections: [
        {
          title: "Quick Actions",
          items: [
            { icon: <Plus className="h-4 w-4" />, label: "New Organization", href: "/organizations#new" },
          ],
        },
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Organizations", href: "/organizations" },
          ],
        },
      ],
    },
    tasks: {
      title: "Tasks",
      sections: [
        {
          title: "Quick Actions",
          items: [
            { icon: <Plus className="h-4 w-4" />, label: "New Task", href: "/tasks#new" },
          ],
        },
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Tasks", href: "/tasks" },
          ],
        },
      ],
    },
    notes: {
      title: "Notes",
      sections: [
        {
          title: "Quick Actions",
          items: [
            { icon: <Plus className="h-4 w-4" />, label: "New Note", href: "/notes#new" },
          ],
        },
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Notes", href: "/notes" },
          ],
        },
      ],
    },
    whatsapp: {
      title: "WhatsApp",
      sections: [
        {
          title: "Conversations",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Chats", href: "/whatsapp" },
          ],
        },
      ],
    },
    email: {
      title: "Email",
      sections: [
        {
          title: "Mailbox",
          items: [
            { icon: <Mail className="h-4 w-4" />, label: "Inbox", href: "/email" },
          ],
        },
        {
          title: "Campaigns",
          items: [
            { icon: <BarChart3 className="h-4 w-4" />, label: "Templates", href: "/email/templates" },
            { icon: <Users className="h-4 w-4" />, label: "Campaigns", href: "/email/campaigns" },
            { icon: <Plus className="h-4 w-4" />, label: "New Campaign", href: "/email/campaigns/new" },
          ],
        },
      ],
    },
    "call-logs": {
      title: "Call Logs",
      sections: [
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Calls", href: "/call-logs" },
          ],
        },
      ],
    },
    calendar: {
      title: "Calendar",
      sections: [
        {
          title: "Quick Actions",
          items: [
            { icon: <Plus className="h-4 w-4" />, label: "New Event", href: "/calendar#new" },
          ],
        },
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "Calendar", href: "/calendar" },
          ],
        },
      ],
    },
    settings: {
      title: "Settings",
      sections: [
        {
          title: "General",
          items: [
            { icon: <Sliders className="h-4 w-4" />, label: "General", href: "/settings/general" },
            { icon: <Package className="h-4 w-4" />, label: "Products", href: "/settings/products" },
            { icon: <Shield className="h-4 w-4" />, label: "SLA", href: "/settings/sla" },
          ],
        },
        {
          title: "Customization",
          items: [
            { icon: <Code2 className="h-4 w-4" />, label: "Form Scripts", href: "/settings/form-scripts" },
            { icon: <LayoutTemplate className="h-4 w-4" />, label: "Fields Layout", href: "/settings/fields-layout" },
          ],
        },
        {
          title: "Integrations",
          items: [
            { icon: <Plug className="h-4 w-4" />, label: "All Integrations", href: "/settings/integrations" },
            {
              icon: <Plug className="h-4 w-4" />,
              label: "By Service",
              hasDropdown: true,
              children: [
                { label: "Email", href: "/settings/integrations/email" },
                { label: "WhatsApp", href: "/settings/integrations/whatsapp" },
                { label: "Twilio", href: "/settings/integrations/twilio" },
                { label: "Exotel", href: "/settings/integrations/exotel" },
                { label: "Facebook", href: "/settings/integrations/facebook" },
                { label: "Telephony", href: "/settings/integrations/telephony" },
              ],
            },
          ],
        },
      ],
    },
  }

  return contentMap[activeSection] || contentMap.dashboard
}

/* ========================= Easing ========================= */

const softSpring = "cubic-bezier(0.25, 1.1, 0.4, 1)"

/* ========================= Icon Nav Rail ========================= */

function IconNavButton({
  children,
  isActive = false,
  onClick,
  label,
}: {
  children: React.ReactNode
  isActive?: boolean
  onClick?: () => void
  label?: string
}) {
  const button = (
    <button
      type="button"
      className={cn(
        "relative flex items-center justify-center rounded-xl size-10 min-w-10 transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-95"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )

  if (label) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return button
}

function IconNavigation({
  activeSection,
  onSectionChange,
  navItems,
}: {
  activeSection: string
  onSectionChange: (section: string) => void
  navItems: NavItem[]
}) {
  const router = useRouter()

  const handleNavClick = (item: NavItem) => {
    onSectionChange(item.id)
    router.push(item.href)
  }

  return (
    <nav className="bg-sidebar-background flex flex-col gap-1 items-center py-4 px-2 w-[60px] min-w-[60px] shrink-0 border-r border-sidebar-border overflow-y-auto">
      {/* Logo */}
      <div className="mb-3 flex items-center justify-center shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center justify-center size-9 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          aria-label="Precept home"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 2h6.5a3.5 3.5 0 0 1 0 7H3V2Z" fill="currentColor" fillOpacity="0.9"/>
            <path d="M3 9h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="3" cy="13" r="1.5" fill="currentColor"/>
          </svg>
        </Link>
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-1 w-full items-center flex-1">
        {navItems.map((item) => (
          <IconNavButton
            key={item.id}
            isActive={activeSection === item.id}
            onClick={() => handleNavClick(item)}
            label={item.label}
          >
            {item.icon}
          </IconNavButton>
        ))}
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-1 w-full items-center mt-2 shrink-0">
        <IconNavButton
          isActive={activeSection === "settings"}
          onClick={() => {
            onSectionChange("settings")
            router.push("/settings")
          }}
          label="Settings"
        >
          <Settings className="h-5 w-5" />
        </IconNavButton>
      </div>
    </nav>
  )
}

/* ========================= Search ========================= */

function SearchInput({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [searchValue, setSearchValue] = useState("")

  if (isCollapsed) {
    return (
      <div className="w-full flex justify-center">
        <div className="flex items-center justify-center rounded-lg size-10 min-w-10 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full h-8 rounded-lg border border-sidebar-border bg-sidebar-accent/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring focus:bg-background transition-all"
        />
      </div>
    </div>
  )
}

/* ========================= Menu Items ========================= */

function MenuItem({
  item,
  isExpanded,
  onToggle,
  isCollapsed,
  pathname,
  navigate,
}: {
  item: MenuItemT
  isExpanded?: boolean
  onToggle?: () => void
  isCollapsed?: boolean
  pathname: string
  navigate: (href: string) => void
}) {
  // Items with a hash (e.g. /leads#new) are actions, not views — never mark them active
  const hasHash = item.href?.includes("#")
  const isActive = !hasHash && item.href ? pathname === item.href : false

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (item.hasDropdown && onToggle) {
      onToggle()
    } else if (item.href) {
      navigate(item.href)
    }
  }

  return (
    <div className={cn("shrink-0", isCollapsed ? "w-full flex justify-center" : "w-full px-2")}>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "rounded-lg cursor-pointer transition-all duration-150 flex items-center select-none",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground hover:shadow-xs",
          isCollapsed
            ? "size-10 min-w-10 justify-center"
            : "w-full h-9 px-3 py-1.5 gap-2.5"
        )}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === "Enter") handleClick(e as unknown as React.MouseEvent) }}
        title={isCollapsed ? item.label : undefined}
      >
        {item.icon && (
          <div className="flex items-center justify-center shrink-0">
            {item.icon}
          </div>
        )}

        {!isCollapsed && (
          <>
            <span className="flex-1 text-sm truncate">{item.label}</span>
            {item.hasDropdown && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SubMenuItem({ item, pathname, navigate }: { item: MenuItemT; pathname: string; navigate: (href: string) => void }) {
  const isActive = item.href ? pathname === item.href : false

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (item.href) navigate(item.href)
  }

  return (
    <div className="w-full pl-10 pr-2">
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "h-8 w-full rounded-lg cursor-pointer transition-all duration-150 flex items-center px-3 select-none",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-accent text-muted-foreground hover:text-foreground"
        )}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === "Enter") handleClick(e as unknown as React.MouseEvent) }}
      >
        <span className="text-sm truncate">
          {item.label}
        </span>
      </div>
    </div>
  )
}

function MenuSection({
  section,
  expandedItems,
  onToggleExpanded,
  isCollapsed,
  pathname,
  navigate,
}: {
  section: MenuSectionT
  expandedItems: Set<string>
  onToggleExpanded: (itemKey: string) => void
  isCollapsed?: boolean
  pathname: string
  navigate: (href: string) => void
}) {
  return (
    <div className="flex flex-col w-full gap-0.5">
      {!isCollapsed && (
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
            {section.title}
          </span>
        </div>
      )}

      {section.items.map((item, index) => {
        const itemKey = `${section.title}-${index}`
        const isExpanded = expandedItems.has(itemKey)
        return (
          <div key={itemKey} className="w-full flex flex-col">
            <MenuItem
              item={item}
              isExpanded={isExpanded}
              onToggle={() => onToggleExpanded(itemKey)}
              isCollapsed={isCollapsed}
              pathname={pathname}
              navigate={navigate}
            />
            {isExpanded && item.children && !isCollapsed && (
              <div className="flex flex-col gap-0.5 my-1">
                {item.children.map((child, childIndex) => (
                  <SubMenuItem
                    key={`${itemKey}-${childIndex}`}
                    item={child}
                    pathname={pathname}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ========================= Detail Sidebar ========================= */

function DetailSidebar({
  activeSection,
}: {
  activeSection: string
}) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const pathname = usePathname()
  const navigate = useHashNavigate()
  const content = getSidebarContent(activeSection)

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemKey)) next.delete(itemKey)
      else next.add(itemKey)
      return next
    })
  }

  return (
    <div
      className={cn(
        "bg-sidebar-background flex flex-col border-r border-sidebar-border transition-all duration-300 shrink-0 overflow-hidden",
        isCollapsed ? "w-[60px] min-w-[60px]" : "w-64 min-w-64"
      )}
      style={{ transitionTimingFunction: softSpring }}
    >
      {/* Header with title and collapse toggle */}
      <div className={cn(
        "flex items-center h-14 border-b border-sidebar-border shrink-0",
        isCollapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="flex items-center justify-center rounded-lg size-9 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </button>
        ) : (
          <>
            <h2 className="text-base font-semibold text-foreground truncate">
              {content.title}
            </h2>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="flex items-center justify-center rounded-lg size-8 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Search */}
      <div className="py-3 shrink-0">
        <SearchInput isCollapsed={isCollapsed} />
      </div>

      {/* Menu sections */}
      <div className={cn(
        "flex flex-col flex-1 overflow-y-auto pb-2",
        isCollapsed ? "gap-1 items-center" : "gap-3"
      )}>
        {content.sections.map((section, index) => (
          <MenuSection
            key={`${activeSection}-${index}`}
            section={section}
            expandedItems={expandedItems}
            onToggleExpanded={toggleExpanded}
            isCollapsed={isCollapsed}
            pathname={pathname}
            navigate={navigate}
          />
        ))}
      </div>

      {/* User footer */}
      {!isCollapsed && (
        <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
              {user?.first_name?.[0] || <User className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.first_name} {user?.last_name}
              </p>
              {user?.email && (
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors shrink-0"
                  aria-label="User menu"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/general">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  )
}

/* ========================= Combined Sidebar ========================= */

function TwoLevelSidebarContent() {
  const pathname = usePathname()
  const { data: integrationStatus } = useIntegrationStatus()
  const navItems = getNavItems(integrationStatus)

  const getActiveSection = useCallback((): string => {
    for (const item of navItems) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.id
      }
    }
    if (pathname.startsWith("/settings")) return "settings"
    return "dashboard"
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navItems.length])

  const [activeSection, setActiveSection] = useState(getActiveSection)

  React.useEffect(() => {
    setActiveSection(getActiveSection())
  }, [getActiveSection])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full w-full">
        <IconNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          navItems={navItems}
        />
        <DetailSidebar activeSection={activeSection} />
      </div>
    </TooltipProvider>
  )
}

/* ========================= Exported Sidebar ========================= */

interface SidebarProps {
  sidebarOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ sidebarOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-full shrink-0">
        <TwoLevelSidebarContent />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={sidebarOpen} onOpenChange={(open) => !open && onClose?.()}>
        <SheetContent side="left" className="w-[320px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="h-full">
            <TwoLevelSidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
