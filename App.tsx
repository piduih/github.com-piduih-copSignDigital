import React, { useState, useEffect, useCallback } from 'react';
import type { CompanySettings, StampOptions } from './types';
import { stampPdf } from './services/pdfStamper';
import { getPDFSummary } from './services/geminiService';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import UserManualModal from './components/UserManualModal';
import TermsPrivacyModal from './components/TermsPrivacyModal';
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
        signatureType: 'text',
        signatureText: 'Director Name',
        signatureFont: 'Great Vibes',
        signature: undefined,
        apiKey: '', 
        aiProvider: 'gemini', 
        aiModel: 'gemini-2.5-flash', 
        aiBaseUrl: '', 
    });
    const [stampOptions, setStampOptions] = useState<StampOptions>({
        position: { preset: 'bottom-left' },
        signaturePosition: { x: 0.1, y: 0.3 }, 
        color: '#003399',
        fontSize: 10,
        pages: 'first',
        pageRange: '',
        opacity: 1,
        logoSize: 40,
        signatureSize: 30,
        includeLogo: true,
        includeSignature: true, 
        alignment: 'left',
        includeDate: false,
        includeFilename: false,
        includeQRCode: false,
        qrCodeData: 'https://afiladesign.com/',
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
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
            if (!parsed.signatureType) {
                parsed.signatureType = parsed.signature ? 'image' : 'text';
                parsed.signatureText = parsed.name || 'Sign Here';
                parsed.signatureFont = 'Great Vibes';
            }
            if (!parsed.aiProvider) {
                parsed.aiProvider = 'gemini';
                parsed.aiModel = 'gemini-2.5-flash';
            }
            setCompanySettings(parsed);
        } else {
            setIsSettingsOpen(true); 
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
            setError("Please pick a PDF file first.");
            return;
        }
        if (!companySettings.name) {
            setError("We need your company name first. Please check Settings.");
            setIsSettingsOpen(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        setStampedContentUrl(null);
        setProcessingProgress(null);

        try {
            if (isBatchProcess) {
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
                const pdfFile = pdfFiles[0];
                const pdfBytes = await pdfFile.arrayBuffer();
                const stampedPdfBytes = await stampPdf(pdfBytes, companySettings, stampOptions, pdfFile.name);
                const blob = new Blob([stampedPdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                setStampedContentUrl(url);
            }
        } catch (e) {
            console.error("Failed to stamp PDF(s):", e);
            const errorMessage = e instanceof Error ? e.message : "Something went wrong.";
            setError(`Oops! We couldn't stamp your file. ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setProcessingProgress(null);
        }
    }, [pdfFiles, companySettings, stampOptions, isBatchProcess]);
    
    const handleSummarize = useCallback(async () => {
        if (pdfFiles.length !== 1) return;
        
        const isLocal = companySettings.aiProvider === 'custom' && companySettings.aiBaseUrl?.includes('localhost');
        if (!companySettings.apiKey && !isLocal) {
            setSummaryError(`To use the Smart Summary, you need to add your API Key in Settings.`);
            setIsSettingsOpen(true); 
            return;
        }

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

            const truncatedText = fullText.substring(0, 100000);
            const result = await getPDFSummary(companySettings, truncatedText);
            setSummary(result);

        } catch (e) {
             const errorMessage = e instanceof Error ? e.message : "Unknown error.";
             setSummaryError(errorMessage);
        } finally {
            setIsSummarizing(false);
        }
    }, [pdfFiles, companySettings]);


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
                return `Working on file ${processingProgress.current} of ${processingProgress.total}...`;
            }
            return "Stamping your file...";
        }
        return isBatchProcess ? "Stamp All Files & Download (ZIP)" : "Stamp & Download PDF";
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <Header 
                onOpenSettings={() => setIsSettingsOpen(true)} 
                onOpenManual={() => setIsManualOpen(true)}
            />

            {isSettingsOpen && (
                <SettingsModal
                    initialSettings={companySettings}
                    onSave={handleSettingsSave}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}

            {isManualOpen && (
                <UserManualModal
                    onClose={() => setIsManualOpen(false)}
                />
            )}

            {isTermsOpen && (
                <TermsPrivacyModal
                    onClose={() => setIsTermsOpen(false)}
                />
            )}

            <main className="w-full max-w-6xl flex-grow flex flex-col items-center p-4 mt-8 sm:mt-12">
                <div className="w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-12 border border-slate-100">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl relative mb-8 flex items-center gap-3 animate-fade-in" role="alert">
                            <span className="text-xl">⚠️</span>
                            <span className="block sm:inline font-medium">{error}</span>
                        </div>
                    )}
                    
                    {pdfFiles.length === 0 ? (
                        <div className="text-center py-8">
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
                                Stamp Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">PDFs</span> in Seconds
                            </h1>
                            <p className="text-slate-500 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                                Use this free tool to add your company chop and signature. It's secure because everything stays on your computer.
                            </p>
                            <FileUpload onFilesSelect={handleFilesSelect} />
                        </div>
                    ) : (
                        <div>
                            {stampedContentUrl ? (
                                <div className="flex flex-col items-center gap-8 animate-fade-in text-center py-10">
                                   <div className="bg-green-100 p-4 rounded-full">
                                        <div className="text-4xl">🎉</div>
                                   </div>
                                   <div>
                                        <h2 className="text-3xl font-bold text-slate-800 mb-2">You're All Done!</h2>
                                        <p className="text-slate-500">Your stamped file is ready to be saved.</p>
                                   </div>
                                    <a
                                        href={stampedContentUrl}
                                        download={isBatchProcess ? 'stamped-pdfs.zip' : (pdfFiles[0]?.name.replace('.pdf', '-stamped.pdf') || 'stamped.pdf')}
                                        className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white text-lg font-bold py-4 px-10 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 shadow-xl shadow-green-600/30"
                                    >
                                        <DownloadIcon />
                                        {isBatchProcess ? 'Download ZIP File' : 'Download Stamped PDF'}
                                    </a>
                                    <button
                                        onClick={resetState}
                                        className="text-slate-400 hover:text-cyan-600 font-medium transition-colors mt-4"
                                    >
                                        Start Over with New Files
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                                        <button
                                            onClick={resetState}
                                            className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors font-medium"
                                        >
                                            <ArrowLeftIcon />
                                            <span>Back</span>
                                        </button>
                                        
                                        <div className="flex flex-col items-center">
                                            <h2 className="text-2xl font-bold text-slate-800">{isBatchProcess ? "Review Many Files" : "Check & Adjust"}</h2>
                                            <p className="text-xs text-slate-400">Make sure it looks right before you download.</p>
                                        </div>

                                        <div className="w-auto sm:w-28 text-right">
                                             {!isBatchProcess && (
                                                <button 
                                                    onClick={handleSummarize}
                                                    disabled={isSummarizing}
                                                    className="inline-flex items-center gap-2 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-full transition-all duration-200"
                                                    title="Ask AI to read this"
                                                >
                                                   <DocumentTextIcon/>
                                                    <span>{isSummarizing ? 'Reading...' : 'Summarize (AI)'}</span>
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

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start">
                                        {isBatchProcess ? (
                                            <FileQueue files={pdfFiles} onRemoveFile={handleRemoveFile} />
                                        ) : (
                                            <div className="bg-slate-200 rounded-xl p-4 shadow-inner">
                                                <PDFPreview file={pdfFiles[0]} settings={companySettings} options={stampOptions} onStampOptionsChange={setStampOptions} filename={pdfFiles[0].name}/>
                                            </div>
                                        )}
                                        <div className="flex flex-col justify-between h-full gap-8">
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                                <StampOptionsComponent options={stampOptions} onChange={setStampOptions} disabled={isLoading} />
                                            </div>
                                            <button
                                                onClick={processFiles}
                                                disabled={isLoading}
                                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-lg font-bold py-4 px-8 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] shadow-xl shadow-blue-600/30 flex justify-center items-center gap-2"
                                            >
                                                {isLoading && <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"/>}
                                                {getButtonText()}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                 <footer className="mt-12 mb-6 text-sm text-slate-400 flex flex-col items-center gap-3">
                    <p className="font-medium">Powered by <a href="https://afiladesign.com" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-500 hover:underline">afiladesign.com</a></p>
                    <button 
                        onClick={() => setIsTermsOpen(true)}
                        className="text-xs hover:text-slate-600 transition-colors"
                    >
                        Terms & Privacy Policy
                    </button>
                </footer>
            </main>
        </div>
    );
};

export default App;