import { api } from "./api";

export interface PenimbanganItem {
    penimbangan_id: string;
    jadwal_id: string;
    bank_id: string;
    started_by: string;
    started_at: string;
    ended_by: string | null;
    ended_at: string | null;
    status_penimbangan: "selesai" | "aktif" | "dibatalkan";
    nama_admin: string;
}

export interface SetoranItem {
    setoran_id: string;
    nama_petugas: string;
    nasabah_id: string;
    nama_nasabah: string;
    transaksi_timestamp: string;
    total_item: number;
    total_poin: number;
    status_setoran: string;
}

export interface PenimbanganDetail {
    penimbangan_id: string;
    started_at: string;
    ended_at: string | null;
    started_by: string;
    ended_by: string | null;
    status_penimbangan: string;
    list_setoran: SetoranItem[];
}

interface GetPenimbanganResponse {
    message: string;
    data: PenimbanganItem[];
}

interface GetListSetoranResponse {
    message: string;
    data: PenimbanganDetail;
}

export const PenimbanganService = {
    async getPenimbanganByBank(bankId: string): Promise<PenimbanganItem[]> {
        const response = await api.get<GetPenimbanganResponse>(`/penimbangan/get/${bankId}`);
        return response.data.data;
    },

    async getListSetoran(penimbanganId: string): Promise<PenimbanganDetail> {
        const response = await api.get<GetListSetoranResponse>(`/penimbangan/list-setoran/${penimbanganId}`);
        return response.data.data;
    },

    async exportLaporan(penimbanganId: string): Promise<Blob> {
        const response = await api.get(`/laporan/penimbangan/${penimbanganId}`, {
            responseType: "blob",
        });
        return response.data as Blob;
    },
};
