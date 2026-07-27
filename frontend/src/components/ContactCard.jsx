import React from 'react';
import Image from 'next/image';

export default function ContactCard({ phone = "+62 823-2237-7070", avatarSrc = "/images/contact-avatar.png" }) {
  return (
    <div className="inline-flex items-center gap-3 lg:gap-4 bg-white border-2 border-[#00B929] rounded-full pl-6 pr-1.5 py-1.5 shadow-sm select-none">
      <span className="text-[#00B929] font-bold text-base sm:text-lg lg:text-xl tracking-tight">
        {phone}
      </span>
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
        <Image
          src={avatarSrc}
          alt="Contact Profile Avatar"
          fill
          sizes="44px"
          className="object-cover"
        />
      </div>
    </div>
  );
}
