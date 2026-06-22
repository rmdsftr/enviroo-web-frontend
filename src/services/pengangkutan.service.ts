import { api } from "./api";

export interface PengangkutanItem {
    pengangkutan_id: string;
    bsi_id: string;
    bsu_id: string;
    admin_bsi_id: string | null;
    admin_bsu_id: string | null;
    jadwal_id: string;
    nama_bsi: string;
    nama_bsu: string;
    nama_admin_bsi: string | null;
    nama_admin_bsu: string | null;
    status_pengangkutan: string;
    changed_at: string;
}

interface GetPengangkutanResponse {
    message: string;
    data: PengangkutanItem[];
}

export interface SampahItem {
    sampah_id: string;
    nama_sampah: string;
    satuan: string;
    qty: number;
}

export interface PengangkutanDetailHeader {
    pengangkutan_id: string;
    nama_bsi: string;
    nama_bsu: string;
    nama_admin_bsi: string;
    nama_admin_bsu: string;
    total_item: number;
    is_mandiri: boolean;
    status_terkini: string;
    bukti_foto: string | null;
}

export interface PengangkutanDetail {
    header: PengangkutanDetailHeader;
    items: SampahItem[];
}

export interface SesiRiwayatEntry {
    status: string;
    changed_at: string;
    changed_by: string;
    catatan: string;
}

export interface PengangkutanSesiActive {
    bsi_id: string;
    bsu_id: string;
    nama_bsi: string;
    nama_bsu: string;
    pengangkutan_id: string;
    riwayat: SesiRiwayatEntry[];
    status_terkini: string;
}

export const PengangkutanService = {
    async getPengangkutanByBank(bankId: string, startDate?: string, endDate?: string): Promise<PengangkutanItem[]> {
        const response = await api.get<GetPengangkutanResponse>(`/pengangkutan/get-all/${bankId}`, {
            params: { start_date: startDate, end_date: endDate },
        });
        return response.data.data;
    },

    async getDetailSampah(pengangkutanId: string): Promise<PengangkutanDetail> {
        const response = await api.get<{ data: PengangkutanDetail; message: string }>(`/pengangkutan/detail-sampah/${pengangkutanId}`);
        return response.data.data;
    },

    async getDetailSesiActive(pengangkutanId: string): Promise<PengangkutanSesiActive> {
        const response = await api.get<PengangkutanSesiActive>(`/pengangkutan/detail-sesi-active/${pengangkutanId}`);
        return response.data;
    },

    async exportLaporan(pengangkutanId: string): Promise<Blob> {
        const response = await api.get(`/laporan/pengangkutan/${pengangkutanId}`, {
            responseType: "blob",
        });
        return response.data;
    },
};
