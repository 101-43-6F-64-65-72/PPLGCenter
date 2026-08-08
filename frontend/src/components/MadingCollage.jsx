import React from "react";
import Image from "next/image";

export default function MadingCollage() {
  return (
    <div className="relative w-full max-w-[380px] sm:max-w-[420px] mx-auto lg:mx-0 select-none rounded-[20px] sm:rounded-[24px] overflow-hidden shadow-sm bg-white border border-gray-100 flex flex-col">
      {/* Top Image Container */}
      <div className="relative h-[130px] sm:h-[160px] w-full overflow-hidden bg-gray-100">
        <Image
          src="/images/tempat/aulasmkn2ska.jpg"
          alt="Suasana Ruang Mading Sekolah"
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>

      {/* Castle / Sawtooth crenellation separator */}
      <div className="relative w-full z-10 -mt-3 -mb-0.5 leading-none pointer-events-none">
        <svg
          viewBox="0 0 400 24"
          preserveAspectRatio="none"
          className="w-full h-6 sm:h-7 text-white fill-current block filter drop-shadow-[0_-1px_2px_rgba(0,0,0,0.05)]"
        >
          <path d="M 0,24 L 0,12 L 16,12 L 16,0 L 36,0 L 36,12 L 66,12 L 66,0 L 86,0 L 86,12 L 116,12 L 116,0 L 136,0 L 136,12 L 166,12 L 166,0 L 186,0 L 186,12 L 216,12 L 216,0 L 236,0 L 236,12 L 266,12 L 266,0 L 286,0 L 286,12 L 316,12 L 316,0 L 336,0 L 336,12 L 366,12 L 366,0 L 386,0 L 386,12 L 400,12 L 400,24 Z" />
        </svg>
      </div>

      {/* Bottom Image Container */}
      <div className="relative h-[130px] sm:h-[160px] w-full overflow-hidden bg-gray-100">
        <Image
          src="/images/tempat/halamandepansmkn2ska.jpg"
          alt="Siswa Membaca Mading Sekolah"
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
    </div>
  );
}