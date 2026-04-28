import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft, FaCloudArrowUp, FaTrash,
    FaImage, FaAlignLeft, FaArrowUp, FaArrowDown,
    FaLayerGroup,
    FaPencil
} from "react-icons/fa6";
import Button from "../components/button";
import { useAuth } from "../contexts/AuthContext";
import { KontenService } from "../services/konten.service";
import type { BodyBlock } from "../types/konten.type";
import "../styles/unggah_konten.css";

/* ── Block Types ── */
type BlockType = "text" | "image";

interface ContentBlock {
    id: string;
    type: BlockType;
    content: string;       // Text content OR image URL (preview)
    file?: File;           // File object for upload (image only)
    media_url?: string;    // Original URL from backend (image only)
}

function generateBlockId() {
    return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ── Main Page ── */
export default function UnggahKontenPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const isEditMode = !!id;
    const { user } = useAuth();

    // ── Article metadata ──
    const [judul, setJudul] = useState("");
    const [deskripsi, setDeskripsi] = useState("");

    // ── Thumbnail ──
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbPreview, setThumbPreview] = useState<string | null>(null);
    const thumbInputRef = useRef<HTMLInputElement>(null);

    // ── Content blocks ──
    const [blocks, setBlocks] = useState<ContentBlock[]>([
        { id: generateBlockId(), type: "text", content: "" }
    ]);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);

    // Block image file refs
    const blockFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // ── Fetch data if edit mode ──
    useEffect(() => {
        if (isEditMode && id) {
            const fetchDetail = async () => {
                try {
                    const res = await KontenService.getKontenById(id);
                    const k = res.data;
                    setJudul(k.Judul);
                    setDeskripsi(k.Deskripsi);
                    if (k.Thumbnail) setThumbPreview(k.Thumbnail);

                    // Parse Blocks
                    const parsedBlocks: BodyBlock[] = JSON.parse(k.Body || "[]");
                    const mappedBlocks: ContentBlock[] = parsedBlocks.map(b => ({
                        id: generateBlockId(),
                        type: b.type,
                        content: b.type === "text" ? (b.content || "") : (b.media_url || ""),
                        media_url: b.media_url
                    }));
                    
                    if (mappedBlocks.length > 0) {
                        setBlocks(mappedBlocks);
                    }
                } catch (err) {
                    console.error("Gagal mengambil detail konten:", err);
                    alert("Gagal mengambil data konten.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDetail();
        }
    }, [id, isEditMode]);

    // ── Thumbnail Handlers ──
    const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        setThumbnail(file);
        const reader = new FileReader();
        reader.onloadend = () => setThumbPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const removeThumb = () => {
        setThumbnail(null);
        setThumbPreview(null);
        if (thumbInputRef.current) thumbInputRef.current.value = "";
    };

    // ── Block CRUD ──
    const addBlock = useCallback((type: BlockType) => {
        const newBlock: ContentBlock = { id: generateBlockId(), type, content: "" };
        setBlocks(prev => [...prev, newBlock]);
        // Auto-focus new block
        setTimeout(() => setActiveBlockId(newBlock.id), 50);
    }, []);

    const removeBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
        if (activeBlockId === id) setActiveBlockId(null);
    }, [activeBlockId]);

    const updateBlockContent = useCallback((id: string, content: string) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
    }, []);

    const moveBlock = useCallback((id: string, direction: "up" | "down") => {
        setBlocks(prev => {
            const idx = prev.findIndex(b => b.id === id);
            if (idx === -1) return prev;
            if (direction === "up" && idx === 0) return prev;
            if (direction === "down" && idx === prev.length - 1) return prev;
            const target = direction === "up" ? idx - 1 : idx + 1;
            const newBlocks = [...prev];
            [newBlocks[idx], newBlocks[target]] = [newBlocks[target], newBlocks[idx]];
            return newBlocks;
        });
    }, []);

    // ── Image block file handling ──
    const handleBlockImage = useCallback((blockId: string, file: File) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setBlocks(prev => prev.map(b =>
                b.id === blockId ? { ...b, content: reader.result as string, file, media_url: undefined } : b
            ));
        };
        reader.readAsDataURL(file);
    }, []);

    // ── Auto-resize textarea ──
    const autoResize = (el: HTMLTextAreaElement) => {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };

    // ── Submit ──
    const handlePublish = async (isPublished: boolean) => {
        if (!judul.trim()) {
            alert("Judul tidak boleh kosong.");
            return;
        }
        if (!user?.bank_id || !user?.identity_id) {
            alert("Sesi tidak valid. Silakan login ulang.");
            return;
        }

        let imgIdx = 0;
        const imageBlocksForUpload: { index: number; file: File }[] = [];

        const bodyBlocks: BodyBlock[] = blocks
            .filter(b => b.type === "text" ? b.content.trim() !== "" : true)
            .map(b => {
                if (b.type === "text") {
                    return { type: "text", content: b.content };
                }
                const currentIdx = imgIdx++;
                // Jika ada file baru di-upload di filter ini:
                if (b.file) {
                    imageBlocksForUpload.push({ index: currentIdx, file: b.file });
                    return { type: "image", media_url: "", index: currentIdx };
                }
                // Jika pakai gambar lama (media_url):
                return { type: "image", media_url: b.media_url, index: currentIdx };
            });

        const nonEmptyText = bodyBlocks.filter(b => b.type === "text" && b.content?.trim());
        const hasImages = bodyBlocks.some(b => b.type === "image");

        if (bodyBlocks.length === 0 || (nonEmptyText.length === 0 && !hasImages)) {
            alert("Isi konten tidak boleh kosong.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                bankId: user.bank_id,
                adminId: user.identity_id,
                judul,
                deskripsi,
                thumbnail,
                imageBlocks: imageBlocksForUpload,
                bodyJson: JSON.stringify(bodyBlocks),
                isPublished,
            };

            if (isEditMode && id) {
                await KontenService.editKonten(id, payload);
                alert("Konten berhasil diperbarui!");
            } else {
                await KontenService.addKonten(payload);
                alert(isPublished ? "Konten berhasil dipublikasikan!" : "Draft berhasil disimpan!");
            }
            navigate(-1);
        } catch (err) {
            console.error("Failed to submit konten", err);
            alert("Gagal memproses konten. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="uc-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <p>Memuat data konten...</p>
            </div>
        );
    }

    // ── Block count info ──
    const textBlockCount = blocks.filter(b => b.type === "text").length;
    const imageBlockCount = blocks.filter(b => b.type === "image").length;

    return (
        <div className="uc-page">
            {/* ── Top Bar ── */}
            <div className="uc-topbar">
                <button className="uc-back-btn" onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                    Kembali
                </button>
                <div className="uc-topbar-right">
                    <span className={`uc-status ${isEditMode ? "edit" : "draft"}`}>
                        {isEditMode ? "Edit Mode" : "Draft"}
                    </span>
                    <Button
                        color="primary"
                        variant="outline"
                        isRounded
                        onClick={() => handlePublish(false)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Simpan Draft"}
                    </Button>
                    <Button
                        color="neon"
                        isRounded
                        icon={isEditMode ? <FaPencil /> : <FaCloudArrowUp />}
                        onClick={() => handlePublish(true)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Memproses..." : isEditMode ? "Update & Publikasi" : "Publikasikan"}
                    </Button>
                </div>
            </div>

            {/* ── Two-column Layout ── */}
            <div className="uc-layout">
                {/* ── Left: Editor ── */}
                <div className="uc-editor">
                    {/* Judul */}
                    <div className="uc-title-area">
                        <input
                            type="text"
                            className="uc-title-input"
                            placeholder="Tulis judul artikel..."
                            value={judul}
                            onChange={(e) => setJudul(e.target.value)}
                            maxLength={255}
                        />
                    </div>

                    {/* Deskripsi */}
                    <div className="uc-desc-area">
                        <textarea
                            className="uc-desc-input"
                            placeholder="Tulis ringkasan singkat artikel ini..."
                            value={deskripsi}
                            onChange={(e) => setDeskripsi(e.target.value)}
                            rows={2}
                            onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                        />
                    </div>

                    <hr className="uc-divider" />

                    {/* Content Blocks */}
                    <div className="uc-blocks">
                        <span className="uc-blocks-label">Isi Konten</span>

                        {blocks.map((block, idx) => (
                            <div
                                key={block.id}
                                className={`uc-block ${activeBlockId === block.id ? "active" : ""}`}
                                onClick={() => setActiveBlockId(block.id)}
                            >
                                {/* Block Controls */}
                                <div className="uc-block-controls">
                                    {idx > 0 && (
                                        <button
                                            className="uc-block-ctrl-btn move-up"
                                            title="Pindah ke atas"
                                            onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "up"); }}
                                        >
                                            <FaArrowUp />
                                        </button>
                                    )}
                                    {idx < blocks.length - 1 && (
                                        <button
                                            className="uc-block-ctrl-btn move-down"
                                            title="Pindah ke bawah"
                                            onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "down"); }}
                                        >
                                            <FaArrowDown />
                                        </button>
                                    )}
                                    {blocks.length > 1 && (
                                        <button
                                            className="uc-block-ctrl-btn"
                                            title="Hapus blok"
                                            onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>

                                {/* Text Block */}
                                {block.type === "text" && (
                                    <textarea
                                        className="uc-block-text"
                                        placeholder="Tulis paragraf..."
                                        value={block.content}
                                        onChange={(e) => {
                                            updateBlockContent(block.id, e.target.value);
                                            autoResize(e.target);
                                        }}
                                        onFocus={() => setActiveBlockId(block.id)}
                                        onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                                    />
                                )}

                                {/* Image Block */}
                                {block.type === "image" && (
                                    <div className="uc-block-image">
                                        {block.content ? (
                                            <div className="uc-block-image-wrap">
                                                <img src={block.content} alt="Block image" />
                                                <div className="uc-block-image-overlay">
                                                    <Button 
                                                        size="small" 
                                                        color="white" 
                                                        variant="outline"
                                                        onClick={(e) => { e.stopPropagation(); blockFileRefs.current[block.id]?.click(); }}
                                                    >
                                                        Ganti Gambar
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className="uc-block-image-placeholder"
                                                onClick={() => blockFileRefs.current[block.id]?.click()}
                                            >
                                                <FaImage />
                                                <span>Klik untuk upload gambar</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg, image/jpg, image/webp"
                                            ref={(el) => { blockFileRefs.current[block.id] = el; }}
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) handleBlockImage(block.id, e.target.files[0]);
                                            }}
                                            style={{ display: "none" }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add Block Toolbar */}
                        <div className="uc-add-block-bar">
                            <span className="uc-add-block-bar-label">Tambah blok:</span>
                            <button className="uc-add-btn" onClick={() => addBlock("text")}>
                                <FaAlignLeft /> Teks
                            </button>
                            <button className="uc-add-btn" onClick={() => addBlock("image")}>
                                <FaImage /> Gambar
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Right: Sidebar ── */}
                <div className="uc-sidebar">
                    {/* Thumbnail Card */}
                    <div className="uc-sidebar-card">
                        <div className="uc-sidebar-card-header">
                            <h3 className="uc-sidebar-card-title">Foto Thumbnail</h3>
                        </div>
                        <div className="uc-sidebar-card-body">
                            <div
                                className={`uc-thumb-area ${thumbPreview ? "has-thumb" : ""}`}
                                onClick={() => !thumbPreview && thumbInputRef.current?.click()}
                            >
                                {thumbPreview ? (
                                    <>
                                        <img src={thumbPreview} alt="Thumbnail preview" />
                                        <div className="uc-thumb-overlay">
                                            <button
                                                className="uc-thumb-overlay-btn"
                                                onClick={(e) => { e.stopPropagation(); removeThumb(); }}
                                            >
                                                <FaTrash /> Hapus
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="uc-thumb-prompt">
                                        <FaCloudArrowUp />
                                        <span>Upload thumbnail</span>
                                        <small>Rasio 16:9 disarankan</small>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg, image/webp"
                                    ref={thumbInputRef}
                                    onChange={handleThumbChange}
                                    style={{ display: "none" }}
                                />
                            </div>
                            <span className="uc-form-hint">
                                Foto ini akan menjadi cover utama yang tampil di daftar konten.
                            </span>
                        </div>
                    </div>

                    {/* Block Info Card */}
                    <div className="uc-sidebar-card">
                        <div className="uc-sidebar-card-header">
                            <h3 className="uc-sidebar-card-title">Ringkasan Konten</h3>
                        </div>
                        <div className="uc-sidebar-card-body">
                            <div className="uc-block-info">
                                <FaLayerGroup />
                                <span>
                                    <span className="uc-block-info-count">{blocks.length}</span> blok total
                                </span>
                            </div>
                            <div className="uc-block-info">
                                <FaAlignLeft />
                                <span>
                                    <span className="uc-block-info-count">{textBlockCount}</span> paragraf
                                </span>
                            </div>
                            <div className="uc-block-info">
                                <FaImage />
                                <span>
                                    <span className="uc-block-info-count">{imageBlockCount}</span> gambar
                                </span>
                            </div>
                            <span className="uc-form-hint">
                                Susun blok teks dan gambar sesuai urutan yang kamu inginkan.
                                Gunakan tombol panah ↑↓ untuk mengatur posisi.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
