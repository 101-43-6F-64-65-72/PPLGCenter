import React from "react";
import Image from "next/image";

const facilityImages = [
  {
    src: "/images/tempat/halamandepansmkn2ska.jpg",
    alt: "Halaman Depan SMKN 2 Surakarta",
    transform: "rotate-[-4deg]",
  },
  {
    src: "/images/tempat/lapangansmkn2ska.jpg",
    alt: "Lapangan SMKN 2 Surakarta",
    transform: "rotate-[3deg]",
  },
  {
    src: "/images/tempat/aulasmkn2ska.jpg",
    alt: "Aula SMKN 2 Surakarta",
    transform: "rotate-[-2deg]",
  },
  {
    src: "/images/tempat/labsmkn2ska.jpeg",
    alt: "Laboratorium SMKN 2 Surakarta",
    transform: "rotate-[2deg]",
  },
];

export default function FacilityCollage() {
  return (
    <div className="relative w-full max-w-[520px] mx-auto select-none">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {facilityImages.map((image, index) => (
          <div
            key={index}
            className={`relative aspect-square overflow-hidden rounded-[32px] shadow-sm bg-gray-100 ${image.transform} transition-transform duration-300 hover:scale-[1.03]`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 45vw, 240px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
