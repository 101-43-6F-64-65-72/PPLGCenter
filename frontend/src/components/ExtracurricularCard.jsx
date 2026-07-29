import Image from "next/image";
import PrimaryButton from "./PrimaryButton";

export default function ExtracurricularCard({ imageSrc, alt = "Ekstrakurikuler" }) {
  return (
    <div className="relative rounded-[32px] overflow-hidden border border-gray-200 shadow-sm bg-white">
      <div className="relative h-72 sm:h-80">
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className="object-cover"
        />
      </div>

      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
        <div className="w-full sm:w-auto">
          <PrimaryButton text="dummy" />
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}
