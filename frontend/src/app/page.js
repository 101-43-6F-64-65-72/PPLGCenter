import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ExtracurricularSection from "@/components/ExtracurricularSection";
import MadingSection from "@/components/MadingSection";
import Footer from "@/components/Footer";
import { ensureAssets } from "@/lib/ensure-assets";

export default function Home() {
  // Ensure image assets exist in public/images folder
  ensureAssets();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden max-w-full w-full">
      <Navbar />
      <main className="flex-1 flex flex-col pt-20 lg:pt-24 overflow-x-hidden max-w-full w-full">
        <Hero />
        <ExtracurricularSection />
        <MadingSection />
      </main>
      <Footer />
    </div>
  );
}
