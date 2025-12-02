import React from 'react';
import { DocumentIcon } from './icons/DocumentIcon';
import { TrashIcon } from './icons/TrashIcon';

interface FileQueueProps {
    files: File[];
    onRemoveFile: (index: number) => void;
}

const FileQueue: React.FC<FileQueueProps> = ({ files, onRemoveFile }) => {
    return (
        <div className="w-full max-w-lg mx-auto border bg-slate-50 shadow-inner rounded-lg p-4">
            <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Files to be Stamped ({files.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {files.map((file, index) => (
                    <div 
                        key={`${file.name}-${index}`} 
                        className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-md animate-fade-in"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                             <DocumentIcon />
                            <span className="text-sm text-slate-800 truncate" title={file.name}>
                                {file.name}
                            </span>
                        </div>
                        <button
                            onClick={() => onRemoveFile(index)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-full"
                            aria-label={`Remove ${file.name}`}
                        >
                            <TrashIcon />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileQueue;