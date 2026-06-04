import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { DashboardService, type MutasiItem } from "../services/dashboard.service";
import { formatThousands } from "../utils/number.utils";
import { formatTanggalJam } from "../utils/date.utils";
import FilterRange, { defaultMonthRange } from "../components/filter-range";
import Tabs from "../components/tabs";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import Button from "../components/button";
import Input from "../components/input";
import CloseButton from "../components/close-button";
import { FaArrowTrendUp, FaArrowTrendDown, FaPenToSquare, FaMoneyBillWave, FaStar } from "react-icons/fa6";
import "../styles/mutasi-saldo.css";

function lastDayOf(yyyymm: string) {
    const [y, m] = yyyymm.split("-").map(Number);
    return new Date(y, m, 0).getDate();
}

function fmtNominal(n: number, satuan: string, isUang: boolean) {
    return isUang
        ? `Rp ${n.toLocaleString("id-ID")}`
        : `${n.toLocaleString("id-ID")} ${satuan}`;
}

export default function MutasiSaldoPage() {
    const { user } = useAuth();
    const bankId = user?.bank_id ?? "";
    const isBsu = user?.role === "admin_bsu";

    const [rewardTab, setRewardTab] = useState("1");
    const { from: defFrom, to: defTo } = defaultMonthRange();
    const [from, setFrom] = useState(defFrom);
    const [to, setTo] = useState(defTo);

    const [namaReward, setNamaReward] = useState("");
    const [satuanReward, setSatuanReward] = useState("");
    const [totalDebit, setTotalDebit] = useState(0);
    const [totalKredit, setTotalKredit] = useState(0);
    const [items, setItems] = useState<MutasiItem[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEmpty, setIsEmpty] = useState(false);

    // ── Modal Catat Manual ──
    const [showModal, setShowModal] = useState(false);
    const [tipeMutasi, setTipeMutasi] = useState<"kredit" | "debit">("kredit");
    const [jenisReward, setJenisReward] = useState<"uang" | "poin">("uang");
    const [nominal, setNominal] = useState("");
    const [keterangan, setKeterangan] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notif, setNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const resetModal = () => {
        setTipeMutasi("kredit");
        setJenisReward("uang");
        setNominal("");
        setKeterangan("");
    };

    const handleCatatManual = async (e: React.FormEvent) => {
        e.preventDefault();
        const nominalNum = parseFloat(nominal.replace(/\./g, ""));
        if (!nominalNum || nominalNum <= 0) {
            setNotif({ message: "Nominal harus lebih dari 0.", type: "error" });
            return;
        }
        setIsSubmitting(true);
        try {
            await DashboardService.catatManualMutasi(bankId, {
                tipe_mutasi: tipeMutasi,
                jenis_reward: jenisReward,
                nominal: nominalNum,
                keterangan,
            });
            setShowModal(false);
            resetModal();
            setNotif({ message: "Mutasi berhasil dicatat.", type: "success" });
            setRewardTab(jenisReward === "uang" ? "1" : "2");
            setRefreshKey(k => k + 1);
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? "Gagal mencatat mutasi.";
            setNotif({ message: msg, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!bankId) return;
        setLoading(true);
        setError("");
        setIsEmpty(false);
        const startDate = `${from}-01`;
        const endDate = `${to}-${String(lastDayOf(to)).padStart(2, "0")}`;
        DashboardService.getMutasiSaldo(bankId, {
            reward_id: Number(rewardTab),
            start_date: startDate,
            end_date: endDate,
        })
            .then((res) => {
                const d = res.data;
                setNamaReward(d.nama_reward);
                setSatuanReward(d.satuan_reward);
                setTotalDebit(d.total_debit);
                setTotalKredit(d.total_kredit);
                setItems(d.mutasi_items ?? []);
            })
            .catch((err) => {
                setItems([]);
                setTotalDebit(0);
                setTotalKredit(0);
                if (err?.response?.status === 404) {
                    setIsEmpty(true);
                } else {
                    setError(err?.response?.data?.message ?? "Gagal memuat data mutasi saldo.");
                }
            })
            .finally(() => setLoading(false));
    }, [bankId, rewardTab, from, to, refreshKey]);

    const tabs = isBsu
        ? [{ id: "1", label: "Uang" }]
        : [
              { id: "1", label: "Uang" },
              { id: "2", label: "Poin" },
          ];

    const isUang = rewardTab === "1";
    const maxVal = Math.max(totalDebit, totalKredit, 1);
    const kreditPct = (totalKredit / maxVal) * 100;
    const debitPct = (totalDebit / maxVal) * 100;

    return (
        <>
            {notif && (
                <PopupNotifikasi
                    message={notif.message}
                    type={notif.type}
                    onClose={() => setNotif(null)}
                />
            )}

            <BreadcrumbLayout
                items={[
                    { label: "Profil Bank Sampah", path: "/profil-bank" },
                    { label: "Mutasi Saldo" },
                ]}
            />

            {/* ── Modal Catat Manual ── */}
            {showModal && (
                <div className="ms-modal-overlay" onClick={() => { setShowModal(false); resetModal(); }}>
                    <div className="ms-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ms-modal-header">
                            <div>
                                <p className="ms-modal-title">Catat Mutasi Manual</p>
                                <p className="ms-modal-subtitle">Catat pemasukan atau pengeluaran saldo bank sampah</p>
                            </div>
                            <CloseButton onClick={() => { setShowModal(false); resetModal(); }} />
                        </div>
                        <form onSubmit={handleCatatManual}>
                            <div className="ms-modal-body">
                                {/* Tipe Mutasi */}
                                <div className="ms-form-group">
                                    <span className="ms-form-label">Tipe Mutasi</span>
                                    <div className="ms-toggle-group">
                                        <button
                                            type="button"
                                            className={`ms-toggle-btn ${tipeMutasi === "kredit" ? "active--kredit" : ""}`}
                                            onClick={() => setTipeMutasi("kredit")}
                                        >
                                            <FaArrowTrendUp /> Kredit (Masuk)
                                        </button>
                                        <button
                                            type="button"
                                            className={`ms-toggle-btn ${tipeMutasi === "debit" ? "active--debit" : ""}`}
                                            onClick={() => setTipeMutasi("debit")}
                                        >
                                            <FaArrowTrendDown /> Debit (Keluar)
                                        </button>
                                    </div>
                                </div>

                                {/* Jenis Reward */}
                                {!isBsu && (
                                    <div className="ms-form-group">
                                        <span className="ms-form-label">Jenis Reward</span>
                                        <div className="ms-toggle-group">
                                            <button
                                                type="button"
                                                className={`ms-toggle-btn ${jenisReward === "uang" ? "active--uang" : ""}`}
                                                onClick={() => setJenisReward("uang")}
                                            >
                                                <FaMoneyBillWave /> Uang
                                            </button>
                                            <button
                                                type="button"
                                                className={`ms-toggle-btn ${jenisReward === "poin" ? "active--poin" : ""}`}
                                                onClick={() => setJenisReward("poin")}
                                            >
                                                <FaStar /> Poin
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Nominal */}
                                <div className="ms-form-group">
                                    <span className="ms-form-label">Nominal</span>
                                    <Input
                                        className="ms-input-neutral"
                                        variant="solid"
                                        inputSize="default"
                                        fullWidth
                                        type="text"
                                        inputMode="numeric"
                                        placeholder={jenisReward === "uang" ? "0" : "0"}
                                        iconLeft={jenisReward === "uang" ? <span style={{ fontSize: 13, fontWeight: 600, color: "#5a7a68" }}>Rp</span> : undefined}
                                        iconRight={jenisReward === "poin" ? <span style={{ fontSize: 12, fontWeight: 600, color: "#5a7a68" }}>poin</span> : undefined}
                                        value={nominal}
                                        onChange={(e) => setNominal(formatThousands(e.target.value))}
                                        required
                                    />
                                </div>

                                {/* Keterangan */}
                                <div className="ms-form-group">
                                    <span className="ms-form-label">Keterangan</span>
                                    <Input
                                        className="ms-input-neutral"
                                        variant="solid"
                                        inputSize="default"
                                        fullWidth
                                        type="text"
                                        placeholder="Deskripsi transaksi ini..."
                                        value={keterangan}
                                        onChange={(e) => setKeterangan(e.target.value)}
                                        required
                                    />
                                </div>

                            </div>
                            <div className="ms-modal-footer">
                                <Button
                                    type="button"
                                    color="primary"
                                    variant="outline"
                                    size="default"
                                    onClick={() => { setShowModal(false); resetModal(); }}
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    variant="solid"
                                    size="default"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Menyimpan..." : "Simpan"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        <div className="ms-page">

            {/* Filters */}
            <div className="ms-filters">
                <Tabs
                    tabs={tabs}
                    activeTab={rewardTab}
                    onChange={(id) => { setRewardTab(id); }}
                />
                <div className="ms-filters-right">
                    <Button color="secondary" variant="solid" size="default" isRounded icon={<FaPenToSquare />} onClick={() => setShowModal(true)}>
                        Catat Mutasi Manual
                    </Button>
                    <FilterRange
                        from={from}
                        to={to}
                        onChange={(f, t) => { setFrom(f); setTo(t); }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="ms-state">Memuat data...</div>
            ) : error ? (
                <div className="ms-state ms-state--error">{error}</div>
            ) : isEmpty ? (
                <div className="ms-state">Belum ada data rekening untuk jenis reward ini.</div>
            ) : (
                <>
                    {/* Chart Card */}
                    <div className="ms-card">
                        <p className="ms-card-title">Ringkasan Mutasi — {namaReward}</p>

                        <div className="ms-chart">
                            <div className="ms-chart-bars">
                                {/* Kredit */}
                                <div className="ms-bar-group">
                                    <span className="ms-bar-label-top">
                                        {fmtNominal(totalKredit, satuanReward, isUang)}
                                    </span>
                                    <div className="ms-bar-track">
                                        <div
                                            className="ms-bar ms-bar--kredit"
                                            style={{ height: `${kreditPct}%` }}
                                        />
                                    </div>
                                    <span className="ms-bar-label-bot">Kredit (Masuk)</span>
                                </div>

                                {/* Debit */}
                                <div className="ms-bar-group">
                                    <span className="ms-bar-label-top">
                                        {fmtNominal(totalDebit, satuanReward, isUang)}
                                    </span>
                                    <div className="ms-bar-track">
                                        <div
                                            className="ms-bar ms-bar--debit"
                                            style={{ height: `${debitPct}%` }}
                                        />
                                    </div>
                                    <span className="ms-bar-label-bot">Debit (Keluar)</span>
                                </div>
                            </div>
                        </div>

                        <div className="ms-summary-chips">
                            <div className="ms-chip ms-chip--kredit">
                                <FaArrowTrendUp />
                                <span>Total Kredit</span>
                                <strong>{fmtNominal(totalKredit, satuanReward, isUang)}</strong>
                            </div>
                            <div className="ms-chip ms-chip--debit">
                                <FaArrowTrendDown />
                                <span>Total Debit</span>
                                <strong>{fmtNominal(totalDebit, satuanReward, isUang)}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Mutasi List */}
                    <div className="ms-card">
                        <p className="ms-card-title">Riwayat Transaksi</p>
                        {items.length === 0 ? (
                            <div className="ms-empty">Tidak ada transaksi pada periode ini.</div>
                        ) : (
                            <div className="ms-list">
                                {items.map((item, i) => (
                                    <div
                                        key={i}
                                        className={`ms-item ${item.is_positive ? "ms-item--kredit" : "ms-item--debit"}`}
                                    >
                                        <div className="ms-item-icon">
                                            {item.is_positive ? <FaArrowTrendUp /> : <FaArrowTrendDown />}
                                        </div>
                                        <span className="ms-item-ket">{item.keterangan || "-"}</span>
                                        <span className="ms-item-date">{formatTanggalJam(item.tanggal_transaksi)}</span>
                                        <span className={`ms-item-nominal ${item.is_positive ? "positive" : "negative"}`}>
                                            {item.is_positive ? "+" : "-"}
                                            {fmtNominal(item.nominal, satuanReward, isUang)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
        </>
    );
}
