import React, { useState, useRef, useCallback } from 'react';
import {
    FileDown,
    Upload,
    Trash2,
    Download,
    FileText,
    Zap,
    Shield,
    ArrowDownToLine,
    ChevronDown,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Archive,
    Gauge
} from 'lucide-react';
import { compressPDF, getPDFThumbnail, getPDFPageCount, formatFileSize, QUALITY_PRESETS } from './pdfCompressor';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Status constants
const STATUS = {
    IDLE: 'idle',
    LOADING: 'loading',
    COMPRESSING: 'compressing',
    DONE: 'done',
    ERROR: 'error',
};

export default function PdfCompressorApp() {
    const [files, setFiles] = useState([]);
    const [quality, setQuality] = useState('medium');
    const [isDragging, setIsDragging] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = useRef(null);

    // Handle file selection
    const handleFiles = useCallback(async (selectedFiles) => {
        const pdfFiles = Array.from(selectedFiles).filter(f => f.type === 'application/pdf');
        if (pdfFiles.length === 0) return;

        const newFiles = await Promise.all(pdfFiles.map(async (file) => {
            let thumbnail = null;
            let pageCount = 0;
            try {
                thumbnail = await getPDFThumbnail(file);
                pageCount = await getPDFPageCount(file);
            } catch (e) {
                console.error('Error reading PDF:', e);
            }
            return {
                id: crypto.randomUUID(),
                file,
                name: file.name,
                originalSize: file.size,
                compressedSize: null,
                compressedBlob: null,
                thumbnail,
                pageCount,
                progress: 0,
                status: STATUS.IDLE,
                error: null,
            };
        }));

        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    // Drag & drop handlers
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    // Remove a file
    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    // Clear all files
    const clearAll = () => setFiles([]);

    // Compress all files
    const compressAll = async () => {
        setIsCompressing(true);

        for (let i = 0; i < files.length; i++) {
            const fileItem = files[i];
            if (fileItem.status === STATUS.DONE) continue;

            // Set compressing status
            setFiles(prev => prev.map(f =>
                f.id === fileItem.id ? { ...f, status: STATUS.COMPRESSING, progress: 0 } : f
            ));

            try {
                const result = await compressPDF(fileItem.file, quality, (progress) => {
                    setFiles(prev => prev.map(f =>
                        f.id === fileItem.id ? { ...f, progress } : f
                    ));
                });

                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id ? {
                        ...f,
                        status: STATUS.DONE,
                        progress: 100,
                        compressedSize: result.compressedSize,
                        compressedBlob: result.blob,
                    } : f
                ));
            } catch (error) {
                console.error('Compression error:', error);
                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id ? { ...f, status: STATUS.ERROR, error: error.message } : f
                ));
            }
        }

        setIsCompressing(false);
    };

    // Download single compressed file
    const downloadFile = (fileItem) => {
        if (!fileItem.compressedBlob) return;
        const name = fileItem.name.replace('.pdf', '_compressed.pdf');
        saveAs(fileItem.compressedBlob, name);
    };

    // Download all as ZIP
    const downloadAllAsZip = async () => {
        const completedFiles = files.filter(f => f.status === STATUS.DONE && f.compressedBlob);
        if (completedFiles.length === 0) return;

        const zip = new JSZip();
        completedFiles.forEach(f => {
            const name = f.name.replace('.pdf', '_compressed.pdf');
            zip.file(name, f.compressedBlob);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'compressed_pdfs.zip');
    };

    const completedCount = files.filter(f => f.status === STATUS.DONE).length;
    const totalSavedBytes = files
        .filter(f => f.status === STATUS.DONE)
        .reduce((sum, f) => sum + (f.originalSize - f.compressedSize), 0);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">

            {/* NAVBAR */}
            <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <FileDown className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-extrabold text-lg tracking-tight text-white">PDF<span className="text-indigo-400">Compress</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Shield size={14} />
                        <span>100% Client-Side · Files never leave your browser</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-4 py-10">

                {/* HERO */}
                {files.length === 0 && (
                    <div className="text-center mb-10 animate-fade-in-up">
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                            Compress PDF <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Instantly</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">
                            Reduce PDF file size directly in your browser. Free, fast, and 100% private.
                        </p>
                    </div>
                )}

                {/* DROP ZONE */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-10 md:p-16 text-center cursor-pointer transition-all duration-300 group mb-8
            ${isDragging
                            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                            : 'border-slate-700/60 bg-slate-900/50 hover:border-indigo-500/50 hover:bg-slate-900/80'
                        }`}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept=".pdf,application/pdf"
                        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
                        className="hidden"
                    />
                    <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-indigo-500/20 scale-110' : 'bg-slate-800 group-hover:bg-indigo-500/10'}`}>
                            <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white mb-1">
                                {isDragging ? 'Drop files here...' : 'Drag & drop PDF files or click to browse'}
                            </p>
                            <p className="text-sm text-slate-500">Supports multiple files at once</p>
                        </div>
                    </div>
                </div>

                {/* FILES LIST */}
                {files.length > 0 && (
                    <div className="animate-fade-in-up">

                        {/* CONTROLS BAR */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-slate-400">{files.length} file(s) selected</span>
                                <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition-colors">
                                    <X size={14} /> Clear All
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* QUALITY SELECTOR */}
                                <div className="relative">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
                                        <Gauge size={13} /> Compression Level
                                    </div>
                                    <div className="flex bg-slate-800/80 rounded-xl border border-slate-700/60 p-1">
                                        {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
                                            <button
                                                key={key}
                                                onClick={() => setQuality(key)}
                                                disabled={isCompressing}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${quality === key
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                                    } ${isCompressing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* COMPRESS BUTTON */}
                                <div className="flex flex-col items-end">
                                    <div className="mb-1.5 h-[17px]"></div>
                                    <button
                                        onClick={compressAll}
                                        disabled={isCompressing || files.length === 0}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${isCompressing
                                            ? 'bg-indigo-700 text-indigo-200 cursor-wait shadow-indigo-500/10'
                                            : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]'
                                            }`}
                                    >
                                        {isCompressing ? (
                                            <><Loader2 size={16} className="animate-spin" /> Processing...</>
                                        ) : (
                                            <><Zap size={16} /> Compress All</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* FILE CARDS */}
                        <div className="space-y-3 mb-6">
                            {files.map((f) => (
                                <div
                                    key={f.id}
                                    className={`bg-slate-900/80 border rounded-xl p-4 transition-all ${f.status === STATUS.DONE
                                        ? 'border-emerald-500/30'
                                        : f.status === STATUS.ERROR
                                            ? 'border-red-500/30'
                                            : 'border-slate-800/80'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Thumbnail */}
                                        <div className="shrink-0 w-12 h-14 bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center border border-slate-700/50">
                                            {f.thumbnail ? (
                                                <img src={f.thumbnail} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <FileText className="w-5 h-5 text-slate-600" />
                                            )}
                                        </div>

                                        {/* File info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{f.name}</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                <span>{formatFileSize(f.originalSize)}</span>
                                                <span>·</span>
                                                <span>{f.pageCount} pages</span>
                                                {f.status === STATUS.DONE && f.compressedSize && (
                                                    <>
                                                        <span>→</span>
                                                        <span className="text-emerald-400 font-bold">{formatFileSize(f.compressedSize)}</span>
                                                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${f.compressedSize < f.originalSize
                                                            ? 'bg-emerald-500/15 text-emerald-400'
                                                            : 'bg-amber-500/15 text-amber-400'
                                                            }`}>
                                                            {f.compressedSize < f.originalSize
                                                                ? `-${Math.round((1 - f.compressedSize / f.originalSize) * 100)}%`
                                                                : `+${Math.round((f.compressedSize / f.originalSize - 1) * 100)}%`
                                                            }
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Progress bar */}
                                            {f.status === STATUS.COMPRESSING && (
                                                <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300 animate-progress-pulse"
                                                        style={{ width: `${f.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                            {f.status === STATUS.ERROR && (
                                                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                                                    <AlertCircle size={12} /> Failed: {f.error}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {f.status === STATUS.DONE && (
                                                <button
                                                    onClick={() => downloadFile(f)}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    <Download size={14} /> Download
                                                </button>
                                            )}
                                            {f.status === STATUS.COMPRESSING && (
                                                <span className="text-xs text-indigo-400 font-semibold">{f.progress}%</span>
                                            )}
                                            {f.status === STATUS.DONE && (
                                                <CheckCircle2 size={20} className="text-emerald-500" />
                                            )}
                                            <button
                                                onClick={() => removeFile(f.id)}
                                                disabled={f.status === STATUS.COMPRESSING}
                                                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* SUMMARY & DOWNLOAD ALL */}
                        {completedCount > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/30 to-emerald-800/10 border border-emerald-500/20 rounded-xl p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-300">
                                            {completedCount} of {files.length} files compressed
                                        </p>
                                        <p className="text-xs text-emerald-500/80 mt-0.5">
                                            Total saved: <span className="font-bold text-emerald-400">{formatFileSize(Math.max(0, totalSavedBytes))}</span>
                                        </p>
                                    </div>
                                </div>
                                {completedCount > 1 && (
                                    <button
                                        onClick={downloadAllAsZip}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <Archive size={16} /> Download All (ZIP)
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* FEATURES */}
                {files.length === 0 && (
                    <div className="grid md:grid-cols-3 gap-4 mt-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        {[
                            { icon: Zap, title: 'Fast & Instant', desc: 'Process directly in your browser, no server queue', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                            { icon: Shield, title: '100% Private', desc: 'Files are never sent to any server', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { icon: ArrowDownToLine, title: 'Batch Processing', desc: 'Compress multiple PDFs at once in a single click', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                        ].map((feat, i) => (
                            <div key={i} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6 hover:border-slate-700/60 transition-all group">
                                <div className={`w-11 h-11 ${feat.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <feat.icon className={`w-5 h-5 ${feat.color}`} />
                                </div>
                                <h3 className="font-bold text-white mb-1.5">{feat.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* FOOTER */}
            <footer className="border-t border-slate-800/60 mt-16">
                <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center gap-2 text-xs text-slate-600">
                    <p>© {new Date().getFullYear()} <a href="https://instagram.com/angginrisnaw" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">@angginrisnaw 💕</a> — All rights reserved.</p>
                    <p>
                        Built with ❤️ by{' '}
                        <a href="https://github.com/jiadmiftx" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">@jiadmiftx</a>
                        {' · '}
                        <a href="https://instagram.com/jiadmiftx" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">Instagram</a>
                    </p>
                    <p className="text-slate-700 mt-1">All processing runs in your browser. No files are sent to any server.</p>
                </div>
            </footer>
        </div>
    );
}
