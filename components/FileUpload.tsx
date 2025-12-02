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
                alert('Please select at least one PDF file.');
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
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${isDragging ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 bg-slate-50'}`}
        >
            <input
                type="file"
                id="pdf-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => handleFileChange(e.target.files)}
                accept=".pdf"
                multiple
            />
            <label htmlFor="pdf-upload" className="flex flex-col items-center justify-center cursor-pointer">
                <UploadIcon />
                <p className="mt-4 text-lg font-semibold text-slate-700">
                    Drag & Drop your PDF(s) here
                </p>
                <p className="text-slate-500">or click to browse</p>
            </label>
        </div>
    );
};

export default FileUpload;