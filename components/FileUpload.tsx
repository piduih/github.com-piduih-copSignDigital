import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
    onFilesSelect: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (files: FileList | null) => {
        if (files && files.length > 0) {
            const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
            if (pdfFiles.length > 0) {
                onFilesSelect(pdfFiles);
            } else {
                alert('Oops! Only PDF files work here.');
            }
        }
    };

    const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files);
    }, [onFilesSelect]);


    return (
        <div 
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`relative border-3 border-dashed rounded-3xl p-16 text-center transition-all duration-300 cursor-pointer group ${isDragging ? 'border-cyan-500 bg-cyan-50 scale-[1.02]' : 'border-slate-300 bg-slate-50 hover:border-cyan-400 hover:bg-slate-100'}`}
        >
            <input
                type="file"
                id="pdf-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => handleFileChange(e.target.files)}
                accept=".pdf"
                multiple
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className={`transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:-translate-y-2'}`}>
                    <UploadIcon />
                </div>
                <p className="mt-6 text-xl font-bold text-slate-700">
                    Drop your PDF file here
                </p>
                <p className="text-slate-400 mt-2 text-sm">
                    or click anywhere to find it on your computer
                </p>
            </div>
        </div>
    );
};

export default FileUpload;