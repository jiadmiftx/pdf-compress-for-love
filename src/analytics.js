import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyCgiUAHP5y-hDCupc1y9QaktdMftYVhNyE",
    authDomain: "pdf-compress-for-love.firebaseapp.com",
    projectId: "pdf-compress-for-love",
    storageBucket: "pdf-compress-for-love.firebasestorage.app",
    messagingSenderId: "283404303785",
    appId: "1:283404303785:web:dbc173d2134da70917d8b8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ─── Custom event helpers ────────────────────────────────────────

/** Track when files are uploaded */
export function trackFilesUploaded(count, totalSizeBytes) {
    logEvent(analytics, 'files_uploaded', {
        file_count: count,
        total_size_kb: Math.round(totalSizeBytes / 1024),
    });
}

/** Track compression start */
export function trackCompressionStart(quality, fileCount) {
    logEvent(analytics, 'compression_start', {
        quality_level: quality,
        file_count: fileCount,
    });
}

/** Track single file compressed */
export function trackFileCompressed(originalSizeBytes, compressedSizeBytes, pageCount, quality) {
    const ratio = Math.round((1 - compressedSizeBytes / originalSizeBytes) * 100);
    logEvent(analytics, 'file_compressed', {
        original_size_kb: Math.round(originalSizeBytes / 1024),
        compressed_size_kb: Math.round(compressedSizeBytes / 1024),
        savings_percent: ratio,
        page_count: pageCount,
        quality_level: quality,
    });
}

/** Track download */
export function trackDownload(type, fileSizeBytes) {
    logEvent(analytics, 'file_download', {
        download_type: type, // 'single' or 'zip'
        file_size_kb: Math.round(fileSizeBytes / 1024),
    });
}

/** Track compression error */
export function trackCompressionError(errorMessage) {
    logEvent(analytics, 'compression_error', {
        error_message: errorMessage?.substring(0, 100),
    });
}

export { analytics };
