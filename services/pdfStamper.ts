import type { CompanySettings, StampOptions } from '../types';

declare const PDFLib: any;
declare const QRious: any;

// Helper to convert hex to RGB for pdf-lib
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16) / 255,
              g: parseInt(result[2], 16) / 255,
              b: parseInt(result[3], 16) / 255,
          }
        : { r: 0, g: 0, b: 0 };
};

// Helper to generate QR code as a base64 Data URI
const generateQrCode = (data: string): string => {
    const qr = new QRious({
        value: data,
        size: 200, // High resolution for embedding
    });
    return qr.toDataURL();
};

const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
    const indices = new Set<number>();
    if (!rangeStr) return [];

    const parts = rangeStr.split(',');
    for (const part of parts) {
        const trimmedPart = part.trim();
        if (trimmedPart.includes('-')) {
            const [startStr, endStr] = trimmedPart.split('-');
            const start = parseInt(startStr.trim(), 10);
            const end = endStr.trim() ? parseInt(endStr.trim(), 10) : totalPages;
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= totalPages) {
                        indices.add(i - 1); // 0-indexed
                    }
                }
            }
        } else {
            const pageNum = parseInt(trimmedPart, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                indices.add(pageNum - 1); // 0-indexed
            }
        }
    }
    return Array.from(indices).sort((a, b) => a - b);
};

