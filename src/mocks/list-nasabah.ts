import type { BsiNasabahItem } from "../types/bsi.type";
import type { GetNasabahBSIPagedResponse } from "../types/bsi.type";

const LIMIT = 20;

export const mockNasabahList: BsiNasabahItem[] = [
    { nasabah_id: "nsb-001", nama: "Siti Rahayu",           email: "siti.rahayu@gmail.com",       foto: "", status: "aktif"    },
    { nasabah_id: "nsb-002", nama: "Budi Santoso",          email: "budi.santoso@gmail.com",      foto: "", status: "aktif"    },
    { nasabah_id: "nsb-003", nama: "Dewi Kurniawati",       email: "dewi.kurnia@yahoo.com",       foto: "", status: "pending"  },
    { nasabah_id: "nsb-004", nama: "Agus Prasetyo",         email: "agus.prasetyo@gmail.com",     foto: "", status: "aktif"    },
    { nasabah_id: "nsb-005", nama: "Rina Wulandari",        email: "rina.wulandari@gmail.com",    foto: "", status: "nonaktif" },
    { nasabah_id: "nsb-006", nama: "Hendra Wijaya",         email: "hendra.wijaya@gmail.com",     foto: "", status: "aktif"    },
    { nasabah_id: "nsb-007", nama: "Yuli Astuti",           email: "yuli.astuti@yahoo.com",       foto: "", status: "aktif"    },
    { nasabah_id: "nsb-008", nama: "Fajar Nugroho",         email: "fajar.nugroho@gmail.com",     foto: "", status: "pending"  },
    { nasabah_id: "nsb-009", nama: "Sri Wahyuni",           email: "sri.wahyuni@gmail.com",       foto: "", status: "aktif"    },
    { nasabah_id: "nsb-010", nama: "Doni Firmansyah",       email: "doni.firmansyah@gmail.com",   foto: "", status: "aktif"    },
    { nasabah_id: "nsb-011", nama: "Ani Susanti",           email: "ani.susanti@yahoo.com",       foto: "", status: "nonaktif" },
    { nasabah_id: "nsb-012", nama: "Wahyu Hidayat",         email: "wahyu.hidayat@gmail.com",     foto: "", status: "aktif"    },
    { nasabah_id: "nsb-013", nama: "Lestari Ningrum",       email: "lestari.ningrum@gmail.com",   foto: "", status: "aktif"    },
    { nasabah_id: "nsb-014", nama: "Rudi Hermawan",         email: "rudi.hermawan@gmail.com",     foto: "", status: "pending"  },
    { nasabah_id: "nsb-015", nama: "Endang Suryani",        email: "endang.suryani@yahoo.com",    foto: "", status: "aktif"    },
    { nasabah_id: "nsb-016", nama: "Teguh Prabowo",         email: "teguh.prabowo@gmail.com",     foto: "", status: "aktif"    },
    { nasabah_id: "nsb-017", nama: "Mira Handayani",        email: "mira.handayani@gmail.com",    foto: "", status: "nonaktif" },
    { nasabah_id: "nsb-018", nama: "Eko Purnomo",           email: "eko.purnomo@gmail.com",       foto: "", status: "aktif"    },
    { nasabah_id: "nsb-019", nama: "Fitri Rahmawati",       email: "fitri.rahmawati@yahoo.com",   foto: "", status: "aktif"    },
    { nasabah_id: "nsb-020", nama: "Supriyanto",            email: "supriyanto@gmail.com",        foto: "", status: "pending"  },
    { nasabah_id: "nsb-021", nama: "Nurul Hidayah",         email: "nurul.hidayah@gmail.com",     foto: "", status: "aktif"    },
    { nasabah_id: "nsb-022", nama: "Bambang Setiawan",      email: "bambang.setiawan@gmail.com",  foto: "", status: "aktif"    },
    { nasabah_id: "nsb-023", nama: "Ratna Dewi",            email: "ratna.dewi@yahoo.com",        foto: "", status: "nonaktif" },
    { nasabah_id: "nsb-024", nama: "Iwan Setyono",          email: "iwan.setyono@gmail.com",      foto: "", status: "aktif"    },
    { nasabah_id: "nsb-025", nama: "Nuraini Putri",         email: "nuraini.putri@gmail.com",     foto: "", status: "aktif"    },
    { nasabah_id: "nsb-026", nama: "Arif Budiman",          email: "arif.budiman@gmail.com",      foto: "", status: "pending"  },
    { nasabah_id: "nsb-027", nama: "Sari Indah Lestari",    email: "sari.indah@yahoo.com",        foto: "", status: "aktif"    },
    { nasabah_id: "nsb-028", nama: "Dian Permata",          email: "dian.permata@gmail.com",      foto: "", status: "aktif"    },
    { nasabah_id: "nsb-029", nama: "Gunawan Saputra",       email: "gunawan.saputra@gmail.com",   foto: "", status: "nonaktif" },
    { nasabah_id: "nsb-030", nama: "Halimah Tusadiah",      email: "halimah.tusadiah@gmail.com",  foto: "", status: "aktif"    },
    { nasabah_id: "nsb-031", nama: "Irwan Kusuma",          email: "irwan.kusuma@yahoo.com",      foto: "", status: "aktif"    },
    { nasabah_id: "nsb-032", nama: "Juliana Pratiwi",       email: "juliana.pratiwi@gmail.com",   foto: "", status: "pending"  },
    { nasabah_id: "nsb-033", nama: "Kurniawan Hadi",        email: "kurniawan.hadi@gmail.com",    foto: "", status: "aktif"    },
    { nasabah_id: "nsb-034", nama: "Lina Marlina",          email: "lina.marlina@gmail.com",      foto: "", status: "aktif"    },
    { nasabah_id: "nsb-035", nama: "Muhamad Rizki",         email: "m.rizki@yahoo.com",           foto: "", status: "nonaktif" },
    { nasabah_id: "nsb-036", nama: "Novi Anggraini",        email: "novi.anggraini@gmail.com",    foto: "", status: "aktif"    },
    { nasabah_id: "nsb-037", nama: "Oktaviani Putri",       email: "okta.putri@gmail.com",        foto: "", status: "aktif"    },
    { nasabah_id: "nsb-038", nama: "Puji Lestari",          email: "puji.lestari@gmail.com",      foto: "", status: "pending"  },
    { nasabah_id: "nsb-039", nama: "Qori Amalia",           email: "qori.amalia@yahoo.com",       foto: "", status: "aktif"    },
    { nasabah_id: "nsb-040", nama: "Rizky Aditya",          email: "rizky.aditya@gmail.com",      foto: "", status: "aktif"    },
    { nasabah_id: "nsb-041", nama: "Salma Azzahra",         email: "salma.azzahra@gmail.com",     foto: "", status: "nonaktif" },
    { nasabah_id: "nsb-042", nama: "Taufik Hidayat",        email: "taufik.hidayat@gmail.com",    foto: "", status: "aktif"    },
    { nasabah_id: "nsb-043", nama: "Uswatun Hasanah",       email: "uswatun.hasanah@yahoo.com",   foto: "", status: "aktif"    },
    { nasabah_id: "nsb-044", nama: "Vina Oktaviana",        email: "vina.oktaviana@gmail.com",    foto: "", status: "pending"  },
    { nasabah_id: "nsb-045", nama: "Wawan Hermawan",        email: "wawan.hermawan@gmail.com",    foto: "", status: "aktif"    },
    { nasabah_id: "nsb-046", nama: "Xenia Fitriani",        email: "xenia.fitriani@gmail.com",    foto: "", status: "aktif"    },
    { nasabah_id: "nsb-047", nama: "Yanuar Prasetya",       email: "yanuar.prasetya@yahoo.com",   foto: "", status: "nonaktif" },
    { nasabah_id: "nsb-048", nama: "Zulfah Nuraini",        email: "zulfah.nuraini@gmail.com",    foto: "", status: "aktif"    },
    { nasabah_id: "nsb-049", nama: "Ahmad Fauzi",           email: "ahmad.fauzi@gmail.com",       foto: "", status: "aktif"    },
    { nasabah_id: "nsb-050", nama: "Badriyah Solihat",      email: "badriyah.solihat@gmail.com",  foto: "", status: "pending"  },
];

export function mockGetNasabahPaged(_bankId: string, page: number): GetNasabahBSIPagedResponse {
    const total = mockNasabahList.length;
    const totalPages = Math.ceil(total / LIMIT);
    const safePage = Math.max(1, Math.min(page, totalPages));
    const offset = (safePage - 1) * LIMIT;

    return {
        message: "Nasabah fetched successfully",
        data: mockNasabahList.slice(offset, offset + LIMIT),
        pagination: {
            page: safePage,
            limit: LIMIT,
            total,
            total_pages: totalPages,
        },
    };
}

export function mockGetAllNasabah(_bankId: string): { message: string; data: BsiNasabahItem[] } {
    return {
        message: "Nasabah fetched successfully",
        data: mockNasabahList,
    };
}
