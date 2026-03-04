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
  Phone,
  Calendar,
  Settings,
  MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Deals", href: "/deals", icon: Handshake },
  { name: "Contacts", href: "/contacts", icon: Contact },
  { name: "Organizations", href: "/organizations", icon: Building2 },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Notes", href: "/notes", icon: StickyNote },
  { name: "WhatsApp", href: "/whatsapp", icon: MessageCircle },
  { name: "Call Logs", href: "/call-logs", icon: Phone },
  { name: "Calendar", href: "/calendar", icon: Calendar },
]

interface SidebarProps {
  sidebarOpen?: boolean
  onClose?: () => void
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-16 px-6">
        <h1 className="text-xl font-bold text-primary">Precept CRM</h1>
      </div>

      <Separator />

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Button
              key={item.name}
              variant={isActive ? "default" : "ghost"}
              className={cn("w-full justify-start gap-3")}
              asChild
            >
              <Link href={item.href} onClick={onClose}>
                <item.icon className="h-5 w-5 flex-shrink-0" />
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
