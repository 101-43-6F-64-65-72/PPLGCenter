import React from "react";
import Image from "next/image";
import PrimaryButton from "./PrimaryButton";
import FloatingBadge from "./FloatingBadge";
import ContactCard from "./ContactCard";

export default function Hero() {
  return (
    <section id="home" className="w-full bg-white snap-start snap-always min-h-[calc(80vh-5rem)] flex items-center py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column: Heading, Subtitle & CTA */}
        <div className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-5">
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-black leading-[1.05] mb-5">
            SMK Pusat Keunggulan
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-gray-800 leading-7 mb-8 max-w-2xl">
            {
              "Program pengembangan sekolah kejuruan untuk menghasilkan lulusan yang kompeten dan siap kerja melalui penyelarasan mendalam antara kurikulum sekolah dengan kebutuhan dunia usaha, dunia industri, dan dunia kerja (DUDI)"
            }
          </p>

          <PrimaryButton text="Jelajahi" />
        </div>

        {/* Right Column: Hero Image with Floating Badges & Contact Card */}
        <div className="lg:col-span-6 flex flex-col items-end w-full">
          <div className="relative w-full max-w-[480px] aspect-[4/5] rounded-[28px] sm:rounded-[32px] lg:rounded-[36px] overflow-visible shadow-sm mx-auto lg:ml-auto lg:mr-0">
            {/* School Building Image Container */}
            <div className="relative w-full h-full rounded-[28px] sm:rounded-[32px] lg:rounded-[36px] overflow-hidden bg-gray-100">
              <Image
                src="/images/smknegeri2surakarta_cover.webp"
                alt="SMA Kolese De Britto School Building"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 480px"
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
          <div className="w-full max-w-[480px] flex justify-end mt-4 sm:mt-5 pr-2 lg:pr-0 mx-auto lg:ml-auto lg:mr-0">
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
