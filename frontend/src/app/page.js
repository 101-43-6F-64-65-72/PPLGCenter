import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeHero from "@/components/home/HomeHero";
import HomeTodaySchedule from "@/components/home/HomeTodaySchedule";
import HomeAnnouncements from "@/components/home/HomeAnnouncements";
import HomeDailyQuizShowcase from "@/components/home/HomeDailyQuizShowcase";
import { ensureAssets } from "@/lib/ensure-assets";

export default function Home() {
  // Ensure image assets exist in public folder
  ensureAssets();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden max-w-full w-full">
      <Navbar />
      <main className="flex-1 flex flex-col pt-14 sm:pt-16 overflow-x-hidden max-w-full w-full">
        {/* ─── 1. Hero Section (Full Viewport Astra Sinarmas) ─── */}
        <HomeHero />

        {/* ─── 2. Section: Jadwal {KELAS} hari ini ─── */}
        <HomeTodaySchedule />

        {/* ─── 3. Section: Pengumuman & Berita (Showcase Slider) ─── */}
        <HomeAnnouncements />

        {/* ─── 4. Section: Showcase Kuis Harian (4-Stage Pinned Scroll Experience) ─── */}
        <HomeDailyQuizShowcase />
      </main>
      <Footer />
    </div>
  );
}
