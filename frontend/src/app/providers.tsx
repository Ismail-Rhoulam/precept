"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useState } from "react"

import { CustomPointer } from "@/components/ui/custom-pointer"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  )

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <QueryClientProvider client={queryClient}>
        <CustomPointer />
        {children}
      </QueryClientProvider>
    </NextThemesProvider>
  )
}
