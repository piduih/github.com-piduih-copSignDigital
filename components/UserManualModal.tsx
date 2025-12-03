
import React, { useEffect } from 'react';
import { XIcon } from './icons/XIcon';

interface UserManualModalProps {
    onClose: () => void;
}

const UserManualModal: React.FC<UserManualModalProps> = ({ onClose }) => {
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800">Panduan Pengguna</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                        <XIcon />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto prose prose-slate max-w-none text-slate-700 leading-relaxed">
                    
                    <p className="text-slate-600 mb-6">
                        Selamat datang ke <strong>PDF Company Stamper</strong>. Aplikasi ini memudahkan anda meletakkan cop rasmi syarikat, tandatangan, dan kod QR pada dokumen PDF secara digital.
                    </p>

                    <h3 className="text-lg font-bold text-cyan-700 mb-3">1. Persediaan Awal (Tetapan Syarikat)</h3>
                    <p className="mb-2">Sebelum memulakan, anda perlu memasukkan maklumat syarikat:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1">
                        <li>Klik butang <strong>Settings</strong> (ikon gear) di penjuru kanan atas.</li>
                        <li>Masukkan <strong>Nama Syarikat</strong>, <strong>No. Pendaftaran</strong>, <strong>Alamat</strong>, dan <strong>No. Telefon</strong>.</li>
                        <li><strong>Logo:</strong> Anda boleh memuat naik logo (PNG background telus disyorkan).</li>
                        <li><strong>Tandatangan:</strong> Pilih sama ada ingin menaip nama (Type Signature) atau memuat naik gambar tandatangan (Upload Image).</li>
                    </ul>

                    <h3 className="text-lg font-bold text-cyan-700 mb-3">2. Menggunakan Ciri AI (Gemini, OpenAI, dll)</h3>
                    <p className="mb-2">Aplikasi ini menyokong pelbagai integrasi AI untuk membantu anda:</p>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 space-y-3">
                        <div>
                            <span className="font-semibold text-slate-800 block">Langkah 1: Pilih AI Provider</span>
                            <span className="text-sm">Di dalam <strong>Settings</strong> &gt; <strong>AI Configuration</strong>, pilih penyedia pilihan anda:</span>
                            <ul className="list-disc pl-5 mt-1 text-sm text-slate-600">
                                <li><strong>Google Gemini:</strong> Cepat & Percuma (Disyorkan).</li>
                                <li><strong>OpenAI:</strong> Untuk pengguna ChatGPT (Model GPT-4o, dll).</li>
                                <li><strong>Custom / Local:</strong> Untuk pengguna Ollama, LM Studio, atau DeepSeek.</li>
                            </ul>
                        </div>
                        <div>
                            <span className="font-semibold text-slate-800 block">Langkah 2: Masukkan API Key / URL</span>
                            <ul className="list-disc pl-5 mt-1 text-sm text-slate-600">
                                <li><strong>Google:</strong> Dapatkan kunci di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google AI Studio</a>.</li>
                                <li><strong>OpenAI:</strong> Dapatkan kunci di <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 underline">OpenAI Platform</a>.</li>
                                <li><strong>Local:</strong> Masukkan Base URL (contoh: <code>http://localhost:11434/v1</code>).</li>
                            </ul>
                        </div>
                    </div>

                    <p className="mb-2 font-semibold">Fungsi AI yang tersedia:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1">
                        <li><strong>Cadangan Cop:</strong> Klik "Test & Get Stamp Text Suggestion" dalam Settings.</li>
                        <li><strong>Ringkasan Dokumen:</strong> Klik butang "Summarize" pada skrin utama selepas memuat naik fail.</li>
                    </ul>

                    <h3 className="text-lg font-bold text-cyan-700 mb-3">3. Cara Menggunakan (Stamping)</h3>
                    <ol className="list-decimal pl-5 mb-4 space-y-2">
                        <li>
                            <strong>Muat Naik:</strong> Seret fail PDF ke dalam kotak atau klik untuk memilih.
                        </li>
                        <li>
                            <strong>Ubah Suai (Preview):</strong> Gunakan panel di sebelah kanan untuk mengubah:
                            <ul className="list-disc pl-5 mt-1 text-sm text-slate-600">
                                <li><strong>Layout:</strong> Pilih posisi "Custom" untuk mengheret cop dan tandatangan secara bebas.</li>
                                <li><strong>Appearance:</strong> Ubah saiz font, warna, dan opacity (ketelusan).</li>
                                <li><strong>Pages:</strong> Pilih halaman tertentu (First, Last, All, atau Custom).</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Jana & Muat Turun:</strong> Klik butang "Generate" dan kemudian "Download" untuk menyimpan fail.
                        </li>
                    </ol>

                    <h3 className="text-lg font-bold text-cyan-700 mb-3">4. Penyelesaian Masalah Lazim</h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                        <div>
                            <p className="font-semibold text-slate-800">Tandatangan tidak kelihatan?</p>
                            <p className="text-sm">Pastikan suis "Include Signature" dihidupkan (ON). Jika menggunakan gambar, pastikan fail tidak rosak.</p>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">Cop "lari" kedudukan?</p>
                            <p className="text-sm">Ini mungkin berlaku pada PDF hasil imbasan (scan) yang melintang. Cuba gunakan mod "Custom" dan heret cop sedikit jauh dari jidar kertas.</p>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">AI Error?</p>
                            <p className="text-sm">Pastikan API Key anda sah dan mempunyai kredit (untuk OpenAI) atau had penggunaan (untuk Gemini). Jika guna Local AI, pastikan server (Ollama) sedang berjalan.</p>
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserManualModal;
