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
      <div className="relative hidden lg:flex flex-col bg-brand-black p-10 text-brand-white dark:border-r overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d14] via-brand-black to-[#1a0a2e]" />
        {/* Decorative radial glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-violet/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-brand-violet/10 blur-3xl" />

        {/* Logo */}
        <div className="relative z-20 flex items-center gap-3">
          <div className="flex items-center justify-center size-9 rounded-xl bg-brand-violet text-white shadow-lg">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 2h6.5a3.5 3.5 0 0 1 0 7H3V2Z" fill="currentColor" fillOpacity="0.9"/>
              <path d="M3 9h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="3" cy="13" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">Precept</span>
        </div>

        {/* Feature highlights */}
        <div className="relative z-20 mt-auto space-y-8">
          <div className="space-y-4">
            {[
              { title: "Unified pipeline", desc: "Leads, deals, and contacts in one place." },
              { title: "Real-time collaboration", desc: "Live updates across your entire team." },
              { title: "Multi-channel outreach", desc: "Email, WhatsApp, and calls from one inbox." },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-3 items-start">
                <div className="mt-0.5 size-5 rounded-full bg-brand-violet/30 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-white/90">{feature.title}</p>
                  <p className="text-sm text-brand-white/50">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <blockquote className="border-l-2 border-brand-violet/40 pl-4">
            <p className="text-sm text-brand-white/70 italic">
              &ldquo;Precept transformed how we manage customer relationships. We close deals faster than ever.&rdquo;
            </p>
            <footer className="mt-1 text-xs text-brand-white/40">— Satisfied Customer</footer>
          </blockquote>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="relative flex items-center justify-center p-8 bg-background">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        {children}
      </div>
    </div>
  )
}
