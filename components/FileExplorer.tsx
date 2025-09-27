
import React, { useRef } from 'react';
import type { Document } from '../types';
import { Icon } from './Icon';

interface FileExplorerProps {
    documents: Document[];
    activeView: { id: string, type: 'document' | 'manual' } | null;
    onSelectDocument: (id: string) => void;
    onUploadDocument: (file: File) => void;
    policyManuals: Document[];
    activeManualId: string | null;
    onSelectManual: (id: string) => void;
    onUploadManual: (file: File) => void;
    onOpenSettings: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
    documents,
    activeView,
    onSelectDocument,
    onUploadDocument,
    policyManuals,
    activeManualId,
    onSelectManual,
    onUploadManual,
    onOpenSettings
}) => {
    const docInputRef = useRef<HTMLInputElement>(null);
    const manualInputRef = useRef<HTMLInputElement>(null);

    const handleDocUploadClick = () => {
        docInputRef.current?.click();
    };
    
    const handleManualUploadClick = () => {
        manualInputRef.current?.click();
    };

    const handleDocFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onUploadDocument(file);
        }
        event.target.value = '';
    };

    const handleManualFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onUploadManual(file);
        }
        event.target.value = '';
    };

    return (
        <div className="w-full h-full bg-gray-100 dark:bg-[#252526] flex flex-col overflow-hidden">
            {/* Documents Section */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                <h2 className="text-sm font-bold tracking-wider uppercase">Explorer</h2>
                <button
                    onClick={handleDocUploadClick}
                    className="p-1 rounded-md text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                    title="Upload Document"
                >
                    <Icon name="upload" className="w-5 h-5" />
                </button>
                <input
                    type="file"
                    ref={docInputRef}
                    onChange={handleDocFileChange}
                    className="hidden"
                    accept=".txt,.md,.js,.ts,.py,.html,.css,.pdf"
                />
            </div>
            <ul className="flex-grow overflow-y-auto min-h-[100px]">
                {documents.map(doc => {
                    const isViewing = activeView?.type === 'document' && activeView.id === doc.id;
                    return (
                        <li key={doc.id}>
                            <button
                                onClick={() => onSelectDocument(doc.id)}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                                    isViewing
                                        ? 'bg-gray-300 dark:bg-[#37373d] text-gray-900 dark:text-white'
                                        : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <Icon name="file" className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                <span className="truncate">{doc.name}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            {/* Manuals Section */}
            <div className="p-3 border-b border-t border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                <h2 className="text-sm font-bold tracking-wider uppercase">Policy Manuals</h2>
                <button
                    onClick={handleManualUploadClick}
                    className="p-1 rounded-md text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                    title="Upload Manual"
                >
                    <Icon name="upload" className="w-5 h-5" />
                </button>
                <input
                    type="file"
                    ref={manualInputRef}
                    onChange={handleManualFileChange}
                    className="hidden"
                    accept=".txt,.md,.pdf"
                />
            </div>
            <ul className="flex-grow overflow-y-auto min-h-[100px]">
                 {policyManuals.map(manual => {
                    const isViewing = activeView?.type === 'manual' && activeView.id === manual.id;
                    const isContext = activeManualId === manual.id;
                    let bgClass = 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50';
                    let textClass = '';
                    if (isViewing) {
                        bgClass = 'bg-gray-300 dark:bg-[#37373d]';
                        textClass = 'text-gray-900 dark:text-white';
                    }
                    if (isContext) {
                        bgClass = 'bg-indigo-200 dark:bg-indigo-800/50';
                        textClass = 'text-indigo-900 dark:text-white';
                    }

                    return (
                        <li key={manual.id}>
                            <button
                                onClick={() => onSelectManual(manual.id)}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${bgClass} ${textClass}`}
                            >
                                <Icon name="book" className="w-4 h-4 text-indigo-500 dark:text-indigo-300 flex-shrink-0" />
                                <span className="truncate">{manual.name}</span>
                            </button>
                        </li>
                    );
                })}
                {policyManuals.length === 0 && (
                    <li className="px-4 py-2 text-xs text-gray-500 dark:text-gray-500 italic">
                        No manuals uploaded.
                    </li>
                )}
            </ul>
             {/* Settings Button */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                 <button
                    onClick={onOpenSettings}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                    title="Open Settings"
                >
                    <Icon name="gear" className="w-5 h-5" />
                    <span>Settings</span>
                </button>
            </div>
        </div>
    );
};