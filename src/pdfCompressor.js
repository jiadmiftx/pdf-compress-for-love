import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

/**
 * Quality presets mapping to scale factor and JPEG quality
 */
const QUALITY_PRESETS = {
    low: { scale: 0.6, quality: 0.4, label: 'Tinggi (file kecil)' },
    medium: { scale: 0.8, quality: 0.6, label: 'Sedang' },
    high: { scale: 1.0, quality: 0.75, label: 'Rendah (kualitas bagus)' },
};

/**
 * Compress a single PDF file by re-rendering pages as JPEG images
 * @param {File} file - The PDF file to compress
 * @param {string} qualityLevel - 'low', 'medium', or 'high'
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<{blob: Blob, originalSize: number, compressedSize: number}>}
 */
export async function compressPDF(file, qualityLevel = 'medium', onProgress = () => { }) {
    const preset = QUALITY_PRESETS[qualityLevel] || QUALITY_PRESETS.medium;
    const arrayBuffer = await file.arrayBuffer();
    const originalSize = arrayBuffer.byteLength;

    // Load PDF with pdf.js for rendering
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdfDoc.numPages;

    // Create new PDF with pdf-lib
    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: preset.scale * 2 }); // 2x for better base quality

        // Render page to canvas
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convert canvas to JPEG
        const jpegDataUrl = canvas.toDataURL('image/jpeg', preset.quality);
        const jpegBytes = Uint8Array.from(atob(jpegDataUrl.split(',')[1]), c => c.charCodeAt(0));

        // Embed image in new PDF
        const jpegImage = await newPdf.embedJpg(jpegBytes);
        const newPage = newPdf.addPage([
            page.getViewport({ scale: 1 }).width,
            page.getViewport({ scale: 1 }).height
        ]);
        newPage.drawImage(jpegImage, {
            x: 0,
            y: 0,
            width: newPage.getWidth(),
            height: newPage.getHeight(),
        });

        // Report progress
        onProgress(Math.round((i / totalPages) * 100));

        // Cleanup
        canvas.width = 0;
        canvas.height = 0;
    }

    const compressedBytes = await newPdf.save();
    const blob = new Blob([compressedBytes], { type: 'application/pdf' });

    return {
        blob,
        originalSize,
        compressedSize: compressedBytes.byteLength,
    };
}

/**
 * Get a preview thumbnail of the first page
 * @param {File} file
 * @returns {Promise<string>} Data URL of the thumbnail
 */
export async function getPDFThumbnail(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 0.4 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/png');
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
}

/**
 * Get PDF page count
 * @param {File} file
 * @returns {Promise<number>}
 */
export async function getPDFPageCount(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdfDoc.numPages;
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export { QUALITY_PRESETS };
