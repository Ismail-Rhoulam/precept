"use client"

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
} from "lucide-react"
import type { LucideProps } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useIntegrationStatus } from "@/hooks/useIntegrations"

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
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type NavigationItem = {
  name: string
  href: string
  icon: typeof LayoutDashboard | ((props: LucideProps) => React.ReactElement)
}

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Deals", href: "/deals", icon: Handshake },
  { name: "Contacts", href: "/contacts", icon: Contact },
  { name: "Organizations", href: "/organizations", icon: Building2 },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Notes", href: "/notes", icon: StickyNote },
  { name: "WhatsApp", href: "/whatsapp", icon: WhatsAppIcon },
  { name: "Email", href: "/email", icon: Mail },
  { name: "Call Logs", href: "/call-logs", icon: Phone },
  { name: "Calendar", href: "/calendar", icon: Calendar },
]

interface SidebarProps {
  sidebarOpen?: boolean
  onClose?: () => void
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: integrationStatus } = useIntegrationStatus()

  const visibleNavigation = navigation.filter((item) => {
    if (item.name === "WhatsApp") return integrationStatus?.whatsapp_enabled
    if (item.name === "Email") return integrationStatus?.email_enabled
    return true
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-16 px-6">
        <h1 className="text-xl font-bold text-primary">Precept</h1>
      </div>

      <Separator />

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          const icon = <Icon className="h-5 w-5 flex-shrink-0" />
          return (
            <Button
              key={item.name}
              variant={isActive ? "default" : "ghost"}
              className={cn("w-full justify-start gap-3")}
              asChild
            >
              <Link href={item.href} onClick={onClose}>
                {icon}
                {item.name}
              </Link>
            </Button>
          )
        })}
      </nav>

      <Separator />

      <div className="px-3 py-4">
        <Button
          variant={
            pathname === "/settings" || pathname.startsWith("/settings/")
              ? "default"
              : "ghost"
          }
          className="w-full justify-start gap-3"
          asChild
        >
          <Link href="/settings" onClick={onClose}>
            <Settings className="h-5 w-5 flex-shrink-0" />
            Settings
          </Link>
        </Button>
      </div>
    </div>
  )
}

export function Sidebar({ sidebarOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar - always visible on md+ */}
      <div className="hidden md:flex w-64 border-r bg-background">
        <SidebarContent />
      </div>

      {/* Mobile drawer using Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={(open) => !open && onClose?.()}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent onClose={onClose} />
        </SheetContent>
      </Sheet>
    </>
  )
}
