import React from "react";
import FacilityCollage from "./FacilityCollage";
import PrimaryButton from "./PrimaryButton";

export default function FacilityCatalogSection() {
  return (
    <section
      id="facilities"
      className="w-full bg-white py-16 sm:py-20 lg:py-24 px-4 sm:px-8 lg:px-12"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-6 w-full flex justify-center lg:justify-start">
          <FacilityCollage />
        </div>

        <div className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-4">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-black leading-tight mb-6">
            Katalog & Peminjaman Fasilitas
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-gray-800 leading-relaxed mb-8 lg:mb-10 max-w-xl">
            SMKN 2 Surakarta menyediakan fasilitas lengkap bagi siswa dan
            sekolah, mulai dari ruang kelas modern, laboratorium, aula,
            hingga lapangan serbaguna. Temukan fasilitas yang tersedia dan
            lakukan peminjaman dengan mudah untuk mendukung kegiatan belajar
            dan ekstrakurikuler.
          </p>

          <div className="w-full sm:w-auto">
            <PrimaryButton text="Jelajah" />
          </div>
        </div>
      </div>
    </section>
  );
}
