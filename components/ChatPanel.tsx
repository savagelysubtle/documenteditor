
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { Icon } from './Icon';

interface ChatPanelProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const ChatMessageComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.sender === 'user';
    return (
        <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Icon name="sparkles" className="w-5 h-5 text-white" />
                </div>
            )}
            <div className={`p-3 rounded-lg max-w-sm md:max-w-md lg:max-w-lg ${isUser ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-[#2d2d30] text-gray-800 dark:text-gray-200'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
        </div>
    );
};

const LoadingIndicator: React.FC = () => (
    <div className="flex items-start gap-3 my-4">
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Icon name="sparkles" className="w-5 h-5 text-white" />
        </div>
        <div className="p-3 rounded-lg bg-gray-200 dark:bg-[#2d2d30] flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <span className="animate-pulse">●</span>
            <span className="animate-pulse delay-150">●</span>
            <span className="animate-pulse delay-300">●</span>
        </div>
    </div>
);


export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="w-full h-full bg-gray-100 dark:bg-[#252526] flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h2 className="text-sm font-bold tracking-wider uppercase">Gemini Assistant</h2>
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
                {messages.map((msg) => (
                    <ChatMessageComponent key={msg.id} message={msg} />
                ))}
                {isLoading && <LoadingIndicator />}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100 dark:bg-[#252526]">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Gemini anything..."
                        className="flex-grow bg-gray-200 dark:bg-[#3c3c3c] text-gray-800 dark:text-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <Icon name="send" className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};