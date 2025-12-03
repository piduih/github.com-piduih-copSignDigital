
import React, { useEffect } from 'react';
import { XIcon } from './icons/XIcon';

interface TermsPrivacyModalProps {
    onClose: () => void;
}

const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({ onClose }) => {
    
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
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Terms & Privacy</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                        <XIcon />
                    </button>
                </div>

                <div className="p-6 text-slate-600 text-sm leading-relaxed space-y-4">
                    
                    <section>
                        <h3 className="font-bold text-slate-800 mb-2">Terms of Service</h3>
                        <p>
                            This application is provided "as is" without warranty of any kind. You acknowledge that you use this software at your own risk. The developers are not responsible for any damages or data loss resulting from the use of this tool.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-800 mb-2">Privacy Policy</h3>
                        <p>
                            <strong>Local Processing:</strong> All PDF processing (stamping, signing) happens locally within your browser. Your files are NOT uploaded to our servers.
                        </p>
                        <p className="mt-2">
                            <strong>AI Features:</strong> If you use the AI features (Summarization or Text Suggestion), only the necessary text snippets are sent to your chosen AI Provider (Google Gemini, OpenAI, etc.).
                        </p>
                        <p className="mt-2">
                            <strong>Data Storage:</strong> Your settings and API keys are stored locally in your browser's Local Storage for your convenience.
                        </p>
                    </section>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsPrivacyModal;
