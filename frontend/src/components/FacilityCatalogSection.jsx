"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import facilityService from "@/services/facilityService";
import { resolveImageUrl } from "@/lib/utils";
import { ArrowRight, Building2, CheckCircle2, Shield } from "lucide-react";

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
    gradient: "from-blue-700/90 via-blue-600/85 to-sky-500/90",
  },
  {
    id: "kreatif",
    name: "Ruang Kreatif",
    category: "Ruang Kolaborasi",
    description: "Ruang diskusi & laboratorium inovasi kreatif siswa.",
    image: "/images/tempat/halamandepansmkn2ska.jpg",
    gradient: "from-indigo-900/90 via-blue-800/85 to-blue-600/90",
  },
  {
    id: "lapangan",
    name: "Lapangan",
    category: "Olahraga & Seni",
    description: "Lapangan outdoor serbaguna untuk olahraga dan kegiatan akbar.",
    image: "/images/tempat/lapangansmkn2ska.jpg",
    gradient: "from-slate-900/95 via-blue-900/85 to-sky-700/90",
  },
  {
    id: "aula",
    name: "Aula Serbaguna",
    category: "Auditorium",
    description: "Aula utama untuk pentas seni, seminar, dan pertemuan resmi.",
    image: "/images/tempat/aulasmkn2ska.jpg",
    gradient: "from-blue-900/90 via-indigo-900/85 to-sky-600/90",
  },
];

export default function FacilityCatalogSection() {
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  // Fetch facilities from backend API using facilityService.getFacilities()
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
            image: resolveImageUrl(item.imageUrl || item.image || item.photo || DEFAULT_FACILITIES[index].image),
            gradient: DEFAULT_FACILITIES[index % DEFAULT_FACILITIES.length].gradient,
          }));

          while (mapped.length < 4) {
            const fallbackIdx = mapped.length;
            mapped.push({
              ...DEFAULT_FACILITIES[fallbackIdx],
              id: `fallback-${fallbackIdx}`,
              image: resolveImageUrl(DEFAULT_FACILITIES[fallbackIdx].image),
            });
          }

          setFacilities(mapped);
        }
      } catch (err) {
        // Safe fallback to default items on error
      }
    }

    loadFacilities();
    return () => {
      isMounted = false;
    };
  }, []);

  // Setup GSAP ScrollTrigger Pinned Left Content + Scrollable Card Stack
  useEffect(() => {
    if (typeof window === "undefined" || !sectionRef.current) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let mm = gsap.matchMedia();

    // Desktop GSAP ScrollTrigger setup (>= 1024px)
    mm.add("(min-width: 1024px)", () => {
      const cardEls = cardsRef.current.filter(Boolean);
      if (cardEls.length < 2) return;

      // 1. Initial Stack Positions
      // Card 0: y: 0, scale: 1, zIndex: 40
      // Card 1: y: 35px, scale: 0.96, zIndex: 30
      // Card 2: y: 70px, scale: 0.92, zIndex: 20
      // Card 3: y: 105px, scale: 0.88, zIndex: 10
      cardEls.forEach((card, idx) => {
        gsap.set(card, {
          y: idx * 35,
          scale: 1 - idx * 0.04,
          opacity: 1,
          zIndex: 40 - idx * 10,
          transformOrigin: "top center",
        });
      });

      // 2. Timeline with ScrollTrigger pin & scrub
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=2800",
          pin: true,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 3. Card Stack Sequence Transitions
      // Phase 1: Card 0 moves up & out, Card 1 becomes foreground (y:0, scale:1)
      // Phase 2: Card 1 moves up & out, Card 2 becomes foreground
      // Phase 3: Card 2 moves up & out, Card 3 becomes foreground
      for (let i = 0; i < cardEls.length - 1; i++) {
        const currentCard = cardEls[i];
        
        // Active card moves up & out
        tl.to(
          currentCard,
          {
            y: "-120%",
            scale: 0.94,
            opacity: 0.15,
            duration: 1,
            ease: "power2.inOut",
          },
          i * 1.2
        );

        // Subsequent cards step forward in the stack
        for (let j = i + 1; j < cardEls.length; j++) {
          const nextCard = cardEls[j];
          const relativeIndex = j - (i + 1);
          tl.to(
            nextCard,
            {
              y: relativeIndex * 35,
              scale: 1 - relativeIndex * 0.04,
              duration: 1,
              ease: "power2.inOut",
            },
            i * 1.2
          );
        }
      }

      // Refresh ScrollTrigger positions after DOM calculations
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-0 min-h-screen flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* LEFT CONTENT COLUMN (~45%) - 100% Stationary & Pinned during sequence */}
          <div className="lg:col-span-5 flex flex-col items-start justify-center lg:py-12">
            {/* Section Kicker Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-100 text-[#2c1ee8] text-[11px] font-mono tracking-widest uppercase mb-4 select-none">
              <Building2 className="w-3.5 h-3.5 text-[#2c1ee8]" />
              <span className="font-semibold">Fasilitas Sekolah</span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12] mb-5">
              Katalog & <br className="hidden sm:inline" />
              Peminjaman Fasilitas
            </h2>

            {/* Description */}
            <p className="text-base text-slate-600 leading-relaxed mb-6 max-w-md text-left font-normal">
              Akses sarana sekolah modern, dari laboratorium praktik hingga ruang kolaborasi,
              dan ajukan peminjaman dengan alur yang transparan.
            </p>

            {/* Feature Highlight Badges */}
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/90 text-slate-700 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Lab Komputer & Kejuruan
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/90 text-slate-700 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-[#2c1ee8]" /> System Peminjaman Digital
              </span>
            </div>

            {/* Primary CTA */}
            <div className="w-full sm:w-auto">
              <Link
                href="/fasilitas"
                aria-label="Jelajahi Fasilitas"
                className="group inline-flex items-center justify-center gap-2.5 bg-[#2c1ee8] hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.97]"
              >
                <span>Jelajahi Fasilitas</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* RIGHT SHOWCASE COLUMN (~55%) - Card Stack Animation */}
          <div className="lg:col-span-7 w-full flex justify-center lg:justify-end">
            
            {/* DESKTOP STACK VIEW (lg:flex) */}
            <div className="hidden lg:block relative w-full max-w-[560px] h-[440px]">
              {facilities.map((facility, index) => (
                <div
                  key={facility.id || index}
                  ref={(el) => (cardsRef.current[index] = el)}
                  className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 group cursor-pointer bg-slate-900"
                >
                  {/* Image Background */}
                  <Image
                    src={resolveImageUrl(facility.image)}
                    alt={facility.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />

                  {/* Gradient Overlay matching reference style */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${facility.gradient} opacity-85 group-hover:opacity-90 transition-opacity duration-300`} />

                  {/* Text Content Overlay at Bottom */}
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

            {/* MOBILE & TABLET STACK VIEW (< 1024px) - Clean vertical stack */}
            <div className="lg:hidden w-full flex flex-col gap-5">
              {facilities.map((facility, index) => (
                <div
                  key={`mobile-${facility.id || index}`}
                  className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden shadow-md border border-slate-200/90 group bg-slate-900"
                >
                  <Image
                    src={resolveImageUrl(facility.image)}
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
                    {facility.description && (
                      <p className="text-xs text-slate-200 line-clamp-2 mt-1">
                        {facility.description}
                      </p>
                    )}
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
