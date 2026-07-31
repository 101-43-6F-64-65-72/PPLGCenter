import React from "react";
import FacilityCollage from "./FacilityCollage";
import PrimaryButton from "./PrimaryButton";

export default function FacilityCatalogSection() {
  return (
    <section
      id="facilities"
      className="w-full bg-white py-10 sm:py-14 lg:py-16 px-4 sm:px-8 lg:px-12"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-6 w-full flex justify-center lg:justify-start">
          <FacilityCollage />
        </div>

        <div className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black leading-tight mb-5">
            Katalog & Peminjaman Fasilitas
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-gray-800 leading-relaxed mb-6 lg:mb-8 max-w-xl">
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
