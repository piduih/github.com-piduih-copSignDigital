import React from 'react';
import { CogIcon } from './icons/CogIcon';

interface HeaderProps {
    onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
    return (
        <header className="w-full max-w-4xl flex justify-between items-center py-4 px-2">
            <div className="text-xl font-bold tracking-wider">
                <span className="text-cyan-500">PDF</span>Stamper
            </div>
            <button
                onClick={onOpenSettings}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 font-semibold py-2 px-4 border border-slate-300 rounded-lg shadow-sm transition-all duration-200"
                aria-label="Open Settings"
            >
                <CogIcon />
                <span className="hidden sm:inline">Settings</span>
            </button>
        </header>
    );
};

export default Header;