"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export default function PricingSection() {
  return (
    <section className="py-16 bg-[color:var(--legal-bg-secondary)]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-baskervville text-[color:var(--legal-secondary)] mb-6">
          Transparent Pricing
        </h2>
        <p className="text-lg font-montserrat text-[color:var(--legal-dark-text)] mb-8">
          Get clear, upfront pricing for all legal and accounting services. No hidden
          fees.
        </p>
      </div>
    </section>
  )
}
