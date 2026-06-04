import { api } from "./api";

export interface NasabahBhItem {
    penerima_id: string;
    nasabah_id: string;
    nama_nasabah: string;
    total_diterima: number;
    satuan_diterima: string;
}

export interface PenerimaBhBank {
    bank_id: string;
    nama_bank: string;
    nasabah_penerima: NasabahBhItem[];
}

export interface DetailBagiHasil {
    bagi_hasil_id: string;
    penjualan_id: string;
    reward_id: number;
    nama_reward: string;
    tanggal: string;
    gross_bsi?: number;
    gross_bsm?: number;
    total_distribusi_nasabah: number;
    sisa_bagi_hasil: number;
    distribusi_id: string | null;
    penerima: PenerimaBhBank[];
    nasabah_bsi?: NasabahBhItem[];
    nasabah_bsm?: NasabahBhItem[];
}

export interface RiwayatBagiHasilItem {
    bagi_hasil_id: string;
    reward_id: number;
    nama_reward: string;
    tanggal_bagi_hasil: string;
}

export interface RiwayatBagiHasilNasabahItem {
    penerima_id: string;
    bagi_hasil_id: string;
    reward: string;
    tanggal: string;
    total_diterima: number;
    satuan_diterima: string;
}

export interface DetailItemBh {
    sampah_id: string;
    nama_sampah: string;
    qty: number;
    harga_item: number;
    subtotal_harga: number;
}

export interface PenerimaBagiHasilDetail {
    penerima_id: string;
    bagi_hasil_id: string;
    nasabah_id: string;
    nama_nasabah: string;
    reward: string;
    tanggal: string;
    total_diterima: number;
    satuan_diterima: string;
    detail_item: DetailItemBh[];
}

export interface NasabahPenerima {
    penerima_id: string;
    nasabah_id: string;
    nama_nasabah: string;
    total_diterima: number;
    satuan_diterima: string;
}

export interface PenerimaBSU {
    bank_id: string;
    nama_bank: string;
    nasabah_penerima: NasabahPenerima[];
}

export interface BagiHasilPenjualan {
    bagi_hasil_id: string;
    penjualan_id: string;
    distribusi_id: string | null;
    gross_bank: number;
    nama_petugas: string;
    reward: string;
    satuan: string;
    total_distribusi_nasabah: number;
    sisa_bagi_hasil: number;
    tanggal: string;
    nasabah_langsung: NasabahPenerima[];
    penerima: PenerimaBSU[];
}

export const BagiHasilService = {
    async getDetail(penjualanId: string): Promise<BagiHasilPenjualan> {
        const response = await api.get<BagiHasilPenjualan>(`/bagi-hasil/detail/${penjualanId}`);
        return response.data;
    },

    async getDetailBhBank(bagiHasilId: string): Promise<DetailBagiHasil> {
        const response = await api.get<DetailBagiHasil>(`/bagi-hasil/detail-bh-bank/${bagiHasilId}`);
        return response.data;
    },

    async getRiwayatByBank(bankId: string): Promise<RiwayatBagiHasilItem[]> {
        const response = await api.get<{ bank_id: string; nama_bank: string; jenis_bank: string; riwayat_bagi_hasil: RiwayatBagiHasilItem[] }>(
            `/bagi-hasil/list-bh-bank/${bankId}`
        );
        return response.data.riwayat_bagi_hasil ?? [];
    },

    async getDetailBhNasabah(penerimaId: string): Promise<PenerimaBagiHasilDetail> {
        const response = await api.get<PenerimaBagiHasilDetail>(`/bagi-hasil/detail-bh-nasabah/${penerimaId}`);
        return response.data;
    },

    async getListBhNasabah(nasabahId: string): Promise<RiwayatBagiHasilNasabahItem[]> {
        const response = await api.get<{ nama_nasabah: string; nasabah_id: string; riwayat_bagi_hasil: RiwayatBagiHasilNasabahItem[] }>(
            `/bagi-hasil/list-bh-nasabah/${nasabahId}`
        );
        return response.data.riwayat_bagi_hasil ?? [];
    },

    async exportLaporan(bagiHasilId: string): Promise<Blob> {
        const response = await api.get(`/laporan/bagi-hasil/${bagiHasilId}`, {
            responseType: "blob",
        });
        return response.data;
    },
};
