"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import facilityService from "@/services/facilityService";
import { ArrowRight } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const DEFAULT_FACILITIES = [
  {
    id: "lab",
    name: "Laboratorium",
    category: "Fasilitas Utama",
    description: "Laboratorium komputer & praktik kejuruan berstandar industri modern.",
    image: "/images/tempat/labsmkn2ska.jpeg",
    gradient: "from-blue-600/90 via-blue-700/80 to-sky-500/90",
  },
  {
    id: "kreatif",
    name: "Ruang Kreatif",
    category: "Ruang Kolaborasi",
    description: "Ruang diskusi & laboratorium inovasi kreatif siswa.",
    image: "/images/tempat/halamandepansmkn2ska.jpg",
    gradient: "from-rose-800/90 via-pink-800/85 to-purple-900/90",
  },
  {
    id: "lapangan",
    name: "Lapangan",
    category: "Olahraga & Seni",
    description: "Lapangan outdoor serbaguna untuk olahraga dan kegiatan akbar.",
    image: "/images/tempat/lapangansmkn2ska.jpg",
    gradient: "from-emerald-800/90 via-teal-800/85 to-emerald-700/90",
  },
  {
    id: "aula",
    name: "Aula Serbaguna",
    category: "Auditorium",
    description: "Aula utama untuk pentas seni, seminar, dan pertemuan resmi.",
    image: "/images/tempat/aulasmkn2ska.jpg",
    gradient: "from-indigo-800/90 via-blue-800/85 to-sky-700/90",
  },
];

export default function FacilityCatalogSection() {
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  // Fetch facilities from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadFacilities() {
      try {
        const res = await facilityService.getFacilities({ pageSize: 4 });
        const rawData = res?.data ?? res;
        const items = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.items)
          ? rawData.items
          : [];

        if (isMounted && items.length > 0) {
          const mapped = items.slice(0, 4).map((item, index) => ({
            id: item.id || item.Id || index,
            name: item.name || item.Name || DEFAULT_FACILITIES[index].name,
            category: item.category || DEFAULT_FACILITIES[index].category,
            description: item.description || DEFAULT_FACILITIES[index].description,
            image: item.imageUrl || item.image || item.photo || DEFAULT_FACILITIES[index].image,
            gradient: DEFAULT_FACILITIES[index % DEFAULT_FACILITIES.length].gradient,
          }));

          while (mapped.length < 4) {
            const fallbackIdx = mapped.length;
            mapped.push({
              ...DEFAULT_FACILITIES[fallbackIdx],
              id: `fallback-${fallbackIdx}`,
            });
          }

          setFacilities(mapped);
        }
      } catch (err) {
        // Safe fallback to default items
      }
    }

    loadFacilities();
    return () => {
      isMounted = false;
    };
  }, []);

  // Setup GSAP ScrollTrigger pinning and scrub sequence
  useEffect(() => {
    if (typeof window === "undefined" || !sectionRef.current) return;

    let mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const cardEls = cardsRef.current.filter(Boolean);
      if (cardEls.length < 2) return;

      // Set initial stack state for desktop
      // Card 0: foreground (y: 0, scale: 1)
      // Card 1: y: 35, scale: 0.96
      // Card 2: y: 70, scale: 0.92
      // Card 3: y: 105, scale: 0.88
      cardEls.forEach((card, idx) => {
        gsap.set(card, {
          y: idx * 35,
          scale: 1 - idx * 0.04,
          opacity: 1,
          zIndex: 40 - idx * 10,
          transformOrigin: "top center",
        });
      });

      // Pin the section while vertical scroll scrubs the card transitions
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: `+=${cardEls.length * 110}%`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Sequence: each card slides up and out while next card ascends into foreground
      for (let i = 0; i < cardEls.length - 1; i++) {
        const currentCard = cardEls[i];
        
        // Slide active foreground card up and out
        tl.to(
          currentCard,
          {
            y: "-130%",
            scale: 0.95,
            opacity: 0,
            duration: 1,
            ease: "power2.inOut",
          },
          i * 1.2
        );

        // Shift remaining stack cards forward
        for (let j = i + 1; j < cardEls.length; j++) {
          const nextCard = cardEls[j];
          const relativePos = j - (i + 1);
          tl.to(
            nextCard,
            {
              y: relativePos * 35,
              scale: 1 - relativePos * 0.04,
              duration: 1,
              ease: "power2.inOut",
            },
            i * 1.2
          );
        }
      }

      return () => {
        tl.kill();
      };
    });

    return () => {
      mm.revert();
    };
  }, [facilities]);

  return (
    <section
      ref={sectionRef}
      id="facilities"
      className="w-full bg-white border-t border-slate-200/80 relative overflow-hidden select-none"
    >
      {/* Desktop Container (min-h-screen with pinned left + card stack) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-0 min-h-screen flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* LEFT CONTENT COLUMN - Pinned & Stationary during scroll */}
          <div className="lg:col-span-5 flex flex-col items-start justify-center lg:py-12">
            {/* Section Kicker */}
            <span className="text-xs font-bold tracking-widest text-[#2c1ee8] uppercase mb-3 block">
              FASILITAS SEKOLAH
            </span>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12] mb-5">
              Katalog & <br className="hidden sm:inline" />
              Peminjaman Fasilitas
            </h2>

            {/* Subtitle / Description */}
            <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-md text-left font-normal">
              Akses sarana sekolah modern, dari laboratorium praktik hingga ruang kolaborasi,
              dan ajukan peminjaman dengan alur yang transparan.
            </p>

            {/* Primary CTA Button */}
            <div className="w-full sm:w-auto">
              <Link
                href="/fasilitas"
                aria-label="Jelajahi Fasilitas"
                className="group inline-flex items-center justify-center gap-2.5 bg-[#2c1ee8] hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                <span>Jelajahi Fasilitas</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* RIGHT CARD SHOWCASE COLUMN */}
          <div className="lg:col-span-7 w-full flex justify-center lg:justify-end">
            
            {/* DESKTOP STACK VIEW (lg:flex) */}
            <div className="hidden lg:block relative w-full max-w-[560px] h-[440px]">
              {facilities.map((facility, index) => (
                <div
                  key={facility.id || index}
                  ref={(el) => (cardsRef.current[index] = el)}
                  className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 group cursor-pointer bg-slate-900"
                >
                  {/* Visual Background Image */}
                  <Image
                    src={facility.image}
                    alt={facility.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />

                  {/* Gradient Overlay matching reference style */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${facility.gradient} opacity-85 group-hover:opacity-90 transition-opacity duration-300`} />

                  {/* Text Overlay at Bottom */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-white z-10">
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-200 mb-1.5 opacity-90 block">
                      {facility.category}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2 tracking-tight drop-shadow-xs">
                      {facility.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-100 font-normal line-clamp-2 leading-relaxed opacity-95">
                      {facility.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* MOBILE & TABLET STACK VIEW (< 1024px) - Clean vertical list */}
            <div className="lg:hidden w-full flex flex-col gap-5">
              {facilities.map((facility, index) => (
                <div
                  key={`mobile-${facility.id || index}`}
                  className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden shadow-md border border-slate-200/90 group bg-slate-900"
                >
                  <Image
                    src={facility.image}
                    alt={facility.name}
                    fill
                    sizes="100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${facility.gradient} opacity-85`} />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-slate-200 mb-1 block">
                      {facility.category}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                      {facility.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
