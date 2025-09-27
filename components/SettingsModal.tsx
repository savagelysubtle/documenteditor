import React from 'react';
import { Icon } from './Icon';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: 'light' | 'dark';
    onThemeChange: (theme: 'light' | 'dark') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentTheme, onThemeChange }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-gray-200 dark:bg-[#252526] rounded-lg shadow-xl w-full max-w-md m-4 text-gray-800 dark:text-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-300 dark:border-gray-700">
                    <h2 className="text-lg font-semibold">Settings</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                        aria-label="Close settings"
                    >
                        <Icon name="close" className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-md font-medium mb-2">Theme</h3>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onThemeChange('light')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    currentTheme === 'light' 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                                }`}
                            >
                                Light
                            </button>
                            <button
                                onClick={() => onThemeChange('dark')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    currentTheme === 'dark' 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                                }`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>
                </div>

                 {/* Footer */}
                 <div className="flex justify-end p-4 border-t border-gray-300 dark:border-gray-700">
                     <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                     >
                        Done
                     </button>
                 </div>
            </div>
        </div>
    );
};
