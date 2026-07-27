import React from "react";
import ExtracurricularCollage from "./ExtracurricularCollage";
import PrimaryButton from "./PrimaryButton";

export default function ExtracurricularSection() {
  return (
    <section
      id="extracurricular"
      className="w-full bg-white py-16 sm:py-20 lg:py-24 px-4 sm:px-8 lg:px-12"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Image Collage */}
        <div className="lg:col-span-6 w-full flex justify-center lg:justify-start">
          <ExtracurricularCollage />
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-4">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-black leading-tight mb-6">
            Ekstrakurikuler
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-gray-800 leading-relaxed mb-8 lg:mb-10 max-w-xl">
            Kolese De Britto menyediakan beragam kegiatan ekstrakurikuler yang
            dirancang untuk mengembangkan potensi siswa di luar kegiatan
            akademik. Mulai dari bidang olahraga, seni dan budaya, sains dan
            teknologi, hingga organisasi, setiap ekstrakurikuler menjadi wadah
            bagi siswa untuk mengasah bakat, membangun karakter, serta
            mengembangkan kemampuan kepemimpinan, kerja sama, dan kreativitas.
          </p>

          <div className="w-full sm:w-auto">
            <PrimaryButton text="Daftar" />
          </div>
        </div>
      </div>
    </section>
  );
}
