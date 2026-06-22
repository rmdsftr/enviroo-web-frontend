import type { BSIData, GetBSIResponse, GetBSIPagedResponse } from "../types/bsi.type";

const LIMIT = 20;

export const mockBSIList: BSIData[] = [
    { BankID: "bsi-001", NamaBank: "BSI Anggrek Kota Bandung",           PhotoURL: "", IsActive: true,  jumlah_bsu: 12, jumlah_nasabah: 543  },
    { BankID: "bsi-002", NamaBank: "BSI Bersatu Kota Surabaya",          PhotoURL: "", IsActive: true,  jumlah_bsu:  8, jumlah_nasabah: 381  },
    { BankID: "bsi-003", NamaBank: "BSI Cempaka Kota Semarang",          PhotoURL: "", IsActive: true,  jumlah_bsu: 15, jumlah_nasabah: 712  },
    { BankID: "bsi-004", NamaBank: "BSI Dahlia Kota Medan",              PhotoURL: "", IsActive: false, jumlah_bsu:  3, jumlah_nasabah:  98  },
    { BankID: "bsi-005", NamaBank: "BSI Elok Kota Makassar",             PhotoURL: "", IsActive: true,  jumlah_bsu: 10, jumlah_nasabah: 469  },
    { BankID: "bsi-006", NamaBank: "BSI Flamboyan Kota Yogyakarta",      PhotoURL: "", IsActive: true,  jumlah_bsu:  6, jumlah_nasabah: 274  },
    { BankID: "bsi-007", NamaBank: "BSI Gemah Ripah Kota Palembang",     PhotoURL: "", IsActive: true,  jumlah_bsu: 11, jumlah_nasabah: 502  },
    { BankID: "bsi-008", NamaBank: "BSI Harapan Kota Depok",             PhotoURL: "", IsActive: false, jumlah_bsu:  2, jumlah_nasabah:  67  },
    { BankID: "bsi-009", NamaBank: "BSI Indah Kota Tangerang",           PhotoURL: "", IsActive: true,  jumlah_bsu: 18, jumlah_nasabah: 834  },
    { BankID: "bsi-010", NamaBank: "BSI Jaya Kota Bekasi",               PhotoURL: "", IsActive: true,  jumlah_bsu:  9, jumlah_nasabah: 417  },
    { BankID: "bsi-011", NamaBank: "BSI Kenanga Kota Bogor",             PhotoURL: "", IsActive: true,  jumlah_bsu: 14, jumlah_nasabah: 651  },
    { BankID: "bsi-012", NamaBank: "BSI Lestari Kota Balikpapan",        PhotoURL: "", IsActive: false, jumlah_bsu:  1, jumlah_nasabah:  34  },
    { BankID: "bsi-013", NamaBank: "BSI Melati Kota Samarinda",          PhotoURL: "", IsActive: true,  jumlah_bsu:  7, jumlah_nasabah: 318  },
    { BankID: "bsi-014", NamaBank: "BSI Nusantara Kota Manado",          PhotoURL: "", IsActive: true,  jumlah_bsu: 13, jumlah_nasabah: 589  },
    { BankID: "bsi-015", NamaBank: "BSI Obor Kota Pekanbaru",            PhotoURL: "", IsActive: true,  jumlah_bsu:  5, jumlah_nasabah: 223  },
    { BankID: "bsi-016", NamaBank: "BSI Permata Kota Padang",            PhotoURL: "", IsActive: true,  jumlah_bsu: 16, jumlah_nasabah: 748  },
    { BankID: "bsi-017", NamaBank: "BSI Qoryah Kota Banjarmasin",        PhotoURL: "", IsActive: false, jumlah_bsu:  2, jumlah_nasabah:  55  },
    { BankID: "bsi-018", NamaBank: "BSI Raharja Kota Pontianak",         PhotoURL: "", IsActive: true,  jumlah_bsu: 20, jumlah_nasabah: 921  },
    { BankID: "bsi-019", NamaBank: "BSI Sejahtera Kota Malang",          PhotoURL: "", IsActive: true,  jumlah_bsu:  4, jumlah_nasabah: 187  },
    { BankID: "bsi-020", NamaBank: "BSI Tirta Kota Mataram",             PhotoURL: "", IsActive: true,  jumlah_bsu:  8, jumlah_nasabah: 362  },
    { BankID: "bsi-021", NamaBank: "BSI Unggul Kota Kupang",             PhotoURL: "", IsActive: true,  jumlah_bsu:  6, jumlah_nasabah: 254  },
    { BankID: "bsi-022", NamaBank: "BSI Virama Kota Jayapura",           PhotoURL: "", IsActive: false, jumlah_bsu:  0, jumlah_nasabah:   0  },
    { BankID: "bsi-023", NamaBank: "BSI Wahana Kota Ambon",              PhotoURL: "", IsActive: true,  jumlah_bsu:  9, jumlah_nasabah: 408  },
    { BankID: "bsi-024", NamaBank: "BSI Xenia Kota Ternate",             PhotoURL: "", IsActive: true,  jumlah_bsu:  3, jumlah_nasabah: 134  },
    { BankID: "bsi-025", NamaBank: "BSI Yudhistira Kota Kendari",        PhotoURL: "", IsActive: true,  jumlah_bsu: 11, jumlah_nasabah: 497  },
    { BankID: "bsi-026", NamaBank: "BSI Zamrud Kota Palu",               PhotoURL: "", IsActive: true,  jumlah_bsu:  7, jumlah_nasabah: 305  },
    { BankID: "bsi-027", NamaBank: "BSI Arjuna Kota Gorontalo",          PhotoURL: "", IsActive: true,  jumlah_bsu:  5, jumlah_nasabah: 218  },
    { BankID: "bsi-028", NamaBank: "BSI Bintang Kota Mamuju",            PhotoURL: "", IsActive: false, jumlah_bsu:  1, jumlah_nasabah:  41  },
    { BankID: "bsi-029", NamaBank: "BSI Citarum Kota Sofifi",            PhotoURL: "", IsActive: true,  jumlah_bsu:  4, jumlah_nasabah: 176  },
    { BankID: "bsi-030", NamaBank: "BSI Duta Kota Pangkalpinang",        PhotoURL: "", IsActive: true,  jumlah_bsu: 17, jumlah_nasabah: 793  },
];

export function mockGetBsiPaged(page: number): GetBSIPagedResponse {
    const total = mockBSIList.length;
    const totalPages = Math.ceil(total / LIMIT);
    const safePage = Math.max(1, Math.min(page, totalPages));
    const offset = (safePage - 1) * LIMIT;

    return {
        message: "BSI fetched successfully",
        pagination: { page: safePage, limit: LIMIT, total, total_pages: totalPages },
        data: mockBSIList.slice(offset, offset + LIMIT),
    };
}

export function mockGetBsiAll(): GetBSIResponse {
    return {
        message: "BSI fetched successfully",
        data: mockBSIList,
    };
}
