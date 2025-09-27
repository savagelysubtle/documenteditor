
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Document, ChatMessage } from './types';
import { FileExplorer } from './components/FileExplorer';
import { EditorPanel } from './components/EditorPanel';
import { ChatPanel } from './components/ChatPanel';
import { getChatResponseStream } from './services/geminiService';
import { Icon } from './components/Icon';
import { SettingsModal } from './components/SettingsModal';

const MIN_PANEL_PERCENT = 0;
const MAX_PANEL_PERCENT = 40;
const SNAP_THRESHOLD_PERCENT = 4; // Percentage to snap closed
const DEFAULT_PANEL_PERCENT = 25;

const initialContent = 'Welcome to Gemini Doc IDE!\n\nUpload a text file to get started, or simply start typing here.\n\nUse the chat on the right to ask questions, summarize text, or improve your writing.';
const initialFile = new File([initialContent], 'welcome.txt', { type: 'text/plain' });
const initialUrl = URL.createObjectURL(initialFile);


const App = () => {
    const [documents, setDocuments] = useState<Document[]>([
        { id: '1', name: 'welcome.txt', content: initialContent, file: initialFile, url: initialUrl },
    ]);
    const [policyManuals, setPolicyManuals] = useState<Document[]>([]);

    const [activeDocumentId, setActiveDocumentId] = useState<string | null>('1');
    const [activeManualId, setActiveManualId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<{ id: string, type: 'document' | 'manual' } | null>({ id: '1', type: 'document' });

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: uuidv4(), sender: 'ai', text: 'Hello! How can I help you with your document today?' },
    ]);
    const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

    const [leftPanelWidth, setLeftPanelWidth] = useState(20);
    const [rightPanelWidth, setRightPanelWidth] = useState(25);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    const appRef = useRef<HTMLDivElement>(null);
    const isResizingRef = useRef<'left' | 'right' | null>(null);

    // Apply theme class to root element
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    // Revoke object URLs on component unmount to prevent memory leaks
    useEffect(() => {
        const allDocs = [...documents, ...policyManuals];
        return () => {
            allDocs.forEach(doc => URL.revokeObjectURL(doc.url));
        };
    }, [documents, policyManuals]);

    // The item currently displayed in the editor panel
    const itemInEditor = activeView?.type === 'document'
        ? documents.find(doc => doc.id === activeView.id)
        : policyManuals.find(man => man.id === activeView?.id);
    
    const itemInEditorWithType = itemInEditor && activeView ? { ...itemInEditor, type: activeView.type } : null;

    // Items used for providing context to the Gemini API
    const activeDocumentForContext = documents.find(doc => doc.id === activeDocumentId) || null;
    const activeManualForContext = policyManuals.find(man => man.id === activeManualId) || null;
    
    const processUploadedFile = (file: File, callback: (doc: Document) => void) => {
        const url = URL.createObjectURL(file);
        
        if (file.type.startsWith('text/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const newDoc: Document = { id: uuidv4(), name: file.name, content, file, url };
                callback(newDoc);
            };
            reader.readAsText(file);
        } else {
            // For binary files like PDFs
            const content = `[Preview for ${file.name}. This file is not editable.]`;
            const newDoc: Document = { id: uuidv4(), name: file.name, content, file, url };
            callback(newDoc);
        }
    };

    const handleUploadDocument = (file: File) => {
        processUploadedFile(file, (newDoc) => {
            setDocuments(prevDocs => [...prevDocs, newDoc]);
            setActiveDocumentId(newDoc.id);
            setActiveView({ id: newDoc.id, type: 'document' });
        });
    };

    const handleUploadManual = (file: File) => {
        processUploadedFile(file, (newManual) => {
            setPolicyManuals(prev => [...prev, newManual]);
            setActiveManualId(newManual.id); // Auto-select for context
            setActiveView({ id: newManual.id, type: 'manual' }); // Auto-view
        });
    };

    const handleSelectDocument = (id: string) => {
        setActiveDocumentId(id);
        setActiveView({ id, type: 'document' });
    };

    const handleSelectManual = (id: string) => {
        // This toggles the manual for context
        setActiveManualId(prevId => (prevId === id ? null : id));
        // This sets the manual for viewing
        setActiveView({ id, type: 'manual' });
    };

    const handleContentChange = (id: string, newContent: string) => {
        setDocuments(docs =>
            docs.map(doc => {
                if (doc.id === id) {
                    // Create a new File object and URL to reflect the changes
                    const newFile = new File([newContent], doc.name, { type: doc.file.type });
                    URL.revokeObjectURL(doc.url);
                    const newUrl = URL.createObjectURL(newFile);
                    return { ...doc, content: newContent, file: newFile, url: newUrl };
                }
                return doc;
            })
        );
    };
    
    const getContextForAi = (doc: Document | null): string => {
        if (!doc) return 'No document is currently selected.';
        if (doc.file.type.startsWith('text/')) {
            return doc.content;
        }
        return `[The selected file is a non-text document: '${doc.name}' of type '${doc.file.type}'. Its content cannot be read.]`;
    };

    const handleSendMessage = useCallback(async (message: string) => {
        if (!message.trim() || isAiLoading) return;

        const userMessage: ChatMessage = { id: uuidv4(), sender: 'user', text: message };
        setChatMessages(prev => [...prev, userMessage]);
        setIsAiLoading(true);

        const aiMessageId = uuidv4();
        const aiMessagePlaceholder: ChatMessage = { id: aiMessageId, sender: 'ai', text: '' };
        setChatMessages(prev => [...prev, aiMessagePlaceholder]);
        
        const documentContext = getContextForAi(activeDocumentForContext);
        const manualContext = getContextForAi(activeManualForContext);

        try {
            const stream = getChatResponseStream(
                message, 
                documentContext, 
                manualContext
            );
            for await (const chunk of stream) {
                setChatMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiMessageId ? { ...msg, text: msg.text + chunk } : msg
                    )
                );
            }
        } catch (error) {
            console.error('Error from Gemini API:', error);
            const errorMessage = 'Sorry, I encountered an error. Please try again.';
            setChatMessages(prev =>
                prev.map(msg =>
                    msg.id === aiMessageId ? { ...msg, text: errorMessage } : msg
                )
            );
        } finally {
            setIsAiLoading(false);
        }
    }, [activeDocumentForContext, activeManualForContext, isAiLoading]);

    // --- Resizing Logic ---
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizingRef.current || !appRef.current) return;
        
        const appRect = appRef.current.getBoundingClientRect();
        
        if (isResizingRef.current === 'left') {
            const newLeftWidth = ((e.clientX - appRect.left) / appRect.width) * 100;
            const remainingWidthForEditor = 100 - rightPanelWidth;
            const maxLeft = Math.min(MAX_PANEL_PERCENT, remainingWidthForEditor - 10); // Ensure editor is at least 10%
            
            if (newLeftWidth < SNAP_THRESHOLD_PERCENT) {
                 setLeftPanelWidth(MIN_PANEL_PERCENT);
            } else {
                 setLeftPanelWidth(Math.min(Math.max(newLeftWidth, MIN_PANEL_PERCENT), maxLeft));
            }

        } else if (isResizingRef.current === 'right') {
            const newRightWidth = ((appRect.right - e.clientX) / appRect.width) * 100;
            const remainingWidthForEditor = 100 - leftPanelWidth;
            const maxRight = Math.min(MAX_PANEL_PERCENT, remainingWidthForEditor - 10); // Ensure editor is at least 10%

            if (newRightWidth < SNAP_THRESHOLD_PERCENT) {
                setRightPanelWidth(MIN_PANEL_PERCENT);
            } else {
                setRightPanelWidth(Math.min(Math.max(newRightWidth, MIN_PANEL_PERCENT), maxRight));
            }
        }
    }, [leftPanelWidth, rightPanelWidth]);

    const handleMouseUp = useCallback(() => {
        isResizingRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, [handleMouseMove]);

    const handleMouseDown = useCallback((resizer: 'left' | 'right') => (e: React.MouseEvent) => {
        e.preventDefault();
        isResizingRef.current = resizer;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [handleMouseMove, handleMouseUp]);
    // --- End Resizing Logic ---
    
    const editorWidth = 100 - leftPanelWidth - rightPanelWidth;

    return (
        <div ref={appRef} className="relative flex h-screen bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-300 font-mono overflow-hidden">
            {/* Left Panel Toggle */}
            {leftPanelWidth === 0 && (
                <div className="absolute top-0 left-0 h-full flex items-center z-10">
                    <button
                        onClick={() => setLeftPanelWidth(DEFAULT_PANEL_PERCENT)}
                        className="h-10 w-6 bg-gray-700/80 hover:bg-indigo-500 rounded-r-md flex items-center justify-center transition-colors"
                        title="Open File Explorer"
                        aria-label="Open file explorer panel"
                    >
                        <Icon name="chevron-right" className="w-4 h-4 text-white" />
                    </button>
                </div>
            )}

            {/* Left Panel & Resizer */}
            {leftPanelWidth > 0 && (
                <>
                    <div style={{ width: `${leftPanelWidth}%` }} className="h-full">
                        <FileExplorer
                            documents={documents}
                            activeView={activeView}
                            onSelectDocument={handleSelectDocument}
                            onUploadDocument={handleUploadDocument}
                            policyManuals={policyManuals}
                            activeManualId={activeManualId}
                            onSelectManual={handleSelectManual}
                            onUploadManual={handleUploadManual}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                        />
                    </div>
                    <div
                        onMouseDown={handleMouseDown('left')}
                        className="w-1.5 h-full cursor-col-resize bg-gray-300 dark:bg-gray-700 hover:bg-indigo-500 transition-colors flex-shrink-0"
                        aria-label="Resize file explorer panel"
                        role="separator"
                    />
                </>
            )}
            
            {/* Center Panel (Editor) */}
            <div style={{ width: `${editorWidth}%` }} className="h-full flex flex-col">
                <EditorPanel
                    item={itemInEditorWithType}
                    onContentChange={handleContentChange}
                />
            </div>
            
             {/* Right Panel & Resizer */}
            {rightPanelWidth > 0 && (
                <>
                    <div
                        onMouseDown={handleMouseDown('right')}
                        className="w-1.5 h-full cursor-col-resize bg-gray-300 dark:bg-gray-700 hover:bg-indigo-500 transition-colors flex-shrink-0"
                        aria-label="Resize chat panel"
                        role="separator"
                    />
                    <div style={{ width: `${rightPanelWidth}%` }} className="h-full">
                        <ChatPanel
                            messages={chatMessages}
                            onSendMessage={handleSendMessage}
                            isLoading={isAiLoading}
                        />
                    </div>
                </>
            )}

            {/* Right Panel Toggle */}
            {rightPanelWidth === 0 && (
                 <div className="absolute top-0 right-0 h-full flex items-center z-10">
                    <button
                        onClick={() => setRightPanelWidth(DEFAULT_PANEL_PERCENT)}
                        className="h-10 w-6 bg-gray-700/80 hover:bg-indigo-500 rounded-l-md flex items-center justify-center transition-colors"
                        title="Open Gemini Assistant"
                        aria-label="Open chat panel"
                    >
                        <Icon name="chevron-left" className="w-4 h-4 text-white" />
                    </button>
                </div>
            )}

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentTheme={theme}
                onThemeChange={setTheme}
            />
        </div>
    );
};

export default App;