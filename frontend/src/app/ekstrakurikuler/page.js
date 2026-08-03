"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ExtracurricularCard from "@/components/ExtracurricularCard";
import clubService from "@/services/clubService";

export default function EkstrakurikulerPage() {
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadClubs() {
      const data = await clubService.getClubs();
      if (isMounted && data && Array.isArray(data)) {
        setClubs(data);
      }
    }
    loadClubs();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Navbar />

      <div className="w-full px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-16 min-h-screen bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              EKSTRAKURIKULER
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mt-2">
              Ekstrakurikuler adalah kegiatan yang dilakukan di luar jam pelajaran sekolah yang bertujuan untuk mengembangkan minat, bakat, dan keterampilan siswa. Kegiatan ini dapat berupa olahraga, seni, musik, atau kegiatan sosial yang dapat membantu siswa untuk mengembangkan diri mereka secara holistik.
            </p>
          </div>
          <div
            className="
              grid gap-8 sm:gap-10 lg:gap-8
              grid-cols-2
              sm:grid-cols-3
              lg:grid-cols-5
            "
          >
            {clubs.map((item) => (
              <ExtracurricularCard
                key={item.id}
                imageSrc={item.imageSrc || item.image || "/images/dummypic.jpg"}
                title={item.title || item.name}
                alt={item.title || item.name}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}