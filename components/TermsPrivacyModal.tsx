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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Safe & Simple Privacy</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                        <XIcon />
                    </button>
                </div>

                <div className="p-6 text-slate-600 text-sm leading-relaxed space-y-6">
                    
                    <section>
                        <h3 className="font-bold text-lg text-slate-800 mb-2">1. Your Files Stay with You</h3>
                        <p>
                            We do not upload your PDFs to any server. All the "magic" (stamping and signing) happens right here on your own computer/phone browser. It is very secure.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-slate-800 mb-2">2. No Hidden Tricks</h3>
                        <p>
                            We provide this tool "as is". Use it freely for your business. We are not responsible if you make a mistake on your document, so always check the preview!
                        </p>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-slate-800 mb-2">3. About AI</h3>
                        <p>
                            If you use the "Summarize" or "Suggestion" button, we send just the text to Google (Gemini) or OpenAI to get the answer. We don't keep it.
                        </p>
                    </section>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-600/20"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsPrivacyModal;