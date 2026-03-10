"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Filter,
  Clock,
  Loader2,
  CheckCircle2,
  Flag,
  Archive,
  Eye,
  BarChart3,
  Star,
  Share2,
  Shield,
  Bell,
  Plug,
  User,
  MoreHorizontal,
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
  isActive?: boolean
  children?: MenuItemT[]
}

interface MenuSectionT {
  title: string
  items: MenuItemT[]
}

interface SidebarContent {
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

/* ========================= Detail Content Map ========================= */

function getSidebarContent(activeSection: string): SidebarContent {
  const contentMap: Record<string, SidebarContent> = {
    dashboard: {
      title: "Dashboard",
      sections: [
        {
          title: "Overview",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "Overview", href: "/dashboard", isActive: true },
            {
              icon: <BarChart3 className="h-4 w-4" />,
              label: "Sales Pipeline",
              hasDropdown: true,
              children: [
                { label: "Revenue Overview" },
                { label: "Conversion Rates" },
                { label: "Win/Loss Analysis" },
              ],
            },
            {
              icon: <Star className="h-4 w-4" />,
              label: "Performance",
              hasDropdown: true,
              children: [
                { label: "Team Activity" },
                { label: "Lead Response Time" },
                { label: "Deal Velocity" },
              ],
            },
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
            { icon: <Plus className="h-4 w-4" />, label: "New Lead", href: "/leads?action=new" },
            { icon: <Filter className="h-4 w-4" />, label: "Filter Leads" },
          ],
        },
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Leads", href: "/leads", isActive: true },
            {
              icon: <Clock className="h-4 w-4" />,
              label: "Recent",
              hasDropdown: true,
              children: [
                { label: "Added Today" },
                { label: "Added This Week" },
                { label: "Updated Recently" },
              ],
            },
            {
              icon: <Flag className="h-4 w-4" />,
              label: "By Status",
              hasDropdown: true,
              children: [
                { label: "New" },
                { label: "Contacted" },
                { label: "Qualified" },
                { label: "Unqualified" },
              ],
            },
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
            { icon: <Plus className="h-4 w-4" />, label: "New Deal", href: "/deals?action=new" },
            { icon: <Filter className="h-4 w-4" />, label: "Filter Deals" },
          ],
        },
        {
          title: "Pipeline",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Deals", href: "/deals", isActive: true },
            {
              icon: <Loader2 className="h-4 w-4" />,
              label: "In Progress",
              hasDropdown: true,
              children: [
                { label: "Qualification" },
                { label: "Proposal" },
                { label: "Negotiation" },
              ],
            },
            {
              icon: <CheckCircle2 className="h-4 w-4" />,
              label: "Won",
            },
            { icon: <Archive className="h-4 w-4" />, label: "Lost / Archived" },
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
            { icon: <Plus className="h-4 w-4" />, label: "New Contact", href: "/contacts?action=new" },
            { icon: <Filter className="h-4 w-4" />, label: "Filter Contacts" },
          ],
        },
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Contacts", href: "/contacts", isActive: true },
            {
              icon: <Star className="h-4 w-4" />,
              label: "Favorites",
            },
            {
              icon: <Clock className="h-4 w-4" />,
              label: "Recently Added",
            },
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
            { icon: <Plus className="h-4 w-4" />, label: "New Organization", href: "/organizations?action=new" },
            { icon: <Filter className="h-4 w-4" />, label: "Filter" },
          ],
        },
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Organizations", href: "/organizations", isActive: true },
            { icon: <Building2 className="h-4 w-4" />, label: "By Industry", hasDropdown: true, children: [] },
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
            { icon: <Plus className="h-4 w-4" />, label: "New Task", href: "/tasks?action=new" },
            { icon: <Filter className="h-4 w-4" />, label: "Filter Tasks" },
          ],
        },
        {
          title: "My Tasks",
          items: [
            {
              icon: <Clock className="h-4 w-4" />,
              label: "Due Today",
              hasDropdown: true,
              children: [
                { label: "Overdue" },
                { label: "Due This Week" },
              ],
            },
            {
              icon: <Loader2 className="h-4 w-4" />,
              label: "In Progress",
            },
            {
              icon: <CheckCircle2 className="h-4 w-4" />,
              label: "Completed",
            },
          ],
        },
        {
          title: "Other",
          items: [
            { icon: <Flag className="h-4 w-4" />, label: "Priority" },
            { icon: <Archive className="h-4 w-4" />, label: "Archived" },
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
            { icon: <Plus className="h-4 w-4" />, label: "New Note", href: "/notes?action=new" },
          ],
        },
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "All Notes", href: "/notes", isActive: true },
            { icon: <Star className="h-4 w-4" />, label: "Starred" },
            { icon: <Clock className="h-4 w-4" />, label: "Recent" },
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
            { icon: <Eye className="h-4 w-4" />, label: "All Chats", href: "/whatsapp", isActive: true },
            { icon: <Clock className="h-4 w-4" />, label: "Unread" },
            { icon: <Star className="h-4 w-4" />, label: "Starred" },
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
            { icon: <Mail className="h-4 w-4" />, label: "Inbox", href: "/email", isActive: true },
            { icon: <Share2 className="h-4 w-4" />, label: "Sent" },
            { icon: <Archive className="h-4 w-4" />, label: "Archived" },
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
            { icon: <Eye className="h-4 w-4" />, label: "All Calls", href: "/call-logs", isActive: true },
            { icon: <Clock className="h-4 w-4" />, label: "Recent" },
            { icon: <Phone className="h-4 w-4" />, label: "Missed" },
          ],
        },
      ],
    },
    calendar: {
      title: "Calendar",
      sections: [
        {
          title: "Views",
          items: [
            { icon: <Eye className="h-4 w-4" />, label: "Month View", href: "/calendar" },
            { icon: <Calendar className="h-4 w-4" />, label: "Week View" },
            { icon: <Clock className="h-4 w-4" />, label: "Day View" },
          ],
        },
        {
          title: "Quick Actions",
          items: [
            { icon: <Plus className="h-4 w-4" />, label: "New Event" },
            { icon: <Share2 className="h-4 w-4" />, label: "Share Calendar" },
          ],
        },
      ],
    },
    settings: {
      title: "Settings",
      sections: [
        {
          title: "Account",
          items: [
            { icon: <User className="h-4 w-4" />, label: "Profile", href: "/settings/general" },
            { icon: <Shield className="h-4 w-4" />, label: "Security" },
            { icon: <Bell className="h-4 w-4" />, label: "Notifications" },
          ],
        },
        {
          title: "Workspace",
          items: [
            {
              icon: <Settings className="h-4 w-4" />,
              label: "Preferences",
              href: "/settings/general",
              hasDropdown: true,
              children: [
                { label: "Theme" },
                { label: "Language" },
              ],
            },
            { icon: <Plug className="h-4 w-4" />, label: "Integrations", href: "/settings/integrations/email" },
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
        "flex items-center justify-center rounded-lg size-10 min-w-10 transition-colors duration-200",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
  return (
    <aside className="bg-background flex flex-col gap-1 items-center py-4 px-2 w-[60px] min-w-[60px] border-r border-border">
      {/* Logo */}
      <div className="mb-3 flex items-center justify-center">
        <Link href="/dashboard" className="text-lg font-bold text-primary">
          P
        </Link>
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-1 w-full items-center flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <IconNavButton
            key={item.id}
            isActive={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
            label={item.label}
          >
            {item.icon}
          </IconNavButton>
        ))}
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-1 w-full items-center mt-2">
        <IconNavButton
          isActive={activeSection === "settings"}
          onClick={() => onSectionChange("settings")}
          label="Settings"
        >
          <Settings className="h-5 w-5" />
        </IconNavButton>
      </div>
    </aside>
  )
}

/* ========================= Search ========================= */

function SearchInput({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [searchValue, setSearchValue] = useState("")

  if (isCollapsed) {
    return (
      <div className="w-full flex justify-center">
        <button
          type="button"
          className="flex items-center justify-center rounded-lg size-10 min-w-10 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-full px-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
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
  onItemClick,
  isCollapsed,
}: {
  item: MenuItemT
  isExpanded?: boolean
  onToggle?: () => void
  onItemClick?: () => void
  isCollapsed?: boolean
}) {
  const handleClick = () => {
    if (item.hasDropdown && onToggle) onToggle()
    else onItemClick?.()
  }

  const content = (
    <div
      className={cn(
        "rounded-lg cursor-pointer transition-colors duration-200 flex items-center",
        item.isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        isCollapsed
          ? "size-10 min-w-10 justify-center"
          : "w-full h-9 px-3 py-1.5 gap-3"
      )}
      onClick={handleClick}
      title={isCollapsed ? item.label : undefined}
    >
      <div className="flex items-center justify-center shrink-0">
        {item.icon}
      </div>

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
  )

  if (item.href && !item.hasDropdown) {
    return (
      <div className={cn("shrink-0", isCollapsed ? "w-full flex justify-center" : "w-full px-2")}>
        <Link href={item.href}>{content}</Link>
      </div>
    )
  }

  return (
    <div className={cn("shrink-0", isCollapsed ? "w-full flex justify-center" : "w-full px-2")}>
      {content}
    </div>
  )
}

function SubMenuItem({ item }: { item: MenuItemT }) {
  const content = (
    <div className="h-8 w-full rounded-lg cursor-pointer transition-colors hover:bg-accent flex items-center px-3">
      <span className="text-sm text-muted-foreground truncate">
        {item.label}
      </span>
    </div>
  )

  if (item.href) {
    return (
      <div className="w-full pl-10 pr-2">
        <Link href={item.href}>{content}</Link>
      </div>
    )
  }

  return <div className="w-full pl-10 pr-2">{content}</div>
}

function MenuSection({
  section,
  expandedItems,
  onToggleExpanded,
  isCollapsed,
}: {
  section: MenuSectionT
  expandedItems: Set<string>
  onToggleExpanded: (itemKey: string) => void
  isCollapsed?: boolean
}) {
  return (
    <div className="flex flex-col w-full gap-0.5">
      {!isCollapsed && (
        <div className="px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
              onItemClick={() => {}}
              isCollapsed={isCollapsed}
            />
            {isExpanded && item.children && !isCollapsed && (
              <div className="flex flex-col gap-0.5 my-1">
                {item.children.map((child, childIndex) => (
                  <SubMenuItem
                    key={`${itemKey}-${childIndex}`}
                    item={child}
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
  const { user } = useAuthStore()
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
    <aside
      className={cn(
        "bg-background flex flex-col border-r border-border transition-all duration-300 h-full",
        isCollapsed ? "w-[60px] min-w-[60px]" : "w-64 min-w-64"
      )}
      style={{ transitionTimingFunction: softSpring }}
    >
      {/* Header with title and collapse toggle */}
      <div className={cn(
        "flex items-center h-14 border-b border-border shrink-0",
        isCollapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="flex items-center justify-center rounded-lg size-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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
              className="flex items-center justify-center rounded-lg size-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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
          />
        ))}
      </div>

      {/* User footer */}
      {!isCollapsed && (
        <div className="shrink-0 border-t border-border px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
              {user?.first_name?.[0] || <User className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.first_name} {user?.last_name}
              </p>
            </div>
            <button
              type="button"
              className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors shrink-0"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

/* ========================= Combined Sidebar ========================= */

function TwoLevelSidebarContent() {
  const pathname = usePathname()
  const { data: integrationStatus } = useIntegrationStatus()
  const navItems = getNavItems(integrationStatus)

  // Determine active section from pathname
  const getActiveSection = (): string => {
    for (const item of navItems) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.id
      }
    }
    if (pathname.startsWith("/settings")) return "settings"
    return "dashboard"
  }

  const [activeSection, setActiveSection] = useState(getActiveSection)

  // Update active section when pathname changes
  React.useEffect(() => {
    setActiveSection(getActiveSection())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full">
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
      {/* Desktop sidebar - always visible on md+ */}
      <div className="hidden md:flex h-full">
        <TwoLevelSidebarContent />
      </div>

      {/* Mobile drawer using Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={(open) => !open && onClose?.()}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <TwoLevelSidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
