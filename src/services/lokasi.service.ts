import { api } from "./api";
import type { BankSampahLokasiResponse } from "../types/lokasi.type";

export const LokasiService = {
    async getLokasiBankSampah(): Promise<BankSampahLokasiResponse> {
        const response = await api.get<BankSampahLokasiResponse>("/lokasi/bank-sampah");
        return response.data;
    }
};
