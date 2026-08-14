"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "@/lib/motion";

export default function ItemCard({
  title = "BOLA BASKET",
  category = "Olahraga",
  stock = 12,
  status = "tersedia",
  imageSrc = "/images/tempat/lapangansmkn2ska.jpg",
  onActionClick,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const isAvailable = stock > 0 && (status || "").toLowerCase() === "tersedia";

  return (
    <motion.div
      className="relative h-[320px] sm:h-[350px] w-[200px] sm:w-[230px] rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 flex-shrink-0 border border-black/5 bg-gray-900 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered(!isHovered)}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
    >
      {/* Item Image */}
      <Image
        src={imageSrc}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 230px"
      />

      {/* Dark gradient overlay at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300" />

      {/* Default Bottom Content */}
      <div className="absolute inset-x-0 bottom-0 p-5 z-10 flex flex-col justify-end">
        <h3 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight drop-shadow-sm group-hover:text-emerald-300 transition-colors">
          {title}
        </h3>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-medium text-gray-300 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            {stock} unit
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isAvailable
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
            }`}
          >
            {isAvailable ? "Tersedia" : "Kosong"}
          </span>
        </div>
      </div>

      {/* Hover Action Overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 p-5 flex flex-col justify-between"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {category}
              </span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1 leading-tight">
                {title}
              </h3>
              <p className="text-xs text-gray-300 mt-2">
                Stok siap pakai: <strong className="text-white">{stock} unit</strong>
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onActionClick && onActionClick({ title, category, stock, status, imageSrc });
              }}
              className="w-full bg-[#2c1ee8] hover:bg-[#2218a3] active:scale-95 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Pinjam Barang</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
