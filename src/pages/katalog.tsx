import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../contexts/AuthContext";
import { KatalogService } from "../services/katalog.service";
import { SembakoService } from "../services/sembako.service";
import type { KategoriSampah as KategoriSampahT, SatuanEnum, LevelUser, KatalogSampah, KatalogHistoryResponseItem } from "../types/katalog.type";
import type { KatalogSembakoItem, SembakoHistoryItem } from "../types/sembako.type";
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

/** Get poin for a specific level from sampah harga array */
function getPoin(harga: KatalogSampah["harga"], level: LevelUser): number {
    return harga?.find(h => h.level_user === level)?.poin_harga ?? 0;
}

/** Get poin for a specific level from sembako schema_harga array */
function getSembakoPoin(schema: KatalogSembakoItem["schema_harga"], level: LevelUser): number {
    return schema?.find(h => h.level_user === level)?.poin_harga ?? 0;
}





const SATUAN_OPTIONS: { value: "all" | "kg" | "pcs" | "liter"; label: string }[] = [
    { value: "all", label: "Semua" },
    { value: "kg", label: "Kg" },
    { value: "pcs", label: "Pcs" },
    { value: "liter", label: "Liter" }
];


function SampahCard({ item, onClick }: { item: KatalogSampah; onClick?: () => void }) {
    const { user } = useAuth();
    const isAdminBsu = user?.role === "admin_bsu";
    const displayPoin = getPoin(item.harga, isAdminBsu ? "bsu" : "nasabah");

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
                <div className="katalog-price-tag price-poin">
                    <FaCoins />
                    {displayPoin} poin
                    <span className="katalog-satuan">/{item.satuan}</span>
                </div>
            </div>
        </div>
    );
}

