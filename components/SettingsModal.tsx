import React, { useState, useEffect } from 'react';
import type { CompanySettings } from '../types';
import { getStampSuggestion } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';


interface SettingsModalProps {
    initialSettings: CompanySettings;
    onSave: (settings: CompanySettings) => void;
    onClose: () => void;
}

const SIGNATURE_FONTS = [
    { name: 'Great Vibes', label: 'Great Vibes' },
    { name: 'Dancing Script', label: 'Dancing' },
    { name: 'Pacifico', label: 'Pacifico' },
    { name: 'Alex Brush', label: 'Alex Brush' },
    { name: 'Reenie Beanie', label: 'Reenie' },
    { name: 'Sacramento', label: 'Sacramento' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ initialSettings, onSave, onClose }) => {
    const [settings, setSettings] = useState<CompanySettings>(initialSettings);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSignatureTypeChange = (type: 'image' | 'text') => {
        setSettings(prev => ({ ...prev, signatureType: type }));
    };

     const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setSettings(prev => ({ ...prev, logo: undefined }));
    };

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings(prev => ({ ...prev, signature: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeSignature = () => {
        setSettings(prev => ({ ...prev, signature: undefined }));
    };


    const handleGenerateSuggestion = async () => {
        setIsSuggesting(true);
        setSuggestionError(null);
        try {
            const suggestion = await getStampSuggestion(settings.name, settings.regNo, settings.address);
            if (suggestion) {
               setSettings(prev => ({...prev, ...suggestion}));
            }
        } catch (e) {
            const error = e instanceof Error ? e.message : 'Failed to get suggestion.';
            setSuggestionError(error);
        } finally {
            setIsSuggesting(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(settings);
    };

    const inputClass = "w-full bg-slate-100 border border-slate-300 rounded-md px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition";
    const fileInputClass = "block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4 text-slate-900">Company Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Company Name</label>
                                <input type="text" id="name" name="name" value={settings.name} onChange={handleChange} className={inputClass} placeholder="e.g. Example Company Sdn. Bhd." required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="regNo" className="block text-sm font-medium text-slate-600 mb-1">Registration No.</label>
                                    <input type="text" id="regNo" name="regNo" value={settings.regNo} onChange={handleChange} className={inputClass} placeholder="e.g. 202401001234 (12345-X)" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-slate-600 mb-1">Phone Number</label>
                                    <input type="text" id="phone" name="phone" value={settings.phone} onChange={handleChange} className={inputClass} placeholder="e.g. +60 3-1234 5678" />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="address" className="block text-sm font-medium text-slate-600 mb-1">Address</label>
                                <textarea id="address" name="address" value={settings.address} onChange={handleChange} className={inputClass} rows={3} placeholder="Enter company address"></textarea>
                            </div>
                            
                            <div>
                                <label htmlFor="logo" className="block text-sm font-medium text-slate-600 mb-1">Company Logo</label>
                                 <div className="flex items-center gap-4">
                                    {settings.logo && (
                                        <div className="relative group">
                                            <img src={settings.logo} alt="Logo Preview" className="h-16 w-16 object-contain border rounded-md p-1 bg-white" />
                                            <button 
                                                type="button"
                                                onClick={removeLogo}
                                                className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Remove logo"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    )}
                                    <input type="file" id="logo" name="logo" onChange={handleLogoChange} accept="image/png, image/jpeg, image/jpg" className={fileInputClass}/>
                                </div>
                            </div>
                            
                            {/* Signature Section */}
                            <div className="border-t border-slate-200 pt-4">
                                <label className="block text-base font-medium text-slate-700 mb-2">Signature</label>
                                
                                <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSignatureTypeChange('text')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${settings.signatureType === 'text' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Type Signature
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSignatureTypeChange('image')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${settings.signatureType === 'image' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Upload Image
                                    </button>
                                </div>

                                {settings.signatureType === 'image' ? (
                                    <div className="animate-fade-in">
                                        <div className="flex items-center gap-4">
                                            {settings.signature && (
                                                <div className="relative group">
                                                    <img src={settings.signature} alt="Signature Preview" className="h-16 w-32 object-contain border rounded-md p-1 bg-white" />
                                                    <button 
                                                        type="button"
                                                        onClick={removeSignature}
                                                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        aria-label="Remove signature"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            )}
                                            <input type="file" id="signature" name="signature" onChange={handleSignatureChange} accept="image/png, image/jpeg, image/jpg" className={fileInputClass}/>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">For best results, use a PNG with a transparent background.</p>
                                    </div>
                                ) : (
                                    <div className="animate-fade-in space-y-3">
                                        <div>
                                            <label htmlFor="signatureText" className="block text-sm font-medium text-slate-600 mb-1">Name to Sign</label>
                                            <input 
                                                type="text" 
                                                id="signatureText" 
                                                name="signatureText" 
                                                value={settings.signatureText || ''} 
                                                onChange={handleChange} 
                                                className={inputClass} 
                                                placeholder="e.g. Director Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">Choose Font</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {SIGNATURE_FONTS.map((font) => (
                                                    <button
                                                        key={font.name}
                                                        type="button"
                                                        onClick={() => setSettings(prev => ({ ...prev, signatureFont: font.name }))}
                                                        className={`border rounded-md px-3 py-2 text-left hover:bg-slate-50 transition-all ${settings.signatureFont === font.name ? 'border-cyan-500 ring-1 ring-cyan-500 bg-cyan-50' : 'border-slate-200'}`}
                                                    >
                                                        <span className="text-2xl text-slate-800" style={{ fontFamily: font.name }}>
                                                            {settings.signatureText || 'Signature'}
                                                        </span>
                                                        <span className="block text-xs text-slate-400 mt-1">{font.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                         <div className="mt-6">
                            <button
                                type="button"
                                onClick={handleGenerateSuggestion}
                                disabled={isSuggesting}
                                className="w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:cursor-wait text-slate-700 font-semibold py-2 px-4 border border-slate-300 rounded-md transition-all duration-200"
                            >
                                <SparklesIcon />
                                {isSuggesting ? 'Generating...' : 'Get AI Suggestion for Stamp Text'}
                            </button>
                            {suggestionError && <p className="text-xs text-red-600 mt-2">{suggestionError}</p>}
                        </div>
                    </div>

                    <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end gap-3 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-slate-700 hover:bg-slate-200 transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-500 transition">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsModal;