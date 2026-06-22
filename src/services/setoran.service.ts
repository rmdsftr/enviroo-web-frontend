import { api } from "./api";

export interface RiwayatSetoranNasabahItem {
    setoran_id: string;
    nama_petugas: string;
    transaksi_timestamp: string;
    total_item: number;
    status_setoran: string;
}

export interface SetoranDetailItem {
    nama_sampah: string;
    satuan: string;
    qty: number;
}

export interface SetoranDetailHeader {
    setoran_id: string;
    nama_petugas: string;
    nama_nasabah: string;
    transaksi_timestamp: string;
    total_item: number;
    status_setoran: string;
    bukti_via_manual: string;
}

export interface SetoranDetail {
    header: SetoranDetailHeader;
    items: SetoranDetailItem[];
}

interface GetSetoranDetailResponse {
    message: string;
    data: SetoranDetail;
}

export const SetoranService = {
    async getDetailSetoran(setoranId: string): Promise<SetoranDetail> {
        const response = await api.get<GetSetoranDetailResponse>(`/setoran/detail/${setoranId}`);
        return response.data.data;
    },

    async getListSetoranNasabah(nasabahId: string): Promise<RiwayatSetoranNasabahItem[]> {
        const response = await api.get<{ message: string; data: RiwayatSetoranNasabahItem[] }>(
            `/setoran/riwayat/${nasabahId}`
        );
        return response.data.data;
    },
};
