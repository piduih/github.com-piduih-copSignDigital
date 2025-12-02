import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { CompanySettings, StampOptions } from '../types';

declare const pdfjsLib: any;
declare const QRious: any;

interface PDFPreviewProps {
    file: File;
    settings: CompanySettings;
    options: StampOptions;
    onStampOptionsChange: React.Dispatch<React.SetStateAction<StampOptions>>;
    filename?: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ file, settings, options, onStampOptionsChange, filename }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null); 
    
    // Refs for individual elements
    const mainStampRef = useRef<HTMLDivElement>(null);
    const signatureRef = useRef<HTMLDivElement>(null);
    
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canvasScale, setCanvasScale] = useState(1);
    const [wrapperDimensions, setWrapperDimensions] = useState({ width: 0, height: 0 });
    
    // Drag state
    const [dragTarget, setDragTarget] = useState<'main' | 'signature' | null>(null);
    const dragInfo = useRef({ offsetX: 0, offsetY: 0 });

    useEffect(() => {
        const renderPdf = async () => {
            if (!file) return;
            setIsLoading(true);
            setError(null);
            try {
                if (typeof pdfjsLib === 'undefined') {
                    setError("PDF library not loaded.");
                    setIsLoading(false);
                    return;
                }
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                
                let pageNumber = 1;
                if (options.pages === 'last') {
                    pageNumber = pdf.numPages;
                }

                const page = await pdf.getPage(pageNumber);
                
                const canvas = canvasRef.current;
                const container = containerRef.current;

                if (!canvas || !container) return;

                // Determine scale based on container width
                const desiredWidth = container.clientWidth - 4; // Padding
                const viewport = page.getViewport({ scale: 1 });
                const scale = desiredWidth / viewport.width;
                setCanvasScale(scale);
                
                const scaledViewport = page.getViewport({ scale });

                const context = canvas.getContext('2d');
                if (!context) return;

                canvas.height = scaledViewport.height;
                canvas.width = scaledViewport.width;
                
                setWrapperDimensions({ width: scaledViewport.width, height: scaledViewport.height });
                
                const renderContext = {
                    canvasContext: context,
                    viewport: scaledViewport
                };
                await page.render(renderContext).promise;
                setIsLoading(false);

            } catch (e) {
                console.error("Failed to render PDF preview:", e);
                setError("Could not display PDF preview.");
                setIsLoading(false);
            }
        };

        renderPdf();
    }, [file, options.pages]);
    
    useEffect(() => {
         const handleResize = () => {
             // Logic simplified
         };
         window.addEventListener('resize', handleResize);
         return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    useEffect(() => {
        if (options.includeQRCode && qrCanvasRef.current && canvasScale > 0 && typeof QRious !== 'undefined') {
            try {
                const size = 60 * canvasScale;
                qrCanvasRef.current.width = size;
                qrCanvasRef.current.height = size;
                new QRious({
                    element: qrCanvasRef.current,
                    value: options.qrCodeData || 'https://aistudio.google.com/',
                    size: size,
                    background: 'white',
                    foreground: 'black',
                    level: 'H',
                });
            } catch (e) {
                console.error("Failed to render QR preview", e);
            }
        }
    }, [options.includeQRCode, options.qrCodeData, canvasScale]);


    const addressLines = (settings.address || '').split('\n').map(l => l.trim()).filter(Boolean);

    const stampLines = [
        { text: settings.name, weight: 'bold', size: options.fontSize },
        { text: settings.regNo, weight: 'normal', size: options.fontSize - 1 },
        ...addressLines.map(l => ({ text: l, weight: 'normal', size: options.fontSize - 1 })),
        { text: settings.phone, weight: 'normal', size: options.fontSize - 1 },
    ].filter(line => line.text && line.size > 0);

    const dynamicLines = [];
     if (options.includeDate) {
        dynamicLines.push({ text: new Date().toLocaleDateString(), weight: 'normal', size: options.fontSize - 2 });
    }
    if (options.includeFilename && filename) {
        dynamicLines.push({ text: filename, weight: 'normal', size: options.fontSize - 2 });
    }
    
    const isCustomMode = options.position.preset === 'custom';

    const positionClasses: Record<string, string> = {
        'bottom-left': 'bottom-6 left-6',
        'bottom-right': 'bottom-6 right-6',
        'top-left': 'top-6 left-6',
        'top-right': 'top-6 right-6',
        'custom': ''
    };

    const alignmentClasses: Record<string, string> = {
        left: 'items-start text-left',
        center: 'items-center text-center',
        right: 'items-end text-right',
    };

    // Style for the Main Block (Logo, Text, QR)
    const mainBlockStyle = useMemo((): React.CSSProperties => {
        const style: React.CSSProperties = { 
            color: options.color,
            opacity: options.opacity,
            gap: `${5 * canvasScale}px`,
        };
        
        if (isCustomMode) {
            style.position = 'absolute';
            style.top = `${(options.position.y ?? 0) * 100}%`;
            style.left = `${(options.position.x ?? 0) * 100}%`;
            style.transform = 'none';
            style.touchAction = 'none'; 
            style.zIndex = 10;
        }
        return style;
    }, [options.color, options.opacity, options.position, canvasScale, isCustomMode]);

    // Style for Independent Signature (Custom Mode Only)
    const signatureStyle = useMemo((): React.CSSProperties => {
        const style: React.CSSProperties = { 
            color: options.color,
            opacity: options.opacity,
            position: 'absolute',
            top: `${(options.signaturePosition?.y ?? 0) * 100}%`,
            left: `${(options.signaturePosition?.x ?? 0) * 100}%`,
            transform: 'none',
            touchAction: 'none',
            zIndex: 20 // Signature slightly higher to float over text if needed
        };
        return style;
    }, [options.color, options.opacity, options.signaturePosition, isCustomMode]);

    
    // --- Drag Handlers ---

    const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent, target: 'main' | 'signature') => {
        if (!isCustomMode) return;
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            // Prevent scrolling on touch
            // e.preventDefault(); // Sometimes needed, but let's rely on touch-action: none
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
            e.preventDefault();
        }

        const elementRef = target === 'main' ? mainStampRef : signatureRef;
        if (elementRef.current) {
            const rect = elementRef.current.getBoundingClientRect();
            dragInfo.current = {
                offsetX: clientX - rect.left,
                offsetY: clientY - rect.top,
            };
            setDragTarget(target);
        }
    }, [isCustomMode]);

    const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!dragTarget || !wrapperRef.current) return;
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            if(e.cancelable) e.preventDefault();
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        const containerRect = wrapperRef.current.getBoundingClientRect();
        const elementRef = dragTarget === 'main' ? mainStampRef : signatureRef;
        if (!elementRef.current) return;
        
        const rect = elementRef.current.getBoundingClientRect();

        let newX = clientX - containerRect.left - dragInfo.current.offsetX;
        let newY = clientY - containerRect.top - dragInfo.current.offsetY;

        // Constraint within boundaries
        newX = Math.max(0, Math.min(newX, containerRect.width - rect.width));
        newY = Math.max(0, Math.min(newY, containerRect.height - rect.height));

        const relativeX = newX / containerRect.width;
        const relativeY = newY / containerRect.height;
        
        onStampOptionsChange(prevOptions => {
            if (dragTarget === 'main') {
                 return {
                    ...prevOptions,
                    position: { ...prevOptions.position, preset: 'custom', x: relativeX, y: relativeY }
                };
            } else {
                 return {
                    ...prevOptions,
                    signaturePosition: { x: relativeX, y: relativeY }
                };
            }
        });

    }, [dragTarget, onStampOptionsChange]);

    const endDrag = useCallback(() => {
        setDragTarget(null);
    }, []);

    useEffect(() => {
        if (dragTarget) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', endDrag);
            window.addEventListener('touchmove', handleMove, { passive: false });
            window.addEventListener('touchend', endDrag);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', endDrag);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', endDrag);
        };
    }, [dragTarget, handleMove, endDrag]);

    const renderTextLine = (line: {text: string, size: number, weight: string}, index: number) => (
         <span 
            key={index} 
            style={{ 
                fontSize: `${line.size * canvasScale}px`,
                fontWeight: line.weight as React.CSSProperties['fontWeight'], 
                lineHeight: '1.2', 
                whiteSpace: 'nowrap'
            }}
        >
            {line.text}
        </span>
    );

    const SignatureContent = () => (
         options.includeSignature ? (
            settings.signatureType === 'image' && settings.signature ? (
                <img 
                    src={settings.signature} 
                    alt="Signature"
                    className="object-contain"
                    draggable={false}
                    style={{
                        height: `${options.signatureSize * canvasScale}px`,
                        maxWidth: '180px'
                    }}
                />
            ) : (
                settings.signatureType === 'text' && settings.signatureText ? (
                     <span
                        style={{
                            fontFamily: settings.signatureFont || 'cursive',
                            fontSize: `${options.signatureSize * canvasScale}px`,
                            lineHeight: '1.2'
                        }}
                     >
                        {settings.signatureText}
                     </span>
                ) : null
            )
        ) : null
    );

    return (
        <div ref={containerRef} className="w-full max-w-lg mx-auto bg-slate-200 shadow-inner rounded-lg p-2 overflow-hidden flex justify-center">
            {isLoading && <div className="aspect-[8.5/11] w-full flex items-center justify-center animate-pulse"><p className="text-slate-500">Loading Preview...</p></div>}
            {error && <div className="aspect-[8.5/11] w-full flex items-center justify-center bg-red-100 text-red-700 rounded"><p>{error}</p></div>}
            
            <div 
                ref={wrapperRef}
                className="relative bg-white shadow-lg"
                style={{ 
                    width: wrapperDimensions.width > 0 ? wrapperDimensions.width : 'auto', 
                    height: wrapperDimensions.height > 0 ? wrapperDimensions.height : 'auto',
                    display: isLoading || error ? 'none' : 'block'
                }}
            >
                <canvas ref={canvasRef} className="block w-full h-full" />
                
                {!isLoading && !error && (
                    <>
                        {/* Main Stamp Block (Company Info + Logo + QR) */}
                        <div
                            ref={mainStampRef}
                            onMouseDown={(e) => startDrag(e, 'main')}
                            onTouchStart={(e) => startDrag(e, 'main')}
                            className={`absolute flex flex-col pointer-events-auto select-none ${!dragTarget ? 'transition-all duration-200' : ''} ${!isCustomMode ? positionClasses[options.position.preset] : ''} ${alignmentClasses[options.alignment]} ${isCustomMode ? (dragTarget === 'main' ? 'cursor-grabbing ring-2 ring-cyan-400 ring-offset-2 rounded' : 'cursor-grab hover:ring-1 hover:ring-cyan-300 hover:ring-offset-1 hover:rounded') : 'cursor-default'}`}
                            style={mainBlockStyle}
                        >
                            {options.includeLogo && settings.logo && (
                                <img 
                                    src={settings.logo} 
                                    alt="Company Logo"
                                    className="object-contain"
                                    draggable={false}
                                    style={{
                                        height: `${options.logoSize * canvasScale}px`,
                                        maxWidth: '150px'
                                    }}
                                />
                            )}
                            
                            {/* In Preset Mode, Signature is part of this block. In Custom Mode, it's separate. */}
                            {!isCustomMode && <SignatureContent />}

                            <div className="flex flex-col">{stampLines.map(renderTextLine)}</div>

                            {dynamicLines.length > 0 && (
                                <div className="flex flex-col opacity-80 mt-1">{dynamicLines.map(renderTextLine)}</div>
                            )}
                            
                            {options.includeQRCode && (
                                <canvas 
                                    ref={qrCanvasRef} 
                                    style={{ width: 60 * canvasScale, height: 60 * canvasScale }}
                                    className="bg-white border border-slate-300 rounded-sm"
                                />
                            )}
                        </div>

                        {/* Separate Signature Block (Only visible in Custom Mode) */}
                        {isCustomMode && options.includeSignature && (
                            <div
                                ref={signatureRef}
                                onMouseDown={(e) => startDrag(e, 'signature')}
                                onTouchStart={(e) => startDrag(e, 'signature')}
                                className={`flex items-center justify-center pointer-events-auto select-none ${!dragTarget ? 'transition-all duration-200' : ''} ${dragTarget === 'signature' ? 'cursor-grabbing ring-2 ring-cyan-400 ring-offset-2 rounded' : 'cursor-grab hover:ring-1 hover:ring-cyan-300 hover:ring-offset-1 hover:rounded'}`}
                                style={signatureStyle}
                            >
                                <SignatureContent />
                            </div>
                        )}
                    </>
                )}
            </div>
            {options.pages === 'last' && !isLoading && (
                <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded z-10 pointer-events-none">
                    Last Page
                </div>
            )}
        </div>
    );
};

export default PDFPreview;