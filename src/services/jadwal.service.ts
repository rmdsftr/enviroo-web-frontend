import { api } from "./api";

export interface AddJadwalRequest {
    hari: string;
    minggu_ke: number;
    jam_mulai: string;
    jam_selesai: string;
    jenis_jadwal: "penimbangan" | "pengangkutan";
    is_active: boolean;
    is_rutin: boolean;
    tanggal: string;
    nama_jadwal_spesial: string;
    target_bank_id?: string;
    admin_id: string;
}

/** @deprecated Use AddJadwalRequest instead */
export type AddJadwalPenimbanganRequest = AddJadwalRequest;

/* ── Batch add (jadwal rutin: banyak kombinasi hari × minggu sekaligus) ── */
export interface JadwalBatchItem {
    hari: string;
    minggu_ke: number;
    jam_mulai: string;
    jam_selesai: string;
}

export interface AddJadwalBatchRequest {
    admin_id: string;
    jenis_jadwal: "penimbangan";
    is_rutin: boolean;
    items: JadwalBatchItem[];
}

export interface AddJadwalBatchResponse {
    message: string;
    data: {
        created: JadwalItem[];
        skipped: Array<{ hari: string; minggu_ke: number; jam_mulai: string; jam_selesai: string; alasan: string }>;
    };
}

export interface JadwalItem {
    jadwal_id: string;
    bank_id: string;
    hari: string;
    minggu_ke: number;
    jam_mulai: string;
    jam_selesai: string;
    jenis_jadwal: string;
    target_bank_id: string;
    is_active: boolean;
    is_rutin: boolean;
    tanggal: string;
    nama_jadwal_spesial: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    bank_name: string;
    target_bank_name?: string;
}

export interface GetJadwalResponse {
    data: {
        penimbangan: JadwalItem[];
        pengangkutan: JadwalItem[];
    };
}

/** GET /jadwal/penimbangan/:bank_id?month=&year= — khusus BSM, sudah di-expand jadi tanggal konkret per bulan */
export interface JadwalPenimbanganOccurrence {
    jadwal_id: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    nama_jadwal: string;
    is_rutin: boolean;
    is_active: boolean;
    status_jadwal: "selesai" | "dibatalkan" | "pending" | "upcoming" | string;
}

interface GetJadwalPenimbanganBankResponse {
    data: JadwalPenimbanganOccurrence[];
}

/** GET /jadwal/master-penimbangan/:bank_id?month=&year= — data mentah (rule), buat card "Pengaturan Jadwal" */
export interface JadwalMasterRutinItem {
    jadwal_id: string;
    hari: string;
    minggu_ke: number;
    jam_mulai: string;
    jam_selesai: string;
    is_active: boolean;
}

export interface JadwalMasterKhususItem {
    jadwal_id: string;
    nama_jadwal: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    is_active: boolean;
}

export interface JadwalMasterPenimbangan {
    rutin: JadwalMasterRutinItem[];
    khusus: JadwalMasterKhususItem[];
}

interface GetJadwalMasterPenimbanganResponse {
    data: JadwalMasterPenimbangan;
}

/* ── Superadmin: get-all ── */
export interface SuperadminJadwalRawItem {
    jadwal_id: string;
    hari?: string;
    minggu_ke?: number;
    tanggal?: string;
    nama_jadwal_spesial?: string;
    jam_mulai: string;
    jam_selesai: string;
    is_active: boolean;
    [key: string]: unknown;
}

export interface SuperadminJadwalBank {
    bank_id: string;
    nama_bank: string;
    rutin: SuperadminJadwalRawItem[];
    tidak_rutin: SuperadminJadwalRawItem[];
}

/* GET /jadwal/get-all?type=penimbangan */
export interface GetAllJadwalPenimbanganResponse {
    data: {
        bsi: SuperadminJadwalBank[];
        bsm: SuperadminJadwalBank[];
        bsu: SuperadminJadwalBank[];
    };
}

/* GET /jadwal/get-all?type=pengangkutan */
export interface SuperadminPengangkutanRute {
    bsu_id: string;
    nama_bsu: string;
    rutin: SuperadminJadwalRawItem[];
    tidak_rutin: SuperadminJadwalRawItem[];
}

export interface SuperadminPengangkutanBsi {
    bsi_id: string;
    nama_bsi: string;
    rute_bsu: SuperadminPengangkutanRute[];
}

export interface GetAllJadwalPengangkutanResponse {
    data: SuperadminPengangkutanBsi[];
}

export const JadwalService = {
    async getJadwalBank(bankId: string, month: number, year: number): Promise<GetJadwalResponse> {
        const response = await api.get<GetJadwalResponse>(`/jadwal/get-jadwal/${bankId}`, {
            params: { month, year },
        });
        return response.data;
    },

    /** Khusus halaman jadwal admin_bsm — sudah expanded per tanggal konkret + status_jadwal */
    async getJadwalPenimbanganBank(bankId: string, month: number, year: number): Promise<JadwalPenimbanganOccurrence[]> {
        const response = await api.get<GetJadwalPenimbanganBankResponse>(`/jadwal/penimbangan/${bankId}`, {
            params: { month, year },
        });
        return response.data.data;
    },

    /** Data rule mentah (bukan expanded) buat card "Pengaturan Jadwal" — sumber tombol edit/hapus */
    async getJadwalMasterPenimbangan(bankId: string, month: number, year: number): Promise<JadwalMasterPenimbangan> {
        const response = await api.get<GetJadwalMasterPenimbanganResponse>(`/jadwal/master-penimbangan/${bankId}`, {
            params: { month, year },
        });
        return response.data.data;
    },

    async addJadwal(bankId: string, data: AddJadwalPenimbanganRequest) {
        const response = await api.post(`/jadwal/add-jadwal/${bankId}`, data);
        return response.data;
    },

    async addJadwalBatch(bankId: string, data: AddJadwalBatchRequest): Promise<AddJadwalBatchResponse> {
        const response = await api.post<AddJadwalBatchResponse>(`/jadwal/add-jadwal-batch/${bankId}`, data);
        return response.data;
    },

    async deleteJadwal(jadwalId: string) {
        const response = await api.delete(`/jadwal/delete-jadwal/${jadwalId}`);
        return response.data;
    },

    async updateJadwal(jadwalId: string, data: Partial<AddJadwalPenimbanganRequest>) {
        const response = await api.patch(`/jadwal/update-jadwal/${jadwalId}`, data);
        return response.data;
    },

    async getAllJadwalPenimbangan(): Promise<GetAllJadwalPenimbanganResponse> {
        const response = await api.get<GetAllJadwalPenimbanganResponse>("/jadwal/get-all", { params: { type: "penimbangan" } });
        return response.data;
    },

    async getAllJadwalPengangkutan(): Promise<GetAllJadwalPengangkutanResponse> {
        const response = await api.get<GetAllJadwalPengangkutanResponse>("/jadwal/get-all", { params: { type: "pengangkutan" } });
        return response.data;
    },
};
