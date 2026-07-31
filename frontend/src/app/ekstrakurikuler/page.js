import Navbar from "@/components/Navbar";
import ExtracurricularCard from "@/components/ExtracurricularCard";

const items = [
  { id: 1, imageSrc: "/images/dummypic.jpg", title: "Basketball" },
  { id: 2, imageSrc: "/images/dummypic.jpg", title: "Voli" },
  { id: 3, imageSrc: "/images/dummypic.jpg", title: "Futsal" },
  { id: 4, imageSrc: "/images/dummypic.jpg", title: "Pramuka" },
];

export default function EkstrakurikulerPage() {
  return (
    <>
      <Navbar />

      <div className="w-full px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div
          className="
            grid gap-8 sm:gap-10 lg:gap-8
            grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-5
          "
        >
          {items.map((item) => (
            <ExtracurricularCard
              key={item.id}
              imageSrc={item.imageSrc}
              title={item.title}
              alt={item.title}
            />
          ))}
        </div>
      </div>
    </>
  );
}