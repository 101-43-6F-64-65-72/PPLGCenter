import Navbar from "@/components/Navbar";
import ExtracurricularCard from "@/components/ExtracurricularCard";

const cardImages = [
  "/images/dummypic.jpg",
  "/images/dummypic.jpg",
  "/images/dummypic.jpg",
  "/images/dummypic.jpg",
];

export default function EkstrakurikulerPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cardImages.map((src, index) => (
            <ExtracurricularCard key={index} imageSrc={src} />
          ))}
        </div>
      </main>
    </div>
  );
}
