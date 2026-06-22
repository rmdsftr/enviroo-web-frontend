import { api } from "./api";

export interface PenjualanDetailSampah {
    sampah_id: string;
    nama_sampah: string;
    qty: number;
    harga_jual: number;
    subtotal_penjualan: number;
    harga_nasabah_snapshot: number;
}

export interface PenjualanDetail {
    penjualan_id: string;
    bank_id: string;
    admin_name: string;
    identitas_pembeli: string;
    nama_reward: string;
    satuan_reward: string;
    status_bagi_hasil: string;
    total_item: number;
    total_penjualan: number;
    bukti_foto: string;
    created_at: string;
    items_sampah: PenjualanDetailSampah[];
}

export interface PenjualanExternalItem {
    penjualan_id: string;
    identitas_pembeli: string;
    total_item: number;
    total_penjualan: number;
    nama_reward: string;
    satuan_reward: string;
    bukti_foto: string;
    created_at: string;
    admin_name: string;
    status_bagi_hasil: string;
}

interface GetPenjualanExternalResponse {
    message: string;
    data: PenjualanExternalItem[];
}

export const PenjualanService = {
    async getRiwayatEksternal(bankId: string, startDate?: string, endDate?: string): Promise<PenjualanExternalItem[]> {
        const response = await api.get<GetPenjualanExternalResponse>(`/penjualan/riwayat-eksternal/${bankId}`, {
            params: { start_date: startDate, end_date: endDate },
        });
        return response.data.data;
    },

    async getDetailEksternal(penjualanId: string): Promise<PenjualanDetail> {
        const response = await api.get<{ data: PenjualanDetail; message: string }>(`/penjualan/detail-eksternal/${penjualanId}`);
        return response.data.data;
    },

    async exportLaporan(penjualanId: string): Promise<Blob> {
        const response = await api.get(`/laporan/penjualan/${penjualanId}`, {
            responseType: "blob",
        });
        return response.data as Blob;
    },
};