// Helper to convert text to high-res base64 image (Rasterize font)
const textToImage = async (text: string, font: string, size: number, color: string): Promise<string> => {
    const fontSpec = `${size}px "${font}"`;
    // Force load the font to ensure it renders correctly on canvas
    try {
        await document.fonts.load(fontSpec);
    } catch (e) {
        console.warn("Font load failed, falling back", e);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas not supported");

    const scale = 3; // 3x resolution for crisp PDF rendering
    const fontSize = size * scale;
    const fontSpecScaled = `${fontSize}px "${font}"`;

    ctx.font = fontSpecScaled;
    const metrics = ctx.measureText(text);
    
    // Use consistent padding logic to match Preview
    const hPadding = fontSize * 0.5; 
    const vHeight = fontSize * 2.0; 

    canvas.width = Math.ceil(metrics.width + hPadding);
    canvas.height = Math.ceil(vHeight);

    // Context resets on resize, restore settings
    ctx.font = fontSpecScaled;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    // Draw centered
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    return canvas.toDataURL('image/png');
};

export const stampPdf = async (
    pdfBytes: ArrayBuffer,
    settings: CompanySettings,
    options: StampOptions,
    filename?: string,
): Promise<Uint8Array> => {
    const { PDFDocument, rgb, StandardFonts, degrees } = PDFLib;

    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    if (typeof window !== 'undefined' && (window as any).fontkit) {
        pdfDoc.registerFontkit((window as any).fontkit);
    }

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pages = pdfDoc.getPages();
    
    let pagesToStampIndices: number[];
    if (options.pages === 'first') {
        pagesToStampIndices = pages.length > 0 ? [0] : [];
    } else if (options.pages === 'last') {
        pagesToStampIndices = pages.length > 0 ? [pages.length - 1] : [];
    } else if (options.pages === 'all') {
        pagesToStampIndices = pages.map((_, i) => i);
    } else { // custom
        pagesToStampIndices = parsePageRange(options.pageRange, pages.length);
    }
    const pagesToStamp = pagesToStampIndices.map(i => pages[i]).filter(Boolean);

    const color = hexToRgb(options.color);
    const textColor = rgb(color.r, color.g, color.b);

    const margin = 36; // Points from edge
    const lineSpacing = 1.2;
    const gap = 5; // Standard gap between elements (Flexbox-like)
    const qrCodeSize = 60;
    const isCustomPosition = options.position.preset === 'custom';
    
    // Prepare content lines
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

    // Calculate Metrics for "Main Block"
    let maxTextWidth = 0;
    let textGroupHeight = 0;
    
    // Measure Texts
    const measureLines = (lines: typeof stampLines) => {
        let h = 0;
        lines.forEach(line => {
            const font = line.weight === 'bold' ? helveticaBoldFont : helveticaFont;
            const w = font.widthOfTextAtSize(line.text, line.size);
            if (w > maxTextWidth) maxTextWidth = w;
            // Line height model: fontSize * 1.2
            h += line.size * lineSpacing;
        });
        return h;
    };
    
    textGroupHeight += measureLines(stampLines);
    if (dynamicLines.length > 0) {
        textGroupHeight += measureLines(dynamicLines); 
        // Note: we don't add extra gap here in measure, gap is added during stacking
    }

    // Load Images
    let logoImage, logoDims;
    if (options.includeLogo && settings.logo) {
        const logoBytes = await fetch(settings.logo).then(res => res.arrayBuffer());
        logoImage = await pdfDoc.embedPng(logoBytes);
        logoDims = logoImage.scale(options.logoSize / logoImage.height);
    }
    
    let qrImage, qrDims;
    if (options.includeQRCode) {
        const qrBase64 = generateQrCode(options.qrCodeData);
        const qrBytes = await fetch(qrBase64).then(res => res.arrayBuffer());
        qrImage = await pdfDoc.embedPng(qrBytes);
        qrDims = { width: qrCodeSize, height: qrCodeSize };
    }

    // Signature
    let signatureImage, signatureDims;
    if (options.includeSignature) {
        try {
            let sigBytes: ArrayBuffer | null = null;
            let isTextImage = false;
            if (settings.signatureType === 'image' && settings.signature) {
                sigBytes = await fetch(settings.signature).then(res => res.arrayBuffer());
            } else if (settings.signatureType === 'text' && settings.signatureText) {
                isTextImage = true;
                const dataUrl = await textToImage(
                    settings.signatureText, 
                    settings.signatureFont || 'cursive', 
                    options.signatureSize, 
                    options.color
                );
                sigBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
            }

            if (sigBytes) {
                signatureImage = await pdfDoc.embedPng(sigBytes);
                // Text image includes padding (2x height), so we scale differently to match font size visual
                if (isTextImage) {
                    signatureDims = signatureImage.scale((options.signatureSize * 2.0) / signatureImage.height);
                } else {
                    signatureDims = signatureImage.scale(options.signatureSize / signatureImage.height);
                }
            }
        } catch (e) {
            console.error("Signature load error", e);
        }
    }

    // Determine Main Block Width
    const mainBlockWidth = Math.max(
        maxTextWidth,
        logoDims ? logoDims.width : 0,
        (!isCustomPosition && signatureDims) ? signatureDims.width : 0,
        options.includeQRCode ? qrCodeSize : 0
    );

    // Calculate Total Height for Preset positioning
    // Order in Preset: Logo -> Signature -> Text -> QR
    let presetTotalHeight = 0;
    if (logoDims) presetTotalHeight += logoDims.height + gap;
    if (!isCustomPosition && signatureDims) presetTotalHeight += signatureDims.height + gap;
    presetTotalHeight += textGroupHeight; // Text internal spacing already accounted
    if (dynamicLines.length > 0) presetTotalHeight += gap; // Gap before dynamic lines if they exist? Actually logic above measured height.
    // Let's refine text height calculation:
    // Text block is contiguous.
    if (qrDims) presetTotalHeight += gap + qrDims.height;

    // Helper to calculate X offset for alignment within the block width
    const getAlignX = (itemW: number) => {
        if (options.alignment === 'center') return (mainBlockWidth - itemW) / 2;
        if (options.alignment === 'right') return mainBlockWidth - itemW;
        return 0;
    };

    for (const page of pagesToStamp) {
        const { width, height } = page.getSize();
        const rotation = page.getRotation().angle % 360;
        
        // Define "Visual" dimensions based on rotation
        // If rotated 90 or 270, the "Visual Width" is the PDF Height.
        const isRotatedSides = rotation === 90 || rotation === 270 || rotation === -90;
        const visualPageWidth = isRotatedSides ? height : width;
        const visualPageHeight = isRotatedSides ? width : height;

        // Function to map a "Visual Point" (Top-Left origin) to "PDF Point" (Bottom-Left origin)
        // AND handle the Anchor point adjustment for drawing.
        // visualX, visualY: Coordinates in pixels from Top-Left of the *Visual* page.
        // itemW, itemH: Dimensions of the item to be drawn.
        // Return: { x, y, rotate } for pdf-lib draw calls.
        const mapToPdfCoords = (vX: number, vY: number, itemW: number, itemH: number) => {
            let pX = 0, pY = 0;
            const drawRotation = degrees(rotation); // Rotate content to match page orientation

            if (rotation === 0) {
                // Standard: Visual Top-Left -> PDF Top-Left (0, H)
                // Draw Anchor: Bottom-Left of item
                pX = vX;
                pY = height - vY - itemH;
            } else if (rotation === 90) {
                // 90 CW: Visual Top-Left -> PDF Bottom-Left (0, 0)
                // Visual Right (+X) -> PDF Up (+Y)
                // Visual Down (+Y) -> PDF Right (+X)
                // Item needs to flow Visual Right. Rot 90 flows +Y. Correct.
                // Draw Anchor logic for Rot 90:
                // Text/Image extends +Y (Visual Right) and -X (Visual Up) relative to baseline/origin?
                // Actually, Rot 90 draws from Anchor towards +Y. Up is -X.
                // We want Visual Top-Left of item at (vX, vY).
                // Visual Bottom of item is vY + itemH.
                // Anchor should be at Visual Bottom-Left of item box.
                // Visual Bottom-Left corresponds to PDF Point:
                // PDF X = Visual Y (Bottom) = vY + itemH.
                // PDF Y = Visual X (Left) = vX.
                pX = vY + itemH;
                pY = vX;
            } else if (rotation === 180) {
                // 180 CW: Visual Top-Left -> PDF Bottom-Right (W, 0) (Wait, Top-Right W,H? No. 180 flips everything)
                // Visual Top-Left is PDF (W, 0)? No.
                // Rotation 180: (0,0) -> (W, H). (W,H) -> (0,0).
                // Visual Top-Left (0,0) is PDF (W, 0).
                // Visual X (+X) -> PDF Left (-X).
                // Visual Y (+Y) -> PDF Up (+Y)? No.
                // Let's stick to standard map:
                // Visual X -> -X. Visual Y -> -Y.
                // Visual Top-Left (0,0) -> PDF (W, H) ? No. 
                // Top-Left of paper is (0, H). Rot 180 -> (W, 0).
                // So Visual Top-Left is (W, 0)? No, visually top-left is what was Bottom-Right.
                // Bottom-Right is (W, 0). So yes.
                // Visual X -> PDF -X. Visual Y -> PDF +Y.
                // pX = width - vX.
                // pY = vY.
                // Anchor for Rot 180:
                // Flows -X. Up is -Y.
                // We want Visual Top-Left at (vX, vY).
                // Anchor needs to be Visual Top-Right? 
                // Let's assume Rot 180 draws from Anchor towards Left. Up is Down.
                // Anchor point should be Visual Top-Left?
                // pX = width - vX.
                // pY = vY.
                // Let's try: pX = width - vX - itemW. pY = vY + itemH. 
                // Simplify: 180 usually means coordinate system is flipped.
                // Correct mapping for Rot 180:
                // pX = width - vX;
                // pY = vY; 
                // Wait, PDF Y is 0 at bottom. Visual Y is 0 at top.
                // Rot 180: Visual Top is PDF Bottom.
                // Visual Y+ (Down) -> PDF Y+ (Up). Correct.
                // Anchor:
                // We want item to be at visual box.
                // Item Top-Left is (vX, vY).
                // PDF coordinates: X = width - vX. Y = vY.
                // Rot 180 object draws Left (-X) and Down (-Y) from anchor?
                // No, standard text draws +X relative to itself. Rot 180 makes it -X.
                // So anchor must be at Visual Left.
                // PDF X = Width - vX.
                // Anchor Y: Text Up is -Y. Visual Up is -Y (since Y goes 0->H).
                // Wait. Visual Up is towards 0. PDF Y decrease is towards 0.
                // So Text Up (-Y) points towards PDF Bottom (Visual Top).
                // So Anchor Y should be Visual Bottom?
                // Visual Bottom = vY + itemH.
                // PDF Y = vY + itemH.
                pX = width - vX;
                pY = vY + itemH;
            } else if (rotation === 270 || rotation === -90) {
                // 270 CW: Visual Top-Left -> PDF Top-Right (W, H).
                // Visual X -> PDF -Y.
                // Visual Y -> PDF -X.
                // pX = width - vY - itemH.
                // pY = height - vX.
                // This logic is tricky. Let's trust the 90 logic and invert?
                // Let's use the Visual mapping directly:
                // Visual (0,0) -> PDF (W, H).
                // Visual Right (+vX) -> PDF Down (-Y).
                // Visual Down (+vY) -> PDF Left (-X).
                // Anchor (Visual Bottom-Left of item):
                // Visual Bottom = vY + itemH.
                // Visual Left = vX.
                // PDF X = Width - Visual Bottom = width - (vY + itemH).
                // PDF Y = Height - Visual Left = height - vX.
                pX = width - (vY + itemH);
                pY = height - vX;
            }

            return { x: pX, y: pY, rotate: drawRotation };
        };

        // Determine "Block Origin" (Top-Left in Visual Pixels)
        let blockVX = 0;
        let blockVY = 0;

        if (isCustomPosition) {
            // Options are 0-1 relative to Visual Page
            blockVX = (options.position.x ?? 0) * visualPageWidth;
            blockVY = (options.position.y ?? 0) * visualPageHeight;
        } else {
            // Preset Logic using Pixels
            // Horizontal
            if (options.position.preset.includes('left')) {
                blockVX = margin;
            } else {
                blockVX = visualPageWidth - margin - mainBlockWidth;
            }
            // Vertical
            if (options.position.preset.includes('bottom')) {
                // Bottom of page minus total height
                blockVY = visualPageHeight - margin - presetTotalHeight;
            } else {
                blockVY = margin;
            }
        }

        // --- DRAWING STACK ---
        // We track `currentVY` which is the offset from `blockVY`
        let currentVY = 0;

        const drawItem = (type: 'image' | 'text', obj: any, w: number, h: number) => {
            const alignOffset = getAlignX(w);
            // Visual Top-Left of this item
            const itemVX = blockVX + alignOffset;
            const itemVY = blockVY + currentVY;

            const { x, y, rotate } = mapToPdfCoords(itemVX, itemVY, w, h);

            if (type === 'image') {
                page.drawImage(obj, {
                    x, y, width: w, height: h,
                    opacity: options.opacity,
                    rotate
                });
            } else {
                // For text, y is baseline. mapToPdfCoords gives bottom-left of bounding box.
                // Standard font: baseline is slightly above bottom.
                // pdf-lib drawText (x,y) is start of baseline.
                // We approximated itemH as fontSize * 1.2.
                // Center vertical: bottom + (height - size)/2 ?
                // Let's just use bottom + (0.2 * size) approximation for baseline.
                const baselineOffset = (h - obj.size) * 0.3; // tweak
                
                // We need to apply this offset in the "Visual Up" direction relative to PDF coords.
                // Simpler: Just rely on mapToPdfCoords putting us at bottom-left corner of the "line box".
                // Then adjust x/y based on rotation to move "Up" to baseline.
                
                let textX = x, textY = y;
                if (rotation === 0) textY += baselineOffset;
                else if (rotation === 90) textX -= baselineOffset;
                else if (rotation === 180) textY -= baselineOffset; // 180 up is down
                else if (rotation === 270) textX += baselineOffset;

                page.drawText(obj.text, {
                    x: textX, y: textY,
                    font: obj.font,
                    size: obj.size,
                    color: textColor,
                    opacity: options.opacity,
                    rotate
                });
            }
            // Advance stack
            currentVY += h + (type === 'text' ? 0 : gap); // Text lines advance by their height. Images add gap.
        };

        // 1. Logo
        if (logoImage && logoDims) {
            drawItem('image', logoImage, logoDims.width, logoDims.height);
        }

        // 2. Signature (Preset)
        if (!isCustomPosition && signatureImage && signatureDims) {
            drawItem('image', signatureImage, signatureDims.width, signatureDims.height);
        }

        // 3. Text Lines
        const drawTextLines = (lines: typeof stampLines) => {
            lines.forEach(line => {
                const font = line.weight === 'bold' ? helveticaBoldFont : helveticaFont;
                const w = font.widthOfTextAtSize(line.text, line.size);
                const h = line.size * lineSpacing;
                drawItem('text', { text: line.text, font, size: line.size }, w, h);
            });
        };
        
        drawTextLines(stampLines);
        
        if (dynamicLines.length > 0) {
            // Gap between static and dynamic text?
            // currentVY += gap; // Optional
            drawTextLines(dynamicLines);
        }

        // 4. QR Code
        if (qrImage && qrDims) {
            // Add gap before QR if there was text
            if (stampLines.length > 0 || dynamicLines.length > 0) currentVY += gap;
            drawItem('image', qrImage, qrDims.width, qrDims.height);
        }

        // --- Independent Signature (Custom Mode) ---
        if (isCustomPosition && signatureImage && signatureDims) {
            // Calc specific VXY
            const sigVX = (options.signaturePosition?.x ?? 0) * visualPageWidth;
            const sigVY = (options.signaturePosition?.y ?? 0) * visualPageHeight;
            
            const { x, y, rotate } = mapToPdfCoords(sigVX, sigVY, signatureDims.width, signatureDims.height);
            
            page.drawImage(signatureImage, {
                x, y, width: signatureDims.width, height: signatureDims.height,
                opacity: options.opacity,
                rotate
            });
        }
    }

    return await pdfDoc.save();
};
