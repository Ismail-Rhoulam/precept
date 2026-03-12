"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Search, LogOut, User, Menu, X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import { NotificationBell } from "@/components/activities/NotificationBell"
import { ConnectionStatus } from "@/components/layout/ConnectionStatus"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/ui/theme-toggle"

function getBreadcrumbs(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean)
  return segments.map(
    (segment) =>
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
  )
}

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="h-14 bg-background/95 backdrop-blur-sm border-b border-border/60 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger menu - mobile only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1
            return (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    isLast
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hidden sm:inline hover:text-foreground transition-colors"
                  )}
                >
                  {crumb}
                </span>
              </span>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile search toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMobileSearch((v) => !v)}
          className="md:hidden"
          aria-label="Search"
        >
          {showMobileSearch ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </Button>

        {/* Desktop search bar */}
        <div className="hidden md:block relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-16 w-60 h-8 text-sm bg-muted/60 border-transparent focus:border-input focus:bg-background transition-all"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            ⌘K
          </kbd>
        </div>

        <ConnectionStatus />
        <ThemeToggle />
        <NotificationBell />

        {/* User dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {user?.first_name?.[0] || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium">
                {user?.first_name} {user?.last_name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile search bar - expanded */}
      {showMobileSearch && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b px-4 py-3 z-40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              autoFocus
              className="w-full pl-10"
            />
          </div>
        </div>
      )}
    </header>
  )
}
