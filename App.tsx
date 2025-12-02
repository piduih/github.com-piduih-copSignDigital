import React, { useState, useEffect, useCallback } from 'react';
import type { CompanySettings, StampOptions } from './types';
import { stampPdf } from './services/pdfStamper';
import { getPDFSummary } from './services/geminiService';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import FileUpload from './components/FileUpload';
import PDFPreview from './components/PDFPreview';
import StampOptionsComponent from './components/StampOptions';
import FileQueue from './components/FileQueue';
import PDFSummary from './components/PDFSummary';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { ArrowLeftIcon } from './components/icons/ArrowLeftIcon';
import { DocumentTextIcon } from './components/icons/DocumentTextIcon';

declare const JSZip: any;
declare const pdfjsLib: any;

const App: React.FC = () => {
    const [companySettings, setCompanySettings] = useState<CompanySettings>({
        name: 'Example Company Sdn. Bhd.',
        regNo: '202401001234 (12345-X)',
        address: 'Level 1, Menara Example\nJalan Teknologi 1\n50000 Kuala Lumpur',
        phone: '+60 3-1234 5678',
        logo: undefined,
        signatureType: 'text', // Default to text
        signatureText: 'Director Name',
        signatureFont: 'Great Vibes',
        signature: undefined,
    });
    const [stampOptions, setStampOptions] = useState<StampOptions>({
        position: { preset: 'bottom-left' },
        signaturePosition: { x: 0.1, y: 0.3 }, // Default independent position
        color: '#003399',
        fontSize: 10,
        pages: 'first',
        pageRange: '',
        opacity: 1,
        logoSize: 40,
        signatureSize: 30,
        includeLogo: true,
        includeSignature: true, // Enable signature by default to show off the feature
        alignment: 'left',
        includeDate: false,
        includeFilename: false,
        includeQRCode: false,
        qrCodeData: 'https://aistudio.google.com/',
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [pdfFiles, setPdfFiles] = useState<File[]>([]);
    const [stampedContentUrl, setStampedContentUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // State for AI Summary
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const isBatchProcess = pdfFiles.length > 1;

    useEffect(() => {
        const savedSettings = localStorage.getItem('companySettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            // Migration for old settings that might not have signatureType
            if (!parsed.signatureType) {
                parsed.signatureType = parsed.signature ? 'image' : 'text';
                parsed.signatureText = parsed.name || 'Sign Here';
                parsed.signatureFont = 'Great Vibes';
            }
            setCompanySettings(parsed);
        } else {
            setIsSettingsOpen(true); // Open settings on first visit
        }
    }, []);

    const handleSettingsSave = (settings: CompanySettings) => {
        setCompanySettings(settings);
        localStorage.setItem('companySettings', JSON.stringify(settings));
        setIsSettingsOpen(false);
    };

    const handleFilesSelect = (files: File[]) => {
        setPdfFiles(files);
        setStampedContentUrl(null);
        setError(null);
        setSummary(null);
        setSummaryError(null);
    };

    const handleRemoveFile = (indexToRemove: number) => {
        setPdfFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const processFiles = useCallback(async () => {
        if (pdfFiles.length === 0) {
            setError("Please select one or more PDF files first.");
            return;
        }
        if (!companySettings.name) {
            setError("Please set your company name in the settings.");
            setIsSettingsOpen(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        setStampedContentUrl(null);
        setProcessingProgress(null);

        try {
            if (isBatchProcess) {
                // Batch processing
                const zip = new JSZip();
                const total = pdfFiles.length;
                for (let i = 0; i < total; i++) {
                    const file = pdfFiles[i];
                    setProcessingProgress({ current: i + 1, total });
                    const pdfBytes = await file.arrayBuffer();
                    const stampedPdfBytes = await stampPdf(pdfBytes, companySettings, stampOptions, file.name);
                    const stampedFileName = file.name.replace('.pdf', '-stamped.pdf');
                    zip.file(stampedFileName, stampedPdfBytes);
                }
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(zipBlob);
                setStampedContentUrl(url);
            } else {
                // Single file processing
                const pdfFile = pdfFiles[0];
                const pdfBytes = await pdfFile.arrayBuffer();
                const stampedPdfBytes = await stampPdf(pdfBytes, companySettings, stampOptions, pdfFile.name);
                const blob = new Blob([stampedPdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                setStampedContentUrl(url);
            }
        } catch (e) {
            console.error("Failed to stamp PDF(s):", e);
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(`Failed to process PDF(s). ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setProcessingProgress(null);
        }
    }, [pdfFiles, companySettings, stampOptions, isBatchProcess]);
    
    const handleSummarize = useCallback(async () => {
        if (pdfFiles.length !== 1) return;
        
        setIsSummarizing(true);
        setSummary(null);
        setSummaryError(null);

        try {
            const file = pdfFiles[0];
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n\n';
            }

            // Truncate to avoid exceeding token limits, focusing on the start of the document
            const truncatedText = fullText.substring(0, 100000);
            
            const result = await getPDFSummary(truncatedText);
            setSummary(result);

        } catch (e) {
             const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while summarizing.";
             setSummaryError(errorMessage);
        } finally {
            setIsSummarizing(false);
        }
    }, [pdfFiles]);


    const resetState = () => {
        setPdfFiles([]);
        setStampedContentUrl(null);
        setError(null);
        setIsLoading(false);
        setProcessingProgress(null);
        setSummary(null);
        setSummaryError(null);

        const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const getButtonText = () => {
        if (isLoading) {
            if (isBatchProcess && processingProgress) {
                return `Stamping ${processingProgress.current} of ${processingProgress.total}...`;
            }
            return "Stamping...";
        }
        return isBatchProcess ? "Generate Stamped ZIP" : "Generate Stamped PDF";
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <Header onOpenSettings={() => setIsSettingsOpen(true)} />

            {isSettingsOpen && (
                <SettingsModal
                    initialSettings={companySettings}
                    onSave={handleSettingsSave}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}

            <main className="w-full max-w-6xl flex-grow flex flex-col items-center p-4 mt-8 sm:mt-16">
                <div className="w-full bg-white rounded-2xl shadow-xl p-6 sm:p-10 border border-slate-200">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg relative mb-6" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    
                    {pdfFiles.length === 0 ? (
                        <div className="text-center">
                            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 mb-2">
                                PDF Company Stamper
                            </h1>
                            <p className="text-slate-600 mb-8 max-w-xl mx-auto">
                                Upload one or more PDFs to add your official company stamp. Customize the look and position in real-time.
                            </p>
                            <FileUpload onFilesSelect={handleFilesSelect} />
                        </div>
                    ) : (
                        <div>
                            {stampedContentUrl ? (
                                <div className="flex flex-col items-center gap-6 animate-fade-in text-center">
                                   <h2 className="text-2xl font-semibold text-green-600">Your File(s) are Ready!</h2>
                                    <a
                                        href={stampedContentUrl}
                                        download={isBatchProcess ? 'stamped-pdfs.zip' : (pdfFiles[0]?.name.replace('.pdf', '-stamped.pdf') || 'stamped.pdf')}
                                        className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-green-600/30"
                                    >
                                        <DownloadIcon />
                                        {isBatchProcess ? 'Download ZIP' : 'Download Stamped PDF'}
                                    </a>
                                    <button
                                        onClick={resetState}
                                        className="text-slate-500 hover:text-slate-800 transition-colors"
                                    >
                                        Stamp more files
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <button
                                            onClick={resetState}
                                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                                        >
                                            <ArrowLeftIcon />
                                            <span className="hidden sm:inline">Change File(s)</span>
                                        </button>
                                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 text-center">{isBatchProcess ? "Review & Stamp" : "Preview & Stamp"}</h2>
                                        <div className="w-28 text-right">
                                             {!isBatchProcess && (
                                                <button 
                                                    onClick={handleSummarize}
                                                    disabled={isSummarizing}
                                                    className="inline-flex items-center gap-2 text-sm bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:cursor-wait text-slate-700 font-semibold py-2 px-3 border border-slate-300 rounded-md transition-all duration-200"
                                                    title="Summarize PDF with AI"
                                                >
                                                   <DocumentTextIcon/>
                                                    <span className="hidden md:inline">{isSummarizing ? 'Summarizing...' : 'Summarize'}</span>
                                                </button>
                                             )}
                                        </div>
                                    </div>
                                    {(summary || isSummarizing || summaryError) && !isBatchProcess && (
                                        <PDFSummary
                                            summary={summary}
                                            isSummarizing={isSummarizing}
                                            error={summaryError}
                                            onClear={() => { setSummary(null); setSummaryError(null); }}
                                        />
                                    )}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start mt-4">
                                        {isBatchProcess ? (
                                            <FileQueue files={pdfFiles} onRemoveFile={handleRemoveFile} />
                                        ) : (
                                            <PDFPreview file={pdfFiles[0]} settings={companySettings} options={stampOptions} onStampOptionsChange={setStampOptions} filename={pdfFiles[0].name}/>
                                        )}
                                        <div className="flex flex-col justify-between h-full gap-8">
                                            <StampOptionsComponent options={stampOptions} onChange={setStampOptions} disabled={isLoading} />
                                            <button
                                                onClick={processFiles}
                                                disabled={isLoading}
                                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-blue-600/30"
                                            >
                                                {getButtonText()}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                 <footer className="mt-8 text-sm text-slate-500">
                    <p>Powered by React, Tailwind CSS, and pdf-lib.</p>
                </footer>
            </main>
        </div>
    );
};

export default App;