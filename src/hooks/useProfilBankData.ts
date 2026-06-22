import { useState, useEffect, useMemo } from "react";
import { ProfilService } from "../services/profil.service";
import { NasabahService } from "../services/nasabah.service";
import { AdminService } from "../services/admin.service";
import { BsuService } from "../services/bsu.service";
import { PengangkutanService, type PengangkutanItem } from "../services/pengangkutan.service";
import { DistribusiSisaService } from "../services/distribusi_sisa.service";
import { defaultMonthRange } from "../components/filter-range";
import type { BankSampahProfile } from "../types/profil.type";
import type { NasabahBankSampah } from "../types/nasabah.type";
import type { AdminBankSampah } from "../types/admin.type";
import type { BSUByBankId } from "../types/bsu.type";
import type { BagiHasilBsuItem } from "../types/distribusi_sisa.type";

interface Props {
    id: string | undefined;
    isBsiUrl: boolean;
    isBsuUrl: boolean;
    userRole: string | undefined;
}

export function useProfilBankData({ id, isBsiUrl, isBsuUrl, userRole }: Props) {
    const [bankProfile, setBankProfile] = useState<BankSampahProfile | null>(null);
    const [nasabahList, setNasabahList] = useState<NasabahBankSampah[]>([]);
    const [adminList, setAdminList] = useState<AdminBankSampah[]>([]);
    const [bsuList, setBsuList] = useState<BSUByBankId[]>([]);

    const [angkutList, setAngkutList] = useState<PengangkutanItem[]>([]);
    const [angkutLoading, setAngkutLoading] = useState(false);
    const [bagiHasilBsuList, setBagiHasilBsuList] = useState<BagiHasilBsuItem[]>([]);
    const [bagiHasilBsuLoading, setBagiHasilBsuLoading] = useState(false);

    // Filter states
    const [staffFilter, setStaffFilter] = useState("all");
    const [angkutFrom, setAngkutFrom] = useState(() => defaultMonthRange().from);
    const [angkutTo, setAngkutTo] = useState(() => defaultMonthRange().to);
    const [angkutSearch, setAngkutSearch] = useState("");
    const [bagiHasilBsuFrom, setBagiHasilBsuFrom] = useState(() => defaultMonthRange().from);
    const [bagiHasilBsuTo, setBagiHasilBsuTo] = useState(() => defaultMonthRange().to);
    const [bagiHasilBsuSearch, setBagiHasilBsuSearch] = useState("");

    useEffect(() => {
        if (!id) return;

        ProfilService.getBankSampahProfile(id)
            .then((res) => setBankProfile(res.data))
            .catch((err) => console.error("Gagal menarik profil bank:", err));

        NasabahService.getNasabahByBankId(id)
            .then((res) => setNasabahList(res.data))
            .catch((err) => console.error("Gagal menarik daftar nasabah profil:", err));

        AdminService.getAdminByBankId(id)
            .then((res) => setAdminList(res.data))
            .catch((err) => console.error("Gagal menarik daftar admin profil:", err));

        if (isBsiUrl) {
            BsuService.getBsuByBankId(id)
                .then((res) => setBsuList(res.data))
                .catch((err) => console.error("Gagal menarik daftar bsu:", err));
        }

        if (isBsuUrl && userRole === "admin_bsi") {
            setAngkutLoading(true);
            PengangkutanService.getPengangkutanByBank(id)
                .then((data) => setAngkutList(data))
                .catch((err) => console.error("Gagal menarik data pengangkutan BSU:", err))
                .finally(() => setAngkutLoading(false));

            setBagiHasilBsuLoading(true);
            DistribusiSisaService.getRiwayatBagiHasilBsu(id)
                .then((data) => setBagiHasilBsuList(data))
                .catch((err) => console.error("Gagal menarik data bagi hasil BSU:", err))
                .finally(() => setBagiHasilBsuLoading(false));
        }
    }, [id, isBsiUrl, isBsuUrl, userRole]);

    // ── Computed stats ──
    const totalBsu = bsuList.length;
    const aktifBsu = bsuList.filter((b) => b.is_active).length;
    const nonaktifBsu = totalBsu - aktifBsu;

    const totalNasabah = nasabahList.length;
    const aktifNasabah = nasabahList.filter((n) => n.status_nasabah === "aktif").length;
    const nonaktifNasabah = nasabahList.filter((n) => n.status_nasabah === "nonaktif").length;
    const pendingNasabah = nasabahList.filter((n) => n.status_nasabah === "pending").length;

    const filteredAdminList = useMemo(() => {
        if (staffFilter === "all") return adminList;
        return adminList.filter((a) => a.role.startsWith(staffFilter));
    }, [adminList, staffFilter]);

    const filteredAngkut = useMemo(() => {
        const q = angkutSearch.toLowerCase();
        return angkutList.filter((item) => {
            if (!item.changed_at) return false;
            const month = item.changed_at.substring(0, 7);
            if (month < angkutFrom || month > angkutTo) return false;
            if (q) return item.pengangkutan_id.toLowerCase().includes(q);
            return true;
        });
    }, [angkutList, angkutFrom, angkutTo, angkutSearch]);

    const filteredBagiHasilBsu = useMemo(() => {
        const q = bagiHasilBsuSearch.toLowerCase();
        return bagiHasilBsuList.filter((item) => {
            const month = item.tanggal_distribusi.substring(0, 7);
            if (month < bagiHasilBsuFrom || month > bagiHasilBsuTo) return false;
            if (q) {
                return (
                    item.penerima_sisa_id.toLowerCase().includes(q) ||
                    item.distribusi_id.toLowerCase().includes(q) ||
                    item.bagi_hasil_id.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [bagiHasilBsuList, bagiHasilBsuFrom, bagiHasilBsuTo, bagiHasilBsuSearch]);

    return {
        bankProfile, setBankProfile,
        nasabahList, adminList, bsuList,
        // staff filter
        staffFilter, setStaffFilter, filteredAdminList,
        // pengangkutan
        angkutLoading, angkutFrom, setAngkutFrom, angkutTo, setAngkutTo,
        angkutSearch, setAngkutSearch, filteredAngkut,
        // bagi hasil bsu
        bagiHasilBsuLoading,
        bagiHasilBsuFrom, setBagiHasilBsuFrom,
        bagiHasilBsuTo, setBagiHasilBsuTo,
        bagiHasilBsuSearch, setBagiHasilBsuSearch,
        filteredBagiHasilBsu,
        // stats
        totalBsu, aktifBsu, nonaktifBsu,
        totalNasabah, aktifNasabah, nonaktifNasabah, pendingNasabah,
    };
}
