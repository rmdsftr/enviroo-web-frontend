import { api } from "./api";
import type {
    GetBankSampahStatistikResponse,
    GetSuperadminRingkasanResponse,
    TrenPenjualanSuperadminResponse,
    RankingBankResponse,
    PenjualanSampahResponse,
    MasukSampahResponse,
} from "../types/statistik.type";

export interface KontribusiNasabahItem {
    nasabah_id: string;
    nama_nasabah: string;
    bank_id: string;
    nama_bank: string;
    jumlah_setoran: number;
    total_kg: number;
    total_pcs: number;
    total_liter: number;
}

export interface KontribusiNasabahResponse {
    message: string;
    bank: {
        bank_id: string;
        nama_bank: string;
        jenis_bank: string;
    };
    data: KontribusiNasabahItem[];
}

export interface StatistikSetoranItem {
    sampah_id: string;
    nama_sampah: string;
    satuan: string;
    jenis_reward: string;
    kategori: string;
    total_qty: number;
}

export interface StatistikSetoranResponse {
    message: string;
    bank: {
        bank_id: string;
        nama_bank: string;
        jenis_bank: string;
    };
    data: StatistikSetoranItem[];
}

export const StatistikService = {
    async getBankSampahStatistik(): Promise<GetBankSampahStatistikResponse> {
        const response = await api.get<GetBankSampahStatistikResponse>("/statistik/bank-sampah");
        return response.data;
    },

    async getSuperadminRingkasan(): Promise<GetSuperadminRingkasanResponse> {
        const response = await api.get<GetSuperadminRingkasanResponse>("/statistik/superadmin/ringkasan");
        return response.data;
    },

    async getMasukSampah(
        bankId: string,
        bulanMulai?: number,
        tahunMulai?: number,
        bulanSelesai?: number,
        tahunSelesai?: number,
    ): Promise<MasukSampahResponse> {
        const params: Record<string, number> = {};
        if (bulanMulai !== undefined && tahunMulai !== undefined) {
            params.bulan_mulai   = bulanMulai;
            params.tahun_mulai   = tahunMulai;
            params.bulan_selesai = bulanSelesai ?? bulanMulai;
            params.tahun_selesai = tahunSelesai ?? tahunMulai;
        }
        const res = await api.get<MasukSampahResponse>(
            `/statistik/masuk-sampah/${bankId}`,
            { params }
        );
        return res.data;
    },

    async getPenjualanSampah(
        bankId: string,
        bulanMulai?: number,
        tahunMulai?: number,
        bulanSelesai?: number,
        tahunSelesai?: number,
    ): Promise<PenjualanSampahResponse> {
        const params: Record<string, number> = {};
        if (bulanMulai !== undefined && tahunMulai !== undefined) {
            params.bulan_mulai   = bulanMulai;
            params.tahun_mulai   = tahunMulai;
            params.bulan_selesai = bulanSelesai ?? bulanMulai;
            params.tahun_selesai = tahunSelesai ?? tahunMulai;
        }
        const res = await api.get<PenjualanSampahResponse>(
            `/statistik/penjualan-sampah/${bankId}`,
            { params }
        );
        return res.data;
    },

    async getRankingBank(tahun?: number, limit?: number): Promise<RankingBankResponse> {
        const params: Record<string, number> = {};
        if (tahun !== undefined) params.tahun = tahun;
        if (limit !== undefined) params.limit = limit;
        const response = await api.get<RankingBankResponse>("/statistik/superadmin/ranking-bank", { params });
        return response.data;
    },

    async getTrenPenjualanSuperadmin(tahun: number): Promise<TrenPenjualanSuperadminResponse> {
        const response = await api.get<TrenPenjualanSuperadminResponse>(
            "/statistik/superadmin/tren-penjualan",
            { params: { tahun } }
        );
        return response.data;
    },

    async getSetoranSampah(
        bankId: string,
        bulanMulai?: number,
        tahunMulai?: number,
        bulanSelesai?: number,
        tahunSelesai?: number,
    ): Promise<StatistikSetoranResponse> {
        const params: Record<string, number> = {};
        if (bulanMulai !== undefined && tahunMulai !== undefined) {
            params.bulan_mulai = bulanMulai;
            params.tahun_mulai = tahunMulai;
            params.bulan_selesai = bulanSelesai ?? bulanMulai;
            params.tahun_selesai = tahunSelesai ?? tahunMulai;
        }
        const res = await api.get<StatistikSetoranResponse>(
            `/statistik/setoran-sampah/${bankId}`,
            { params }
        );
        return res.data;
    },

    async getKontribusiNasabah(
        bankId: string,
        bulanMulai?: number,
        tahunMulai?: number,
        bulanSelesai?: number,
        tahunSelesai?: number,
    ): Promise<KontribusiNasabahResponse> {
        const params: Record<string, number> = {};
        if (bulanMulai !== undefined && tahunMulai !== undefined) {
            params.bulan_mulai = bulanMulai;
            params.tahun_mulai = tahunMulai;
            params.bulan_selesai = bulanSelesai ?? bulanMulai;
            params.tahun_selesai = tahunSelesai ?? tahunMulai;
        }
        const res = await api.get<KontribusiNasabahResponse>(
            `/statistik/kontribusi-nasabah/${bankId}`,
            { params }
        );
        return res.data;
    },
};
