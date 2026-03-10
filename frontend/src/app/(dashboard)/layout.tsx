"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { WebSocketProvider } from "@/components/providers/WebSocketProvider"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading, initialize } = useAuthStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex w-64 border-r bg-background flex-col gap-4 p-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2 mt-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-16 border-b bg-background flex items-center px-6 gap-4">
            <Skeleton className="h-5 w-32" />
            <div className="flex-1" />
            <Skeleton className="h-9 w-64 hidden md:block" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex-1 p-6 bg-muted/50 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <WebSocketProvider>
      <div className="h-screen flex overflow-hidden">
        <Sidebar
          sidebarOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onMenuClick={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/50">{children}</main>
        </div>
      </div>
    </WebSocketProvider>
  )
}