function SembakoCard({ item, onClick }: { item: KatalogSembakoItem; onClick?: () => void }) {
    const { user } = useAuth();
    const isAdminBsu = user?.role === "admin_bsu";
    const displayPoin = getSembakoPoin(item.schema_harga, isAdminBsu ? "bsu" : "nasabah");

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
                <div className="katalog-price-tag price-poin">
                    <FaCoins />{displayPoin} poin
                </div>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function KatalogPage() {
    const { user } = useAuth();
    const isAdminBsu = user?.role === "admin_bsu";
    const isAdminBsi = user?.role === "admin_bsi";
    const isAdminBsm = user?.role === "admin_bsm";
    const canEdit = isAdminBsi || isAdminBsm; // BSU = read only

    // Popup state
    const [notif, setNotif] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

    const showNotif = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => setNotif({ message, type });
    const showConfirm = (title: string, message: string, onConfirm: () => void) =>
        setConfirmState({ isOpen: true, title, message, onConfirm });
    const closeConfirm = () => setConfirmState(null);

    // API Data
    const [categories, setCategories] = useState<KategoriSampahT[]>([]);
    const [katalogList, setKatalogList] = useState<KatalogSampah[]>([]);
    const [sembakoList, setSembakoList] = useState<KatalogSembakoItem[]>([]);

    const fetchKatalog = useCallback(() => {
        if (!user?.bank_id) return;
        KatalogService.getKatalogSampahBank(user.bank_id)
            .then(res => setKatalogList(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error("Failed to fetch katalog bank", err));
    }, [user?.bank_id]);

    const fetchSembako = useCallback(() => {
        if (!user?.bank_id) return;
        SembakoService.getSembakoBank(user.bank_id)
            .then(res => setSembakoList(res.data || []))
            .catch(err => console.error("Failed to fetch sembako bank", err));
    }, [user?.bank_id]);

    useEffect(() => {
        KatalogService.getKategori()
            .then(res => {
                setCategories(res.data || []);
                if (res.data && res.data.length > 0) {
                    setAddKategori(res.data[0].KategoriID);
                }
            })
            .catch(err => console.error("Failed to fetch kategori", err));
            
        fetchKatalog();
        fetchSembako();
    }, [fetchKatalog, fetchSembako]);

    const [activeTab, setActiveTab] = useState<"sampah" | "sembako">("sampah");
    const [filterKategori, setFilterKategori] = useState<number | "all">("all");
    const [filterSatuan, setFilterSatuan] = useState<"all" | "kg" | "pcs" | "liter">("all");

    // Modal state
    const [formMode, setFormMode] = useState<"add" | "edit-item" | "edit-harga" | "add-sembako" | "edit-sembako" | "edit-harga-sembako" | null>(null);
    const [selectedItem, setSelectedItem] = useState<KatalogSampah | null>(null);
    const [selectedSembako, setSelectedSembako] = useState<KatalogSembakoItem | null>(null);
    const [editHargaLevel, setEditHargaLevel] = useState<LevelUser>("nasabah");

    // Form state
    const [addNama, setAddNama] = useState("");
    const [addSatuan, setAddSatuan] = useState("kg");
    const [addKategori, setAddKategori] = useState<number>(0);
    const [addFoto, setAddFoto] = useState<File | null>(null);
    const [addFotoPreview, setAddFotoPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    // Multi-harga form fields
    const [hargaNasabah, setHargaNasabah] = useState("");
    const [hargaBsu, setHargaBsu] = useState("");
    const [hargaEksternal, setHargaEksternal] = useState("");
    const [hargaBaru, setHargaBaru] = useState(""); // for edit-harga mode
    
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
        setHargaNasabah("");
        setHargaBsu("");
        setHargaEksternal("");
        setHargaBaru("");
        setAddSatuan("kg");
        setAddKategori(categories.length > 0 ? categories[0].KategoriID : 0);
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
        setAddFoto(null);
        setAddFotoPreview(selectedItem.photo_url || null);
        setFormMode("edit-item");
    };

    const openEditHargaModal = (level: LevelUser = "nasabah") => {
        if (!selectedItem) return;
        setEditHargaLevel(level);
        setHargaBaru(String(getPoin(selectedItem.harga, level)));
        setFormMode("edit-harga");
    };

    const closeFormModal = () => {
        setFormMode(null);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.bank_id) return;
        setIsSubmitting(true);
        try {
            if (formMode === "add") {
                if (isAdminBsi) {
                    await KatalogService.addKatalogBSI(user.bank_id, {
                        nama_sampah: addNama,
                        satuan: addSatuan as SatuanEnum,
                        kategori_id: addKategori,
                        harga_nasabah: Number(hargaNasabah),
                        harga_bsu: Number(hargaBsu),
                        harga_eksternal: Number(hargaEksternal),
                        foto: addFoto || undefined,
                    });
                } else if (isAdminBsm) {
                    await KatalogService.addKatalogBSM(user.bank_id, {
                        nama_sampah: addNama,
                        satuan: addSatuan as SatuanEnum,
                        kategori_id: addKategori,
                        harga_nasabah: Number(hargaNasabah),
                        harga_eksternal: Number(hargaEksternal),
                        foto: addFoto || undefined,
                    });
                }
                showNotif("Katalog sampah berhasil ditambahkan!");
            } else if (formMode === "edit-item" && selectedItem) {
                if (isAdminBsi) {
                    await KatalogService.editKatalogBSI(selectedItem.sampah_id, {
                        nama_sampah: addNama,
                        satuan: addSatuan as SatuanEnum,
                        kategori_id: addKategori,
                        foto: addFoto || undefined,
                    });
                } else if (isAdminBsm) {
                    await KatalogService.editKatalogBSM(selectedItem.sampah_id, {
                        nama_sampah: addNama,
                        satuan: addSatuan as SatuanEnum,
                        kategori_id: addKategori,
                        foto: addFoto || undefined,
                    });
                }
                showNotif("Detail katalog berhasil diperbarui!");
                setSelectedItem(null);
            } else if (formMode === "edit-harga" && selectedItem) {
                await KatalogService.updateHargaSchema(selectedItem.sampah_id, {
                    level_user: editHargaLevel,
                    poin_harga_baru: Number(hargaBaru),
                    changed_by: user.identity_id || "",
                });
                showNotif("Harga katalog berhasil diperbarui!");
                setSelectedItem(null);
            }
            closeFormModal();
            fetchKatalog();
            resetForm();
        } catch (error) {
            console.error("Gagal menyimpan katalog", error);
            showNotif("Gagal menyimpan perubahan.", "error");
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
                    fetchKatalog();
                } catch (error) {
                    console.error("Gagal menghapus katalog", error);
                    showNotif("Gagal menghapus item.", "error");
                }
            }
        );
    };

    const handleViewDetail = async (item: KatalogSampah) => {
        setSelectedItem(item);
        try {
            const res = await KatalogService.getHistoryKatalogSampah(item.sampah_id);
            if (Array.isArray(res.data)) {
                setSelectedItem(prev => prev?.sampah_id === item.sampah_id
                    ? { ...prev, _history: res.data } as any
                    : prev);
            }
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    const filteredSampah = useMemo(() =>
        katalogList.filter(i =>
            (filterKategori === "all" || i.kategori_id === filterKategori) &&
            (filterSatuan === "all" || i.satuan.toLowerCase() === filterSatuan)
        ), [katalogList, filterKategori, filterSatuan]);

    const filteredSembako = useMemo(() => sembakoList, [sembakoList]);

    // ── Sembako CRUD Handlers ──
    const [sembakoNama, setSembakoNama] = useState("");
    const [sembakoHargaNasabah, setSembakoHargaNasabah] = useState("");
    const [sembakoHargaBsu, setSembakoHargaBsu] = useState("");
    const [sembakoHargaEksternal, setSembakoHargaEksternal] = useState("");
    const [sembakoHargaBaru, setSembakoHargaBaru] = useState("");
    const [sembakoEditLevel, setSembakoEditLevel] = useState<LevelUser>("nasabah");
    const [sembakoFoto, setSembakoFoto] = useState<File | null>(null);
    const [sembakoFotoPreview, setSembakoFotoPreview] = useState<string | null>(null);
    const sembakoFileRef = useRef<HTMLInputElement>(null);
    const [sembakoHistory, setSembakoHistory] = useState<SembakoHistoryItem[]>([]);

    const handleSembakoFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        setSembakoFoto(file);
        const reader = new FileReader();
        reader.onloadend = () => setSembakoFotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const resetSembakoForm = () => {
        setSembakoNama("");
        setSembakoHargaNasabah("");
        setSembakoHargaBsu("");
        setSembakoHargaEksternal("");
        setSembakoHargaBaru("");
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
        setSembakoFotoPreview(selectedSembako.photo_url || null);
        setSembakoFoto(null);
        setFormMode("edit-sembako");
    };

    const openEditHargaSembakoModal = (level: LevelUser) => {
        if (!selectedSembako) return;
        setSembakoEditLevel(level);
        setSembakoHargaBaru("");
        setFormMode("edit-harga-sembako");
    };

    const handleSembakoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.bank_id) { showNotif("Bank ID tidak ditemukan.", "error"); return; }
        setIsSubmitting(true);
        try {
            if (formMode === "add-sembako") {
                await SembakoService.addSembako(user.bank_id, {
                    nama_sembako: sembakoNama,
                    harga_nasabah: Number(sembakoHargaNasabah),
                    harga_eksternal: Number(sembakoHargaEksternal),
                    harga_bsu: isAdminBsi ? Number(sembakoHargaBsu) : undefined,
                    foto: sembakoFoto || undefined
                });
                showNotif("Sembako berhasil ditambahkan!");
            } else if (formMode === "edit-sembako" && selectedSembako) {
                await SembakoService.editSembako(selectedSembako.sembako_id, {
                    nama_sembako: sembakoNama,
                    foto: sembakoFoto || undefined
                });
                showNotif("Detail sembako berhasil diperbarui!");
                setSelectedSembako(null);
            } else if (formMode === "edit-harga-sembako" && selectedSembako) {
                await SembakoService.updateHargaSembako(
                    selectedSembako.sembako_id,
                    sembakoEditLevel,
                    Number(sembakoHargaBaru),
                    user.identity_id || ""
                );
                showNotif("Harga sembako berhasil diperbarui!");
                setSelectedSembako(null);
            }
            setFormMode(null);
            fetchSembako();
            resetSembakoForm();
        } catch (error) {
            console.error("Gagal menyimpan sembako", error);
            showNotif("Gagal menyimpan perubahan.", "error");
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
                    fetchSembako();
                } catch (error) {
                    console.error("Gagal menghapus sembako", error);
                    showNotif("Gagal menghapus.", "error");
                }
            }
        );
    };

    const handleViewSembakoDetail = async (item: KatalogSembakoItem) => {
        setSelectedSembako(item);
        try {
            const res = await SembakoService.getHistorySembako(item.sembako_id);
            setSembakoHistory(res.data || []);
        } catch (error) {
            console.error("Failed to load sembako history", error);
            setSembakoHistory([]);
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

            <div className={`katalog-content-layout ${activeTab === "sampah" ? "has-sidebar" : ""}`}>
                {/* ── Left Column: Tabs, Description, Grid (3/4) ── */}
                <div className="katalog-content-main">
                    
                    {/* Tabs */}
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

                    {/* Description + Divider */}
                    <div className="katalog-desc-section" style={{ paddingTop: 0 }}>
                        <p className="katalog-desc">
                            {activeTab === "sampah"
                                ? "Daftar jenis sampah yang dapat disetor oleh nasabah ke Bank Sampah. Setiap item memiliki harga konversi berupa uang tunai atau poin yang ditentukan oleh masing-masing Bank Sampah."
                                : "Daftar produk kebutuhan pokok yang dapat ditukarkan oleh nasabah menggunakan poin hasil setoran sampah. Program ini mendorong nasabah untuk aktif menabung sampah."
                            }
                        </p>

                        {/* Count + Action row */}
                        <div className="katalog-action-row">
                            <span className="katalog-count">{count} item</span>
                            {canEdit && (
                                <Button icon={<FaPlus />} color='secondary' isRounded onClick={activeTab === "sampah" ? openAddModal : openAddSembakoModal}>
                                    {activeTab === "sampah" ? "Tambah Katalog Sampah" : "Tambah Katalog Sembako"}
                                </Button>
                            )}
                        </div>
                        
                        <hr className="katalog-divider" />
                    </div>

                    {/* Card Grid */}
                    {activeTab === "sampah" ? (
                        filteredSampah.length === 0
                            ? <div className="katalog-empty"><FaBoxOpen /><span>Tidak ada item ditemukan</span></div>
                            : <div className="katalog-grid">
                                {filteredSampah.map(i => <SampahCard key={i.sampah_id} item={i} onClick={() => handleViewDetail(i)} />)}
                              </div>
                    ) : (
                        filteredSembako.length === 0
                            ? <div className="katalog-empty"><FaBasketShopping /><span>Tidak ada item ditemukan</span></div>
                            : <div className="katalog-grid">
                                {filteredSembako.map(i => <SembakoCard key={i.SembakoID} item={i} onClick={() => handleViewSembakoDetail(i)} />)}
                              </div>
                    )}
                </div>

                {/* ── Right Column: Filters (1/4) ── */}
                {activeTab === "sampah" && (
                    <div className="katalog-side-col">
                        <aside className="katalog-filter-sidebar">
                            
                            {/* Kategori Sampah */}
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
                                    {/* The + Kategori button will be retained as an outline pill for now if needed, though currently it has no onClick logic */}
                                    {/* <Button variant="outline" size="small" onClick={() => {}}>+ Kategori</Button> */}
                                </div>
                            </div>
                            
                            {/* Jenis Satuan */}
                            <div className="kf-group">
                                <span className="kf-group-label">Jenis Satuan</span>
                                <FilterPill
                                    options={SATUAN_OPTIONS}
                                    activeValue={filterSatuan}
                                    onChange={(v) => setFilterSatuan(v as "all" | "kg" | "pcs" | "liter")}
                                />
                            </div>
                            
                        </aside>
                    </div>
                )}
            </div>
            
            {/* ── Form Modal (Add / Edit Item / Edit Harga) ── */}
            {(formMode === "add" || formMode === "edit-item" || formMode === "edit-harga") && typeof document !== "undefined" && createPortal(
                <div className="katalog-modal-overlay" onClick={closeFormModal}>
                    <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()} style={formMode === "edit-harga" ? { maxWidth: '480px' } : undefined}>
                        
                        <div className="km-header">
                            <div>
                                <h3 className="km-title">
                                    {formMode === "add" && "Tambah Katalog Sampah"}
                                    {formMode === "edit-item" && "Edit Detail Item"}
                                    {formMode === "edit-harga" && "Ubah Harga Item"}
                                </h3>
                                <p className="km-subtitle">
                                    {formMode === "add" && "Tambahkan item sampah baru beserta harga dan kategorinya."}
                                    {formMode === "edit-item" && "Perbarui informasi item katalog. Harga tidak dapat diubah di sini."}
                                    {formMode === "edit-harga" && `Ubah harga ${selectedItem?.nama_sampah || "item"} saat ini.`}
                                </p>
                            </div>
                            <CloseButton onClick={closeFormModal} />
                        </div>

                        <form onSubmit={handleSubmit} style={formMode === "edit-harga" ? { display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 28px 28px' } : undefined}>
                            {formMode !== "edit-harga" && (
                            <>
                            {/* ── 3-Column layout for add / edit-item ── */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: formMode === "add" ? '1fr 1fr 1fr' : '1fr 1fr',
                                gap: '28px',
                                padding: '24px 28px 0',
                            }}>

                                {/* ── Kolom 1: Info Dasar ── */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                        Informasi Item
                                    </div>

                                    {/* Nama Sampah */}
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

                                    {/* Satuan */}
                                    <div className="km-group">
                                        <label className="km-label">Satuan <span className="km-req">*</span></label>
                                        <Dropdown
                                            fullWidth
                                            options={[{label: "Kg", value: "kg"}, {label: "Pcs", value: "pcs"}, {label: "Liter", value: "liter"}]}
                                            value={addSatuan}
                                            onChange={(e) => setAddSatuan(e.target.value)}
                                        />
                                    </div>

                                    {/* Kategori */}
                                    <div className="km-group">
                                        <label className="km-label">Kategori Sampah <span className="km-req">*</span></label>
                                        <Dropdown
                                            fullWidth
                                            options={categories.map(c => ({ label: c.Kategori, value: c.KategoriID }))}
                                            value={addKategori}
                                            onChange={(e) => setAddKategori(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* ── Kolom 2: Harga (hanya mode "add") ── */}
                                {formMode === "add" && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                        Skema Harga
                                    </div>

                                    {/* Harga Nasabah */}
                                    <div className="km-group">
                                        <label className="km-label">Harga Nasabah <span className="km-req">*</span></label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Input
                                                className="km-input-neutral"
                                                type="number"
                                                placeholder="0"
                                                fullWidth
                                                value={hargaNasabah}
                                                onChange={e => setHargaNasabah(e.target.value)}
                                                required
                                            />
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-muted)', whiteSpace: 'nowrap', background: '#f0f4f2', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--k-border)' }}>poin</span>
                                        </div>
                                    </div>

                                    {/* Harga BSU — hanya BSI */}
                                    {isAdminBsi && (
                                    <div className="km-group">
                                        <label className="km-label">Harga BSU <span className="km-req">*</span></label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Input
                                                className="km-input-neutral"
                                                type="number"
                                                placeholder="0"
                                                fullWidth
                                                value={hargaBsu}
                                                onChange={e => setHargaBsu(e.target.value)}
                                                required
                                            />
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-muted)', whiteSpace: 'nowrap', background: '#f0f4f2', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--k-border)' }}>poin</span>
                                        </div>
                                    </div>
                                    )}

                                    {/* Harga Eksternal */}
                                    <div className="km-group">
                                        <label className="km-label">Harga Eksternal <span className="km-req">*</span></label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Input
                                                className="km-input-neutral"
                                                type="number"
                                                placeholder="0"
                                                fullWidth
                                                value={hargaEksternal}
                                                onChange={e => setHargaEksternal(e.target.value)}
                                                required
                                            />
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-muted)', whiteSpace: 'nowrap', background: '#f0f4f2', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--k-border)' }}>poin</span>
                                        </div>
                                    </div>
                                </div>
                                )}

                                {/* ── Kolom 3: Upload Foto ── */}
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
                                            style={{ height: '180px' }}
                                        >
                                            {addFotoPreview ? (
                                                <div className="km-preview-container">
                                                    <img src={addFotoPreview} alt="Preview" className="km-preview-img" style={{ height: '180px' }} />
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

                            {/* ── Footer ── */}
                            <div className="km-footer" style={{ margin: '0 28px 24px', paddingTop: '16px' }}>
                                <Button type="button" variant="outline" color="primary" onClick={closeFormModal}>Batal</Button>
                                <Button type="submit" color="primary" disabled={isSubmitting}>
                                    {isSubmitting ? "Menyimpan..." : (formMode === "add" ? "Simpan Katalog" : "Simpan Perubahan")}
                                </Button>
                            </div>
                            </>
                            )}

                            {/* Mode: Edit Harga — per level */}
                            {formMode === "edit-harga" && (
                            <>
                                <div style={{ background: 'rgba(78,167,113,0.08)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    {selectedItem?.photo_url ? (
                                        <img src={selectedItem.photo_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(78,167,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FaBoxOpen size={20} color="#4EA771" />
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-dark)' }}>{selectedItem?.nama_sampah}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--k-muted)', marginTop: '2px' }}>
                                            Level: <strong>{editHargaLevel}</strong> — Saat ini: {getPoin(selectedItem?.harga ?? [], editHargaLevel)} poin
                                        </div>
                                    </div>
                                </div>

                                <div className="km-group">
                                    <label className="km-label">Poin Baru <span className="km-req">*</span></label>
                                    <Input className="km-input-neutral" type="number" placeholder="Masukkan poin baru" fullWidth value={hargaBaru} onChange={(e) => setHargaBaru(e.target.value)} required />
                                </div>

                                <div className="km-footer" style={{ padding: '16px 0 0', border: 'none', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <Button type="button" variant="outline" color="primary" onClick={closeFormModal}>Batal</Button>
                                    <Button type="submit" color="primary" disabled={isSubmitting}>
                                        {isSubmitting ? "Menyimpan..." : "Simpan Harga Baru"}
                                    </Button>
                                </div>
                            </>
                            )}
                        </form>
                    </div>
                </div>, 
                document.body
            )}

            {/* ── Detail Item Modal ── */}
            {selectedItem && typeof document !== "undefined" && createPortal(
                <div className="katalog-modal-overlay" onClick={() => setSelectedItem(null)}>
                    <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', overflow: 'hidden' }}>
                        <div className="km-header">
                            <div>
                                <h3 className="km-title" style={{ fontSize: '16px' }}>Detail Katalog Sampah</h3>
                                <p className="km-subtitle" style={{ fontSize: '11px' }}>Informasi lengkap dan riwayat perubahan harga item katalog.</p>
                            </div>
                            <CloseButton onClick={() => setSelectedItem(null)} style={{ width: '28px', height: '28px', fontSize: '16px' }} />
                        </div>
                        
                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div className="km-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start', paddingBottom: '24px' }}>
                                {/* Kolom 1: Preview Detail */}
                                <div>
                                    <div style={{ background: "linear-gradient(135deg, rgba(78, 167, 113, 0.15) 0%, rgba(1, 50, 54, 0.05) 100%)", borderRadius: '12px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '16px' }}>
                                        {selectedItem.photo_url ? (
                                            <img src={selectedItem.photo_url} alt={selectedItem.nama_sampah} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <FaBoxOpen size={64} color="#4EA771" style={{ opacity: 0.7 }} />
                                        )}
                                    </div>
                                    <h2 style={{ fontSize: '20px', color: 'var(--k-dark)', marginBottom: '8px', lineHeight: 1.2 }}>{selectedItem.nama_sampah}</h2>
                                    <div style={{ display: 'inline-block', background: 'rgba(78,167,113,0.1)', color: '#1a7a4a', padding: '4px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600, marginBottom: '12px' }}>
                                        Kategori: {selectedItem.kategori?.Kategori || "-"}
                                    </div>

                                    {/* Harga Schema */}
                                    <div className="kd-stat-card" style={{ padding: '14px', gap: '8px' }}>
                                        {selectedItem.harga?.filter(h => !isAdminBsu || h.level_user === "bsu").map(h => (
                                            <div className="kd-stat-row" style={{ fontSize: '12.5px' }} key={h.level_user}>
                                                <span className="kd-stat-label" style={{ textTransform: 'capitalize' }}>{h.level_user}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="katalog-price-tag price-poin" style={{ margin: 0, padding: '4px 10px', fontSize: '12px' }}>
                                                        <FaCoins />{h.poin_harga} poin/{selectedItem.satuan}
                                                    </div>
                                                    {canEdit && (
                                                        <button onClick={() => openEditHargaModal(h.level_user)} style={{ fontSize: '11px', color: 'var(--k-green)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '2px 6px' }}>
                                                            <FaPen size={10} /> Ubah
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                            <span className="kd-stat-label">Stok</span>
                                            <span style={{ fontWeight: 600 }}>{selectedItem.stok ?? 0}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Kolom 2: Riwayat Harga */}
                                <div>
                                    <h4 style={{ fontSize: '14.5px', color: 'var(--k-dark)', marginBottom: '16px' }}>Riwayat Perubahan Harga</h4>
                                    <div className="kd-timeline-wrap">
                                        {(() => {
                                            const historyList = (selectedItem as any)._history || [];
                                            const filteredHistory = historyList.filter((h: any) => !isAdminBsu || h.LevelUser === "bsu");

                                            if (filteredHistory.length === 0) {
                                                return <div className="kd-timeline-empty" style={{ fontSize: '12.5px', padding: '24px 0', color: 'var(--k-muted)', textAlign: 'center', background: '#fcfdfc', borderRadius: '12px', border: '1px dashed var(--k-border)' }}>
                                                    Belum ada riwayat perubahan harga.
                                                </div>;
                                            }

                                            return (
                                                <div className="kd-timeline" style={{ gap: '14px' }}>
                                                    {filteredHistory.map((rw: KatalogHistoryResponseItem, idx: number) => (
                                                        <div className="kd-timeline-item" key={idx}>
                                                            <div className="kd-timeline-dot" style={{ top: 4, width: '8px', height: '8px', left: '-23px' }}></div>
                                                            <span className="kd-timeline-date" style={{ fontSize: '10.5px' }}>{new Date(rw.ChangedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                            <div className="kd-timeline-content" style={{ padding: '10px 12px' }}>
                                                                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--k-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{rw.LevelUser}</div>
                                                                <div className="kd-timeline-price" style={{ fontSize: '12.5px' }}>
                                                                    <s>{rw.OldPoin} poin</s>
                                                                    {rw.NewPoin} poin
                                                                </div>
                                                                <div className="kd-timeline-admin" style={{ fontSize: '10.5px' }}>
                                                                    <FaBuilding size={9} /> Oleh {rw.admin_nama}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
    
                            {canEdit && (
                            <div className="km-footer" style={{ borderTop: "1px solid var(--k-border)", display: "flex", justifyContent: "flex-end", padding: '20px 30px', gap: '12px' }}>
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

            {/* ── Sembako Form Modal (Add / Edit / Edit Harga) ── */}
            {(formMode === "add-sembako" || formMode === "edit-sembako" || formMode === "edit-harga-sembako") && typeof document !== "undefined" && createPortal(
                <div className="katalog-modal-overlay" onClick={() => setFormMode(null)}>
                    <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()} style={formMode === "edit-harga-sembako" ? { maxWidth: '480px' } : { maxWidth: '960px' }}>
                        <div className="km-header">
                            <div>
                                <h3 className="km-title">
                                    {formMode === "add-sembako" && "Tambah Katalog Sembako"}
                                    {formMode === "edit-sembako" && "Edit Detail Sembako"}
                                    {formMode === "edit-harga-sembako" && "Ubah Harga Sembako"}
                                </h3>
                                <p className="km-subtitle">
                                    {formMode === "add-sembako" && "Tambahkan item sembako baru beserta harga untuk masing-masing target pengguna."}
                                    {formMode === "edit-sembako" && "Perbarui nama atau foto item sembako."}
                                    {formMode === "edit-harga-sembako" && `Ubah harga ${selectedSembako?.nama_sembako || "item"} saat ini.`}
                                </p>
                            </div>
                            <CloseButton onClick={() => setFormMode(null)} />
                        </div>

                        <form onSubmit={handleSembakoSubmit} style={formMode === "edit-harga-sembako" ? { display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 28px 28px' } : undefined}>
                            {formMode !== "edit-harga-sembako" && (
                            <>
                            {/* ── 3-Column layout for add / 2-column for edit ── */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: formMode === "add-sembako" ? '1fr 1fr 1fr' : '1fr 1fr',
                                gap: '28px',
                                padding: '24px 28px 0',
                            }}>

                                {/* ── Kolom 1: Info Dasar ── */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                        Informasi Item
                                    </div>
                                    <div className="km-group">
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
                                </div>

                                {/* ── Kolom 2: Harga (hanya mode "add-sembako") ── */}
                                {formMode === "add-sembako" && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                        Skema Harga
                                    </div>

                                    <div className="km-group">
                                        <label className="km-label">Harga Nasabah <span className="km-req">*</span></label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Input className="km-input-neutral" type="number" placeholder="0" fullWidth value={sembakoHargaNasabah} onChange={e => setSembakoHargaNasabah(e.target.value)} required />
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-muted)', whiteSpace: 'nowrap', background: '#f0f4f2', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--k-border)' }}>poin</span>
                                        </div>
                                    </div>

                                    {isAdminBsi && (
                                    <div className="km-group">
                                        <label className="km-label">Harga BSU <span className="km-req">*</span></label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Input className="km-input-neutral" type="number" placeholder="0" fullWidth value={sembakoHargaBsu} onChange={e => setSembakoHargaBsu(e.target.value)} required />
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-muted)', whiteSpace: 'nowrap', background: '#f0f4f2', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--k-border)' }}>poin</span>
                                        </div>
                                    </div>
                                    )}

                                    <div className="km-group">
                                        <label className="km-label">Harga Eksternal <span className="km-req">*</span></label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Input className="km-input-neutral" type="number" placeholder="0" fullWidth value={sembakoHargaEksternal} onChange={e => setSembakoHargaEksternal(e.target.value)} required />
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-muted)', whiteSpace: 'nowrap', background: '#f0f4f2', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--k-border)' }}>poin</span>
                                        </div>
                                    </div>
                                </div>
                                )}

                                {/* ── Kolom 3: Upload Foto ── */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                        Foto Item
                                    </div>
                                    <div className="km-group">
                                        <label className="km-label">Foto Sembako</label>
                                        <div
                                            className={`km-file-area ${sembakoFotoPreview ? "has-file" : ""}`}
                                            onClick={() => !sembakoFotoPreview && sembakoFileRef.current?.click()}
                                            style={{ height: '180px' }}
                                        >
                                            {sembakoFotoPreview ? (
                                                <div className="km-preview-container">
                                                    <img src={sembakoFotoPreview} alt="Preview" className="km-preview-img" style={{ height: '180px' }} />
                                                    <div className="km-preview-actions">
                                                        <button type="button" className="km-btn-remove" onClick={(e) => { e.stopPropagation(); setSembakoFoto(null); setSembakoFotoPreview(null); }}>
                                                            <FaTrash /> Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="km-upload-prompt">
                                                    <div className="km-upload-icon"><FaCloudArrowUp /></div>
                                                    <div className="km-upload-text">Klik untuk upload foto</div>
                                                    <div className="km-upload-hint">JPG, PNG (Maks 5MB)</div>
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

                            {/* ── Footer ── */}
                            <div className="km-footer" style={{ margin: '0 28px 24px', paddingTop: '16px' }}>
                                <Button type="button" variant="outline" color="primary" onClick={() => setFormMode(null)}>Batal</Button>
                                <Button type="submit" color="primary" disabled={isSubmitting}>
                                    {isSubmitting ? "Menyimpan..." : (formMode === "add-sembako" ? "Simpan Sembako" : "Simpan Perubahan")}
                                </Button>
                            </div>
                            </>
                            )}

                            {/* Mode: Edit Harga Sembako — per level */}
                            {formMode === "edit-harga-sembako" && (
                            <>
                                <div style={{ background: 'rgba(148, 223, 12, 0.08)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    {selectedSembako?.photo_url ? (
                                        <img src={selectedSembako.photo_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(148,223,12,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FaBasketShopping size={20} color="#94DF0C" />
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-dark)' }}>{selectedSembako?.nama_sembako}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--k-muted)', marginTop: '2px' }}>
                                            Level: <strong>{sembakoEditLevel}</strong> — Saat ini: {getSembakoPoin(selectedSembako?.schema_harga ?? [], sembakoEditLevel)} poin
                                        </div>
                                    </div>
                                </div>

                                <div className="km-group">
                                    <label className="km-label">Poin Baru <span className="km-req">*</span></label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Input
                                            className="km-input-neutral"
                                            type="number"
                                            placeholder="Masukkan poin baru"
                                            fullWidth
                                            value={sembakoHargaBaru}
                                            onChange={(e) => setSembakoHargaBaru(e.target.value)}
                                            required
                                        />
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-muted)', whiteSpace: 'nowrap', background: '#f0f4f2', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--k-border)' }}>poin</span>
                                    </div>
                                </div>

                                <div className="km-footer" style={{ padding: '16px 0 0', border: 'none', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <Button type="button" variant="outline" color="primary" onClick={() => setFormMode(null)}>Batal</Button>
                                    <Button type="submit" color="primary" disabled={isSubmitting}>
                                        {isSubmitting ? "Menyimpan..." : "Simpan Poin Baru"}
                                    </Button>
                                </div>
                            </>
                            )}
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Sembako Detail Modal ── */}
            {selectedSembako && typeof document !== "undefined" && createPortal(
                <div className="katalog-modal-overlay" onClick={() => setSelectedSembako(null)}>
                    <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', overflow: 'hidden' }}>
                        <div className="km-header">
                            <div>
                                <h3 className="km-title" style={{ fontSize: '16px' }}>Detail Katalog Sembako</h3>
                                <p className="km-subtitle" style={{ fontSize: '11px' }}>Informasi lengkap dan riwayat perubahan harga item sembako.</p>
                            </div>
                            <CloseButton onClick={() => setSelectedSembako(null)} style={{ width: '28px', height: '28px', fontSize: '16px' }} />
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div className="km-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start', paddingBottom: '24px' }}>
                                {/* Kolom 1: Preview Detail */}
                                <div>
                                    <div style={{ background: "linear-gradient(135deg, rgba(148, 223, 12, 0.15) 0%, rgba(1, 50, 54, 0.05) 100%)", borderRadius: '12px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '16px' }}>
                                        {selectedSembako.photo_url ? (
                                            <img src={selectedSembako.photo_url} alt={selectedSembako.nama_sembako} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <FaBasketShopping size={64} color="#94DF0C" style={{ opacity: 0.7 }} />
                                        )}
                                    </div>
                                    <h2 style={{ fontSize: '20px', color: 'var(--k-dark)', marginBottom: '8px', lineHeight: 1.2 }}>{selectedSembako.nama_sembako}</h2>

                                    {/* Harga Schema */}
                                    <div className="kd-stat-card" style={{ padding: '14px', gap: '8px' }}>
                                        {selectedSembako.schema_harga?.filter(h => !isAdminBsu || h.level_user === "bsu").map(h => (
                                            <div className="kd-stat-row" style={{ fontSize: '12.5px' }} key={h.level_user}>
                                                <span className="kd-stat-label" style={{ textTransform: 'capitalize' }}>{h.level_user}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="katalog-price-tag price-poin" style={{ margin: 0, padding: '4px 10px', fontSize: '12px' }}>
                                                        <FaCoins />{h.poin_harga} poin
                                                    </div>
                                                    {canEdit && (
                                                        <button onClick={() => openEditHargaSembakoModal(h.level_user)} style={{ fontSize: '11px', color: 'var(--k-green)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '2px 6px' }}>
                                                            <FaPen size={10} /> Ubah
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                            <span className="kd-stat-label">Stok</span>
                                            <span style={{ fontWeight: 600 }}>{selectedSembako.stok ?? 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Kolom 2: Riwayat Harga */}
                                <div>
                                    <h4 style={{ fontSize: '14.5px', color: 'var(--k-dark)', marginBottom: '16px' }}>Riwayat Perubahan Harga</h4>
                                    <div className="kd-timeline-wrap">
                                        {(() => {
                                            const filteredHistory = sembakoHistory.filter(h => !isAdminBsu || h.LevelUser === "bsu");

                                            if (filteredHistory.length === 0) {
                                                return <div className="kd-timeline-empty" style={{ fontSize: '12.5px', padding: '24px 0', color: 'var(--k-muted)', textAlign: 'center', background: '#fcfdfc', borderRadius: '12px', border: '1px dashed var(--k-border)' }}>
                                                    Belum ada riwayat perubahan harga.
                                                </div>;
                                            }

                                            return (
                                                <div className="kd-timeline" style={{ gap: '14px' }}>
                                                    {filteredHistory.map((rw, idx) => (
                                                        <div className="kd-timeline-item" key={idx}>
                                                            <div className="kd-timeline-dot" style={{ top: 4, width: '8px', height: '8px', left: '-23px' }}></div>
                                                            <span className="kd-timeline-date" style={{ fontSize: '10.5px' }}>{new Date(rw.ChangedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                            <div className="kd-timeline-content" style={{ padding: '10px 12px' }}>
                                                                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--k-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{rw.LevelUser}</div>
                                                                <div className="kd-timeline-price" style={{ fontSize: '12.5px' }}>
                                                                    <s>{rw.PoinLama} poin</s>
                                                                    {rw.PoinBaru} poin
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {canEdit && (
                            <div className="km-footer" style={{ borderTop: "1px solid var(--k-border)", display: "flex", justifyContent: "flex-end", padding: '20px 30px', gap: '12px' }}>
                                <Button
                                    type="button"
                                    color="danger"
                                    variant="outline"
                                    isRounded
                                    size="small"
                                    icon={<FaTrash />}
                                    onClick={handleDeleteSembako}
                                >
                                    Hapus
                                </Button>
                                <Button
                                    type="button"
                                    color="primary"
                                    variant="outline"
                                    isRounded
                                    size="small"
                                    icon={<FaPen />}
                                    onClick={openEditSembakoModal}
                                >
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