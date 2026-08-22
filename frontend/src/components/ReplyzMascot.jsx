"use client";

import React, { useState, useEffect } from "react";
import BloubMascot, { mascotVariants, MASCOT_SKINS, MASCOT_ACCESSORIES } from "./BloubMascot";

/**
 * Custom React Hook to manage and subscribe to global Replyz Mascot Customization configuration
 */
export function useMascotConfig() {
  const [skin, setSkin] = useState("default");
  const [accessory, setAccessory] = useState("none");

  useEffect(() => {
    const loadConfig = () => {
      if (typeof window !== "undefined") {
        setSkin(localStorage.getItem("sc_mascot_skin") || "default");
        setAccessory(localStorage.getItem("sc_mascot_accessory") || "none");
      }
    };

    loadConfig();

    const handleUpdate = () => loadConfig();
    if (typeof window !== "undefined") {
      window.addEventListener("app:mascot-customization-updated", handleUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("app:mascot-customization-updated", handleUpdate);
      }
    };
  }, []);

  const updateConfig = (newSkin, newAccessory) => {
    if (typeof window !== "undefined") {
      if (newSkin) {
        localStorage.setItem("sc_mascot_skin", newSkin);
        setSkin(newSkin);
      }
      if (newAccessory) {
        localStorage.setItem("sc_mascot_accessory", newAccessory);
        setAccessory(newAccessory);
      }
      window.dispatchEvent(new CustomEvent("app:mascot-customization-updated"));
    }
  };

  return { skin, accessory, updateConfig };
}

/**
 * Unified ReplyzMascot Component
 * Wraps base vector renderer, accessories layer, emotion spring physics, and gaze morphing.
 */
export function ReplyzMascot(props) {
  return <BloubMascot {...props} />;
}

export { mascotVariants, MASCOT_SKINS, MASCOT_ACCESSORIES };
export default ReplyzMascot;
