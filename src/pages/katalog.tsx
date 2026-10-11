import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { KatalogService } from "../services/katalog.service";
import { BarangService } from "../services/barang.service";
import type { KatalogSampah, KatalogDetail } from "../types/katalog.type";
import type { KatalogBarangItem } from "../types/barang.type";
import Pagination from "../components/pagination";
import { FaBoxOpen, FaBasketShopping, FaPlus, FaFileExport, FaChevronDown } from "react-icons/fa6";
import Button from "../components/button";
import Tabs from "../components/tabs";
import FilterPill from "../components/filter-pill";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import PopupConfirmation from "../layouts/popup-confirmation";
import Table from "../components/table";
import FilterRange from "../components/filter-range";
import SearchBar from "../components/search";
import { SampahCard } from "../components/SampahCard";
import { BarangCard } from "../components/BarangCard";
import { KatalogSampahFormModal, type SampahFormData } from "../modals/KatalogSampahFormModal";
import { KatalogSampahDetailModal } from "../modals/KatalogSampahDetailModal";
import { KatalogBarangFormModal, type BarangFormData } from "../modals/KatalogBarangFormModal";
import { KatalogBarangDetailModal } from "../modals/KatalogBarangDetailModal";
import { useKatalogData } from "../hooks/useKatalogData";
import { SATUAN_OPTIONS, buildDistribusiColumns } from "../constants/katalog.constants";
import { getApiError } from "../utils/error.utils";
import "../styles/katalog.css";
import "../styles/jadwal-bsu.css";

const KATEGORI_PREVIEW_COUNT = 8;

