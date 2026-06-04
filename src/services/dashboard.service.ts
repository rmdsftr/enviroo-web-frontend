import { api } from "./api";

export interface MutasiItem {
    is_positive: boolean;
    nominal: number;
    keterangan: string;
    tanggal_transaksi: string;
}

export interface MutasiSaldoData {
    nama_reward: string;
    satuan_reward: string;
    total_debit: number;
    total_kredit: number;
    mutasi_items: MutasiItem[];
}

export interface MutasiSaldoResponse {
    message: string;
    data: MutasiSaldoData;
}

export const DashboardService = {
    async catatManualMutasi(
        bankId: string,
        body: { tipe_mutasi: "debit" | "kredit"; jenis_reward: "uang" | "poin"; nominal: number; keterangan: string }
    ): Promise<{ message: string }> {
        const res = await api.post(`/dashboard/catat-manual/${bankId}`, body);
        return res.data;
    },

    async getMutasiSaldo(
        bankId: string,
        params?: { reward_id?: number; start_date?: string; end_date?: string }
    ): Promise<MutasiSaldoResponse> {
        const res = await api.get<MutasiSaldoResponse>(
            `/dashboard/mutasi-bank/${bankId}`,
            { params }
        );
        return res.data;
    },
};
