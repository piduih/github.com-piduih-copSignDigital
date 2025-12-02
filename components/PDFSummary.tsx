import React, { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { XIcon } from './icons/XIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';

interface PDFSummaryProps {
    summary: string | null;
    isSummarizing: boolean;
    error: string | null;
    onClear: () => void;
}

const PDFSummary: React.FC<PDFSummaryProps> = ({ summary, isSummarizing, error, onClear }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (summary) {
            navigator.clipboard.writeText(summary).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }
    };

    return (
        <div className="relative bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 animate-fade-in">
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-slate-600 font-semibold mb-2">
                    <SparklesIcon/>
                    <h3>AI Summary</h3>
                </div>
                 <div className="flex items-center gap-2">
                    {summary && (
                        <button 
                            onClick={handleCopy} 
                            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 transition-colors"
                            aria-label="Copy summary"
                        >
                           <ClipboardIcon />
                            <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    )}
                    <button onClick={onClear} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close summary">
                        <XIcon/>
                    </button>
                 </div>
            </div>


            {isSummarizing && (
                 <div className="flex items-center gap-3 mt-2">
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-cyan-500 rounded-full animate-spin"></div>
                    <p className="text-slate-500">Generating summary, this may take a moment...</p>
                 </div>
            )}
            {error && (
                <div className="text-red-700 bg-red-100 p-3 rounded-md mt-2">
                    <p><strong>Failed to get summary:</strong> {error}</p>
                </div>
            )}
            {summary && (
                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap mt-2">
                    {summary}
                </div>
            )}
        </div>
    );
};

export default PDFSummary;
