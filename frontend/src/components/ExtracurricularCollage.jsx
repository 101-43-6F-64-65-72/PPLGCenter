import React from 'react';
import Image from 'next/image';

export default function ExtracurricularCollage() {
  const images = [
    {
      src: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=600&auto=format&fit=crop',
      alt: 'Ekstrakurikuler Olahraga Basketball',
      className: 'rounded-[28px] sm:rounded-[36px] shadow-sm transform -rotate-1 hover:rotate-0 transition-transform duration-300',
    },
    {
      src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
      alt: 'Ekstrakurikuler Seni Musik Band',
      className: 'rounded-[28px] sm:rounded-[36px] shadow-sm transform rotate-2 hover:rotate-0 transition-transform duration-300',
    },
    {
      src: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600&auto=format&fit=crop',
      alt: 'Ekstrakurikuler Sains dan Teknologi Lab',
      className: 'rounded-[28px] sm:rounded-[36px] shadow-sm transform rotate-1 hover:rotate-0 transition-transform duration-300',
    },
    {
      src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop',
      alt: 'Ekstrakurikuler Organisasi dan Kebersamaan',
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