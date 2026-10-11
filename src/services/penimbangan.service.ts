import { api } from "./api";

/** Item dari GET /penimbangan/get/:bank_id — riwayat sesi (aktif/pending sengaja di-exclude backend) */
export interface PenimbanganItem {
    penimbangan_id: string;
    tanggal_sesi: string;
    status_penimbangan: "selesai" | "dibatalkan";
    jumlah_setoran: number;
}

export interface SetoranItem {
    setoran_id: string;
    nama_petugas: string;
    nasabah_id: string;
    nama_nasabah: string;
    transaksi_timestamp: string;
    total_item: number;
}

export interface PenimbanganDetail {
    penimbangan_id: string;
    nama_bank: string;
    /** tanggal sesi — selalu terisi, pakai ini buat nampilin tanggal (bukan started_at, itu nullable) */
    tanggal_sesi: string;
    started_at: string | null;
    ended_at: string | null;
    /** bisa string kosong "" kalau sesi belum pernah dimulai/ditutup (di-COALESCE backend) */
    started_by: string;
    ended_by: string;
    status_penimbangan: string;
    alasan_pembatalan: string | null;
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
    async getPenimbanganByBank(bankId: string, startDate?: string, endDate?: string): Promise<PenimbanganItem[]> {
        const response = await api.get<GetPenimbanganResponse>(`/penimbangan/get/${bankId}`, {
            params: { start_date: startDate, end_date: endDate },
        });
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

    async exportRekapLaporan(bankId: string, startDate: string, endDate: string): Promise<Blob> {
        const response = await api.get(`/laporan/penimbangan/rekap/${bankId}`, {
            params: { start: startDate, end: endDate },
            responseType: "blob",
        });
        return response.data as Blob;
    },
};
