import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../contexts/AuthContext";
import { KatalogService } from "../services/katalog.service";
import { RewardService } from "../services/reward.service";
import { SembakoService } from "../services/sembako.service";
import { BsiService } from "../services/bsi.service";
import { BankService, type BankSampahOption } from "../services/bank.service";
import type {
    KategoriSampah as KategoriSampahT,
    SatuanEnum,
    KatalogSampah,
    KatalogDetail,
} from "../types/katalog.type";
import type { Reward } from "../types/reward.type";
import type { KatalogSembakoItem, RiwayatDistribusi } from "../types/sembako.type";
import type { UnitBSI } from "../types/bsi.type";
import {
    FaCoins, FaBoxOpen, FaBasketShopping,
    FaBuilding, FaPlus, FaCloudArrowUp, FaTrash, FaPen
} from "react-icons/fa6";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import Input from "../components/input";
import Dropdown from "../components/dropdown";
import Tabs from "../components/tabs";
import FilterPill from "../components/filter-pill";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import PopupConfirmation from "../layouts/popup-confirmation";
import "../styles/katalog.css";
import { formatTanggalJam, formatTanggal } from "../utils/date.utils";
import { getApiError } from "../utils/error.utils";

const SATUAN_OPTIONS: { value: "all" | "kg" | "pcs" | "liter"; label: string }[] = [
    { value: "all", label: "Semua" },
    { value: "kg", label: "Kg" },
    { value: "pcs", label: "Pcs" },
    { value: "liter", label: "Liter" }
];


