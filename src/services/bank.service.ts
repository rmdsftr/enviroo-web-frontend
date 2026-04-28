import type { BankActivationRequest } from "../types/bank.type";
import { api } from "./api";

export const BankService = {
    async AktivasiBank(bankId: string, data: BankActivationRequest) {
        const response = await api.patch(`/bank/aktivasi/${bankId}`, data);
        return response.data;
    },
}