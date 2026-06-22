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

    async addJadwal(bankId: string, data: AddJadwalPenimbanganRequest) {
        const response = await api.post(`/jadwal/add-jadwal/${bankId}`, data);
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
