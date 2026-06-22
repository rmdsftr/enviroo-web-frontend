import type { KontribusiNasabahItem, KontribusiNasabahResponse, StatistikSetoranItem, StatistikSetoranResponse } from "../services/statistik.service";
import type { PenjualanSampahItem, PenjualanSampahResponse, MasukSampahItem, MasukSampahResponse } from "../types/statistik.type";

const BANK_ID = "bank-001";
const NAMA_BANK = "Bank Sampah Induk Kota";

export const mockKontribusiNasabahItems: KontribusiNasabahItem[] = [
    { nasabah_id: "n-001", nama_nasabah: "Siti Rahayu",         bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 48, total_kg: 312.5,  total_pcs: 1840, total_liter: 95.0  },
    { nasabah_id: "n-002", nama_nasabah: "Budi Santoso",        bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 42, total_kg: 278.0,  total_pcs: 1560, total_liter: 82.5  },
    { nasabah_id: "n-003", nama_nasabah: "Dewi Kurniawati",     bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 39, total_kg: 251.3,  total_pcs: 2100, total_liter: 67.0  },
    { nasabah_id: "n-004", nama_nasabah: "Agus Prasetyo",       bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 36, total_kg: 234.8,  total_pcs: 980,  total_liter: 110.5 },
    { nasabah_id: "n-005", nama_nasabah: "Rina Wulandari",      bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 35, total_kg: 198.0,  total_pcs: 1320, total_liter: 55.0  },
    { nasabah_id: "n-006", nama_nasabah: "Hendra Wijaya",       bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 33, total_kg: 185.5,  total_pcs: 1750, total_liter: 48.0  },
    { nasabah_id: "n-007", nama_nasabah: "Yuli Astuti",         bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 31, total_kg: 172.0,  total_pcs: 890,  total_liter: 72.5  },
    { nasabah_id: "n-008", nama_nasabah: "Fajar Nugroho",       bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 29, total_kg: 159.3,  total_pcs: 1100, total_liter: 43.0  },
    { nasabah_id: "n-009", nama_nasabah: "Sri Wahyuni",         bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 27, total_kg: 143.7,  total_pcs: 2400, total_liter: 30.0  },
    { nasabah_id: "n-010", nama_nasabah: "Doni Firmansyah",     bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 25, total_kg: 128.5,  total_pcs: 760,  total_liter: 61.0  },
    { nasabah_id: "n-011", nama_nasabah: "Ani Susanti",         bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 24, total_kg: 115.0,  total_pcs: 630,  total_liter: 88.0  },
    { nasabah_id: "n-012", nama_nasabah: "Wahyu Hidayat",       bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 22, total_kg: 108.2,  total_pcs: 1430, total_liter: 27.5  },
    { nasabah_id: "n-013", nama_nasabah: "Lestari Ningrum",     bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 21, total_kg: 97.5,   total_pcs: 520,  total_liter: 54.0  },
    { nasabah_id: "n-014", nama_nasabah: "Rudi Hermawan",       bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 20, total_kg: 91.0,   total_pcs: 870,  total_liter: 39.0  },
    { nasabah_id: "n-015", nama_nasabah: "Endang Suryani",      bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 19, total_kg: 84.4,   total_pcs: 390,  total_liter: 101.0 },
    { nasabah_id: "n-016", nama_nasabah: "Teguh Prabowo",       bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 18, total_kg: 79.8,   total_pcs: 1200, total_liter: 22.0  },
    { nasabah_id: "n-017", nama_nasabah: "Mira Handayani",      bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 17, total_kg: 73.1,   total_pcs: 460,  total_liter: 47.5  },
    { nasabah_id: "n-018", nama_nasabah: "Eko Purnomo",         bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 16, total_kg: 68.5,   total_pcs: 310,  total_liter: 64.0  },
    { nasabah_id: "n-019", nama_nasabah: "Fitri Rahmawati",     bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 15, total_kg: 62.0,   total_pcs: 980,  total_liter: 18.0  },
    { nasabah_id: "n-020", nama_nasabah: "Supriyanto",          bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 14, total_kg: 57.3,   total_pcs: 240,  total_liter: 35.5  },
    { nasabah_id: "n-021", nama_nasabah: "Nurul Hidayah",       bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 13, total_kg: 51.8,   total_pcs: 720,  total_liter: 29.0  },
    { nasabah_id: "n-022", nama_nasabah: "Bambang Setiawan",    bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 12, total_kg: 46.2,   total_pcs: 185,  total_liter: 52.0  },
    { nasabah_id: "n-023", nama_nasabah: "Ratna Dewi",          bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 11, total_kg: 41.5,   total_pcs: 560,  total_liter: 14.0  },
    { nasabah_id: "n-024", nama_nasabah: "Irfan Maulana",       bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 10, total_kg: 37.0,   total_pcs: 140,  total_liter: 41.0  },
    { nasabah_id: "n-025", nama_nasabah: "Diah Permatasari",    bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 9,  total_kg: 32.4,   total_pcs: 430,  total_liter: 10.5  },
    { nasabah_id: "n-026", nama_nasabah: "Gunawan Susilo",      bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 8,  total_kg: 28.1,   total_pcs: 95,   total_liter: 28.0  },
    { nasabah_id: "n-027", nama_nasabah: "Kartika Sari",        bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 7,  total_kg: 23.6,   total_pcs: 310,  total_liter: 7.5   },
    { nasabah_id: "n-028", nama_nasabah: "Hendro Kusumo",       bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 6,  total_kg: 18.9,   total_pcs: 70,   total_liter: 19.0  },
    { nasabah_id: "n-029", nama_nasabah: "Aisyah Putri",        bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 5,  total_kg: 14.2,   total_pcs: 195,  total_liter: 5.0   },
    { nasabah_id: "n-030", nama_nasabah: "Wibowo Prasetya",     bank_id: BANK_ID, nama_bank: NAMA_BANK, jumlah_setoran: 4,  total_kg: 9.5,    total_pcs: 45,   total_liter: 12.0  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tren Penjualan Sampah
// ─────────────────────────────────────────────────────────────────────────────

export const mockPenjualanSampahItems: PenjualanSampahItem[] = [
    // ── Reward Uang (satuan_nilai: "Rp") ──────────────────────────────────────
    { sampah_id: "s-001", nama_sampah: "Kardus / Karton",           satuan: "kg",  kategori: "Kertas",     jenis_reward: "uang",    total_qty: 842.5,  total_nilai: 2_527_500, satuan_nilai: "Rp" },
    { sampah_id: "s-002", nama_sampah: "Koran Bekas",               satuan: "kg",  kategori: "Kertas",     jenis_reward: "uang",    total_qty: 410.0,  total_nilai: 1_025_000, satuan_nilai: "Rp" },
    { sampah_id: "s-003", nama_sampah: "Botol PET Bening",          satuan: "kg",  kategori: "Plastik",    jenis_reward: "uang",    total_qty: 635.0,  total_nilai: 1_905_000, satuan_nilai: "Rp" },
    { sampah_id: "s-004", nama_sampah: "Botol PET Warna",           satuan: "kg",  kategori: "Plastik",    jenis_reward: "uang",    total_qty: 298.5,  total_nilai:   746_250, satuan_nilai: "Rp" },
    { sampah_id: "s-005", nama_sampah: "Plastik HDPE (Ember/Pipa)", satuan: "kg",  kategori: "Plastik",    jenis_reward: "uang",    total_qty: 184.0,  total_nilai:   552_000, satuan_nilai: "Rp" },
    { sampah_id: "s-006", nama_sampah: "Kantong Kresek Campur",     satuan: "kg",  kategori: "Plastik",    jenis_reward: "uang",    total_qty:  96.0,  total_nilai:   192_000, satuan_nilai: "Rp" },
    { sampah_id: "s-007", nama_sampah: "Besi / Baja Bekas",         satuan: "kg",  kategori: "Logam",      jenis_reward: "uang",    total_qty: 512.0,  total_nilai: 3_072_000, satuan_nilai: "Rp" },
    { sampah_id: "s-008", nama_sampah: "Aluminium (Kaleng)",        satuan: "kg",  kategori: "Logam",      jenis_reward: "uang",    total_qty: 178.5,  total_nilai: 3_213_000, satuan_nilai: "Rp" },
    { sampah_id: "s-009", nama_sampah: "Tembaga",                   satuan: "kg",  kategori: "Logam",      jenis_reward: "uang",    total_qty:  34.2,  total_nilai: 2_394_000, satuan_nilai: "Rp" },
    { sampah_id: "s-010", nama_sampah: "Botol Kaca Bening",         satuan: "pcs", kategori: "Kaca",       jenis_reward: "uang",    total_qty: 920.0,  total_nilai:   460_000, satuan_nilai: "Rp" },
    { sampah_id: "s-011", nama_sampah: "Botol Kaca Warna",          satuan: "pcs", kategori: "Kaca",       jenis_reward: "uang",    total_qty: 430.0,  total_nilai:   172_000, satuan_nilai: "Rp" },
    { sampah_id: "s-012", nama_sampah: "Minyak Jelantah",           satuan: "liter", kategori: "Minyak",   jenis_reward: "uang",    total_qty: 310.0,  total_nilai:   620_000, satuan_nilai: "Rp" },
    { sampah_id: "s-013", nama_sampah: "Elektronik Kecil (PCB)",    satuan: "kg",  kategori: "Elektronik", jenis_reward: "uang",    total_qty:  22.8,  total_nilai:   684_000, satuan_nilai: "Rp" },
    { sampah_id: "s-014", nama_sampah: "Buku / Majalah",            satuan: "kg",  kategori: "Kertas",     jenis_reward: "uang",    total_qty: 256.0,  total_nilai:   512_000, satuan_nilai: "Rp" },
    { sampah_id: "s-015", nama_sampah: "Tetrapak / Karton Minuman", satuan: "kg",  kategori: "Kertas",     jenis_reward: "uang",    total_qty: 112.5,  total_nilai:   225_000, satuan_nilai: "Rp" },
    { sampah_id: "s-016", nama_sampah: "Kabel Listrik Bekas",       satuan: "kg",  kategori: "Logam",      jenis_reward: "uang",    total_qty:  48.0,  total_nilai:   720_000, satuan_nilai: "Rp" },
    { sampah_id: "s-017", nama_sampah: "Aki Bekas",                 satuan: "pcs", kategori: "Elektronik", jenis_reward: "uang",    total_qty:  64.0,  total_nilai: 1_280_000, satuan_nilai: "Rp" },

    // ── Reward Sembako (satuan_nilai: "poin") ─────────────────────────────────
    { sampah_id: "s-018", nama_sampah: "Sampah Organik Dapur",      satuan: "kg",  kategori: "Organik",    jenis_reward: "sembako", total_qty: 1240.0, total_nilai:  6_200,    satuan_nilai: "poin" },
    { sampah_id: "s-019", nama_sampah: "Daun & Ranting Kering",     satuan: "kg",  kategori: "Organik",    jenis_reward: "sembako", total_qty:  875.0, total_nilai:  3_500,    satuan_nilai: "poin" },
    { sampah_id: "s-020", nama_sampah: "Styrofoam",                 satuan: "kg",  kategori: "Plastik",    jenis_reward: "sembako", total_qty:  320.0, total_nilai:  1_600,    satuan_nilai: "poin" },
    { sampah_id: "s-021", nama_sampah: "Pakaian Bekas Layak Pakai", satuan: "pcs", kategori: "Tekstil",    jenis_reward: "sembako", total_qty:  540.0, total_nilai:  5_400,    satuan_nilai: "poin" },
    { sampah_id: "s-022", nama_sampah: "Kain Perca",                satuan: "kg",  kategori: "Tekstil",    jenis_reward: "sembako", total_qty:  198.0, total_nilai:  1_980,    satuan_nilai: "poin" },
    { sampah_id: "s-023", nama_sampah: "Baterai Bekas",             satuan: "pcs", kategori: "Elektronik", jenis_reward: "sembako", total_qty: 2100.0, total_nilai:  4_200,    satuan_nilai: "poin" },
    { sampah_id: "s-024", nama_sampah: "Lampu Bekas (CFL/LED)",     satuan: "pcs", kategori: "Elektronik", jenis_reward: "sembako", total_qty:  480.0, total_nilai:  2_400,    satuan_nilai: "poin" },
    { sampah_id: "s-025", nama_sampah: "Kardus Tipis / Kotak Susu", satuan: "kg",  kategori: "Kertas",     jenis_reward: "sembako", total_qty:  290.0, total_nilai:  1_450,    satuan_nilai: "poin" },
];

export function getMockPenjualanSampah(): PenjualanSampahResponse {
    return {
        bank: { bank_id: BANK_ID, nama_bank: NAMA_BANK, jenis_bank: "BSI" },
        data: mockPenjualanSampahItems,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Statistik Setoran Sampah
// ─────────────────────────────────────────────────────────────────────────────
// 10 kategori × campuran satuan (kg/pcs/liter) × campuran reward (uang/sembako)
// Tujuan: stress-test semua view grafik (Per Kategori / Per Jenis Reward / Per Satuan)

export const mockSetoranSampahItems: StatistikSetoranItem[] = [
    // ── Kertas (kg · uang) ───────────────────────────────────────────────────
    { sampah_id: "ss-001", nama_sampah: "Kardus / Karton",           satuan: "kg",    kategori: "Kertas",     jenis_reward: "uang",    total_qty: 842.5  },
    { sampah_id: "ss-002", nama_sampah: "Koran Bekas",               satuan: "kg",    kategori: "Kertas",     jenis_reward: "uang",    total_qty: 410.0  },
    { sampah_id: "ss-003", nama_sampah: "Buku / Majalah",            satuan: "kg",    kategori: "Kertas",     jenis_reward: "uang",    total_qty: 256.0  },
    { sampah_id: "ss-004", nama_sampah: "Tetrapak / Karton Minuman", satuan: "kg",    kategori: "Kertas",     jenis_reward: "uang",    total_qty: 112.5  },

    // ── Plastik (kg · campuran) ───────────────────────────────────────────────
    { sampah_id: "ss-005", nama_sampah: "Botol PET Bening",          satuan: "kg",    kategori: "Plastik",    jenis_reward: "uang",    total_qty: 635.0  },
    { sampah_id: "ss-006", nama_sampah: "Botol PET Warna",           satuan: "kg",    kategori: "Plastik",    jenis_reward: "uang",    total_qty: 298.5  },
    { sampah_id: "ss-007", nama_sampah: "Plastik HDPE (Ember/Pipa)", satuan: "kg",    kategori: "Plastik",    jenis_reward: "uang",    total_qty: 184.0  },
    { sampah_id: "ss-008", nama_sampah: "Kantong Kresek Campur",     satuan: "kg",    kategori: "Plastik",    jenis_reward: "uang",    total_qty:  96.0  },
    { sampah_id: "ss-009", nama_sampah: "Styrofoam",                 satuan: "kg",    kategori: "Plastik",    jenis_reward: "sembako", total_qty:  43.5  },

    // ── Logam (kg · uang) ────────────────────────────────────────────────────
    { sampah_id: "ss-010", nama_sampah: "Besi / Baja Bekas",         satuan: "kg",    kategori: "Logam",      jenis_reward: "uang",    total_qty: 512.0  },
    { sampah_id: "ss-011", nama_sampah: "Aluminium (Kaleng)",        satuan: "kg",    kategori: "Logam",      jenis_reward: "uang",    total_qty: 178.5  },
    { sampah_id: "ss-012", nama_sampah: "Tembaga",                   satuan: "kg",    kategori: "Logam",      jenis_reward: "uang",    total_qty:  34.2  },
    { sampah_id: "ss-013", nama_sampah: "Kabel Listrik Bekas",       satuan: "kg",    kategori: "Logam",      jenis_reward: "uang",    total_qty:  48.0  },

    // ── Kaca (pcs · uang) ────────────────────────────────────────────────────
    { sampah_id: "ss-014", nama_sampah: "Botol Kaca Bening",         satuan: "pcs",   kategori: "Kaca",       jenis_reward: "uang",    total_qty: 920.0  },
    { sampah_id: "ss-015", nama_sampah: "Botol Kaca Warna",          satuan: "pcs",   kategori: "Kaca",       jenis_reward: "uang",    total_qty: 430.0  },
    { sampah_id: "ss-016", nama_sampah: "Kaca Jendela Pecah",        satuan: "pcs",   kategori: "Kaca",       jenis_reward: "uang",    total_qty: 185.0  },

    // ── Organik (kg · sembako) ───────────────────────────────────────────────
    { sampah_id: "ss-017", nama_sampah: "Sampah Organik Dapur",      satuan: "kg",    kategori: "Organik",    jenis_reward: "sembako", total_qty: 1240.0 },
    { sampah_id: "ss-018", nama_sampah: "Daun & Ranting Kering",     satuan: "kg",    kategori: "Organik",    jenis_reward: "sembako", total_qty:  875.0 },

    // ── Elektronik (pcs · campuran) ──────────────────────────────────────────
    { sampah_id: "ss-019", nama_sampah: "Aki Bekas",                 satuan: "pcs",   kategori: "Elektronik", jenis_reward: "uang",    total_qty:  64.0  },
    { sampah_id: "ss-020", nama_sampah: "Baterai Bekas",             satuan: "pcs",   kategori: "Elektronik", jenis_reward: "sembako", total_qty: 2100.0 },
    { sampah_id: "ss-021", nama_sampah: "Lampu Bekas (CFL/LED)",     satuan: "pcs",   kategori: "Elektronik", jenis_reward: "sembako", total_qty:  480.0 },
    { sampah_id: "ss-022", nama_sampah: "Elektronik Kecil (PCB)",    satuan: "kg",    kategori: "Elektronik", jenis_reward: "uang",    total_qty:  22.8  },

    // ── Tekstil (kg · sembako) ───────────────────────────────────────────────
    { sampah_id: "ss-023", nama_sampah: "Pakaian Bekas Layak Pakai", satuan: "kg",    kategori: "Tekstil",    jenis_reward: "sembako", total_qty: 198.0  },
    { sampah_id: "ss-024", nama_sampah: "Kain Perca",                satuan: "kg",    kategori: "Tekstil",    jenis_reward: "sembako", total_qty:  87.5  },

    // ── Minyak (liter · uang) ────────────────────────────────────────────────
    { sampah_id: "ss-025", nama_sampah: "Minyak Jelantah",           satuan: "liter", kategori: "Minyak",     jenis_reward: "uang",    total_qty: 310.0  },
    { sampah_id: "ss-026", nama_sampah: "Oli Bekas",                 satuan: "liter", kategori: "Minyak",     jenis_reward: "uang",    total_qty:  92.0  },

    // ── Karet (kg · sembako) ─────────────────────────────────────────────────
    { sampah_id: "ss-027", nama_sampah: "Ban Bekas Potongan",        satuan: "kg",    kategori: "Karet",      jenis_reward: "sembako", total_qty: 320.0  },
    { sampah_id: "ss-028", nama_sampah: "Sandal / Sepatu Rusak",     satuan: "kg",    kategori: "Karet",      jenis_reward: "sembako", total_qty:  74.0  },

    // ── Kayu (kg · sembako) ──────────────────────────────────────────────────
    { sampah_id: "ss-029", nama_sampah: "Kayu / Triplek Bekas",      satuan: "kg",    kategori: "Kayu",       jenis_reward: "sembako", total_qty: 450.0  },
    { sampah_id: "ss-030", nama_sampah: "Palet Kayu Rusak",          satuan: "kg",    kategori: "Kayu",       jenis_reward: "sembako", total_qty: 210.0  },
];

export function getMockSetoranSampah(): StatistikSetoranResponse {
    return {
        message: "success",
        bank: { bank_id: BANK_ID, nama_bank: NAMA_BANK, jenis_bank: "BSI" },
        data: mockSetoranSampahItems,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sampah Masuk (MasukSampahSection)
// ─────────────────────────────────────────────────────────────────────────────

export const mockMasukSampahItems: MasukSampahItem[] = [
    { sampah_id: "m-001", nama_sampah: "Kardus / Karton",            satuan: "kg",    kategori: "Kertas",     total_masuk: 842.5,   stok_tersisa: 210.0  },
    { sampah_id: "m-002", nama_sampah: "Botol PET Bening",           satuan: "kg",    kategori: "Plastik",    total_masuk: 635.0,   stok_tersisa: 180.5  },
    { sampah_id: "m-003", nama_sampah: "Besi / Baja Bekas",          satuan: "kg",    kategori: "Logam",      total_masuk: 512.0,   stok_tersisa: 95.0   },
    { sampah_id: "m-004", nama_sampah: "Koran Bekas",                satuan: "kg",    kategori: "Kertas",     total_masuk: 410.0,   stok_tersisa: 310.0  },
    { sampah_id: "m-005", nama_sampah: "Botol Kaca Bening",          satuan: "pcs",   kategori: "Kaca",       total_masuk: 920.0,   stok_tersisa: 540.0  },
    { sampah_id: "m-006", nama_sampah: "Aluminium (Kaleng)",         satuan: "kg",    kategori: "Logam",      total_masuk: 178.5,   stok_tersisa: 178.5  },
    { sampah_id: "m-007", nama_sampah: "Sampah Organik Dapur",       satuan: "kg",    kategori: "Organik",    total_masuk: 1240.0,  stok_tersisa: 0.0    },
    { sampah_id: "m-008", nama_sampah: "Minyak Jelantah",            satuan: "liter", kategori: "Minyak",     total_masuk: 310.0,   stok_tersisa: 122.0  },
    { sampah_id: "m-009", nama_sampah: "Botol PET Warna",            satuan: "kg",    kategori: "Plastik",    total_masuk: 298.5,   stok_tersisa: 47.0   },
    { sampah_id: "m-010", nama_sampah: "Buku / Majalah",             satuan: "kg",    kategori: "Kertas",     total_masuk: 256.0,   stok_tersisa: 130.0  },
    { sampah_id: "m-011", nama_sampah: "Baterai Bekas",              satuan: "pcs",   kategori: "Elektronik", total_masuk: 2100.0,  stok_tersisa: 2100.0 },
    { sampah_id: "m-012", nama_sampah: "Daun & Ranting Kering",      satuan: "kg",    kategori: "Organik",    total_masuk: 875.0,   stok_tersisa: 0.0    },
    { sampah_id: "m-013", nama_sampah: "Ban Bekas Potongan",         satuan: "kg",    kategori: "Karet",      total_masuk: 320.0,   stok_tersisa: 320.0  },
    { sampah_id: "m-014", nama_sampah: "Plastik HDPE (Ember/Pipa)",  satuan: "kg",    kategori: "Plastik",    total_masuk: 184.0,   stok_tersisa: 60.0   },
    { sampah_id: "m-015", nama_sampah: "Pakaian Bekas Layak Pakai",  satuan: "pcs",   kategori: "Tekstil",    total_masuk: 540.0,   stok_tersisa: 215.0  },
    { sampah_id: "m-016", nama_sampah: "Botol Kaca Warna",           satuan: "pcs",   kategori: "Kaca",       total_masuk: 430.0,   stok_tersisa: 190.0  },
    { sampah_id: "m-017", nama_sampah: "Kayu / Triplek Bekas",       satuan: "kg",    kategori: "Kayu",       total_masuk: 450.0,   stok_tersisa: 450.0  },
    { sampah_id: "m-018", nama_sampah: "Tembaga",                    satuan: "kg",    kategori: "Logam",      total_masuk:  34.2,   stok_tersisa:  12.0  },
    { sampah_id: "m-019", nama_sampah: "Lampu Bekas (CFL/LED)",      satuan: "pcs",   kategori: "Elektronik", total_masuk: 480.0,   stok_tersisa: 480.0  },
    { sampah_id: "m-020", nama_sampah: "Kantong Kresek Campur",      satuan: "kg",    kategori: "Plastik",    total_masuk:  96.0,   stok_tersisa:  15.0  },
    { sampah_id: "m-021", nama_sampah: "Aki Bekas",                  satuan: "pcs",   kategori: "Elektronik", total_masuk:  64.0,   stok_tersisa:  64.0  },
    { sampah_id: "m-022", nama_sampah: "Tetrapak / Karton Minuman",  satuan: "kg",    kategori: "Kertas",     total_masuk: 112.5,   stok_tersisa:  88.0  },
    { sampah_id: "m-023", nama_sampah: "Oli Bekas",                  satuan: "liter", kategori: "Minyak",     total_masuk:  92.0,   stok_tersisa:  30.0  },
    { sampah_id: "m-024", nama_sampah: "Kain Perca",                 satuan: "kg",    kategori: "Tekstil",    total_masuk: 198.0,   stok_tersisa:  75.0  },
    { sampah_id: "m-025", nama_sampah: "Kabel Listrik Bekas",        satuan: "kg",    kategori: "Logam",      total_masuk:  48.0,   stok_tersisa:  48.0  },
];

export function getMockMasukSampah(): MasukSampahResponse {
    return {
        bank: { bank_id: BANK_ID, nama_bank: NAMA_BANK },
        data: mockMasukSampahItems,
    };
}

/** Helper: ambil 1 halaman mock data (10 per halaman, 3 halaman total) */
export function getMockKontribusiPage(page: number): KontribusiNasabahResponse {
    const LIMIT = 10;
    const start = (page - 1) * LIMIT;
    const pageData = mockKontribusiNasabahItems.slice(start, start + LIMIT);

    return {
        message: "success",
        bank: { bank_id: BANK_ID, nama_bank: NAMA_BANK, jenis_bank: "BSI" },
        sort_by: "setoran",
        totals: {
            total_kg:    mockKontribusiNasabahItems.reduce((s, i) => s + i.total_kg, 0),
            total_pcs:   mockKontribusiNasabahItems.reduce((s, i) => s + i.total_pcs, 0),
            total_liter: mockKontribusiNasabahItems.reduce((s, i) => s + i.total_liter, 0),
        },
        pagination: {
            page,
            limit: LIMIT,
            total: mockKontribusiNasabahItems.length,
            total_pages: Math.ceil(mockKontribusiNasabahItems.length / LIMIT),
        },
        data: pageData,
    };
}
