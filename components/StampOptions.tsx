import React, { Fragment } from 'react';
import type { StampOptions, StampPositionPreset, StampPages } from '../types';

interface StampOptionsProps {
    options: StampOptions;
    onChange: React.Dispatch<React.SetStateAction<StampOptions>>;
    disabled: boolean;
}

const StampOptionsComponent: React.FC<StampOptionsProps> = ({ options, onChange, disabled }) => {
    
    const handleOptionChange = <K extends keyof StampOptions>(key: K, value: StampOptions[K]) => {
        onChange(prev => ({ ...prev, [key]: value }));
    };

    const handlePositionChange = (preset: StampPositionPreset) => {
        onChange(prev => {
            const newPosition = { ...prev.position, preset };
            if (preset === 'custom') {
                if (newPosition.x === undefined || newPosition.y === undefined) {
                    newPosition.x = 0.1; 
                    newPosition.y = 0.1;
                }
            }
            return { ...prev, position: newPosition };
        });
    };

    const inputClass = "w-full bg-slate-100 border border-slate-300 rounded-md px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:bg-slate-200 disabled:cursor-not-allowed";
    const labelClass = "block text-sm font-medium text-slate-600 mb-1";

    const ToggleSwitch = ({ id, checked, label }: { id: keyof StampOptions, checked: boolean, label: string }) => (
        <label htmlFor={id.toString()} className={labelClass + " flex justify-between items-center cursor-pointer"}>
            <span>{label}</span>
            <div className="relative">
                <input 
                    type="checkbox"
                    id={id.toString()}
                    checked={checked}
                    onChange={(e) => handleOptionChange(id, e.target.checked as any)}
                    className="sr-only peer"
                    disabled={disabled}
                />
                <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </div>
        </label>
    );

    const RangeSlider = ({ id, value, label, min, max, step, unit }: { id: keyof StampOptions, value: number, label: string, min: number, max: number, step: number, unit?: string }) => (
         <div>
            <label htmlFor={id.toString()} className={labelClass + " flex justify-between"}>
                <span>{label}</span>
                <span className="text-slate-500">{value}{unit}</span>
            </label>
            <input
                type="range"
                id={id.toString()}
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(e) => handleOptionChange(id, parseFloat(e.target.value) as any)}
                disabled={disabled}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
            />
        </div>
    );

    return (
        <div className="w-full max-w-sm space-y-6">
            <h3 className="text-xl font-semibold text-slate-700 border-b border-slate-200 pb-2">Stamp Options</h3>
            
            <fieldset className="space-y-4">
                <legend className="text-base font-semibold text-slate-600">Layout</legend>
                 <div>
                    <label htmlFor="position" className={labelClass}>Position</label>
                    <select 
                        id="position" 
                        value={options.position.preset}
                        onChange={(e) => handlePositionChange(e.target.value as StampPositionPreset)}
                        className={inputClass}
                        disabled={disabled}
                    >
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="custom">Custom (Draggable)</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Alignment</label>
                    <div className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 border border-slate-300 p-1">
                        {['left', 'center', 'right'].map(align => (
                            <button 
                                key={align}
                                onClick={() => handleOptionChange('alignment', align as StampOptions['alignment'])}
                                disabled={disabled}
                                className={`py-1.5 px-2 rounded-md text-sm transition ${options.alignment === align ? 'bg-white shadow-sm text-cyan-600 font-semibold' : 'hover:bg-slate-200 text-slate-600'}`}
                                aria-pressed={options.alignment === align}
                            >
                                {align.charAt(0).toUpperCase() + align.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </fieldset>

            <fieldset className="space-y-4">
                <legend className="text-base font-semibold text-slate-600">Appearance</legend>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="fontSize" className={labelClass}>Font Size</label>
                        <input type="number" id="fontSize" value={options.fontSize} onChange={(e) => handleOptionChange('fontSize', parseInt(e.target.value, 10))} className={inputClass} min="6" max="24" disabled={disabled}/>
                    </div>
                    <div>
                         <label htmlFor="color" className={labelClass}>Color</label>
                         <div className="relative h-10">
                            <input type="color" id="color" value={options.color} onChange={(e) => handleOptionChange('color', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" disabled={disabled}/>
                             <div className={inputClass + " flex items-center gap-2 pointer-events-none"}>
                                <div className="w-5 h-5 rounded border border-slate-400" style={{ backgroundColor: options.color }}></div>
                                <span className="font-mono text-sm">{options.color.toUpperCase()}</span>
                            </div>
                         </div>
                    </div>
                </div>
                <RangeSlider id="opacity" label="Opacity" value={options.opacity} min={0.1} max={1} step={0.1} />
            </fieldset>

             <fieldset className="space-y-4">
                 <legend className="text-base font-semibold text-slate-600">Pages</legend>
                 <div>
                    <div className="grid grid-cols-4 gap-1 rounded-md bg-slate-100 border border-slate-300 p-1">
                         {(['first', 'last', 'all', 'custom'] as StampPages[]).map(pageOpt => (
                             <button 
                                key={pageOpt}
                                onClick={() => handleOptionChange('pages', pageOpt)}
                                disabled={disabled}
                                className={`py-1.5 px-1 rounded-md text-sm transition ${options.pages === pageOpt ? 'bg-white shadow-sm text-cyan-600 font-semibold' : 'hover:bg-slate-200 text-slate-600'}`}
                                aria-pressed={options.pages === pageOpt}
                            >
                                {pageOpt === 'first' ? 'First' : pageOpt === 'last' ? 'Last' : pageOpt === 'all' ? 'All' : 'Cust.'}
                            </button>
                         ))}
                    </div>
                </div>
                {options.pages === 'custom' && (
                    <div className="pl-4 pt-2 border-l-2 border-slate-200 animate-fade-in">
                        <label htmlFor="pageRange" className={labelClass}>Custom Page Range</label>
                        <input
                            type="text"
                            id="pageRange"
                            value={options.pageRange}
                            onChange={(e) => handleOptionChange('pageRange', e.target.value)}
                            className={inputClass}
                            disabled={disabled}
                            placeholder="e.g., 1-3, 5, 8-"
                        />
                         <p className="text-xs text-slate-500 mt-1">Use commas to separate, and hyphens for ranges.</p>
                    </div>
                )}
            </fieldset>

            <fieldset className="space-y-3">
                <legend className="text-base font-semibold text-slate-600">Content</legend>
                <ToggleSwitch id="includeLogo" checked={options.includeLogo} label="Include Logo" />
                {options.includeLogo && <div className="pl-4 pt-2 border-l-2 border-slate-200 animate-fade-in"><RangeSlider id="logoSize" label="Logo Size" value={options.logoSize} min={20} max={80} step={1} unit="pt" /></div>}
                
                <ToggleSwitch id="includeSignature" checked={options.includeSignature} label="Include Signature" />
                {options.includeSignature && <div className="pl-4 pt-2 border-l-2 border-slate-200 animate-fade-in"><RangeSlider id="signatureSize" label="Signature Size" value={options.signatureSize} min={15} max={60} step={1} unit="pt"/></div>}

                <ToggleSwitch id="includeDate" checked={options.includeDate} label="Include Current Date" />
                <ToggleSwitch id="includeFilename" checked={options.includeFilename} label="Include Filename" />
                <ToggleSwitch id="includeQRCode" checked={options.includeQRCode} label="Include QR Code" />

                {options.includeQRCode && (
                    <div className="pl-4 pt-2 border-l-2 border-slate-200 animate-fade-in">
                        <label htmlFor="qrCodeData" className={labelClass}>QR Code URL or Text</label>
                        <input
                            type="text"
                            id="qrCodeData"
                            value={options.qrCodeData}
                            onChange={(e) => handleOptionChange('qrCodeData', e.target.value)}
                            className={inputClass}
                            disabled={disabled}
                            placeholder="https://example.com"
                        />
                    </div>
                )}
            </fieldset>

        </div>
    );
};

export default StampOptionsComponent;