"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Search, LogOut, User, Menu, X } from "lucide-react"
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
    <header className="h-16 bg-background border-b flex items-center justify-between px-4 md:px-6">
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

        {/* Breadcrumbs - compact on mobile */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "text-foreground font-medium"
                    : "hidden sm:inline"
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </div>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-10 w-64"
          />
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
