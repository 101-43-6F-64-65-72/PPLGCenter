// Alokasi Jam Pembelajaran SMKN 2 Surakarta

export const SCHEDULE_MODES = {
  NORMAL: "normal", // Mode Senin - Kamis Normal
  UPACARA: "upacara", // Mode Khusus Hari Upacara
};

export const TIME_SLOTS_NORMAL = [
  { period: 1, time: "07.00 - 07.45", type: "class" },
  { period: 2, time: "07.45 - 08.30", type: "class" },
  { period: 3, time: "08.30 - 09.15", type: "class" },
  { period: 4, time: "09.15 - 10.00", type: "class" },
  { period: null, label: "ISTIRAHAT 1", time: "10.00 - 10.15", type: "break" },
  { period: 5, time: "10.15 - 11.00", type: "class" },
  { period: 6, time: "11.00 - 11.45", type: "class" },
  { period: null, label: "ISTIRAHAT ISHOMA", time: "11.45 - 12.15", type: "break" },
  { period: 7, time: "12.15 - 13.00", type: "class" },
  { period: 8, time: "13.00 - 13.45", type: "class" },
  { period: 9, time: "13.45 - 14.30", type: "class" },
  { period: 10, time: "14.30 - 15.15", type: "class" },
  { period: null, label: "ISTIRAHAT SORE", time: "15.15 - 15.30", type: "break" },
  { period: 11, time: "15.30 - 16.15", type: "class" },
  { period: 12, time: "16.15 - 17.00", type: "class" },
];

export const TIME_SLOTS_UPACARA = [
  { period: null, label: "UPACARA BENDERA", time: "07.00 - 08.00", type: "ceremony" },
  { period: 1, time: "08.00 - 08.35", type: "class" },
  { period: 2, time: "08.35 - 09.10", type: "class" },
  { period: 3, time: "09.10 - 09.45", type: "class" },
  { period: null, label: "ISTIRAHAT 1", time: "09.45 - 10.00", type: "break" },
  { period: 4, time: "10.00 - 10.35", type: "class" },
  { period: 5, time: "10.35 - 11.10", type: "class" },
  { period: 6, time: "11.10 - 11.45", type: "class" },
  { period: null, label: "ISTIRAHAT ISHOMA", time: "11.45 - 12.15", type: "break" },
  { period: 7, time: "12.15 - 12.50", type: "class" },
  { period: 8, time: "12.50 - 13.25", type: "class" },
  { period: 9, time: "13.25 - 14.00", type: "class" },
  { period: 10, time: "14.00 - 14.35", type: "class" },
  { period: null, label: "ISTIRAHAT SORE", time: "14.35 - 14.50", type: "break" },
  { period: 11, time: "14.50 - 15.25", type: "class" },
  { period: 12, time: "15.25 - 16.00", type: "class" },
];

export const TIME_SLOTS_JUMAT = [
  { period: null, label: "PENGEMBANGAN KARAKTER", time: "07.00 - 08.15", type: "character" },
  { period: 1, time: "08.15 - 08.45", type: "class" },
  { period: 2, time: "08.45 - 09.15", type: "class" },
  { period: 3, time: "09.15 - 09.45", type: "class" },
  { period: null, label: "ISTIRAHAT 1", time: "09.45 - 10.00", type: "break" },
  { period: 4, time: "10.00 - 10.30", type: "class" },
  { period: 5, time: "10.30 - 11.00", type: "class" },
  { period: 6, time: "11.00 - 11.30", type: "class" },
  { period: null, label: "SHOLAT JUMAT & ISHOMA", time: "11.30 - 12.30", type: "break" },
  { period: 7, time: "12.30 - 13.00", type: "class" },
  { period: 8, time: "13.00 - 13.30", type: "class" },
  { period: 9, time: "13.30 - 14.00", type: "class" },
  { period: 10, time: "14.00 - 14.30", type: "class" },
  { period: null, label: "ISTIRAHAT SORE", time: "14.30 - 14.45", type: "break" },
  { period: 11, time: "14.45 - 15.15", type: "class" },
  { period: 12, time: "15.15 - 15.45", type: "class" },
];