export default function KatalogPage() {
    const navigate = useNavigate();
    const {
        user,
        isAdminBsi, isAdminBsu, isAdminBsm, canEdit, isViewingBSU, canEditBarang,
        categories, rewards,
        sampahPage, setSampahPage, sampahTotalPages, pagedSampah,
        barangPage, setBarangPage, barangTotalPages, pagedBarang,
        barangFilterBank, setBarangFilterBank,
        bsuList, bsuRiwayat, setBsuRiwayat,
        distribusiLoading, distribusiFrom, setDistribusiFrom, distribusiTo, setDistribusiTo,
        distribusiSearch, setDistribusiSearch,
        filterKategori, setFilterKategori,
        filterSatuan, setFilterSatuan,
        filterReward, setFilterReward,
        sampahSearch, setSampahSearch,
        barangSearch, setBarangSearch,
        filteredSampah, filteredBarang, filteredDistribusi,
        fetchKatalog, fetchBarang,
    } = useKatalogData();

    const [notif, setNotif] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
    const showNotif = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => setNotif({ message, type });
    const showConfirm = (title: string, message: string, onConfirm: () => void) => setConfirmState({ isOpen: true, title, message, onConfirm });
    const closeConfirm = () => setConfirmState(null);

    const [activeTab, setActiveTab] = useState<"sampah" | "barang">("sampah");
    const [formMode, setFormMode] = useState<"add" | "edit-item" | "add-barang" | "edit-barang" | null>(null);
    const [selectedItem, setSelectedItem] = useState<KatalogSampah | null>(null);
    const [selectedItemDetail, setSelectedItemDetail] = useState<KatalogDetail | null>(null);
    const [selectedBarang, setSelectedBarang] = useState<KatalogBarangItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [filterOpen, setFilterOpen] = useState(false);
    const filterAktifCount = [filterKategori, filterSatuan, filterReward].filter(v => v !== "all").length;

    const handleExport = async () => {
        if (!user?.bank_id) return;
        setIsExporting(true);
        try {
            const blob = activeTab === "sampah"
                ? await KatalogService.exportKatalogSampah(user.bank_id)
                : await KatalogService.exportKatalogBarang(user.bank_id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = activeTab === "sampah"
                ? `katalog-sampah-${user.bank_id}.xlsx`
                : `katalog-barang-${user.bank_id}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            showNotif("Gagal mengunduh laporan. Silakan coba lagi.", "error");
        } finally {
            setIsExporting(false);
        }
    };

    const handleViewDetail = async (item: KatalogSampah) => {
        setSelectedItem(item);
        setSelectedItemDetail(null);
        try {
            const res = await KatalogService.getDetailSampah(item.sampah_id);
            setSelectedItemDetail(res.data);
        } catch {
            console.error("Failed to load detail sampah");
        }
    };

    const handleSampahSubmit = async (data: SampahFormData, foto: File | null) => {
        if (!user?.bank_id) return;
        setIsSubmitting(true);
        try {
            if (formMode === "add") {
                await KatalogService.addKatalog(user.bank_id, { ...data, foto: foto || undefined });
                showNotif("Katalog sampah berhasil ditambahkan!");
            } else if (formMode === "edit-item" && selectedItem) {
                await KatalogService.editKatalog(selectedItem.sampah_id, {
                    syarat_pemilahan: data.syarat_pemilahan,
                    kategori_id: data.kategori_id,
                    foto: foto || undefined,
                });
                showNotif("Detail katalog berhasil diperbarui!");
                setSelectedItem(null);
                setSelectedItemDetail(null);
            }
            setFormMode(null);
            fetchKatalog();
        } catch (error) {
            showNotif(getApiError(error, "Gagal menyimpan perubahan."), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
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
                    showNotif(getApiError(error, "Gagal menghapus item."), "error");
                }
            }
        );
    };

    const handleViewBarangDetail = async (item: KatalogBarangItem) => {
        setSelectedBarang(item);
        setBsuRiwayat(null);
        if (isAdminBsm) return;
        try {
            const res = await BarangService.getDetailBarangBSU(item.produk_id, barangFilterBank);
            setBsuRiwayat(res.data?.riwayat_distribusi ?? []);
        } catch {
            setBsuRiwayat([]);
        }
    };

    const handleBarangSubmit = async (data: BarangFormData) => {
        if (!user?.bank_id) { showNotif("Bank ID tidak ditemukan.", "error"); return; }
        setIsSubmitting(true);
        try {
            if (formMode === "add-barang") {
                await BarangService.addBarang(user.bank_id, {
                    nama_barang: data.nama_barang,
                    barang_id: data.barang_id,
                    nilai_poin: data.nilai_poin,
                    stok_awal: data.stok_awal,
                    created_by: user.identity_id || undefined,
                    foto: data.foto,
                });
                showNotif("Barang berhasil ditambahkan!");
            } else if (formMode === "edit-barang" && selectedBarang) {
                await BarangService.editBarang(selectedBarang.produk_id, {
                    nama_barang: data.nama_barang || undefined,
                    nilai_poin: data.nilai_poin,
                    tambah_stok: data.tambah_stok,
                    stok: data.stok,
                    updated_by: user.identity_id || undefined,
                    foto: data.foto,
                });
                showNotif("Barang berhasil diperbarui!");
                setSelectedBarang(null);
            }
            setFormMode(null);
            fetchBarang(barangFilterBank);
        } catch (error) {
            showNotif(getApiError(error, "Gagal menyimpan perubahan."), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBarang = () => {
        if (!selectedBarang) return;
        showConfirm(
            "Hapus Item Barang",
            `Yakin ingin menghapus "${selectedBarang.nama_barang}"? Tindakan ini tidak bisa dibatalkan.`,
            async () => {
                closeConfirm();
                try {
                    await BarangService.deleteBarang(selectedBarang.produk_id);
                    showNotif("Barang berhasil dihapus!");
                    setSelectedBarang(null);
                    fetchBarang(barangFilterBank);
                } catch (error) {
                    showNotif(getApiError(error, "Gagal menghapus."), "error");
                }
            }
        );
    };

    const distribusiColumns = useMemo(() => buildDistribusiColumns(isAdminBsi), [isAdminBsi]);

    return (
        <div className="katalog-page">
            {notif && <PopupNotifikasi message={notif.message} type={notif.type} onClose={() => setNotif(null)} />}
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

            <div className={`katalog-content-layout ${(activeTab === "sampah" || (isAdminBsi && activeTab === "barang")) ? "has-sidebar" : ""}`}>
                <div className="katalog-content-main">
                    <Tabs
                        tabs={[
                            { id: "sampah", label: "Katalog Sampah" },
                            { id: "barang", label: "Katalog Barang" },
                        ]}
                        activeTab={activeTab}
                        onChange={(id) => { setActiveTab(id as "sampah" | "barang"); setFilterKategori("all"); }}
                        style={{ marginBottom: '14px' }}
                    />

                    <div className="katalog-desc-section" style={{ paddingTop: 0 }}>
                        <p className="katalog-desc">
                            {activeTab === "sampah"
                                ? "Daftar jenis sampah yang dapat disetor oleh nasabah ke Bank Sampah. Setiap item memiliki harga jual berupa rupiah atau poin yang ditentukan oleh masing-masing Bank Sampah."
                                : "Daftar produk kebutuhan pokok yang dapat ditukarkan oleh nasabah menggunakan poin hasil setoran sampah. Program ini mendorong nasabah untuk aktif menabung sampah."}
                        </p>

                        <div className="katalog-action-row">
                            {activeTab === "sampah" ? (
                                <SearchBar
                                    placeholder="Cari ID atau nama sampah"
                                    value={sampahSearch}
                                    onChange={setSampahSearch}
                                    width="280px"
                                />
                            ) : (
                                <SearchBar
                                    placeholder="Cari ID atau nama barang"
                                    value={barangSearch}
                                    onChange={setBarangSearch}
                                    width="280px"
                                />
                            )}
                            <div style={{ display: "flex", gap: "8px" }}>
                                {(isAdminBsi || isAdminBsu || isAdminBsm) && !(activeTab === "barang" && isViewingBSU) && (
                                    <Button icon={<FaFileExport />} color="secondary" variant="outline" size="small" isRounded disabled={isExporting} onClick={handleExport}>
                                        {isExporting ? "Mengunduh..." : "Ekspor Data"}
                                    </Button>
                                )}
                                {(activeTab === "sampah" ? canEdit : canEditBarang) && (
                                    <Button icon={<FaPlus />} color="secondary" size="small" isRounded
                                        onClick={() => setFormMode(activeTab === "sampah" ? "add" : "add-barang")}>
                                        {activeTab === "sampah" ? "Tambah Sampah" : "Tambah Barang"}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <hr className="katalog-divider" />
                    </div>

                    {activeTab === "sampah" ? (
                        filteredSampah.length === 0
                            ? <div className="katalog-empty"><FaBoxOpen /><span>Tidak ada item ditemukan</span></div>
                            : <>
                                <div className="katalog-grid">
                                    {pagedSampah.map(i => <SampahCard key={i.sampah_id} item={i} onClick={() => handleViewDetail(i)} />)}
                                </div>
                                <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 0" }}>
                                    <Pagination
                                        currentPage={sampahPage}
                                        totalPages={sampahTotalPages}
                                        onPageChange={setSampahPage}
                                    />
                                </div>
                            </>
                    ) : (
                        filteredBarang.length === 0
                            ? <div className="katalog-empty"><FaBasketShopping /><span>Tidak ada item ditemukan</span></div>
                            : <>
                                <div className="katalog-grid">
                                    {pagedBarang.map(i => <BarangCard key={i.produk_id} item={i} onClick={() => handleViewBarangDetail(i)} />)}
                                </div>
                                <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 0" }}>
                                    <Pagination
                                        currentPage={barangPage}
                                        totalPages={barangTotalPages}
                                        onPageChange={setBarangPage}
                                    />
                                </div>
                            </>
                    )}
                </div>

                {activeTab === "sampah" && (
                    <div className="katalog-side-col">
                        <aside className={`katalog-filter-sidebar kf-collapsible${filterOpen ? " is-open" : ""}`}>
                            <button
                                type="button"
                                className="kf-mobile-toggle"
                                onClick={() => setFilterOpen(prev => !prev)}
                                aria-expanded={filterOpen}
                            >
                                <span>Filter{filterAktifCount > 0 ? ` · ${filterAktifCount} aktif` : ""}</span>
                                <FaChevronDown className="kf-mobile-toggle-icon" />
                            </button>
                            <div className="kf-body">
                                <div className="kf-group">
                                    <span className="kf-group-label">Kategori Sampah</span>
                                    <FilterPill
                                        options={[{ label: "Semua", value: "all" }, ...categories.map(cat => ({ label: cat.Kategori, value: cat.KategoriID }))]}
                                        activeValue={filterKategori}
                                        onChange={(v) => setFilterKategori(v)}
                                        maxVisible={KATEGORI_PREVIEW_COUNT}
                                    />
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
                                        options={[{ label: "Semua", value: "all" }, ...rewards.map(r => ({ label: r.nama_reward, value: r.reward_id }))]}
                                        activeValue={filterReward}
                                        onChange={(v) => setFilterReward(v)}
                                    />
                                </div>
                            </div>
                        </aside>
                    </div>
                )}

                {activeTab === "barang" && isAdminBsi && (
                    <div className="katalog-side-col">
                        <aside className="katalog-filter-sidebar">
                            <div className="kf-group">
                                <span className="kf-group-label">Katalog</span>
                                <FilterPill
                                    options={[{ label: "Katalog Saya", value: user?.bank_id ?? "" }]}
                                    activeValue={barangFilterBank}
                                    onChange={(v) => {
                                        const bankId = v as string;
                                        setBarangFilterBank(bankId);
                                        setSelectedBarang(null);
                                        fetchBarang(bankId);
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
                                            activeValue={barangFilterBank}
                                            onChange={(v) => {
                                                const bankId = v as string;
                                                setBarangFilterBank(bankId);
                                                setSelectedBarang(null);
                                                fetchBarang(bankId);
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </aside>
                    </div>
                )}
            </div>

            {activeTab === "barang" && (isAdminBsi || isAdminBsu) && (
                <div className="katalog-distribusi-section">
                    <hr className="katalog-divider" style={{ marginTop: "24px", marginBottom: "24px" }} />
                    <div className="katalog-distribusi-header">
                        <h3 className="katalog-distribusi-title">Riwayat Distribusi Barang</h3>
                        <p className="katalog-distribusi-desc">
                            {isAdminBsi
                                ? "Daftar seluruh distribusi barang yang telah dikirimkan ke unit BSU."
                                : "Daftar seluruh distribusi barang yang telah diterima dari BSI."}
                        </p>
                    </div>
                    <div className="katalog-distribusi-filter-row">
                        <SearchBar
                            placeholder="Cari ID distribusi atau nama..."
                            value={distribusiSearch}
                            onChange={setDistribusiSearch}
                            width="280px"
                        />
                        <FilterRange
                            from={distribusiFrom}
                            to={distribusiTo}
                            onChange={(f, t) => { setDistribusiFrom(f); setDistribusiTo(t); }}
                        />
                    </div>
                    {distribusiLoading
                        ? <div className="katalog-loading">Memuat data...</div>
                        : <Table
                            columns={distribusiColumns}
                            data={filteredDistribusi}
                            rowKey={(row) => row.disba_id}
                            emptyMessage="Belum ada riwayat distribusi barang."
                            onRowClick={(row) => navigate(`${isAdminBsi ? "/bsi" : "/bsu"}/distribusi-barang/${row.disba_id}`)}
                          />
                    }
                </div>
            )}

            {(formMode === "add" || formMode === "edit-item") && (
                <KatalogSampahFormModal
                    formMode={formMode}
                    categories={categories}
                    rewards={rewards}
                    initialValues={formMode === "edit-item" && selectedItem ? {
                        nama_sampah: selectedItem.nama_sampah,
                        satuan: selectedItem.satuan,
                        kategori_id: selectedItem.kategori_id,
                        reward_id: selectedItem.reward_id,
                        syarat_pemilahan: selectedItem.syarat_pemilahan,
                        photo_url: selectedItem.photo_url,
                    } : undefined}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSampahSubmit}
                    onClose={() => setFormMode(null)}
                />
            )}

            {selectedItem && !formMode && (
                <KatalogSampahDetailModal
                    item={selectedItem}
                    detail={selectedItemDetail}
                    canEdit={canEdit}
                    onClose={() => { setSelectedItem(null); setSelectedItemDetail(null); }}
                    onDelete={handleDelete}
                    onEdit={() => setFormMode("edit-item")}
                />
            )}

            {(formMode === "add-barang" || formMode === "edit-barang") && (
                <KatalogBarangFormModal
                    formMode={formMode}
                    initialValues={formMode === "edit-barang" && selectedBarang ? {
                        nama_barang: selectedBarang.nama_barang,
                        nilai_poin: selectedBarang.nilai_poin,
                        photo_url: selectedBarang.photo_url,
                    } : undefined}
                    isSubmitting={isSubmitting}
                    onSubmit={handleBarangSubmit}
                    onClose={() => setFormMode(null)}
                />
            )}

            {selectedBarang && !formMode && (
                <KatalogBarangDetailModal
                    item={selectedBarang}
                    bsuRiwayat={bsuRiwayat}
                    canEditBarang={canEditBarang}
                    isAdminBsi={isAdminBsi}
                    isAdminBsm={isAdminBsm}
                    filterBankName={bsuList.find(b => b.BankID === barangFilterBank)?.NamaBank}
                    isViewingBSU={isViewingBSU}
                    onClose={() => { setSelectedBarang(null); setBsuRiwayat(null); }}
                    onDelete={handleDeleteBarang}
                    onEdit={() => setFormMode("edit-barang")}
                />
            )}
        </div>
    );
}
