import React from "react";
import Image from "next/image";
import PrimaryButton from "./PrimaryButton";
import FloatingBadge from "./FloatingBadge";
import ContactCard from "./ContactCard";

export default function Hero() {
  return (
    <section id="home" className="w-full bg-white snap-start snap-always min-h-[calc(100vh-5rem)] flex items-center py-10 sm:py-16 lg:py-20 px-4 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
        {/* Left Column: Heading, Subtitle & CTA */}
        <div className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-6">
          <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-bold tracking-tight text-black leading-[1.1] mb-6">
            SMK Pusat Keunggulan
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-gray-800 leading-relaxed mb-10 max-w-xl">
            {
              "Program pengembangan sekolah kejuruan untuk menghasilkan lulusan yang kompeten dan siap kerja melalui penyelarasan mendalam antara kurikulum sekolah dengan kebutuhan dunia usaha, dunia industri, dan dunia kerja (DUDI)"
            }
          </p>

          <PrimaryButton text="Jelajahi" />
        </div>

        {/* Right Column: Hero Image with Floating Badges & Contact Card */}
        <div className="lg:col-span-6 flex flex-col items-end w-full">
          <div className="relative w-full max-w-[540px] aspect-[4/5] rounded-[32px] sm:rounded-[40px] lg:rounded-[44px] overflow-visible shadow-sm mx-auto lg:ml-auto lg:mr-0">
            {/* School Building Image Container */}
            <div className="relative w-full h-full rounded-[32px] sm:rounded-[40px] lg:rounded-[44px] overflow-hidden bg-gray-100">
              <Image
                src="/images/smknegeri2surakarta_cover.webp"
                alt="SMA Kolese De Britto School Building"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 540px"
                className="object-cover"
              />
            </div>

            {/* Floating Badges */}
            <FloatingBadge text="Berprestasi" position="top-right" />
            <FloatingBadge text="Akreditasi Unggul" position="middle-left" />
            <FloatingBadge
              text="Pendidikan Berkualitas"
              position="bottom-right"
            />
          </div>

          {/* Contact Card Pill (Bottom Right) */}
          <div className="w-full max-w-[540px] flex justify-end mt-5 sm:mt-6 pr-2 lg:pr-0 mx-auto lg:ml-auto lg:mr-0">
            <ContactCard
              phone="+62 823-2237-7070"
              avatarSrc="/images/contact-avatar.png"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
