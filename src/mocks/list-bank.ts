import type { UnitBSI, GetUnitBSIPagedResponse } from "../types/bsi.type";

const LIMIT = 15;

export const mockUnitBSIList: UnitBSI[] = [
    { BankID: "bsu-001", NamaBank: "BSU Anggrek Kelurahan Tegal Sari",     PhotoURL: "", jumlah_nasabah: 142, jumlah_staff: 4, IsActive: true  },
    { BankID: "bsu-002", NamaBank: "BSU Bersih Bersama RW 03",             PhotoURL: "", jumlah_nasabah:  98, jumlah_staff: 3, IsActive: true  },
    { BankID: "bsu-003", NamaBank: "BSU Cempaka Putih Mandiri",            PhotoURL: "", jumlah_nasabah: 207, jumlah_staff: 6, IsActive: true  },
    { BankID: "bsu-004", NamaBank: "BSU Dahlia Indah Permai",              PhotoURL: "", jumlah_nasabah:  64, jumlah_staff: 2, IsActive: false },
    { BankID: "bsu-005", NamaBank: "BSU Elok Lestari Kelurahan Mekar",     PhotoURL: "", jumlah_nasabah: 175, jumlah_staff: 5, IsActive: true  },
    { BankID: "bsu-006", NamaBank: "BSU Flamboyan Hijau RW 07",            PhotoURL: "", jumlah_nasabah:  53, jumlah_staff: 2, IsActive: true  },
    { BankID: "bsu-007", NamaBank: "BSU Gemah Ripah Kelurahan Sukajadi",   PhotoURL: "", jumlah_nasabah: 119, jumlah_staff: 4, IsActive: true  },
    { BankID: "bsu-008", NamaBank: "BSU Harapan Baru Lingkungan Bersih",   PhotoURL: "", jumlah_nasabah:  87, jumlah_staff: 3, IsActive: false },
    { BankID: "bsu-009", NamaBank: "BSU Indah Sejahtera RW 12",            PhotoURL: "", jumlah_nasabah: 231, jumlah_staff: 7, IsActive: true  },
    { BankID: "bsu-010", NamaBank: "BSU Jaya Mandiri Kelurahan Pasar Baru",PhotoURL: "", jumlah_nasabah:  76, jumlah_staff: 3, IsActive: true  },
    { BankID: "bsu-011", NamaBank: "BSU Kenanga Bersatu RT 05 RW 02",      PhotoURL: "", jumlah_nasabah: 158, jumlah_staff: 5, IsActive: true  },
    { BankID: "bsu-012", NamaBank: "BSU Lestari Jaya Kelurahan Cibeunying",PhotoURL: "", jumlah_nasabah:  43, jumlah_staff: 2, IsActive: false },
    { BankID: "bsu-013", NamaBank: "BSU Melati Indah Mandiri",             PhotoURL: "", jumlah_nasabah: 194, jumlah_staff: 6, IsActive: true  },
    { BankID: "bsu-014", NamaBank: "BSU Nusantara Bersih RW 09",           PhotoURL: "", jumlah_nasabah: 112, jumlah_staff: 4, IsActive: true  },
    { BankID: "bsu-015", NamaBank: "BSU Obor Hijau Kelurahan Babakan",     PhotoURL: "", jumlah_nasabah:  69, jumlah_staff: 2, IsActive: true  },
    { BankID: "bsu-016", NamaBank: "BSU Permata Lestari RW 14",            PhotoURL: "", jumlah_nasabah: 183, jumlah_staff: 5, IsActive: true  },
    { BankID: "bsu-017", NamaBank: "BSU Qoryah Thoyyibah Mandiri",         PhotoURL: "", jumlah_nasabah:  35, jumlah_staff: 2, IsActive: false },
    { BankID: "bsu-018", NamaBank: "BSU Raharja Kelurahan Cikaret",        PhotoURL: "", jumlah_nasabah: 221, jumlah_staff: 7, IsActive: true  },
    { BankID: "bsu-019", NamaBank: "BSU Sejahtera Bersama RW 06",          PhotoURL: "", jumlah_nasabah:  91, jumlah_staff: 3, IsActive: true  },
    { BankID: "bsu-020", NamaBank: "BSU Tirta Kencana Kelurahan Leuwigajah",PhotoURL: "",jumlah_nasabah: 147, jumlah_staff: 4, IsActive: true  },
    { BankID: "bsu-021", NamaBank: "BSU Unggul Mandiri RT 08 RW 03",       PhotoURL: "", jumlah_nasabah:  58, jumlah_staff: 2, IsActive: true  },
    { BankID: "bsu-022", NamaBank: "BSU Virama Kelurahan Panghegar",       PhotoURL: "", jumlah_nasabah: 202, jumlah_staff: 6, IsActive: true  },
    { BankID: "bsu-023", NamaBank: "BSU Wahana Lingkungan Hijau",          PhotoURL: "", jumlah_nasabah:  77, jumlah_staff: 3, IsActive: false },
    { BankID: "bsu-024", NamaBank: "BSU Xenia Bersatu RW 11",              PhotoURL: "", jumlah_nasabah: 133, jumlah_staff: 4, IsActive: true  },
    { BankID: "bsu-025", NamaBank: "BSU Yudhistira Kelurahan Babakan Sari",PhotoURL: "", jumlah_nasabah:  49, jumlah_staff: 2, IsActive: true  },
    { BankID: "bsu-026", NamaBank: "BSU Zamrud Hijau Mandiri",             PhotoURL: "", jumlah_nasabah: 168, jumlah_staff: 5, IsActive: true  },
    { BankID: "bsu-027", NamaBank: "BSU Arjuna Bersih RW 04",              PhotoURL: "", jumlah_nasabah:  82, jumlah_staff: 3, IsActive: true  },
    { BankID: "bsu-028", NamaBank: "BSU Bintang Kelurahan Sukamenak",      PhotoURL: "", jumlah_nasabah: 215, jumlah_staff: 6, IsActive: true  },
    { BankID: "bsu-029", NamaBank: "BSU Citarum Mandiri RW 08",            PhotoURL: "", jumlah_nasabah:  61, jumlah_staff: 2, IsActive: false },
    { BankID: "bsu-030", NamaBank: "BSU Duta Lingkungan Kelurahan Citeureup",PhotoURL: "",jumlah_nasabah: 139, jumlah_staff: 4, IsActive: true  },
    { BankID: "bsu-031", NamaBank: "BSU Emas Bersatu RT 03 RW 05",         PhotoURL: "", jumlah_nasabah:  95, jumlah_staff: 3, IsActive: true  },
    { BankID: "bsu-032", NamaBank: "BSU Fajar Kelurahan Margaasih",        PhotoURL: "", jumlah_nasabah: 176, jumlah_staff: 5, IsActive: true  },
    { BankID: "bsu-033", NamaBank: "BSU Geulis Mandiri RW 15",             PhotoURL: "", jumlah_nasabah:  44, jumlah_staff: 2, IsActive: true  },
    { BankID: "bsu-034", NamaBank: "BSU Harmoni Kelurahan Cipedes",        PhotoURL: "", jumlah_nasabah: 198, jumlah_staff: 6, IsActive: true  },
    { BankID: "bsu-035", NamaBank: "BSU Intan Bersama RW 01",              PhotoURL: "", jumlah_nasabah:  73, jumlah_staff: 3, IsActive: false },
    { BankID: "bsu-036", NamaBank: "BSU Jingga Kelurahan Pasirlayung",     PhotoURL: "", jumlah_nasabah: 154, jumlah_staff: 5, IsActive: true  },
    { BankID: "bsu-037", NamaBank: "BSU Karya Nyata Mandiri",              PhotoURL: "", jumlah_nasabah:  88, jumlah_staff: 3, IsActive: true  },
    { BankID: "bsu-038", NamaBank: "BSU Langit Biru RW 10",                PhotoURL: "", jumlah_nasabah: 243, jumlah_staff: 7, IsActive: true  },
    { BankID: "bsu-039", NamaBank: "BSU Mawar Kelurahan Antapani",         PhotoURL: "", jumlah_nasabah:  57, jumlah_staff: 2, IsActive: true  },
    { BankID: "bsu-040", NamaBank: "BSU Nira Jaya Bersih RW 13",           PhotoURL: "", jumlah_nasabah: 122, jumlah_staff: 4, IsActive: true  },
    { BankID: "bsu-041", NamaBank: "BSU Oasis Kelurahan Ujungberung",      PhotoURL: "", jumlah_nasabah:  66, jumlah_staff: 2, IsActive: false },
    { BankID: "bsu-042", NamaBank: "BSU Pandan Wangi Mandiri",             PhotoURL: "", jumlah_nasabah: 187, jumlah_staff: 5, IsActive: true  },
    { BankID: "bsu-043", NamaBank: "BSU Qiara Bersatu RT 06 RW 02",        PhotoURL: "", jumlah_nasabah:  39, jumlah_staff: 2, IsActive: true  },
    { BankID: "bsu-044", NamaBank: "BSU Rajawali Kelurahan Cisaranten",    PhotoURL: "", jumlah_nasabah: 211, jumlah_staff: 6, IsActive: true  },
    { BankID: "bsu-045", NamaBank: "BSU Seruni Hijau RW 07",               PhotoURL: "", jumlah_nasabah:  84, jumlah_staff: 3, IsActive: true  },
    { BankID: "bsu-046", NamaBank: "BSU Tirta Mandiri Kelurahan Cicaheum", PhotoURL: "", jumlah_nasabah: 165, jumlah_staff: 5, IsActive: true  },
    { BankID: "bsu-047", NamaBank: "BSU Unika Bersih Bersama",             PhotoURL: "", jumlah_nasabah:  51, jumlah_staff: 2, IsActive: false },
    { BankID: "bsu-048", NamaBank: "BSU Violet Kelurahan Kebon Gedang",    PhotoURL: "", jumlah_nasabah: 229, jumlah_staff: 7, IsActive: true  },
    { BankID: "bsu-049", NamaBank: "BSU Wijaya Kusuma RW 16",              PhotoURL: "", jumlah_nasabah:  96, jumlah_staff: 3, IsActive: true  },
    { BankID: "bsu-050", NamaBank: "BSU Zamzam Kelurahan Kebon Jayanti",   PhotoURL: "", jumlah_nasabah: 143, jumlah_staff: 4, IsActive: true  },
];

export function mockGetUnitPaged(_bankId: string, page: number): GetUnitBSIPagedResponse {
    const total = mockUnitBSIList.length;
    const totalPages = Math.ceil(total / LIMIT);
    const safePage = Math.max(1, Math.min(page, totalPages));
    const offset = (safePage - 1) * LIMIT;

    return {
        message: "BSU fetched successfully",
        data: mockUnitBSIList.slice(offset, offset + LIMIT),
        pagination: {
            page: safePage,
            limit: LIMIT,
            total,
            total_pages: totalPages,
        },
    };
}
