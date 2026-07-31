import React from "react";
import ExtracurricularCollage from "./ExtracurricularCollage";
import PrimaryButton from "./PrimaryButton";

export default function ExtracurricularSection() {
  return (
    <section
      id="extracurricular"
      className="w-full bg-white py-10 sm:py-14 lg:py-16 px-4 sm:px-8 lg:px-12"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Image Collage */}
        <div className="lg:col-span-6 w-full flex justify-center lg:justify-start">
          <ExtracurricularCollage />
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black leading-tight mb-5">
            Ekstrakurikuler
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-gray-800 leading-relaxed mb-6 lg:mb-8 max-w-xl">
            SMKN 2 SURAKARTA menyediakan beragam kegiatan ekstrakurikuler yang
            dirancang untuk mengembangkan potensi siswa di luar kegiatan
            akademik. Mulai dari bidang olahraga, seni dan budaya, sains dan
            teknologi, hingga organisasi, setiap ekstrakurikuler menjadi wadah
            bagi siswa untuk mengasah bakat, membangun karakter, serta
            mengembangkan kemampuan kepemimpinan, kerja sama, dan kreativitas.
          </p>

          <div className="w-full sm:w-auto">
            <PrimaryButton href="/ekstrakurikuler" text="Daftar" />
          </div>
        </div>
      </div>
    </section>
  );
}