function SampahCard({ item, onClick, hideStok }: { item: KatalogSampah; onClick?: () => void; hideStok?: boolean }) {
    return (
        <div className="katalog-card" onClick={onClick}>
            <div className="katalog-card-img" style={{ background: "linear-gradient(135deg, rgba(78, 167, 113, 0.15) 0%, rgba(1, 50, 54, 0.05) 100%)", overflow: "hidden" }}>
                {item.photo_url ? (
                    <img src={item.photo_url} alt={item.nama_sampah} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <span className="katalog-card-emoji"><FaBoxOpen color="#4EA771" style={{ opacity: 0.7 }} /></span>
                )}
            </div>
            <div className="katalog-card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                    <h3 className="katalog-card-name">{item.nama_sampah}</h3>
                    <div style={{ fontSize: "11.5px", color: "var(--k-muted)" }}>{item.kategori?.Kategori || "-"}</div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <div className="katalog-price-tag price-poin">
                        <FaCoins size={10} />
                        {item.reward?.NamaReward || "-"}
                    </div>
                    {!hideStok && (
                        <div className="katalog-price-tag" style={{ background: "rgba(1,50,54,0.06)", color: "var(--k-dark)" }}>
                            <FaBoxOpen size={10} />
                            {item.stok ?? 0} {item.satuan}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SembakoCard({ item, onClick }: { item: KatalogSembakoItem; onClick?: () => void }) {
    return (
        <div className="katalog-card" onClick={onClick}>
            <div className="katalog-card-img" style={{ background: "linear-gradient(135deg, rgba(148, 223, 12, 0.15) 0%, rgba(1, 50, 54, 0.05) 100%)", overflow: "hidden" }}>
                {item.photo_url ? (
                    <img src={item.photo_url} alt={item.nama_sembako} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <span className="katalog-card-emoji"><FaBasketShopping color="#94DF0C" style={{ opacity: 0.7 }} /></span>
                )}
            </div>
            <div className="katalog-card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                    <h3 className="katalog-card-name">{item.nama_sembako}</h3>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <div className="katalog-price-tag price-poin">
                        <FaCoins size={10} />{item.nilai_poin} poin
                    </div>
                    <div className="katalog-price-tag" style={{ background: "rgba(1,50,54,0.06)", color: "var(--k-dark)" }}>
                        <FaBoxOpen size={10} />{item.stok ?? 0}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function KatalogPage() {
    const { user } = useAuth();
    const isAdminBsi = user?.role === "admin_bsi";
    const isAdminBsm = user?.role === "admin_bsm";
    const isSuperadmin = user?.role === "superadmin";
    const canEdit = isAdminBsi || isAdminBsm;

    // Superadmin: pilih bank dari dropdown
    const [superadminBankId, setSuperadminBankId] = useState("");
    const [allBankList, setAllBankList] = useState<BankSampahOption[]>([]);

    // Popup state
    const [notif, setNotif] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

    const showNotif = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => setNotif({ message, type });
    const showConfirm = (title: string, message: string, onConfirm: () => void) =>
        setConfirmState({ isOpen: true, title, message, onConfirm });
    const closeConfirm = () => setConfirmState(null);

    // API Data
    const [categories, setCategories] = useState<KategoriSampahT[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [katalogList, setKatalogList] = useState<KatalogSampah[]>([]);
    const [sembakoList, setSembakoList] = useState<KatalogSembakoItem[]>([]);

    // Sembako filter: admin_bsi bisa switch antara katalog BSI sendiri & per BSU
    const [sembakoFilterBank, setSembakoFilterBank] = useState<string>(user?.bank_id ?? "");
    const [bsuList, setBsuList] = useState<UnitBSI[]>([]);
    const [bsuRiwayat, setBsuRiwayat] = useState<RiwayatDistribusi[] | null>(null);

    const isViewingBSU = isAdminBsi && !!sembakoFilterBank && sembakoFilterBank !== user?.bank_id;
    const canEditSembako = canEdit && !isViewingBSU;

    const fetchKatalog = useCallback(() => {
        if (!user?.bank_id) return;
        KatalogService.getKatalogSampahBank(user.bank_id)
            .then(res => setKatalogList(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error("Failed to fetch katalog bank", err));
    }, [user?.bank_id]);

    const fetchSembako = useCallback((bankId: string) => {
        if (!bankId) return;
        SembakoService.getSembakoBank(bankId)
            .then(res => setSembakoList(res.data || []))
            .catch(err => console.error("Failed to fetch sembako bank", err));
    }, []);

    const fetchBsuList = useCallback(() => {
        if (!isAdminBsi || !user?.bank_id) return;
        BsiService.getUnit(user.bank_id)
            .then(res => setBsuList(res.data || []))
            .catch(err => console.error("Failed to fetch BSU list", err));
    }, [isAdminBsi, user?.bank_id]);

    useEffect(() => {
        KatalogService.getKategori()
            .then(res => {
                setCategories(res.data || []);
                if (res.data && res.data.length > 0) {
                    setAddKategori(res.data[0].KategoriID);
                }
            })
            .catch(err => console.error("Failed to fetch kategori", err));

        RewardService.getRewards()
            .then(res => {
                setRewards(res.data || []);
                if (res.data && res.data.length > 0) {
                    setAddRewardId(res.data[0].RewardID);
                }
            })
            .catch(err => console.error("Failed to fetch rewards", err));

        if (isSuperadmin) {
            BankService.getAllBanks()
                .then(data => {
                    setAllBankList(data);
                    if (data.length > 0) setSuperadminBankId(data[0].bank_id);
                })
                .catch(err => console.error("Failed to fetch bank list", err));
        } else {
            fetchKatalog();
            if (user?.bank_id) fetchSembako(user.bank_id);
            fetchBsuList();
        }
    }, [fetchKatalog, fetchSembako, fetchBsuList, user?.bank_id, isSuperadmin]);

    useEffect(() => {
        if (!isSuperadmin || !superadminBankId) return;
        setKatalogList([]);
        setSembakoList([]);
        setSelectedItem(null);
        setSelectedItemDetail(null);
        setSelectedSembako(null);
        KatalogService.getKatalogSampahBank(superadminBankId)
            .then(res => setKatalogList(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error("Failed to fetch katalog superadmin", err));
        fetchSembako(superadminBankId);
    }, [superadminBankId, isSuperadmin, fetchSembako]);

    const [activeTab, setActiveTab] = useState<"sampah" | "sembako">("sampah");
    const [filterKategori, setFilterKategori] = useState<number | "all">("all");
    const [filterSatuan, setFilterSatuan] = useState<"all" | "kg" | "pcs" | "liter">("all");
    const [filterReward, setFilterReward] = useState<number | "all">("all");

    // Modal state
    const [formMode, setFormMode] = useState<"add" | "edit-item" | "add-sembako" | "edit-sembako" | null>(null);
    const [selectedItem, setSelectedItem] = useState<KatalogSampah | null>(null);
    const [selectedItemDetail, setSelectedItemDetail] = useState<KatalogDetail | null>(null);
    const [selectedSembako, setSelectedSembako] = useState<KatalogSembakoItem | null>(null);

    // ── Sampah form state ──────────────────────────────────────────────────
    const [addNama, setAddNama] = useState("");
    const [addSatuan, setAddSatuan] = useState("kg");
    const [addKategori, setAddKategori] = useState<number>(0);
    const [addRewardId, setAddRewardId] = useState<number>(0);
    const [addSyaratPemilahan, setAddSyaratPemilahan] = useState("");
    const [addFoto, setAddFoto] = useState<File | null>(null);
    const [addFotoPreview, setAddFotoPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        setAddFoto(file);
        const reader = new FileReader();
        reader.onloadend = () => setAddFotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const removeFoto = () => {
        setAddFoto(null);
        setAddFotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const resetForm = () => {
        setAddNama("");
        setAddSatuan("kg");
        setAddKategori(categories.length > 0 ? categories[0].KategoriID : 0);
        setAddRewardId(rewards.length > 0 ? rewards[0].RewardID : 0);
        setAddSyaratPemilahan("");
        setAddFoto(null);
        setAddFotoPreview(null);
    };

    const openAddModal = () => {
        resetForm();
        setFormMode("add");
    };

    const openEditItemModal = () => {
        if (!selectedItem) return;
        setAddNama(selectedItem.nama_sampah);
        setAddSatuan(selectedItem.satuan);
        setAddKategori(selectedItem.kategori_id);
        setAddRewardId(selectedItem.reward_id);
        setAddSyaratPemilahan(selectedItem.syarat_pemilahan || "");
        setAddFoto(null);
        setAddFotoPreview(selectedItem.photo_url || null);
        setFormMode("edit-item");
    };

    const closeFormModal = () => setFormMode(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.bank_id) return;
        setIsSubmitting(true);
        try {
            if (formMode === "add") {
                await KatalogService.addKatalog(user.bank_id, {
                    nama_sampah: addNama,
                    satuan: addSatuan as SatuanEnum,
                    kategori_id: addKategori,
                    reward_id: addRewardId,
                    syarat_pemilahan: addSyaratPemilahan || undefined,
                    foto: addFoto || undefined,
                });
                showNotif("Katalog sampah berhasil ditambahkan!");
            } else if (formMode === "edit-item" && selectedItem) {
                await KatalogService.editKatalog(selectedItem.sampah_id, {
                    nama_sampah: addNama,
                    satuan: addSatuan as SatuanEnum,
                    kategori_id: addKategori,
                    reward_id: addRewardId,
                    syarat_pemilahan: addSyaratPemilahan || undefined,
                    foto: addFoto || undefined,
                });
                showNotif("Detail katalog berhasil diperbarui!");
                setSelectedItem(null);
                setSelectedItemDetail(null);
            }
            closeFormModal();
            fetchKatalog();
            resetForm();
        } catch (error) {
            console.error("Gagal menyimpan katalog", error);
            showNotif(getApiError(error, "Gagal menyimpan perubahan."), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem) return;
        showConfirm(
            "Hapus Item Katalog",
            `Yakin ingin menghapus "${selectedItem.nama_sampah}"? Tindakan ini tidak bisa dibatalkan.`,
            async () => {
                closeConfirm();
                try {
                    await KatalogService.deleteKatalogSampah(selectedItem.sampah_id);
                    showNotif("Item berhasil dihapus!");
                    setSelectedItem(null);
                    setSelectedItemDetail(null);
                    fetchKatalog();
                } catch (error) {
                    console.error("Gagal menghapus katalog", error);
                    showNotif(getApiError(error, "Gagal menghapus item."), "error");
                }
            }
        );
    };

    const handleViewDetail = async (item: KatalogSampah) => {
        setSelectedItem(item);
        setSelectedItemDetail(null);
        try {
            const res = await KatalogService.getDetailSampah(item.sampah_id);
            setSelectedItemDetail(res.data);
        } catch (error) {
            console.error("Failed to load detail sampah", error);
        }
    };

    const filteredSampah = useMemo(() =>
        katalogList.filter(i =>
            (filterKategori === "all" || i.kategori_id === filterKategori) &&
            (filterSatuan === "all" || i.satuan.toLowerCase() === filterSatuan) &&
            (filterReward === "all" || i.reward_id === filterReward)
        ), [katalogList, filterKategori, filterSatuan, filterReward]);

    const filteredSembako = useMemo(() => sembakoList, [sembakoList]);

    // ── Sembako form state ─────────────────────────────────────────────────
    const [sembakoNama, setSembakoNama] = useState("");
    const [sembakoPoin, setSembakoPoin] = useState("");
    const [sembakoStok, setSembakoStok] = useState("");
    const [sembakoTambahStok, setSembakoTambahStok] = useState("");
    const [sembakoFoto, setSembakoFoto] = useState<File | null>(null);
    const [sembakoFotoPreview, setSembakoFotoPreview] = useState<string | null>(null);
    const sembakoFileRef = useRef<HTMLInputElement>(null);

    const handleSembakoFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        setSembakoFoto(file);
        const reader = new FileReader();
        reader.onloadend = () => setSembakoFotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const resetSembakoForm = () => {
        setSembakoNama("");
        setSembakoPoin("");
        setSembakoStok("");
        setSembakoTambahStok("");
        setSembakoFoto(null);
        setSembakoFotoPreview(null);
    };

    const openAddSembakoModal = () => {
        resetSembakoForm();
        setFormMode("add-sembako");
    };

    const openEditSembakoModal = () => {
        if (!selectedSembako) return;
        setSembakoNama(selectedSembako.nama_sembako);
        setSembakoPoin(selectedSembako.nilai_poin.toString());
        setSembakoStok("");
        setSembakoTambahStok("");
        setSembakoFotoPreview(selectedSembako.photo_url || null);
        setSembakoFoto(null);
        setFormMode("edit-sembako");
    };

    const handleSembakoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.bank_id) { showNotif("Bank ID tidak ditemukan.", "error"); return; }
        setIsSubmitting(true);
        try {
            if (formMode === "add-sembako") {
                await SembakoService.addSembako(user.bank_id, {
                    nama_sembako: sembakoNama,
                    nilai_poin: Number(sembakoPoin),
                    stok: sembakoStok !== "" ? Number(sembakoStok) : undefined,
                    created_by: user.identity_id || undefined,
                    foto: sembakoFoto || undefined,
                });
                showNotif("Sembako berhasil ditambahkan!");
            } else if (formMode === "edit-sembako" && selectedSembako) {
                await SembakoService.editSembako(selectedSembako.sembako_id, {
                    nama_sembako: sembakoNama || undefined,
                    nilai_poin: sembakoPoin !== "" ? Number(sembakoPoin) : undefined,
                    tambah_stok: sembakoTambahStok !== "" ? Number(sembakoTambahStok) : undefined,
                    stok: sembakoStok !== "" ? Number(sembakoStok) : undefined,
                    updated_by: user.identity_id || undefined,
                    foto: sembakoFoto || undefined,
                });
                showNotif("Sembako berhasil diperbarui!");
                setSelectedSembako(null);
            }
            setFormMode(null);
            fetchSembako(sembakoFilterBank);
            resetSembakoForm();
        } catch (error) {
            console.error("Gagal menyimpan sembako", error);
            showNotif(getApiError(error, "Gagal menyimpan perubahan."), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSembako = async () => {
        if (!selectedSembako) return;
        showConfirm(
            "Hapus Item Sembako",
            `Yakin ingin menghapus "${selectedSembako.nama_sembako}"? Tindakan ini tidak bisa dibatalkan.`,
            async () => {
                closeConfirm();
                try {
                    await SembakoService.deleteSembako(selectedSembako.sembako_id);
                    showNotif("Sembako berhasil dihapus!");
                    setSelectedSembako(null);
                    fetchSembako(sembakoFilterBank);
                } catch (error) {
                    console.error("Gagal menghapus sembako", error);
                    showNotif(getApiError(error, "Gagal menghapus."), "error");
                }
            }
        );
    };

    const handleViewSembakoDetail = async (item: KatalogSembakoItem) => {
        setSelectedSembako(item);
        setBsuRiwayat(null);
        if (isViewingBSU) {
            try {
                const res = await SembakoService.getDetailSembakoBSU(item.sembako_id);
                setBsuRiwayat(res.data?.riwayat_distribusi ?? []);
            } catch (err) {
                console.error("Failed to load BSU distribution history", err);
                setBsuRiwayat([]);
            }
        }
    };

    const count = activeTab === "sampah" ? filteredSampah.length : filteredSembako.length;

    return (
        <div className="katalog-page">

            {/* ── Popups ── */}
            {notif && (
                <PopupNotifikasi
                    message={notif.message}
                    type={notif.type}
                    onClose={() => setNotif(null)}
                />
            )}
            {confirmState && (
                <PopupConfirmation
                    isOpen={confirmState.isOpen}
                    type="danger"
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmText="Ya, Hapus"
                    cancelText="Batal"
                    onConfirm={confirmState.onConfirm}
                    onCancel={closeConfirm}
                />
            )}

            <div className={`katalog-content-layout ${(activeTab === "sampah" || (isAdminBsi && activeTab === "sembako")) ? "has-sidebar" : ""}`}>
                {/* ── Left Column ── */}
                <div className="katalog-content-main">

                    <Tabs
                        tabs={[
                            { id: "sampah", label: "Katalog Sampah" },
                            { id: "sembako", label: "Katalog Sembako" }
                        ]}
                        activeTab={activeTab}
                        onChange={(id) => {
                            setActiveTab(id as any);
                            setFilterKategori("all");
                        }}
                        style={{ marginBottom: '14px' }}
                    />

                    <div className="katalog-desc-section" style={{ paddingTop: 0 }}>
                        <p className="katalog-desc">
                            {activeTab === "sampah"
                                ? "Daftar jenis sampah yang dapat disetor oleh nasabah ke Bank Sampah. Setiap item memiliki harga konversi berupa uang tunai atau poin yang ditentukan oleh masing-masing Bank Sampah."
                                : "Daftar produk kebutuhan pokok yang dapat ditukarkan oleh nasabah menggunakan poin hasil setoran sampah. Program ini mendorong nasabah untuk aktif menabung sampah."
                            }
                        </p>

                        <div className="katalog-action-row">
                            <span className="katalog-count">{count} item</span>
                            {isSuperadmin && (
                                <div style={{ width: "280px" }}>
                                    <Dropdown
                                        options={allBankList.map(b => ({
                                            label: `${b.nama_bank} (${b.jenis_bank.toUpperCase()})`,
                                            value: b.bank_id,
                                        }))}
                                        value={superadminBankId}
                                        onChange={(e) => setSuperadminBankId(e.target.value)}
                                        placeholder="Pilih bank sampah..."
                                        fullWidth
                                        isRounded
                                    />
                                </div>
                            )}
                            {(activeTab === "sampah" ? canEdit : canEditSembako) && (
                                <Button icon={<FaPlus />} color='secondary' isRounded onClick={activeTab === "sampah" ? openAddModal : openAddSembakoModal}>
                                    {activeTab === "sampah" ? "Tambah Katalog Sampah" : "Tambah Katalog Sembako"}
                                </Button>
                            )}
                        </div>

                        <hr className="katalog-divider" />
                    </div>

                    {/* Card Grid */}
                    {isSuperadmin && !superadminBankId ? (
                        <div className="katalog-empty">
                            <FaBuilding />
                            <span>Pilih bank sampah untuk melihat katalog</span>
                        </div>
                    ) : activeTab === "sampah" ? (
                        filteredSampah.length === 0
                            ? <div className="katalog-empty"><FaBoxOpen /><span>Tidak ada item ditemukan</span></div>
                            : <div className="katalog-grid">
                                {filteredSampah.map(i => <SampahCard key={i.sampah_id} item={i} onClick={() => handleViewDetail(i)} hideStok={isSuperadmin} />)}
                              </div>
                    ) : (
                        filteredSembako.length === 0
                            ? <div className="katalog-empty"><FaBasketShopping /><span>Tidak ada item ditemukan</span></div>
                            : <div className="katalog-grid">
                                {filteredSembako.map(i => <SembakoCard key={i.sembako_id} item={i} onClick={() => handleViewSembakoDetail(i)} />)}
                              </div>
                    )}
                </div>

                {/* ── Right Column: Filters (Sampah) ── */}
                {activeTab === "sampah" && (
                    <div className="katalog-side-col">
                        <aside className="katalog-filter-sidebar">

                            <div className="kf-group">
                                <span className="kf-group-label">Kategori Sampah</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                                    <FilterPill
                                        options={[
                                            { label: "Semua", value: "all" },
                                            ...categories.map(cat => ({ label: cat.Kategori, value: cat.KategoriID }))
                                        ]}
                                        activeValue={filterKategori}
                                        onChange={(v) => setFilterKategori(v)}
                                    />
                                </div>
                            </div>

                            <div className="kf-group">
                                <span className="kf-group-label">Jenis Satuan</span>
                                <FilterPill
                                    options={SATUAN_OPTIONS}
                                    activeValue={filterSatuan}
                                    onChange={(v) => setFilterSatuan(v as "all" | "kg" | "pcs" | "liter")}
                                />
                            </div>

                            <div className="kf-group">
                                <span className="kf-group-label">Nilai Jual</span>
                                <FilterPill
                                    options={[
                                        { label: "Semua", value: "all" },
                                        ...rewards.map(r => ({ label: r.NamaReward, value: r.RewardID }))
                                    ]}
                                    activeValue={filterReward}
                                    onChange={(v) => setFilterReward(v)}
                                />
                            </div>

                        </aside>
                    </div>
                )}

                {/* ── Right Column: BSU Filter (Sembako, admin_bsi only) ── */}
                {activeTab === "sembako" && isAdminBsi && (
                    <div className="katalog-side-col">
                        <aside className="katalog-filter-sidebar">

                            <div className="kf-group">
                                <span className="kf-group-label">Katalog</span>
                                <FilterPill
                                    options={[{ label: "Katalog Saya", value: user?.bank_id ?? "" }]}
                                    activeValue={sembakoFilterBank}
                                    onChange={(v) => {
                                        const bankId = v as string;
                                        setSembakoFilterBank(bankId);
                                        setSelectedSembako(null);
                                        fetchSembako(bankId);
                                    }}
                                />
                            </div>

                            {bsuList.length > 0 && (
                                <>
                                    <hr className="katalog-divider" />
                                    <div className="kf-group">
                                        <span className="kf-group-label">Unit BSU</span>
                                        <FilterPill
                                            options={bsuList.map(b => ({ label: b.NamaBank, value: b.BankID }))}
                                            activeValue={sembakoFilterBank}
                                            onChange={(v) => {
                                                const bankId = v as string;
                                                setSembakoFilterBank(bankId);
                                                setSelectedSembako(null);
                                                fetchSembako(bankId);
                                            }}
                                        />
                                    </div>
                                </>
                            )}

                        </aside>
                    </div>
                )}
            </div>

            {/* ── Sampah: Form Modal (Add / Edit) ── */}
            {(formMode === "add" || formMode === "edit-item") && typeof document !== "undefined" && createPortal(
                <div className="katalog-modal-overlay" onClick={closeFormModal}>
                    <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()}>

                        <div className="km-header">
                            <div>
                                <h3 className="km-title">
                                    {formMode === "add" ? "Tambah Katalog Sampah" : "Edit Detail Item"}
                                </h3>
                                <p className="km-subtitle">
                                    {formMode === "add"
                                        ? "Tambahkan item sampah baru beserta kategori dan jenis reward-nya."
                                        : "Perbarui informasi item katalog. Harga konversi diperbarui otomatis dari penjualan."}
                                </p>
                            </div>
                            <CloseButton onClick={closeFormModal} />
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '28px',
                                padding: '24px 28px 0',
                            }}>

                                {/* ── Kolom 1: Info Dasar ── */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                        Informasi Item
                                    </div>

                                    <div className="km-group">
                                        <label className="km-label">Nama Sampah <span className="km-req">*</span></label>
                                        <Input
                                            className="km-input-neutral"
                                            placeholder="Contoh: Kardus Bekas"
                                            fullWidth
                                            value={addNama}
                                            onChange={(e) => setAddNama(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="km-group">
                                            <label className="km-label">Satuan <span className="km-req">*</span></label>
                                            <Dropdown
                                                fullWidth
                                                options={[{ label: "Kg", value: "kg" }, { label: "Pcs", value: "pcs" }, { label: "Liter", value: "liter" }]}
                                                value={addSatuan}
                                                onChange={(e) => setAddSatuan(e.target.value)}
                                            />
                                        </div>
                                        <div className="km-group">
                                            <label className="km-label">Kategori <span className="km-req">*</span></label>
                                            <Dropdown
                                                fullWidth
                                                options={categories.map(c => ({ label: c.Kategori, value: c.KategoriID }))}
                                                value={addKategori}
                                                onChange={(e) => setAddKategori(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="km-group">
                                        <label className="km-label">Jenis Reward <span className="km-req">*</span></label>
                                        <Dropdown
                                            fullWidth
                                            options={rewards.map(r => ({ label: `${r.NamaReward} (${r.Satuan})`, value: r.RewardID }))}
                                            value={addRewardId}
                                            onChange={(e) => setAddRewardId(Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="km-group">
                                        <label className="km-label">Syarat Pemilahan</label>
                                        <textarea
                                            className="km-textarea"
                                            placeholder="Contoh: Harus bersih dan kering"
                                            rows={3}
                                            value={addSyaratPemilahan}
                                            onChange={(e) => setAddSyaratPemilahan(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* ── Kolom 2: Upload Foto ── */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                        Foto Item
                                    </div>

                                    <div className="km-group">
                                        <label className="km-label">Foto Sampah</label>
                                        <div
                                            className={`km-file-area ${dragging ? "dragging" : ""} ${addFotoPreview ? "has-file" : ""}`}
                                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                            onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                                            onDrop={handleDrop}
                                            onClick={() => !addFotoPreview && fileInputRef.current?.click()}
                                            style={{ height: '200px' }}
                                        >
                                            {addFotoPreview ? (
                                                <div className="km-preview-container">
                                                    <img src={addFotoPreview} alt="Preview" className="km-preview-img" style={{ height: '200px' }} />
                                                    <div className="km-preview-actions">
                                                        <button type="button" className="km-btn-remove" onClick={(e) => { e.stopPropagation(); removeFoto(); }}>
                                                            <FaTrash /> Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="km-upload-prompt">
                                                    <div className="km-upload-icon"><FaCloudArrowUp /></div>
                                                    <div className="km-upload-text">Klik atau seret foto ke sini</div>
                                                    <div className="km-upload-hint">JPG, PNG (Maks 5MB)</div>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg, image/jpg"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                style={{ display: "none" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="km-footer">
                                <Button type="button" variant="outline" color="primary" onClick={closeFormModal}>Batal</Button>
                                <Button type="submit" color="primary" disabled={isSubmitting}>
                                    {isSubmitting ? "Menyimpan..." : (formMode === "add" ? "Simpan Katalog" : "Simpan Perubahan")}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Sampah: Detail Modal ── */}
            {selectedItem && typeof document !== "undefined" && createPortal(
                <div className="katalog-modal-overlay" onClick={() => { setSelectedItem(null); setSelectedItemDetail(null); }}>
                    <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', overflow: 'hidden' }}>
                        <div className="km-header">
                            <div>
                                <h3 className="km-title" style={{ fontSize: '16px' }}>Detail Katalog Sampah</h3>
                                <p className="km-subtitle" style={{ fontSize: '11px' }}>Informasi lengkap dan riwayat perubahan harga item katalog.</p>
                            </div>
                            <CloseButton onClick={() => { setSelectedItem(null); setSelectedItemDetail(null); }} style={{ width: '28px', height: '28px', fontSize: '16px' }} />
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div className="km-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start', paddingBottom: '24px' }}>

                                {/* Kolom 1: Info + Harga */}
                                <div>
                                    <div style={{ background: "linear-gradient(135deg, rgba(78, 167, 113, 0.15) 0%, rgba(1, 50, 54, 0.05) 100%)", borderRadius: '12px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '16px' }}>
                                        {selectedItem.photo_url ? (
                                            <img src={selectedItem.photo_url} alt={selectedItem.nama_sampah} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <FaBoxOpen size={64} color="#4EA771" style={{ opacity: 0.7 }} />
                                        )}
                                    </div>
                                    <h2 style={{ fontSize: '20px', color: 'var(--k-dark)', marginBottom: '8px', lineHeight: 1.2 }}>{selectedItem.nama_sampah}</h2>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                        <div style={{ background: 'rgba(78,167,113,0.1)', color: '#1a7a4a', padding: '4px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                                            {selectedItem.kategori?.Kategori || "-"}
                                        </div>
                                        <div style={{ background: 'rgba(78,167,113,0.08)', color: 'var(--k-dark)', padding: '4px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                                            {selectedItem.reward?.NamaReward || "-"}
                                        </div>
                                    </div>

                                    {selectedItem.syarat_pemilahan && (
                                        <div style={{ fontSize: '12px', color: 'var(--k-muted)', marginBottom: '12px', padding: '8px 10px', background: '#f8faf9', borderRadius: '8px', border: '1px solid var(--k-border)' }}>
                                            <strong>Syarat:</strong> {selectedItem.syarat_pemilahan}
                                        </div>
                                    )}

                                    {/* Stok saja di kolom kiri */}
                                    {!isSuperadmin && (
                                        <div className="kd-stat-card" style={{ padding: '14px', gap: '8px' }}>
                                            <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                                <span className="kd-stat-label">Stok</span>
                                                <span style={{ fontWeight: 600 }}>{selectedItemDetail?.stok ?? selectedItem.stok ?? 0} {selectedItem.satuan}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Kolom 2: Harga Saat Ini + Riwayat Harga */}
                                <div>
                                    {/* Harga Sampah Saat Ini */}
                                    <h4 style={{ fontSize: '14.5px', color: 'var(--k-dark)', marginBottom: '12px' }}>Harga Sampah Saat Ini</h4>
                                    <div className="kd-stat-card" style={{ padding: '14px', gap: '8px', marginBottom: '20px' }}>
                                        {selectedItemDetail === null ? (
                                            <div style={{ fontSize: '12px', color: 'var(--k-muted)', textAlign: 'center', padding: '8px 0' }}>Memuat harga...</div>
                                        ) : (selectedItemDetail.harga_per_level?.length ?? 0) === 0 ? (
                                            <div style={{ fontSize: '12px', color: 'var(--k-muted)', textAlign: 'center', padding: '8px 0' }}>Belum ada harga.</div>
                                        ) : (
                                            selectedItemDetail.harga_per_level?.map(h => (
                                                <div className="kd-stat-row" style={{ fontSize: '12.5px' }} key={h.level_user}>
                                                    <span className="kd-stat-label" style={{ textTransform: 'capitalize' }}>{h.level_user}</span>
                                                    <div className="katalog-price-tag price-poin" style={{ margin: 0, padding: '4px 10px', fontSize: '12px' }}>
                                                        <FaCoins />{h.harga} {h.satuan_reward}/{selectedItem.satuan}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Riwayat Perubahan Harga */}
                                    <h4 style={{ fontSize: '14.5px', color: 'var(--k-dark)', marginBottom: '16px' }}>Riwayat Perubahan Harga</h4>
                                    <div className="kd-timeline-wrap">
                                        {selectedItemDetail === null ? (
                                            <div className="kd-timeline-empty" style={{ fontSize: '12.5px', padding: '24px 0', color: 'var(--k-muted)', textAlign: 'center', background: '#fcfdfc', borderRadius: '12px', border: '1px dashed var(--k-border)' }}>
                                                Memuat riwayat...
                                            </div>
                                        ) : (() => {
                                            const historyList = selectedItemDetail.history_harga ?? [];

                                            if (historyList.length === 0) {
                                                return <div className="kd-timeline-empty" style={{ fontSize: '12.5px', padding: '24px 0', color: 'var(--k-muted)', textAlign: 'center', background: '#fcfdfc', borderRadius: '12px', border: '1px dashed var(--k-border)' }}>
                                                    Belum ada riwayat perubahan harga.
                                                </div>;
                                            }

                                            return (
                                                <div className="kd-timeline" style={{ gap: '14px' }}>
                                                    {historyList.map((rw, idx) => {
                                                        const satuanReward = selectedItemDetail.harga_per_level?.find(h => h.schema_id === rw.schema_id)?.satuan_reward ?? "";
                                                        return (
                                                            <div className="kd-timeline-item" key={idx}>
                                                                <div className="kd-timeline-dot" style={{ top: 4, width: '8px', height: '8px', left: '-23px' }}></div>
                                                                <span className="kd-timeline-date" style={{ fontSize: '10.5px' }}>{formatTanggalJam(rw.changed_at)}</span>
                                                                <div className="kd-timeline-content" style={{ padding: '10px 12px' }}>
                                                                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--k-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{rw.level_user}</div>
                                                                    <div className="kd-timeline-price" style={{ fontSize: '12.5px' }}>
                                                                        <s>{rw.harga_lama} {satuanReward}</s>
                                                                        {rw.harga_baru} {satuanReward}
                                                                    </div>
                                                                    <div className="kd-timeline-admin" style={{ fontSize: '10.5px' }}>
                                                                        <FaBuilding size={9} /> Oleh {rw.changed_by_nama}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {canEdit && (
                                <div className="km-footer">
                                    <Button type="button" color="danger" variant="outline" isRounded size="small" icon={<FaTrash />} onClick={handleDelete}>
                                        Hapus Item
                                    </Button>
                                    <Button type="button" color="primary" variant="outline" isRounded size="small" icon={<FaPen />} onClick={openEditItemModal}>
                                        Edit Item
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Sembako: Form Modal (Add / Edit) ── */}
            {(formMode === "add-sembako" || formMode === "edit-sembako") && typeof document !== "undefined" && createPortal(
                <div className="katalog-modal-overlay" onClick={() => setFormMode(null)}>
                    <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
                        <div className="km-header">
                            <div>
                                <h3 className="km-title">
                                    {formMode === "add-sembako" ? "Tambah Katalog Sembako" : "Edit Sembako"}
                                </h3>
                                <p className="km-subtitle">
                                    {formMode === "add-sembako"
                                        ? "Tambahkan item sembako baru beserta harga poin dan stok awal."
                                        : "Perbarui detail, harga poin, atau stok item sembako."}
                                </p>
                            </div>
                            <CloseButton onClick={() => setFormMode(null)} />
                        </div>

                        <form onSubmit={handleSembakoSubmit}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 200px',
                                gap: '28px',
                                padding: '24px 28px 20px',
                            }}>

                                {/* ── Kolom Kiri: Data ── */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                        Informasi Item
                                    </div>

                                    <div className="km-group" style={{ margin: 0 }}>
                                        <label className="km-label">Nama Sembako <span className="km-req">*</span></label>
                                        <Input
                                            className="km-input-neutral"
                                            placeholder="Contoh: Beras 5 kg"
                                            fullWidth
                                            value={sembakoNama}
                                            onChange={(e) => setSembakoNama(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="km-group" style={{ margin: 0 }}>
                                        <label className="km-label">Harga (Poin) <span className="km-req">*</span></label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Input
                                                className="km-input-neutral"
                                                type="number"
                                                placeholder="0"
                                                fullWidth
                                                value={sembakoPoin}
                                                onChange={e => setSembakoPoin(e.target.value)}
                                                required
                                            />
                                            <span style={{
                                                fontSize: '12px', fontWeight: 700, color: 'var(--k-green)',
                                                whiteSpace: 'nowrap', background: 'rgba(78,167,113,0.08)',
                                                padding: '8px 14px', borderRadius: '10px',
                                                border: '1px solid rgba(78,167,113,0.2)'
                                            }}>poin</span>
                                        </div>
                                    </div>

                                    {formMode === "add-sembako" ? (
                                        <div className="km-group" style={{ margin: 0 }}>
                                            <label className="km-label">Stok Awal</label>
                                            <Input
                                                className="km-input-neutral"
                                                type="number"
                                                placeholder="0"
                                                fullWidth
                                                value={sembakoStok}
                                                onChange={e => setSembakoStok(e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="km-group" style={{ margin: 0 }}>
                                                <label className="km-label">Tambah Stok</label>
                                                <Input
                                                    className="km-input-neutral"
                                                    type="number"
                                                    placeholder="0"
                                                    fullWidth
                                                    value={sembakoTambahStok}
                                                    onChange={e => setSembakoTambahStok(e.target.value)}
                                                />
                                            </div>
                                            <div className="km-group" style={{ margin: 0 }}>
                                                <label className="km-label">Koreksi Stok</label>
                                                <Input
                                                    className="km-input-neutral"
                                                    type="number"
                                                    placeholder="—"
                                                    fullWidth
                                                    value={sembakoStok}
                                                    onChange={e => setSembakoStok(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ── Kolom Kanan: Foto 1:1 ── */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                        Foto Item
                                    </div>

                                    <div className="km-group" style={{ margin: 0 }}>
                                        <label className="km-label">Foto Sembako</label>
                                        <div
                                            className={`km-file-area ${sembakoFotoPreview ? "has-file" : ""}`}
                                            onClick={() => !sembakoFotoPreview && sembakoFileRef.current?.click()}
                                            style={{ aspectRatio: '1 / 1', width: '100%', height: 'auto', borderRadius: '14px' }}
                                        >
                                            {sembakoFotoPreview ? (
                                                <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: '14px', overflow: 'hidden' }}>
                                                    <img src={sembakoFotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                    <div className="km-preview-actions">
                                                        <button type="button" className="km-btn-remove" onClick={(e) => { e.stopPropagation(); setSembakoFoto(null); setSembakoFotoPreview(null); }}>
                                                            <FaTrash /> Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="km-upload-prompt">
                                                    <div className="km-upload-icon"><FaCloudArrowUp /></div>
                                                    <div className="km-upload-text">Klik atau seret foto</div>
                                                    <div className="km-upload-hint">JPG, PNG · Maks 5MB</div>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg, image/jpg"
                                                ref={sembakoFileRef}
                                                onChange={(e) => { if (e.target.files?.[0]) handleSembakoFile(e.target.files[0]); }}
                                                style={{ display: "none" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="km-footer">
                                <Button type="button" variant="outline" color="primary" onClick={() => setFormMode(null)}>Batal</Button>
                                <Button type="submit" color="primary" disabled={isSubmitting}>
                                    {isSubmitting ? "Menyimpan..." : (formMode === "add-sembako" ? "Simpan Sembako" : "Simpan Perubahan")}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Sembako: Detail Modal ── */}
            {selectedSembako && typeof document !== "undefined" && createPortal(
                <div className="katalog-modal-overlay" onClick={() => { setSelectedSembako(null); setBsuRiwayat(null); }}>
                    <div
                        className="katalog-modal-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: isViewingBSU ? '720px' : '600px', overflow: 'hidden' }}
                    >
                        <div className="km-header">
                            <div>
                                <h3 className="km-title" style={{ fontSize: '16px' }}>Detail Katalog Sembako</h3>
                                <p className="km-subtitle" style={{ fontSize: '11px' }}>
                                    {isViewingBSU
                                        ? `Katalog distribusi milik ${bsuList.find(b => b.BankID === sembakoFilterBank)?.NamaBank ?? sembakoFilterBank}`
                                        : "Informasi lengkap item sembako."}
                                </p>
                            </div>
                            <CloseButton onClick={() => { setSelectedSembako(null); setBsuRiwayat(null); }} style={{ width: '28px', height: '28px', fontSize: '16px' }} />
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div className="km-body" style={{ display: 'grid', gridTemplateColumns: isViewingBSU ? 'minmax(0,1fr) minmax(0,1.2fr)' : 'minmax(0,1fr) minmax(0,1fr)', gap: '24px', alignItems: 'start', paddingBottom: '24px' }}>

                                {/* Kolom 1: Foto + Nama + Stats */}
                                <div>
                                    <div style={{ background: "linear-gradient(135deg, rgba(148, 223, 12, 0.15) 0%, rgba(1, 50, 54, 0.05) 100%)", borderRadius: '12px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '16px' }}>
                                        {selectedSembako.photo_url ? (
                                            <img src={selectedSembako.photo_url} alt={selectedSembako.nama_sembako} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <FaBasketShopping size={64} color="#94DF0C" style={{ opacity: 0.7 }} />
                                        )}
                                    </div>
                                    <h2 style={{ fontSize: '18px', color: 'var(--k-dark)', marginBottom: '12px', lineHeight: 1.2 }}>{selectedSembako.nama_sembako}</h2>

                                    <div className="kd-stat-card" style={{ padding: '14px', gap: '10px' }}>
                                        <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                            <span className="kd-stat-label">Harga (Poin)</span>
                                            <div className="katalog-price-tag price-poin" style={{ margin: 0, padding: '4px 10px', fontSize: '12px' }}>
                                                <FaCoins />{selectedSembako.nilai_poin} poin
                                            </div>
                                        </div>
                                        <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                            <span className="kd-stat-label">Stok</span>
                                            <span style={{ fontWeight: 600 }}>{selectedSembako.stok ?? 0}</span>
                                        </div>
                                        {selectedSembako.updated_at && (
                                            <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                                <span className="kd-stat-label">Diperbarui</span>
                                                <span style={{ color: 'var(--k-muted)' }}>
                                                    {formatTanggal(selectedSembako.updated_at)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Kolom 2: Riwayat Distribusi (BSU) atau kosong (BSI) */}
                                {isViewingBSU ? (
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-dark)', marginBottom: '14px' }}>Riwayat Distribusi</h4>
                                        <div className="kd-timeline-wrap">
                                            {bsuRiwayat === null ? (
                                                <div className="kd-timeline-empty">Memuat riwayat...</div>
                                            ) : bsuRiwayat.length === 0 ? (
                                                <div className="kd-timeline-empty">Belum ada distribusi ke BSU ini.</div>
                                            ) : (
                                                <div className="kd-timeline" style={{ gap: '14px' }}>
                                                    {bsuRiwayat.map((rw) => (
                                                        <div className="kd-timeline-item" key={rw.distribusi_id}>
                                                            <div className="kd-timeline-dot" style={{ top: 4, width: '8px', height: '8px', left: '-23px' }} />
                                                            <span className="kd-timeline-date" style={{ fontSize: '10.5px' }}>
                                                                {formatTanggalJam(rw.tanggal_kirim)}
                                                            </span>
                                                            <div className="kd-timeline-content" style={{ padding: '10px 12px' }}>
                                                                <div className="kd-timeline-price" style={{ fontSize: '13px' }}>
                                                                    +{rw.stok_terdistribusi} unit dikirim
                                                                </div>
                                                                <div className="kd-timeline-admin" style={{ fontSize: '10.5px', marginTop: '4px', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                                                                    <span><FaBuilding size={9} /> BSI: {rw.nama_admin_bsi}</span>
                                                                    <span><FaBuilding size={9} /> BSU: {rw.nama_admin_bsu}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-dark)', marginBottom: '4px' }}>Informasi Tambahan</h4>
                                        <div className="kd-stat-card" style={{ padding: '14px', gap: '10px' }}>
                                            {selectedSembako.updated_by && (
                                                <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                                    <span className="kd-stat-label">Diperbarui oleh</span>
                                                    <span style={{ color: 'var(--k-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FaBuilding size={10} />{selectedSembako.updated_by}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedSembako.created_by && (
                                                <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                                    <span className="kd-stat-label">Ditambahkan oleh</span>
                                                    <span style={{ color: 'var(--k-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FaBuilding size={10} />{selectedSembako.created_by}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedSembako.created_at && (
                                                <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                                    <span className="kd-stat-label">Ditambahkan</span>
                                                    <span style={{ color: 'var(--k-muted)' }}>
                                                        {formatTanggal(selectedSembako.created_at)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {canEditSembako && (
                                <div className="km-footer">
                                    <Button type="button" color="danger" variant="outline" isRounded size="small" icon={<FaTrash />} onClick={handleDeleteSembako}>
                                        Hapus
                                    </Button>
                                    <Button type="button" color="primary" variant="outline" isRounded size="small" icon={<FaPen />} onClick={openEditSembakoModal}>
                                        Edit Item
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
