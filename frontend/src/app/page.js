import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ExtracurricularSection from "@/components/ExtracurricularSection";
import FacilityCatalogSection from "@/components/FacilityCatalogSection";
import { ensureAssets } from "@/lib/ensure-assets";

export default function Home() {
  // Ensure image assets exist in public/images folder
  ensureAssets();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col overflow-x-hidden pt-20 lg:pt-24">
          <Hero />
          <ExtracurricularSection />
          <FacilityCatalogSection />
      </main>
    </div>
  );
}
