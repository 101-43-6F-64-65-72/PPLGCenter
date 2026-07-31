import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

const dummyAnnouncements = [
  {
    id: "1",
    title: "Judul Aritikel",
    summary: "Kolese De Britto menyediakan beragam kegiatan ekstrakurikuler yang dirancang untuk mengembangkan potensi siswa di luar kegiatan akademik. Mulai dari bidang olahraga, seni dan budaya...",
    content: "Kolese De Britto menyediakan beragam kegiatan ekstrakurikuler yang dirancang untuk mengembangkan potensi siswa di luar kegiatan akademik. Mulai dari bidang olahraga, seni dan budaya, sains dan teknologi, hingga organisasi, setiap ekstrakurikuler menjadi wadah bagi siswa untuk mengasah bakat, membangun karakter, serta mengembangkan kemampuan kepemimpinan, kerja sama, dan kreativitas. 676767676767\n\nrata kanan kiri ae gen rapi? tetot",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop",
    category: "Olahraga",
    author: "Redaksi Mading Digital",
    createdAt: "2026-07-18T10:00:00Z",
    readTime: "4 Min",
    rating: "4.9 ★",
  },
  {
    id: "2",
    title: "Pameran Robotika AI & Internet of Things Hasil Karya Siswa",
    summary: "Siswa jurusan Teknik Komputer & Jaringan berhasil memamerkan inovasi sistem pertanian pintar berbasis IoT dan kecerdasan buatan dalam ajang TechnoFest 2026.",
    content: "Ajang pameran teknologi tahunan SMKN 2 Surakarta menyedot perhatian ratusan pengunjung. Berbagai inovasi unggulan dipamerkan, mulai dari robot pemilah sampah otomatis, sistem irigasi pintar terintegrasi IoT, hingga platform kecerdasan buatan pemantau cuaca mikro.\n\nKarya-karya ini membuktikan bahwa kualitas lulusan siap bersaing secara langsung di dunia usaha dan dunia industri (DUDI) bereputasi tinggi.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop",
    category: "Sains & Teknologi",
    author: "Tim Lab Robotik",
    createdAt: "2026-07-28T09:30:00Z",
    readTime: "5 Min",
    rating: "5.0 ★",
  },
  {
    id: "3",
    title: "Pentas Seni Nusantara: Memperkuat Karakter dan Seni Budaya",
    summary: "Sanggar Seni Budaya sekolah menggelar pertunjukan tari kolosal tradisional dan teater musik. Acara ini dihadiri oleh tokoh kebudayaan dan alumni senior.",
    content: "Gelar seni budaya nusantara yang berlangsung di aula utama SMKN 2 Surakarta menampilkan keanekaragaman tarian tradisional dari berbagai pelosok Indonesia. Pertunjukan kolosal yang dibawakan oleh lebih dari 50 siswa ekstrakurikuler tari ini memukau seluruh hadirin.\n\nKegiatan ini bertujuan melestarikan warisan budaya bangsa sekaligus mengasah jiwa seni dan kepemimpinan generasi muda.",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop",
    category: "Seni & Budaya",
    author: "Jurnalistik Seni",
    createdAt: "2026-07-25T14:15:00Z",
    readTime: "3 Min",
    rating: "4.8 ★",
  },
  {
    id: "4",
    title: "Musyawarah Kerja OSIS & MPK: Pelantikan Pengurus Periode Baru",
    summary: "Pelantikan resmi pengurus OSIS dan MPK periode 2026/2027 berlangsung khidmat. Program kerja berfokus pada digitalisasi kegiatan siswa.",
    content: "Upacara pelantikan kepengurusan baru OSIS dan MPK dilaksanakan dengan penuh semangat kepemimpinan. Pengurus baru meluncurkan beberapa program unggulan, termasuk penguatan Mading Digital, gerakan peduli lingkungan sekolah, serta pelatihan kewirausahaan siswa.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop",
    category: "Organisasi",
    author: "Humas OSIS",
    createdAt: "2026-07-22T08:00:00Z",
    readTime: "4 Min",
    rating: "4.7 ★",
  },
];

export const announcementService = {
  async getAnnouncements(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.pageSize) queryParams.append("pageSize", params.pageSize);
    if (params.category && params.category !== "Semua") queryParams.append("category", params.category);
    if (params.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ROUTES.ANNOUNCEMENTS.LIST}?${queryString}`
      : API_ROUTES.ANNOUNCEMENTS.LIST;

    try {
      const response = await apiClient.get(endpoint);
      if (response && response.data && response.data.length > 0) {
        return response;
      }
    } catch (error) {
      // Ignore API errors for UI preview mode
    }

    // Dummy preview fallback for UI testing
    let filtered = dummyAnnouncements;
    if (params.category && params.category !== "Semua") {
      filtered = filtered.filter(
        (item) => item.category.toLowerCase() === params.category.toLowerCase()
      );
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      statusCode: 200,
      message: "Success (Dummy Preview Mode)",
      data: filtered,
      meta: {
        page: Number(params.page) || 1,
        pageSize: Number(params.pageSize) || 10,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / (Number(params.pageSize) || 10)),
      },
    };
  },

  async getAnnouncementById(id) {
    try {
      const response = await apiClient.get(API_ROUTES.ANNOUNCEMENTS.DETAIL(id));
      if (response && response.data) {
        return response;
      }
    } catch (error) {
      // Ignore API errors for UI preview mode
    }

    const found = dummyAnnouncements.find((item) => String(item.id) === String(id)) || dummyAnnouncements[0];

    return {
      success: true,
      statusCode: 200,
      message: "Success (Dummy Detail Mode)",
      data: found,
    };
  },
};

export default announcementService;
