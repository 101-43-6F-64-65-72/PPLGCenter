import React from 'react';
import Image from 'next/image';

export default function ExtracurricularCollage() {
  const images = [
    {
      src: '/images/tempat/lapangansmkn2ska.jpg',
      alt: 'Ekstrakurikuler Olahraga Basketball',
      className: 'rounded-[28px] sm:rounded-[36px] shadow-sm transform -rotate-1 hover:rotate-0 transition-transform duration-300',
    },
    {
      src: '/images/paskibra.jpg',
      alt: 'Ekstrakurikuler Paskibra',
      className: 'rounded-[28px] sm:rounded-[36px] shadow-sm transform rotate-2 hover:rotate-0 transition-transform duration-300',
    },
    {
      src: '/images/pmr.jpg',
      alt: 'Ekstrakurikuler PMR',
      className: 'rounded-[28px] sm:rounded-[36px] shadow-sm transform rotate-1 hover:rotate-0 transition-transform duration-300',
    },
    {
      src: '/images/pramuka.jpg',
      alt: 'Ekstrakurikuler Pramuka',
      className: 'rounded-[28px] sm:rounded-[36px] shadow-sm transform -rotate-2 hover:rotate-0 transition-transform duration-300',
    },
  ];

  return (
    <div className="relative w-full max-w-[560px] mx-auto lg:mx-0 select-none">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`relative aspect-square w-full overflow-hidden bg-gray-100 ${img.className}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 50vw, 280px"
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
}