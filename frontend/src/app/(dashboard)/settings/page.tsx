"use client"

import Link from "next/link"
import { Settings, Package, Shield, ArrowRight, Sliders, Phone, Code2, LayoutTemplate } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const settingsLinks = [
  {
    name: "General",
    description: "Brand name, currency, and core CRM preferences",
    href: "/settings/general",
    icon: Sliders,
  },
  {
    name: "Integrations",
    description: "Twilio, Exotel, WhatsApp, Facebook, and telephony agents",
    href: "/settings/integrations",
    icon: Phone,
  },
  {
    name: "Products",
    description: "Manage your product catalog for leads and deals",
    href: "/settings/products",
    icon: Package,
  },
  {
    name: "Service Level Agreements",
    description: "Configure SLA rules and response time expectations",
    href: "/settings/sla",
    icon: Shield,
  },
  {
    name: "Form Scripts",
    description: "Customize form behavior with JavaScript event handlers",
    href: "/settings/form-scripts",
    icon: Code2,
  },
  {
    name: "Fields Layout",
    description: "Configure how fields are arranged in forms and detail views",
    href: "/settings/fields-layout",
    icon: LayoutTemplate,
  },
]

export default function SettingsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your CRM settings and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:border-primary/30 hover:shadow-md transition-all group h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                      <link.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold group-hover:text-primary transition-colors">
                        {link.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
