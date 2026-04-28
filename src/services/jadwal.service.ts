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

export const JadwalService = {
    async getJadwalBank(bankId: string): Promise<GetJadwalResponse> {
        const response = await api.get<GetJadwalResponse>(`/jadwal/get-jadwal/${bankId}`);
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
};
