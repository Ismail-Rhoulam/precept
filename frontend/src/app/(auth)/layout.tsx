"use client"

import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left panel - branding */}
      <div className="relative hidden lg:flex flex-col bg-brand-black p-10 text-brand-white dark:border-r">
        <div className="absolute inset-0 bg-brand-black" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          Precept
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Precept has transformed how we manage our customer relationships.
              The intuitive interface and powerful features help us close deals faster than ever.&rdquo;
            </p>
            <footer className="text-sm text-brand-white/60">— Happy Customer</footer>
          </blockquote>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="relative flex items-center justify-center p-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        {children}
      </div>
    </div>
  )
}
