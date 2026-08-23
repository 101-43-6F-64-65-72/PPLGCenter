// Config preset 3D Models available in Supabase Storage ("3d-model" bucket) & Local Assets
export const SUPABASE_STORAGE_3D_BASE_URL =
  "https://rwopazhqgvvrosdizmvt.supabase.co/storage/v1/object/public/3d-model";

export const STORAGE_3D_MODELS = [
  {
    id: "desktop_computer",
    label: "Desktop Computer Workstation",
    category: "Komputer & PC",
    filename: "desktop_computer.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/desktop_computer.glb`,
    localFallback: "/desktop_computer.glb",
    description: "Workstation PC Desktop spesifikasi tinggi untuk Lab Komputer PPLG / TJKT.",
  },
  {
    id: "laptop",
    label: "Laptop / Notebook",
    category: "Komputer & PC",
    filename: "laptop.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/laptop.glb`,
    description: "Laptop portable kejuruan untuk laboratorium dan kegiatan pembelajaran.",
  },
  {
    id: "projector_set",
    label: "Set Proyektor & Layar Presentasi",
    category: "AV & Multimedia",
    filename: "projector_set.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/projector_set.glb`,
    description: "Proyektor LCD Full HD beserta screen layar gantung untuk Aula & Kelas.",
  },
  {
    id: "projector",
    label: "Proyektor LCD Portable",
    category: "AV & Multimedia",
    filename: "projector.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/projector.glb`,
    description: "Unit proyektor portable pendukung ruang rapat & kelas teori.",
  },
  {
    id: "interactive_board",
    label: "Smart Board / Papan Tulis Interaktif",
    category: "AV & Multimedia",
    filename: "interactive_board.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/interactive_board.glb`,
    description: "Layar sentuh interaktif digital modern untuk pembelajaran interaktif.",
  },
  {
    id: "rak_server",
    label: "Rak Server Network Data Center",
    category: "Jaringan & Infrastructure",
    filename: "rak_server.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/rak_server.glb`,
    description: "Cabinet Server Rack standar industri untuk Lab Jaringan & Data Center.",
  },
  {
    id: "router_with_antennas",
    label: "Router Wi-Fi & Access Point Antena",
    category: "Jaringan & Infrastructure",
    filename: "router_with_antennas.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/router_with_antennas.glb`,
    description: "Perangkat jaringan Wi-Fi router multi-antena kecepatan tinggi.",
  },
  {
    id: "cctv",
    label: "Kamera CCTV Pengawas Digital",
    category: "Keamanan & Facility",
    filename: "cctv.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/cctv.glb`,
    description: "Kamera pengawas CCTV IP dome/bullet untuk pemantauan area.",
  },
  {
    id: "apar",
    label: "APAR (Alat Pemadam Api Ringan)",
    category: "Keamanan & Facility",
    filename: "apar.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/apar.glb`,
    description: "Tabung APAR standar keselamatan gedung sekolah.",
  },
  {
    id: "metafactory_ender3",
    label: "3D Printer Ender-3 (Metafactory)",
    category: "Peralatan Praktikum",
    filename: "metafactory_ender3.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/metafactory_ender3.glb`,
    description: "Mesin pencetak 3D FDM untuk pembuatan prototipe hardware & desain produk.",
  },
  {
    id: "lowpoly_printer_hp",
    label: "Printer Laser MFP (HP Laser)",
    category: "Peralatan Kantor",
    filename: "lowpoly_printer_hp_laser_mfp_135w.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/lowpoly_printer_hp_laser_mfp_135w.glb`,
    description: "Printer laser multifungsi untuk pencetakan dokumen & tugas siswa.",
  },
  {
    id: "speakers_low_poly",
    label: "Speaker Audio Sound System",
    category: "AV & Multimedia",
    filename: "speakers_low_poly.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/speakers_low_poly.glb`,
    description: "Perangkat pengeras suara audio untuk Aula dan ruang pertemuan.",
  },
  {
    id: "microphone",
    label: "Microphone Podium / Studio",
    category: "AV & Multimedia",
    filename: "microphone.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/microphone.glb`,
    description: "Mikrofon profesional untuk acara panggung, rapat, & podcast.",
  },
  {
    id: "headset",
    label: "Headset / Headphones Audio",
    category: "AV & Multimedia",
    filename: "headset.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/headset.glb`,
    description: "Headset audio berperedam bising untuk praktikum Lab Bahasa / Multimedia.",
  },
  {
    id: "quest2",
    label: "VR Headset Oculus Meta Quest 2",
    category: "Peralatan Praktikum",
    filename: "quest2-low-poly.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/quest2-low-poly.glb`,
    description: "Kacamata VR Virtual Reality untuk praktikum pengembangan game & AR/VR.",
  },
  {
    id: "ps5_box_disc",
    label: "Konsol Game PlayStation 5",
    category: "Peralatan Praktikum",
    filename: "ps5_box_disc.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/ps5_box_disc.glb`,
    description: "Unit konsol game untuk Lab Game Dev / Ekstrakurikuler E-Sports.",
  },
  {
    id: "nvidia_rtx",
    label: "GPU Workstation High-End (RTX)",
    category: "Komputer & PC",
    filename: "nvidia_geforce_rtx_5070_-_msi_gaming_x_trio.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/nvidia_geforce_rtx_5070_-_msi_gaming_x_trio.glb`,
    description: "Kartu grafis GPU komputasi AI, Game Development, & Animasi 3D.",
  },
  {
    id: "stove_household",
    label: "Kompos & Peralatan Dapur",
    category: "Peralatan Praktikum",
    filename: "stove_-_household_props_challenge.glb",
    url: `${SUPABASE_STORAGE_3D_BASE_URL}/stove_-_household_props_challenge.glb`,
    description: "Peralatan dapur & memasak untuk praktikum Tata Boga / Kuliner.",
  },
];

export const resolve3DModelUrl = (item) => {
  if (!item) return null;
  const rawUrl =
    item.model3dUrl ||
    item.Model3dUrl ||
    item.model3DUrl ||
    item.Model3DUrl ||
    item.model3d_url ||
    item.Model3D_url ||
    item.Model3d_url;

  if (rawUrl && typeof rawUrl === "string") {
    const trimmed = rawUrl.trim();
    if (
      (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) &&
      trimmed.toLowerCase().includes(".glb")
    ) {
      return trimmed;
    }
  }
  return null;
};

export default STORAGE_3D_MODELS;
