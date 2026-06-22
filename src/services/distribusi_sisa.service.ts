import { api } from "./api";
import type {
    KonfigurasiSisa,
    AddKonfigurasiSisaRequest,
    UpdateKonfigurasiSisaRequest,
    DistribusiSisaDetail,
    DistribusiSisaBsuDetail,
    BagiHasilBsuItem,
} from "../types/distribusi_sisa.type";

export const DistribusiSisaService = {
    async getKonfigurasi(bankId: string): Promise<KonfigurasiSisa> {
        const response = await api.get(`/distribusi-sisa/konfigurasi/${bankId}`);
        return response.data;
    },

    async addKonfigurasi(
        bankId: string,
        data: AddKonfigurasiSisaRequest,
    ): Promise<{ message: string } & KonfigurasiSisa> {
        const response = await api.post(`/distribusi-sisa/konfigurasi/${bankId}`, data);
        return response.data;
    },

    async updateKonfigurasi(
        bankId: string,
        data: UpdateKonfigurasiSisaRequest,
    ): Promise<{ message: string } & KonfigurasiSisa> {
        const response = await api.patch(`/distribusi-sisa/konfigurasi/${bankId}`, data);
        return response.data;
    },

    async getDetail(distribusiId: string): Promise<DistribusiSisaDetail> {
        const response = await api.get(`/distribusi-sisa/detail/${distribusiId}`);
        return response.data;
    },

    async getDetailBhBank(penerimaSisaId: string): Promise<DistribusiSisaBsuDetail> {
        const response = await api.get(`/distribusi-sisa/detail-bh-bank/${penerimaSisaId}`);
        return response.data;
    },

    async getRiwayatBagiHasilBsu(bankId: string, startDate?: string, endDate?: string): Promise<BagiHasilBsuItem[]> {
        const params: Record<string, string> = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        const response = await api.get<{ bank_id: string; jenis_bank: string; nama_bank: string; riwayat: BagiHasilBsuItem[] }>(
            `/distribusi-sisa/list-bh-bank/${bankId}`,
            { params }
        );
        return response.data.riwayat ?? [];
    },
};
