"use client";

import React from "react";
import Image from "next/image";
import { motion } from "@/lib/motion";
import { Trophy, ShieldCheck, GraduationCap } from "lucide-react";
import PrimaryButton from "./PrimaryButton";
import FloatingBadge from "./FloatingBadge";
import ContactCard from "./ContactCard";

export default function Hero() {
  return (
    <section
      id="home"
      className="w-full bg-gradient-to-b from-slate-50/50 via-white to-white snap-start snap-always min-h-[calc(85vh-5rem)] flex items-center py-10 sm:py-14 lg:py-18 px-4 sm:px-6 lg:px-10 overflow-hidden relative"
    >
      {/* Background Soft Glow Accents */}
      <div className="absolute top-1/4 left-[-10%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-[-5%] w-[450px] h-[450px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 w-full">
        {/* Left Column: Heading, Subtitle & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-4"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-slate-950 leading-[1.08] mb-5">
            Mencetak Lulusan Unggul & Ready-to-Work
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl font-normal text-justify">
            Program pengembangan sekolah kejuruan terdepan untuk menghasilkan
            lulusan kompeten dan berkarakter, diselaraskan secara mendalam dengan
            kebutuhan dunia usaha, industri, dan kerja (DUDI).
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <PrimaryButton text="Jelajahi Portal" href="/ekstrakurikuler" />
          </div>
        </motion.div>

        {/* Right Column: Hero Image with Floating Badges & Contact Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="lg:col-span-6 flex flex-col items-end w-full"
        >
          <div className="relative w-full max-w-[480px] aspect-[4/5] rounded-[28px] sm:rounded-[32px] lg:rounded-[36px] overflow-visible shadow-md shadow-slate-900/5 mx-auto lg:ml-auto lg:mr-0 group">
            {/* Soft Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#2c1ee8]/20 to-blue-400/20 rounded-[28px] sm:rounded-[32px] lg:rounded-[36px] blur-xl opacity-60 transition-opacity group-hover:opacity-80" />

            {/* School Building Image Container */}
            <div className="relative w-full h-full rounded-[28px] sm:rounded-[32px] lg:rounded-[36px] overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner">
              <Image
                src="/images/smknegeri2surakarta_cover.webp"
                alt="SMK Negeri 2 Surakarta School Building"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>

            {/* Floating Badges */}
            <FloatingBadge
              text="Berprestasi"
              subtext="Tingkat Nasional"
              position="top-right"
              icon={Trophy}
              delay={0.3}
            />
            <FloatingBadge
              text="Akreditasi Unggul"
              subtext="Nilai A (Sangat Baik)"
              position="middle-left"
              icon={ShieldCheck}
              delay={0.4}
            />
            <FloatingBadge
              text="Pendidikan Berkualitas"
              subtext="Kurikulum Industri"
              position="bottom-right"
              icon={GraduationCap}
              delay={0.5}
            />
          </div>

          {/* Contact Card Pill (Bottom Right) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="w-full max-w-[480px] flex justify-end mt-5 pr-2 lg:pr-0 mx-auto lg:ml-auto lg:mr-0"
          >
            <ContactCard
              phone="+62 823-2237-7070"
              avatarSrc="/images/contact-avatar.png"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

