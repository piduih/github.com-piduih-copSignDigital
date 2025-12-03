
export interface CompanySettings {
    name: string;
    regNo: string;
    address: string;
    phone: string;
    logo?: string; // base64 string of the logo
    
    // AI Settings
    apiKey?: string; // The key for the selected provider
    aiProvider: 'gemini' | 'openai' | 'custom'; // The selected AI provider
    aiModel: string; // e.g., 'gemini-2.5-flash', 'gpt-4o', 'deepseek-chat'
    aiBaseUrl?: string; // Optional, for custom providers (e.g., http://localhost:11434/v1)

    // Signature Settings
    signatureType: 'image' | 'text';
    signature?: string; // base64 string of the signature (used if type is 'image')
    signatureText?: string; // The text to sign (used if type is 'text')
    signatureFont?: string; // The font family name (e.g., 'Great Vibes')
}

export type StampPositionPreset = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'custom';

export interface StampPosition {
    preset: StampPositionPreset;
    x?: number; // Relative coordinate (0 to 1)
    y?: number; // Relative coordinate (0 to 1)
}

export type StampPages = 'first' | 'last' | 'all' | 'custom';

export type StampAlignment = 'left' | 'center' | 'right';

export interface StampOptions {
    position: StampPosition;
    signaturePosition?: { x: number; y: number }; // Independent position for signature
    color: string; // hex color
    fontSize: number;
    pages: StampPages;
    pageRange: string; // e.g., "1-3, 5"
    opacity: number; // 0.0 to 1.0
    logoSize: number; // in points
    signatureSize: number; // in points
    includeLogo: boolean;
    includeSignature: boolean;
    alignment: StampAlignment;
    includeDate: boolean;
    includeFilename: boolean;
    includeQRCode: boolean;
    qrCodeData: string;
}
