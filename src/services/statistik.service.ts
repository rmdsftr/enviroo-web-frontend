import { api } from "./api";
import type { GetBankSampahStatistikResponse } from "../types/statistik.type";

export const StatistikService = {
    async getBankSampahStatistik(): Promise<GetBankSampahStatistikResponse> {
        const response = await api.get<GetBankSampahStatistikResponse>("/statistik/bank-sampah");
        return response.data;
    }
};
