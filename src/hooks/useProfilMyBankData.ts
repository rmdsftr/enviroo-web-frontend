import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ProfilService } from "../services/profil.service";
import { AdminService } from "../services/admin.service";
import type { DetailBank, SaldoBank, HistoryAkunBank } from "../types/profil.type";
import type { AdminBankSampah } from "../types/admin.type";

export function useProfilMyBankData(activeTab: string) {
    const { user, logout } = useAuth();
    const bankId = user?.bank_id ?? "";

    const [bank, setBank] = useState<DetailBank | null>(null);
    const [saldo, setSaldo] = useState<SaldoBank | null>(null);
    const [loading, setLoading] = useState(true);
    const [adminList, setAdminList] = useState<AdminBankSampah[]>([]);
    const [staffFilter, setStaffFilter] = useState<string>("all");
    const [historyList, setHistoryList] = useState<HistoryAkunBank[]>([]);

    useEffect(() => {
        if (!bankId) return;
        setLoading(true);
        Promise.all([
            ProfilService.getDetailBank(bankId),
            ProfilService.getSaldoBank(bankId),
        ])
            .then(([bankRes, saldoRes]) => {
                setBank(bankRes.data);
                setSaldo(saldoRes.data);
            })
            .catch((err) => console.error("Gagal memuat profil bank:", err))
            .finally(() => setLoading(false));
    }, [bankId]);

    useEffect(() => {
        if (!bankId) return;
        AdminService.getAdminByBankId(bankId)
            .then((res) => setAdminList(res.data))
            .catch((err) => console.error("Gagal memuat daftar staff:", err));
    }, [bankId]);

    useEffect(() => {
        if (activeTab !== "Log Akun Bank" || !bankId) return;
        ProfilService.getHistoryAkunBank(bankId)
            .then((res) => setHistoryList(res.data || []))
            .catch((err) => console.error("Gagal memuat riwayat akun bank:", err));
    }, [activeTab, bankId]);

    const filteredAdminList = useMemo(() => {
        if (staffFilter === "all") return adminList;
        return adminList.filter((a) => a.role.startsWith(staffFilter));
    }, [adminList, staffFilter]);

    const fetchBank = async () => {
        if (!bankId) return;
        const res = await ProfilService.getDetailBank(bankId);
        setBank(res.data);
    };

    const fetchAdminList = async () => {
        if (!bankId) return;
        const res = await AdminService.getAdminByBankId(bankId);
        setAdminList(res.data);
    };

    return {
        user, logout, bankId,
        bank, setBank, saldo, loading,
        adminList, setAdminList, filteredAdminList,
        staffFilter, setStaffFilter,
        historyList,
        fetchBank, fetchAdminList,
    };
}
