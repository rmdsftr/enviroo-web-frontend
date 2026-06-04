import { api } from "./api";
import type {
    Reward,
    AddRewardRequest,
    UpdateRewardRequest,
    NilaiRewardBank,
    AddNilaiRewardRequest,
    UpdateNilaiRewardRequest,
    HistoryNilaiReward,
    DetailNilaiRewardBank,
} from "../types/reward.type";

export const RewardService = {
    /* ── Master Reward (superadmin write, any-auth read) ─────────── */
    async getRewards(): Promise<{ message: string; data: Reward[] }> {
        const response = await api.get("/reward/get-all");
        return response.data;
    },

    async addReward(data: AddRewardRequest): Promise<{ message: string; data: Reward }> {
        const response = await api.post("/reward/add", data);
        return response.data;
    },

    async updateReward(rewardId: number, data: UpdateRewardRequest): Promise<{ message: string; data: Reward }> {
        const response = await api.patch(`/reward/update/${rewardId}`, data);
        return response.data;
    },

    async deleteReward(rewardId: number): Promise<{ message: string }> {
        const response = await api.delete(`/reward/delete/${rewardId}`);
        return response.data;
    },

    /* ── Nilai Reward per bank (BSI/BSM write, BSU read-only) ────── */
    async getNilaiReward(bankId: string): Promise<{ message: string; data: NilaiRewardBank[] }> {
        const response = await api.get(`/nilai-reward/get/${bankId}`);
        return response.data;
    },

    async getDetailNilaiReward(nilaiRewardId: string): Promise<{ message: string; data: DetailNilaiRewardBank }> {
        const response = await api.get(`/nilai-reward/detail/${nilaiRewardId}`);
        return response.data;
    },

    async addNilaiReward(
        bankId: string,
        data: AddNilaiRewardRequest,
    ): Promise<{ message: string; data: NilaiRewardBank }> {
        const response = await api.post(`/nilai-reward/add/${bankId}`, data);
        return response.data;
    },

    async updateNilaiReward(
        bankId: string,
        rewardId: number,
        data: UpdateNilaiRewardRequest,
    ): Promise<{ message: string; data: NilaiRewardBank[] }> {
        const response = await api.patch(`/nilai-reward/edit/${bankId}/${rewardId}`, data);
        return response.data;
    },

    async deleteNilaiReward(nilaiRewardId: string): Promise<{ message: string }> {
        const response = await api.delete(`/nilai-reward/delete/${nilaiRewardId}`);
        return response.data;
    },

    async getNilaiRewardHistory(
        nilaiRewardId: string,
    ): Promise<{ message: string; data: HistoryNilaiReward[] }> {
        const response = await api.get(`/nilai-reward/history/${nilaiRewardId}`);
        return response.data;
    },
};
