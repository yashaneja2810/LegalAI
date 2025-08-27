"use client"

import { Scale, Shield, Award, Star, Users } from "lucide-react"
import Image from "next/image"

export default function TrustSection() {
  return (
    <section className="py-16 bg-[color:var(--legal-bg-primary)]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-baskervville text-[color:var(--legal-secondary)] mb-6">Trusted by Businesses & Individuals</h2>
        <p className="text-lg font-montserrat text-[color:var(--legal-dark-text)] mb-8">Our reputation is built on trust, expertise, and results. See why clients choose us.</p>
      </div>
    </section>
  );
}
