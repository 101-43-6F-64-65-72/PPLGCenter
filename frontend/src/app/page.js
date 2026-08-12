import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Ekstrakurikuler from "@/components/Ekstrakurikuler";
import MadingDigital from "@/components/MadingDigital";
import Fasilitas from "@/components/Fasilitas";
import Footer from "@/components/Footer";

// Helper to fetch data with absolute URL or relative URL with fallback handling
async function getEndpointData(endpoint) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    
    const res = await fetch(`${baseUrl}${endpoint}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn(`[Data Fetch Warning] ${endpoint}: ${error.message}. Using fallback data.`);
    return null;
  }
}

export default async function Home() {
  // Fetch all 5 API endpoints concurrently using Promise.all to prevent waterfall delay
  const [heroData, ekstrakurikulerData, madingData, fasilitasData, footerData] =
    await Promise.all([
      getEndpointData("/api/hero"),
      getEndpointData("/api/ekstrakurikuler"),
      getEndpointData("/api/mading"),
      getEndpointData("/api/fasilitas"),
      getEndpointData("/api/footer"),
    ]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col overflow-x-hidden">
        <Hero data={heroData} />
        <Ekstrakurikuler data={ekstrakurikulerData} />
        <MadingDigital data={madingData} />
        <Fasilitas data={fasilitasData} />
      </main>
      <Footer data={footerData} />
    </div>
  );
}
